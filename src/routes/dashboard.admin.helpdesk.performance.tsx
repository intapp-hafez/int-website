import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BarChart3, Loader2, Users, Clock, ShieldCheck, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/admin/helpdesk/performance")({
  head: () => ({ meta: [{ title: "Technician Performance — Helpdesk" }] }),
  component: PerformancePage,
});

type Row = {
  user_id: string;
  total: number;
  open: number;
  resolved: number;
  avgFirstResponseMin: number | null;
  avgResolveMin: number | null;
  slaResponseRate: number | null;
  slaResolveRate: number | null;
};

function fmtMin(m: number | null) {
  if (m == null) return "—";
  if (m < 60) return `${Math.round(m)}m`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}
function pct(p: number | null) {
  if (p == null) return "—";
  return `${Math.round(p * 100)}%`;
}
function pctTone(p: number | null) {
  if (p == null) return "bg-muted text-foreground";
  if (p >= 0.9) return "bg-emerald-500/10 text-emerald-700";
  if (p >= 0.7) return "bg-amber-100 text-amber-900";
  return "bg-destructive/10 text-destructive";
}

function PerformancePage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [staff, setStaff] = useState<{ user_id: string; role: string }[]>([]);
  const [range, setRange] = useState<string>("30");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [tk, su] = await Promise.all([
        supabase.from("support_tickets").select("id,assigned_to,created_at,resolved_at,first_response_at,first_response_due_at,resolve_due_at,status"),
        supabase.from("user_roles").select("user_id,role").in("role", ["admin", "helpdesk_manager", "technician"]),
      ]);
      if (tk.error) toast.error(tk.error.message);
      setTickets(tk.data ?? []);
      setStaff((su.data as any[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const rows = useMemo<Row[]>(() => {
    let fromMs: number | null = null;
    let toMs: number | null = null;
    if (dateFrom || dateTo) {
      fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
      toMs = dateTo ? new Date(dateTo).getTime() + 86_400_000 : null;
    } else if (range !== "all") {
      fromMs = Date.now() - Number(range) * 86_400_000;
    }
    const filtered = tickets.filter(t => {
      const c = new Date(t.created_at).getTime();
      if (fromMs && c < fromMs) return false;
      if (toMs && c > toMs) return false;
      return !!t.assigned_to;
    });
    const byUser = new Map<string, any[]>();
    for (const t of filtered) {
      const k = t.assigned_to as string;
      if (!byUser.has(k)) byUser.set(k, []);
      byUser.get(k)!.push(t);
    }
    const out: Row[] = [];
    for (const [user_id, list] of byUser) {
      const respTimes: number[] = [];
      const resTimes: number[] = [];
      let respMet = 0, respDue = 0, resMet = 0, resDue = 0;
      let resolved = 0, open = 0;
      for (const t of list) {
        if (t.first_response_at) respTimes.push((new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime()) / 60000);
        if (t.resolved_at) { resTimes.push((new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 60000); resolved++; }
        else if (!["closed", "cancelled"].includes(t.status)) open++;
        if (t.first_response_due_at) {
          respDue++;
          if (t.first_response_at && new Date(t.first_response_at).getTime() <= new Date(t.first_response_due_at).getTime()) respMet++;
        }
        if (t.resolve_due_at) {
          resDue++;
          if (t.resolved_at && new Date(t.resolved_at).getTime() <= new Date(t.resolve_due_at).getTime()) resMet++;
        }
      }
      const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
      out.push({
        user_id,
        total: list.length,
        open,
        resolved,
        avgFirstResponseMin: avg(respTimes),
        avgResolveMin: avg(resTimes),
        slaResponseRate: respDue ? respMet / respDue : null,
        slaResolveRate: resDue ? resMet / resDue : null,
      });
    }
    return out.sort((a, b) => b.total - a.total);
  }, [tickets, range, dateFrom, dateTo]);

  const roleOf = (uid: string) => staff.find(s => s.user_id === uid)?.role ?? "user";

  const totals = useMemo(() => {
    const total = rows.reduce((a, r) => a + r.total, 0);
    const open = rows.reduce((a, r) => a + r.open, 0);
    const resolved = rows.reduce((a, r) => a + r.resolved, 0);
    const respRates = rows.map(r => r.slaResponseRate).filter((x): x is number => x != null);
    const resRates = rows.map(r => r.slaResolveRate).filter((x): x is number => x != null);
    const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    return { total, open, resolved, resp: avg(respRates), res: avg(resRates) };
  }, [rows]);

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/dashboard/admin/helpdesk/tickets"><ArrowLeft className="h-4 w-4 mr-1" /> {isAr ? "رجوع" : "Back"}</Link></Button>
      </div>
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5" /> {isAr ? "أداء الفنيين" : "Technician Performance"}</h1>
        <p className="text-sm text-muted-foreground">{isAr ? "حجم العمل، أوقات الاستجابة والحل، والامتثال لاتفاقيات SLA لكل فني." : "Workload, response & resolution times, and SLA compliance per technician."}</p>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <div className="text-xs text-muted-foreground mb-1">{isAr ? "الفترة" : "Range"}</div>
          <Select value={range} onValueChange={(v) => { setRange(v); setDateFrom(""); setDateTo(""); }}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{isAr ? "آخر 7 أيام" : "Last 7 days"}</SelectItem>
              <SelectItem value="30">{isAr ? "آخر 30 يومًا" : "Last 30 days"}</SelectItem>
              <SelectItem value="90">{isAr ? "آخر 90 يومًا" : "Last 90 days"}</SelectItem>
              <SelectItem value="365">{isAr ? "آخر 12 شهرًا" : "Last 12 months"}</SelectItem>
              <SelectItem value="all">{isAr ? "كل الفترات" : "All time"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">{isAr ? "من" : "From"}</div>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-[160px]" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">{isAr ? "إلى" : "To"}</div>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-[160px]" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" />{isAr ? "الفنيون" : "Technicians"}</div><div className="text-2xl font-semibold mt-1">{rows.length}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><Inbox className="h-3.5 w-3.5" />{isAr ? "التذاكر" : "Tickets"}</div><div className="text-2xl font-semibold mt-1">{totals.total}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">{isAr ? "مفتوحة" : "Open"}</div><div className="text-2xl font-semibold mt-1">{totals.open}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />{isAr ? "متوسط SLA الاستجابة" : "Avg response SLA"}</div><div className="text-2xl font-semibold mt-1">{pct(totals.resp)}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />{isAr ? "متوسط SLA الحل" : "Avg resolve SLA"}</div><div className="text-2xl font-semibold mt-1">{pct(totals.res)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> {isAr ? "لكل فني" : "Per technician"}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{isAr ? "لا توجد تذاكر مُسندة في هذه الفترة." : "No assigned tickets in this range."}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2">{isAr ? "الفني" : "Technician"}</th>
                    <th className="text-right px-3 py-2">{isAr ? "المُسندة" : "Assigned"}</th>
                    <th className="text-right px-3 py-2">{isAr ? "مفتوحة" : "Open"}</th>
                    <th className="text-right px-3 py-2">{isAr ? "محلولة" : "Resolved"}</th>
                    <th className="text-right px-3 py-2">{isAr ? "متوسط أول استجابة" : "Avg 1st response"}</th>
                    <th className="text-right px-3 py-2">{isAr ? "متوسط الحل" : "Avg resolution"}</th>
                    <th className="text-right px-3 py-2">{isAr ? "SLA الاستجابة" : "Response SLA"}</th>
                    <th className="text-right px-3 py-2">{isAr ? "SLA الحل" : "Resolve SLA"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.user_id} className="border-t">
                      <td className="px-4 py-2"><div className="font-mono text-xs">{r.user_id.slice(0, 8)}…</div><div className="text-xs text-muted-foreground capitalize">{roleOf(r.user_id).replace("_", " ")}</div></td>
                      <td className="text-right px-3 py-2">{r.total}</td>
                      <td className="text-right px-3 py-2">{r.open}</td>
                      <td className="text-right px-3 py-2">{r.resolved}</td>
                      <td className="text-right px-3 py-2">{fmtMin(r.avgFirstResponseMin)}</td>
                      <td className="text-right px-3 py-2">{fmtMin(r.avgResolveMin)}</td>
                      <td className="text-right px-3 py-2"><Badge className={`${pctTone(r.slaResponseRate)} border-0`}>{pct(r.slaResponseRate)}</Badge></td>
                      <td className="text-right px-3 py-2"><Badge className={`${pctTone(r.slaResolveRate)} border-0`}>{pct(r.slaResolveRate)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}