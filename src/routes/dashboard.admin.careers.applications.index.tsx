import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Mail, Phone, X, Briefcase, MapPin, FileSpreadsheet, FileText, FileDown, Upload } from "lucide-react";
import {
  listApplications,
  listApplicationsFull,
  listApplicationsReport,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  bulkUpdateApplicationsByRef,
} from "@/lib/admin-data.functions";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { buildApplicantCsv, openApplicantReportPdf } from "@/lib/applicant-report";
import { Star } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { STATUS_LABEL, STATUS_COLOR, STATUS_ALL, STATUS_PIPELINE, type CareerStatus } from "@/lib/career-workflow";
import { useAdminT } from "@/lib/admin-i18n";
import { Label } from "@/components/ui/label";
import { useCanAccess } from "@/lib/permissions-store";
import { AccessDenied } from "@/routes/dashboard.admin.careers";

export const Route = createFileRoute("/dashboard/admin/careers/applications/")({
  validateSearch: (search: Record<string, unknown>): { job?: string } => ({
    job: typeof search.job === "string" ? search.job : undefined,
  }),
  component: ApplicationsList,
});

type App = {

  id: string; ref: string; full_name: string; email: string; phone: string;
  status: CareerStatus; created_at: string;
  job_id: string | null;
  years_experience?: number | null;
  city?: string | null;
  country?: string | null;
  career_jobs?: { title_en: string } | null;
};

