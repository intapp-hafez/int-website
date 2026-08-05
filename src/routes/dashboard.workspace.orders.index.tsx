import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { demoQuotations } from "@/data/demo";
import { useClientT, getDemoClientCompany } from "@/lib/client-i18n";

export const Route = createFileRoute("/dashboard/workspace/orders/")({
  component: ClientOrders,
});

function ClientOrders() {
  const { t, isRtl } = useClientT();
  const navigate = useNavigate();
  const company = getDemoClientCompany();
  const orders = demoQuotations.filter((q) => q.client === company);
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const paged = orders.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const tone: Record<string, string> = {
    draft: "bg-muted text-foreground",
    sent: "bg-blue-500/10 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-900",
    rejected: "bg-destructive/10 text-destructive",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">{t("orders")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("ordersTagline")}</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("noOrders")}</p>
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
                    <span className="font-mono text-[11px] text-muted-foreground">{o.id}</span>
                    <Badge className={`${tone[o.status]} border-0 capitalize`}>{t(o.status as any)}</Badge>
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
                  <TableHead>{t("id")}</TableHead>
                  <TableHead>{t("service")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-end">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate({ to: "/dashboard/workspace/orders/$id", params: { id: o.id } })}
                  >
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell className="text-sm">{o.service}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.date}</TableCell>
                    <TableCell><Badge className={`${tone[o.status]} border-0 capitalize`}>{t(o.status as any)}</Badge></TableCell>
                    <TableCell className="text-end font-medium">${o.amount.toLocaleString()} {o.currency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between pt-4 text-sm">
              <span className="text-muted-foreground">{t("page")} {current} {t("of")} {pageCount} · {t("showing")} {paged.length} {t("of")} {orders.length}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                  {isRtl ? <ChevronRight className="h-4 w-4 me-1" /> : <ChevronLeft className="h-4 w-4 me-1" />} {t("previous")}
                </Button>
                <Button variant="outline" size="sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
                  {t("next")} {isRtl ? <ChevronLeft className="h-4 w-4 ms-1" /> : <ChevronRight className="h-4 w-4 ms-1" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
