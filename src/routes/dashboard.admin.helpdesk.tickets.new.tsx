import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PRIORITIES, CATEGORIES, type TicketPriority } from "@/lib/helpdesk";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/helpdesk/tickets/new")({
  head: () => ({ meta: [{ title: "New Ticket — Helpdesk" }] }),
  component: NewTicketPage,
});

function NewTicketPage() {
  const navigate = useNavigate();
  const { t, isRtl } = useAdminT();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    subject: "", category: "general", priority: "medium" as TicketPriority,
    description: "", branch: "", device_serial: "", lang: "en",
  });
  const upd = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(p => ({ ...p, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.subject.trim()) return toast.error(t("subjectRequired"));
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    const { data, error } = await supabase.from("support_tickets").insert({
      ...f, client_id: uid, created_by: uid, status: "new",
    }).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("ticketCreated"));
    navigate({ to: "/dashboard/admin/helpdesk/tickets/$id", params: { id: (data as any).id } });
  };

  return (
    <div className="max-w-3xl space-y-4" dir={isRtl ? "rtl" : "ltr"}>
      <Button asChild variant="ghost" size="sm" className="-ms-2"><Link to="/dashboard/admin/helpdesk/tickets"><ArrowLeft className={`h-4 w-4 me-1 ${isRtl ? "rotate-180" : ""}`} /> {t("back")}</Link></Button>
      <Card>
        <CardHeader><CardTitle>{t("newTicketTitle")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("subjectStar")}</Label>
              <Input value={f.subject} onChange={(e) => upd("subject", e.target.value)} maxLength={200} required />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("categoryLabel")}</Label>
                <Select value={f.category} onValueChange={(v) => upd("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("priorityLabel")}</Label>
                <Select value={f.priority} onValueChange={(v) => upd("priority", v as TicketPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("languageField")}</Label>
                <Select value={f.lang} onValueChange={(v) => upd("lang", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="en">{t("english")}</SelectItem><SelectItem value="ar">{t("arabic")}</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("branch")}</Label><Input value={f.branch} onChange={(e) => upd("branch", e.target.value)} maxLength={120} /></div>
              <div className="space-y-1.5"><Label>{t("deviceSerial")}</Label><Input value={f.device_serial} onChange={(e) => upd("device_serial", e.target.value)} maxLength={120} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("description")}</Label>
              <Textarea rows={6} value={f.description} onChange={(e) => upd("description", e.target.value)} maxLength={4000} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 me-1 animate-spin" />}{t("createTicket")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}