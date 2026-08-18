import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminT } from "@/lib/admin-i18n";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Inbox, Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DbLead = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  status: "new" | "qualified" | "won" | "lost";
  createdAt: string;
};

export const Route = createFileRoute("/dashboard/admin/leads/")({
  head: () => ({ meta: [{ title: "Leads Pipeline — Admin" }] }),
  validateSearch: validateListSearch,
  component: LeadsPage,
});

const statusTone: Record<string, string> = {
  new: "bg-muted text-foreground",
  qualified: "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400",
  won: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400",
  lost: "bg-destructive/10 text-destructive",
};
const PAGE_SIZE = 10;
const STATUSES = ["new", "qualified", "won", "lost"] as const;

function LeadsPage() {
  const [leads, setLeads] = useState<DbLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t, lang, isRtl } = useAdminT();
  const can = useCanAccess("leads");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        const mapped: DbLead[] = data.map((l: any) => ({
          id: l.id,
          name: l.full_name || l.name || "Anonymous Lead",
          company: l.company || "Enterprise Client",
          email: l.email || "—",
          phone: l.phone,
          service: l.service || "General Inquiry",
          message: l.message || "",
          status: (l.status as any) || "new",
          createdAt: l.created_at ? new Date(l.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        }));
        setLeads(mapped);
      }
    } catch (err) {
      console.warn("[admin-leads] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads();

    const channel = supabase
      .channel("admin_leads_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        void loadLeads();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = leads.filter((l) =>
    [l.name, l.company, l.email, l.service].some((v) => v.toLowerCase().includes(q.toLowerCase()))
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

  const setStatus = async (id: string, status: DbLead["status"]) => {
    if (!can.edit) return;
    setLeads(leads.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(t("Lead status updated", "تم تحديث حالة العميل المحتمل"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to update lead status");
      void loadLeads();
    }
  };

  const bulkDelete = async () => {
    if (!can.delete || selected.length === 0) return;
    if (!confirm(t(`Delete ${selected.length} leads?`, `هل تريد حذف ${selected.length} عملاء محتملين؟`))) return;

    const toDelete = [...selected];
    setLeads((prev) => prev.filter((l) => !toDelete.includes(l.id)));
    setSelected([]);

    try {
      const { error } = await supabase.from("leads").delete().in("id", toDelete);
      if (error) throw error;
      toast.success(t("Selected leads deleted", "تم حذف العملاء المحتملين"));
    } catch (err: any) {
      toast.error(err?.message || "Bulk deletion failed");
      void loadLeads();
    }
  };

  const bulkStatus = async (status: string) => {
    if (!can.edit || selected.length === 0) return;
    const toUpdate = [...selected];
    setLeads((prev) => prev.map((l) => (toUpdate.includes(l.id) ? { ...l, status: status as DbLead["status"] } : l)));
    setSelected([]);

    try {
      const { error } = await supabase.from("leads").update({ status }).in("id", toUpdate);
      if (error) throw error;
      toast.success(t("Selected leads updated", "تم تحديث حالة العملاء"));
    } catch (err: any) {
      toast.error(err?.message || "Bulk status update failed");
      void loadLeads();
    }
  };

  const pageIds = pg.items.map((l) => l.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const StatusSelect = ({ l }: { l: DbLead }) => (
    <Select value={l.status} onValueChange={(v) => setStatus(l.id, v as DbLead["status"])}>
      <SelectTrigger className="h-8 w-32 text-xs rounded-xl"><SelectValue /></SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="capitalize text-xs">
            {t((s === "new" ? "new_" : s) as any, s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Card className="rounded-2xl border shadow-xs" dir={isRtl ? "rtl" : "ltr"}>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap pb-4">
        <div>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Inbox className="h-5 w-5 text-accent" />
            <span>{t("leads", "العملاء المحتملون والطلبات")}</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {sorted.length} {t("of", "من")} {leads.length} {t("total", "إجمالي")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search", "بحث...")}
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="ps-9 h-9 text-xs rounded-xl w-48 sm:w-64"
            />
          </div>
          <ViewToggle value={view} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <BulkActionBar
          count={selected.length}
          onClear={() => setSelected([])}
          onDelete={can.delete ? bulkDelete : undefined}
          statusOptions={STATUSES.map((s) => ({ label: t((s === "new" ? "new_" : s) as any, s), value: s }))}
          onStatusChange={can.edit ? bulkStatus : undefined}
        />

        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
            <span>{t("Loading leads from database...", "جارٍ جلب بيانات العملاء المحتملين...")}</span>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("noLeads", "لا يوجد عملاء محتملون مطابقون.")}</p>
        ) : view === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pg.items.map((l) => (
              <Card key={l.id} className="p-4 rounded-xl border bg-card hover:border-accent/40 transition">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{l.id.slice(0, 8)}</span>
                  <Badge className={`${statusTone[l.status] || "bg-muted"} capitalize text-[10px]`}>{l.status}</Badge>
                </div>
                <div className="font-bold text-sm text-foreground">{l.name}</div>
                <div className="text-xs text-muted-foreground">{l.company} · {l.service}</div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">{l.message}</p>
                <div className="flex items-center justify-between pt-3 border-t mt-3 text-xs">
                  <span className="text-muted-foreground font-mono">{l.createdAt}</span>
                  <StatusSelect l={l} />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} />
                  </TableHead>
                  <SortableHead field="id" sort={sort} dir={dir} onSort={toggleSort}>{t("id", "الرقم")}</SortableHead>
                  <SortableHead field="name" sort={sort} dir={dir} onSort={toggleSort}>{t("name", "الاسم")}</SortableHead>
                  <SortableHead field="company" sort={sort} dir={dir} onSort={toggleSort}>{t("company", "الشركة")}</SortableHead>
                  <SortableHead field="service" sort={sort} dir={dir} onSort={toggleSort}>{t("service", "الخدمة")}</SortableHead>
                  <SortableHead field="date" sort={sort} dir={dir} onSort={toggleSort}>{t("date", "التاريخ")}</SortableHead>
                  <TableHead>{t("status", "الحالة")}</TableHead>
                  <TableHead className="text-end">{t("actions", "الإجراءات")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Checkbox checked={selected.includes(l.id)} onCheckedChange={() => toggleOne(l.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-accent font-bold">{l.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs font-bold">{l.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.company}</TableCell>
                    <TableCell className="text-xs">{l.service}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{l.createdAt}</TableCell>
                    <TableCell>
                      <StatusSelect l={l} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => navigate({ to: "/dashboard/admin/leads/$id", params: { id: l.id } })}
                      >
                        {t("view", "عرض")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Paginator page={pg.page} pageCount={pg.pageCount} total={pg.total} start={pg.start} end={pg.end} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}
