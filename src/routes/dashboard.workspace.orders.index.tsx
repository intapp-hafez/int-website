import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, FileText } from "lucide-react";
import { useClientT } from "@/lib/client-i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/workspace/orders/")({
  component: ClientOrders,
});

export type WorkspaceOrder = {
  id: string;
  service: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  date: string;
};

function ClientOrders() {
  const { t, isRtl } = useClientT();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<WorkspaceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  const loadOrders = async () => {
    try {
      if (!user) return;
      const { data, error } = await (supabase as any).from("quotes")
        .select("*")
        .or(`email.eq.${user.email},full_name.eq.${user.user_metadata?.full_name || ""}`)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const mapped: WorkspaceOrder[] = data.map((q: any) => ({
          id: q.id,
          service: q.service_name || q.items?.[0]?.name_en || "System Integration Quotation",
          amount: Number(q.total) || 0,
          currency: q.currency || "USD",
          status: q.status || "sent",
          date: q.created_at ? new Date(q.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        }));
        setOrders(mapped);
      }
    } catch (err) {
      console.warn("[workspace-orders] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [user]);

  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const paged = orders.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const tone: Record<string, string> = {
    draft: "bg-muted text-foreground",
    sent: "bg-blue-500/10 text-blue-700",
    accepted: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400",
    rejected: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="rounded-2xl border shadow-xs">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          <span>{t("orders", "عروض الأسعار والطلبات")}</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("ordersTagline", "استعراض ومتابعة عروض الأسعار والطلبات الخاصة بك")}</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-accent" />
            <span>{t("Loading your quotations...", "جارٍ جلب عروض الأسعار...")}</span>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("noOrders", "لا توجد عروض أسعار أو طلبات حالياً.")}</p>
        ) : (
          <>
            {/* Mobile card grid */}
            <div className="grid gap-3 sm:hidden">
              {paged.map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate({ to: "/dashboard/workspace/orders/$id", params: { id: o.id } })}
                  className="text-start rounded-xl border bg-card p-4 shadow-sm hover:shadow-md active:scale-[0.99] transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{o.id.slice(0, 8)}</span>
                    <Badge className={`${tone[o.status] || "bg-muted"} border-0 capitalize`}>{t(o.status as any, o.status)}</Badge>
                  </div>
                  <div className="font-medium text-sm mb-1 line-clamp-2">{o.service}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>{o.date}</span>
                    <span className="font-semibold text-foreground">${o.amount.toLocaleString()} {o.currency}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <Table className="hidden sm:table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("id", "الرقم")}</TableHead>
                  <TableHead>{t("service", "الخدمة / الطلب")}</TableHead>
                  <TableHead>{t("date", "التاريخ")}</TableHead>
                  <TableHead>{t("status", "الحالة")}</TableHead>
                  <TableHead className="text-end">{t("amount", "المبلغ")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate({ to: "/dashboard/workspace/orders/$id", params: { id: o.id } })}
                  >
                    <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm font-medium">{o.service}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.date}</TableCell>
                    <TableCell><Badge className={`${tone[o.status] || "bg-muted"} border-0 capitalize text-xs`}>{t(o.status as any, o.status)}</Badge></TableCell>
                    <TableCell className="text-end font-mono font-bold">${o.amount.toLocaleString()} {o.currency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between pt-4 text-sm">
              <span className="text-muted-foreground">{t("page", "صفحة")} {current} {t("of", "من")} {pageCount} · {t("showing", "عرض")} {paged.length} {t("of", "من")} {orders.length}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                  {isRtl ? <ChevronRight className="h-4 w-4 me-1" /> : <ChevronLeft className="h-4 w-4 me-1" />} {t("previous", "السابق")}
                </Button>
                <Button variant="outline" size="sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
                  {t("next", "التالي")} {isRtl ? <ChevronLeft className="h-4 w-4 ms-1" /> : <ChevronRight className="h-4 w-4 ms-1" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
