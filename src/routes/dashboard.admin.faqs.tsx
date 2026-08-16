import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFaqs, type FaqItem, DEFAULT_FAQS } from "@/lib/faqs-store";
import {
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  Loader2,
  Sparkles,
  Search,
  Table as TableIcon,
  LayoutGrid,
  Save,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { useCanAccess } from "@/lib/permissions-store";
import { useAdminT } from "@/lib/admin-i18n";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/dashboard/admin/faqs")({
  head: () => ({ meta: [{ title: "FAQs — Admin" }] }),
  component: FaqsAdminPage,
});

function FaqsAdminPage() {
  const { faqs, loading, refresh, upsert, remove, move } = useFaqs();
  const can = useCanAccess("faqs");
  const { lang } = useAdminT();
  const ar = lang === "ar";

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [seeding, setSeeding] = useState(false);

  // Edit / Add Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<FaqItem>>({
    question_en: "",
    question_ar: "",
    answer_en: "",
    answer_ar: "",
    category_en: "General",
    category_ar: "عام",
    active: true,
    sort_order: 0,
  });

  // Excel Import / Export State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [importReport, setImportReport] = useState<{
    totalRows: number;
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    errors: { row: number; reason: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    const list = Array.from(new Set(faqs.map((f) => f.category_en).filter(Boolean)));
    return list;
  }, [faqs]);

  const filtered = useMemo(() => {
    return faqs.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        f.question_en.toLowerCase().includes(q) ||
        f.question_ar.includes(q) ||
        f.answer_en.toLowerCase().includes(q) ||
        f.answer_ar.includes(q) ||
        f.category_en.toLowerCase().includes(q) ||
        f.category_ar.includes(q);

      const matchCategory =
        selectedCategory === "all" ||
        f.category_en.toLowerCase() === selectedCategory.toLowerCase();

      return matchSearch && matchCategory;
    });
  }, [faqs, searchQuery, selectedCategory]);

  const handleOpenAdd = () => {
    setCurrentItem({
      question_en: "",
      question_ar: "",
      answer_en: "",
      answer_ar: "",
      category_en: "General",
      category_ar: "عام",
      active: true,
      sort_order: faqs.length + 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: FaqItem) => {
    setCurrentItem({ ...item });
    setModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.question_en?.trim() && !currentItem.question_ar?.trim()) {
      toast.error(ar ? "يرجى كتابة السؤال (بالإنجليزية أو العربية)" : "Question (EN or AR) is required");
      return;
    }
    if (!currentItem.answer_en?.trim() && !currentItem.answer_ar?.trim()) {
      toast.error(ar ? "يرجى كتابة الإجابة" : "Answer is required");
      return;
    }

    setModalSaving(true);
    try {
      await upsert(currentItem);
      toast.success(
        currentItem.id
          ? ar
            ? "تم تحديث السؤال والإجابة بنجاح!"
            : "FAQ updated successfully!"
          : ar
          ? "تمت إضافة السؤال بنجاح!"
          : "FAQ created successfully!"
      );
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || (ar ? "فشل الحفظ" : "Failed to save"));
    } finally {
      setModalSaving(false);
    }
  };

  const handleToggleActive = async (f: FaqItem, active: boolean) => {
    try {
      await upsert({ ...f, active });
      toast.success(active ? (ar ? "تم تفعيل السؤال" : "FAQ is active") : ar ? "تم إخفاء السؤال" : "FAQ is hidden");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(ar ? `هل أنت متأكد من حذف: "${label}"؟` : `Delete FAQ "${label}"?`)) return;
    try {
      await remove(id);
      toast.success(ar ? "تم الحذف بنجاح" : "FAQ deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const handleSeedAll = async () => {
    setSeeding(true);
    try {
      for (const item of DEFAULT_FAQS) {
        await upsert(item);
      }
      toast.success(ar ? "تم تحميل وتوليد الأسئلة الشائعة بنجاح!" : "Enterprise FAQs loaded and synced to database!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to seed FAQs");
    } finally {
      setSeeding(false);
    }
  };

  // ==========================================
  // EXCEL EXPORT & TEMPLATE GENERATION
  // ==========================================
  const downloadSampleTemplate = () => {
    const sampleRows = [
      {
        question_en: "What industries do you serve?",
        question_ar: "ما القطاعات التي تخدمونها؟",
        answer_en: "Integrated Technics serves government, banking, healthcare, and oil & gas facilities.",
        answer_ar: "تقدم إنترجريتد تكنيكس خدماتها للجهات الحكومية والبنوك والرعاية الصحية والنفط والغاز.",
        category_en: "General",
        category_ar: "عام",
        sort_order: 1,
        active: "TRUE",
      },
      {
        question_en: "Do you provide 24/7 SLA maintenance?",
        question_ar: "هل تقدمون عقود صيانة ودعم 24/7؟",
        answer_en: "Yes, we provide 24/7 proactive NOC monitoring and on-site emergency dispatch.",
        answer_ar: "نعم، نوفر مراقبة استباقية لغرف العمليات على مدار الساعة واستجابة موقعية طارئة.",
        category_en: "Maintenance & SLAs",
        category_ar: "الصيانة ومستويات الخدمة",
        sort_order: 2,
        active: "TRUE",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    ws["!cols"] = [{ wch: 35 }, { wch: 35 }, { wch: 45 }, { wch: 45 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FAQs Template");
    XLSX.writeFile(wb, "faqs-import-template.xlsx");
    toast.success(ar ? "تم تنزيل قالب إكسيل النموذجي" : "Sample FAQ Excel template downloaded");
  };

  const exportFaqsToExcel = () => {
    if (faqs.length === 0) {
      toast.error(ar ? "لا توجد أسئلة لتصديرها" : "No FAQs to export");
      return;
    }
    const exportRows = faqs.map((f) => ({
      question_en: f.question_en,
      question_ar: f.question_ar,
      answer_en: f.answer_en,
      answer_ar: f.answer_ar,
      category_en: f.category_en,
      category_ar: f.category_ar,
      sort_order: f.sort_order,
      active: f.active ? "TRUE" : "FALSE",
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws["!cols"] = [{ wch: 35 }, { wch: 35 }, { wch: 45 }, { wch: 45 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FAQs");
    XLSX.writeFile(wb, `faqs-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(ar ? `تم تصدير ${faqs.length} سؤال إلى إكسيل بنجاح` : `Exported ${faqs.length} FAQs to Excel`);
  };

  // ==========================================
  // SMART EXCEL IMPORTER WITH DEDUPLICATION
  // ==========================================
  const getQKey = (q_en: string, q_ar: string) => {
    const clean = (s: string) =>
      s
        .toLowerCase()
        .replace(/[\u064B-\u0652]/g, "")
        .replace(/[إأآا]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/[^\p{L}\p{N}]/gu, "")
        .trim();
    return clean(q_en) || clean(q_ar);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setImportReport(null);

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        toast.error(ar ? "ملف الإكسيل لا يحتوي على أوراق عمل" : "Workbook has no sheets");
        return;
      }

      const rawGrid: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (!rawGrid || rawGrid.length === 0) {
        toast.error(ar ? "الملف فارغ لا يحتوي على بيانات" : "Excel file is empty");
        return;
      }

      const cleanStr = (s: string) =>
        String(s ?? "")
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF]/g, "");

      let headerRowIndex = -1;
      let colMap: Record<string, number> = {};
      const headerKeywords = ["question", "answer", "سؤال", "اجابة", "إجابة", "category", "قسم", "فئة", "order", "sort", "active"];

      for (let r = 0; r < Math.min(rawGrid.length, 10); r++) {
        const rowCells = (rawGrid[r] || []).map((c) => cleanStr(c));
        const matched = rowCells.filter((c) => headerKeywords.some((k) => c.includes(k)));
        if (matched.length >= 2) {
          headerRowIndex = r;
          rowCells.forEach((cell, colIdx) => {
            if (cell) colMap[cell] = colIdx;
          });
          break;
        }
      }

      const getColIdx = (...matchers: string[]): number => {
        const cleanedMatchers = matchers.map(cleanStr);
        for (const [cellKey, colIdx] of Object.entries(colMap)) {
          if (cleanedMatchers.some((m) => cellKey === m || cellKey.includes(m) || m.includes(cellKey))) {
            return colIdx;
          }
        }
        return -1;
      };

      const qEnCol = getColIdx("questionen", "qen", "englishquestion", "question", "q", "سؤالen", "السؤالالانجليزي");
      const qArCol = getColIdx("questionar", "qar", "arabicquestion", "سؤالar", "سؤال", "السؤال", "السؤالالعربي");
      const aEnCol = getColIdx("answeren", "aen", "englishanswer", "answer", "a", "اجابةen", "الاجابةالانجليزية", "response");
      const aArCol = getColIdx("answerar", "aar", "arabicanswer", "اجابةar", "إجابة", "اجابة", "الإجابة", "الاجابةالعربية", "جواب");
      const catEnCol = getColIdx("categoryen", "category", "department", "قسم", "فئة", "القسمالانجليزي");
      const catArCol = getColIdx("categoryar", "القسمالعربي", "الفئة", "القسم");
      const sortCol = getColIdx("sortorder", "sort_order", "order", "sort", "ترتيب", "الترتيب");
      const activeCol = getColIdx("active", "status", "نشط", "الحالة", "تفعيل", "enabled");

      const dataStartRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
      const errors: { row: number; reason: string }[] = [];
      const parsedBatch: FaqItem[] = [];

      const existingMap = new Map<string, FaqItem>();
      if (importMode === "append") {
        faqs.forEach((item) => {
          const k = getQKey(item.question_en, item.question_ar);
          if (k) existingMap.set(k, item);
        });
      }

      let updatedCount = 0;
      let skippedBlankCount = 0;

      for (let i = dataStartRow; i < rawGrid.length; i++) {
        const row = rawGrid[i];
        if (!row || !Array.isArray(row)) {
          skippedBlankCount++;
          continue;
        }

        const getCell = (idx: number, fallbackIdx: number): string => {
          if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) return String(row[idx]).trim();
          if (headerRowIndex === -1 && fallbackIdx < row.length && row[fallbackIdx] !== undefined)
            return String(row[fallbackIdx]).trim();
          return "";
        };

        const q_en = getCell(qEnCol, 0);
        const q_ar = getCell(qArCol, 1);
        const a_en = getCell(aEnCol, 2);
        const a_ar = getCell(aArCol, 3);
        const cat_en = getCell(catEnCol, 4) || "General";
        const cat_ar = getCell(catArCol, 5) || "عام";
        const rawSort = getCell(sortCol, 6);
        const rawActive = getCell(activeCol, 7);

        // Skip genuinely blank rows silently
        if (!q_en && !q_ar && !a_en && !a_ar) {
          skippedBlankCount++;
          continue;
        }

        // Validate content
        if (!q_en && !q_ar) {
          errors.push({ row: i + 1, reason: ar ? "السؤال بالإنجليزية والعربية فارغ" : "Both English and Arabic questions are empty" });
          continue;
        }

        if (!a_en && !a_ar) {
          errors.push({ row: i + 1, reason: ar ? "الإجابة بالإنجليزية والعربية فارغة" : "Both English and Arabic answers are empty" });
          continue;
        }

        const sort_order = parseInt(rawSort, 10) || parsedBatch.length + 1;
        const active = rawActive === "" ? true : !(rawActive.toLowerCase() === "false" || rawActive === "0" || rawActive === "لا");

        const qKey = getQKey(q_en, q_ar);
        const existing = qKey ? existingMap.get(qKey) : null;

        const recordId = existing ? existing.id : crypto.randomUUID();

        const item: FaqItem = {
          id: recordId,
          question_en: q_en || q_ar,
          question_ar: q_ar || q_en,
          answer_en: a_en || a_ar,
          answer_ar: a_ar || a_en,
          category_en: cat_en,
          category_ar: cat_ar,
          sort_order,
          active,
        };

        if (existing) {
          updatedCount++;
        }

        parsedBatch.push(item);
        if (qKey) existingMap.set(qKey, item);
      }

      if (parsedBatch.length === 0) {
        toast.error(ar ? "لم يتم العثور على أي أسئلة صالحة في الملف" : "No valid FAQ rows found in file");
        setImportReport({
          totalRows: rawGrid.length - dataStartRow,
          importedCount: 0,
          updatedCount: 0,
          skippedCount: skippedBlankCount,
          errors,
        });
        return;
      }

      // Persist to Supabase Database
      if (importMode === "replace") {
        try {
          await (supabase as any).from("faqs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } catch {}
      }

      // Upsert batch to database
      for (const item of parsedBatch) {
        await upsert(item);
      }

      const importedNewCount = parsedBatch.length - updatedCount;

      setImportReport({
        totalRows: rawGrid.length - dataStartRow,
        importedCount: importedNewCount,
        updatedCount,
        skippedCount: skippedBlankCount,
        errors,
      });

      toast.success(
        ar
          ? `تم استيراد ${importedNewCount} سؤال جديد وتحديث ${updatedCount} سؤال بنجاح!`
          : `Imported ${importedNewCount} new and updated ${updatedCount} FAQs!`
      );
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || (ar ? "فشل تحليل ملف الإكسيل" : "Failed to parse Excel file"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {ar ? "الأسئلة الشائعة (FAQs)" : "Frequently Asked Questions"}
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {faqs.length} {ar ? "سؤال" : "Total"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {ar
              ? "إدارة بنك الأسئلة والأجوبة الشائعة للزوار والعملاء مع دعم الاستيراد والتصدير عبر إكسيل."
              : "Manage public-facing bilingual FAQs with Excel import, export, and real-time database sync."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Excel Import Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="text-xs shadow-xs"
          >
            <Upload className="h-3.5 w-3.5 me-1.5 text-emerald-600 dark:text-emerald-400" />
            {ar ? "استيراد من إكسيل" : "Import Excel"}
          </Button>

          {/* Excel Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportFaqsToExcel}
            className="text-xs shadow-xs"
          >
            <Download className="h-3.5 w-3.5 me-1.5" />
            {ar ? "تصدير إكسيل" : "Export Excel"}
          </Button>

          {faqs.length <= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedAll}
              disabled={seeding}
              className="text-xs shadow-xs"
            >
              {seeding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-accent me-1.5" />
              )}
              {ar ? "تحميل الافتراضيات" : "Load Defaults"}
            </Button>
          )}

          {can.add && (
            <Button size="sm" onClick={handleOpenAdd} className="shadow-xs">
              <Plus className="h-4 w-4 me-1.5" />
              {ar ? "إضافة سؤال" : "Add FAQ"}
            </Button>
          )}
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ar ? "ابحث في الأسئلة أو الإجابات..." : "Search questions or answers..."}
              className="pl-9 text-xs h-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs h-9 border rounded-md px-2.5 bg-background text-foreground"
            >
              <option value="all">{ar ? "جميع الأقسام" : "All Categories"}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center border rounded-lg p-0.5 bg-muted/40">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-3.5 w-3.5" />
              {ar ? "جدول" : "Table"}
            </Button>
            <Button
              type="button"
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {ar ? "بطاقات" : "Cards"}
            </Button>
          </div>
        </div>
      </div>

      {/* 1. TABLE VIEW */}
      {viewMode === "table" && (
        <div className="border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">{ar ? "السؤال (EN / AR)" : "Question (EN / AR)"}</th>
                  <th className="py-3 px-4">{ar ? "القسم" : "Category"}</th>
                  <th className="py-3 px-4 text-center">{ar ? "الحالة" : "Status"}</th>
                  <th className="py-3 px-4 text-center">{ar ? "الترتيب" : "Order"}</th>
                  <th className="py-3 px-4 text-right">{ar ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {ar ? "جاري تحميل الأسئلة..." : "Loading FAQs..."}
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      {ar ? "لا توجد أسئلة تطابق البحث." : "No FAQs match your search or filter criteria."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((f, idx) => (
                    <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        <div className="font-semibold text-foreground line-clamp-1">
                          {f.question_en || f.question_ar}
                        </div>
                        {f.question_ar && f.question_en && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5" dir="rtl">
                            {f.question_ar}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {f.answer_en || f.answer_ar}
                        </p>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">
                          {ar ? f.category_ar || f.category_en : f.category_en}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Switch
                          checked={f.active}
                          onCheckedChange={(checked) => handleToggleActive(f, checked)}
                        />
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={idx === 0}
                            onClick={() => void move(f.id, -1)}
                            title="Move up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={idx === filtered.length - 1}
                            onClick={() => void move(f.id, 1)}
                            title="Move down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(f)}
                            className="h-8 px-2.5 text-xs text-foreground hover:text-accent hover:border-accent"
                          >
                            <Pencil className="h-3.5 w-3.5 me-1" />
                            {ar ? "تعديل" : "Edit"}
                          </Button>

                          {can.delete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(f.id, f.question_en || f.question_ar)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CARDS VIEW */}
      {viewMode === "cards" && (
        <div className="space-y-3">
          {filtered.map((f, idx) => (
            <Card key={f.id} className="hover:border-accent/50 transition-colors shadow-xs">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">#{idx + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {ar ? f.category_ar : f.category_en}
                      </Badge>
                      <Badge variant={f.active ? "default" : "secondary"} className="text-xs">
                        {f.active ? (ar ? "مفعل" : "Active") : ar ? "مخفي" : "Hidden"}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-base text-foreground pt-1">{f.question_en}</h3>
                    {f.question_ar && (
                      <h4 className="text-sm font-medium text-muted-foreground" dir="rtl">
                        {f.question_ar}
                      </h4>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={f.active} onCheckedChange={(v) => handleToggleActive(f, v)} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border space-y-2 text-xs leading-relaxed text-muted-foreground">
                  <p>{f.answer_en}</p>
                  {f.answer_ar && <p dir="rtl">{f.answer_ar}</p>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={idx === 0}
                      onClick={() => void move(f.id, -1)}
                    >
                      <ArrowUp className="h-3 w-3 me-1" />
                      {ar ? "أعلى" : "Up"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={idx === filtered.length - 1}
                      onClick={() => void move(f.id, 1)}
                    >
                      <ArrowDown className="h-3 w-3 me-1" />
                      {ar ? "أسفل" : "Down"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleOpenEdit(f)}
                    >
                      <Pencil className="h-3 w-3 me-1" />
                      {ar ? "تعديل" : "Edit"}
                    </Button>
                    {can.delete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(f.id, f.question_en || f.question_ar)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit FAQ Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {currentItem.id ? <Pencil className="h-5 w-5 text-accent" /> : <Plus className="h-5 w-5 text-accent" />}
              {currentItem.id ? (ar ? "تعديل السؤال الشائع" : "Edit FAQ") : ar ? "إضافة سؤال شائع جديد" : "Add New FAQ"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveModal} className="space-y-4 pt-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{ar ? "السؤال (بالإنجليزية) *" : "Question (English) *"}</Label>
                <Input
                  value={currentItem.question_en || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, question_en: e.target.value })}
                  placeholder="e.g. What industries do you serve?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{ar ? "السؤال (بالعربية) *" : "Question (Arabic) *"}</Label>
                <Input
                  dir="rtl"
                  value={currentItem.question_ar || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, question_ar: e.target.value })}
                  placeholder="مثال: ما القطاعات التي تخدمونها؟"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{ar ? "القسم (EN)" : "Category (English)"}</Label>
                <Input
                  value={currentItem.category_en || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, category_en: e.target.value })}
                  placeholder="General, Security & CCTV, Data Centers, SLAs..."
                />
              </div>

              <div className="space-y-2">
                <Label>{ar ? "القسم (AR)" : "Category (Arabic)"}</Label>
                <Input
                  dir="rtl"
                  value={currentItem.category_ar || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, category_ar: e.target.value })}
                  placeholder="عام، الأنظمة الأمنية، مراكز البيانات..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{ar ? "الإجابة بالتفصيل (بالإنجليزية) *" : "Answer (English) *"}</Label>
              <Textarea
                rows={3}
                value={currentItem.answer_en || ""}
                onChange={(e) => setCurrentItem({ ...currentItem, answer_en: e.target.value })}
                placeholder="Comprehensive technical answer in English..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{ar ? "الإجابة بالتفصيل (بالعربية) *" : "Answer (Arabic) *"}</Label>
              <Textarea
                dir="rtl"
                rows={3}
                value={currentItem.answer_ar || ""}
                onChange={(e) => setCurrentItem({ ...currentItem, answer_ar: e.target.value })}
                placeholder="الإجابة الفنية الشاملة باللغة العربية..."
                required
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
              <div>
                <Label htmlFor="faq-active-switch" className="text-sm font-semibold cursor-pointer">
                  {ar ? "حالة الظهور (Active)" : "Visible on Public Website"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {currentItem.active
                    ? ar
                      ? "السؤال معروض ومتاح لجميع الزوار والمستخدمين"
                      : "Publicly visible in FAQ sections"
                    : ar
                    ? "السؤال مخفي ومحفوظ كمسودة"
                    : "Hidden from public website"}
                </p>
              </div>
              <Switch
                id="faq-active-switch"
                checked={currentItem.active !== false}
                onCheckedChange={(checked) => setCurrentItem({ ...currentItem, active: checked })}
              />
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={modalSaving}
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={modalSaving}>
                {modalSaving ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 me-2" />
                )}
                {currentItem.id ? (ar ? "حفظ التعديلات" : "Save Changes") : ar ? "إضافة السؤال" : "Create FAQ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {ar ? "استيراد الأسئلة الشائعة من إكسيل" : "Import FAQs from Excel"}
            </DialogTitle>
            <DialogDescription>
              {ar
                ? "قم برفع ملف Excel (.xlsx أو .xls أو .csv) لتحديث الأسئلة الشائعة فورياً."
                : "Upload an Excel file (.xlsx, .xls, or .csv) to batch import or update FAQs."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Import Mode Radio */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{ar ? "وضع الاستيراد:" : "Import Strategy:"}</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode("append")}
                  className={`p-3 rounded-xl border text-start transition-all ${
                    importMode === "append"
                      ? "border-emerald-500 bg-emerald-500/10 font-semibold"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="text-xs">{ar ? "إضافة وتحديث الذكي" : "Append & Update"}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {ar ? "تحديث المكرر وإضافة الجديد" : "Update duplicates, add new"}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode("replace")}
                  className={`p-3 rounded-xl border text-start transition-all ${
                    importMode === "replace"
                      ? "border-amber-500 bg-amber-500/10 font-semibold"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="text-xs">{ar ? "استبدال الكل" : "Replace All"}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {ar ? "مسح القديم واستبداله بالملف" : "Clear existing and replace"}
                  </div>
                </button>
              </div>
            </div>

            {/* Template Download Link */}
            <div className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold">{ar ? "قالب إكسيل النموذجي" : "Sample FAQ Template"}</div>
                <div className="text-[11px] text-muted-foreground">
                  {ar ? "تحميل ملف مهيأ بالترويسات والأعمدة" : "Pre-formatted with bilingual headers"}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadSampleTemplate}
                className="text-xs h-8"
              >
                <FileDown className="h-3.5 w-3.5 me-1 text-emerald-600" />
                {ar ? "تحميل القالب" : "Download"}
              </Button>
            </div>

            {/* Hidden Native File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={onImportFile}
            />

            {/* Upload Action Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-emerald-500/60 p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-card hover:bg-muted/20 text-center"
            >
              {importing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                  <span className="text-xs font-medium">{ar ? "جاري معالجة واستيراد الأسئلة..." : "Processing FAQs..."}</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-semibold">{ar ? "انقر لاختيار ملف Excel (.xlsx)" : "Click to select Excel file (.xlsx)"}</div>
                  <div className="text-[10px] text-muted-foreground">{ar ? "أو اسحب وأفلت الملف هنا" : "Supports .xlsx, .xls, .csv"}</div>
                </div>
              )}
            </div>

            {/* Import Report Box */}
            {importReport && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{ar ? "تقرير الاستيراد الأخير:" : "Import Summary:"}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {importReport.importedCount + importReport.updatedCount} {ar ? "عنصر" : "processed"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    <div className="font-bold text-sm">{importReport.importedCount}</div>
                    <div className="text-[10px]">{ar ? "جديد" : "New"}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400">
                    <div className="font-bold text-sm">{importReport.updatedCount}</div>
                    <div className="text-[10px]">{ar ? "محدث" : "Updated"}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted border text-muted-foreground">
                    <div className="font-bold text-sm">{importReport.skippedCount}</div>
                    <div className="text-[10px]">{ar ? "صفوف فارغة" : "Blank Skipped"}</div>
                  </div>
                </div>

                {importReport.errors.length > 0 && (
                  <Alert variant="destructive" className="py-2 text-xs max-h-32 overflow-y-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{ar ? "ملاحظات على بعض الصفوف:" : "Row Validation Notes:"}</AlertTitle>
                    <AlertDescription className="mt-1 space-y-1">
                      {importReport.errors.map((e, idx) => (
                        <div key={idx} className="text-[11px]">
                          {ar ? `صف ${e.row}: ${e.reason}` : `Row ${e.row}: ${e.reason}`}
                        </div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              {ar ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
