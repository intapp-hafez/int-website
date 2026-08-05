import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoFaqs, type FaqItem, type Bilingual } from "@/data/demo";
import { Plus, Trash2 } from "lucide-react";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";

export const Route = createFileRoute("/dashboard/admin/faqs")({
  head: () => ({ meta: [{ title: "FAQs — Admin" }] }),
  validateSearch: validateListSearch,
  component: FaqsPage,
});
const PAGE_SIZE = 8;

function FaqsPage() {
  const [items, setItems] = useState<FaqItem[]>(demoFaqs);
  const [selected, setSelected] = useState<string[]>([]);
  const can = useCanAccess("faqs");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "grid" });
  const add = () => setItems([
    ...items,
    { id: `F-${Date.now()}`, question: { en: "New question", ar: "سؤال جديد" }, answer: { en: "Answer…", ar: "الإجابة…" }, category: { en: "General", ar: "عام" } },
  ]);
  const update = (id: string, patch: Partial<FaqItem>) => setItems(items.map(x => x.id === id ? { ...x, ...patch } : x));
  const remove = (id: string) => setItems(items.filter(x => x.id !== id));
  const setBi = (b: Bilingual, key: "en" | "ar", v: string): Bilingual => ({ ...b, [key]: v });
  const sorted = useMemo(
    () =>
      sortItems(items, sort, dir, {
        id: (f) => f.id,
        category: (f) => f.category.en,
        question: (f) => f.question.en,
      }),
    [items, sort, dir],
  );
  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((f) => f.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const bulkDelete = () => { setItems((prev) => prev.filter((f) => !selected.includes(f.id))); setSelected([]); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">FAQs</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage public-facing FAQs in English and Arabic.</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} />
          {can.add && (<Button onClick={add}><Plus className="h-4 w-4 me-1" /> Add FAQ</Button>)}
        </div>
      </div>
      {view === "table" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="p-3 pb-0">
              <BulkActionBar count={selected.length} onClear={() => setSelected([])} onDelete={can.delete ? bulkDelete : undefined} />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" /></TableHead>
                  <SortableHead field="id" sort={sort} dir={dir} onSort={toggleSort}>ID</SortableHead>
                  <SortableHead field="category" sort={sort} dir={dir} onSort={toggleSort}>Category</SortableHead>
                  <SortableHead field="question" sort={sort} dir={dir} onSort={toggleSort}>Question</SortableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map(f => (
                  <TableRow key={f.id}>
                    <TableCell><Checkbox checked={selected.includes(f.id)} onCheckedChange={() => toggleOne(f.id)} aria-label="Select row" /></TableCell>
                    <TableCell className="font-mono text-xs">{f.id}</TableCell>
                    <TableCell className="text-sm">{f.category.en}</TableCell>
                    <TableCell className="text-sm font-medium max-w-xs truncate">{f.question.en}</TableCell>
                    <TableCell className="text-xs text-muted-foreground line-clamp-2 max-w-md">{f.answer.en}</TableCell>
                    <TableCell className="text-end">{can.delete && <Button size="sm" variant="ghost" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-3"><Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} /></div>
          </CardContent>
        </Card>
      )}
      {view === "list" && (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {pg.items.map(f => (
                <li key={f.id} className="p-3 flex items-center gap-3">
                  <code className="text-[10px] font-mono text-muted-foreground w-16 shrink-0">{f.id}</code>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{f.question.en}</div>
                    <div className="text-xs text-muted-foreground truncate">{f.answer.en}</div>
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{f.category.en}</span>
                  {can.delete && <Button size="sm" variant="ghost" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4" /></Button>}
                </li>
              ))}
            </ul>
            <div className="p-3"><Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} /></div>
          </CardContent>
        </Card>
      )}
      {view === "grid" && (
      <>
      <div className="space-y-3">
        {pg.items.map(f => (
          <Card key={f.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-end">
                {can.delete && <Button variant="ghost" size="icon" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Question (EN)</Label>
                  <Input dir="ltr" value={f.question.en} onChange={(e) => update(f.id, { question: setBi(f.question, "en", e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>السؤال (AR)</Label>
                  <Input dir="rtl" value={f.question.ar} onChange={(e) => update(f.id, { question: setBi(f.question, "ar", e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Answer (EN)</Label>
                  <Textarea dir="ltr" rows={3} value={f.answer.en} onChange={(e) => update(f.id, { answer: setBi(f.answer, "en", e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الإجابة (AR)</Label>
                  <Textarea dir="rtl" rows={3} value={f.answer.ar} onChange={(e) => update(f.id, { answer: setBi(f.answer, "ar", e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Category (EN)</Label>
                  <Input dir="ltr" value={f.category.en} onChange={(e) => update(f.id, { category: setBi(f.category, "en", e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الفئة (AR)</Label>
                  <Input dir="rtl" value={f.category.ar} onChange={(e) => update(f.id, { category: setBi(f.category, "ar", e.target.value) })} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} />
      </>
      )}
    </div>
  );
}
