import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, ArrowLeft, Mail, Phone, ExternalLink, Linkedin, FileText, Clock, Pencil,
  Briefcase, MapPin, GraduationCap, Building, Globe, DollarSign, Calendar, Star, Languages, ShieldCheck, Award, User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { STATUS_LABEL, STATUS_COLOR, STATUS_PIPELINE, nextStatuses, type CareerStatus } from "@/lib/career-workflow";
import { useAdminT } from "@/lib/admin-i18n";
import { useCanAccess } from "@/lib/permissions-store";
import { AccessDenied } from "@/routes/dashboard.admin.careers";
import {
  getApplication,
  updateApplicationStatus,
  updateApplicationNotes,
  updateApplicationEvent,
} from "@/lib/admin-data.functions";

export const Route = createFileRoute("/dashboard/admin/careers/applications/$id")({
  component: AppDetail,
});

type AppFull = {
  id: string; ref: string; full_name: string; email: string; phone: string;
  cover_letter: string; resume_url: string; linkedin_url: string;
  status: CareerStatus; internal_notes: string; created_at: string; updated_at: string;
  job_id: string | null;
  career_jobs?: { title_en: string; title_ar: string; location_en: string } | null;
  years_experience: number | null;
  current_title: string | null;
  current_company: string | null;
  highest_education: string | null;
  university: string | null;
  nationality: string | null;
  country: string | null;
  city: string | null;
  gender: string | null;
  expected_salary: number | null;
  salary_currency: string | null;
  earliest_start_date: string | null;
  notice_period_days: number | null;
  source: string | null;
  portfolio_url: string | null;
  skills: string[] | null;
  languages: string[] | null;
  consent_processing: boolean | null;
};
type Event = { id: string; from_status: CareerStatus | null; to_status: CareerStatus; note: string; created_at: string };

