import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { demoClients } from "@/data/demo";
import { useAdminT } from "@/lib/admin-i18n";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";

export const Route = createFileRoute("/dashboard/admin/clients/")({
  head: () => ({ meta: [{ title: "Clients — Admin" }] }),
  validateSearch: validateListSearch,
  component: ClientsPage,
});
const PAGE_SIZE = 10;

function ClientsPage() {
  const [items, setItems] = useState(demoClients);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t, lang } = useAdminT();
  const can = useCanAccess("clients");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });
  const filtered = items.filter(c => [c.company, c.contact, c.email].some(v => v.toLowerCase().includes(q.toLowerCase())));
  const sorted = useMemo(
    () =>
      sortItems(filtered, sort, dir, {
        company: (c) => c.company,
        contact: (c) => c.contact,
        tier: (c) => c.tier,
        projects: (c) => c.projects,
      }),
    [filtered, sort, dir],
  );
  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((c) => c.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const bulkDelete = () => {
    setItems((prev) => prev.filter((c) => !selected.includes(c.id)));
    setSelected([]);
  };
  const tone: Record<string, string> = { Strategic: "bg-emerald-100 text-emerald-900", Enterprise: "bg-amber-100 text-amber-900", SMB: "bg-muted text-foreground" };
  const go = (id: string) => navigate({ to: "/dashboard/admin/clients/$id", params: { id } });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap">
        <div>
          <CardTitle className="font-display text-xl">{t("clients")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{sorted.length} {t("of")} {items.length} {t("total")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder={t("search")} value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
          <ViewToggle value={view} lang={lang as "en" | "ar"} />
        </div>
      </CardHeader>
      <CardContent className={view === "table" ? "overflow-x-auto" : ""}>
      {view === "table" && (
        <BulkActionBar count={selected.length} onClear={() => setSelected([])} onDelete={can.delete ? bulkDelete : undefined} />
      )}
      {view === "table" && (
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" /></TableHead>
            <SortableHead field="company" sort={sort} dir={dir} onSort={toggleSort}>{t("company")}</SortableHead>
            <SortableHead field="contact" sort={sort} dir={dir} onSort={toggleSort}>{t("primaryContact")}</SortableHead>
            <TableHead>{t("phone")}</TableHead>
            <SortableHead field="tier" sort={sort} dir={dir} onSort={toggleSort}>{t("tier")}</SortableHead>
            <SortableHead field="projects" sort={sort} dir={dir} onSort={toggleSort} align="end">{t("projectsCol")}</SortableHead>
          </TableRow></TableHeader>
          <TableBody>
            {pg.items.map(c => (
              <TableRow key={c.id} role="button" tabIndex={0} className="cursor-pointer hover:bg-muted/50" onClick={() => go(c.id)} onKeyDown={(e) => { if (e.key === "Enter") go(c.id); }}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggleOne(c.id)} aria-label="Select row" />
                </TableCell>
                <TableCell className="font-medium">{c.company}</TableCell>
                <TableCell>
                  <div className="text-sm">{c.contact}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </TableCell>
                <TableCell className="text-sm">{c.phone}</TableCell>
                <TableCell><Badge className={`${tone[c.tier]} border-0`}>{c.tier}</Badge></TableCell>
                <TableCell className="text-end font-medium">{c.projects}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {view === "grid" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pg.items.map(c => (
            <article key={c.id} className="border rounded-lg p-4 cursor-pointer hover:border-accent transition-colors" onClick={() => go(c.id)}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-medium">{c.company}</div>
                <Badge className={`${tone[c.tier]} border-0 text-[10px]`}>{c.tier}</Badge>
              </div>
              <div className="text-sm">{c.contact}</div>
              <div className="text-xs text-muted-foreground truncate">{c.email}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.phone}</div>
              <div className="text-xs mt-2">{c.projects} {lang === "ar" ? "مشروع" : "projects"}</div>
            </article>
          ))}
        </div>
      )}
      {view === "list" && (
        <ul className="divide-y">
          {pg.items.map(c => (
            <li key={c.id} className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/40 px-2 -mx-2 rounded" onClick={() => go(c.id)}>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{c.company}</div>
                <div className="text-xs text-muted-foreground truncate">{c.contact} · {c.email}</div>
              </div>
              <Badge className={`${tone[c.tier]} border-0 hidden sm:inline-flex`}>{c.tier}</Badge>
              <div className="text-xs font-medium w-12 text-end">{c.projects}</div>
            </li>
          ))}
        </ul>
      )}
      <Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}