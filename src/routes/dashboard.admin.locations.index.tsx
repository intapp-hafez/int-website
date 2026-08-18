import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { useEffect, useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { useAdminT } from "@/lib/admin-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, MapPin, Loader2, Search, Download, Upload, Sparkles, RefreshCw, Globe2, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { listLocations, saveLocation, deleteLocation, bulkSaveLocations, type SysLocation } from "@/lib/admin-lookups.functions";
import { DEFAULT_LOCATIONS } from "@/data/default-lookups";

export const Route = createFileRoute("/dashboard/admin/locations/")({
  head: () => ({ meta: [{ title: "Locations — Admin" }] }),
  component: LocationsPage,
});

function LocationsPage() {
  const _perms = useCurrentPagePerms();
  const { lang } = useAdminT();
  const isAr = lang === "ar";

  const [data, setData] = useState<SysLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [editing, setEditing] = useState<SysLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
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

  useEffect(() => {
    void fetch();
  }, []);

  const uniqueCountries = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => {
      if (d.country_en) set.add(d.country_en);
    });
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchesSearch =
        !q ||
        (d.country_en?.toLowerCase().includes(q.toLowerCase()) || false) ||
        (d.country_ar?.toLowerCase().includes(q.toLowerCase()) || false) ||
        (d.city_en?.toLowerCase().includes(q.toLowerCase()) || false) ||
        (d.city_ar?.toLowerCase().includes(q.toLowerCase()) || false);

      const matchesCountry = selectedCountry === "all" || d.country_en === selectedCountry;

      return matchesSearch && matchesCountry;
    });
  }, [data, q, selectedCountry]);

  const onSave = async () => {
    if (!editing) return;
    if (!editing.country_en || !editing.city_en) {
      toast.error(isAr ? "يرجى تعبئة الحقول المطلوبة (الدولة والمدينة)" : "Please fill required fields (Country & City)");
      return;
    }
    try {
      setSubmitting(true);
      const saved = await saveLocation({
        ...editing,
        country_en: editing.country_en.trim(),
        country_ar: (editing.country_ar || editing.country_en).trim(),
        city_en: editing.city_en.trim(),
        city_ar: (editing.city_ar || editing.city_en).trim(),
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
      toast.error(err.message || "Failed to save location");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (loc: SysLocation, nextActive: boolean) => {
    // Optimistic update
    setData((prev) => prev.map((x) => (x.id === loc.id ? { ...x, is_active: nextActive } : x)));
    try {
      await saveLocation({ ...loc, is_active: nextActive });
      toast.success(
        isAr
          ? nextActive ? "تم تفعيل الموقع بنجاح" : "تم تعطيل الموقع"
          : nextActive ? "Location activated" : "Location deactivated"
      );
    } catch (err: any) {
      // Revert on error
      setData((prev) => prev.map((x) => (x.id === loc.id ? { ...x, is_active: loc.is_active } : x)));
      toast.error(err.message || "Failed to update status");
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(isAr ? `هل أنت متأكد من حذف "${name}"؟` : `Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteLocation(id);
      toast.success(isAr ? "تم الحذف بنجاح" : "Deleted successfully");
      setData((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await bulkSaveLocations(DEFAULT_LOCATIONS);
      toast.success(
        isAr
          ? `تم تحميل ${res.length} موقع قياسي بنجاح!`
          : `Loaded ${res.length} standard locations successfully!`
      );
      void fetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to seed locations");
    } finally {
      setSeeding(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Country (English)": "Saudi Arabia", "Country (Arabic)": "المملكة العربية السعودية", "City (English)": "Riyadh", "City (Arabic)": "الرياض" },
      { "Country (English)": "United Arab Emirates", "Country (Arabic)": "الإمارات العربية المتحدة", "City (English)": "Dubai", "City (Arabic)": "دبي" },
      { "Country (English)": "Egypt", "Country (Arabic)": "مصر", "City (English)": "Cairo", "City (Arabic)": "القاهرة" }
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
          const cEn = row["Country (English)"] || row["country_en"] || row["Country"];
          const cAr = row["Country (Arabic)"] || row["country_ar"] || row["الدولة"];
          const ciEn = row["City (English)"] || row["city_en"] || row["City"];
          const ciAr = row["City (Arabic)"] || row["city_ar"] || row["المدينة"];

          if (cEn && ciEn) {
            toInsert.push({
              country_en: String(cEn).trim(),
              country_ar: String(cAr || cEn).trim(),
              city_en: String(ciEn).trim(),
              city_ar: String(ciAr || ciEn).trim(),
              is_active: true,
            });
          }
        }

        if (toInsert.length > 0) {
          await bulkSaveLocations(toInsert);
          toast.success(isAr ? `تم استيراد ${toInsert.length} موقع بنجاح` : `Successfully imported ${toInsert.length} locations`);
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
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" /> {isAr ? "المواقع (الدول والمدن)" : "Locations (Countries & Cities)"}
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {data.length} {isAr ? "مدينة" : "Cities"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {uniqueCountries.length} {isAr ? "دولة" : "Countries"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? "إدارة المواقع الجغرافية المتزامنة تلقائيًا مع استمارات التوظيف، التسجيل، وبوابة العملاء."
              : "Manage geographical locations dynamically synchronized across Careers, Sign-Up, and Client Portal."}
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
              {isAr ? "تحميل المواقع القياسية" : "Load Standard Locations"}
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
            onClick={() => setEditing({ id: "new", country_en: "", country_ar: "", city_en: "", city_ar: "", is_active: true })}
            disabled={!_perms.add || submitting}
          >
            <Plus className="h-4 w-4 me-1.5" /> {isAr ? "إضافة موقع جديد" : "Add Location"}
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-xs"
            placeholder={isAr ? "بحث بالدولة أو المدينة..." : "Search by country or city..."}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {uniqueCountries.length > 0 && (
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="text-xs h-9 border rounded-md px-2.5 bg-background text-foreground"
          >
            <option value="all">{isAr ? "جميع الدول" : "All Countries"} ({uniqueCountries.length})</option>
            {uniqueCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Locations Table */}
      <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
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
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{isAr ? "جاري تحميل المواقع..." : "Loading locations..."}</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    {isAr ? "لا توجد نتائج مطابقة." : "No locations found."}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {row.country_en}
                    </td>
                    <td className="px-4 py-3" dir="rtl">{row.country_ar}</td>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-muted-foreground" />
                      {row.city_en}
                    </td>
                    <td className="px-4 py-3" dir="rtl">{row.city_ar}</td>
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
                          title="Edit location"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          disabled={!_perms.delete}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(row.id, `${row.city_en}, ${row.country_en}`)}
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
                ? (isAr ? "إضافة موقع جديد" : "Add New Location")
                : (isAr ? "تعديل الموقع" : "Edit Location")}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country (English) *</Label>
                  <Input
                    value={editing.country_en}
                    onChange={(e) => setEditing({ ...editing, country_en: e.target.value })}
                    placeholder="e.g. Saudi Arabia"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الدولة (عربي)</Label>
                  <Input
                    value={editing.country_ar}
                    onChange={(e) => setEditing({ ...editing, country_ar: e.target.value })}
                    placeholder="مثال: المملكة العربية السعودية"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City (English) *</Label>
                  <Input
                    value={editing.city_en}
                    onChange={(e) => setEditing({ ...editing, city_en: e.target.value })}
                    placeholder="e.g. Riyadh"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>المدينة (عربي)</Label>
                  <Input
                    value={editing.city_ar}
                    onChange={(e) => setEditing({ ...editing, city_ar: e.target.value })}
                    placeholder="مثال: الرياض"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="loc-active"
                  checked={editing.is_active}
                  onCheckedChange={(c) => setEditing({ ...editing, is_active: !!c })}
                />
                <Label htmlFor="loc-active" className="cursor-pointer">
                  {isAr ? "موقع نشط (يظهر في قوائم الاختيار)" : "Active location (visible in public dropdowns)"}
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
