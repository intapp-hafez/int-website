import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useAdminT } from "@/lib/admin-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Globe, Loader2, Search, Download, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { listNationalities, saveNationality, deleteNationality, bulkSaveNationalities, type SysNationality } from "@/lib/admin-lookups.functions";

export const Route = createFileRoute("/dashboard/admin/nationalities/")({
  head: () => ({ meta: [{ title: "Nationalities — Admin" }] }),
  component: NationalitiesPage,
});

function NationalitiesPage() {
  const { t, lang } = useAdminT();
  const isAr = lang === "ar";
  
  const [data, setData] = useState<SysNationality[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<SysNationality | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await listNationalities();
      setData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load nationalities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = data.filter(d => 
    (d.name_en?.toLowerCase().includes(q.toLowerCase()) || false) ||
    (d.name_ar?.toLowerCase().includes(q.toLowerCase()) || false)
  );

  const onSave = async () => {
    if (!editing) return;
    if (!editing.name_en) {
      toast.error(isAr ? "يرجى إدخال اسم الجنسية" : "Please enter nationality name");
      return;
    }
    try {
      setSubmitting(true);
      await saveNationality(editing);
      toast.success(isAr ? "تم الحفظ بنجاح" : "Saved successfully");
      setEditing(null);
      fetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete this?")) return;
    try {
      await deleteNationality(id);
      toast.success(isAr ? "تم الحذف بنجاح" : "Deleted successfully");
      fetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Name (English)": "Saudi", "Name (Arabic)": "سعودي" },
      { "Name (English)": "Emirati", "Name (Arabic)": "إماراتي" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nationalities");
    XLSX.writeFile(wb, "Nationalities_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);

        const toInsert: Partial<SysNationality>[] = [];
        for (const row of rows) {
          const nEn = row["Name (English)"] || row["name_en"];
          const nAr = row["Name (Arabic)"] || row["name_ar"];

          if (nEn) {
            toInsert.push({
              name_en: String(nEn).trim(),
              name_ar: String(nAr || nEn).trim(),
              is_active: true
            });
          }
        }
        
        if (toInsert.length > 0) {
          await bulkSaveNationalities(toInsert);
          toast.success(isAr ? `تم استيراد ${toInsert.length} جنسية بنجاح` : `Successfully imported ${toInsert.length} nationalities`);
          fetch();
        } else {
          toast.error(isAr ? "لم يتم العثور على بيانات صحيحة في الملف" : "No valid data found in file");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to process excel file");
      } finally {
        setSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> {isAr ? "الجنسيات" : "Nationalities"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? "إدارة الجنسيات المستخدمة في النماذج" : "Manage nationalities used in forms."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={handleDownloadTemplate} disabled={submitting}>
            <Download className="h-4 w-4 me-2" /> {isAr ? "تحميل القالب" : "Download Template"}
          </Button>
          <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Upload className="h-4 w-4 me-2" />} 
            {isAr ? "استيراد ملف Excel" : "Import Excel"}
          </Button>
          <Button onClick={() => setEditing({ id: "new", name_en: "", name_ar: "", is_active: true })} disabled={submitting}>
            <Plus className="h-4 w-4 me-2" /> {isAr ? "إضافة جنسية" : "Add Nationality"}
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-9" 
          placeholder={isAr ? "بحث..." : "Search..."} 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm text-left rtl:text-right">
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{isAr ? "الاسم (EN)" : "Name (EN)"}</th>
              <th className="px-4 py-3">{isAr ? "الاسم (AR)" : "Name (AR)"}</th>
              <th className="px-4 py-3 text-center">{isAr ? "نشط" : "Active"}</th>
              <th className="px-4 py-3 text-end">{isAr ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results found"}</td></tr>
            ) : filtered.map(row => (
              <tr key={row.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{row.name_en}</td>
                <td className="px-4 py-3">{row.name_ar}</td>
                <td className="px-4 py-3 text-center">
                  <div className={`inline-flex w-2 h-2 rounded-full ${row.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                </td>
                <td className="px-4 py-3 text-end space-x-2 space-x-reverse">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(row)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(row.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id === "new" ? (isAr ? "جنسية جديدة" : "New Nationality") : (isAr ? "تعديل الجنسية" : "Edit Nationality")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name (English) *</Label>
                  <Input value={editing.name_en} onChange={e => setEditing({...editing, name_en: e.target.value})} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input value={editing.name_ar} onChange={e => setEditing({...editing, name_ar: e.target.value})} dir="rtl" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox id="nat-active" checked={editing.is_active} onCheckedChange={c => setEditing({...editing, is_active: !!c})} />
                <Label htmlFor="nat-active">{isAr ? "نشط (يظهر في القوائم)" : "Active (visible in dropdowns)"}</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={onSave} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
