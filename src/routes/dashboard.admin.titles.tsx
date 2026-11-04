import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useSiteTitles, type TitleEntry, DEFAULT_TITLES } from "@/lib/titles-store";
import { useAdminT } from "@/lib/admin-i18n";
import { useI18n } from "@/lib/i18n";
import { usePermissions } from "@/lib/permissions-store";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Pencil,
  RotateCcw,
  Heading,
  CheckCircle2,
  Loader2,
  Save,
  Globe,
  Eye,
  SlidersHorizontal,
  Download,
  Upload,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/titles")({
  head: () => ({ meta: [{ title: "Titles & Subtitles — Admin" }] }),
  component: TitlesAdminPage,
});

const PAGES_LIST = [
  { id: "all", en: "All Titles", ar: "كل العناوين" },
  { id: "home", en: "Homepage", ar: "الرئيسية" },
  { id: "about", en: "About", ar: "من نحن" },
  { id: "services", en: "Services", ar: "الخدمات" },
  { id: "solutions", en: "Solutions", ar: "الحلول" },
  { id: "products", en: "Systems", ar: "الأنظمة" },
  { id: "projects", en: "Projects", ar: "المشاريع" },
  { id: "industries", en: "Industries", ar: "القطاعات" },
  { id: "partners", en: "Partners", ar: "الشركاء" },
  { id: "careers", en: "Careers", ar: "الوظائف" },
  { id: "news", en: "News", ar: "الأخبار" },
  { id: "events", en: "Events", ar: "الفعاليات" },
  { id: "training", en: "Training", ar: "التدريب" },
  { id: "contact", en: "Contact", ar: "تواصل معنا" },
  { id: "faqs", en: "FAQs", ar: "الأسئلة الشائعة" },
  { id: "global", en: "Global & Footer", ar: "النظام والفوتر" },
];

