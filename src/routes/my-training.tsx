import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CalendarDays, MapPin, User2, Award, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { downloadCertificate } from "@/lib/training-certificate";
import { lookupLearnerTrainings, type LearnerRegistration } from "@/lib/learner-portal.functions";
import { buildIcs, downloadIcs } from "@/lib/ics";

export const Route = createFileRoute("/my-training")({
  head: () => ({
    meta: [
      { title: "My Training — Registrations & Certificates" },
      {
        name: "description",
        content:
          "Check your Integrated Technics training registrations: pending requests, approved sessions and downloadable attendance certificates.",
      },
      { property: "og:title", content: "My Training — Integrated Technics" },
      { property: "og:description", content: "Track your training registrations and download your attendance certificates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyTrainingPage,
});

const STATUS: Record<string, { en: string; ar: string; cls: string }> = {
  pending: { en: "Pending approval", ar: "قيد المراجعة", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
  approved: { en: "Approved", ar: "معتمد", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" },
  rejected: { en: "Not accepted", ar: "غير مقبول", cls: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" },
  completed: { en: "Completed", ar: "مكتمل", cls: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300" },
};

function MyTrainingPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const L = (en: string, arabic: string) => (ar ? arabic : en);

  const lookup = useServerFn(lookupLearnerTrainings);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [rows, setRows] = useState<LearnerRegistration[] | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await lookup({ data: { email } });
      setRows(res);
      if (res.length === 0) toast.info(L("No registrations found for that email.", "لا توجد تسجيلات بهذا البريد."));
    } catch (err: any) {
      toast.error(err?.message ?? L("Lookup failed", "تعذّر البحث"));
    } finally {
      setLoading(false);
    }
  };

  const group = (s: string) => (rows ?? []).filter((r) => r.status === s);

  const card = (r: LearnerRegistration) => {
    const t = r.training;
    const title = (ar ? t?.title_ar : t?.title_en) || t?.title_en || t?.title_ar || L("Training", "تدريب");
    const st = STATUS[r.status] ?? STATUS["pending"]!;
    return (
      <Card key={r.id}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold">{title}</h3>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {t?.start_date && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(t.start_date).toLocaleDateString(ar ? "ar-EG" : "en-GB")}
                    {t.end_date && t.end_date !== t.start_date
                      ? ` – ${new Date(t.end_date).toLocaleDateString(ar ? "ar-EG" : "en-GB")}`
                      : ""}
                  </span>
                )}
                {t?.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {t.location}
                  </span>
                )}
                {t?.trainer && (
                  <span className="inline-flex items-center gap-1">
                    <User2 className="h-3.5 w-3.5" />
                    {t.trainer}
                  </span>
                )}
              </div>
            </div>
            <Badge variant="outline" className={st.cls}>
              {ar ? st.ar : st.en}
            </Badge>
          </div>

          {r.admin_note && <p className="text-sm bg-muted/50 rounded p-3">{r.admin_note}</p>}

          <div className="flex flex-wrap items-center gap-2">
            {r.status === "approved" && t?.start_date && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const ics = buildIcs({
                    uid: `training-${r.id}`,
                    title,
                    description: t.trainer ? `${L("Trainer", "المدرب")}: ${t.trainer}` : "",
                    location: t.location || "",
                    organizer: t.trainer || "Integrated Technics",
                    startDate: t.start_date!,
                    endDate: t.end_date,
                  });
                  downloadIcs(`${(t.title_en || t.title_ar || "training").replace(/[\s/]+/g, "-")}.ics`, ics);
                }}
              >
                <CalendarDays className="h-3.5 w-3.5 me-1" />
                {L("Add to calendar", "أضف إلى التقويم")}
              </Button>
            )}
            {r.status === "completed" && r.certificate_no && (
              <Button
                size="sm"
                onClick={() =>
                  downloadCertificate({
                    learnerName: name || email,
                    titleEn: t?.title_en ?? "",
                    titleAr: t?.title_ar ?? "",
                    trainer: t?.trainer ?? "",
                    location: t?.location ?? "",
                    startDate: t?.start_date ?? null,
                    endDate: t?.end_date ?? null,
                    completedAt: r.completed_at,
                    certificateNo: r.certificate_no!,
                  })
                }
              >
                <Award className="h-3.5 w-3.5 me-1" />
                {L("Download certificate", "تحميل الشهادة")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const section = (icon: React.ReactNode, titleEn: string, titleAr: string, items: LearnerRegistration[]) =>
    items.length === 0 ? null : (
      <div className="space-y-3">
        <h2 className="font-display text-lg inline-flex items-center gap-2">
          {icon}
          {L(titleEn, titleAr)}
          <Badge variant="outline">{items.length}</Badge>
        </h2>
        <div className="grid gap-3">{items.map(card)}</div>
      </div>
    );

  return (
    <div className="container py-10 md:py-14 space-y-8" dir={ar ? "rtl" : "ltr"}>
      <header className="space-y-2 max-w-2xl">
        <h1 className="font-display text-2xl md:text-3xl font-bold">{L("My training", "تدريباتي")}</h1>
        <p className="text-muted-foreground text-sm">
          {L(
            "Enter the email you registered with to see your pending requests, approved sessions and certificates.",
            "أدخل البريد الإلكتروني الذي سجّلت به لعرض طلباتك قيد المراجعة والجلسات المعتمدة والشهادات.",
          )}
        </p>
      </header>

      <form onSubmit={search} className="flex flex-wrap gap-2 max-w-xl">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={L("you@example.com", "بريدك الإلكتروني")}
          className="flex-1 min-w-[220px]"
          dir="ltr"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={L("Your full name (for certificates)", "اسمك الكامل (للشهادات)")}
          className="flex-1 min-w-[220px]"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 me-1" />}
          {L("Find my training", "ابحث")}
        </Button>
      </form>

      {rows && rows.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-3">
            <p>{L("Nothing registered with that email yet.", "لا توجد تسجيلات بهذا البريد حتى الآن.")}</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/training">{L("Browse training programs", "تصفح البرامج التدريبية")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {rows && rows.length > 0 && (
        <div className="space-y-8">
          {section(<Clock className="h-4 w-4 text-amber-500" />, "Pending approval", "قيد المراجعة", group("pending"))}
          {section(<CheckCircle2 className="h-4 w-4 text-emerald-500" />, "Approved sessions", "الجلسات المعتمدة", group("approved"))}
          {section(<Award className="h-4 w-4 text-sky-500" />, "Completed & certificates", "المكتملة والشهادات", group("completed"))}
          {section(<XCircle className="h-4 w-4 text-rose-500" />, "Not accepted", "غير مقبولة", group("rejected"))}
        </div>
      )}
    </div>
  );
}
