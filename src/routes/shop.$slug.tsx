import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShoppingBag, Loader2, ShoppingCart, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("products").select("*").eq("slug", params.slug).eq("active", true).maybeSingle();
    if (!data) throw notFound();
    return { product: data as Product };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Product — Integrated Technics" }] };
    const titleEn = `${p.name_en} — Integrated Technics`;
    const titleAr = `${p.name_ar} — إنتجريتد تكنيكس`;
    const descEn = (p.description_en || "").slice(0, 160);
    const descAr = (p.description_ar || "").slice(0, 160);
    const img = p.image_url || undefined;
    const path = `/shop/${params.slug}`;
    return {
      meta: [
        { title: titleEn },
        { name: "description", content: descEn },
        { name: "description", lang: "ar", content: descAr },
        { property: "og:type", content: "product" },
        { property: "og:title", content: titleEn },
        { property: "og:description", content: descEn },
        { property: "og:url", content: path },
        ...(img ? [
          { property: "og:image", content: img },
          { name: "twitter:image", content: img },
        ] : []),
        { name: "twitter:card", content: img ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: titleEn },
        { name: "twitter:description", content: descEn },
        { property: "og:locale:alternate", content: "ar_AR" },
        { property: "product:price:amount", content: p.price != null ? String(p.price) : "" },
        { property: "product:price:currency", content: p.currency || "USD" },
      ],
      links: [
        { rel: "canonical", href: path },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name_en,
          alternateName: p.name_ar,
          description: p.description_en,
          sku: p.sku || undefined,
          image: img ? [img, ...(p.gallery || [])] : undefined,
          category: p.category_en || undefined,
          offers: p.price != null ? {
            "@type": "Offer",
            price: p.price,
            priceCurrency: p.currency || "USD",
            availability: p.stock_status === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          } : undefined,
        }),
      }],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product: p } = Route.useLoaderData();
  const { lang } = useI18n();
  const { add } = useCart();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>(p.image_url || "");
  const [qty, setQty] = useState(1);
  const isAr = lang === "ar";
  const inStock = p.stock_status === "in_stock";

  const name = (lang === "ar" ? p.name_ar : p.name_en) || p.name_en;
  const desc = (lang === "ar" ? p.description_ar : p.description_en) || p.description_en;
  const cat = (lang === "ar" ? p.category_ar : p.category_en) || p.category_en;
  const all = [p.image_url, ...(p.gallery || [])].filter(Boolean);

  const handleAdd = (buyNow = false) => {
    add(p, qty);
    toast.success(isAr ? "تمت إضافة المنتج إلى السلة" : "Added to cart");
    if (buyNow) navigate({ to: "/cart" });
  };

  return (
    <Section>
      <Button asChild variant="outline" size="sm" className="mb-4"><Link to="/shop"><ArrowLeft className="h-4 w-4 me-2" /> {lang === "ar" ? "العودة" : "Back"}</Link></Button>
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden border bg-muted">
            {active ? <img src={active} alt={name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-muted-foreground"><ShoppingBag className="h-12 w-12" /></div>}
          </div>
          {all.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {all.map(u => (
                <button key={u} onClick={() => setActive(u)} className={`h-16 w-16 rounded-md overflow-hidden border ${active === u ? "ring-2 ring-accent" : ""}`}>
                  <img src={u} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          {cat && <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{cat}</div>}
          <h1 className="text-3xl font-bold mb-3">{name}</h1>
          {p.price != null && <div className="text-2xl font-semibold mb-4">{p.price} {p.currency}</div>}
          {p.sku && <div className="text-xs text-muted-foreground mb-4">SKU: {p.sku}</div>}
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mb-6">{desc}</p>

          <div className="rounded-2xl border bg-card p-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center border rounded-md">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted" aria-label="-"><Minus className="h-4 w-4" /></button>
                <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))} className="w-14 h-10 text-center bg-transparent outline-none" />
                <button onClick={() => setQty(q => q + 1)} className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted" aria-label="+"><Plus className="h-4 w-4" /></button>
              </div>
              <Button size="lg" onClick={() => handleAdd(false)} disabled={!inStock}>
                <ShoppingCart className="h-4 w-4 me-2" />
                {isAr ? "أضف إلى السلة" : "Add to cart"}
              </Button>
              <Button size="lg" variant="outline" onClick={() => handleAdd(true)} disabled={!inStock}>
                {isAr ? "اشترِ الآن" : "Buy now"}
              </Button>
            </div>
            {!inStock && <div className="text-xs text-destructive mt-2">{isAr ? "غير متوفر حاليًا" : "Currently out of stock"}</div>}
          </div>

          <QuoteForm product={p} />
        </div>
      </div>
    </Section>
  );
}

function QuoteForm({ product }: { product: Product }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const t = {
    title: isAr ? "اطلب عرض سعر" : "Request a quote",
    sub: isAr ? "أرسل تفاصيلك وسيتواصل معك مهندس الحلول خلال يوم عمل." : "Send your details — a solutions engineer will respond within one business day.",
    name: isAr ? "الاسم الكامل" : "Full name",
    email: isAr ? "البريد الإلكتروني" : "Work email",
    phone: isAr ? "رقم الهاتف" : "Phone",
    company: isAr ? "الشركة" : "Company",
    message: isAr ? "الكمية أو متطلبات إضافية" : "Quantity or additional requirements",
    send: isAr ? "إرسال الطلب" : "Send request",
    success: isAr ? "تم استلام طلبك. سنعاود التواصل قريبًا." : "Thanks — your request has been received.",
    required: isAr ? "يرجى تعبئة الاسم والبريد الإلكتروني" : "Please provide your name and email",
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) { toast.error(t.required); return; }
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      source: "quote_request",
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      message: form.message.trim(),
      product_id: product.id,
      product_name: product.name_en,
      product_slug: product.slug,
      lang,
      status: "new",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success(t.success);
  };

  if (done) {
    return <div className="rounded-lg border bg-card p-4 text-sm">{t.success}</div>;
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-5 space-y-3" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h3 className="font-semibold text-lg">{t.title}</h3>
        <p className="text-xs text-muted-foreground">{t.sub}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>{t.name} *</Label><Input required value={form.full_name} onChange={ev => setForm({ ...form, full_name: ev.target.value })} /></div>
        <div><Label>{t.email} *</Label><Input required type="email" value={form.email} onChange={ev => setForm({ ...form, email: ev.target.value })} /></div>
        <div><Label>{t.phone}</Label><Input value={form.phone} onChange={ev => setForm({ ...form, phone: ev.target.value })} /></div>
        <div><Label>{t.company}</Label><Input value={form.company} onChange={ev => setForm({ ...form, company: ev.target.value })} /></div>
      </div>
      <div><Label>{t.message}</Label><Textarea rows={3} value={form.message} onChange={ev => setForm({ ...form, message: ev.target.value })} /></div>
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}{t.send}
      </Button>
    </form>
  );
}