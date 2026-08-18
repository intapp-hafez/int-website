import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Search, LifeBuoy, X, Sparkles, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PRIORITIES, STATUSES, CATEGORIES, labelFor, toneFor, slaState, slaBadgeTone, slaLabel, type Ticket, type TicketPriority, type TicketStatus } from "@/lib/helpdesk";
import { useAdminT } from "@/lib/admin-i18n";
import { DEFAULT_TICKETS } from "@/data/default-helpdesk";

const INVOICE_STATUSES = [
  { value: "none", labelKey: "invNone", tone: "bg-muted text-foreground" },
  { value: "draft", labelKey: "invDraft", tone: "bg-slate-500/10 text-slate-700" },
  { value: "issued", labelKey: "invIssued", tone: "bg-indigo-500/10 text-indigo-700" },
  { value: "paid", labelKey: "invPaid", tone: "bg-emerald-500/10 text-emerald-700" },
  { value: "void", labelKey: "invVoid", tone: "bg-rose-500/10 text-rose-700" },
] as const;

function invoiceTone(status?: string) {
  return INVOICE_STATUSES.find((s) => s.value === status)?.tone ?? "bg-muted text-foreground";
}

export const Route = createFileRoute("/dashboard/admin/helpdesk/tickets/")({
  head: () => ({ meta: [{ title: "Support Tickets — Helpdesk" }] }),
  component: HelpdeskTicketsList,
});

