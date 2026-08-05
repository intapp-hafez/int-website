import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoTickets, type Ticket } from "@/data/demo";
import { useAdminT } from "@/lib/admin-i18n";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/tickets/")({
  head: () => ({ meta: [{ title: "Support Tickets — Admin" }] }),
  validateSearch: validateListSearch,
  component: TicketsPage,
});

const priorityColor: Record<Ticket["priority"], string> = {
  low: "bg-muted text-foreground",
  medium: "bg-blue-500/10 text-blue-700",
  high: "bg-amber-500/10 text-amber-700",
  urgent: "bg-red-500/10 text-red-700",
};
const PAGE_SIZE = 10;
const T_STATUSES = ["open", "pending", "resolved", "closed"] as const;
const PRIORITY_RANK: Record<Ticket["priority"], number> = { low: 1, medium: 2, high: 3, urgent: 4 };

function TicketsPage() {
  const [items, setItems] = useState<Ticket[]>(demoTickets);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t: tr, lang } = useAdminT();
  const can = useCanAccess("tickets");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });
  const filtered = items.filter(t => `${t.subject} ${t.client}`.toLowerCase().includes(q.toLowerCase()));
  const sorted = useMemo(
    () =>
      sortItems(filtered, sort, dir, {
        id: (x) => x.id,
        subject: (x) => x.subject,
        client: (x) => x.client,
        priority: (x) => PRIORITY_RANK[x.priority],
        status: (x) => x.status,
        updated: (x) => x.updated,
      }),
    [filtered, sort, dir],
  );
  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((x) => x.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const setStatus = (id: string, status: Ticket["status"]) => setItems(items.map(x => x.id === id ? { ...x, status } : x));
  const bulkDelete = () => { setItems((prev) => prev.filter((x) => !selected.includes(x.id))); setSelected([]); };
  const bulkStatus = (status: string) => {
    setItems((prev) => prev.map((x) => (selected.includes(x.id) ? { ...x, status: status as Ticket["status"] } : x)));
    setSelected([]);
  };
  const StatusSelect = ({ t }: { t: Ticket }) => (
    <Select value={t.status} onValueChange={(v) => setStatus(t.id, v as Ticket["status"])}>
      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
      <SelectContent>
        {T_STATUSES.map(s => <SelectItem key={s} value={s}>{tr(s as any)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
  const go = (id: string) => navigate({ to: "/dashboard/admin/tickets/$id", params: { id } });
  const SortBtn = ({ field, children, end }: { field: string; children: React.ReactNode; end?: boolean }) => {
    const active = sort === field;
    const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <button type="button" onClick={() => toggleSort(field)} className={`inline-flex items-center gap-1 ${active ? "text-foreground" : "text-muted-foreground"} ${end ? "ms-auto" : ""}`}>
        {children}<Icon className={`h-3 w-3 ${!active ? "opacity-50" : ""}`} />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl md:text-3xl font-bold">{tr("tickets")}</h1>
        <ViewToggle value={view} lang={lang as "en" | "ar"} />
      </div>
      <Input placeholder={tr("search")} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-sm" />
      <Card>
        <CardContent className={view === "table" ? "p-0 overflow-x-auto" : "p-3"}>
        {view === "table" && (
          <div className="p-3 pb-0">
            <BulkActionBar
              count={selected.length}
              onClear={() => setSelected([])}
              onDelete={can.delete ? bulkDelete : undefined}
              statusOptions={can.edit ? T_STATUSES.map((s) => ({ value: s, label: tr(s as any) as string })) : undefined}
              onStatusChange={can.edit ? bulkStatus : undefined}
            />
          </div>
        )}
        {view === "table" && (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-start">
              <tr>
                <th className="p-3 w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" /></th>
                <th className="p-3 text-start"><SortBtn field="id">{tr("id")}</SortBtn></th>
                <th className="p-3 text-start"><SortBtn field="subject">{tr("subject")}</SortBtn></th>
                <th className="p-3 text-start"><SortBtn field="client">{tr("client")}</SortBtn></th>
                <th className="p-3 text-start"><SortBtn field="priority">{tr("priority")}</SortBtn></th>
                <th className="p-3 text-start"><SortBtn field="status">{tr("status")}</SortBtn></th>
                <th className="p-3 text-start"><SortBtn field="updated">{tr("updated")}</SortBtn></th>
              </tr>
            </thead>
            <tbody>
              {pg.items.map(t => (
                <tr key={t.id} className="border-t cursor-pointer hover:bg-muted/50" onClick={() => go(t.id)}>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggleOne(t.id)} aria-label="Select row" />
                  </td>
                  <td className="p-3 font-mono text-xs">{t.id}</td>
                  <td className="p-3">{t.subject}</td>
                  <td className="p-3">{t.client}</td>
                  <td className="p-3"><Badge className={priorityColor[t.priority]} variant="secondary">{tr(t.priority as any)}</Badge></td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect t={t} />
                  </td>
                  <td className="p-3 text-muted-foreground">{t.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {view === "grid" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pg.items.map(t => (
              <article key={t.id} className="border rounded-lg p-3 cursor-pointer hover:border-accent transition-colors" onClick={() => go(t.id)}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <code className="text-[10px] font-mono text-muted-foreground">{t.id}</code>
                  <Badge className={priorityColor[t.priority]} variant="secondary">{tr(t.priority as any)}</Badge>
                </div>
                <div className="font-medium text-sm line-clamp-2">{t.subject}</div>
                <div className="text-xs text-muted-foreground">{t.client}</div>
                <div className="text-[11px] text-muted-foreground mb-2">{t.updated}</div>
                <div onClick={(e) => e.stopPropagation()}><StatusSelect t={t} /></div>
              </article>
            ))}
          </div>
        )}
        {view === "list" && (
          <ul className="divide-y">
            {pg.items.map(t => (
              <li key={t.id} className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/40 px-2 -mx-2 rounded" onClick={() => go(t.id)}>
                <code className="text-[10px] font-mono text-muted-foreground w-16 shrink-0">{t.id}</code>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{t.subject}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.client} · {t.updated}</div>
                </div>
                <Badge className={`${priorityColor[t.priority]} hidden sm:inline-flex`} variant="secondary">{tr(t.priority as any)}</Badge>
                <div onClick={(e) => e.stopPropagation()}><StatusSelect t={t} /></div>
              </li>
            ))}
          </ul>
        )}
        <div className="p-3"><Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} /></div>
        </CardContent>
      </Card>
    </div>
  );
}