import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Save, Loader2, LayoutGrid, Table as TableIcon, Download, Upload, Search, FileSpreadsheet, Pencil, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useCanAccess } from "@/lib/permissions-store";
import { useAdminT } from "@/lib/admin-i18n";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/dashboard/admin/chatbot")({
  head: () => ({ meta: [{ title: "Chatbot Q&A — Admin" }] }),
  component: ChatbotAdminPage,
});

export type QA = {
  id: string;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  keywords: string;
  sort_order: number;
  active: boolean;
};

const DEFAULT_FALLBACK_QAS: QA[] = [
  {
    id: "default-1",
    question_en: "What services do you offer?",
    question_ar: "ما الخدمات التي تقدمونها؟",
    answer_en: "We provide turnkey Security Systems (CCTV & Access Control), Enterprise Network Infrastructure, Data Centers, Audio/Video Boardrooms, and Technology Consultation.",
    answer_ar: "نقدم حلولاً متكاملة لأنظمة الأمن والمراقبة (CCTV والتحكم بالدخول)، والبنية التحتية للشبكات، ومراكز البيانات، وتجهيز قاعات الاجتماعات الصوتية والمرئية، والاستشارات التقنية.",
    keywords: "services products solutions cctv network security خدمات منتجات حلول شبكات امن",
    sort_order: 1,
    active: true,
  },
  {
    id: "default-2",
    question_en: "How can I request a price quote or proposal?",
    question_ar: "كيف يمكنني طلب عرض سعر أو دراسة مشروع؟",
    answer_en: "You can request a proposal directly via our Contact page, by clicking 'Request a Quote' on any Service page, or by chatting with our engineers on WhatsApp.",
    answer_ar: "يمكنك طلب عرض سعر مباشرة عبر صفحة 'اتصل بنا'، أو بالنقر على 'طلب عرض سعر' في أي صفحة خدمة، أو بالتواصل المباشر مع مهندسينا عبر واتساب.",
    keywords: "quote pricing cost proposal proposal boq سعر تكلفة عرض اسعار مناقصة",
    sort_order: 2,
    active: true,
  },
  {
    id: "default-3",
    question_en: "What industries do you serve?",
    question_ar: "ما القطاعات التي تخدمونها؟",
    answer_en: "We serve Government, Banking & Financial Institutions, Healthcare & Hospitals, Education & Campuses, Retail & Commercial Malls, Hospitality, and Industrial Mega-Projects.",
    answer_ar: "نخدم القطاعات الحكومية، البنوك والمؤسسات المالية، المستشفيات والرعاية الصحية، التعليم والجامعات، المراكز التجارية، الفنادق والمشاريع الصناعية الكبرى.",
    keywords: "industries sectors banking healthcare government قطاعات بنوك مستشفيات حكومة مصانع",
    sort_order: 3,
    active: true,
  },
  {
    id: "default-4",
    question_en: "How do I contact technical support or open a maintenance ticket?",
    question_ar: "كيف أتواصل مع الدعم الفني أو أفتح تذكرة صيانة؟",
    answer_en: "You can open a support ticket directly from your Client Workspace under Support Tickets, or reach our 24/7 engineering helpdesk via WhatsApp or email.",
    answer_ar: "يمكنك فتح تذكرة دعم فني مباشرة من لوحة تحكم العميل عبر قسم 'تذاكر الدعم'، أو التواصل مع فريق الصيانة 24/7 عبر واتساب والبريد الإلكتروني.",
    keywords: "support maintenance ticket helpdesk sla صيانة دعم تذكرة طوارئ بلاغ",
    sort_order: 4,
    active: true,
  },
  {
    id: "default-5",
    question_en: "Where are your offices located and what regions do you cover?",
    question_ar: "أين تقع مكاتبكم وما النطاق الجغرافي لخدماتكم؟",
    answer_en: "Our headquarters are based in Cairo, Egypt, delivering enterprise infrastructure projects across Egypt, Saudi Arabia, and the wider MENA region.",
    answer_ar: "يقع مقرنا الرئيسي في القاهرة، مصر، وننفذ المشاريع الكبرى في جميع أنحاء جمهورية مصر العربية والمملكة العربية السعودية ومنطقة الشرق الأوسط.",
    keywords: "location office address cairo egypt ksa mena عنوان موقع مقر القاهرة مصر السعودية",
    sort_order: 5,
    active: true,
  },
];

