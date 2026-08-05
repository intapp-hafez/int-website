import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Briefcase, MapPin, CheckCircle2, Circle, XCircle } from "lucide-react";
import { trackApplication, type TrackedApplication } from "@/lib/career-track.functions";
import { STATUS_LABEL, STATUS_PIPELINE, type CareerStatus } from "@/lib/career-workflow";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/track-application")({
  head: () => ({
    meta: [
      { title: "Track your job application" },
      { name: "description", content: "Check the progress of your career application using your reference number." },
      { property: "og:title", content: "Track your job application" },
      { property: "og:description", content: "Check the progress of your career application using your reference number." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { ref?: string; email?: string } => ({
    ref: typeof s.ref === "string" ? s.ref : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  component: TrackApplicationPage,
});

function TrackApplicationPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const fn = useServerFn(trackApplication);
  const search = Route.useSearch();
  const [ref, setRef] = useState(search.ref ?? "");
  const [email, setEmail] = useState(search.email ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<TrackedApplication | null>(null);

  const runLookup = async (r: string, e?: string) => {
    setLoading(true); setError(null); setApp(null);
    try {
      setApp(await fn({ data: { ref: r.trim(), email: e?.trim() } }));
    } catch (err: any) {
      setError(err?.message ?? "Not found");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (search.ref) runLookup(search.ref, search.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: FormEvent) => { e.preventDefault(); runLookup(ref, email || undefined); };

  const closed = app && (app.status === "rejected" || app.status === "withdrawn");
  const currentIdx = app ? STATUS_PIPELINE.indexOf(app.status as CareerStatus) : -1;
  const fmt = (d: string) => new Date(d).toLocaleString(ar ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const label = (s: CareerStatus) => (ar ? STATUS_LABEL[s].ar : STATUS_LABEL[s].en);

  return (
    <main dir={ar ? "rtl" : "ltr"} className="container mx-auto max-w-3xl px-4 py-12 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">{ar ? "تتبع حالة طلب التوظيف" : "Track your application"}</h1>
        <p className="text-sm text-muted-foreground">
          {ar ? "أدخل رقم المرجع الذي استلمته بعد التقديم لعرض حالة طلبك." : "Enter the reference number you received after applying to view your progress."}
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label>{ar ? "رقم المرجع *" : "Reference number *"}</Label>
              <Input dir="ltr" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="APP-XXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</Label>
              <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading || !ref.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 me-1" />}
              {ar ? "بحث" : "Track"}
            </Button>
          </form>
          {error && <p role="alert" className="text-sm text-destructive mt-3">{ar ? "لم يتم العثور على طلب بهذا الرقم." : error}</p>}
        </CardContent>
      </Card>

      {app && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-3 text-base">
              <span>{app.full_name}</span>
              <span className="font-mono text-xs text-muted-foreground" dir="ltr">{app.ref}</span>
            </CardTitle>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-4 pt-1">
              <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{(ar ? app.job_title_ar : app.job_title_en) || "—"}</span>
              {app.job_location_en && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{app.job_location_en}</span>}
              <span dir="ltr">{app.email_masked}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-xs text-muted-foreground">
              {ar ? "آخر تحديث:" : "Last update:"} <span dir="ltr" className="font-medium">{fmt(app.updated_at || app.created_at)}</span>
            </div>

            <ol className="relative space-y-4 ps-6">
              <span className="absolute top-2 bottom-2 start-[7px] w-px bg-border" aria-hidden />
              {STATUS_PIPELINE.map((s, idx) => {
                const reached = !closed && currentIdx >= idx;
                const isCurrent = !closed && currentIdx === idx;
                return (
                  <li key={s} className="relative">
                    <span className="absolute -start-6 top-0.5">
                      {reached ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-muted-foreground/50" />}
                    </span>
                    <div className={`text-sm ${isCurrent ? "font-semibold" : reached ? "" : "text-muted-foreground"}`}>{label(s)}</div>
                    {isCurrent && <div className="text-xs text-muted-foreground">{ar ? "المرحلة الحالية" : "Current stage"}</div>}
                  </li>
                );
              })}
              {closed && (
                <li className="relative">
                  <span className="absolute -start-6 top-0.5"><XCircle className="h-4 w-4 text-destructive" /></span>
                  <div className="text-sm font-semibold">{label(app.status)}</div>
                </li>
              )}
            </ol>

            {app.events.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-medium">{ar ? "سجل التحديثات" : "Update history"}</h2>
                <ul className="space-y-2">
                  {app.events.map((ev) => (
                    <li key={ev.id} className="rounded-md border bg-card p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{label(ev.to_status)}</span>
                        <span className="text-xs text-muted-foreground" dir="ltr">{fmt(ev.created_at)}</span>
                      </div>
                      {ev.note && <p className="text-xs text-muted-foreground mt-1">{ev.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
