import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useAdminT } from "@/lib/admin-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, MapPin, Loader2, Search, Download, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { listLocations, saveLocation, deleteLocation, bulkSaveLocations, type SysLocation } from "@/lib/admin-lookups.functions";

export const Route = createFileRoute("/dashboard/admin/locations/")({
  head: () => ({ meta: [{ title: "Locations — Admin" }] }),
  component: LocationsPage,
});

function LocationsPage() {
  const { t, lang } = useAdminT();
  const isAr = lang === "ar";
  
  const [data, setData] = useState<SysLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<SysLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await listLocations();
      setData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = data.filter(d => 
    (d.country_en?.toLowerCase().includes(q.toLowerCase()) || false) ||
    (d.country_ar?.toLowerCase().includes(q.toLowerCase()) || false) ||
    (d.city_en?.toLowerCase().includes(q.toLowerCase()) || false) ||
    (d.city_ar?.toLowerCase().includes(q.toLowerCase()) || false)
  );

  const onSave = async () => {
    if (!editing) return;
    if (!editing.country_en || !editing.city_en) {
      toast.error(isAr ? "يرجى تعبئة الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    try {
      setSubmitting(true);
      await saveLocation(editing);
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
      await deleteLocation(id);
      toast.success(isAr ? "تم الحذف بنجاح" : "Deleted successfully");
      fetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Country (English)": "Saudi Arabia", "Country (Arabic)": "السعودية", "City (English)": "Riyadh", "City (Arabic)": "الرياض" },
      { "Country (English)": "United Arab Emirates", "Country (Arabic)": "الإمارات العربية المتحدة", "City (English)": "Dubai", "City (Arabic)": "دبي" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Locations");
    XLSX.writeFile(wb, "Locations_Template.xlsx");
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

        const toInsert: Partial<SysLocation>[] = [];
        for (const row of rows) {
          const cEn = row["Country (English)"] || row["country_en"];
          const cAr = row["Country (Arabic)"] || row["country_ar"];
          const ciEn = row["City (English)"] || row["city_en"];
          const ciAr = row["City (Arabic)"] || row["city_ar"];

          if (cEn && ciEn) {
            toInsert.push({
              country_en: String(cEn).trim(),
              country_ar: String(cAr || cEn).trim(),
              city_en: String(ciEn).trim(),
              city_ar: String(ciAr || ciEn).trim(),
              is_active: true
            });
          }
        }
        
        if (toInsert.length > 0) {
          await bulkSaveLocations(toInsert);
          toast.success(isAr ? `تم استيراد ${toInsert.length} موقع بنجاح` : `Successfully imported ${toInsert.length} locations`);
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
            <MapPin className="h-6 w-6 text-primary" /> {isAr ? "المواقع (الدول والمدن)" : "Locations (Countries & Cities)"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? "إدارة المواقع الجغرافية المستخدمة في النظام مثل نماذج التوظيف" : "Manage geographical locations used across the system (e.g. career application forms)."}
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
          <Button onClick={() => setEditing({ id: "new", country_en: "", country_ar: "", city_en: "", city_ar: "", is_active: true })} disabled={submitting}>
            <Plus className="h-4 w-4 me-2" /> {isAr ? "إضافة موقع جديد" : "Add New Location"}
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-9" 
          placeholder={isAr ? "بحث بالدولة أو المدينة..." : "Search by country or city..."} 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm text-left rtl:text-right">
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{isAr ? "الدولة (EN)" : "Country (EN)"}</th>
              <th className="px-4 py-3">{isAr ? "الدولة (AR)" : "Country (AR)"}</th>
              <th className="px-4 py-3">{isAr ? "المدينة (EN)" : "City (EN)"}</th>
              <th className="px-4 py-3">{isAr ? "المدينة (AR)" : "City (AR)"}</th>
              <th className="px-4 py-3 text-center">{isAr ? "نشط" : "Active"}</th>
              <th className="px-4 py-3 text-end">{isAr ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results found"}</td></tr>
            ) : filtered.map(row => (
              <tr key={row.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{row.country_en}</td>
                <td className="px-4 py-3">{row.country_ar}</td>
                <td className="px-4 py-3">{row.city_en}</td>
                <td className="px-4 py-3">{row.city_ar}</td>
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
            <DialogTitle>{editing?.id === "new" ? (isAr ? "موقع جديد" : "New Location") : (isAr ? "تعديل الموقع" : "Edit Location")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country (English) *</Label>
                  <Input value={editing.country_en} onChange={e => setEditing({...editing, country_en: e.target.value})} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>الدولة (عربي)</Label>
                  <Input value={editing.country_ar} onChange={e => setEditing({...editing, country_ar: e.target.value})} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>City (English) *</Label>
                  <Input value={editing.city_en} onChange={e => setEditing({...editing, city_en: e.target.value})} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>المدينة (عربي)</Label>
                  <Input value={editing.city_ar} onChange={e => setEditing({...editing, city_ar: e.target.value})} dir="rtl" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox id="loc-active" checked={editing.is_active} onCheckedChange={c => setEditing({...editing, is_active: !!c})} />
                <Label htmlFor="loc-active">{isAr ? "موقع نشط (يظهر في القوائم)" : "Active location (visible in dropdowns)"}</Label>
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
