import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/admin/helpdesk/invoice-recipients")({
  head: () => ({ meta: [{ title: "Invoice notification recipients" }] }),
  component: Page,
});

type Row = { id: string; department: string; email: string; active: boolean; sort_order: number };

function Page() {
  const _perms = useCurrentPagePerms();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_invoice_recipients")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("department", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.department?.trim() || !editing?.email?.trim()) return toast.error(isAr ? "القسم والبريد الإلكتروني مطلوبان" : "Department and email required");
    const payload = {
      department: editing.department!.trim(),
      email: editing.email!.trim(),
      active: editing.active ?? true,
      sort_order: editing.sort_order ?? 0,
    };
    const q = editing.id
      ? supabase.from("support_invoice_recipients").update(payload).eq("id", editing.id)
      : supabase.from("support_invoice_recipients").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(isAr ? "تم الحفظ" : "Saved");
    setOpen(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm(isAr ? "إزالة هذا المستلم؟" : "Remove this recipient?")) return;
    const { error } = await supabase.from("support_invoice_recipients").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const toggle = async (r: Row) => {
    const { error } = await supabase.from("support_invoice_recipients").update({ active: !r.active }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><Mail className="h-5 w-5" /> {isAr ? "مستلمو إشعارات الفواتير" : "Invoice notification recipients"}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "عند إصدار فاتورة على تذكرة، تُرسل إشعارات إلى هذه العناوين (المبيعات، المالية، إلخ)." : "When an invoice is issued on a ticket, these inboxes are notified (Sales, Finance, etc.)."}</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing({ active: true, sort_order: 0 })}><Plus className="h-4 w-4 mr-1" /> {isAr ? "إضافة مستلم" : "Add recipient"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing?.id ? (isAr ? "تعديل مستلم" : "Edit recipient") : (isAr ? "إضافة مستلم" : "Add recipient")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>{isAr ? "القسم" : "Department"}</Label><Input value={editing?.department ?? ""} onChange={(e) => setEditing({ ...editing!, department: e.target.value })} placeholder={isAr ? "المبيعات / المالية / المحاسبة" : "Sales / Finance / Accounting"} /></div>
                <div className="space-y-1.5"><Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label><Input type="email" value={editing?.email ?? ""} onChange={(e) => setEditing({ ...editing!, email: e.target.value })} placeholder="sales@example.com" /></div>
                <div className="flex items-center gap-2"><Switch checked={editing?.active ?? true} onCheckedChange={(v) => setEditing({ ...editing!, active: v })} id="act" /><Label htmlFor="act">{isAr ? "مفعّل" : "Active"}</Label></div>
                <div className="space-y-1.5"><Label>{isAr ? "ترتيب الفرز" : "Sort order"}</Label><Input type="number" value={editing?.sort_order ?? 0} onChange={(e) => setEditing({ ...editing!, sort_order: Number(e.target.value) })} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button><Button onClick={save}>{isAr ? "حفظ" : "Save"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></div> : (
            <Table>
              <TableHeader><TableRow><TableHead>{isAr ? "القسم" : "Department"}</TableHead><TableHead>{isAr ? "البريد الإلكتروني" : "Email"}</TableHead><TableHead className="w-24">{isAr ? "مفعّل" : "Active"}</TableHead><TableHead className="w-20">{isAr ? "الترتيب" : "Order"}</TableHead><TableHead className="w-32 text-right">{isAr ? "إجراءات" : "Actions"}</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">{isAr ? "لا يوجد مستلمون بعد." : "No recipients yet."}</TableCell></TableRow>}
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.department}</TableCell>
                    <TableCell className="font-mono text-xs">{r.email}</TableCell>
                    <TableCell><Switch checked={r.active} onCheckedChange={() => toggle(r)} /></TableCell>
                    <TableCell>{r.sort_order}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>{isAr ? "تعديل" : "Edit"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}