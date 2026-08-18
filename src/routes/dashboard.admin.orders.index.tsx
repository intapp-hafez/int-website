import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ShoppingBag, RefreshCw, DollarSign, Package } from "lucide-react";
import { listOrders } from "@/lib/admin-data.functions";
import { useAdminT } from "@/lib/admin-i18n";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const { t, lang, isRtl } = useAdminT();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    setError(null);
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

  useEffect(() => {
    void load();
  }, []);

  const updateOrderStatus = async (id: string, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Optimistic update
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    try {
      const { error } = await (supabase as any).from("orders").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      toast.success(isAr ? `تم تحديث حالة الطلب إلى ${newStatus}` : `Order status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update order status");
      void load();
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (term) {
        const hay = `${r.full_name} ${r.email} ${r.company} ${r.id}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [rows, q, statusFilter]);

  const totalRevenue = useMemo(() => {
    return rows.reduce((acc, r) => acc + orderTotal(r.items).total, 0);
  }, [rows]);

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Metric Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{isAr ? "إجمالي الطلبات" : "Total Orders"}</span>
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="font-display text-2xl font-bold mt-1">{rows.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{isAr ? "الطلبات النشطة" : "Active Orders"}</span>
              <ShoppingBag className="h-4 w-4 text-accent" />
            </div>
            <div className="font-display text-2xl font-bold mt-1 text-accent">
              {rows.filter((r) => !["delivered", "cancelled"].includes(r.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{isAr ? "إجمالي المبيعات" : "Total Value"}</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="font-display text-2xl font-bold mt-1 text-emerald-600 font-mono">
              ${totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap pb-4">
          <div>
            <CardTitle className="font-display text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" />
              <span>{isAr ? "طلبات الشراء والمنتجات" : "Orders & Deliveries"}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {filtered.length} {isAr ? "من" : "of"} {rows.length} {isAr ? "إجمالي الطلبات" : "total orders"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="ps-9 h-9 text-xs rounded-xl w-48 sm:w-56"
                placeholder={isAr ? "بحث بالاسم أو الرقم..." : "Search orders..."}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الحالات" : "All Statuses"}</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="rounded-xl">
              <RefreshCw className={`h-4 w-4 me-1 ${loading ? "animate-spin" : ""}`} /> {isAr ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
              <span>{isAr ? "جارٍ جلب الطلبات..." : "Loading orders..."}</span>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-destructive text-sm">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />
              {rows.length === 0 ? (isAr ? "لا توجد طلبات مسجلة بعد." : "No orders recorded yet.") : (isAr ? "لا توجد نتائج مطابقة." : "No matching orders found.")}
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">{isAr ? "رقم الطلب" : "Order #"}</TableHead>
                    <TableHead className="text-xs font-semibold">{isAr ? "العميل والشركة" : "Customer"}</TableHead>
                    <TableHead className="text-xs font-semibold">{isAr ? "العناصر" : "Items"}</TableHead>
                    <TableHead className="text-xs font-semibold">{isAr ? "المبلغ" : "Total"}</TableHead>
                    <TableHead className="text-xs font-semibold">{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-xs font-semibold">{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead className="text-xs font-semibold text-end">{isAr ? "عرض" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const { total, currency, qty } = orderTotal(r.items);
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/40 transition"
                        onClick={() => navigate({ to: "/dashboard/admin/orders/$id", params: { id: r.id } })}
                      >
                        <TableCell className="font-mono text-xs font-bold text-accent">
                          <Link
                            to="/dashboard/admin/orders/$id"
                            params={{ id: r.id }}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline"
                          >
                            #{r.id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-xs">{r.full_name}</div>
                          <div className="text-[11px] text-muted-foreground">{r.email}{r.company ? ` · ${r.company}` : ""}</div>
                        </TableCell>
                        <TableCell className="text-xs">{qty} {isAr ? "عنصر" : "items"}</TableCell>
                        <TableCell className="font-mono font-bold text-xs">
                          {total > 0 ? `$${total.toLocaleString()} ${currency}` : "—"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={r.status}
                            onValueChange={(v) => updateOrderStatus(r.id, v)}
                          >
                            <SelectTrigger className={`h-7 w-28 text-[11px] rounded-lg border font-medium ${STATUS_TONE[r.status] || ""}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map((s) => (
                                <SelectItem key={s} value={s} className="capitalize text-xs">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(r.created_at).toLocaleDateString(isAr ? "ar" : "en")}
                        </TableCell>
                        <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7"
                            onClick={() => navigate({ to: "/dashboard/admin/orders/$id", params: { id: r.id } })}
                          >
                            {isAr ? "عرض" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}