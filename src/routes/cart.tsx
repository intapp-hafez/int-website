import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Minus, Plus, ShoppingBag, Loader2, ArrowLeft, CheckCircle2, Copy, Search, Mail, Phone, Building2, FileText, Calendar, Package, Printer } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { submitCartLead } from "@/lib/leads.functions";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — Integrated Technics" },
      { name: "description", content: "Review your cart and request a quote." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, currency, count, setQty, remove, clear } = useCart();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ id: string; email: string; full_name: string } | null>(null);
  const [snapshot, setSnapshot] = useState<{ items: typeof items; subtotal: number; currency: string; form: typeof form; submittedAt: string } | null>(null);
  const submit_ = useServerFn(submitCartLead);
  const navigate = useNavigate();

  const t = {
    title: isAr ? "السلة" : "Your Cart",
    sub: isAr ? "راجع منتجاتك وأرسل طلب عرض سعر." : "Review items and submit a quote request.",
    empty: isAr ? "السلة فارغة" : "Your cart is empty",
    browse: isAr ? "تصفح المتجر" : "Browse the shop",
    qty: isAr ? "الكمية" : "Qty",
    remove: isAr ? "حذف" : "Remove",
    clear: isAr ? "إفراغ السلة" : "Clear cart",
    subtotal: isAr ? "الإجمالي" : "Subtotal",
    poa: isAr ? "السعر عند الطلب" : "Price on request",
    checkout: isAr ? "إرسال طلب عرض سعر" : "Request quote",
    name: isAr ? "الاسم الكامل" : "Full name",
    email: isAr ? "البريد الإلكتروني" : "Work email",
    phone: isAr ? "الهاتف" : "Phone",
    company: isAr ? "الشركة" : "Company",
    notes: isAr ? "ملاحظات إضافية" : "Additional notes",
    success: isAr ? "تم إرسال طلبك. سنعاود التواصل قريبًا." : "Request received — we'll be in touch shortly.",
    required: isAr ? "يرجى تعبئة الاسم والبريد الإلكتروني" : "Please provide your name and email",
    back: isAr ? "متابعة التسوق" : "Continue shopping",
  };

  const ct = {
    heading: isAr ? "تم استلام طلب عرض السعر" : "Quote request received",
    intro: isAr ? "شكرًا لك" : "Thank you",
    body: isAr
      ? "أرسلنا تأكيدًا إلى بريدك الإلكتروني وسيتواصل معك فريق المبيعات خلال 24 ساعة عمل."
        : "We've logged your request and our sales team will be in touch within 1 business day. A copy has been sent to your email.",
    trackingLabel: isAr ? "رقم تتبع الطلب" : "Tracking number",
    keepIt: isAr ? "احتفظ بهذا الرقم لمتابعة حالة طلبك." : "Keep this reference to check your status anytime.",
    copy: isAr ? "نسخ" : "Copy",
    copied: isAr ? "تم النسخ" : "Copied",
    track: isAr ? "تتبع الطلب الآن" : "Track this quote",
    continue: isAr ? "متابعة التسوق" : "Continue shopping",
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) { toast.error(t.required); return; }
    if (items.length === 0) return;
    setSubmitting(true);
    const lines = items.map(i => {
      const n = (isAr ? i.name_ar : i.name_en) || i.name_en;
      const price = i.price != null ? ` @ ${i.price} ${i.currency}` : "";
      return `- ${n} (SKU: ${i.sku || "—"}) × ${i.quantity}${price}`;
    }).join("\n");
    const note = `${form.message.trim() ? form.message.trim() + "\n\n" : ""}Cart items:\n${lines}\nSubtotal: ${subtotal} ${currency}`;
    const first = items[0];
    const itemsPayload = items.map(i => ({
      product_id: i.id,
      slug: i.slug,
      sku: i.sku,
      name_en: i.name_en,
      name_ar: i.name_ar,
      price: i.price,
      currency: i.currency,
      quantity: i.quantity,
      line_total: i.price != null ? i.price * i.quantity : null,
    }));
    let inserted: { id: string };
    try {
      inserted = await submit_({ data: {
        source: "cart_checkout",
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        message: note,
        product_id: first.id,
        product_name: first.name_en,
        product_slug: first.slug,
        items: itemsPayload as any,
        lang,
      }});
    } catch (err: any) {
      setSubmitting(false);
      toast.error(err?.message || "Failed to submit quote");
      return;
    }
    setSubmitting(false);
    const payload = { id: inserted.id, email: form.email.trim(), full_name: form.full_name.trim() };
    setSnapshot({ items: [...items], subtotal, currency, form: { ...form }, submittedAt: new Date().toISOString() });
    clear();
    setConfirmation(payload);
    navigate({ to: "/track-quote", search: { id: payload.id.slice(0, 8).toUpperCase(), email: payload.email } });
  };

  if (confirmation) {
    const shortRef = confirmation.id.slice(0, 8).toUpperCase();
    const copy = async () => {
      try { await navigator.clipboard.writeText(shortRef); toast.success(ct.copied); } catch {}
    };
    const submittedDate = snapshot ? new Date(snapshot.submittedAt) : new Date();
    const dateStr = submittedDate.toLocaleString(isAr ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" });
    const labels = {
      summary: isAr ? "ملخص الطلب" : "Quote summary",
      client: isAr ? "بيانات العميل" : "Client details",
      items: isAr ? "العناصر المطلوبة" : "Requested items",
      qty: isAr ? "الكمية" : "Qty",
      unit: isAr ? "السعر" : "Unit",
      lineTotal: isAr ? "الإجمالي" : "Total",
      subtotal: isAr ? "الإجمالي الفرعي" : "Subtotal",
      poa: isAr ? "السعر عند الطلب" : "Price on request",
      submitted: isAr ? "تاريخ الإرسال" : "Submitted",
      status: isAr ? "الحالة" : "Status",
      statusNew: isAr ? "قيد المراجعة" : "Under review",
      notes: isAr ? "ملاحظاتك" : "Your notes",
      print: isAr ? "طباعة" : "Print",
      nextTitle: isAr ? "الخطوات التالية" : "What happens next",
      step1: isAr ? "يراجع فريقنا طلبك خلال ساعات العمل." : "Our sales team reviews your request within business hours.",
      step2: isAr ? "سنرسل لك عرض سعر مفصل عبر البريد الإلكتروني." : "You'll receive a detailed quotation by email.",
      step3: isAr ? "يمكنك تتبع التحديثات في أي وقت برقم التتبع." : "Track updates anytime using your reference number.",
    };
    return (
      <Section eyebrow={isAr ? "تأكيد" : "Confirmation"} title={ct.heading} sub={ct.body}>
        <div dir={isAr ? "rtl" : "ltr"} className="max-w-4xl mx-auto print:max-w-none">
          {/* Hero */}
          <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
            <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-8 border-b">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground">{ct.intro}, <span className="font-medium text-foreground">{confirmation.full_name}</span></div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold mt-1">{ct.heading}</h2>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{dateStr}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> {labels.status}: <span className="font-medium text-foreground">{labels.statusNew}</span>
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-background/70 backdrop-blur px-5 py-3 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{ct.trackingLabel}</div>
                  <div className="font-display text-2xl md:text-3xl font-mono font-bold tracking-wider text-accent mt-0.5">#{shortRef}</div>
                  <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded border bg-muted/30 hover:bg-muted transition-colors" dir="ltr">
                    <Copy className="h-3 w-3" /> {isAr ? "نسخ الرقم" : "Copy #"}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 grid md:grid-cols-3 gap-6">
              {/* Client details */}
              <div className="md:col-span-1 space-y-4">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />{labels.client}</div>
                  <div className="rounded-2xl border bg-muted/30 p-4 space-y-2.5 text-sm">
                    <div className="font-medium">{snapshot?.form.full_name || confirmation.full_name}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate" dir="ltr">{confirmation.email}</span></div>
                    {snapshot?.form.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5 shrink-0" /><span dir="ltr">{snapshot.form.phone}</span></div>}
                    {snapshot?.form.company && <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-3.5 w-3.5 shrink-0" /><span>{snapshot.form.company}</span></div>}
                  </div>
                </div>

                {snapshot?.form.message && (
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{labels.notes}</div>
                    <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground whitespace-pre-wrap">{snapshot.form.message}</div>
                  </div>
                )}
              </div>

              {/* Items + summary */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 inline-flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />{labels.items} ({snapshot?.items.length ?? 0})</div>
                  <div className="rounded-2xl border overflow-hidden divide-y">
                    {snapshot?.items.map(i => {
                      const n = (isAr ? i.name_ar : i.name_en) || i.name_en;
                      const lineTotal = i.price != null ? i.price * i.quantity : null;
                      return (
                        <div key={i.id} className="flex items-center gap-3 p-3 bg-card">
                          <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                            {i.image_url ? <img src={i.image_url} alt={n} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-muted-foreground"><ShoppingBag className="h-5 w-5" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium line-clamp-1">{n}</div>
                            <div className="text-xs text-muted-foreground">{i.sku ? `SKU: ${i.sku} · ` : ""}{labels.qty}: {i.quantity}</div>
                          </div>
                          <div className="text-end shrink-0">
                            <div className="text-sm font-semibold">{lineTotal != null ? `${lineTotal} ${i.currency}` : <span className="text-xs text-muted-foreground italic">{labels.poa}</span>}</div>
                            {i.price != null && <div className="text-[11px] text-muted-foreground">{i.price} {i.currency} × {i.quantity}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{labels.subtotal}</span>
                  <span className="font-display text-xl font-bold">{snapshot?.subtotal ?? 0} {snapshot?.currency ?? "USD"}</span>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="px-6 md:px-8 pb-6 md:pb-8">
              <div className="rounded-2xl border bg-muted/30 p-5">
                <div className="text-sm font-semibold mb-3">{labels.nextTitle}</div>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  {[labels.step1, labels.step2, labels.step3].map((s, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold inline-flex items-center justify-center shrink-0">{idx + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t bg-muted/20 p-4 md:p-6 flex flex-wrap gap-2 print:hidden">
              <Button asChild size="lg" className="flex-1 min-w-[180px]">
                <Link to="/track-quote" search={{ id: shortRef } as any}>
                  <Search className="h-4 w-4 me-2" /> {ct.track}
                </Link>
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 me-2" /> {labels.print}
              </Button>
              <Button asChild size="lg" variant="ghost" onClick={() => { setConfirmation(null); setSnapshot(null); }}>
                <Link to="/shop"><ArrowLeft className="h-4 w-4 me-2" /> {ct.continue}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section eyebrow="Cart" title={t.title} sub={t.sub}>
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link to="/shop"><ArrowLeft className="h-4 w-4 me-2" /> {t.back}</Link>
      </Button>

      {count === 0 ? (
        <div className="text-center py-16 border rounded-2xl bg-card">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">{t.empty}</p>
          <Button asChild><Link to="/shop">{t.browse}</Link></Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-3">
            {items.map(i => {
              const name = (isAr ? i.name_ar : i.name_en) || i.name_en;
              return (
                <div key={i.id} className="flex gap-3 border rounded-2xl bg-card p-3">
                  <Link to="/shop/$slug" params={{ slug: i.slug }} className="h-20 w-20 rounded-md overflow-hidden bg-muted shrink-0">
                    {i.image_url ? <img src={i.image_url} alt={name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-muted-foreground"><ShoppingBag className="h-6 w-6" /></div>}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to="/shop/$slug" params={{ slug: i.slug }} className="font-medium text-sm line-clamp-2 hover:text-accent">{name}</Link>
                    {i.sku && <div className="text-xs text-muted-foreground">SKU: {i.sku}</div>}
                    <div className="text-sm font-medium mt-1">{i.price != null ? `${i.price} ${i.currency}` : t.poa}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="inline-flex items-center border rounded-md">
                      <button onClick={() => setQty(i.id, i.quantity - 1)} className="h-8 w-8 inline-flex items-center justify-center hover:bg-muted" aria-label="-"><Minus className="h-3.5 w-3.5" /></button>
                      <input type="number" min={1} value={i.quantity} onChange={ev => setQty(i.id, Number(ev.target.value) || 1)} className="w-12 h-8 text-center bg-transparent text-sm outline-none" />
                      <button onClick={() => setQty(i.id, i.quantity + 1)} className="h-8 w-8 inline-flex items-center justify-center hover:bg-muted" aria-label="+"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <button onClick={() => remove(i.id)} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> {t.remove}</button>
                  </div>
                </div>
              );
            })}
            <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">{t.clear}</button>
          </div>

          <form onSubmit={submit} className="rounded-2xl border bg-card p-5 space-y-3 h-fit lg:sticky lg:top-28" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-muted-foreground">{t.subtotal}</span>
              <span className="text-lg font-semibold">{subtotal} {currency}</span>
            </div>
            <div><Label>{t.name} *</Label><Input required value={form.full_name} onChange={ev => setForm({ ...form, full_name: ev.target.value })} /></div>
            <div><Label>{t.email} *</Label><Input required type="email" value={form.email} onChange={ev => setForm({ ...form, email: ev.target.value })} /></div>
            <div><Label>{t.phone}</Label><Input value={form.phone} onChange={ev => setForm({ ...form, phone: ev.target.value })} /></div>
            <div><Label>{t.company}</Label><Input value={form.company} onChange={ev => setForm({ ...form, company: ev.target.value })} /></div>
            <div><Label>{t.notes}</Label><Textarea rows={3} value={form.message} onChange={ev => setForm({ ...form, message: ev.target.value })} /></div>
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}{t.checkout}
            </Button>
          </form>
        </div>
      )}
    </Section>
  );
}