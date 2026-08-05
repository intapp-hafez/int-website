import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoReviews, type Review } from "@/data/demo";
import { Star, Check, X, Trash2 } from "lucide-react";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin" }] }),
  validateSearch: validateListSearch,
  component: ReviewsPage,
});
const PAGE_SIZE = 8;

function ReviewsPage() {
  const { t, isRtl } = useAdminT();
  const [items, setItems] = useState<Review[]>(demoReviews);
  const [selected, setSelected] = useState<string[]>([]);
  const can = useCanAccess("reviews");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "grid" });
  const toggle = (id: string) => setItems(items.map(x => x.id === id ? { ...x, approved: !x.approved } : x));
  const remove = (id: string) => setItems(items.filter(x => x.id !== id));
  const sorted = useMemo(
    () =>
      sortItems(items, sort, dir, {
        author: (r) => r.author,
        company: (r) => r.company,
        rating: (r) => r.rating,
        date: (r) => r.date,
        status: (r) => (r.approved ? 1 : 0),
      }),
    [items, sort, dir],
  );
  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const bulkDelete = () => { setItems((prev) => prev.filter((x) => !selected.includes(x.id))); setSelected([]); };
  const bulkStatus = (v: string) => {
    const approved = v === "approved";
    setItems((prev) => prev.map((x) => (selected.includes(x.id) ? { ...x, approved } : x)));
    setSelected([]);
  };

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{t("reviewsTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("reviewsSub")}</p>
        </div>
        <ViewToggle value={view} />
      </div>

      {view === "grid" && (
      <div className="grid md:grid-cols-2 gap-4">
        {pg.items.map(r => (
          <Card key={r.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{r.author}</div>
                  <div className="text-xs text-muted-foreground">{r.company} · {r.date}</div>
                </div>
                <Badge variant={r.approved ? "default" : "secondary"}>{r.approved ? t("approved") : t("pendingReview")}</Badge>
              </div>
              <div className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : "opacity-30"}`} />)}
              </div>
              <p className="text-sm">{r.text}</p>
              <div className="flex gap-2 pt-2">
                {can.edit && (
                  <Button size="sm" variant={r.approved ? "outline" : "default"} onClick={() => toggle(r.id)}>
                    {r.approved ? <><X className="h-4 w-4 me-1" /> {t("unapprove")}</> : <><Check className="h-4 w-4 me-1" /> {t("approve")}</>}
                  </Button>
                )}
                {can.delete && <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {view === "table" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="p-3 pb-0">
              <BulkActionBar
                count={selected.length}
                onClear={() => setSelected([])}
                onDelete={can.delete ? bulkDelete : undefined}
                statusOptions={can.edit ? [{ value: "approved", label: t("approve") }, { value: "pending", label: t("unapprove") }] : undefined}
                onStatusChange={can.edit ? bulkStatus : undefined}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" /></TableHead>
                  <SortableHead field="author" sort={sort} dir={dir} onSort={toggleSort}>{t("author")}</SortableHead>
                  <SortableHead field="company" sort={sort} dir={dir} onSort={toggleSort}>{t("company")}</SortableHead>
                  <SortableHead field="rating" sort={sort} dir={dir} onSort={toggleSort}>{t("rating")}</SortableHead>
                  <TableHead>{t("reviewCol")}</TableHead>
                  <SortableHead field="status" sort={sort} dir={dir} onSort={toggleSort}>{t("status")}</SortableHead>
                  <TableHead className="text-end">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggleOne(r.id)} aria-label="Select row" /></TableCell>
                    <TableCell className="font-medium">{r.author}</TableCell>
                    <TableCell className="text-sm">{r.company}</TableCell>
                    <TableCell>
                      <div className="flex text-amber-500">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground line-clamp-2 max-w-md">{r.text}</TableCell>
                    <TableCell><Badge variant={r.approved ? "default" : "secondary"}>{r.approved ? t("approved") : t("pendingReview")}</Badge></TableCell>
                    <TableCell className="text-end space-x-1">
                      {can.edit && <Button size="sm" variant="ghost" onClick={() => toggle(r.id)}>{r.approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}</Button>}
                      {can.delete && <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </TableCell>
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
              {pg.items.map(r => (
                <li key={r.id} className="p-4 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.author}</span>
                      <span className="text-xs text-muted-foreground">— {r.company}</span>
                      <div className="flex text-amber-500">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.text}</p>
                  </div>
                  <Badge variant={r.approved ? "default" : "secondary"} className="shrink-0">{r.approved ? t("approved") : t("pendingReview")}</Badge>
                  {can.edit && <Button size="sm" variant="ghost" onClick={() => toggle(r.id)}>{r.approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}</Button>}
                  {can.delete && <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {(view === "grid" || view === "list") && (
        <Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} />
      )}
    </div>
  );
}