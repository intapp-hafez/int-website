import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/admin/helpdesk/branches")({
  head: () => ({ meta: [{ title: "Branches — Helpdesk" }] }),
  component: Page,
});

type Branch = { id: string; code: string; name_en: string; name_ar: string; address: string; active: boolean; sort_order: number };

function Page() {
  const _perms = useCurrentPagePerms();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Branch> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("support_branches").select("*").order("sort_order").order("name_en");
    if (error) toast.error(error.message);
    setItems((data as any[]) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const p: any = {
      code: (editing.code || "").trim().toUpperCase(),
      name_en: editing.name_en || "", name_ar: editing.name_ar || "",
      address: editing.address || "", active: editing.active ?? true, sort_order: editing.sort_order ?? 0,
    };
    if (!p.code || !p.name_en) return toast.error(isAr ? "الرمز والاسم الإنجليزي مطلوبان" : "Code and English name are required");
    const q = editing.id ? supabase.from("support_branches").update(p).eq("id", editing.id) : supabase.from("support_branches").insert(p);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(isAr ? "تم الحفظ" : "Saved"); setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm(isAr ? "حذف هذا الفرع؟" : "Delete this branch?")) return;
    const { error } = await supabase.from("support_branches").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Building2 className="h-5 w-5" /> {isAr ? "الفروع" : "Branches"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "مواقع ومكاتب العملاء المستخدمة عند فتح التذاكر." : "Customer sites and offices used when opening tickets."}</p>
        </div>
        <Button onClick={() => setEditing({ active: true, sort_order: items.length })}><Plus className="h-4 w-4 mr-1" /> {isAr ? "إضافة فرع" : "Add branch"}</Button>
      </div>
      <Card><CardContent className="p-0">
        {loading ? <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>{isAr ? "الرمز" : "Code"}</TableHead><TableHead>EN</TableHead><TableHead>AR</TableHead><TableHead>{isAr ? "العنوان" : "Address"}</TableHead><TableHead>{isAr ? "مفعّل" : "Active"}</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono text-xs">{it.code}</TableCell>
                  <TableCell>{it.name_en}</TableCell>
                  <TableCell dir="rtl">{it.name_ar}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">{it.address}</TableCell>
                  <TableCell>{it.active ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(it)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">{isAr ? "لا توجد فروع بعد." : "No branches yet."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? (isAr ? "تعديل فرع" : "Edit branch") : (isAr ? "فرع جديد" : "New branch")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>{isAr ? "الرمز" : "Code"}</Label><Input value={editing?.code || ""} onChange={(e) => setEditing({ ...editing!, code: e.target.value })} placeholder="CAI-HQ" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{isAr ? "الاسم (إنجليزي)" : "Name (EN)"}</Label><Input value={editing?.name_en || ""} onChange={(e) => setEditing({ ...editing!, name_en: e.target.value })} /></div>
              <div><Label>{isAr ? "الاسم (عربي)" : "Name (AR)"}</Label><Input dir="rtl" value={editing?.name_ar || ""} onChange={(e) => setEditing({ ...editing!, name_ar: e.target.value })} /></div>
            </div>
            <div><Label>{isAr ? "العنوان" : "Address"}</Label><Input value={editing?.address || ""} onChange={(e) => setEditing({ ...editing!, address: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={editing?.active ?? true} onCheckedChange={(v) => setEditing({ ...editing!, active: v })} /> <Label>{isAr ? "مفعّل" : "Active"}</Label></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setEditing(null)}>{isAr ? "إلغاء" : "Cancel"}</Button><Button onClick={save}>{isAr ? "حفظ" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
