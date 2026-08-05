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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Cpu, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/admin/helpdesk/devices")({
  head: () => ({ meta: [{ title: "Devices — Helpdesk" }] }),
  component: Page,
});

type Device = { id: string; serial: string; name: string; model: string; branch_id: string | null; active: boolean; notes: string };
type Branch = { id: string; name_en: string; code: string };

function Page() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [items, setItems] = useState<Device[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Device> | null>(null);

  const load = async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from("support_devices").select("*").order("name"),
      supabase.from("support_branches").select("id,name_en,code").order("name_en"),
    ]);
    if (a.error) toast.error(a.error.message);
    setItems((a.data as any[]) ?? []); setBranches((b.data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const p: any = {
      serial: (editing.serial || "").trim().toUpperCase(),
      name: editing.name || "", model: editing.model || "",
      branch_id: editing.branch_id || null, active: editing.active ?? true, notes: editing.notes || "",
    };
    if (!p.serial) return toast.error(isAr ? "الرقم التسلسلي مطلوب" : "Serial is required");
    const q = editing.id ? supabase.from("support_devices").update(p).eq("id", editing.id) : supabase.from("support_devices").insert(p);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(isAr ? "تم الحفظ" : "Saved"); setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm(isAr ? "حذف هذا الجهاز؟" : "Delete this device?")) return;
    const { error } = await supabase.from("support_devices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Cpu className="h-5 w-5" /> {isAr ? "الأجهزة" : "Devices"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "الأجهزة المُدارة المُشار إليها بالرقم التسلسلي في التذاكر." : "Managed devices referenced by serial number on tickets."}</p>
        </div>
        <Button onClick={() => setEditing({ active: true })}><Plus className="h-4 w-4 mr-1" /> {isAr ? "إضافة جهاز" : "Add device"}</Button>
      </div>
      <Card><CardContent className="p-0">
        {loading ? <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>{isAr ? "الرقم التسلسلي" : "Serial"}</TableHead><TableHead>{isAr ? "الاسم" : "Name"}</TableHead><TableHead>{isAr ? "الموديل" : "Model"}</TableHead><TableHead>{isAr ? "الفرع" : "Branch"}</TableHead><TableHead>{isAr ? "مفعّل" : "Active"}</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono text-xs">{it.serial}</TableCell>
                  <TableCell>{it.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{it.model}</TableCell>
                  <TableCell className="text-xs">{branches.find(b => b.id === it.branch_id)?.name_en || "—"}</TableCell>
                  <TableCell>{it.active ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(it)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">{isAr ? "لا توجد أجهزة بعد." : "No devices yet."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? (isAr ? "تعديل جهاز" : "Edit device") : (isAr ? "جهاز جديد" : "New device")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>{isAr ? "الرقم التسلسلي" : "Serial"}</Label><Input value={editing?.serial || ""} onChange={(e) => setEditing({ ...editing!, serial: e.target.value })} placeholder="SW-5542" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{isAr ? "الاسم" : "Name"}</Label><Input value={editing?.name || ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
              <div><Label>{isAr ? "الموديل" : "Model"}</Label><Input value={editing?.model || ""} onChange={(e) => setEditing({ ...editing!, model: e.target.value })} /></div>
            </div>
            <div><Label>{isAr ? "الفرع" : "Branch"}</Label>
              <Select value={editing?.branch_id || "none"} onValueChange={(v) => setEditing({ ...editing!, branch_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">{isAr ? "بدون" : "None"}</SelectItem>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name_en} ({b.code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{isAr ? "ملاحظات" : "Notes"}</Label><Textarea rows={2} value={editing?.notes || ""} onChange={(e) => setEditing({ ...editing!, notes: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={editing?.active ?? true} onCheckedChange={(v) => setEditing({ ...editing!, active: v })} /> <Label>{isAr ? "مفعّل" : "Active"}</Label></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setEditing(null)}>{isAr ? "إلغاء" : "Cancel"}</Button><Button onClick={save}>{isAr ? "حفظ" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
