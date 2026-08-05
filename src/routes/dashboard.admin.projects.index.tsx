import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjects } from "@/lib/projects-store";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";

export const Route = createFileRoute("/dashboard/admin/projects/")({
  head: () => ({ meta: [{ title: "Projects — Admin" }] }),
  validateSearch: validateListSearch,
  component: ProjectsAdmin,
});
const PAGE_SIZE = 9;

function ProjectsAdmin() {
  const { items, remove } = useProjects();
  const [selected, setSelected] = useState<number[]>([]);
  const navigate = useNavigate();
  const { t, lang } = useAdminT();
  const can = useCanAccess("projects");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "grid" });
  const sorted = useMemo(
    () =>
      sortItems(items, sort, dir, {
        id: (p) => p.id,
        title: (p) => (lang === "ar" ? p.title.ar : p.title.en),
        industry: (p) => p.industry,
      }),
    [items, sort, dir, lang],
  );
  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((p) => p.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const bulkDelete = () => { selected.forEach((id) => remove(id)); setSelected([]); };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap">
        <div>
          <CardTitle className="font-display text-xl">{t("projects")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{items.length} {lang === "ar" ? "مشروع منشور" : "published projects"}</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} lang={lang as "en" | "ar"} />
          {can.add && (
            <Button asChild><Link to="/dashboard/admin/projects/new"><Plus className="h-4 w-4 me-2" /> {t("addProject")}</Link></Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {view === "table" && (
          <BulkActionBar count={selected.length} onClear={() => setSelected([])} onDelete={can.delete ? bulkDelete : undefined} />
        )}
        {view === "grid" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pg.items.map(p => (
          <article key={p.id} className="border rounded-lg overflow-hidden bg-card cursor-pointer hover:border-accent transition-colors" onClick={() => navigate({ to: "/dashboard/admin/projects/$id", params: { id: String(p.id) } })}>
            <img src={p.image} alt="" className="w-full h-32 object-cover" />
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="text-[10px]">{p.industry}</Badge>
                <span className="text-[10px] text-muted-foreground">#{p.id}</span>
              </div>
              <h3 className="font-medium text-sm line-clamp-1">{lang === "ar" ? p.title.ar : p.title.en}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{lang === "ar" ? p.desc.ar : p.desc.en}</p>
              <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                {can.edit && (
                  <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/dashboard/admin/projects/$id/edit" params={{ id: String(p.id) }}><Pencil className="h-3.5 w-3.5 me-1" /> {t("edit")}</Link></Button>
                )}
                {can.delete && (
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(t("deleteConfirm"))) remove(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            </div>
          </article>
        ))}
          </div>
        )}
        {view === "table" && (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" /></TableHead>
                <SortableHead field="id" sort={sort} dir={dir} onSort={toggleSort}>#</SortableHead>
                <TableHead>{lang === "ar" ? "الصورة" : "Image"}</TableHead>
                <SortableHead field="title" sort={sort} dir={dir} onSort={toggleSort}>{lang === "ar" ? "العنوان" : "Title"}</SortableHead>
                <SortableHead field="industry" sort={sort} dir={dir} onSort={toggleSort}>{lang === "ar" ? "القطاع" : "Industry"}</SortableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pg.items.map(p => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate({ to: "/dashboard/admin/projects/$id", params: { id: String(p.id) } })}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggleOne(p.id)} aria-label="Select row" />
                  </TableCell>
                  <TableCell className="font-mono text-xs">#{p.id}</TableCell>
                  <TableCell><img src={p.image} alt="" className="h-10 w-16 object-cover rounded" /></TableCell>
                  <TableCell className="text-sm font-medium">{lang === "ar" ? p.title.ar : p.title.en}</TableCell>
                  <TableCell><Badge variant="secondary">{p.industry}</Badge></TableCell>
                  <TableCell className="text-end space-x-1" onClick={(e) => e.stopPropagation()}>
                    {can.edit && (
                      <Button asChild size="sm" variant="outline"><Link to="/dashboard/admin/projects/$id/edit" params={{ id: String(p.id) }}><Pencil className="h-3.5 w-3.5" /></Link></Button>
                    )}
                    {can.delete && (
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(t("deleteConfirm"))) remove(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
        {view === "list" && (
          <ul className="divide-y">
            {pg.items.map(p => (
              <li key={p.id} className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/40 px-2 -mx-2 rounded" onClick={() => navigate({ to: "/dashboard/admin/projects/$id", params: { id: String(p.id) } })}>
                <img src={p.image} alt="" className="h-10 w-14 object-cover rounded shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{lang === "ar" ? p.title.ar : p.title.en}</div>
                  <div className="text-xs text-muted-foreground truncate">{lang === "ar" ? p.desc.ar : p.desc.en}</div>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex">{p.industry}</Badge>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {can.edit && (
                    <Button asChild size="sm" variant="outline"><Link to="/dashboard/admin/projects/$id/edit" params={{ id: String(p.id) }}><Pencil className="h-3.5 w-3.5" /></Link></Button>
                  )}
                  {can.delete && (
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(t("deleteConfirm"))) remove(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}