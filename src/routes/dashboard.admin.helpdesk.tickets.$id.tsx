import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Send, Activity, MessageSquare, Trash2, Clock, UserCog, History, Receipt, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PRIORITIES, STATUSES, CATEGORIES, labelFor, toneFor, slaState, slaBadgeTone, slaLabel, formatRemaining, type Ticket, type TicketMessage, type TicketEvent, type TicketStatus, type TicketPriority } from "@/lib/helpdesk";

export const Route = createFileRoute("/dashboard/admin/helpdesk/tickets/$id")({
  head: () => ({ meta: [{ title: "Ticket — Helpdesk" }] }),
  component: TicketDetail,
});

function TicketDetail() {
  const { id } = Route.useParams();
  const [t, setT] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [slas, setSlas] = useState<{ id: string; name_en: string }[]>([]);
  const [staff, setStaff] = useState<{ user_id: string; role: string }[]>([]);
  const [assignments, setAssignments] = useState<{ id: string; assigned_to: string | null; assigned_by: string | null; created_at: string; note: string }[]>([]);
  const [recipients, setRecipients] = useState<{ id: string; department: string; email: string }[]>([]);
  const [inv, setInv] = useState({ invoice_no: "", invoice_amount: "" as string, invoice_currency: "USD", invoice_notes: "", invoice_status: "none" });
  const [notifying, setNotifying] = useState(false);
  const [related, setRelated] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [tk, ms, ev, sl, su, as, rc] = await Promise.all([
      supabase.from("support_tickets").select("*").eq("id", id).maybeSingle(),
      supabase.from("support_ticket_messages").select("*").eq("ticket_id", id).order("created_at", { ascending: true }),
      supabase.from("support_ticket_events").select("*").eq("ticket_id", id).order("created_at", { ascending: true }),
      supabase.from("support_sla_policies").select("id,name_en").eq("active", true).order("name_en"),
      supabase.from("user_roles").select("user_id,role").in("role", ["admin","helpdesk_manager","technician"]),
      supabase.from("support_ticket_assignments").select("*").eq("ticket_id", id).order("created_at", { ascending: false }),
      supabase.from("support_invoice_recipients").select("id,department,email").eq("active", true).order("sort_order"),
    ]);
    if (tk.error) toast.error(tk.error.message);
    const tdata: any = tk.data ?? null;
    setT(tdata);
    if (tdata) {
      setInv({
        invoice_no: tdata.invoice_no ?? "",
        invoice_amount: tdata.invoice_amount != null ? String(tdata.invoice_amount) : "",
        invoice_currency: tdata.invoice_currency ?? "USD",
        invoice_notes: tdata.invoice_notes ?? "",
        invoice_status: tdata.invoice_status ?? "none",
      });
    }
    setMessages((ms.data as any[]) ?? []);
    setEvents((ev.data as any[]) ?? []);
    setSlas((sl.data as any[]) ?? []);
    setStaff((su.data as any[]) ?? []);
    setAssignments((as.data as any[]) ?? []);
    setRecipients((rc.data as any[]) ?? []);
    setLoading(false);
    // Related invoices: other tickets for same client with an invoice
    if (tdata?.client_id || tdata?.created_by) {
      const owner = tdata.client_id || tdata.created_by;
      const { data: rel } = await supabase
        .from("support_tickets")
        .select("id,ticket_no,subject,invoice_no,invoice_amount,invoice_currency,invoice_status,invoice_issued_at,invoice_paid_at,created_at")
        .or(`client_id.eq.${owner},created_by.eq.${owner}`)
        .neq("invoice_status", "none")
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      setRelated((rel as any[]) ?? []);
    } else {
      setRelated([]);
    }
  };
  useEffect(() => { load(); }, [id]);

  const setField = async (patch: Partial<Ticket>, note: string) => {
    if (!t) return;
    const before = { ...t };
    setT({ ...t, ...patch } as Ticket);
    const { error } = await supabase.from("support_tickets").update(patch).eq("id", id);
    if (error) { setT(before); return toast.error(error.message); }
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("support_ticket_events").insert({
      ticket_id: id, actor_id: u.user?.id ?? null,
      event_type: Object.keys(patch)[0], to_value: String(Object.values(patch)[0] ?? ""), note,
    });
    load();
  };

  const post = async () => {
    if (!reply.trim()) return;
    setPosting(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("support_ticket_messages").insert({
      ticket_id: id, author_id: u.user?.id ?? null, body: reply.trim(), is_internal: internal,
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setReply("");
    load();
  };

  const remove = async () => {
    if (!confirm("Delete this ticket and all its messages?")) return;
    const { error } = await supabase.from("support_tickets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Ticket deleted");
    history.back();
  };

  if (loading) return <div className="text-center py-12"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;
  if (!t) return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Ticket not found.</CardContent></Card>;

  const respState = slaState(t.first_response_due_at, t.first_response_at);
  const resState = slaState(t.resolve_due_at, t.resolved_at);
  const staffUnique = Array.from(new Map(staff.map(s => [s.user_id, s])).values());

  const saveInvoice = async (newStatus?: string) => {
    const amt = inv.invoice_amount === "" ? null : Number(inv.invoice_amount);
    if (amt != null && (!isFinite(amt) || amt < 0)) return toast.error("Invalid amount");
    const status = newStatus ?? inv.invoice_status;
    const patch: any = {
      invoice_no: inv.invoice_no || null,
      invoice_amount: amt,
      invoice_currency: inv.invoice_currency || "USD",
      invoice_notes: inv.invoice_notes || "",
      invoice_status: status,
    };
    if (status === "issued" && !t?.invoice_issued_at) patch.invoice_issued_at = new Date().toISOString();
    if (status === "paid" && !(t as any)?.invoice_paid_at) patch.invoice_paid_at = new Date().toISOString();
    const { error } = await supabase.from("support_tickets").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Invoice saved");
    if (newStatus) setInv((x) => ({ ...x, invoice_status: newStatus }));
    load();
  };

  const notifyRecipients = async () => {
    if (recipients.length === 0) return toast.error("No active recipients configured");
    setNotifying(true);
    await saveInvoice(inv.invoice_status === "none" ? "issued" : inv.invoice_status);
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("support_ticket_events").insert({
      ticket_id: id, actor_id: u.user?.id ?? null,
      event_type: "invoice_notified",
      to_value: recipients.map(r => r.department).join(", "),
      note: `Invoice ${inv.invoice_no || "(no #)"} notification queued to: ${recipients.map(r => `${r.department} <${r.email}>`).join("; ")}`,
    });
    setNotifying(false);
    toast.success(`Notified ${recipients.length} recipient(s) (UI only)`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/dashboard/admin/helpdesk/tickets"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>
        <Button variant="outline" size="sm" onClick={remove}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-xs text-muted-foreground">{t.ticket_no}</div>
              <CardTitle className="text-lg mt-1">{t.subject}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${toneFor(PRIORITIES, t.priority)} border-0 capitalize`}>{labelFor(PRIORITIES, t.priority, "en")}</Badge>
                <Badge className={`${toneFor(STATUSES, t.status)} border-0 capitalize`}>{labelFor(STATUSES, t.status, "en")}</Badge>
                <span className="text-xs text-muted-foreground">{labelFor(CATEGORIES, t.category, "en")}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 min-w-[260px]">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={t.status} onValueChange={(v) => setField({ status: v as TicketStatus }, `Status → ${v}`)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={t.priority} onValueChange={(v) => setField({ priority: v as TicketPriority }, `Priority → ${v}`)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid sm:grid-cols-3 gap-3">
            {t.branch && <div><div className="text-xs text-muted-foreground">Branch</div><div>{t.branch}</div></div>}
            {t.device_serial && <div><div className="text-xs text-muted-foreground">Device serial</div><div className="font-mono">{t.device_serial}</div></div>}
            <div><div className="text-xs text-muted-foreground">Created</div><div>{new Date(t.created_at).toLocaleString()}</div></div>
          </div>
          {t.description && <div className="bg-muted/50 rounded p-3 whitespace-pre-wrap">{t.description}</div>}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> SLA</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label className="text-xs">SLA Policy</Label>
              <Select value={t.sla_policy_id || "none"} onValueChange={(v) => setField({ sla_policy_id: v === "none" ? null : v } as any, "SLA policy updated")}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem>{slas.map(s => <SelectItem key={s.id} value={s.id}>{s.name_en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground mb-1">First response</div>
                <Badge className={`${slaBadgeTone(respState)} border-0`}>{slaLabel(respState)}</Badge>
                <div className="text-xs mt-1">{t.first_response_at ? `Responded ${new Date(t.first_response_at).toLocaleString()}` : formatRemaining(t.first_response_due_at)}</div>
              </div>
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground mb-1">Resolution</div>
                <Badge className={`${slaBadgeTone(resState)} border-0`}>{slaLabel(resState)}</Badge>
                <div className="text-xs mt-1">{t.resolved_at ? `Resolved ${new Date(t.resolved_at).toLocaleString()}` : formatRemaining(t.resolve_due_at)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCog className="h-4 w-4" /> Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label className="text-xs">Assigned to</Label>
              <Select value={t.assigned_to || "none"} onValueChange={(v) => setField({ assigned_to: v === "none" ? null : v } as any, "Assignee updated")}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {staffUnique.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.role} · {s.user_id.slice(0,8)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><History className="h-3.5 w-3.5" /> History</div>
              <ol className="space-y-1 max-h-32 overflow-y-auto">
                {assignments.length === 0 && <li className="text-xs text-muted-foreground">No reassignments yet.</li>}
                {assignments.map(a => (
                  <li key={a.id} className="text-xs flex justify-between border-b last:border-0 py-1">
                    <span>→ {a.assigned_to ? a.assigned_to.slice(0,8) : "Unassigned"}</span>
                    <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversation" className="w-full">
        <TabsList>
          <TabsTrigger value="conversation"><MessageSquare className="h-4 w-4 mr-1.5" /> Conversation</TabsTrigger>
          <TabsTrigger value="invoice">
            <Receipt className="h-4 w-4 mr-1.5" /> Invoice
            {(inv.invoice_status !== "none" || related.length > 0) && (
              <Badge variant="outline" className="ml-2 h-5 px-1.5 text-[10px] capitalize">
                {inv.invoice_status !== "none" ? inv.invoice_status : `${related.length} related`}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity"><Activity className="h-4 w-4 mr-1.5" /> Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="space-y-4">
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" /> Invoice (optional)</CardTitle>
            {inv.invoice_status !== "none" && (
              <Badge className="capitalize">{inv.invoice_status}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Invoice #</Label>
              <Input value={inv.invoice_no} onChange={(e) => setInv({ ...inv, invoice_no: e.target.value })} placeholder="INV-2026-0001" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount</Label>
              <Input type="number" min={0} step="0.01" value={inv.invoice_amount} onChange={(e) => setInv({ ...inv, invoice_amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Currency</Label>
              <Select value={inv.invoice_currency} onValueChange={(v) => setInv({ ...inv, invoice_currency: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{["USD","EUR","SAR","AED","EGP","GBP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea rows={2} value={inv.invoice_notes} onChange={(e) => setInv({ ...inv, invoice_notes: e.target.value })} placeholder="Parts, labor, billing reference…" maxLength={2000} />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-2 me-auto">
              <Label className="text-xs">Status</Label>
              <Select value={inv.invoice_status} onValueChange={(v) => setInv({ ...inv, invoice_status: v })}>
                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => saveInvoice()}>Save invoice</Button>
            <Button size="sm" onClick={notifyRecipients} disabled={notifying}>
              {notifying ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
              Notify recipients ({recipients.length})
            </Button>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {recipients.length === 0 ? (
              <>No recipients configured — add them under <Link to="/dashboard/admin/helpdesk/invoice-recipients" className="underline">Invoice notification recipients</Link>.</>
            ) : (
              <>Will notify: {recipients.map(r => `${r.department} <${r.email}>`).join(" · ")}</>
            )}
          </div>
          {(t.invoice_issued_at || t.invoice_paid_at) && (
            <div className="text-xs text-muted-foreground flex gap-4 pt-1 border-t">
              {t.invoice_issued_at && <span>Issued {new Date(t.invoice_issued_at).toLocaleString()}</span>}
              {t.invoice_paid_at && <span>Paid {new Date(t.invoice_paid_at).toLocaleString()}</span>}
            </div>
          )}
        </CardContent>
      </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" /> Related invoices for this client</CardTitle>
          </CardHeader>
          <CardContent>
            {related.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other invoiced tickets for this client.</p>
            ) : (
              <div className="divide-y">
                {related.map((r) => (
                  <Link key={r.id} to="/dashboard/admin/helpdesk/tickets/$id" params={{ id: r.id }} className="flex items-center justify-between py-2.5 hover:bg-muted/50 -mx-2 px-2 rounded">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{r.ticket_no}</span>
                        <Badge variant="outline" className="capitalize text-[10px]">{r.invoice_status}</Badge>
                      </div>
                      <div className="text-sm font-medium truncate">{r.subject}</div>
                      <div className="text-xs text-muted-foreground">{r.invoice_no || "no #"} · {new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm font-semibold whitespace-nowrap ml-3">{r.invoice_amount != null ? `${Number(r.invoice_amount).toLocaleString()} ${r.invoice_currency}` : "—"}</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="conversation">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Conversation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {messages.length === 0 && <p className="text-sm text-muted-foreground">No replies yet.</p>}
          {messages.map(m => (
            <div key={m.id} className={`rounded-md border p-3 ${m.is_internal ? "bg-amber-50/60 border-amber-200" : "bg-card"}`}>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{m.is_internal ? "Internal note" : "Reply"}</span>
                <span>{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <div className="text-sm whitespace-pre-wrap">{m.body}</div>
            </div>
          ))}
          <div className="space-y-2 pt-2 border-t">
            <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply or internal note…" maxLength={4000} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={internal} onCheckedChange={setInternal} id="internal" />
                <Label htmlFor="internal" className="text-sm">Internal note (not visible to client)</Label>
              </div>
              <Button onClick={post} disabled={posting || !reply.trim()}>
                {posting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />} Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="activity">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Activity</CardTitle></CardHeader>
        <CardContent>
          <ol className="relative border-l ml-2 space-y-3">
            {events.map(e => (
              <li key={e.id} className="ml-4">
                <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-accent" />
                <div className="text-sm">{e.note || `${e.event_type}: ${e.to_value}`}</div>
                <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
              </li>
            ))}
            {events.length === 0 && <li className="text-sm text-muted-foreground">No activity yet.</li>}
          </ol>
        </CardContent>
      </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}