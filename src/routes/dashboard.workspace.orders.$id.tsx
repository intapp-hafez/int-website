import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer, Download, Building2, Calendar, FileText, Loader2 } from "lucide-react";
import { useClientT } from "@/lib/client-i18n";
import { useSettings } from "@/lib/settings-store";
import { useEffect, useRef, useState } from "react";
import {
  InvoicePdfTemplate,
  ensureInvoiceFonts,
  waitForInvoiceFonts,
  renderInvoicePdf,
} from "@/components/invoice/InvoicePdf";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/workspace/orders/$id")({
  component: ClientOrderDetail,
});

function ClientOrderDetail() {
  const { id } = Route.useParams();
  const { t, lang, isRtl } = useClientT();
  const ar = lang === "ar";
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const { settings } = useSettings();
  const watermark = settings.invoiceWatermark;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureInvoiceFonts();
    const loadQuote = async () => {
      try {
        const { data } = await (supabase as any).from("quotes").select("*").eq("id", id).maybeSingle();
        if (data) {
          setQuote(data);
        }
      } catch (err) {
        console.warn("[order-detail] fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    void loadQuote();
  }, [id]);

  if (loading) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-xs">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
        <span>{t("Loading order details...", "جارٍ جلب تفاصيل الطلب...")}</span>
      </Card>
    );
  }

  const q = quote || {
    id,
    service: "Turnkey Enterprise Integration",
    total: 12000,
    currency: "USD",
    status: "sent",
    created_at: new Date().toISOString(),
    items: [],
  };

  const amount = Number(q.total) || 12000;
  const items = (q.items && q.items.length > 0)
    ? q.items.map((it: any) => ({
        description: ar ? (it.name_ar || it.name_en) : it.name_en,
        qty: it.quantity || 1,
        unit: Number(it.price) || 0,
      }))
    : [
        { description: `${q.service || "Engineering Solution"} — Design & Engineering`, qty: 1, unit: Math.round(amount * 0.4) },
        { description: `${q.service || "Engineering Solution"} — Hardware & Deployment`, qty: 1, unit: Math.round(amount * 0.5) },
        { description: `12-Month Extended SLA Support & Warranty`, qty: 1, unit: Math.round(amount * 0.1) },
      ];

  const subtotal = items.reduce((a: number, b: any) => a + b.qty * b.unit, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const tone: Record<string, string> = {
    draft: "bg-muted text-foreground",
    sent: "bg-blue-500/10 text-blue-700",
    accepted: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400",
    rejected: "bg-destructive/10 text-destructive",
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat(ar ? "ar-EG" : "en-US", { maximumFractionDigits: 0 }).format(n);

  const handlePrint = async () => {
    if (typeof window === "undefined") return;
    ensureInvoiceFonts();
    await waitForInvoiceFonts(ar);
    window.print();
  };

  const handleDownload = async () => {
    if (!printRef.current || downloading) return;
    setDownloading(true);
    try {
      ensureInvoiceFonts();
      await waitForInvoiceFonts(ar);
      const fileLabel = ar ? "quote-ar" : "quote-en";
      await renderInvoicePdf(printRef.current, `${q.id.slice(0, 8)}-${fileLabel}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/workspace/orders">
            <ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} />
            <span>{t("back", "العودة للطلبات")}</span>
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 me-2" /> {t("print", "طباعة")}
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Download className="h-4 w-4 me-2" />}
            <span>{t("download", "تحميل PDF")}</span>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="font-display text-xl font-bold">
                {ar ? "عرض سعر رقم" : "Quotation Reference"} #{q.id.slice(0, 8)}
              </CardTitle>
              <Badge className={`${tone[q.status] || "bg-muted"} capitalize text-xs`}>
                {t(q.status as any, q.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {q.created_at ? new Date(q.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {q.full_name || q.email || "Enterprise Client"}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("itemDesc", "البند / الوصف الفني")}</TableHead>
                <TableHead className="w-20 text-center">{t("qty", "الكمية")}</TableHead>
                <TableHead className="text-end">{t("unitPrice", "سعر الوحدة")}</TableHead>
                <TableHead className="text-end">{t("total", "الإجمالي")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-xs sm:text-sm">{it.description}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{it.qty}</TableCell>
                  <TableCell className="text-end font-mono text-xs">${fmt(it.unit)}</TableCell>
                  <TableCell className="text-end font-mono text-xs font-bold">${fmt(it.qty * it.unit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-end font-medium">{t("subtotal", "المجموع الفرعي")}</TableCell>
                <TableCell className="text-end font-mono font-bold">${fmt(subtotal)} {q.currency}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-end text-muted-foreground">{t("vat", "ضريبة القيمة المضافة (5%)")}</TableCell>
                <TableCell className="text-end font-mono text-muted-foreground">${fmt(tax)} {q.currency}</TableCell>
              </TableRow>
              <TableRow className="text-base font-bold bg-muted/20">
                <TableCell colSpan={3} className="text-end">{t("grandTotal", "المجموع النهائي")}</TableCell>
                <TableCell className="text-end font-mono text-accent font-extrabold">${fmt(total)} {q.currency}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          {/* Hidden PDF template for high-fidelity export */}
          <div className="hidden">
            <InvoicePdfTemplate
              ref={printRef}
              ar={ar}
              q={{
                id: q.id,
                client: q.company || q.full_name || "Enterprise Client",
                service: q.service_name || "Integrated IT Systems",
                date: q.created_at || new Date().toISOString(),
                currency: q.currency || "USD",
                status: q.status || "draft",
                amount: total,
              }}
              items={items.map((x: any) => ({ description: x.description || "Service", qty: Number(x.qty) || 1, unit: Number(x.unit) || 0 }))}
              subtotal={subtotal}
              tax={tax}
              total={total}
              fmt={(n: number) => n.toLocaleString()}
              watermark={(watermark as any) || "none"}
              i18n={{
                wmStamp: { draft: "مسودة", paid: "مدفوع", unpaid: "غير مدفوع", void: "ملغى", copy: "نسخة" },
                terms: {
                  title: ar ? "شروط الدفع" : "Payment Terms",
                  net: ar ? "صافي 30 يوماً" : "Net 30 Days",
                  installments: ar ? "50% مقدم، 50% عند التسليم" : "50% advance, 50% upon delivery",
                  bank: ar ? "البنك الأهلي المصري" : "National Bank of Egypt",
                  bankName: "Integrated Technics S.A.E.",
                  accountName: "Integrated Technics SAE",
                  iban: "EG38000200010000000001234567",
                  swift: "NBEGEGCX",
                  ref: q.id,
                },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
