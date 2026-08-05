import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useRecommendations } from "@/lib/recommendations-store";
import { evaluateRules } from "@/lib/recommendation-engine";
import { QuestionField } from "@/components/recommendations/QuestionField";
import { SolutionCard } from "@/components/recommendations/SolutionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, ArrowLeft, ArrowRight, FileText, CheckCircle2, RefreshCcw, Send, Building2, CalendarClock, History, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BUSINESS_BENEFITS } from "@/data/recommendation-seed";
import type { Assessment, RecommendedSolution } from "@/lib/recommendation-types";

export const Route = createFileRoute("/dashboard/workspace/assessment")({
  head: () => ({ meta: [{ title: "Smart Assessment — Workspace" }, { name: "description", content: "Answer a few business questions and get tailored technology recommendations." }] }),
  component: AssessmentPage,
});

type Step = "pick" | "form" | "review" | "results";

function AssessmentPage() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const {
    businessTypes, sections, questions, solutions, rules, assessments,
    saveAssessment, removeAssessment, priorityForSolution,
  } = useRecommendations();

  const [step, setStep] = useState<Step>("pick");
  const [businessTypeKey, setBusinessTypeKey] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [results, setResults] = useState<RecommendedSolution[]>([]);
  const [consultOpen, setConsultOpen] = useState(false);
  const [consultDone, setConsultDone] = useState(false);
  const [consultForm, setConsultForm] = useState({ name: "", company: "", email: "", preferred: "" });
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());

  const activeBTs = useMemo(() => [...businessTypes].filter((b) => b.active).sort((a, b) => a.sort_order - b.sort_order), [businessTypes]);
  const chosenBT = activeBTs.find((b) => b.key === businessTypeKey);

  const visibleSections = useMemo(() => {
    return [...sections]
      .filter((s) => s.businessTypeId === "*" || s.businessTypeId === chosenBT?.id)
      .sort((a, b) => a.order - b.order);
  }, [sections, chosenBT]);

  const questionsBySection = useMemo(() => {
    const map = new Map<string, typeof questions>();
    for (const q of questions) {
      if (!q.enabled) continue;
      const arr = map.get(q.sectionId) ?? [];
      arr.push(q); map.set(q.sectionId, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [questions]);

  const solutionByKey = useMemo(() => new Map(solutions.map((s) => [s.key, s])), [solutions]);

  // Progress: enabled questions relevant to this business type
  const relevantQuestions = useMemo(() => {
    const sectionIds = new Set(visibleSections.map((s) => s.id));
    return questions.filter((q) => q.enabled && sectionIds.has(q.sectionId));
  }, [questions, visibleSections]);
  const answeredCount = useMemo(() => relevantQuestions.filter((q) => {
    const v = answers[q.key];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== "" && v !== null;
  }).length, [relevantQuestions, answers]);
  const totalCount = relevantQuestions.length;
  const remainingRequired = relevantQuestions.filter((q) => q.required && (answers[q.key] === undefined || answers[q.key] === "" || answers[q.key] === null)).length;
  const progressPct = totalCount === 0 ? 0 : Math.round((answeredCount / totalCount) * 100);

  function runEvaluation() {
    // required check
    const required = questions.filter((q) => q.enabled && q.required);
    const missing = new Set<string>();
    for (const q of required) {
      const v = answers[q.key];
      if (v === undefined || v === "" || v === null || (Array.isArray(v) && v.length === 0)) {
        missing.add(q.key);
      }
    }
    if (missing.size > 0) {
      setInvalidKeys(missing);
      setStep("form");
      toast.error(isAr ? `${missing.size} حقل مطلوب` : `${missing.size} required field(s) missing`);
      requestAnimationFrame(() => {
        const first = document.querySelector(`[data-question-key="${Array.from(missing)[0]}"]`);
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setInvalidKeys(new Set());
    const res = evaluateRules(rules, answers, businessTypeKey, priorityForSolution);
    setResults(res);
    setStep("results");
  }

  function reset() {
    setStep("pick"); setBusinessTypeKey(""); setAnswers({}); setResults([]); setProjectName(""); setClientName("");
    setConsultDone(false); setConsultForm({ name: "", company: "", email: "", preferred: "" });
  }

  function saveAndReturn() {
    if (!businessTypeKey) return;
    const a = saveAssessment({ businessTypeKey, projectName, clientName, answers, results });
    toast.success(isAr ? "تم حفظ التقييم" : "Assessment saved");
    return a;
  }

  function openConsultation() {
    setConsultForm((f) => ({
      ...f,
      name: f.name || clientName,
      company: f.company || clientName,
    }));
    setConsultDone(false);
    setConsultOpen(true);
  }
  function submitConsultation() {
    const { name, email, preferred } = consultForm;
    if (!name.trim()) return toast.error(isAr ? "الاسم مطلوب" : "Name is required");
    if (!email.includes("@")) return toast.error(isAr ? "بريد إلكتروني غير صالح" : "Invalid email");
    if (!preferred) return toast.error(isAr ? "اختر وقتاً مقترحاً" : "Choose a preferred time");
    saveAndReturn();
    setConsultDone(true);
  }

  function revisit(a: Assessment) {
    setBusinessTypeKey(a.businessTypeKey);
    setProjectName(a.projectName);
    setClientName(a.clientName);
    setAnswers(a.answers);
    setResults(a.results);
    setStep("results");
  }

  const solutionsList = solutions;

  return (
    <div dir={dir} className={`space-y-6 ${isAr ? "font-arabic" : ""}`}>
      <header className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{isAr ? "التقييم الذكي للحلول" : "Smart Solution Assessment"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "أجب عن أسئلة بسيطة عن مشروعك واحصل على توصيات تقنية مخصصة." : "Answer simple business questions and get tailored technology recommendations."}</p>
        </div>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {(["pick", "form", "review", "results"] as Step[]).map((s, i) => (
          <div key={s} className={`flex items-center gap-2 ${step === s ? "text-accent font-semibold" : ""}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center border ${step === s ? "border-accent bg-accent/10" : "bg-muted"}`}>{i + 1}</span>
            {s === "pick" && (isAr ? "نوع النشاط" : "Business type")}
            {s === "form" && (isAr ? "التقييم" : "Assessment")}
            {s === "review" && (isAr ? "المراجعة" : "Review")}
            {s === "results" && (isAr ? "التوصيات" : "Recommendations")}
            {i < 3 && <ArrowRight className={`h-3 w-3 ${isAr ? "rotate-180" : ""}`} />}
          </div>
        ))}
      </div>

      {step === "pick" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeBTs.map((b) => (
              <button key={b.id} type="button"
                onClick={() => { setBusinessTypeKey(b.key); setStep("form"); }}
                className="text-start bg-card border rounded-2xl p-4 hover:border-accent hover:shadow-md transition-all">
                <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-3">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="font-display font-bold">{isAr ? b.name_ar : b.name_en}</div>
                <div className="text-xs text-muted-foreground mt-1">{isAr ? "ابدأ التقييم" : "Start assessment"}</div>
              </button>
            ))}
          </div>
          <HistoryPanel
            isAr={isAr}
            assessments={assessments}
            businessTypes={businessTypes}
            onRevisit={revisit}
            onRemove={(id) => { removeAssessment(id); toast.success(isAr ? "تم الحذف" : "Deleted"); }}
          />
        </div>
      )}

      {step === "form" && chosenBT && (
        <div className="space-y-4">
          {/* Progress indicator */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="font-semibold">
                  {isAr ? `تم الإجابة على ${answeredCount} من ${totalCount}` : `Answered ${answeredCount} of ${totalCount}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {remainingRequired > 0
                    ? (isAr ? `${remainingRequired} إجباري متبقي` : `${remainingRequired} required left`)
                    : (isAr ? "جاهز للمراجعة" : "Ready to review")}
                </div>
              </div>
              <Progress value={progressPct} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{isAr ? "اسم المشروع" : "Project name"}</Label><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>{isAr ? "اسم العميل / الشركة" : "Client / company"}</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
            </CardContent>
          </Card>

          {visibleSections.map((sec) => {
            const qs = questionsBySection.get(sec.id) ?? [];
            if (qs.length === 0) return null;
            return (
              <Card key={sec.id}>
                <CardContent className="p-4 space-y-4">
                  <h2 className="font-display font-bold text-lg">{isAr ? sec.title_ar : sec.title_en}</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {qs.map((q) => (
                      <QuestionField key={q.id} q={q} value={answers[q.key]} invalid={invalidKeys.has(q.key)} onChange={(v) => { setAnswers((s) => ({ ...s, [q.key]: v })); if (invalidKeys.has(q.key)) setInvalidKeys((prev) => { const n = new Set(prev); n.delete(q.key); return n; }); }} lang={lang as any} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setStep("pick")}>
              <ArrowLeft className={`h-4 w-4 me-2 ${isAr ? "rotate-180" : ""}`} /> {isAr ? "رجوع" : "Back"}
            </Button>
            <Button onClick={() => {
              if (remainingRequired > 0) {
                const missing = new Set(relevantQuestions.filter((q) => q.required && (answers[q.key] === undefined || answers[q.key] === "" || answers[q.key] === null || (Array.isArray(answers[q.key]) && answers[q.key].length === 0))).map((q) => q.key));
                setInvalidKeys(missing);
                toast.error(isAr ? `${remainingRequired} إجباري متبقي` : `${remainingRequired} required questions left`);
                requestAnimationFrame(() => {
                  const first = document.querySelector(`[data-question-key="${Array.from(missing)[0]}"]`);
                  first?.scrollIntoView({ behavior: "smooth", block: "center" });
                });
                return;
              }
              setStep("review");
            }}>
              {isAr ? "مراجعة الإجابات" : "Review answers"} <ArrowRight className={`h-4 w-4 ms-2 ${isAr ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>
      )}

      {step === "review" && chosenBT && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="font-display font-bold text-lg">{isAr ? "ملخص إجاباتك" : "Summary of your answers"}</h2>
              <div className="text-sm text-muted-foreground">
                {isAr ? "راجع الإجابات قبل تشغيل محرك التوصيات." : "Review before running the recommendation engine."}
              </div>
              <div className="grid md:grid-cols-2 gap-3 pt-2">
                <Summary label={isAr ? "النشاط" : "Industry"} value={isAr ? chosenBT.name_ar : chosenBT.name_en} />
                <Summary label={isAr ? "المشروع" : "Project"} value={projectName || "—"} />
                <Summary label={isAr ? "العميل" : "Client"} value={clientName || "—"} />
                <Summary label={isAr ? "الأسئلة المُجابة" : "Answered"} value={`${answeredCount} / ${totalCount}`} />
              </div>
              <div className="border-t pt-3 space-y-2">
                {visibleSections.map((sec) => {
                  const qs = (questionsBySection.get(sec.id) ?? []).filter((q) => {
                    const v = answers[q.key];
                    return v !== undefined && v !== "" && v !== null && !(Array.isArray(v) && v.length === 0);
                  });
                  if (qs.length === 0) return null;
                  return (
                    <div key={sec.id}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        {isAr ? sec.title_ar : sec.title_en}
                      </div>
                      <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {qs.map((q) => {
                          const v = answers[q.key];
                          const opts = q.options ?? [];
                          const render = Array.isArray(v)
                            ? v.map((x) => opts.find((o) => o.value === x)?.[isAr ? "label_ar" : "label_en"] ?? String(x)).join(isAr ? "، " : ", ")
                            : opts.find((o) => o.value === v)?.[isAr ? "label_ar" : "label_en"] ?? (typeof v === "boolean" ? (v ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")) : String(v));
                          return (
                            <div key={q.id} className="flex justify-between gap-3 border-b border-border/40 py-1">
                              <dt className="text-muted-foreground truncate">{isAr ? q.label_ar : q.label_en}</dt>
                              <dd className="font-medium text-end">{render}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setStep("form")}>
              <ArrowLeft className={`h-4 w-4 me-2 ${isAr ? "rotate-180" : ""}`} /> {isAr ? "تعديل الإجابات" : "Edit answers"}
            </Button>
            <Button onClick={runEvaluation}>
              {isAr ? "احصل على التوصيات" : "Get recommendations"} <ArrowRight className={`h-4 w-4 ms-2 ${isAr ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 grid md:grid-cols-4 gap-3 text-sm">
              <Summary label={isAr ? "النشاط" : "Industry"} value={chosenBT ? (isAr ? chosenBT.name_ar : chosenBT.name_en) : businessTypeKey} />
              <Summary label={isAr ? "نوع المشروع" : "Project type"} value={String(answers.project_type ?? "—")} />
              <Summary label={isAr ? "المساحة (م²)" : "Area (sqm)"} value={String(answers.area_sqm ?? "—")} />
              <Summary label={isAr ? "المباني" : "Buildings"} value={String(answers.buildings ?? "—")} />
            </CardContent>
          </Card>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">{isAr ? "الحلول الموصى بها" : "Recommended solutions"}</h2>
            {results.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-sm text-muted-foreground text-center">
                {isAr ? "لا توجد توصيات لهذه الإجابات بعد. جرّب تعديل بعض الحقول." : "No recommendations for these answers yet. Try adjusting some fields."}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((r) => (
                  <SolutionCard key={r.solutionKey} rec={r} solution={solutionByKey.get(r.solutionKey)} lang={lang as any} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">{isAr ? "الفوائد المتوقعة" : "Expected business benefits"}</h2>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_BENEFITS.map((b) => (
                <span key={b.en} className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {isAr ? b.ar : b.en}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-4 border-t">
            <Button onClick={saveAndReturn}><FileText className="h-4 w-4 me-2" /> {isAr ? "حفظ التقييم" : "Save assessment"}</Button>
            <Button variant="secondary" onClick={openConsultation}><CalendarClock className="h-4 w-4 me-2" /> {isAr ? "حجز استشارة" : "Book consultation"}</Button>
            <Button variant="outline" asChild><Link to="/dashboard/workspace/new">{isAr ? "إنشاء طلب" : "Create inquiry"}</Link></Button>
            <Button variant="ghost" onClick={reset}><RefreshCcw className="h-4 w-4 me-2" /> {isAr ? "تقييم جديد" : "New assessment"}</Button>
          </div>
          {/* Suppress unused warning */}
          <div className="hidden">{solutionsList.length}</div>
        </div>
      )}

      {/* Book Consultation dialog */}
      <Dialog open={consultOpen} onOpenChange={(o) => { setConsultOpen(o); if (!o) setConsultDone(false); }}>
        <DialogContent dir={dir} className={isAr ? "font-arabic" : ""}>
          {!consultDone ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-accent" /> {isAr ? "حجز استشارة" : "Book consultation"}</DialogTitle>
                <DialogDescription>{isAr ? "أدخل بياناتك وسنعاود التواصل معك." : "Enter your details and our team will reach out."}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1.5"><Label>{isAr ? "الاسم" : "Full name"} *</Label>
                  <Input value={consultForm.name} onChange={(e) => setConsultForm({ ...consultForm, name: e.target.value })} dir={isAr ? "rtl" : "ltr"} /></div>
                <div className="space-y-1.5"><Label>{isAr ? "الشركة" : "Company"}</Label>
                  <Input value={consultForm.company} onChange={(e) => setConsultForm({ ...consultForm, company: e.target.value })} dir={isAr ? "rtl" : "ltr"} /></div>
                <div className="space-y-1.5"><Label>{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
                  <Input type="email" value={consultForm.email} onChange={(e) => setConsultForm({ ...consultForm, email: e.target.value })} dir="ltr" /></div>
                <div className="space-y-1.5"><Label>{isAr ? "الوقت المفضل" : "Preferred time"} *</Label>
                  <Input type="datetime-local" value={consultForm.preferred} onChange={(e) => setConsultForm({ ...consultForm, preferred: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConsultOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={submitConsultation}><Send className="h-4 w-4 me-2" /> {isAr ? "إرسال الطلب" : "Submit request"}</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center">{isAr ? "تم استلام طلبك" : "Request received"}</DialogTitle>
                <DialogDescription className="text-center">
                  {isAr
                    ? `شكراً ${consultForm.name}. سيتواصل معك فريقنا على ${consultForm.email} قريباً لتأكيد الموعد.`
                    : `Thanks ${consultForm.name}. Our team will contact you at ${consultForm.email} shortly to confirm your slot.`}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg bg-muted/50 border p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "الشركة" : "Company"}</span><span>{consultForm.company || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "الوقت المفضل" : "Preferred time"}</span><span>{new Date(consultForm.preferred).toLocaleString()}</span></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConsultOpen(false)}>{isAr ? "إغلاق" : "Close"}</Button>
                <Button onClick={() => { setConsultOpen(false); navigate({ to: "/dashboard/workspace" }); }}>{isAr ? "الذهاب إلى لوحتي" : "Go to workspace"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function HistoryPanel({
  isAr, assessments, businessTypes, onRevisit, onRemove,
}: {
  isAr: boolean;
  assessments: Assessment[];
  businessTypes: { key: string; name_en: string; name_ar: string }[];
  onRevisit: (a: Assessment) => void;
  onRemove: (id: string) => void;
}) {
  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <History className="h-6 w-6 mx-auto mb-2 opacity-60" />
          {isAr ? "لا توجد تقييمات محفوظة بعد. ابدأ تقييماً جديداً من الأعلى." : "No saved assessments yet. Start a new one above."}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-accent" />
          <div className="text-sm font-semibold">{isAr ? "سجل التقييمات المحفوظة" : "Saved assessment history"}</div>
          <span className="text-xs text-muted-foreground ms-auto">{assessments.length}</span>
        </div>
        <ul className="divide-y">
          {assessments.map((a) => {
            const bt = businessTypes.find((x) => x.key === a.businessTypeKey);
            return (
              <li key={a.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.projectName || (isAr ? "مشروع بدون اسم" : "Untitled project")}</div>
                  <div className="text-xs text-muted-foreground">
                    {bt ? (isAr ? bt.name_ar : bt.name_en) : a.businessTypeKey}
                    {a.clientName ? ` · ${a.clientName}` : ""} · {new Date(a.createdAt).toLocaleString()} · {a.results.length} {isAr ? "توصية" : "recs"}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => onRevisit(a)}>
                    <Eye className="h-3.5 w-3.5 me-1" /> {isAr ? "عرض" : "View"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onRemove(a.id)} aria-label="delete">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}