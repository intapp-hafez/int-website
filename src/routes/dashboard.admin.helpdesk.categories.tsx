import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Tag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/admin/helpdesk/categories")({
  head: () => ({ meta: [{ title: "Categories — Helpdesk" }] }),
  component: Page,
});

type Cat = { id: string; value: string; name_en: string; name_ar: string; default_sla_policy_id: string | null; sort_order: number; active: boolean };
type Sla = { id: string; name_en: string };

function Page() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [items, setItems] = useState<Cat[]>([]);
  const [slas, setSlas] = useState<Sla[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Cat> | null>(null);

  const load = async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from("support_categories").select("*").order("sort_order").order("name_en"),
      supabase.from("support_sla_policies").select("id,name_en").order("name_en"),
    ]);
    if (a.error) toast.error(a.error.message);
    setItems((a.data as any[]) ?? []);
    setSlas((b.data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload: any = {
      value: (editing.value || "").trim().toLowerCase().replace(/\s+/g, "_"),
      name_en: editing.name_en || "", name_ar: editing.name_ar || "",
      default_sla_policy_id: editing.default_sla_policy_id || null,
      sort_order: editing.sort_order ?? 0, active: editing.active ?? true,
    };
    if (!payload.value || !payload.name_en) return toast.error("Value and English name are required");
    const q = editing.id
      ? supabase.from("support_categories").update(payload).eq("id", editing.id)
      : supabase.from("support_categories").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(isAr ? "تم الحفظ" : "Saved");
    setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm(isAr ? "حذف هذه الفئة؟" : "Delete this category?")) return;
    const { error } = await supabase.from("support_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Tag className="h-5 w-5" /> {isAr ? "فئات التذاكر" : "Ticket Categories"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "فئات ثنائية اللغة تُستخدم عند إنشاء التذاكر." : "Bilingual categories used when creating tickets."}</p>
        </div>
        <Button onClick={() => setEditing({ active: true, sort_order: items.length })}><Plus className="h-4 w-4 mr-1" /> {isAr ? "إضافة فئة" : "Add category"}</Button>
      </div>
      <Card><CardContent className="p-0">
        {loading ? <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>{isAr ? "المعرّف" : "Value"}</TableHead><TableHead>EN</TableHead><TableHead>AR</TableHead>
              <TableHead>SLA</TableHead><TableHead>{isAr ? "ترتيب" : "Order"}</TableHead><TableHead>{isAr ? "مفعّلة" : "Active"}</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono text-xs">{it.value}</TableCell>
                  <TableCell>{it.name_en}</TableCell>
                  <TableCell dir="rtl">{it.name_ar}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{slas.find(s => s.id === it.default_sla_policy_id)?.name_en || "—"}</TableCell>
                  <TableCell>{it.sort_order}</TableCell>
                  <TableCell>{it.active ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(it)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">{isAr ? "لا توجد فئات بعد." : "No categories yet."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? (isAr ? "تعديل فئة" : "Edit category") : (isAr ? "فئة جديدة" : "New category")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>{isAr ? "المعرّف (slug)" : "Value (slug)"}</Label><Input value={editing?.value || ""} onChange={(e) => setEditing({ ...editing!, value: e.target.value })} placeholder="networking" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{isAr ? "الاسم (إنجليزي)" : "Name (EN)"}</Label><Input value={editing?.name_en || ""} onChange={(e) => setEditing({ ...editing!, name_en: e.target.value })} /></div>
              <div><Label>{isAr ? "الاسم (عربي)" : "Name (AR)"}</Label><Input dir="rtl" value={editing?.name_ar || ""} onChange={(e) => setEditing({ ...editing!, name_ar: e.target.value })} /></div>
            </div>
            <div><Label>{isAr ? "اتفاقية مستوى الخدمة الافتراضية" : "Default SLA"}</Label>
              <Select value={editing?.default_sla_policy_id || "none"} onValueChange={(v) => setEditing({ ...editing!, default_sla_policy_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">{isAr ? "بدون (استخدم الأولوية الافتراضية)" : "None (use priority default)"}</SelectItem>{slas.map(s => <SelectItem key={s.id} value={s.id}>{s.name_en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2 items-end">
              <div><Label>{isAr ? "ترتيب الفرز" : "Sort order"}</Label><Input type="number" value={editing?.sort_order ?? 0} onChange={(e) => setEditing({ ...editing!, sort_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pb-2"><Switch checked={editing?.active ?? true} onCheckedChange={(v) => setEditing({ ...editing!, active: v })} /> <Label>{isAr ? "مفعّلة" : "Active"}</Label></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setEditing(null)}>{isAr ? "إلغاء" : "Cancel"}</Button><Button onClick={save}>{isAr ? "حفظ" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
