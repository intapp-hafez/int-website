import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoQuotations } from "@/data/demo";
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

  // Preload invoice fonts as soon as the page mounts so download is instant
  // and Arabic glyph shaping is correct on first click.
  useEffect(() => {
    ensureInvoiceFonts();
  }, []);

  const q = demoQuotations.find((x) => x.id === id);
  if (!q) return <Card><CardContent className="p-6">{t("notFound")}</CardContent></Card>;

  const seed = q.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const items = [
    { description: `${q.service} — Design & engineering`, qty: 1, unit: Math.round(q.amount * 0.35) },
    { description: `${q.service} — Hardware & licenses`, qty: 1, unit: Math.round(q.amount * 0.4) },
    { description: `Implementation & integration (${(seed % 6) + 4} weeks)`, qty: (seed % 6) + 4, unit: Math.round((q.amount * 0.15) / ((seed % 6) + 4)) },
    { description: `Training & 12-month support`, qty: 1, unit: Math.round(q.amount * 0.05) },
  ];
  const subtotal = items.reduce((a, b) => a + b.qty * b.unit, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const tone: Record<string, string> = {
    draft: "bg-muted text-foreground",
    sent: "bg-blue-500/10 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-900",
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
      // Wait for the active-language font to load so glyph shaping is correct.
      await waitForInvoiceFonts(ar);
      const fileLabel = ar ? "invoice-ar" : "invoice-en";
      await renderInvoicePdf(printRef.current, `${q.id}-${fileLabel}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/workspace/orders"><ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {t("back")}</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 me-2" /> {t("print")}
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Download className="h-4 w-4 me-2" />}
            {t("download")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("quotation")}</div>
            <CardTitle className="font-display text-2xl mt-1">{q.id}</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">{t("issued")} {q.date}</div>
          </div>
          <Badge className={`${tone[q.status]} border-0 capitalize`}>{t(q.status as any)}</Badge>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-xs uppercase text-muted-foreground">{t("billTo")}</div>
            <div className="flex items-center gap-2 font-medium"><Building2 className="h-4 w-4 text-muted-foreground" /> {q.client}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase text-muted-foreground">{t("service")}</div>
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {q.service}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase text-muted-foreground">{t("validUntil")}</div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {lang === "ar" ? "30 يومًا من تاريخ الإصدار" : "30 days from issue"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">{t("lineItems")}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("description_")}</TableHead>
                <TableHead className="text-end w-20">{t("qty")}</TableHead>
                <TableHead className="text-end w-32">{t("unitPrice")}</TableHead>
                <TableHead className="text-end w-32">{t("amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{it.description}</TableCell>
                  <TableCell className="text-end">{it.qty}</TableCell>
                  <TableCell className="text-end">${it.unit.toLocaleString()}</TableCell>
                  <TableCell className="text-end font-medium">${(it.qty * it.unit).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow><TableCell colSpan={3} className="text-end text-muted-foreground">{t("subtotal")}</TableCell><TableCell className="text-end">${subtotal.toLocaleString()}</TableCell></TableRow>
              <TableRow><TableCell colSpan={3} className="text-end text-muted-foreground">{t("vat")}</TableCell><TableCell className="text-end">${tax.toLocaleString()}</TableCell></TableRow>
              <TableRow><TableCell colSpan={3} className="text-end font-semibold">{t("grandTotal")} ({q.currency})</TableCell><TableCell className="text-end font-display text-lg font-bold">${total.toLocaleString()}</TableCell></TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Off-screen printable invoice rendered with locale-appropriate fonts */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "794px", // ~ A4 @ 96dpi
          pointerEvents: "none",
        }}
      >
        <InvoicePdfTemplate
          ref={printRef}
          ar={ar}
          q={q}
          items={items}
          subtotal={subtotal}
          tax={tax}
          total={total}
          fmt={fmt}
          watermark={watermark}
          i18n={{
            wmStamp: {
              draft: t("wmDraftStamp"),
              paid: t("wmPaidStamp"),
              unpaid: t("wmUnpaidStamp"),
              void: t("wmVoidStamp"),
              copy: t("wmCopyStamp"),
            },
            terms: {
              title: t("paymentTermsTitle"),
              net: t("paymentNet"),
              installments: t("paymentInstallments"),
              bank: t("bankDetails"),
              bankName: t("bankName"),
              accountName: t("bankAccountName"),
              iban: t("bankIban"),
              swift: t("bankSwift"),
              ref: t("bankRef"),
            },
          }}
        />
      </div>
    </div>
  );
}
