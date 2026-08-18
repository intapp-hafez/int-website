import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Users, Loader2, Search, UserCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DbClient = {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  tier: "Strategic" | "Enterprise" | "SMB";
  projects: number;
  isRegistered?: boolean;
  role?: string;
};

export const Route = createFileRoute("/dashboard/admin/clients/")({
  head: () => ({ meta: [{ title: "Clients Directory — Admin" }] }),
  validateSearch: validateListSearch,
  component: ClientsPage,
});

const PAGE_SIZE = 10;

function ClientsPage() {
  const [items, setItems] = useState<DbClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t, lang, isRtl } = useAdminT();
  const isAr = lang === "ar";
  const can = useCanAccess("clients");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });

  const loadClients = async () => {
    try {
      setLoading(true);
      const [rolesRes, leadsRes, quotesRes] = await Promise.all([
        supabase.from("user_roles").select("*"),
        supabase.from("leads").select("*"),
        supabase.from("quotes").select("*"),
      ]);

      const map = new Map<string, DbClient>();

      // 1. Registered Client Accounts (role = 'client' or 'client_user' or 'user')
      const clientRoles = (rolesRes.data || []).filter(
        (r: any) => ["client", "client_user", "user"].includes(r.role?.toLowerCase())
      );

      clientRoles.forEach((r: any) => {
        const id = r.user_id || r.id;
        const key = (r.user_id || r.display_name || r.id).toLowerCase();
        map.set(key, {
          id,
          company: r.display_name ? `${r.display_name} (Client)` : "Registered Client Account",
          contact: r.display_name || "Client User",
          email: "—",
          phone: "—",
          tier: "Strategic",
          projects: 1,
          isRegistered: true,
          role: r.role,
        });
      });

      // 2. Leads inquiries
      (leadsRes.data || []).forEach((l: any) => {
        const key = (l.company || l.email || l.id).toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: l.id,
            company: l.company || l.full_name || "Enterprise Client",
            contact: l.full_name || "Primary Contact",
            email: l.email || "—",
            phone: l.phone || "—",
            tier: "Enterprise",
            projects: 1,
            isRegistered: false,
          });
        } else {
          const cur = map.get(key)!;
          cur.projects += 1;
          if (cur.email === "—" && l.email) cur.email = l.email;
          if (cur.phone === "—" && l.phone) cur.phone = l.phone;
          if (l.company) cur.company = l.company;
        }
      });

      // 3. Quotes clients
      (quotesRes.data || []).forEach((q: any) => {
        const key = (q.company || q.email || q.id).toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: q.id,
            company: q.company || q.full_name || "Enterprise Client",
            contact: q.full_name || "Representative",
            email: q.email || "—",
            phone: q.phone || "—",
            tier: "Strategic",
            projects: 1,
            isRegistered: false,
          });
        } else {
          const cur = map.get(key)!;
          cur.projects += 1;
          cur.tier = "Strategic";
          if (cur.email === "—" && q.email) cur.email = q.email;
          if (cur.phone === "—" && q.phone) cur.phone = q.phone;
        }
      });

      setItems(Array.from(map.values()));
    } catch (err) {
      console.warn("[admin-clients] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClients();
  }, []);

  const filtered = items.filter((c) =>
    [c.company, c.contact, c.email, c.phone].some((v) => v.toLowerCase().includes(q.toLowerCase()))
  );

  const sorted = useMemo(
    () =>
      sortItems(filtered, sort, dir, {
        company: (c) => c.company,
        contact: (c) => c.contact,
        tier: (c) => c.tier,
        projects: (c) => c.projects,
      }),
    [filtered, sort, dir]
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

  const tone: Record<string, string> = {
    Strategic: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400",
    Enterprise: "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400",
    SMB: "bg-muted text-foreground",
  };

  const go = (id: string) => navigate({ to: "/dashboard/admin/clients/$id", params: { id } });

  return (
    <div className="space-y-6 max-w-6xl" dir={isRtl ? "rtl" : "ltr"}>
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <span>{isAr ? "دليل الشركات والعملاء" : "Clients & Accounts Directory"}</span>
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                {items.length} {isAr ? "عميل" : "Clients"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? "يجمع الحسابات المسجلة برتبة عميل والشركات المرتبطة بطلبات عروض الأسعار والمشاريع."
                : "Aggregates registered Client portal accounts, quote requests, and active enterprise engagements."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالشركة أو العميل..." : "Search clients..."}
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                className="ps-9 h-9 text-xs rounded-xl w-48 sm:w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={loadClients} disabled={loading} className="rounded-xl">
              <RefreshCw className={`h-4 w-4 me-1.5 ${loading ? "animate-spin" : ""}`} />
              {isAr ? "تحديث" : "Refresh"}
            </Button>
            <ViewToggle value={view} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <BulkActionBar count={selected.length} onClear={() => setSelected([])} onDelete={can.delete ? bulkDelete : undefined} />

          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
              <span>{isAr ? "جارٍ جلب دليل العملاء..." : "Loading client directory from database..."}</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{isAr ? "لا يوجد عملاء مطابقون." : "No clients found."}</p>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} />
                    </TableHead>
                    <SortableHead field="company" sort={sort} dir={dir} onSort={toggleSort}>{isAr ? "الشركة / الحساب" : "Company / Account"}</SortableHead>
                    <SortableHead field="contact" sort={sort} dir={dir} onSort={toggleSort}>{isAr ? "المسؤول" : "Contact"}</SortableHead>
                    <TableHead>{isAr ? "الهاتف" : "Phone"}</TableHead>
                    <SortableHead field="tier" sort={sort} dir={dir} onSort={toggleSort}>{isAr ? "الفئة" : "Tier"}</SortableHead>
                    <SortableHead field="projects" sort={sort} dir={dir} onSort={toggleSort}>{isAr ? "المشاريع / الطلبات" : "Engagements"}</SortableHead>
                    <TableHead className="text-end">{isAr ? "النوع" : "Type"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pg.items.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/40 transition"
                      onClick={() => go(c.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggleOne(c.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          {c.isRegistered && <UserCheck className="h-3.5 w-3.5 text-accent shrink-0" />}
                          <span className="truncate">{c.company}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{c.contact}</div>
                        <div className="text-[11px] text-muted-foreground">{c.email}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{c.phone}</TableCell>
                      <TableCell>
                        <Badge className={`${tone[c.tier] || "bg-muted"} border-0 text-[10px]`}>{c.tier}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold">{c.projects}</TableCell>
                      <TableCell className="text-end">
                        {c.isRegistered ? (
                          <Badge variant="outline" className="text-[10px] text-accent border-accent/30 bg-accent/5">
                            {isAr ? "عميل مسجل" : "Client User"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            {isAr ? "طلب خارجي" : "Inquiry"}
                          </Badge>
                        )}
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
    </div>
  );
}