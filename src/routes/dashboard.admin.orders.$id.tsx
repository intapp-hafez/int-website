import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Mail, Phone, Building2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { ORDER_STATUSES, STATUS_TONE, orderTotal } from "./dashboard.admin.orders.index";
import { getOrder, updateOrderStatus } from "@/lib/admin-data.functions";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/orders/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { t, lang } = useAdminT();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getOrder({ data: { id } });
        if (!data) { toast.error("Order not found"); navigate({ to: "/dashboard/admin/orders" }); return; }
        setOrder(data);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load order");
        navigate({ to: "/dashboard/admin/orders" });
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const updateStatus = async (next: string) => {
    setSaving(true);
    try {
      await updateOrderStatus({ data: { id, status: next } });
      setOrder({ ...order, status: next });
      toast.success(`${t("statusUpdated")}: ${(t as any)(next) ?? next}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !order) {
    return <div className="text-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const { total, currency, qty } = orderTotal(items);
  const idx = ORDER_STATUSES.indexOf(order.status as any);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/admin/orders"><ArrowLeft className="h-4 w-4 me-2" /> {t("backToOrders")}</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${STATUS_TONE[order.status] || ""} capitalize`}>{(t as any)(order.status) ?? order.status}</Badge>
          <Select value={order.status} onValueChange={updateStatus} disabled={saving}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{(t as any)(s) ?? s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> {t("orderNo")} {String(order.id).slice(0, 8)}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{t("placedAt")}: {new Date(order.created_at).toLocaleString(lang === "ar" ? "ar" : "en")}</p>
        </CardHeader>
        <CardContent>
          {/* Workflow stepper */}
          <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-4 border-b">
            {ORDER_STATUSES.map((s, i) => {
              const active = i <= idx && order.status !== "cancelled";
              const isCancelled = order.status === "cancelled" && s === "cancelled";
              return (
                <div key={s} className="flex items-center gap-1 shrink-0">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${
                    isCancelled ? STATUS_TONE.cancelled :
                    active ? "bg-primary text-primary-foreground border-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>{(t as any)(s) ?? s}</div>
                  {i < ORDER_STATUSES.length - 1 && <div className="w-4 h-px bg-border" />}
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{t("customer")}</div>
              <div className="space-y-1.5 text-sm">
                <div className="font-medium">{order.full_name}</div>
                <a href={`mailto:${order.email}`} className="text-muted-foreground hover:text-accent inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{order.email}</a>
                {order.phone && <div className="text-muted-foreground inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{order.phone}</div>}
                {order.company && <div className="text-muted-foreground inline-flex items-center gap-2"><Building2 className="h-3.5 w-3.5" />{order.company}</div>}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{t("summary")}</div>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("items")}</span><span>{qty}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("total")}</span><span className="font-semibold">{total > 0 ? `${total.toLocaleString()} ${currency}` : t("quoteOnRequest")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("language")}</span><span className="uppercase">{order.lang}</span></div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{t("items")}</div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{order.product_name || "—"}</p>
          ) : (
            <div className="space-y-2">
              {items.map((i: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{(lang === "ar" && i.name_ar) ? i.name_ar : i.name_en}</div>
                    <div className="text-xs text-muted-foreground">SKU: {i.sku || "—"} · {t("qty")}: {i.quantity}</div>
                  </div>
                  <div className="text-end">
                    {i.price != null ? (
                      <>
                        <div className="font-medium">{(Number(i.price) * Number(i.quantity)).toLocaleString()} {i.currency}</div>
                        <div className="text-xs text-muted-foreground">{i.price} {i.currency} each</div>
                      </>
                    ) : <span className="text-xs text-muted-foreground">POA</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {order.message && (
            <>
              <Separator className="my-6" />
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{t("customerNotes")}</div>
              <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground bg-muted/40 rounded-md p-3">{order.message}</pre>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}