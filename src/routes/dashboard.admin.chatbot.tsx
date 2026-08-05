import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Loader2, LayoutGrid, Table as TableIcon, Download, Upload } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCanAccess } from "@/lib/permissions-store";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/dashboard/admin/chatbot")({
  head: () => ({ meta: [{ title: "Chatbot — Admin" }] }),
  component: ChatbotAdminPage,
});

type QA = {
  id: string;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  keywords: string;
  sort_order: number;
  active: boolean;
};

function ChatbotAdminPage() {
  const can = useCanAccess("chatbot");
  const [items, setItems] = useState<QA[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "cards">("table");
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<{ inserted: number; total: number; errors: { row: number; reason: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chatbot_qa")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as QA[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    const next = (items.at(-1)?.sort_order ?? 0) + 1;
    const { data, error } = await supabase
      .from("chatbot_qa")
      .insert({
        question_en: "New question",
        question_ar: "سؤال جديد",
        answer_en: "Answer…",
        answer_ar: "الإجابة…",
        keywords: "",
        sort_order: next,
        active: true,
      })
      .select()
      .single();
    if (error) toast.error(error.message);
    else if (data) setItems((p) => [...p, data as QA]);
  };

  const update = (id: string, patch: Partial<QA>) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const save = async (qa: QA) => {
    setSavingId(qa.id);
    const { id, ...rest } = qa;
    const { error } = await supabase.from("chatbot_qa").update(rest).eq("id", id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("chatbot_qa").delete().eq("id", id);
    if (error) toast.error(error.message);
    else setItems((p) => p.filter((x) => x.id !== id));
  };

  const downloadTemplate = () => {
    const sample = [
      { question_en: "What are your business hours?", question_ar: "ما هي ساعات العمل؟", answer_en: "Sun–Thu, 9am–6pm.", answer_ar: "الأحد–الخميس، 9 ص – 6 م.", keywords: "hours time ساعات وقت", sort_order: 1, active: true },
      { question_en: "How can I request a quote?", question_ar: "كيف أطلب عرض سعر؟", answer_en: "Use our contact form or WhatsApp.", answer_ar: "استخدم نموذج التواصل أو واتساب.", keywords: "quote pricing سعر عرض", sort_order: 2, active: true },
    ];
    const ws = XLSX.utils.json_to_sheet(sample, {
      header: ["question_en", "question_ar", "answer_en", "answer_ar", "keywords", "sort_order", "active"],
    });
    ws["!cols"] = [{ wch: 32 }, { wch: 32 }, { wch: 40 }, { wch: 40 }, { wch: 24 }, { wch: 10 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chatbot Q&A");
    XLSX.writeFile(wb, "chatbot-qa-template.xlsx");
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
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { toast.error("Workbook has no sheets"); return; }
      // Validate header row contains required columns
      const headerRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
      const headers = (headerRows[0] ?? []).map((h) => String(h ?? "").trim());
      const REQUIRED = ["question_en", "question_ar", "answer_en", "answer_ar"] as const;
      const OPTIONAL = ["keywords", "sort_order", "active"] as const;
      const missing = REQUIRED.filter((c) => !headers.includes(c));
      if (missing.length) {
        setImportReport({ inserted: 0, total: 0, errors: [{ row: 1, reason: `Missing required column(s): ${missing.join(", ")}. Expected: ${[...REQUIRED, ...OPTIONAL].join(", ")}` }] });
        toast.error("Import failed — invalid template");
        return;
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const baseOrder = (items.at(-1)?.sort_order ?? 0);
      const errors: { row: number; reason: string }[] = [];
      const payload: Omit<QA, "id">[] = [];
      rows.forEach((r, i) => {
        const rowNo = i + 2; // header is row 1
        const issues: string[] = [];
        const q_en = String(r.question_en ?? "").trim();
        const q_ar = String(r.question_ar ?? "").trim();
        const a_en = String(r.answer_en ?? "").trim();
        const a_ar = String(r.answer_ar ?? "").trim();
        if (!q_en) issues.push("question_en is empty");
        if (!q_ar) issues.push("question_ar is empty");
        if (!a_en) issues.push("answer_en is empty");
        if (!a_ar) issues.push("answer_ar is empty");
        if (q_en.length > 500) issues.push("question_en exceeds 500 chars");
        if (a_en.length > 4000) issues.push("answer_en exceeds 4000 chars");
        const sortRaw = r.sort_order;
        const sort_order = sortRaw === "" || sortRaw == null ? baseOrder + i + 1 : Number(sortRaw);
        if (Number.isNaN(sort_order)) issues.push("sort_order is not a number");
        if (issues.length) { errors.push({ row: rowNo, reason: issues.join("; ") }); return; }
        payload.push({
          question_en: q_en, question_ar: q_ar, answer_en: a_en, answer_ar: a_ar,
          keywords: String(r.keywords ?? "").trim(),
          sort_order,
          active: r.active === false || String(r.active).toLowerCase() === "false" ? false : true,
        });
      });
      if (payload.length === 0) {
        setImportReport({ inserted: 0, total: rows.length, errors });
        toast.error("Import failed — no valid rows");
        return;
      }
      const { data, error } = await supabase.from("chatbot_qa").insert(payload).select();
      if (error) {
        setImportReport({ inserted: 0, total: rows.length, errors: [...errors, { row: 0, reason: `Database error: ${error.message}` }] });
        toast.error(error.message);
      } else {
        setItems((p) => [...p, ...((data ?? []) as QA[])]);
        setImportReport({ inserted: data?.length ?? 0, total: rows.length, errors });
        if (errors.length) toast.warning(`Imported ${data?.length ?? 0} of ${rows.length} — ${errors.length} row(s) skipped`);
        else toast.success(`Imported ${data?.length ?? 0} entries`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to import file");
      setImportReport({ inserted: 0, total: 0, errors: [{ row: 0, reason: err?.message || "Failed to parse file" }] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Chatbot</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the bilingual (English / Arabic) questions and answers shown to visitors.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border bg-card overflow-hidden">
            <button type="button" onClick={() => setView("table")} className={`px-2.5 py-1.5 text-xs inline-flex items-center gap-1 ${view === "table" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>
              <TableIcon className="h-3.5 w-3.5" /> Table
            </button>
            <button type="button" onClick={() => setView("cards")} className={`px-2.5 py-1.5 text-xs inline-flex items-center gap-1 border-s ${view === "cards" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> Cards
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 me-1" /> Template
          </Button>
          {can.add && (
            <>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImportFile} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Upload className="h-4 w-4 me-1" />} Import Excel
              </Button>
              <Button size="sm" onClick={add}>
                <Plus className="h-4 w-4 me-1" /> Add Q&amp;A
              </Button>
            </>
          )}
        </div>
      </div>

      {importReport && (
        <Alert variant={importReport.errors.length ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            Import report — {importReport.inserted} of {importReport.total} imported
            {importReport.errors.length ? `, ${importReport.errors.length} issue(s)` : ""}
          </AlertTitle>
          {importReport.errors.length > 0 && (
            <AlertDescription>
              <div className="mt-2 max-h-56 overflow-auto rounded border bg-background/40">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Row</TableHead>
                      <TableHead>Problem</TableHead>
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
                <Button size="sm" variant="outline" onClick={() => setImportReport(null)}>Dismiss</Button>
              </div>
            </AlertDescription>
          )}
        </Alert>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No entries yet. Add your first Q&amp;A.
          </CardContent>
        </Card>
      ) : view === "table" ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead>Question (EN)</TableHead>
                  <TableHead>السؤال (AR)</TableHead>
                  <TableHead>Answer (EN)</TableHead>
                  <TableHead>الإجابة (AR)</TableHead>
                  <TableHead className="w-24">Keywords</TableHead>
                  <TableHead className="w-20 text-center">Active</TableHead>
                  <TableHead className="w-32 text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((qa) => (
                  <TableRow key={qa.id}>
                    <TableCell>
                      <Input type="number" className="h-8 w-16" value={qa.sort_order} onChange={(e) => update(qa.id, { sort_order: Number(e.target.value) || 0 })} />
                    </TableCell>
                    <TableCell><Input dir="ltr" className="h-8 min-w-[180px]" value={qa.question_en} onChange={(e) => update(qa.id, { question_en: e.target.value })} /></TableCell>
                    <TableCell><Input dir="rtl" className="h-8 min-w-[180px]" value={qa.question_ar} onChange={(e) => update(qa.id, { question_ar: e.target.value })} /></TableCell>
                    <TableCell><Textarea dir="ltr" rows={2} className="min-w-[220px] text-sm" value={qa.answer_en} onChange={(e) => update(qa.id, { answer_en: e.target.value })} /></TableCell>
                    <TableCell><Textarea dir="rtl" rows={2} className="min-w-[220px] text-sm" value={qa.answer_ar} onChange={(e) => update(qa.id, { answer_ar: e.target.value })} /></TableCell>
                    <TableCell><Input className="h-8 min-w-[140px]" value={qa.keywords} onChange={(e) => update(qa.id, { keywords: e.target.value })} /></TableCell>
                    <TableCell className="text-center">
                      <Switch checked={qa.active} onCheckedChange={(v) => update(qa.id, { active: !!v })} />
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="inline-flex items-center gap-1">
                        {can.edit && (
                          <Button size="sm" variant="outline" onClick={() => save(qa)} disabled={savingId === qa.id}>
                            {savingId === qa.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        )}
                        {can.delete && (
                          <Button size="sm" variant="ghost" onClick={() => remove(qa.id)}>
                            <Trash2 className="h-4 w-4" />
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
        <div className="space-y-3">
          {items.map((qa) => (
            <Card key={qa.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs">Order</Label>
                    <Input
                      type="number"
                      className="w-20 h-8"
                      value={qa.sort_order}
                      onChange={(e) => update(qa.id, { sort_order: Number(e.target.value) || 0 })}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={qa.active}
                        onCheckedChange={(v) => update(qa.id, { active: !!v })}
                      />
                      <Label className="text-xs">Active</Label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {can.edit && (
                      <Button size="sm" onClick={() => save(qa)} disabled={savingId === qa.id}>
                        {savingId === qa.id ? (
                          <Loader2 className="h-4 w-4 me-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 me-1" />
                        )}
                        Save
                      </Button>
                    )}
                    {can.delete && (
                      <Button size="sm" variant="ghost" onClick={() => remove(qa.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Question (EN)</Label>
                    <Input
                      dir="ltr"
                      value={qa.question_en}
                      onChange={(e) => update(qa.id, { question_en: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>السؤال (AR)</Label>
                    <Input
                      dir="rtl"
                      value={qa.question_ar}
                      onChange={(e) => update(qa.id, { question_ar: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Answer (EN)</Label>
                    <Textarea
                      dir="ltr"
                      rows={3}
                      value={qa.answer_en}
                      onChange={(e) => update(qa.id, { answer_en: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الإجابة (AR)</Label>
                    <Textarea
                      dir="rtl"
                      rows={3}
                      value={qa.answer_ar}
                      onChange={(e) => update(qa.id, { answer_ar: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label>Keywords (optional, helps matching — separate with spaces, both languages)</Label>
                    <Input
                      value={qa.keywords}
                      onChange={(e) => update(qa.id, { keywords: e.target.value })}
                      placeholder="pricing quote سعر عرض"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}