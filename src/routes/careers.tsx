import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Briefcase, Loader2, CheckCircle2, Calendar, Users, DollarSign, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { mockJobs } from "@/data/careers-mock";
import { toast } from "sonner";
import { z } from "zod";
import { sendApplicationConfirmation, sendApplicationSms } from "@/lib/career-track.functions";

export const Route = createFileRoute("/careers")({
  head: () => ({ meta: [
    { title: "Careers — Integrated Technics" },
    { name: "description", content: "Join a team of certified engineers building mission-critical systems across the region." },
  ]}),
  component: CareersPage,
});

type Job = {
  id: string;
  title_en: string; title_ar: string;
  location_en: string; location_ar: string;
  department_en: string; department_ar: string;
  description_en: string; description_ar: string;
  responsibilities_en: string; responsibilities_ar: string;
  requirements_en: string; requirements_ar: string;
  nice_to_have_en: string; nice_to_have_ar: string;
  benefits_en: string; benefits_ar: string;
  employment_type: "full_time" | "part_time" | "contract" | "internship";
  experience_level: "intern" | "junior" | "mid" | "senior" | "lead";
  remote_policy: "onsite" | "hybrid" | "remote";
  min_years_experience: number;
  openings: number;
  deadline: string | null;
  salary_min: number | null; salary_max: number | null; salary_currency: string;
  skills: string[];
};

const TYPE_LABEL: Record<string, { en: string; ar: string }> = {
  full_time: { en: "Full-time", ar: "دوام كامل" },
  part_time: { en: "Part-time", ar: "دوام جزئي" },
  contract: { en: "Contract", ar: "عقد" },
  internship: { en: "Internship", ar: "تدريب" },
};
const LEVEL_LABEL: Record<string, { en: string; ar: string }> = {
  intern: { en: "Intern", ar: "متدرب" }, junior: { en: "Junior", ar: "مبتدئ" },
  mid: { en: "Mid-level", ar: "متوسط" }, senior: { en: "Senior", ar: "خبير" }, lead: { en: "Lead", ar: "قيادي" },
};
const REMOTE_LABEL: Record<string, { en: string; ar: string }> = {
  onsite: { en: "On-site", ar: "حضوري" }, hybrid: { en: "Hybrid", ar: "هجين" }, remote: { en: "Remote", ar: "عن بُعد" },
};

function CareersPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Job | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let rows: any[] = [];
      try {
        const { data } = await supabase
          .from("career_jobs")
          .select("*")
          .eq("active", true)
          .order("sort_order", { ascending: true });
        rows = (data as any[]) ?? [];
      } catch {
        rows = [];
      }
      // Fall back to demo postings so the page is never empty.
      if (rows.length === 0) rows = mockJobs as any[];
      if (mounted) { setJobs(rows as Job[]); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <section className="gradient-surface relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="container mx-auto px-4 lg:px-8 py-24 relative">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">{ar ? "الوظائف" : "Careers"}</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{ar ? "ابنِ ما له معنى." : "Build what matters."}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {ar ? "انضم إلى فريق من المهندسين المعتمدين الذين يقدمون أنظمة معقدة لأكثر مؤسسات المنطقة تطلباً." : "Join a team of certified engineers delivering complex systems for the region's most demanding enterprises."}
          </p>
        </div>
      </section>
      <Section>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {ar ? "لا توجد وظائف مفتوحة حالياً. تابعنا قريباً." : "No open positions right now. Check back soon."}
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map(j => <JobCard key={j.id} job={j} ar={ar} onApply={() => setActive(j)} />)}
          </div>
        )}
      </Section>
      <ApplyDialog job={active} onClose={() => setActive(null)} ar={ar} />
    </div>
  );
}