function AppDetail() {
  const { t, lang } = useAdminT();
  const can = useCanAccess("careers_applications");
  const isAr = lang === "ar";
  const sLabel = (s: CareerStatus) => isAr ? STATUS_LABEL[s].ar : STATUS_LABEL[s].en;
  const { id } = Route.useParams();
  const [app, setApp] = useState<AppFull | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [transitionNote, setTransitionNote] = useState("");
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [editEventNote, setEditEventNote] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  const load = async () => {
    try {
      const { app: a, events: ev } = await getApplication({ data: { id } });
      setApp(a as any); setEvents((ev as Event[]) ?? []);
      setNotes((a as any)?.internal_notes ?? "");
    } catch (e: any) {
      toast.error(e?.message || "Failed to load application");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  const transition = async (to: CareerStatus) => {
    if (!app) return;
    setBusy(true);
    try {
      await updateApplicationStatus({ data: { id: app.id, from: app.status, to, note: transitionNote } });
      setTransitionNote("");
      toast.success(`${t("statusUpdated")}: ${sLabel(to)}`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async () => {
    if (!app) return;
    try {
      await updateApplicationNotes({ data: { id: app.id, notes } });
      toast.success("Notes saved");
    } catch (e: any) { toast.error(e?.message || "Failed to save notes"); }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;
  if (!can.view) return <AccessDenied what={isAr ? "طلبات التوظيف" : "career applicants"} />;
  if (!app) return <div className="text-center py-12 text-muted-foreground">Application not found.</div>;

  const allowed = can.edit ? nextStatuses(app.status) : [];
  const stepIdx = STATUS_PIPELINE.indexOf(app.status);

  const eventForStage = (s: CareerStatus): Event | undefined =>
    [...events].reverse().find(ev => ev.to_status === s);

  const openEditFor = (s: CareerStatus) => {
    if (!can.edit) return;
    const ev = eventForStage(s);
    if (!ev) return;
    setEditEvent(ev);
    setEditEventNote(ev.note ?? "");
    const d = new Date(ev.created_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    setEditEventDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const saveEvent = async () => {
    if (!editEvent) return;
    setSavingEvent(true);
    const iso = editEventDate ? new Date(editEventDate).toISOString() : editEvent.created_at;
    try {
      await updateApplicationEvent({ data: { id: editEvent.id, note: editEventNote, created_at: iso } });
      toast.success("Stage updated");
      setEditEvent(null);
      load();
    } catch (e: any) { toast.error(e?.message || "Failed to update stage"); }
    finally { setSavingEvent(false); }
  };

  const loc = [app.city, app.country].filter(Boolean).join(", ");
  const salary = app.expected_salary
    ? `${app.expected_salary.toLocaleString(isAr ? "ar-SA" : "en")}${app.salary_currency ? ` ${app.salary_currency}` : ""}`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="outline" size="sm"><Link to="/dashboard/admin/careers/applications"><ArrowLeft className="h-4 w-4 me-2" /> {t("back")}</Link></Button>
        <span className={`text-xs px-3 py-1 rounded-full border ${STATUS_COLOR[app.status]}`}>{sLabel(app.status)}</span>
      </div>

      {allowed.length > 0 && (
        <Card>
          <CardContent className="p-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium me-2">{t("quickActions")}:</span>
            {allowed.includes("offered") && (
              <Button size="sm" disabled={busy} onClick={() => transition("offered")}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("markAsOffered")}
              </Button>
            )}
            {allowed.includes("rejected") && (
              <Button size="sm" variant="destructive" disabled={busy} onClick={() => transition("rejected")}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("markAsRejected")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-1">
            {STATUS_PIPELINE.map((s, i) => {
              const reached = stepIdx >= i || app.status === "accepted";
              const isCurrent = app.status === s;
              const ev = eventForStage(s);
              const enteredAt = ev?.created_at;
              return (
                <div key={s} className="flex-1 flex items-center gap-1 min-w-0">
                  <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${reached ? "bg-accent text-accent-foreground border-accent" : "border-muted text-muted-foreground"} ${isCurrent ? "ring-2 ring-accent/40" : ""}`}>{i+1}</div>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs truncate inline-flex items-center gap-1">
                      {sLabel(s)}
                      {ev && can.edit && (
                        <button onClick={() => openEditFor(s)} title="Edit stage note & date" className="text-muted-foreground hover:text-accent">
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {enteredAt && <div className="text-[9px] text-muted-foreground truncate">{new Date(enteredAt).toLocaleDateString(isAr ? "ar" : "en")}</div>}
                    {ev?.note && <div className="text-[9px] text-muted-foreground truncate italic">"{ev.note}"</div>}
                  </div>
                  {i < STATUS_PIPELINE.length-1 && <div className={`flex-1 h-0.5 ${stepIdx > i ? "bg-accent" : "bg-muted"} mx-1`} />}
                </div>
              );
            })}
          </div>
          {(app.status === "rejected" || app.status === "withdrawn") && (
            <div className="mt-3 text-center text-xs text-muted-foreground">{t("finalState")} — <strong>{sLabel(app.status)}</strong></div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {/* Applicant Profile */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-lg">{app.full_name}</h2>
                  <div className="text-xs text-muted-foreground font-mono">{app.ref}</div>
                </div>
                <div className="text-xs text-muted-foreground">{t("appliedOn")}: {new Date(app.created_at).toLocaleString(isAr ? "ar" : "en")}</div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm pt-2 border-t">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /> <a className="hover:underline" href={`mailto:${app.email}`}>{app.email}</a></div>
                {app.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /> <a className="hover:underline" dir="ltr" href={`tel:${app.phone}`}>{app.phone}</a></div>}
                {app.resume_url && <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground shrink-0" /> <a className="hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={app.resume_url}>{t("resume")} <ExternalLink className="h-3 w-3" /></a></div>}
                {app.linkedin_url && <div className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-muted-foreground shrink-0" /> <a className="hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={app.linkedin_url}>{t("linkedin")} <ExternalLink className="h-3 w-3" /></a></div>}
                {app.portfolio_url && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground shrink-0" /> <a className="hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={app.portfolio_url}>{isAr ? "الملف الشخصي" : "Portfolio"} <ExternalLink className="h-3 w-3" /></a></div>}
                <div className="sm:col-span-2 flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{t("position")}:</span> {(isAr ? app.career_jobs?.title_ar : app.career_jobs?.title_en) || app.career_jobs?.title_en || "—"}</div>
              </div>

              {/* Professional Info */}
              <div className="grid sm:grid-cols-2 gap-3 text-sm pt-3 border-t">
                {app.years_experience != null && (
                  <div className="flex items-center gap-2"><Award className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "سنوات الخبرة" : "Experience"}:</span> {app.years_experience} {isAr ? "سنوات" : "years"}</div>
                )}
                {app.current_title && (
                  <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "المنصب الحالي" : "Current Title"}:</span> {app.current_title}</div>
                )}
                {app.current_company && (
                  <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "الشركة الحالية" : "Current Company"}:</span> {app.current_company}</div>
                )}
                {loc && (
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "الموقع" : "Location"}:</span> {loc}</div>
                )}
                {app.nationality && (
                  <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "الجنسية" : "Nationality"}:</span> {app.nationality}</div>
                )}
                {app.gender && (
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "الجنس" : "Gender"}:</span> {app.gender === 'male' ? (isAr ? 'ذكر' : 'Male') : app.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : app.gender}</div>
                )}
                {salary && (
                  <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "الراتب المتوقع" : "Expected Salary"}:</span> {salary}</div>
                )}
                {app.earliest_start_date && (
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "أقرب موعد للبدء" : "Earliest Start"}:</span> {new Date(app.earliest_start_date).toLocaleDateString(isAr ? "ar" : "en")}</div>
                )}
                {app.notice_period_days != null && (
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "فترة الإشعار" : "Notice Period"}:</span> {app.notice_period_days} {isAr ? "يوم" : "days"}</div>
                )}
                {app.source && (
                  <div className="flex items-center gap-2"><Star className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "مصدر الطلب" : "Source"}:</span> {app.source}</div>
                )}
              </div>

              {/* Education */}
              {(app.highest_education || app.university) && (
                <div className="grid sm:grid-cols-2 gap-3 text-sm pt-3 border-t">
                  {app.highest_education && (
                    <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "أعلى مؤهل علمي" : "Education"}:</span> {app.highest_education}</div>
                  )}
                  {app.university && (
                    <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground shrink-0" /> <span className="text-muted-foreground">{isAr ? "الجامعة" : "University"}:</span> {app.university}</div>
                  )}
                </div>
              )}

              {/* Skills & Languages */}
              {(app.skills?.length || app.languages?.length) && (
                <div className="grid sm:grid-cols-2 gap-3 text-sm pt-3 border-t">
                  {app.skills?.length ? (
                    <div className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">{isAr ? "المهارات" : "Skills"}:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.skills.map((s, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {app.languages?.length ? (
                    <div className="flex items-start gap-2">
                      <Languages className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">{isAr ? "اللغات" : "Languages"}:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.languages.map((l, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border">{l}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Consent */}
              {app.consent_processing != null && (
                <div className="flex items-center gap-2 text-sm pt-3 border-t">
                  <ShieldCheck className={`h-4 w-4 shrink-0 ${app.consent_processing ? "text-green-500" : "text-red-500"}`} />
                  <span className="text-muted-foreground">{isAr ? "الموافقة على معالجة البيانات" : "Data Processing Consent"}:</span>
                  <span className={app.consent_processing ? "text-green-600" : "text-red-600"}>{app.consent_processing ? (isAr ? "موافق" : "Granted") : (isAr ? "غير موافق" : "Not Granted")}</span>
                </div>
              )}

              {app.cover_letter && (
                <div className="pt-3 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{t("coverLetter")}</div>
                  <p className="text-sm whitespace-pre-wrap">{app.cover_letter}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">{t("internalNotes")}</h3>
              <Textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("internalNotes")} disabled={!can.edit} />
              {can.edit && <div className="flex justify-end"><Button size="sm" onClick={saveNotes}>{t("save")}</Button></div>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> {t("activityTimeline")}</h3>
              <ol className="space-y-3">
                {events.map(e => (
                  <li key={e.id} className="flex gap-3">
                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${STATUS_COLOR[e.to_status].split(" ")[0]}`} />
                    <div className="flex-1 text-sm">
                      <div>
                        {e.from_status ? <><span className="text-muted-foreground">{sLabel(e.from_status)}</span> → </> : null}
                        <span className="font-medium">{sLabel(e.to_status)}</span>
                      </div>
                      {e.note && <p className="text-xs text-muted-foreground mt-0.5">{e.note}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(e.created_at).toLocaleString(isAr ? "ar" : "en")}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-4 space-y-3 sticky top-28">
              <h3 className="font-semibold text-sm">{t("moveToStage")}</h3>
              {!can.edit ? (
                <p className="text-xs text-muted-foreground">
                  {isAr ? "ليست لديك صلاحية تغيير الحالة." : "You don't have permission to change statuses."}
                </p>
              ) : allowed.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("finalState")}</p>
              ) : (
                <>
                  <Textarea rows={2} value={transitionNote} onChange={e => setTransitionNote(e.target.value)} placeholder={t("transitionNote")} />
                  <div className="grid gap-2">
                    {allowed.map(s => (
                      <Button key={s} variant={s === "rejected" ? "destructive" : s === "withdrawn" ? "outline" : "default"} size="sm" disabled={busy} onClick={() => transition(s)}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `${isAr ? "تحديد كـ" : "Mark as"} ${sLabel(s)}`}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!editEvent} onOpenChange={(o) => !o && setEditEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("edit")} — {editEvent && sLabel(editEvent.to_status)}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>{t("date")}</Label>
              <Input type="datetime-local" value={editEventDate} onChange={ev => setEditEventDate(ev.target.value)} />
            </div>
            <div>
              <Label>{t("internalNotes")}</Label>
              <Textarea rows={4} value={editEventNote} onChange={ev => setEditEventNote(ev.target.value)} placeholder={t("transitionNote")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEvent(null)}>{t("cancel")}</Button>
            <Button onClick={saveEvent} disabled={savingEvent}>{savingEvent ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
