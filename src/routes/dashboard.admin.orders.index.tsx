import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ShoppingBag, RefreshCw } from "lucide-react";
import { listOrders } from "@/lib/admin-data.functions";
import { useAdminT } from "@/lib/admin-i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/admin/orders/")({
  component: OrdersList,
});

export type OrderRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  message: string;
  items: any;
  product_name: string;
};

export const ORDER_STATUSES = ["new", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const STATUS_TONE: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  confirmed: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  processing: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  shipped: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
  delivered: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export function orderTotal(items: any): { total: number; currency: string; qty: number } {
  const arr = Array.isArray(items) ? items : [];
  let total = 0, qty = 0;
  let currency = "USD";
  for (const i of arr) {
    qty += Number(i.quantity || 0);
    if (i.price != null) total += Number(i.price) * Number(i.quantity || 0);
    if (i.currency) currency = i.currency;
  }
  return { total, currency, qty };
}

function OrdersList() {
  const { t, lang } = useAdminT();
  const navigate = useNavigate();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await listOrders();
      setRows((data as any) ?? []);
    } catch (e: any) {
      console.error("[orders] listOrders failed", e);
      setError(e?.message || "Failed to load orders");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(r => {
      if (status !== "all" && r.status !== status) return false;
      if (term) {
        const hay = `${r.full_name} ${r.email} ${r.company} ${r.id}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [rows, q, status]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="font-display text-xl">{t("ordersTitle")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("ordersSub")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-4 w-4 absolute start-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-8 w-56" placeholder={t("search")} value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {ORDER_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{(t as any)(s) ?? s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 me-1 ${loading ? "animate-spin" : ""}`} /> {t("refresh")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : error ? (
          <div className="text-center py-10 text-destructive text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />
            {rows.length === 0 ? t("noOrders") : t("noResults")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orderNo")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("items")}</TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => {
                const { total, currency, qty } = orderTotal(r.items);
                return (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate({ to: "/dashboard/admin/orders/$id", params: { id: r.id } })}
                  >
                    <TableCell className="font-mono text-xs">
                      <Link to="/dashboard/admin/orders/$id" params={{ id: r.id }} onClick={(e) => e.stopPropagation()} className="hover:text-accent">#{r.id.slice(0, 8)}</Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}{r.company ? ` · ${r.company}` : ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{qty} {t("items")}</TableCell>
                    <TableCell className="font-medium">{total > 0 ? `${total.toLocaleString()} ${currency}` : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={`${STATUS_TONE[r.status] || ""} capitalize`}>{(t as any)(r.status) ?? r.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString(lang === "ar" ? "ar" : "en")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}