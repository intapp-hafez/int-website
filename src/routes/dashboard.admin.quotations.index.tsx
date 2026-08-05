import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoQuotations, type Quotation } from "@/data/demo";
import { useAdminT } from "@/lib/admin-i18n";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";

export const Route = createFileRoute("/dashboard/admin/quotations/")({
  head: () => ({ meta: [{ title: "Quotations — Admin" }] }),
  validateSearch: validateListSearch,
  component: QuotationsPage,
});
const PAGE_SIZE = 10;
const Q_STATUSES = ["draft", "sent", "accepted", "rejected"] as const;

function QuotationsPage() {
  const [items, setItems] = useState<Quotation[]>(demoQuotations);
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t, lang } = useAdminT();
  const can = useCanAccess("quotations");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });
  const total = items.reduce((a, b) => a + b.amount, 0);
  const won = items.filter(q => q.status === "accepted").reduce((a, b) => a + b.amount, 0);
  const sorted = useMemo(
    () =>
      sortItems(items, sort, dir, {
        id: (q) => q.id,
        client: (q) => q.client,
        service: (q) => q.service,
        amount: (q) => q.amount,
        date: (q) => q.date,
        status: (q) => q.status,
      }),
    [items, sort, dir],
  );
  const pg = paginate(sorted, page, PAGE_SIZE);
  const setStatus = (id: string, status: Quotation["status"]) => setItems(items.map(x => x.id === id ? { ...x, status } : x));
  const bulkDelete = () => { setItems((prev) => prev.filter((x) => !selected.includes(x.id))); setSelected([]); };
  const bulkStatus = (status: string) => {
    setItems((prev) => prev.map((x) => (selected.includes(x.id) ? { ...x, status: status as Quotation["status"] } : x)));
    setSelected([]);
  };
  const pageIds = pg.items.map((q) => q.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const StatusSelect = ({ q }: { q: Quotation }) => (
    <Select value={q.status} onValueChange={(v) => setStatus(q.id, v as Quotation["status"])}>
      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
      <SelectContent>
        {Q_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{t(s)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
  const go = (id: string) => navigate({ to: "/dashboard/admin/quotations/$id", params: { id } });

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">{t("pipelineValue")}</div><div className="font-display text-2xl font-bold mt-1">${total.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">{t("accepted")}</div><div className="font-display text-2xl font-bold mt-1">${won.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">{t("quotes")}</div><div className="font-display text-2xl font-bold mt-1">{items.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap">
          <CardTitle className="font-display text-xl">{t("quotations")}</CardTitle>
          <ViewToggle value={view} lang={lang as "en" | "ar"} />
        </CardHeader>
        <CardContent className={view === "table" ? "overflow-x-auto" : ""}>
        {view === "table" && (
          <BulkActionBar
            count={selected.length}
            onClear={() => setSelected([])}
            onDelete={can.delete ? bulkDelete : undefined}
            statusOptions={can.edit ? Q_STATUSES.map((s) => ({ value: s, label: t(s) as string })) : undefined}
            onStatusChange={can.edit ? bulkStatus : undefined}
          />
        )}
        {view === "table" && (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" /></TableHead>
              <SortableHead field="id" sort={sort} dir={dir} onSort={toggleSort}>{t("id")}</SortableHead>
              <SortableHead field="client" sort={sort} dir={dir} onSort={toggleSort}>{t("client")}</SortableHead>
              <SortableHead field="service" sort={sort} dir={dir} onSort={toggleSort}>{t("service")}</SortableHead>
              <SortableHead field="amount" sort={sort} dir={dir} onSort={toggleSort}>{t("amount")}</SortableHead>
              <SortableHead field="date" sort={sort} dir={dir} onSort={toggleSort}>{t("date")}</SortableHead>
              <SortableHead field="status" sort={sort} dir={dir} onSort={toggleSort} align="end">{t("status")}</SortableHead>
            </TableRow></TableHeader>
            <TableBody>
              {pg.items.map(q => (
                <TableRow key={q.id} className="cursor-pointer hover:bg-muted/50" onClick={() => go(q.id)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.includes(q.id)} onCheckedChange={() => toggleOne(q.id)} aria-label="Select row" />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{q.id}</TableCell>
                  <TableCell className="text-sm">{q.client}</TableCell>
                  <TableCell className="text-sm">{q.service}</TableCell>
                  <TableCell className="text-sm font-medium">${q.amount.toLocaleString()} {q.currency}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{q.date}</TableCell>
                  <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="ms-auto inline-block"><StatusSelect q={q} /></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {view === "grid" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pg.items.map(q => (
              <article key={q.id} className="border rounded-lg p-3 cursor-pointer hover:border-accent transition-colors" onClick={() => go(q.id)}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <code className="text-[10px] font-mono text-muted-foreground">{q.id}</code>
                  <Badge variant="secondary" className="text-[10px] capitalize">{t(q.status)}</Badge>
                </div>
                <div className="font-medium text-sm">{q.client}</div>
                <div className="text-xs text-muted-foreground">{q.service}</div>
                <div className="text-sm font-bold mt-2">${q.amount.toLocaleString()} {q.currency}</div>
                <div className="text-[11px] text-muted-foreground mb-2">{q.date}</div>
                <div onClick={(e) => e.stopPropagation()}><StatusSelect q={q} /></div>
              </article>
            ))}
          </div>
        )}
        {view === "list" && (
          <ul className="divide-y">
            {pg.items.map(q => (
              <li key={q.id} className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/40 px-2 -mx-2 rounded" onClick={() => go(q.id)}>
                <code className="text-[10px] font-mono text-muted-foreground w-16 shrink-0">{q.id}</code>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{q.client}</div>
                  <div className="text-xs text-muted-foreground truncate">{q.service} · {q.date}</div>
                </div>
                <div className="text-sm font-medium hidden sm:block">${q.amount.toLocaleString()}</div>
                <div onClick={(e) => e.stopPropagation()}><StatusSelect q={q} /></div>
              </li>
            ))}
          </ul>
        )}
        <Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}