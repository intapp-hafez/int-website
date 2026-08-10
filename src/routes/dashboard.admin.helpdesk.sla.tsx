import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PRIORITIES } from "@/lib/helpdesk";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/admin/helpdesk/sla")({
  head: () => ({ meta: [{ title: "SLA Policies — Helpdesk" }] }),
  component: Page,
});

type Sla = { id: string; name_en: string; name_ar: string; priority: string; first_response_minutes: number; resolve_minutes: number; business_hours_only: boolean; active: boolean; sort_order: number };

function Page() {
  const _perms = useCurrentPagePerms();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [items, setItems] = useState<Sla[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Sla> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("support_sla_policies").select("*").order("priority").order("sort_order");
    if (error) toast.error(error.message);
    setItems((data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const p: any = {
      name_en: editing.name_en || "", name_ar: editing.name_ar || "",
      priority: editing.priority || "medium",
      first_response_minutes: Number(editing.first_response_minutes ?? 60),
      resolve_minutes: Number(editing.resolve_minutes ?? 480),
      business_hours_only: !!editing.business_hours_only,
      active: editing.active ?? true, sort_order: editing.sort_order ?? 0,
    };
    if (!p.name_en) return toast.error("English name is required");
    const q = editing.id ? supabase.from("support_sla_policies").update(p).eq("id", editing.id) : supabase.from("support_sla_policies").insert(p);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(isAr ? "تم الحفظ" : "Saved"); setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm(isAr ? "حذف سياسة SLA هذه؟" : "Delete this SLA policy?")) return;
    const { error } = await supabase.from("support_sla_policies").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  const fmt = (m: number) => m >= 60 ? `${(m/60).toFixed(m%60?1:0)}h` : `${m}m`;

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Clock className="h-5 w-5" /> {isAr ? "سياسات اتفاقية مستوى الخدمة" : "SLA Policies"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "أهداف الاستجابة والحل المطبَّقة على التذاكر الجديدة حسب الأولوية." : "Response and resolve targets applied to new tickets by priority."}</p>
        </div>
        <Button disabled={!_perms.add} onClick={() => setEditing({ priority: "medium", first_response_minutes: 60, resolve_minutes: 480, active: true })}><Plus className="h-4 w-4 mr-1" /> {isAr ? "إضافة سياسة" : "Add policy"}</Button>
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>{isAr ? "الاسم" : "Name"}</TableHead><TableHead>{isAr ? "الأولوية" : "Priority"}</TableHead><TableHead>{isAr ? "أول استجابة" : "1st response"}</TableHead><TableHead>{isAr ? "الحل" : "Resolve"}</TableHead><TableHead>{isAr ? "الساعات" : "Hours"}</TableHead><TableHead>{isAr ? "مفعّلة" : "Active"}</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell><div>{it.name_en}</div><div className="text-xs text-muted-foreground" dir="rtl">{it.name_ar}</div></TableCell>
                  <TableCell className="capitalize">{it.priority}</TableCell>
                  <TableCell>{fmt(it.first_response_minutes)}</TableCell>
                  <TableCell>{fmt(it.resolve_minutes)}</TableCell>
                  <TableCell className="text-xs">{it.business_hours_only ? (isAr ? "ساعات العمل" : "Business") : "24/7"}</TableCell>
                  <TableCell>{it.active ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}</TableCell>
                  <TableCell className="text-right">
                    <Button disabled={!_perms.edit} size="sm" variant="ghost" onClick={() => setEditing(it)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button disabled={!_perms.delete} size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">{isAr ? "لا توجد سياسات بعد. أضف سياسة لكل أولوية لبدء تتبع الأهداف." : "No SLA policies yet. Add one per priority to start tracking targets."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? (isAr ? "تعديل سياسة SLA" : "Edit SLA policy") : (isAr ? "سياسة SLA جديدة" : "New SLA policy")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{isAr ? "الاسم (إنجليزي)" : "Name (EN)"}</Label><Input value={editing?.name_en || ""} onChange={(e) => setEditing({ ...editing!, name_en: e.target.value })} /></div>
              <div><Label>{isAr ? "الاسم (عربي)" : "Name (AR)"}</Label><Input dir="rtl" value={editing?.name_ar || ""} onChange={(e) => setEditing({ ...editing!, name_ar: e.target.value })} /></div>
            </div>
            <div><Label>{isAr ? "الأولوية" : "Priority"}</Label>
              <Select value={editing?.priority || "medium"} onValueChange={(v) => setEditing({ ...editing!, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{isAr ? (p as any).ar ?? p.en : p.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{isAr ? "أول استجابة (دقائق)" : "First response (minutes)"}</Label><Input type="number" min={1} value={editing?.first_response_minutes ?? 60} onChange={(e) => setEditing({ ...editing!, first_response_minutes: Number(e.target.value) })} /></div>
              <div><Label>{isAr ? "الحل (دقائق)" : "Resolve (minutes)"}</Label><Input type="number" min={1} value={editing?.resolve_minutes ?? 480} onChange={(e) => setEditing({ ...editing!, resolve_minutes: Number(e.target.value) })} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={!!editing?.business_hours_only} onCheckedChange={(v) => setEditing({ ...editing!, business_hours_only: v })} /> <Label>{isAr ? "ساعات العمل فقط" : "Business hours only"}</Label></div>
            <div className="flex items-center gap-2"><Switch checked={editing?.active ?? true} onCheckedChange={(v) => setEditing({ ...editing!, active: v })} /> <Label>{isAr ? "مفعّلة" : "Active"}</Label></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setEditing(null)}>{isAr ? "إلغاء" : "Cancel"}</Button><Button disabled={!_perms.edit} onClick={save}>{isAr ? "حفظ" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
