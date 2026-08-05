import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { demoLeads, type Lead } from "@/data/demo";
import { useAdminT } from "@/lib/admin-i18n";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";

export const Route = createFileRoute("/dashboard/admin/leads/")({
  head: () => ({ meta: [{ title: "Leads — Admin" }] }),
  validateSearch: validateListSearch,
  component: LeadsPage,
});

const statusTone: Record<Lead["status"], string> = {
  new: "bg-muted text-foreground",
  qualified: "bg-amber-100 text-amber-900",
  won: "bg-emerald-100 text-emerald-900",
  lost: "bg-destructive/10 text-destructive",
};
const PAGE_SIZE = 10;
const STATUSES = ["new", "qualified", "won", "lost"] as const;

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t, lang } = useAdminT();
  const can = useCanAccess("leads");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });
  const filtered = leads.filter(l =>
    [l.name, l.company, l.email, l.service].some(v => v.toLowerCase().includes(q.toLowerCase()))
  );
  const sorted = useMemo(
    () =>
      sortItems(filtered, sort, dir, {
        id: (l) => l.id,
        name: (l) => l.name,
        company: (l) => l.company,
        service: (l) => l.service,
        date: (l) => l.createdAt,
        status: (l) => l.status,
      }),
    [filtered, sort, dir],
  );
  const pg = paginate(sorted, page, PAGE_SIZE);

  const setStatus = (id: string, status: Lead["status"]) =>
    setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
  const bulkDelete = () => {
    setLeads((prev) => prev.filter((l) => !selected.includes(l.id)));
    setSelected([]);
  };
  const bulkStatus = (status: string) => {
    setLeads((prev) => prev.map((l) => (selected.includes(l.id) ? { ...l, status: status as Lead["status"] } : l)));
    setSelected([]);
  };
  const pageIds = pg.items.map((l) => l.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const StatusSelect = ({ l }: { l: Lead }) => (
    <Select value={l.status} onValueChange={(v) => setStatus(l.id, v as Lead["status"])}>
      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
      <SelectContent>
        {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{t((s === "new" ? "new_" : s) as any)}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap">
        <div>
          <CardTitle className="font-display text-xl">{t("leads")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{sorted.length} {t("of")} {leads.length} {t("total")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder={t("search")} value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
          <ViewToggle value={view} lang={lang as "en" | "ar"} />
        </div>
      </CardHeader>
      <CardContent className={view === "table" ? "overflow-x-auto" : ""}>
      {view === "table" && (
        <BulkActionBar
          count={selected.length}
          onClear={() => setSelected([])}
          onDelete={can.delete ? bulkDelete : undefined}
          statusOptions={can.edit ? STATUSES.map((s) => ({ value: s, label: t((s === "new" ? "new_" : s) as any) as string })) : undefined}
          onStatusChange={can.edit ? bulkStatus : undefined}
        />
      )}
      {view === "table" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" />
              </TableHead>
              <SortableHead field="id" sort={sort} dir={dir} onSort={toggleSort}>{t("id")}</SortableHead>
              <SortableHead field="name" sort={sort} dir={dir} onSort={toggleSort}>{t("contact")}</SortableHead>
              <SortableHead field="service" sort={sort} dir={dir} onSort={toggleSort}>{t("service")}</SortableHead>
              <SortableHead field="date" sort={sort} dir={dir} onSort={toggleSort}>{t("date")}</SortableHead>
              <SortableHead field="status" sort={sort} dir={dir} onSort={toggleSort}>{t("status")}</SortableHead>
              <TableHead className="text-end">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.items.map(l => (
              <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate({ to: "/dashboard/admin/leads/$id", params: { id: l.id } })}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.includes(l.id)} onCheckedChange={() => toggleOne(l.id)} aria-label="Select row" />
                </TableCell>
                <TableCell className="font-mono text-xs">{l.id}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.company} · {l.email}</div>
                </TableCell>
                <TableCell className="text-sm">{l.service}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{l.createdAt}</TableCell>
                <TableCell><Badge className={`${statusTone[l.status]} border-0 capitalize`}>{t((l.status === "new" ? "new_" : l.status) as any)}</Badge></TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <div className="ms-auto inline-block"><StatusSelect l={l} /></div>
                </TableCell>
              </TableRow>
            ))}
            {pg.items.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">{t("noResults")}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
      {view === "grid" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pg.items.map(l => (
            <article key={l.id} className="border rounded-lg p-3 bg-card hover:border-accent transition-colors cursor-pointer" onClick={() => navigate({ to: "/dashboard/admin/leads/$id", params: { id: l.id } })}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <code className="text-[10px] font-mono text-muted-foreground">{l.id}</code>
                <Badge className={`${statusTone[l.status]} border-0 capitalize text-[10px]`}>{t((l.status === "new" ? "new_" : l.status) as any)}</Badge>
              </div>
              <div className="font-medium text-sm">{l.name}</div>
              <div className="text-xs text-muted-foreground truncate">{l.company} · {l.email}</div>
              <div className="text-xs mt-2">{l.service}</div>
              <div className="text-[11px] text-muted-foreground mb-2">{l.createdAt}</div>
              <div onClick={(e) => e.stopPropagation()}><StatusSelect l={l} /></div>
            </article>
          ))}
          {pg.items.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground py-8">{t("noResults")}</p>}
        </div>
      )}
      {view === "list" && (
        <ul className="divide-y">
          {pg.items.map(l => (
            <li key={l.id} className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/40 px-2 -mx-2 rounded" onClick={() => navigate({ to: "/dashboard/admin/leads/$id", params: { id: l.id } })}>
              <code className="text-[10px] font-mono text-muted-foreground w-16 shrink-0">{l.id}</code>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{l.name} <span className="text-muted-foreground font-normal">— {l.company}</span></div>
                <div className="text-xs text-muted-foreground truncate">{l.service} · {l.createdAt}</div>
              </div>
              <Badge className={`${statusTone[l.status]} border-0 capitalize hidden sm:inline-flex`}>{t((l.status === "new" ? "new_" : l.status) as any)}</Badge>
              <div onClick={(e) => e.stopPropagation()}><StatusSelect l={l} /></div>
            </li>
          ))}
          {pg.items.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">{t("noResults")}</li>}
        </ul>
      )}
      <Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}
