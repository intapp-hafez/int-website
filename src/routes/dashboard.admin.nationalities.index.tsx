import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { useEffect, useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { useAdminT } from "@/lib/admin-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Globe, Loader2, Search, Download, Upload, Sparkles, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { listNationalities, saveNationality, deleteNationality, bulkSaveNationalities, type SysNationality } from "@/lib/admin-lookups.functions";
import { DEFAULT_NATIONALITIES } from "@/data/default-lookups";

export const Route = createFileRoute("/dashboard/admin/nationalities/")({
  head: () => ({ meta: [{ title: "Nationalities — Admin" }] }),
  component: NationalitiesPage,
});

function NationalitiesPage() {
  const _perms = useCurrentPagePerms();
  const { lang } = useAdminT();
  const isAr = lang === "ar";

  const [data, setData] = useState<SysNationality[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<SysNationality | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
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

  useEffect(() => {
    void fetch();
  }, []);

  const filtered = useMemo(() => {
    return data.filter(
      (d) =>
        !q ||
        (d.name_en?.toLowerCase().includes(q.toLowerCase()) || false) ||
        (d.name_ar?.toLowerCase().includes(q.toLowerCase()) || false)
    );
  }, [data, q]);

  const onSave = async () => {
    if (!editing) return;
    if (!editing.name_en) {
      toast.error(isAr ? "يرجى إدخال اسم الجنسية" : "Please enter nationality name");
      return;
    }
    try {
      setSubmitting(true);
      const saved = await saveNationality({
        ...editing,
        name_en: editing.name_en.trim(),
        name_ar: (editing.name_ar || editing.name_en).trim(),
      });
      toast.success(isAr ? "تم الحفظ بنجاح" : "Saved successfully");
      setEditing(null);
      setData((prev) => {
        const idx = prev.findIndex((x) => x.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save nationality");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (nat: SysNationality, nextActive: boolean) => {
    // Optimistic update
    setData((prev) => prev.map((x) => (x.id === nat.id ? { ...x, is_active: nextActive } : x)));
    try {
      await saveNationality({ ...nat, is_active: nextActive });
      toast.success(
        isAr
          ? nextActive ? "تم تفعيل الجنسية" : "تم تعطيل الجنسية"
          : nextActive ? "Nationality activated" : "Nationality deactivated"
      );
    } catch (err: any) {
      // Revert on error
      setData((prev) => prev.map((x) => (x.id === nat.id ? { ...x, is_active: nat.is_active } : x)));
      toast.error(err.message || "Failed to update status");
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(isAr ? `هل أنت متأكد من حذف "${name}"؟` : `Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteNationality(id);
      toast.success(isAr ? "تم الحذف بنجاح" : "Deleted successfully");
      setData((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await bulkSaveNationalities(DEFAULT_NATIONALITIES);
      toast.success(
        isAr
          ? `تم تحميل ${res.length} جنسية قياسية بنجاح!`
          : `Loaded ${res.length} standard nationalities successfully!`
      );
      void fetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to seed nationalities");
    } finally {
      setSeeding(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Name (English)": "Saudi", "Name (Arabic)": "سعودي" },
      { "Name (English)": "Emirati", "Name (Arabic)": "إماراتي" },
      { "Name (English)": "Egyptian", "Name (Arabic)": "مصري" },
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
          const nEn = row["Name (English)"] || row["name_en"] || row["Nationality"];
          const nAr = row["Name (Arabic)"] || row["name_ar"] || row["الجنسية"];

          if (nEn) {
            toInsert.push({
              name_en: String(nEn).trim(),
              name_ar: String(nAr || nEn).trim(),
              is_active: true,
            });
          }
        }

        if (toInsert.length > 0) {
          await bulkSaveNationalities(toInsert);
          toast.success(isAr ? `تم استيراد ${toInsert.length} جنسية بنجاح` : `Successfully imported ${toInsert.length} nationalities`);
          void fetch();
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
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" /> {isAr ? "الجنسيات" : "Nationalities"}
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {data.length} {isAr ? "جنسية" : "Items"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? "إدارة الجنسيات المتزامنة تلقائيًا مع استمارات التوظيف وملفات المستخدمين."
              : "Manage nationalities dynamically synchronized across Careers and User Profiles."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {data.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              disabled={seeding || loading}
              className="text-xs shadow-xs"
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" /> : <Sparkles className="h-3.5 w-3.5 text-accent me-1.5" />}
              {isAr ? "تحميل الجنسيات القياسية" : "Load Standard Nationalities"}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={submitting}>
            <Download className="h-4 w-4 me-1.5" /> {isAr ? "القالب" : "Template"}
          </Button>

          <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 me-1.5 animate-spin" /> : <Upload className="h-4 w-4 me-1.5" />}
            {isAr ? "استيراد Excel" : "Import Excel"}
          </Button>

          <Button variant="outline" size="sm" onClick={() => fetch()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 me-1.5 ${loading ? "animate-spin" : ""}`} />
            {isAr ? "تحديث" : "Refresh"}
          </Button>

          <Button
            size="sm"
            onClick={() => setEditing({ id: "new", name_en: "", name_ar: "", is_active: true })}
            disabled={!_perms.add || submitting}
          >
            <Plus className="h-4 w-4 me-1.5" /> {isAr ? "إضافة جنسية" : "Add Nationality"}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 h-9 text-xs"
          placeholder={isAr ? "بحث بالجنسية..." : "Search nationalities..."}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Nationalities Table */}
      <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">{isAr ? "الاسم (EN)" : "Name (EN)"}</th>
                <th className="px-4 py-3">{isAr ? "الاسم (AR)" : "Name (AR)"}</th>
                <th className="px-4 py-3 text-center">{isAr ? "نشط" : "Active"}</th>
                <th className="px-4 py-3 text-end">{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{isAr ? "جاري تحميل الجنسيات..." : "Loading nationalities..."}</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    {isAr ? "لا توجد نتائج مطابقة." : "No nationalities found."}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{row.name_en}</td>
                    <td className="px-4 py-3" dir="rtl">{row.name_ar}</td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={row.is_active}
                        onCheckedChange={(v) => toggleActive(row, v)}
                        disabled={!_perms.edit}
                      />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          disabled={!_perms.edit}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditing(row)}
                          title="Edit nationality"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          disabled={!_perms.delete}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(row.id, `${row.name_en} / ${row.name_ar}`)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing?.id === "new"
                ? (isAr ? "إضافة جنسية جديدة" : "New Nationality")
                : (isAr ? "تعديل الجنسية" : "Edit Nationality")}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name (English) *</Label>
                  <Input
                    value={editing.name_en}
                    onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                    placeholder="e.g. Saudi"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input
                    value={editing.name_ar}
                    onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })}
                    placeholder="مثال: سعودي"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="nat-active"
                  checked={editing.is_active}
                  onCheckedChange={(c) => setEditing({ ...editing, is_active: !!c })}
                />
                <Label htmlFor="nat-active" className="cursor-pointer">
                  {isAr ? "نشط (يظهر في قوائم الاختيار)" : "Active (visible in public dropdowns)"}
                </Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={onSave} disabled={!_perms.edit || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : null}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