function JobCard({ job: j, ar, onApply }: { job: Job; ar: boolean; onApply: () => void }) {
  const [open, setOpen] = useState(false);
  const title = ar ? j.title_ar || j.title_en : j.title_en;
  const loc = ar ? j.location_ar || j.location_en : j.location_en;
  const dept = ar ? j.department_ar || j.department_en : j.department_en;
  const desc = ar ? j.description_ar || j.description_en : j.description_en;
  const resp = ar ? j.responsibilities_ar || j.responsibilities_en : j.responsibilities_en;
  const req = ar ? j.requirements_ar || j.requirements_en : j.requirements_en;
  const nice = ar ? j.nice_to_have_ar || j.nice_to_have_en : j.nice_to_have_en;
  const ben = ar ? j.benefits_ar || j.benefits_en : j.benefits_en;
  const salary = j.salary_min || j.salary_max
    ? `${j.salary_min ?? "?"}–${j.salary_max ?? "?"} ${j.salary_currency}`
    : null;

  return (
    <div className="p-6 rounded-2xl border bg-card hover:border-accent transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent">{LEVEL_LABEL[j.experience_level]?.[ar ? "ar" : "en"]}</span>
            {dept && <span className="text-xs px-2 py-0.5 rounded bg-muted">{dept}</span>}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {loc && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{loc}</span>}
            <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />{TYPE_LABEL[j.employment_type]?.[ar ? "ar" : "en"]} · {REMOTE_LABEL[j.remote_policy]?.[ar ? "ar" : "en"]}</span>
            {j.min_years_experience > 0 && <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" />{j.min_years_experience}+ {ar ? "سنوات" : "yrs"}</span>}
            {j.openings > 1 && <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{j.openings} {ar ? "شواغر" : "openings"}</span>}
            {salary && <span className="inline-flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />{salary}</span>}
            {j.deadline && <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{ar ? "ينتهي" : "Closes"} {j.deadline}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(o => !o)}>{open ? (ar ? "إخفاء" : "Hide") : (ar ? "التفاصيل" : "Details")}</Button>
          <Button size="sm" onClick={onApply}>{ar ? "تقديم" : "Apply"}</Button>
        </div>
      </div>
      {open && (
        <div className="mt-5 pt-5 border-t grid gap-4 text-sm">
          {desc && <p className="text-muted-foreground whitespace-pre-line">{desc}</p>}
          {j.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {j.skills.map(s => <span key={s} className="text-xs px-2 py-0.5 rounded-full border bg-muted/40">{s}</span>)}
            </div>
          )}
          {resp && <Bulleted title={ar ? "المسؤوليات" : "Responsibilities"} text={resp} />}
          {req && <Bulleted title={ar ? "المتطلبات" : "Requirements"} text={req} />}
          {nice && <Bulleted title={ar ? "مرغوب فيه" : "Nice to have"} text={nice} />}
          {ben && <Bulleted title={ar ? "المزايا" : "Benefits"} text={ben} />}
        </div>
      )}
    </div>
  );
}

function Bulleted({ title, text }: { title: string; text: string }) {
  const items = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  return (
    <div>
      <div className="font-semibold mb-1.5">{title}</div>
      <ul className="list-disc ps-5 space-y-1 text-muted-foreground">
        {items.map((it, i) => <li key={i}>{it.replace(/^[-•]\s*/, "")}</li>)}
      </ul>
    </div>
  );
}

const applySchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(/^[0-9+\s\-()]{7,20}$/, "Invalid phone"),
  nationality: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  current_title: z.string().trim().max(120).optional().default(""),
  current_company: z.string().trim().max(120).optional().default(""),
  years_experience: z.number().int().min(0).max(60),
  highest_education: z.string().trim().min(2).max(120),
  university: z.string().trim().max(160).optional().default(""),
  expected_salary: z.number().min(0).max(10_000_000).optional().nullable(),
  salary_currency: z.string().trim().min(1).max(4).default("USD"),
  notice_period_days: z.number().int().min(0).max(365).optional().nullable(),
  earliest_start_date: z.string().optional().default(""),
  source: z.string().trim().max(80).optional().default(""),
  resume_url: z.string().trim().url().max(500),
  linkedin_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  portfolio_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  skills: z.string().trim().max(500).optional().default(""),
  languages: z.string().trim().max(200).optional().default(""),
  cover_letter: z.string().trim().min(50, "Please write at least 50 characters").max(3000),
  consent_processing: z.literal(true, { errorMap: () => ({ message: "Consent required" }) }),
});

const EDU_OPTIONS = [
  { v: "high_school", en: "High school", ar: "ثانوية عامة" },
  { v: "diploma", en: "Diploma", ar: "دبلوم" },
  { v: "bachelor", en: "Bachelor's", ar: "بكالوريوس" },
  { v: "master", en: "Master's", ar: "ماجستير" },
  { v: "phd", en: "PhD", ar: "دكتوراه" },
];
const SOURCE_OPTIONS = ["LinkedIn", "Company website", "Referral", "Job board", "Social media", "Other"];

