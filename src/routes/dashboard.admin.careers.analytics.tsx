import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, FileSpreadsheet, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";
import { listApplicationsFull } from "@/lib/admin-data.functions";
import { STATUS_ALL, STATUS_PIPELINE, STATUS_LABEL, STATUS_COLOR, type CareerStatus } from "@/lib/career-workflow";
import { useAdminT } from "@/lib/admin-i18n";
import { useCanAccess } from "@/lib/permissions-store";
import { AccessDenied } from "@/routes/dashboard.admin.careers";

export const Route = createFileRoute("/dashboard/admin/careers/analytics")({
  head: () => ({ meta: [{ title: "Careers Analytics — Admin" }] }),
  component: CareersAnalytics,
});

type Row = {
  id: string; ref: string; status: CareerStatus; created_at: string;
  source?: string | null; referral_source?: string | null;
  job_id: string | null;
  career_jobs?: { title_en: string; title_ar?: string } | null;
};

const STAGE_ORDER: CareerStatus[] = STATUS_PIPELINE;

function CareersAnalytics() {
  const { lang } = useAdminT();
  const ar = lang === "ar";
  const can = useCanAccess("careers_analytics");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    (async () => {
      if (!can.view) { setLoading(false); return; }
      try {
        const data = await listApplicationsFull();
        setRows((data as any[]) ?? []);
      } catch { setRows([]); }
      finally { setLoading(false); }
    })();
  }, [can.view]);

  const filtered = useMemo(() => {
    const f = from ? new Date(from).getTime() : null;
    const t = to ? new Date(to).getTime() + 86_400_000 : null;
    return rows.filter(r => {
      const ts = new Date(r.created_at).getTime();
      if (f !== null && ts < f) return false;
      if (t !== null && ts >= t) return false;
      return true;
    });
  }, [rows, from, to]);

  const total = filtered.length;

  const byStatus = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of STATUS_ALL) m[s] = 0;
    for (const r of filtered) m[r.status] = (m[r.status] ?? 0) + 1;
    return m;
  }, [filtered]);

  const reached = useMemo(() => {
    // A candidate at stage N is counted as having reached every earlier stage.
    const m: Record<string, number> = {};
    for (const s of STAGE_ORDER) m[s] = 0;
    for (const r of filtered) {
      const idx = STAGE_ORDER.indexOf(r.status);
      const upto = idx >= 0 ? idx : 0; // rejected/withdrawn still entered the funnel
      for (let i = 0; i <= upto; i++) m[STAGE_ORDER[i]] += 1;
    }
    return m;
  }, [filtered]);

  const byJob = useMemo(() => {
    const m = new Map<string, { title: string; total: number; shortlisted: number; accepted: number; rejected: number }>();
    for (const r of filtered) {
      const key = r.job_id ?? "unassigned";
      const title = r.career_jobs?.title_en || (ar ? "غير محدد" : "Unassigned");
      const e = m.get(key) ?? { title, total: 0, shortlisted: 0, accepted: 0, rejected: 0 };
      e.total += 1;
      if (["shortlisted", "interviewed", "offered", "accepted"].includes(r.status)) e.shortlisted += 1;
      if (r.status === "accepted") e.accepted += 1;
      if (r.status === "rejected") e.rejected += 1;
      m.set(key, e);
    }
    return Array.from(m.values()).sort((a, b) => b.total - a.total);
  }, [filtered, ar]);

  const bySource = useMemo(() => {
    const m = new Map<string, { source: string; total: number; accepted: number }>();
    for (const r of filtered) {
      const src = (r.source || r.referral_source || (ar ? "غير معروف" : "Unknown")).toString();
      const e = m.get(src) ?? { source: src, total: 0, accepted: 0 };
      e.total += 1;
      if (r.status === "accepted") e.accepted += 1;
      m.set(src, e);
    }
    return Array.from(m.values()).sort((a, b) => b.total - a.total);
  }, [filtered, ar]);

  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      m.set(d, (m.get(d) ?? 0) + 1);
    }
    return Array.from(m, ([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const maxDay = Math.max(1, ...byDay.map(d => d.count));
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const downloadCsv = () => {
    const lines: string[] = [];
    const push = (title: string, header: string[], data: (string | number)[][]) => {
      lines.push(title, header.join(","));
      for (const r of data) lines.push(r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
      lines.push("");
    };
    push("Funnel", ["Stage", "Reached", "Conversion %"], STAGE_ORDER.map(s => [STATUS_LABEL[s].en, reached[s], pct(reached[s])]));
    push("By status", ["Status", "Count"], STATUS_ALL.map(s => [STATUS_LABEL[s].en, byStatus[s]]));
    push("By job", ["Job", "Applications", "Shortlisted+", "Accepted", "Rejected", "Accept rate %"],
      byJob.map(j => [j.title, j.total, j.shortlisted, j.accepted, j.rejected, j.total ? Math.round((j.accepted / j.total) * 100) : 0]));
    push("By source", ["Source", "Applications", "Accepted"], bySource.map(s => [s.source, s.total, s.accepted]));
    push("By date", ["Date", "Applications"], byDay.map(d => [d.date, d.count]));
    const blob = new Blob([`\ufeff${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `careers-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      STAGE_ORDER.map(s => ({ Stage: STATUS_LABEL[s].en, Reached: reached[s], "Conversion %": pct(reached[s]) })),
    ), "Funnel");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(byJob.map(j => ({
      Job: j.title, Applications: j.total, "Shortlisted+": j.shortlisted, Accepted: j.accepted, Rejected: j.rejected,
    }))), "By job");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bySource.map(s => ({
      Source: s.source, Applications: s.total, Accepted: s.accepted,
    }))), "By source");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(byDay.map(d => ({ Date: d.date, Applications: d.count }))), "By date");
    XLSX.writeFile(wb, `careers-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (!can.view) return <AccessDenied what={ar ? "تحليلات التوظيف" : "careers analytics"} />;
  if (loading) return <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;

  return (
    <div className="space-y-5" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground">{ar ? "من" : "From"}</Label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-[150px]" />
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground">{ar ? "إلى" : "To"}</Label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-[150px]" />
        </div>
        <div className="ms-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadCsv} disabled={!total}>
            <Download className="h-3.5 w-3.5 me-1" />{ar ? "تحميل CSV" : "Download CSV"}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadExcel} disabled={!total}>
            <FileSpreadsheet className="h-3.5 w-3.5 me-1" />{ar ? "تحميل Excel" : "Download Excel"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: ar ? "إجمالي الطلبات" : "Total applications", value: total },
          { label: ar ? "قائمة قصيرة فأعلى" : "Shortlisted+", value: reached["shortlisted"] ?? 0 },
          { label: ar ? "المقبولون" : "Hired", value: byStatus["accepted"] ?? 0 },
          { label: ar ? "نسبة التوظيف" : "Hire rate", value: `${pct(byStatus["accepted"] ?? 0)}%` },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="text-2xl font-bold mt-1">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" />{ar ? "قمع التحويل" : "Conversion funnel"}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {STAGE_ORDER.map((s, i) => {
            const prev = i === 0 ? total : reached[STAGE_ORDER[i - 1]];
            const step = prev ? Math.round((reached[s] / prev) * 100) : 0;
            return (
              <div key={s} className="flex items-center gap-3">
                <span className="w-28 text-xs shrink-0">{ar ? STATUS_LABEL[s].ar : STATUS_LABEL[s].en}</span>
                <div className="flex-1 h-6 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-accent/70" style={{ width: `${pct(reached[s])}%` }} />
                </div>
                <span className="w-28 text-xs text-muted-foreground text-end shrink-0">
                  {reached[s]} · {pct(reached[s])}% ({ar ? "خطوة" : "step"} {step}%)
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{ar ? "حسب الوظيفة" : "By job"}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="text-start p-1">{ar ? "الوظيفة" : "Job"}</th>
                  <th className="p-1">{ar ? "الطلبات" : "Apps"}</th>
                  <th className="p-1">{ar ? "قائمة قصيرة" : "Shortlisted"}</th>
                  <th className="p-1">{ar ? "مقبول" : "Hired"}</th>
                  <th className="p-1">{ar ? "نسبة" : "Rate"}</th>
                </tr>
              </thead>
              <tbody>
                {byJob.map(j => (
                  <tr key={j.title} className="border-t">
                    <td className="p-1">{j.title}</td>
                    <td className="p-1 text-center">{j.total}</td>
                    <td className="p-1 text-center">{j.shortlisted}</td>
                    <td className="p-1 text-center">{j.accepted}</td>
                    <td className="p-1 text-center">{j.total ? Math.round((j.accepted / j.total) * 100) : 0}%</td>
                  </tr>
                ))}
                {byJob.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">{ar ? "لا توجد بيانات" : "No data"}</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{ar ? "حسب المصدر" : "By source"}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {bySource.map(s => (
              <div key={s.source} className="flex items-center gap-3">
                <span className="w-32 text-xs truncate">{s.source}</span>
                <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-accent/60" style={{ width: `${pct(s.total)}%` }} />
                </div>
                <span className="w-20 text-xs text-muted-foreground text-end">{s.total} · {pct(s.total)}%</span>
              </div>
            ))}
            {bySource.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">{ar ? "لا توجد بيانات" : "No data"}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{ar ? "حسب التاريخ" : "By date"}</CardTitle></CardHeader>
        <CardContent>
          {byDay.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">{ar ? "لا توجد بيانات" : "No data"}</p>
          ) : (
            <div className="flex items-end gap-1 h-40 overflow-x-auto">
              {byDay.map(d => (
                <div key={d.date} className="flex flex-col items-center justify-end gap-1 min-w-[26px]" title={`${d.date}: ${d.count}`}>
                  <span className="text-[10px] text-muted-foreground">{d.count}</span>
                  <div className="w-4 rounded-t bg-accent/70" style={{ height: `${(d.count / maxDay) * 100}%` }} />
                  <span className="text-[9px] text-muted-foreground rotate-45 origin-top-left whitespace-nowrap">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{ar ? "حسب الحالة" : "By status"}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {STATUS_ALL.map(s => (
            <span key={s} className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLOR[s]}`}>
              {ar ? STATUS_LABEL[s].ar : STATUS_LABEL[s].en}: {byStatus[s] ?? 0}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