function HelpdeskTicketsList() {
  const navigate = useNavigate();
  const { t: at, isRtl, lang } = useAdminT();
  const isAr = lang === "ar";

  const invoiceLabel = (status?: string) => {
    const s = INVOICE_STATUSES.find((x) => x.value === status);
    return s ? at(s.labelKey as any) : at("invNone");
  };

  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [priority, setPriority] = useState<TicketPriority | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [slaPolicy, setSlaPolicy] = useState<string>("all");
  const [branch, setBranch] = useState<string>("all");
  const [device, setDevice] = useState<string>("all");
  const [industry, setIndustry] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [invStatus, setInvStatus] = useState<string>("all");
  const [invAmountMin, setInvAmountMin] = useState<string>("");
  const [invAmountMax, setInvAmountMax] = useState<string>("");
  const [slas, setSlas] = useState<{ id: string; name_en: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; code: string; name_en: string }[]>([]);
  const [devices, setDevices] = useState<{ id: string; serial: string; name: string }[]>([]);
  const INDUSTRIES = ["Banking", "Healthcare", "Education", "Retail", "Government", "Hospitality", "Manufacturing", "Other"];

  const load = async () => {
    setLoading(true);
    const [tk, sl, br, dv] = await Promise.all([
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("support_sla_policies").select("id,name_en").order("name_en"),
      supabase.from("support_branches").select("id,code,name_en").order("name_en"),
      supabase.from("support_devices").select("id,serial,name").order("serial"),
    ]);
    if (tk.error) toast.error(tk.error.message);
    setItems((tk.data as any[]) ?? []);
    setSlas((sl.data as any[]) ?? []);
    setBranches((br.data as any[]) ?? []);
    setDevices((dv.data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();

    const channel = supabase
      .channel("support_tickets_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
    try {
      const { error } = await supabase.from("support_tickets").update({ status: newStatus }).eq("id", ticketId);
      if (error) throw error;
      toast.success(isAr ? "تم تحديث حالة التذكرة" : "Ticket status updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
      void load();
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(isAr ? `هل تريد حذف التذكرة #${ticketNo}؟` : `Delete ticket #${ticketNo}?`)) return;
    setItems((prev) => prev.filter((t) => t.id !== ticketId));
    try {
      const { error } = await supabase.from("support_tickets").delete().eq("id", ticketId);
      if (error) throw error;
      toast.success(isAr ? "تم حذف التذكرة" : "Ticket deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete ticket");
      void load();
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const payload = DEFAULT_TICKETS.map((d) => ({
        ...d,
        created_by: u?.user?.id ?? null,
      }));
      const { error } = await (supabase as any).from("support_tickets").insert(payload);
      if (error) throw error;
      toast.success(isAr ? "تم تحميل عينات التذاكر بنجاح!" : "Sample support tickets loaded successfully!");
      void load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to seed sample tickets");
    } finally {
      setSeeding(false);
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toMs = dateTo ? new Date(dateTo).getTime() + 86_400_000 : null;
    const branchCode = branch !== "all" ? branches.find((b) => b.id === branch)?.code ?? branches.find((b) => b.id === branch)?.name_en : null;
    const deviceSerial = device !== "all" ? devices.find((d) => d.id === device)?.serial : null;
    const minAmt = invAmountMin ? parseFloat(invAmountMin) : null;
    const maxAmt = invAmountMax ? parseFloat(invAmountMax) : null;
    return items.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (category !== "all" && t.category !== category) return false;
      if (slaPolicy !== "all" && (t.sla_policy_id ?? "") !== slaPolicy) return false;
      if (branchCode && (t.branch ?? "") !== branchCode) return false;
      if (deviceSerial && (t.device_serial ?? "") !== deviceSerial) return false;
      if (fromMs && new Date(t.created_at).getTime() < fromMs) return false;
      if (toMs && new Date(t.created_at).getTime() > toMs) return false;
      if (invStatus !== "all") {
        const tInv = t.invoice_status || "none";
        if (tInv !== invStatus) return false;
      }
      if (minAmt !== null && (t.invoice_amount == null || t.invoice_amount < minAmt)) return false;
      if (maxAmt !== null && (t.invoice_amount == null || t.invoice_amount > maxAmt)) return false;
      if (term && !(`${t.ticket_no ?? ""} ${t.subject}`.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [items, q, status, priority, category, slaPolicy, branch, device, dateFrom, dateTo, invStatus, invAmountMin, invAmountMax, branches, devices]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: items.length };
    for (const s of STATUSES) out[s.value] = items.filter((t) => t.status === s.value).length;
    return out;
  }, [items]);

  const reset = () => {
    setQ("");
    setStatus("all");
    setPriority("all");
    setCategory("all");
    setSlaPolicy("all");
    setBranch("all");
    setDevice("all");
    setIndustry("all");
    setDateFrom("");
    setDateTo("");
    setInvStatus("all");
    setInvAmountMin("");
    setInvAmountMax("");
  };

  const active = !!(
    q.trim() ||
    status !== "all" ||
    priority !== "all" ||
    category !== "all" ||
    slaPolicy !== "all" ||
    branch !== "all" ||
    device !== "all" ||
    industry !== "all" ||
    dateFrom ||
    dateTo ||
    invStatus !== "all" ||
    invAmountMin ||
    invAmountMax
  );

  return (
    <div className="space-y-4 max-w-6xl" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-accent" /> {at("helpdeskTitle")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{at("helpdeskSub")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {items.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleSeedDefaults} disabled={seeding || loading} className="text-xs">
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin me-1" /> : <Sparkles className="h-3.5 w-3.5 text-accent me-1" />}
              {isAr ? "تحميل عينات التذاكر" : "Load Sample Tickets"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 me-1 ${loading ? "animate-spin" : ""}`} /> {isAr ? "تحديث" : "Refresh"}
          </Button>
          <Button asChild size="sm">
            <Link to="/dashboard/admin/helpdesk/tickets/new">
              <Plus className="h-4 w-4 me-1" /> {at("newTicket")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setStatus("all")}
          className={`text-xs px-2.5 py-1 rounded-full border transition ${status === "all" ? "bg-foreground text-background" : "hover:bg-muted"}`}
        >
          {at("allStatuses")} <span className="opacity-70">({counts.all})</span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`text-xs px-2.5 py-1 rounded-full border capitalize transition ${status === s.value ? "bg-foreground text-background" : "hover:bg-muted"}`}
          >
            {lang === "ar" ? (s as any).ar ?? s.en : s.en} <span className="opacity-70">({counts[s.value] || 0})</span>
          </button>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute top-1/2 -translate-y-1/2 start-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={at("searchByNumOrSubject")} className="ps-8 h-9 text-xs" />
        </div>
        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
          <SelectTrigger className="sm:w-[160px] h-9 text-xs">
            <SelectValue placeholder={at("priorityLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{at("allPriorities")}</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {lang === "ar" ? (p as any).ar ?? p.en : p.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-[180px] h-9 text-xs">
            <SelectValue placeholder={at("categoryLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{at("allCategories")}</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {lang === "ar" ? (c as any).ar ?? c.en : c.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {active && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-9 text-xs">
            <X className="h-4 w-4 me-1" /> {at("clearFilters")}
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <Select value={slaPolicy} onValueChange={setSlaPolicy}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={at("sla")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{at("allSLAs")}</SelectItem>
            {slas.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={branch} onValueChange={setBranch}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={at("branch")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{at("allBranches")}</SelectItem>
            {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name_en || b.code}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={device} onValueChange={setDevice}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={at("deviceSerial")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{at("allDevices")}</SelectItem>
            {devices.map((d) => <SelectItem key={d.id} value={d.id}>{d.serial}{d.name ? ` · ${d.name}` : ""}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs" />
        <Select value={invStatus} onValueChange={setInvStatus}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={at("invoiceStatus")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{at("allInvoices")}</SelectItem>
            {INVOICE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{at(s.labelKey as any)}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Input type="number" min={0} value={invAmountMin} onChange={(e) => setInvAmountMin(e.target.value)} placeholder={at("minAmount")} className="h-8 text-xs" />
          <Input type="number" min={0} value={invAmountMax} onChange={(e) => setInvAmountMax(e.target.value)} placeholder={at("maxAmount")} className="h-8 text-xs" />
        </div>
      </div>

      {/* Tickets List Cards with Dynamic Inline Status Selector */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
          <span>{isAr ? "جارٍ جلب التذاكر..." : "Loading support tickets..."}</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {items.length === 0 ? at("noTicketsYet") : at("noTicketsMatch")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2.5">
          {filtered.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate({ to: "/dashboard/admin/helpdesk/tickets/$id", params: { id: t.id } })}
              className="group bg-card border rounded-2xl p-4 hover:border-accent/50 hover:shadow-xs transition cursor-pointer"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-accent px-2 py-0.5 rounded bg-muted/60 border">
                      {t.ticket_no || `#${t.id.slice(0, 8)}`}
                    </span>
                    <Badge className={`${toneFor(PRIORITIES, t.priority)} border-0 capitalize text-[10px]`}>
                      {labelFor(PRIORITIES, t.priority, lang as any)}
                    </Badge>
                    {(() => {
                      const resp = slaState(t.first_response_due_at, t.first_response_at);
                      const res = slaState(t.resolve_due_at, t.resolved_at);
                      const worst: any =
                        res === "breached" || resp === "breached"
                          ? "breached"
                          : res === "at_risk" || resp === "at_risk"
                          ? "at_risk"
                          : res === "ok" || resp === "ok"
                          ? "ok"
                          : res === "met" && resp === "met"
                          ? "met"
                          : "none";
                      if (worst === "none") return null;
                      return <Badge className={`${slaBadgeTone(worst)} border-0 text-[10px]`}>{at("sla")}: {slaLabel(worst)}</Badge>;
                    })()}
                    {t.invoice_status && t.invoice_status !== "none" ? (
                      <Badge className={`${invoiceTone(t.invoice_status)} border-0 text-[10px]`}>
                        {invoiceLabel(t.invoice_status)}
                        {t.invoice_amount != null ? ` · ${t.invoice_currency || "USD"} ${t.invoice_amount.toLocaleString()}` : ""}
                      </Badge>
                    ) : null}
                  </div>

                  <h3 className="font-semibold text-sm text-foreground group-hover:text-accent transition truncate">
                    {t.subject}
                  </h3>

                  <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{labelFor(CATEGORIES, t.category, lang as any)}</span>
                    {t.branch && <span>• {t.branch}</span>}
                    {t.device_serial && <span>• {t.device_serial}</span>}
                    <span>• {new Date(t.created_at).toLocaleString(lang === "ar" ? "ar" : "en")}</span>
                  </div>
                </div>

                {/* Inline Action Controls */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={t.status}
                    onValueChange={(v) => handleUpdateStatus(t.id, v as TicketStatus)}
                  >
                    <SelectTrigger className={`h-8 w-32 text-xs rounded-xl border font-medium ${toneFor(STATUSES, t.status)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="capitalize text-xs">
                          {lang === "ar" ? (s as any).ar ?? s.en : s.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDeleteTicket(t.id, t.ticket_no || t.id.slice(0, 8), e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}