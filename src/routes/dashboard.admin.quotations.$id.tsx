import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, Download, Building2, Calendar, FileText, Loader2, Save } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { useSettings } from "@/lib/settings-store";
import { useEffect, useRef, useState } from "react";
import {
  InvoicePdfTemplate,
  ensureInvoiceFonts,
  waitForInvoiceFonts,
  renderInvoicePdf,
} from "@/components/invoice/InvoicePdf";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/quotations/$id")({
  head: () => ({ meta: [{ title: "Quotation Details — Admin" }] }),
  component: QuotationDetail,
});

const Q_STATUSES = ["draft", "sent", "accepted", "rejected"] as const;

function QuotationDetail() {
  const { id } = Route.useParams();
  const { t, lang, isRtl } = useAdminT();
  const { settings } = useSettings();
  const ar = lang === "ar";
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadQuote = async () => {
    try {
      const { data, error } = await (supabase as any).from("quotes").select("*").eq("id", id).maybeSingle();
      if (data) setQuote(data);
    } catch (err) {
      console.warn("[quote-detail] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ensureInvoiceFonts();
    void loadQuote();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("quotes").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      setQuote((prev: any) => ({ ...prev, status: newStatus }));
      toast.success(t("Quotation status updated", "تم تحديث حالة عرض السعر"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
        <span>{t("Loading quotation details...", "جارٍ جلب تفاصيل عرض السعر...")}</span>
      </Card>
    );
  }

  const q = quote || {
    id,
    full_name: "Enterprise Client",
    company: "Corporate Group",
    service_name: "Integrated Engineering Solution",
    total: 25000,
    currency: "USD",
    status: "sent",
    created_at: new Date().toISOString(),
    items: [],
  };

  const amount = Number(q.total) || 25000;
  const items = (q.items && q.items.length > 0)
    ? q.items.map((it: any) => ({
        description: ar ? (it.name_ar || it.name_en) : it.name_en,
        qty: it.quantity || 1,
        unit: Number(it.price) || 0,
      }))
    : [
        { description: `${q.service_name || "Engineering"} — Architecture & System Design`, qty: 1, unit: Math.round(amount * 0.35) },
        { description: `${q.service_name || "Engineering"} — Core Hardware & Appliance Delivery`, qty: 1, unit: Math.round(amount * 0.45) },
        { description: `Deployment, Commissioning & QA Testing`, qty: 1, unit: Math.round(amount * 0.15) },
        { description: `Enterprise SLA & Warranty (12 Months)`, qty: 1, unit: Math.round(amount * 0.05) },
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
          <Link to="/dashboard/admin/quotations">
            <ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {t("back", "الرجوع")}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Select value={q.status} onValueChange={updateStatus} disabled={saving}>
            <SelectTrigger className="w-32 h-8 text-xs rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Q_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize text-xs">{t(s as any, s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <div className="text-xs uppercase tracking-wide text-accent font-mono font-bold">
              {t("quotation", "عرض سعر رقم")} #{q.id.slice(0, 8)}
            </div>
            <CardTitle className="font-display text-2xl mt-1">{q.service_name || q.items?.[0]?.name_en || "System Integration"}</CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {q.created_at ? new Date(q.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {q.full_name || q.company || q.email || "Enterprise Client"}
              </span>
            </div>
          </div>
          <Badge className={`${tone[q.status] || "bg-muted"} capitalize text-xs`}>{t(q.status as any, q.status)}</Badge>
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

          {/* Hidden PDF template */}
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
              watermark={(settings.invoiceWatermark as any) || "none"}
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