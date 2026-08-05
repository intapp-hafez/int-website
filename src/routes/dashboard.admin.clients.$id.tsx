import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoClients, demoQuotations } from "@/data/demo";
import { ArrowLeft, Mail, Phone, Building2, ChevronLeft, ChevronRight, FileText, Loader2, Search } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { useServerFn } from "@tanstack/react-start";
import { listClientQuotes } from "@/lib/admin-data.functions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Paginator } from "@/components/admin/Paginator";

export const Route = createFileRoute("/dashboard/admin/clients/$id")({
  head: () => ({ meta: [{ title: "Client Details — Admin" }] }),
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const c = demoClients.find((x) => x.id === id);
  const navigate = useNavigate();
  const { t, lang, isRtl } = useAdminT();
  if (!c) return <Card><CardContent className="p-6">{t("notFound")}</CardContent></Card>;
  const orders = demoQuotations.filter((q) => q.client === c.company);
  const total = orders.reduce((a, b) => a + b.amount, 0);
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

  const quoteTone: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-700",
    qualified: "bg-amber-100 text-amber-900",
    won: "bg-emerald-100 text-emerald-900",
    lost: "bg-destructive/10 text-destructive",
  };
  const fetchQuotes = useServerFn(listClientQuotes);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [qPage, setQPage] = useState(1);
  const [qPageSize, setQPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    let on = true;
    setQuotesLoading(true);
    fetchQuotes({ data: { email: c.email } })
      .then((rows) => { if (on) setQuotes(rows as any[]); })
      .catch(() => { if (on) setQuotes([]); })
      .finally(() => { if (on) setQuotesLoading(false); });
    return () => { on = false; };
  }, [c.email, fetchQuotes]);
  const filteredQuotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return quotes;
    return quotes.filter((q) => {
      const haystack = [
        String(q.id ?? ""),
        String(q.product_name ?? ""),
        String(q.full_name ?? ""),
        String(q.company ?? ""),
        String(q.status ?? ""),
        String(q.source ?? ""),
        String(q.priority ?? ""),
      ].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [quotes, searchTerm]);
  const qPageCount = Math.max(1, Math.ceil(filteredQuotes.length / qPageSize));
  const qCurrent = Math.min(qPage, qPageCount);
  const qStart = (qCurrent - 1) * qPageSize;
  const qEnd = Math.min(qStart + qPageSize, filteredQuotes.length);
  const pagedQuotes = filteredQuotes.slice(qStart, qEnd);
  useEffect(() => { setQPage(1); }, [qPageSize, filteredQuotes.length]);

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm"><Link to="/dashboard/admin/clients"><ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {t("back")}</Link></Button>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-display text-2xl">{c.company}</CardTitle>
            <Badge variant="secondary">{c.tier}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> {c.contact}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {c.email}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {c.phone}</div>
            <div className="text-muted-foreground">{lang === "ar" ? "المشاريع النشطة" : "Active projects"}: <span className="font-medium text-foreground">{c.projects}</span></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div className="flex-1 min-w-[200px]">
            <CardTitle className="font-display text-xl">{t("quotes")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {searchTerm.trim() ? (
                <>{filteredQuotes.length} {lang === "ar" ? "نتيجة" : "results"} {lang === "ar" ? "من" : "of"} {quotes.length}</>
              ) : (
                <>{quotes.length} {String(t("quotes")).toLowerCase()} · {c.email}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={lang === "ar" ? "ابحث برقم التتبع أو الكلمة..." : "Search by tracking ID or keyword..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 ps-8 w-[220px]"
              />
            </div>
            {quotes.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">{lang === "ar" ? "لكل صفحة" : "Per page"}</span>
                <Select value={String(qPageSize)} onValueChange={(v) => setQPageSize(Number(v))}>
                  <SelectTrigger className="h-8 w-[80px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {quotesLoading ? (
            <div className="py-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{lang === "ar" ? "لا توجد عروض أسعار" : "No quote requests yet."}</p>
          ) : (
            <>
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t("id")}</TableHead>
                <TableHead>{lang === "ar" ? "المنتج / الموضوع" : "Product / Subject"}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("priority")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-end">{lang === "ar" ? "إجراء" : "Action"}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {pagedQuotes.map((q) => {
                  const itemsCount = Array.isArray(q.items) ? q.items.length : 0;
                  const label = q.product_name || (itemsCount ? `${itemsCount} ${lang === "ar" ? "عنصر" : "items"}` : (q.source || "—").replace(/_/g, " "));
                  return (
                    <TableRow key={q.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate({ to: "/dashboard/admin/leads/quotes/$id", params: { id: q.id } })}>
                      <TableCell className="font-mono text-xs">{String(q.id).slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">
                        <div className="inline-flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" />{label}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(q.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{q.priority || "normal"}</Badge></TableCell>
                      <TableCell><Badge className={`${quoteTone[q.status] || "bg-muted text-foreground"} border-0 capitalize`}>{(t as any)(q.status) ?? q.status}</Badge></TableCell>
                      <TableCell className="text-end">
                        <Button asChild size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                          <Link to="/dashboard/admin/leads/quotes/$id" params={{ id: q.id }}>{t("open_") ?? "Open"}</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Paginator
              page={qCurrent}
              pageCount={qPageCount}
              total={filteredQuotes.length}
              start={qStart}
              end={qEnd}
              onPageChange={setQPage}
            />
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="font-display text-xl">{t("orders")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{orders.length} {t("orders").toLowerCase()} · ${total.toLocaleString()} {t("total")}</p>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{t("noOrders")}</p>
          ) : (
            <>
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t("id")}</TableHead><TableHead>{t("service")}</TableHead><TableHead>{t("date")}</TableHead><TableHead>{t("status")}</TableHead><TableHead className="text-end">{t("amount")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paged.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate({ to: "/dashboard/admin/quotations/$id", params: { id: o.id } })}>
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
                <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>{isRtl ? <ChevronRight className="h-4 w-4 me-1" /> : <ChevronLeft className="h-4 w-4 me-1" />} {t("previous")}</Button>
                <Button variant="outline" size="sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>{t("next")} {isRtl ? <ChevronLeft className="h-4 w-4 ms-1" /> : <ChevronRight className="h-4 w-4 ms-1" />}</Button>
              </div>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}