function ApplyDialog({ job, onClose, ar }: { job: Job | null; onClose: () => void; ar: boolean }) {
  const initial = {
    full_name: "", email: "", phone: "",
    nationality: "", country: "", city: "",
    current_title: "", current_company: "",
    years_experience: 0, highest_education: "bachelor", university: "",
    expected_salary: null as number | null, salary_currency: "USD",
    notice_period_days: null as number | null, earliest_start_date: "",
    source: "", resume_url: "", linkedin_url: "", portfolio_url: "",
    skills: "", languages: "", cover_letter: "", consent_processing: false,
  };
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => { if (job) { setForm(initial); setDone(null); } /* eslint-disable-next-line */ }, [job]);

  const update = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    const parsed = applySchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(`${first.path.join(".")}: ${first.message}`);
      return;
    }
    setSubmitting(true);
    const d = parsed.data;
    const isDemo = !!job?.id?.startsWith("mock-");
    if (isDemo) {
      // Demo posting: no database row to attach to, acknowledge locally.
      await new Promise(r => setTimeout(r, 600));
      setSubmitting(false);
      setDone(`DEMO-${Date.now().toString(36).toUpperCase().slice(-6)}`);
      return;
    }
    const payload = {
      job_id: job?.id,
      full_name: d.full_name, email: d.email, phone: d.phone,
      nationality: d.nationality, country: d.country, city: d.city,
      current_title: d.current_title, current_company: d.current_company,
      years_experience: d.years_experience,
      highest_education: d.highest_education, university: d.university,
      expected_salary: d.expected_salary, salary_currency: d.salary_currency,
      notice_period_days: d.notice_period_days,
      earliest_start_date: d.earliest_start_date || null,
      source: d.source,
      resume_url: d.resume_url, linkedin_url: d.linkedin_url || "", portfolio_url: d.portfolio_url || "",
      skills: d.skills ? d.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      languages: d.languages ? d.languages.split(",").map(s => s.trim()).filter(Boolean) : [],
      cover_letter: d.cover_letter,
      consent_processing: d.consent_processing,
    };
    const { data, error } = await supabase.from("career_applications").insert(payload as any).select("ref").single();
    setSubmitting(false);
    if (error) { toast.error(ar ? "تعذر إرسال الطلب" : "Could not submit"); return; }
    setDone(data?.ref ?? null);
    if (data?.ref) {
      try {
        await sendApplicationConfirmation({ data: { ref: data.ref, origin: window.location.origin } });
      } catch { /* confirmation email is best-effort */ }
      try {
        await sendApplicationSms({ data: { ref: data.ref, origin: window.location.origin } });
      } catch { /* SMS / WhatsApp receipt is best-effort */ }
    }
  };

  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{done ? (ar ? "تم استلام طلبك" : "Application received") : (ar ? `التقديم على: ${job ? (job.title_ar || job.title_en) : ""}` : `Apply: ${job?.title_en ?? ""}`)}</DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <p className="text-sm">{ar ? "شكراً لك. سيقوم فريقنا بمراجعة طلبك والتواصل معك قريباً." : "Thanks. Our team will review your application and reach out shortly."}</p>
            <p className="text-xs text-muted-foreground">{ar ? "رقم المرجع:" : "Reference:"} <span className="font-mono">{done}</span></p>
            <p className="text-xs text-muted-foreground">{ar ? "أرسلنا تأكيداً بالبريد الإلكتروني ورسالة نصية / واتساب تحتوي على رقم المرجع ورابط التتبع." : "We sent a confirmation by email and an SMS / WhatsApp message with this reference number and tracking link."}</p>
            {!done.startsWith("DEMO-") && (
              <Button asChild variant="outline" className="w-full">
                <Link to="/track-application" search={{ ref: done, email: form.email }}>
                  {ar ? "تتبع حالة طلبي" : "Track my application"}
                </Link>
              </Button>
            )}
            <Button onClick={onClose} className="w-full">{ar ? "إغلاق" : "Close"}</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <Fieldset title={ar ? "المعلومات الشخصية" : "Personal information"}>
              <Field label={ar ? "الاسم الكامل *" : "Full name *"}><Input value={form.full_name} onChange={e => update("full_name", e.target.value)} /></Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label={ar ? "البريد الإلكتروني *" : "Email *"}><Input dir="ltr" type="email" value={form.email} onChange={e => update("email", e.target.value)} /></Field>
                <Field label={ar ? "الهاتف *" : "Phone *"}><Input dir="ltr" value={form.phone} onChange={e => update("phone", e.target.value)} /></Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label={ar ? "الجنسية *" : "Nationality *"}><Input value={form.nationality} onChange={e => update("nationality", e.target.value)} /></Field>
                <Field label={ar ? "الدولة *" : "Country *"}><Input value={form.country} onChange={e => update("country", e.target.value)} /></Field>
                <Field label={ar ? "المدينة *" : "City *"}><Input value={form.city} onChange={e => update("city", e.target.value)} /></Field>
              </div>
            </Fieldset>

            <Fieldset title={ar ? "الخبرة المهنية" : "Professional experience"}>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label={ar ? "المسمى الوظيفي الحالي" : "Current job title"}><Input value={form.current_title} onChange={e => update("current_title", e.target.value)} /></Field>
                <Field label={ar ? "الشركة الحالية" : "Current company"}><Input value={form.current_company} onChange={e => update("current_company", e.target.value)} /></Field>
                <Field label={ar ? "سنوات الخبرة *" : "Years of experience *"}><Input type="number" min={0} max={60} value={form.years_experience} onChange={e => update("years_experience", Number(e.target.value)||0)} /></Field>
                <Field label={ar ? "مدة الإشعار (أيام)" : "Notice period (days)"}><Input type="number" min={0} value={form.notice_period_days ?? ""} onChange={e => update("notice_period_days", e.target.value ? Number(e.target.value) : null)} /></Field>
              </div>
            </Fieldset>

            <Fieldset title={ar ? "التعليم" : "Education"}>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label={ar ? "أعلى مؤهل *" : "Highest education *"}>
                  <Select value={form.highest_education} onValueChange={v => update("highest_education", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EDU_OPTIONS.map(o => <SelectItem key={o.v} value={o.v}>{ar ? o.ar : o.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={ar ? "الجامعة / المؤسسة" : "University / institution"}><Input value={form.university} onChange={e => update("university", e.target.value)} /></Field>
              </div>
            </Fieldset>

            <Fieldset title={ar ? "التوفر والراتب" : "Availability & compensation"}>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label={ar ? "الراتب المتوقع" : "Expected salary"}><Input type="number" min={0} value={form.expected_salary ?? ""} onChange={e => update("expected_salary", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label={ar ? "العملة" : "Currency"}><Input maxLength={4} value={form.salary_currency} onChange={e => update("salary_currency", e.target.value.toUpperCase())} /></Field>
                <Field label={ar ? "أقرب تاريخ للبدء" : "Earliest start"}><Input type="date" value={form.earliest_start_date} onChange={e => update("earliest_start_date", e.target.value)} /></Field>
              </div>
            </Fieldset>

            <Fieldset title={ar ? "الروابط والمهارات" : "Links & skills"}>
              <Field label={ar ? "رابط السيرة الذاتية *" : "Resume URL *"}><Input dir="ltr" placeholder="https://" value={form.resume_url} onChange={e => update("resume_url", e.target.value)} /></Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label={ar ? "لينكدإن" : "LinkedIn"}><Input dir="ltr" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={e => update("linkedin_url", e.target.value)} /></Field>
                <Field label={ar ? "معرض الأعمال" : "Portfolio"}><Input dir="ltr" placeholder="https://" value={form.portfolio_url} onChange={e => update("portfolio_url", e.target.value)} /></Field>
              </div>
              <Field label={ar ? "المهارات (مفصولة بفواصل)" : "Skills (comma-separated)"}><Input placeholder="React, Node.js, SQL" value={form.skills} onChange={e => update("skills", e.target.value)} /></Field>
              <Field label={ar ? "اللغات" : "Languages"}><Input placeholder={ar ? "العربية, الإنجليزية" : "English, Arabic"} value={form.languages} onChange={e => update("languages", e.target.value)} /></Field>
            </Fieldset>

            <Fieldset title={ar ? "معلومات إضافية" : "Additional info"}>
              <Field label={ar ? "كيف سمعت عنا؟" : "How did you hear about us?"}>
                <Select value={form.source} onValueChange={v => update("source", v)}>
                  <SelectTrigger><SelectValue placeholder={ar ? "اختر" : "Select"} /></SelectTrigger>
                  <SelectContent>{SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={ar ? "خطاب التقديم *" : "Cover letter *"}>
                <Textarea rows={5} placeholder={ar ? "أخبرنا عن نفسك ولماذا أنت مناسب لهذه الوظيفة..." : "Tell us about yourself and why you're a fit..."} value={form.cover_letter} onChange={e => update("cover_letter", e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">{form.cover_letter.length}/3000</p>
              </Field>
            </Fieldset>

            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={form.consent_processing} onCheckedChange={(v) => update("consent_processing", !!v)} className="mt-0.5" />
              <span>{ar ? "أوافق على معالجة بياناتي الشخصية لأغراض التوظيف وفقاً لسياسة الخصوصية." : "I consent to my personal data being processed for recruitment purposes per the privacy policy."}</span>
            </label>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={submit} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (ar ? "إرسال الطلب" : "Submit application")}</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block">{label}</Label>{children}</div>;
}