const getLocalCache = (): QA[] => {
  try {
    const raw = localStorage.getItem("it_chatbot_qa_cache");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocalCache = (items: QA[]) => {
  try {
    localStorage.setItem("it_chatbot_qa_cache", JSON.stringify(items));
  } catch {}
};

function ChatbotAdminPage() {
  const { lang } = useAdminT();
  const isAr = lang === "ar";
  const can = useCanAccess("chatbot");

  const [items, setItems] = useState<QA[]>(() => {
    const cached = getLocalCache();
    return cached.length > 0 ? cached : DEFAULT_FALLBACK_QAS;
  });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [importReport, setImportReport] = useState<{ inserted: number; total: number; errors: { row: number; reason: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Add / Edit Modal Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingQa, setEditingQa] = useState<QA | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chatbot_qa")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("[chatbot_qa] DB load warning, using cached items:", error.message);
      } else if (data && data.length > 0) {
        const loaded = data as QA[];
        setItems(loaded);
        setLocalCache(loaded);
      }
    } catch (e: any) {
      console.warn("[chatbot_qa] fetch error:", e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.question_en?.toLowerCase().includes(q) ||
        item.question_ar?.toLowerCase().includes(q) ||
        item.answer_en?.toLowerCase().includes(q) ||
        item.answer_ar?.toLowerCase().includes(q) ||
        item.keywords?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleOpenAdd = () => {
    const nextOrder = (items.at(-1)?.sort_order ?? 0) + 1;
    setEditingQa({
      id: crypto.randomUUID(),
      question_en: "",
      question_ar: "",
      answer_en: "",
      answer_ar: "",
      keywords: "",
      sort_order: nextOrder,
      active: true,
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (qa: QA) => {
    setEditingQa({ ...qa });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const updateItemInState = (id: string, patch: Partial<QA>) => {
    setItems((prev) => {
      const updated = prev.map((x) => (x.id === id ? { ...x, ...patch } : x));
      setLocalCache(updated);
      return updated;
    });
  };

  const saveSingle = async (qa: QA) => {
    setSavingId(qa.id);
    updateItemInState(qa.id, qa);

    try {
      const { id, ...rest } = qa;
      const { error } = await supabase.from("chatbot_qa").upsert({ id, ...rest });
      if (error) {
        console.warn("[chatbot_qa] Save warning:", error.message);
        toast.warning(isAr ? "تم الحفظ محليًا (تنبيه قاعدة البيانات)" : "Saved locally (database sync pending)");
      } else {
        toast.success(isAr ? "تم حفظ السؤال بنجاح" : "Q&A saved successfully");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to save Q&A");
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    updateItemInState(id, { active });
    toast.success(active ? (isAr ? "تم تفعيل السؤال" : "Q&A enabled") : (isAr ? "تم تعطيل السؤال" : "Q&A disabled"));

    try {
      await supabase.from("chatbot_qa").update({ active }).eq("id", id);
    } catch {}
  };

  const saveAll = async () => {
    setSavingAll(true);
    setLocalCache(items);

    try {
      const { error } = await supabase.from("chatbot_qa").upsert(items);
      if (error) {
        console.warn("[chatbot_qa] Save all warning:", error.message);
        toast.warning(isAr ? "تم حفظ التعديلات محليًا" : "Saved locally");
      } else {
        toast.success(isAr ? `تم حفظ ${items.length} سؤال بنجاح` : `All ${items.length} entries saved`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSavingAll(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا السؤال؟" : "Delete this Q&A entry?")) return;
    setItems((p) => {
      const filtered = p.filter((x) => x.id !== id);
      setLocalCache(filtered);
      return filtered;
    });

    try {
      const { error } = await supabase.from("chatbot_qa").delete().eq("id", id);
      if (error) console.warn("[chatbot_qa] Delete warning:", error.message);
      toast.success(isAr ? "تم حذف السؤال" : "Entry removed");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQa) return;
    if (!editingQa.question_en.trim() && !editingQa.question_ar.trim()) {
      toast.error(isAr ? "يرجى كتابة السؤال بالإنجليزية أو العربية" : "Please enter the question in English or Arabic");
      return;
    }
    if (!editingQa.answer_en.trim() && !editingQa.answer_ar.trim()) {
      toast.error(isAr ? "يرجى كتابة الإجابة" : "Please enter the answer");
      return;
    }

    setModalSaving(true);
    const finalQa: QA = {
      ...editingQa,
      question_en: editingQa.question_en.trim() || editingQa.question_ar.trim(),
      question_ar: editingQa.question_ar.trim() || editingQa.question_en.trim(),
      answer_en: editingQa.answer_en.trim() || editingQa.answer_ar.trim(),
      answer_ar: editingQa.answer_ar.trim() || editingQa.answer_en.trim(),
    };

    setItems((prev) => {
      const exists = prev.some((x) => x.id === finalQa.id);
      const next = exists ? prev.map((x) => (x.id === finalQa.id ? finalQa : x)) : [...prev, finalQa];
      setLocalCache(next);
      return next;
    });

    try {
      const { error } = await supabase.from("chatbot_qa").upsert(finalQa);
      if (error) console.warn("[chatbot_qa] DB upsert note:", error.message);
      toast.success(isAr ? "تم حفظ السؤال بنجاح" : "Q&A saved successfully");
      setDialogOpen(false);
      setEditingQa(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setModalSaving(false);
    }
  };

  // EXCEL TEMPLATE & EXPORT
  const downloadTemplate = () => {
    const sample = [
      {
        question_en: "What services do you offer?",
        question_ar: "ما هي الخدمات التي تقدمونها؟",
        answer_en: "We provide turnkey Security Systems, Network Infrastructure, Data Centers, and AV Boardrooms.",
        answer_ar: "نقدم حلولاً متكاملة للأنظمة الأمنية، والبنية التحتية للشبكات، ومراكز البيانات، والقاعات الصوتية والمرئية.",
        keywords: "services products cctv network security خدمات منتجات شبكات",
        sort_order: 1,
        active: true,
      },
      {
        question_en: "How can I request a quote?",
        question_ar: "كيف أطلب عرض سعر؟",
        answer_en: "You can submit a request through our Contact page or message us on WhatsApp.",
        answer_ar: "يمكنك إرسال طلبك من خلال صفحة التواصل أو مراسلتنا عبر واتساب.",
        keywords: "quote pricing cost عرض سعر اسعار",
        sort_order: 2,
        active: true,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample, {
      header: ["question_en", "question_ar", "answer_en", "answer_ar", "keywords", "sort_order", "active"],
    });
    ws["!cols"] = [{ wch: 36 }, { wch: 36 }, { wch: 45 }, { wch: 45 }, { wch: 28 }, { wch: 12 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chatbot Q&A Template");
    XLSX.writeFile(wb, "chatbot-qa-template.xlsx");
    toast.success(isAr ? "تم تنزيل نموذج إكسيل" : "Excel template downloaded");
  };

  const exportAllData = () => {
    if (items.length === 0) {
      toast.error(isAr ? "لا توجد أسئلة لتصديرها" : "No Q&A data to export");
      return;
    }
    const exportRows = items.map((q) => ({
      question_en: q.question_en,
      question_ar: q.question_ar,
      answer_en: q.answer_en,
      answer_ar: q.answer_ar,
      keywords: q.keywords,
      sort_order: q.sort_order,
      active: q.active ? "TRUE" : "FALSE",
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws["!cols"] = [{ wch: 36 }, { wch: 36 }, { wch: 50 }, { wch: 50 }, { wch: 30 }, { wch: 12 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chatbot Q&A");
    XLSX.writeFile(wb, `chatbot-qa-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(isAr ? `تم تصدير ${items.length} سؤال بنجاح` : `Exported ${items.length} entries to Excel`);
  };

  // Helper for deduplication
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

  // SMART EXCEL IMPORTER WITH DEDUPLICATION & BLANK ROW SKIPPING
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
        toast.error(isAr ? "ملف الإكسيل لا يحتوي على أوراق عمل" : "Workbook has no sheets");
        return;
      }

      // Read raw 2D array (preserves exact rows and avoids default empty string fill issues)
      const rawGrid: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (!rawGrid || rawGrid.length === 0) {
        toast.error(isAr ? "الملف فارغ لا يحتوي على بيانات" : "Excel file is empty");
        return;
      }

      // Cleaner string helper
      const cleanStr = (s: string) =>
        String(s ?? "")
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF]/g, "");

      // 1. Find Header Row
      let headerRowIndex = -1;
      let colMap: Record<string, number> = {};

      const headerKeywords = ["question", "answer", "سؤال", "اجابة", "إجابة", "keywords", "order", "sort", "active", "qen", "qar", "aen", "aar"];

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
      const qArCol = getColIdx("questionar", "qar", "arabicquestion", "سؤالar", "سؤال", "السؤال", "السوال", "السؤالالعربي");
      const aEnCol = getColIdx("answeren", "aen", "englishanswer", "answer", "a", "اجابةen", "الاجابةالانجليزية", "response");
      const aArCol = getColIdx("answerar", "aar", "arabicanswer", "اجابةar", "إجابة", "اجابة", "الإجابة", "الاجابةالعربية", "جواب", "الرد");
      const kwCol = getColIdx("keywords", "keyword", "tags", "tag", "كلمات", "الكلماتالمفتاحية", "كلماتمفتاحية", "دلالات");
      const sortCol = getColIdx("sortorder", "sort_order", "order", "sort", "ترتيب", "الترتيب", "تسلسل");
      const activeCol = getColIdx("active", "status", "نشط", "الحالة", "تفعيل", "enabled");

      const dataStartRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
      const errors: { row: number; reason: string }[] = [];
      const parsedBatch: QA[] = [];

      // Existing deduplication registry
      const existingMap = new Map<string, QA>();
      if (importMode === "append") {
        items.forEach((item) => {
          const k = getQKey(item.question_en, item.question_ar);
          if (k) existingMap.set(k, item);
        });
      }

      const baseOrder = importMode === "replace" ? 0 : (items.at(-1)?.sort_order ?? 0);
      let updatedCount = 0;
      let newCount = 0;

      for (let i = dataStartRow; i < rawGrid.length; i++) {
        const row = rawGrid[i] || [];
        const rowNo = i + 1;

        let q_en = (qEnCol >= 0 ? String(row[qEnCol] ?? "") : "").trim();
        let q_ar = (qArCol >= 0 ? String(row[qArCol] ?? "") : "").trim();
        let a_en = (aEnCol >= 0 ? String(row[aEnCol] ?? "") : "").trim();
        let a_ar = (aArCol >= 0 ? String(row[aArCol] ?? "") : "").trim();
        const kw = (kwCol >= 0 ? String(row[kwCol] ?? "") : "").trim();
        const sortRaw = (sortCol >= 0 ? String(row[sortCol] ?? "") : "").trim();
        const activeRaw = (activeCol >= 0 ? String(row[activeCol] ?? "") : "").trim();

        // Only do positional fallback if no headers were recognized at all in the sheet
        if (headerRowIndex < 0 && !q_en && !q_ar && !a_en && !a_ar) {
          const nonBlank = row.map((c) => String(c ?? "").trim()).filter(Boolean);
          if (nonBlank.length >= 2) {
            q_en = nonBlank[0] || "";
            q_ar = nonBlank[1] || q_en;
            a_en = nonBlank[2] || nonBlank[1] || "";
            a_ar = nonBlank[3] || a_en;
          }
        }

        const hasQuestion = q_en.length > 0 || q_ar.length > 0;
        const hasAnswer = a_en.length > 0 || a_ar.length > 0;

        // If neither question nor answer is present, it's an empty / placeholder row -> SKIP
        if (!hasQuestion && !hasAnswer) {
          continue;
        }

        // If one is present but the other is missing, flag as an actual user data issue
        if (!hasQuestion) {
          errors.push({ row: rowNo, reason: isAr ? "حقل السؤال فارغ" : "Question is missing" });
          continue;
        }
        if (!hasAnswer) {
          errors.push({ row: rowNo, reason: isAr ? "حقل الإجابة فارغ" : "Answer is missing" });
          continue;
        }

        const sort_order = sortRaw === "" || isNaN(Number(sortRaw)) ? baseOrder + parsedBatch.length + 1 : Number(sortRaw);
        const isActive = activeRaw === "" ? true : !["false", "0", "no", "لا", "معطل", "hidden", "draft"].includes(activeRaw.toLowerCase());

        const finalItem: QA = {
          id: crypto.randomUUID(),
          question_en: q_en || q_ar,
          question_ar: q_ar || q_en,
          answer_en: a_en || a_ar,
          answer_ar: a_ar || a_en,
          keywords: kw,
          sort_order,
          active: isActive,
        };

        // DEDUPLICATION CHECK
        const qKey = getQKey(finalItem.question_en, finalItem.question_ar);
        if (existingMap.has(qKey)) {
          // Update existing item to prevent duplication
          const existing = existingMap.get(qKey)!;
          existing.answer_en = finalItem.answer_en;
          existing.answer_ar = finalItem.answer_ar;
          if (finalItem.keywords) existing.keywords = finalItem.keywords;
          existing.active = finalItem.active;
          updatedCount++;
        } else {
          parsedBatch.push(finalItem);
          existingMap.set(qKey, finalItem);
          newCount++;
        }
      }

      if (parsedBatch.length === 0 && updatedCount === 0) {
        if (errors.length > 0) {
          setImportReport({ inserted: 0, total: errors.length, errors });
        }
        toast.error(isAr ? "فشل الاستيراد — لم يتم العثور على أسئلة وإجابات في الملف" : "Import failed — no Q&A entries found in file");
        return;
      }

      let updatedList: QA[];
      if (importMode === "replace") {
        updatedList = Array.from(existingMap.values());
      } else {
        // Merge updated existing items + newly parsed items
        const existingIds = new Set(items.map((x) => x.id));
        const updatedExisting = items.map((item) => {
          const k = getQKey(item.question_en, item.question_ar);
          return existingMap.get(k) || item;
        });
        const brandNew = parsedBatch.filter((x) => !existingIds.has(x.id));
        updatedList = [...updatedExisting, ...brandNew];
      }

      setItems(updatedList);
      setLocalCache(updatedList);

      // Persist to Supabase
      try {
        if (importMode === "replace") {
          await supabase.from("chatbot_qa").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        }
        await supabase.from("chatbot_qa").upsert(updatedList);
      } catch (err: any) {
        console.warn("[chatbot_qa] import DB upsert note:", err?.message);
      }

      const totalHandled = newCount + updatedCount;
      if (errors.length > 0) {
        setImportReport({
          inserted: totalHandled,
          total: totalHandled + errors.length,
          errors,
        });
      } else {
        setImportReport(null);
      }

      if (errors.length) {
        toast.warning(
          isAr
            ? `تم استيراد ${newCount} جديد وتحديث ${updatedCount} مكرر (${errors.length} صف تم تخطيه)`
            : `Imported ${newCount} new, updated ${updatedCount} existing (${errors.length} skipped)`,
        );
      } else {
        toast.success(
          isAr
            ? `تم الاستيراد بنجاح: ${newCount} سؤال جديد و${updatedCount} تم تحديثها بدون تكرار!`
            : `Success: ${newCount} added, ${updatedCount} updated (0 duplicates)!`,
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to parse Excel file");
      setImportReport({ inserted: 0, total: 0, errors: [{ row: 0, reason: err?.message || "Invalid file format" }] });
    } finally {
      setImporting(false);
    }
  };

  const activeCount = items.filter((i) => i.active).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            {lang === "ar" ? "المساعد الذكي (Chatbot)" : "Chatbot"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar"
              ? "إدارة الأسئلة والإجابات ثنائية اللغة لزوار الموقع مع دعم الاستيراد والتصدير عبر ملفات Excel."
              : "Manage bilingual (English / Arabic) Q&A knowledge base shown to website visitors with Excel import/export."}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">
              {activeCount} {lang === "ar" ? "سؤال نشط" : "active"}
            </Badge>
            <Badge variant="outline">
              {items.length} {lang === "ar" ? "إجمالي" : "total"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border bg-card overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setView("table")}
              className={`px-3 py-1.5 text-xs inline-flex items-center gap-1.5 font-medium transition-colors ${
                view === "table" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" /> {lang === "ar" ? "جدول" : "Table"}
            </button>
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`px-3 py-1.5 text-xs inline-flex items-center gap-1.5 font-medium transition-colors border-s ${
                view === "cards" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> {lang === "ar" ? "بطاقات" : "Cards"}
            </button>
          </div>

          {/* Excel Template & Export */}
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 me-1" /> {lang === "ar" ? "نموذج Excel" : "Template"}
          </Button>

          <Button variant="outline" size="sm" onClick={exportAllData}>
            <FileSpreadsheet className="h-4 w-4 me-1 text-emerald-600" /> {lang === "ar" ? "تصدير البيانات" : "Export Excel"}
          </Button>

          {/* Excel Import */}
          {can.add && (
            <>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImportFile} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Upload className="h-4 w-4 me-1" />}
                {lang === "ar" ? "استيراد Excel" : "Import Excel"}
              </Button>

              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 me-1" /> {lang === "ar" ? "إضافة سؤال" : "Add Q&A"}
              </Button>
            </>
          )}

          {can.edit && items.length > 0 && (
            <Button size="sm" variant="default" onClick={saveAll} disabled={savingAll}>
              {savingAll ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Save className="h-4 w-4 me-1" />}
              {lang === "ar" ? "حفظ الكل" : "Save All"}
            </Button>
          )}
        </div>
      </div>

      {/* Search & Mode Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card p-3 rounded-xl border">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "البحث في الأسئلة والإجابات والكلمات المفتاحية..." : "Search questions, answers, keywords..."}
            className="ps-9 h-9"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{lang === "ar" ? "طريقة الاستيراد:" : "Import mode:"}</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="import_mode"
              checked={importMode === "append"}
              onChange={() => setImportMode("append")}
              className="text-accent"
            />
            <span>{lang === "ar" ? "إلحاق بالموجود (Append)" : "Append to list"}</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="import_mode"
              checked={importMode === "replace"}
              onChange={() => setImportMode("replace")}
              className="text-destructive"
            />
            <span>{lang === "ar" ? "استبدال الكل (Replace)" : "Replace all"}</span>
          </label>
        </div>
      </div>

      {/* Import Report Alert */}
      {importReport && (
        <Alert variant={importReport.errors.length ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {lang === "ar" ? "تقرير الاستيراد" : "Import report"} — {importReport.inserted} of {importReport.total}{" "}
            {lang === "ar" ? "تم استيرادها" : "imported"}
            {importReport.errors.length ? `, ${importReport.errors.length} issue(s)` : ""}
          </AlertTitle>
          {importReport.errors.length > 0 && (
            <AlertDescription>
              <div className="mt-2 max-h-48 overflow-auto rounded border bg-background/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Row</TableHead>
                      <TableHead>Issue Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importReport.errors.map((er, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{er.row === 0 ? "—" : er.row}</TableCell>
                        <TableCell className="text-xs">{er.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={() => setImportReport(null)}>
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          )}
        </Alert>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="p-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-accent" /> Loading chatbot knowledge base…
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground space-y-3">
            <p>{lang === "ar" ? "لم يتم العثور على أسئلة مطابقة." : "No matching Q&A entries found."}</p>
            <Button size="sm" variant="outline" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 me-1" /> {lang === "ar" ? "إضافة سؤال جديد" : "Add Q&A"}
            </Button>
          </CardContent>
        </Card>
      ) : view === "table" ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{lang === "ar" ? "الترتيب" : "Order"}</TableHead>
                  <TableHead className="min-w-[180px]">{lang === "ar" ? "السؤال (EN)" : "Question (EN)"}</TableHead>
                  <TableHead className="min-w-[180px]">{lang === "ar" ? "السؤال (AR)" : "Question (AR)"}</TableHead>
                  <TableHead className="min-w-[240px]">{lang === "ar" ? "الإجابة (EN)" : "Answer (EN)"}</TableHead>
                  <TableHead className="min-w-[240px]">{lang === "ar" ? "الإجابة (AR)" : "Answer (AR)"}</TableHead>
                  <TableHead className="min-w-[140px]">{lang === "ar" ? "الكلمات المفتاحية" : "Keywords"}</TableHead>
                  <TableHead className="w-24 text-center">{lang === "ar" ? "الحالة" : "Active"}</TableHead>
                  <TableHead className="w-32 text-end">{lang === "ar" ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((qa) => (
                  <TableRow key={qa.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 w-16"
                        value={qa.sort_order}
                        onChange={(e) => updateItemInState(qa.id, { sort_order: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        dir="ltr"
                        className="h-8 min-w-[160px]"
                        value={qa.question_en}
                        onChange={(e) => updateItemInState(qa.id, { question_en: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        dir="rtl"
                        className="h-8 min-w-[160px]"
                        value={qa.question_ar}
                        onChange={(e) => updateItemInState(qa.id, { question_ar: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        dir="ltr"
                        rows={2}
                        className="min-w-[220px] text-xs resize-y"
                        value={qa.answer_en}
                        onChange={(e) => updateItemInState(qa.id, { answer_en: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        dir="rtl"
                        rows={2}
                        className="min-w-[220px] text-xs resize-y"
                        value={qa.answer_ar}
                        onChange={(e) => updateItemInState(qa.id, { answer_ar: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 min-w-[130px] text-xs"
                        value={qa.keywords}
                        onChange={(e) => updateItemInState(qa.id, { keywords: e.target.value })}
                        placeholder="services quote"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={qa.active}
                        onCheckedChange={(val) => void handleToggleActive(qa.id, val)}
                      />
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="inline-flex items-center gap-1">
                        {can.edit && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() => handleOpenEdit(qa)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() => saveSingle(qa)}
                              disabled={savingId === qa.id}
                            >
                              {savingId === qa.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            </Button>
                          </>
                        )}
                        {can.delete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-destructive hover:bg-destructive/10"
                            onClick={() => remove(qa.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredItems.map((qa) => (
            <Card key={qa.id} className="flex flex-col justify-between">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{qa.sort_order}</Badge>
                    <span className="text-xs text-muted-foreground">{qa.keywords || "No keywords"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={qa.active}
                      onCheckedChange={(val) => void handleToggleActive(qa.id, val)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {qa.active ? (lang === "ar" ? "نشط" : "Live") : (lang === "ar" ? "معطل" : "Draft")}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-[11px] font-semibold text-accent uppercase">EN Question</div>
                    <div className="text-sm font-medium">{qa.question_en}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{qa.answer_en}</div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-[11px] font-semibold text-accent uppercase text-end">السؤال بالعربية</div>
                    <div className="text-sm font-medium text-end" dir="rtl">{qa.question_ar}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed text-end" dir="rtl">{qa.answer_ar}</div>
                  </div>
                </div>
              </CardContent>

              <div className="p-3 pt-0 border-t flex items-center justify-end gap-1">
                {can.edit && (
                  <Button size="sm" variant="outline" onClick={() => handleOpenEdit(qa)}>
                    <Pencil className="h-3.5 w-3.5 me-1" /> {lang === "ar" ? "تعديل" : "Edit"}
                  </Button>
                )}
                {can.delete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(qa.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ADD / EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {editingQa
                ? isEditing
                  ? (isAr ? "تعديل سؤال المساعد الذكي" : "Edit Chatbot Q&A")
                  : (isAr ? "إضافة سؤال جديد للمساعد الذكي" : "Add New Chatbot Q&A")
                : ""}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? "يتم تدريب المساعد الذكي على هذه الأسئلة والإجابات للرد الفوري على استفسارات الزوار."
                : "Visitors asking questions in chat will automatically receive matching answers."}
            </DialogDescription>
          </DialogHeader>

          {editingQa && (
            <form onSubmit={handleModalSubmit} className="space-y-4 py-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{isAr ? "السؤال بالإنجليزية" : "Question (EN)"} *</Label>
                  <Input
                    dir="ltr"
                    value={editingQa.question_en}
                    onChange={(e) => setEditingQa({ ...editingQa, question_en: e.target.value })}
                    placeholder="e.g. What security systems do you provide?"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{isAr ? "السؤال بالعربية" : "Question (AR)"} *</Label>
                  <Input
                    dir="rtl"
                    value={editingQa.question_ar}
                    onChange={(e) => setEditingQa({ ...editingQa, question_ar: e.target.value })}
                    placeholder="مثال: ما هي الأنظمة الأمنية التي تقدمونها؟"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{isAr ? "الإجابة بالإنجليزية" : "Answer (EN)"} *</Label>
                <Textarea
                  dir="ltr"
                  rows={3}
                  value={editingQa.answer_en}
                  onChange={(e) => setEditingQa({ ...editingQa, answer_en: e.target.value })}
                  placeholder="Provide the comprehensive answer in English..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>{isAr ? "الإجابة بالعربية" : "Answer (AR)"} *</Label>
                <Textarea
                  dir="rtl"
                  rows={3}
                  value={editingQa.answer_ar}
                  onChange={(e) => setEditingQa({ ...editingQa, answer_ar: e.target.value })}
                  placeholder="اكتب الإجابة الشاملة والدقيقة بالعربية..."
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>{isAr ? "الكلمات المفتاحية (مفصولة بمسافات)" : "Keywords (space-separated)"}</Label>
                  <Input
                    value={editingQa.keywords}
                    onChange={(e) => setEditingQa({ ...editingQa, keywords: e.target.value })}
                    placeholder="cctv security surveillance كاميرات مراقبة"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{isAr ? "ترتيب الظهور" : "Sort Order"}</Label>
                  <Input
                    type="number"
                    value={editingQa.sort_order}
                    onChange={(e) => setEditingQa({ ...editingQa, sort_order: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <Label htmlFor="modal-active-toggle" className="font-semibold text-sm cursor-pointer">
                    {isAr ? "تفعيل السؤال على الموقع" : "Publish to live chatbot"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {editingQa.active
                      ? (isAr ? "نشط ويظهر للمستخدمين في نافذة المحادثة." : "Active and answered to visitors.")
                      : (isAr ? "معطل ومخفي كمسودة." : "Disabled and stored as draft.")}
                  </p>
                </div>
                <Switch
                  id="modal-active-toggle"
                  checked={editingQa.active}
                  onCheckedChange={(val) => setEditingQa({ ...editingQa, active: val })}
                />
              </div>

              <DialogFooter className="gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={modalSaving}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={modalSaving}>
                  {modalSaving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
                  {isEditing ? (isAr ? "حفظ التغييرات" : "Save Changes") : (isAr ? "إضافة السؤال" : "Create Q&A")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}