function TitlesAdminPage() {
  const { titles, loading, updateTitle, resetToDefault, resetAll } = useSiteTitles();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { user } = useAuth();
  const { getUserPerms } = usePermissions();
  const _perms = user?.role === "admin" ? { add: true, edit: true, delete: true } : (getUserPerms(user?.id)?.titles ?? { add: false, edit: false, delete: false });

  const [selectedPage, setSelectedPage] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<TitleEntry | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmResetKey, setConfirmResetKey] = useState<string | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [previewTab, setPreviewTab] = useState<"en" | "ar">("en");

  const titleList = useMemo(() => Object.values(titles), [titles]);

  const filtered = useMemo(() => {
    return titleList.filter((item) => {
      const matchPage = selectedPage === "all" || item.page === selectedPage;
      if (!matchPage) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.key.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.titleAr.toLowerCase().includes(q) ||
        (item.subtitleEn && item.subtitleEn.toLowerCase().includes(q)) ||
        (item.subtitleAr && item.subtitleAr.toLowerCase().includes(q)) ||
        (item.badgeEn && item.badgeEn.toLowerCase().includes(q)) ||
        (item.badgeAr && item.badgeAr.toLowerCase().includes(q))
      );
    });
  }, [titleList, selectedPage, search]);

  const stats = useMemo(() => {
    const total = titleList.length;
    let customized = 0;
    for (const t of titleList) {
      const def = DEFAULT_TITLES[t.key];
      if (
        !def ||
        def.titleEn !== t.titleEn ||
        def.titleAr !== t.titleAr ||
        def.subtitleEn !== t.subtitleEn ||
        def.subtitleAr !== t.subtitleAr ||
        def.badgeEn !== t.badgeEn ||
        def.badgeAr !== t.badgeAr
      ) {
        customized++;
      }
    }
    return { total, customized, defaults: total - customized };
  }, [titleList]);

  const openEdit = (entry: TitleEntry) => {
    setEditing({ ...entry });
    setIsNew(false);
    setPreviewTab(isAr ? "ar" : "en");
  };

  const openNew = () => {
    setEditing({
      key: `custom.${Date.now()}`,
      page: selectedPage === "all" ? "home" : selectedPage,
      section: "Custom Section",
      titleEn: "",
      titleAr: "",
      subtitleEn: "",
      subtitleAr: "",
      badgeEn: "",
      badgeAr: "",
    });
    setIsNew(true);
    setPreviewTab(isAr ? "ar" : "en");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.titleEn.trim() || !editing.titleAr.trim()) {
      toast.error(isAr ? "يرجى كتابة العنوان بالإنجليزية والعربية" : "Please provide both English and Arabic titles");
      return;
    }

    setSaving(true);
    try {
      await updateTitle(editing);
      toast.success(isAr ? "تم حفظ العنوان بنجاح في قاعدة البيانات" : "Title successfully saved to database");
      setEditing(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || (isAr ? "فشل حفظ العنوان" : "Failed to save title"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetSingle = async () => {
    if (!confirmResetKey) return;
    try {
      await resetToDefault(confirmResetKey);
      toast.success(isAr ? "تمت استعادة النص الافتراضي" : "Reset to default copy");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset");
    } finally {
      setConfirmResetKey(null);
    }
  };

  const handleResetAll = async () => {
    try {
      await resetAll();
      toast.success(isAr ? "تمت استعادة جميع العناوين الافتراضية" : "All titles reset to defaults");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset all");
    } finally {
      setConfirmResetAll(false);
    }
  };

  const exportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(titles, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `integrated-technics-titles-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (typeof parsed === "object" && parsed !== null) {
          for (const key of Object.keys(parsed)) {
            await updateTitle(parsed[key]);
          }
          toast.success("Titles imported successfully");
        }
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <Heading className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isAr ? "إدارة العناوين والنصوص" : "Dynamic Titles & Subtitles"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isAr
                  ? "تحكم في جميع عناوين ونصوص الأقسام والصفحات في الموقع باللغتين العربية والإنجليزية ديناميكياً"
                  : "Manage and customize all section headings, subheadings, and badge text dynamically in English & Arabic."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportJson} title="Export JSON backup">
            <Download className="h-4 w-4 me-1.5" />
            {isAr ? "تصدير" : "Export"}
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) importJson(e.target.files[0]);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 me-1.5" />
                {isAr ? "استيراد" : "Import"}
              </span>
            </Button>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmResetAll(true)}
            disabled={!_perms.edit}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700"
          >
            <RotateCcw className="h-4 w-4 me-1.5" />
            {isAr ? "استعادة الكل" : "Reset All"}
          </Button>

          <Button size="sm" onClick={openNew} disabled={!_perms.add}>
            <Plus className="h-4 w-4 me-1.5" />
            {isAr ? "إضافة عنوان جديد" : "Add Title"}
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center justify-between border bg-card">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {isAr ? "إجمالي العناوين" : "Total Titles"}
            </div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <Layers className="h-8 w-8 text-muted-foreground/30" />
        </Card>

        <Card className="p-4 flex items-center justify-between border bg-card">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {isAr ? "عناوين مخصصة" : "Customized"}
            </div>
            <div className="text-2xl font-bold mt-1 text-accent">{stats.customized}</div>
          </div>
          <Sparkles className="h-8 w-8 text-accent/30" />
        </Card>

        <Card className="p-4 flex items-center justify-between border bg-card">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {isAr ? "نصوص قياسية" : "Default Copy"}
            </div>
            <div className="text-2xl font-bold mt-1 text-muted-foreground">{stats.defaults}</div>
          </div>
          <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={isAr ? "ابحث بالعنوان، الكلمة، القسم أو المعرّف…" : "Search titles, subtitles, keys, or sections…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Page Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {PAGES_LIST.map((p) => {
            const count = titleList.filter((t) => p.id === "all" || t.page === p.id).length;
            const active = selectedPage === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPage(p.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all shrink-0 flex items-center gap-1.5 border ${
                  active
                    ? "bg-accent text-accent-foreground border-accent shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
                }`}
              >
                <span>{isAr ? p.ar : p.en}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? "bg-accent-foreground/20 text-accent-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Titles Cards List */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
          <span>{isAr ? "جارٍ تحميل العناوين من قاعدة البيانات…" : "Loading titles from database…"}</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent className="space-y-3">
            <Heading className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <h3 className="font-semibold text-lg">{isAr ? "لم يتم العثور على نتائج" : "No titles found"}</h3>
            <p className="text-sm text-muted-foreground">
              {isAr ? "جرب البحث بكلمة مختلفة أو اختر تصنيفاً آخر" : "Try searching with different keywords or switch page category."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => {
            const def = DEFAULT_TITLES[item.key];
            const isCustomized =
              !def ||
              def.titleEn !== item.titleEn ||
              def.titleAr !== item.titleAr ||
              def.subtitleEn !== item.subtitleEn ||
              def.subtitleAr !== item.subtitleAr ||
              def.badgeEn !== item.badgeEn ||
              def.badgeAr !== item.badgeAr;

            return (
              <Card key={item.key} className="border hover:border-accent/40 transition-colors">
                <CardHeader className="p-4 pb-3 border-b bg-muted/20 flex flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Badge variant="outline" className="capitalize text-xs font-semibold">
                      {item.page}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">{item.section}</span>
                    <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {item.key}
                    </code>
                    {isCustomized ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                        {isAr ? "معدّل" : "Customized"}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {isAr ? "افتراضي" : "Default"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCustomized && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmResetKey(item.key)}
                        disabled={!_perms.edit}
                        title={isAr ? "استعادة النص الافتراضي" : "Reset to default"}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-amber-600"
                      >
                        <RotateCcw className="h-3.5 w-3.5 me-1" />
                        <span className="hidden sm:inline">{isAr ? "استعادة" : "Reset"}</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(item)}
                      disabled={!_perms.edit}
                      className="h-8 px-3 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5 me-1.5" />
                      {isAr ? "تعديل" : "Edit"}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 grid md:grid-cols-2 gap-6">
                  {/* English Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" /> English Copy
                    </div>
                    {item.badgeEn && (
                      <div className="text-xs font-semibold tracking-wider text-accent uppercase">
                        {item.badgeEn}
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-foreground leading-snug">{item.titleEn}</h3>
                    {item.subtitleEn ? (
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.subtitleEn}</p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground/60">No English subtitle</p>
                    )}
                  </div>

                  {/* Arabic Column */}
                  <div className="space-y-2 border-t md:border-t-0 md:border-s md:ps-6 pt-3 md:pt-0" dir="rtl">
                    <div className="flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" /> النص العربي
                    </div>
                    {item.badgeAr && (
                      <div className="text-xs font-semibold tracking-wider text-accent uppercase">
                        {item.badgeAr}
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-foreground leading-snug">{item.titleAr}</h3>
                    {item.subtitleAr ? (
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.subtitleAr}</p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground/60">لا يوجد وصف بالعربية</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Title Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-4xl sm:max-w-4xl md:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto">
          {editing && (
            <form onSubmit={handleSave} className="space-y-6">
              <DialogHeader className="border-b pb-3">
                <DialogTitle className="text-xl font-display flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Heading className="h-5 w-5 text-accent" />
                    <span>
                      {isNew
                        ? isAr
                          ? "إضافة عنوان ديناميكي جديد"
                          : "Add New Dynamic Title"
                        : isAr
                        ? `تعديل عنوان: ${editing.section}`
                        : `Edit Title: ${editing.section}`}
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {editing.key}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              {/* Meta details */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isAr ? "معرّف المفتاح (Key)" : "Key Identifier"} *</Label>
                  <Input
                    value={editing.key}
                    disabled={!isNew}
                    onChange={(e) => setEditing({ ...editing, key: e.target.value })}
                    placeholder="e.g. home.hero"
                    className="font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isAr ? "الصفحة" : "Page Category"} *</Label>
                  <Input
                    value={editing.page}
                    onChange={(e) => setEditing({ ...editing, page: e.target.value })}
                    placeholder="e.g. home, services, about"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isAr ? "اسم القسم" : "Section Name"} *</Label>
                  <Input
                    value={editing.section}
                    onChange={(e) => setEditing({ ...editing, section: e.target.value })}
                    placeholder="e.g. Hero Section, Services Grid"
                    required
                  />
                </div>
              </div>

              {/* Bilingual Inputs Grid */}
              <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
                {/* English Edit Column */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b">
                    <span className="font-semibold text-sm flex items-center gap-1.5 text-accent">
                      <Globe className="h-4 w-4" /> English Version
                    </span>
                    <span className="text-xs text-muted-foreground">LTR</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Eyebrow / Badge (EN)</Label>
                    <Input
                      dir="ltr"
                      value={editing.badgeEn ?? ""}
                      onChange={(e) => setEditing({ ...editing, badgeEn: e.target.value })}
                      placeholder="e.g. Core Services, Enterprise Integrator"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Main Title (EN) *</Label>
                    <Input
                      dir="ltr"
                      value={editing.titleEn}
                      onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })}
                      placeholder="Main section heading"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Subtitle / Description (EN)</Label>
                    <Textarea
                      dir="ltr"
                      rows={3}
                      value={editing.subtitleEn ?? ""}
                      onChange={(e) => setEditing({ ...editing, subtitleEn: e.target.value })}
                      placeholder="Detailed section subheading or paragraph in English"
                    />
                  </div>
                </div>

                {/* Arabic Edit Column */}
                <div className="space-y-4" dir="rtl">
                  <div className="flex items-center justify-between pb-1 border-b">
                    <span className="font-semibold text-sm flex items-center gap-1.5 text-accent">
                      <Globe className="h-4 w-4" /> النسخة العربية
                    </span>
                    <span className="text-xs text-muted-foreground">RTL</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">الشارة / النص الفرعي الصغير (AR)</Label>
                    <Input
                      dir="rtl"
                      value={editing.badgeAr ?? ""}
                      onChange={(e) => setEditing({ ...editing, badgeAr: e.target.value })}
                      placeholder="مثال: خدماتنا المتكاملة، الحلول الهندسية"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">العنوان الرئيسي (AR) *</Label>
                    <Input
                      dir="rtl"
                      value={editing.titleAr}
                      onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })}
                      placeholder="العنوان الرئيسي للقسم"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">النص التوضيحي / الوصف (AR)</Label>
                    <Textarea
                      dir="rtl"
                      rows={3}
                      value={editing.subtitleAr ?? ""}
                      onChange={(e) => setEditing({ ...editing, subtitleAr: e.target.value })}
                      placeholder="الوصف التفصيلي أو النص الفرعي للقسم باللغة العربية"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="rounded-xl border p-4 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    {isAr ? "معاينة حية للمظهر على الموقع" : "Live Visual Preview"}
                  </span>
                  <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("en")}
                      className={`px-2 py-0.5 rounded ${previewTab === "en" ? "bg-background font-semibold shadow-xs" : "text-muted-foreground"}`}
                    >
                      English Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("ar")}
                      className={`px-2 py-0.5 rounded ${previewTab === "ar" ? "bg-background font-semibold shadow-xs" : "text-muted-foreground"}`}
                    >
                      معاينة عربي
                    </button>
                  </div>
                </div>

                <div
                  className="p-6 rounded-lg bg-card border text-center space-y-2 transition-all"
                  dir={previewTab === "ar" ? "rtl" : "ltr"}
                >
                  {(previewTab === "ar" ? editing.badgeAr : editing.badgeEn) && (
                    <div className="inline-block text-xs font-semibold uppercase tracking-widest text-accent mb-1">
                      {previewTab === "ar" ? editing.badgeAr : editing.badgeEn}
                    </div>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {(previewTab === "ar" ? editing.titleAr : editing.titleEn) || (
                      <span className="text-muted-foreground italic">Untitled Heading</span>
                    )}
                  </h2>
                  {(previewTab === "ar" ? editing.subtitleAr : editing.subtitleEn) && (
                    <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                      {previewTab === "ar" ? editing.subtitleAr : editing.subtitleEn}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={saving || !_perms.edit}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
                  {isAr ? "حفظ التغييرات في قاعدة البيانات" : "Save to Database"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation: Reset Single */}
      <AlertDialog open={!!confirmResetKey} onOpenChange={(open) => !open && setConfirmResetKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr ? "استعادة النص الافتراضي؟" : "Reset title to default?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? "سيتم استبدال هذا العنوان بنصه القياسي الافتراضي باللغتين وحفظه في قاعدة البيانات."
                : "This will revert the selected title and subtitle back to the default copy in both English and Arabic."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetSingle}>
              {isAr ? "استعادة النص الافتراضي" : "Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation: Reset All */}
      <AlertDialog open={confirmResetAll} onOpenChange={setConfirmResetAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr ? "استعادة جميع العناوين والنصوص الافتراضية؟" : "Reset all titles to defaults?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? "تحذير: سيتم استرجاع جميع عناوين الأقسام والصفحات في الموقع إلى نصوصها الأصلية الافتراضية في قاعدة البيانات."
                : "Warning: This will overwrite all custom titles and subtitles across the entire website with their original defaults in the database."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isAr ? "نعم، استعادة الكل" : "Reset All Titles"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