function ApplicationsList() {
  const { t, lang } = useAdminT();
  const can = useCanAccess("careers_applications");
  const search = useSearch({ from: "/dashboard/admin/careers/applications/" }) as any;
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<CareerStatus | "all">("all");
  const [jobFilter, setJobFilter] = useState<string>((search as any)?.job ?? "all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [view, setView] = useState<"board" | "list">("board");
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [reporting, setReporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ updated: any[]; skipped: any[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      if (!can.view) { setLoading(false); return; }
      try {
        const data = await listApplications();
        setApps((data as any) ?? []);
      } catch { setApps([]); }
      finally { setLoading(false); }
    })();
  }, [can.view]);

  const jobs = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of apps) {
      if (a.job_id && a.career_jobs?.title_en) map.set(a.job_id, a.career_jobs.title_en);
    }
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [apps]);

  const filtered = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(dateTo).getTime() + 86_400_000 : null;
    return apps.filter(a => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (jobFilter !== "all" && a.job_id !== jobFilter) return false;
      const ts = new Date(a.created_at).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts >= toTs) return false;
      if (q.trim()) {
        const hay = [a.full_name, a.email, a.ref, a.career_jobs?.title_en].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [apps, q, statusFilter, jobFilter, dateFrom, dateTo]);

  const hasFilters = statusFilter !== "all" || jobFilter !== "all" || !!dateFrom || !!dateTo || !!q.trim();
  const clearAll = () => { setStatusFilter("all"); setJobFilter("all"); setDateFrom(""); setDateTo(""); setQ(""); };

  const toggleOne = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const allFilteredSelected = filtered.length > 0 && filtered.every(a => selected.includes(a.id));
  const toggleAllFiltered = () =>
    setSelected(allFilteredSelected ? [] : filtered.map(a => a.id));

  const bulkStatus = async (to: string) => {
    const ids = [...selected];
    try {
      await bulkUpdateApplicationStatus({ data: { ids, to } });
      setApps(prev => prev.map(x => (ids.includes(x.id) ? { ...x, status: to as CareerStatus } : x)));
      setSelected([]);
      toast.success(lang === "ar" ? `تم تحديث ${ids.length} طلب` : `${ids.length} application(s) updated`);
    } catch {
      toast.error(lang === "ar" ? "تعذر التحديث" : "Could not update");
    }
  };

  const downloadTemplate = () => {
    const sample = filtered.slice(0, 5).map(a => `${a.ref},shortlisted,`).join("\n");
    const csv = `ref,status,note\n${sample || "REF-123456,shortlisted,Moved from CSV"}\n`;
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-status-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onUploadCsv = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const rows = parseStatusCsv(await file.text());
      if (!rows.length) {
        toast.error(lang === "ar" ? "لم يتم العثور على صفوف صالحة" : "No valid rows found");
        return;
      }
      const res = await bulkUpdateApplicationsByRef({ data: { rows } }) as any;
      setUploadResult(res);
      const map = new Map<string, string>(res.updated.map((u: any) => [String(u.ref).toUpperCase(), u.to]));
      setApps(prev => prev.map(a => {
        const to = map.get(String(a.ref).toUpperCase());
        return to ? { ...a, status: to as CareerStatus } : a;
      }));
      toast.success(
        lang === "ar"
          ? `تم تحديث ${res.updated.length} — تم تخطي ${res.skipped.length}`
          : `${res.updated.length} updated — ${res.skipped.length} skipped`
      );
    } catch (e: any) {
      toast.error(e?.message || (lang === "ar" ? "تعذر معالجة الملف" : "Could not process the file"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadReport = async (kind: "csv" | "pdf") => {
    setReporting(true);
    try {
      const ids = selected.length ? selected : filtered.map(a => a.id);
      const { apps: rows, events } = await listApplicationsReport({ data: { ids } }) as any;
      if (kind === "csv") {
        const csv = buildApplicantCsv(rows, events);
        const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `applicants-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        openApplicantReportPdf(rows, events);
      }
    } catch {
      toast.error(lang === "ar" ? "تعذر إنشاء التقرير" : "Could not build the report");
    } finally {
      setReporting(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const full = await listApplicationsFull() as any[];
      const ids = new Set(filtered.map(a => a.id));
      const rows = full.filter(r => ids.has(r.id)).map(r => ({
        Ref: r.ref ?? "",
        "Full Name": r.full_name ?? "",
        Email: r.email ?? "",
        Phone: r.phone ?? "",
        Status: r.status ?? "",
        Job: r.career_jobs?.title_en ?? "",
        "Job Location": r.career_jobs?.location_en ?? "",
        Gender: r.gender ?? "",
        "Date of Birth": r.date_of_birth ?? "",
        Nationality: r.nationality ?? "",
        City: r.city ?? "",
        Country: r.country ?? "",
        Address: r.address ?? "",
        "Years Experience": r.years_experience ?? "",
        "Current Title": r.current_title ?? "",
        "Current Company": r.current_company ?? "",
        "Highest Education": r.highest_education ?? "",
        University: r.university ?? "",
        "Field of Study": r.field_of_study ?? "",
        "Graduation Year": r.graduation_year ?? "",
        "Expected Salary": r.expected_salary ?? "",
        Currency: r.salary_currency ?? "",
        "Notice Period (days)": r.notice_period_days ?? "",
        Availability: r.availability ?? "",
        Skills: Array.isArray(r.skills) ? r.skills.join(", ") : (r.skills ?? ""),
        Languages: Array.isArray(r.languages) ? r.languages.join(", ") : (r.languages ?? ""),
        LinkedIn: r.linkedin_url ?? "",
        Portfolio: r.portfolio_url ?? "",
        "GitHub": r.github_url ?? "",
        "Resume URL": r.resume_url ?? "",
        "Cover Letter": r.cover_letter ?? "",
        "Referral Source": r.referral_source ?? "",
        "Consent Processing": r.consent_processing ? "Yes" : "No",
        "Internal Notes": r.internal_notes ?? "",
        "Created At": r.created_at ?? "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Applications");
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      XLSX.writeFile(wb, `applications-${ts}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length };
    for (const s of STATUS_ALL) c[s] = apps.filter(a => a.status === s).length;
    return c;
  }, [apps]);

  if (!can.view) return <AccessDenied what={lang === "ar" ? "طلبات التوظيف" : "career applicants"} />;

  if (loading) return <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;

  const statusLabel = (s: CareerStatus) => lang === "ar" ? STATUS_LABEL[s].ar : STATUS_LABEL[s].en;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Label className="text-[10px] uppercase text-muted-foreground">{t("search")}</Label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t("search")} className="ps-9" />
          </div>
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground">{t("status")}</Label>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")} ({counts.all})</SelectItem>
              {STATUS_ALL.map(s => <SelectItem key={s} value={s}>{statusLabel(s)} ({counts[s] || 0})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground">{t("job")}</Label>
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allJobs")}</SelectItem>
              {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground">{t("from")}</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[150px]" />
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground">{t("to")}</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[150px]" />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}><X className="h-3 w-3 me-1" /> {t("clearFilters")}</Button>
        )}
        <Button variant="outline" size="sm" onClick={exportExcel} disabled={exporting || filtered.length === 0}>
          {exporting ? <Loader2 className="h-3 w-3 me-1 animate-spin" /> : <FileSpreadsheet className="h-3 w-3 me-1" />}
          {lang === "ar" ? "تصدير إلى Excel" : "Export to Excel"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadReport("csv")} disabled={reporting || filtered.length === 0}>
          {reporting ? <Loader2 className="h-3 w-3 me-1 animate-spin" /> : <FileDown className="h-3 w-3 me-1" />}
          {lang === "ar" ? "تقرير CSV" : "Report CSV"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadReport("pdf")} disabled={reporting || filtered.length === 0}>
          {reporting ? <Loader2 className="h-3 w-3 me-1 animate-spin" /> : <FileText className="h-3 w-3 me-1" />}
          {lang === "ar" ? "تقرير PDF" : "Report PDF"}
        </Button>
        {can.edit && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onUploadCsv(f); }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3 w-3 me-1 animate-spin" /> : <Upload className="h-3 w-3 me-1" />}
              {lang === "ar" ? "رفع CSV للتحديث الجماعي" : "Bulk update via CSV"}
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}>
              {lang === "ar" ? "نموذج CSV" : "CSV template"}
            </Button>
          </>
        )}
        <div className="inline-flex rounded-md border bg-card p-0.5 ms-auto text-sm">
          <button onClick={() => setView("board")} className={`px-3 py-1 rounded ${view === "board" ? "bg-accent/10 text-accent" : "text-muted-foreground"}`}>{t("board")}</button>
          <button onClick={() => setView("list")} className={`px-3 py-1 rounded ${view === "list" ? "bg-accent/10 text-accent" : "text-muted-foreground"}`}>{t("list")}</button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{t("showing")} {filtered.length} {t("of")} {apps.length}</div>

      {uploadResult && (
        <Card>
          <CardContent className="py-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                {lang === "ar" ? "نتيجة التحديث الجماعي" : "Bulk update result"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setUploadResult(null)}><X className="h-3 w-3" /></Button>
            </div>
            <div className="text-emerald-600">
              {lang === "ar" ? "تم التحديث" : "Updated"}: {uploadResult.updated.length}
              {uploadResult.updated.length > 0 && (
                <span className="text-muted-foreground"> — {uploadResult.updated.map((u: any) => `${u.ref} → ${u.to}`).join(", ")}</span>
              )}
            </div>
            {uploadResult.skipped.length > 0 && (
              <div className="text-amber-600">
                {lang === "ar" ? "تم التخطي" : "Skipped"}: {uploadResult.skipped.length}
                <span className="text-muted-foreground"> — {uploadResult.skipped.map((s: any) => `${s.ref} (${s.reason})`).join(", ")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {can.edit && view === "list" && filtered.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox checked={allFilteredSelected} onCheckedChange={() => toggleAllFiltered()} />
          {lang === "ar" ? "تحديد كل النتائج" : "Select all results"}
        </label>
      )}
      {can.edit && (
        <BulkActionBar
          count={selected.length}
          onClear={() => setSelected([])}
          statusOptions={STATUS_ALL.map(s => ({ value: s, label: lang === "ar" ? STATUS_LABEL[s].ar : STATUS_LABEL[s].en }))}
          onStatusChange={bulkStatus}
        />
      )}

      {apps.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{t("noApplications")}</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{t("noResults")}</CardContent></Card>
      ) : view === "list" ? (
        <div className="grid gap-2">
          {filtered.map(a => (
            <AppRow
              key={a.id}
              a={a}
              lang={lang}
              canEdit={can.edit}
              selected={selected.includes(a.id)}
              onToggle={() => toggleOne(a.id)}
              onShortlist={async () => {
                try {
                  await updateApplicationStatus({ data: { id: a.id, from: a.status, to: "shortlisted" } });
                  setApps(prev => prev.map(x => (x.id === a.id ? { ...x, status: "shortlisted" as CareerStatus } : x)));
                  toast.success(lang === "ar" ? "تمت الإضافة للقائمة القصيرة" : "Shortlisted");
                } catch {
                  toast.error(lang === "ar" ? "تعذر التحديث" : "Could not update");
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {STATUS_PIPELINE.map(col => {
            const items = filtered.filter(a => a.status === col);
            return (
              <div key={col} className="flex flex-col rounded-lg border bg-card/50 min-h-[140px]">
                <div className={`text-xs font-medium px-3 py-2 border-b flex items-center justify-between ${STATUS_COLOR[col]} rounded-t-lg`}>
                  <span>{statusLabel(col)}</span>
                  <span className="px-1.5 py-0.5 rounded bg-background/80 text-foreground text-[10px]">{items.length}</span>
                </div>
                <div className="p-2 flex flex-col gap-2">
                  {items.map(a => <AppCard key={a.id} a={a} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AppCard({ a }: { a: App }) {
  const loc = [a.city, a.country].filter(Boolean).join(", ");
  return (
    <Link to="/dashboard/admin/careers/applications/$id" params={{ id: a.id }} className="block rounded-md border bg-card p-2.5 hover:border-accent transition-colors">
      <div className="text-sm font-medium truncate">{a.full_name}</div>
      <div className="text-xs text-muted-foreground truncate">{a.career_jobs?.title_en || "—"}</div>
      <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-2">
        {a.years_experience != null && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{a.years_experience}y</span>}
        {loc && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{loc}</span>}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 font-mono">{a.ref}</div>
    </Link>
  );
}

function AppRow({ a, lang, canEdit, selected, onToggle, onShortlist }: { a: App; lang: string; canEdit: boolean; selected: boolean; onToggle: () => void; onShortlist: () => void }) {
  const loc = [a.city, a.country].filter(Boolean).join(", ");
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-3 hover:border-accent transition-colors">
      {canEdit && (
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle()}
          aria-label={lang === "ar" ? "تحديد الطلب" : "Select application"}
        />
      )}
      <Link to="/dashboard/admin/careers/applications/$id" params={{ id: a.id }} className="flex flex-1 flex-wrap items-center gap-3 min-w-0">
      <div className="flex-1 min-w-[200px]">
        <div className="text-sm font-medium">{a.full_name}</div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-0.5">
          <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{a.email}</span>
          {a.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{a.phone}</span>}
          {a.years_experience != null && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{a.years_experience}y</span>}
          {loc && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{loc}</span>}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{a.career_jobs?.title_en || "—"}</div>
      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[a.status]}`}>{lang === "ar" ? STATUS_LABEL[a.status].ar : STATUS_LABEL[a.status].en}</span>
      <span className="text-[10px] font-mono text-muted-foreground">{a.ref}</span>
      </Link>
      {canEdit && a.status !== "shortlisted" && !["accepted", "rejected", "withdrawn"].includes(a.status) && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShortlist(); }}
        >
          <Star className="h-3 w-3 me-1" />{lang === "ar" ? "قائمة قصيرة" : "Shortlist"}
        </Button>
      )}
    </div>
  );
}