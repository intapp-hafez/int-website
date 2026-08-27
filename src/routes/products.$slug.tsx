import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  ShoppingBag,
  Loader2,
  Building2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Share2,
  CheckCircle2,
  FileText,
  PhoneCall,
  ChevronRight,
  Maximize2,
  Layers,
  Star,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { VendorBadgesOverlay } from "@/components/site/VendorBadgesOverlay";
import type { Product } from "@/lib/products";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("slug", params.slug)
      .eq("active", true)
      .maybeSingle();

    if (!data) throw notFound();

    // Fetch related products from the same or other categories
    const { data: related } = await supabase
      .from("products")
      .select("id, slug, name_en, name_ar, category_en, category_ar, image_url, featured, vendors")
      .eq("active", true)
      .neq("slug", params.slug)
      .limit(4);

    return {
      product: data as unknown as Product,
      relatedProducts: ((related as unknown as Product[]) || []),
    };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Product — Integrated Technics" }] };
    const titleEn = `${p.name_en} — Integrated Technics`;
    const titleAr = `${p.name_ar} — إنتجريتد تكنيكس`;
    const descEn = (p.description_en || "").replace(/<[^>]*>?/gm, "").slice(0, 160);
    const descAr = (p.description_ar || "").replace(/<[^>]*>?/gm, "").slice(0, 160);
    const img = p.image_url || undefined;
    const path = `/products/${params.slug}`;
    return {
      meta: [
        { title: titleEn },
        { name: "description", content: descEn },
        { name: "description", lang: "ar", content: descAr },
        { property: "og:type", content: "product" },
        { property: "og:title", titleEn },
        { property: "og:description", content: descEn },
        { property: "og:url", content: path },
        ...(img
          ? [
            { property: "og:image", content: img },
            { name: "twitter:image", content: img },
          ]
          : []),
        { name: "twitter:card", content: img ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: titleEn },
        { name: "twitter:description", content: descEn },
        { property: "og:locale:alternate", content: "ar_AR" },
      ],
      links: [{ rel: "canonical", href: path }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name_en,
            alternateName: p.name_ar,
            description: p.description_en ? p.description_en.replace(/<[^>]*>?/gm, "") : "",
            image: img ? [img, ...(p.gallery || [])] : undefined,
            category: p.category_en || undefined,
          }),
        },
      ],
    };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product: p, relatedProducts } = Route.useLoaderData();
  const { lang } = useI18n();
  const isAr = lang === "ar";

  const [activeImage, setActiveImage] = useState<string>(p.image_url || "");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const name = (lang === "ar" ? p.name_ar : p.name_en) || p.name_en;
  const desc = (lang === "ar" ? p.description_ar : p.description_en) || p.description_en;
  const cat = (lang === "ar" ? p.category_ar : p.category_en) || p.category_en;
  const allImages = [p.image_url, ...(p.gallery || [])].filter(Boolean);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(isAr ? "تم نسخ رابط المنتج بنجاح" : "Product link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <nav className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
              <Link to="/" className="hover:text-foreground transition-colors">
                {isAr ? "الرئيسية" : "Home"}
              </Link>
              <ChevronRight className="h-3 w-3 rtl:rotate-180 text-muted-foreground/60" />
              <Link to="/products" className="hover:text-foreground transition-colors">
                {isAr ? "المنتجات" : "Products"}
              </Link>
              {cat && (
                <>
                  <ChevronRight className="h-3 w-3 rtl:rotate-180 text-muted-foreground/60" />
                  <span className="text-muted-foreground">{cat}</span>
                </>
              )}
              <ChevronRight className="h-3 w-3 rtl:rotate-180 text-muted-foreground/60" />
              <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">{name}</span>
            </nav>

            <div className="flex items-center gap-2 ms-auto">
              <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 text-xs gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "مشاركة" : "Share")}</span>
              </Button>

              <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Link to="/products">
                  <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                  <span>{isAr ? "جميع المنتجات" : "Back to Catalog"}</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Product Hero Showcase */}
      <section className="container mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ========================================================================= */}
          {/* LEFT: INTERACTIVE MEDIA GALLERY (Col 5) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative group rounded-2xl border bg-card/80 backdrop-blur-xs overflow-hidden shadow-lg aspect-square flex items-center justify-center">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-2 opacity-40" />
                  <span className="text-xs">{isAr ? "لا توجد صورة للمنتج" : "No image available"}</span>
                </div>
              )}

              {activeImage && (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="absolute bottom-3 end-3 h-8 w-8 rounded-lg bg-background/80 backdrop-blur-md border shadow-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  title={isAr ? "تكبير الصورة" : "Zoom image"}
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              )}

              {p.featured && (
                <div className="absolute top-3 start-3">
                  <Badge className="bg-amber-500/90 text-white font-medium text-[11px] gap-1 shadow-sm">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{isAr ? "منتج مميز" : "Featured Product"}</span>
                  </Badge>
                </div>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`relative h-18 w-18 rounded-xl border bg-card shrink-0 overflow-hidden transition-all duration-200 ${
                      activeImage === imgUrl
                        ? "ring-2 ring-accent border-accent shadow-sm scale-105"
                        : "opacity-70 hover:opacity-100 hover:border-accent/40"
                    }`}
                  >
                    <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Guarantees Box */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl border bg-muted/30 flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {isAr ? "ضمان رسمي معتمد" : "Certified Genuine"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {isAr ? "مباشرة من الوكيل والمصنع" : "Direct from OEM partner"}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border bg-muted/30 flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {isAr ? "دعم هندسي متكامل" : "Turnkey Support"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {isAr ? "تركيب وتكوين وتشغيل" : "Deployment & configuration"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT: PRODUCT INFO & ACTION HUB (Col 7) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              {cat && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
                  <Layers className="h-3 w-3" />
                  <span>{cat}</span>
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground font-display leading-tight">
                {name}
              </h1>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button size="lg" className="gap-2 shadow-md" onClick={() => setQuoteModalOpen(true)}>
                  <Sparkles className="h-4 w-4" />
                  <span>{isAr ? "اطلب عرض سعر رسمي" : "Request Commercial Quote"}</span>
                </Button>

                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/contact">
                    <PhoneCall className="h-4 w-4" />
                    <span>{isAr ? "استشارة مهندس مختص" : "Consult a Specialist"}</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Authorized Vendors / Partners Box */}
            {p.vendors && p.vendors.length > 0 && (
              <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-xs space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {isAr ? "المصنعين والشركاء المعتمدين" : "Authorized Vendors & OEMs"}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="text-[11px] font-mono px-2 py-0.5">
                    {p.vendors.length} {p.vendors.length === 1 ? (isAr ? "شريك معتمد" : "Certified Partner") : (isAr ? "شركاء معتمدين" : "Certified Partners")}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-start gap-5 pt-1">
                  {p.vendors.map((vendor) => {
                    const CardWrapper = vendor.website_url ? "a" : "div";
                    const linkProps = vendor.website_url
                      ? {
                          href: vendor.website_url,
                          target: "_blank",
                          rel: "noreferrer",
                          title: `${vendor.name} — ${isAr ? "زيارة الموقع الرسمي" : "Visit Official Website"}`,
                        }
                      : {};

                    return (
                      <CardWrapper
                        key={vendor.id}
                        {...linkProps}
                        className={`group flex flex-col items-center text-center max-w-[100px] transition-all duration-300 ${
                          vendor.website_url ? "cursor-pointer" : ""
                        }`}
                      >
                        {/* Circular Logo Medallion */}
                        <div className="relative">
                          <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-full border-2 border-border/70 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-850 dark:via-slate-900 dark:to-slate-950 p-3 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 group-hover:border-accent/60 group-hover:ring-4 group-hover:ring-accent/15 transition-all duration-300">
                            {vendor.logo ? (
                              <img
                                src={vendor.logo}
                                alt={vendor.name}
                                className="max-h-full max-w-full object-contain filter drop-shadow-2xs transition-transform duration-300 group-hover:scale-110"
                              />
                            ) : (
                              <Building2 className="h-8 w-8 text-muted-foreground/60" />
                            )}
                          </div>

                          {vendor.website_url && (
                            <div className="absolute -bottom-1 -end-1 h-5 w-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                              <ExternalLink className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </div>

                        {/* Vendor Name */}
                        <div className="mt-2 text-center">
                          <span className="block font-bold text-xs text-foreground group-hover:text-accent transition-colors truncate max-w-[96px] tracking-wide uppercase">
                            {vendor.name}
                          </span>
                          {vendor.website_url && (
                            <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5 group-hover:text-accent">
                              <span>{isAr ? "الموقع" : "Official"}</span>
                            </span>
                          )}
                        </div>
                      </CardWrapper>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tabbed Detailed Specifications */}
            <div className="pt-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full grid grid-cols-2 h-11 bg-muted/60 p-1 rounded-xl">
                  <TabsTrigger value="overview" className="gap-2 text-xs font-semibold">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{isAr ? "المواصفات والوصف التقني" : "Overview & Specifications"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="quote" className="gap-2 text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span>{isAr ? "طلب دراسة وعرض سعر" : "Request RFQ / Pricing"}</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Overview */}
                <TabsContent value="overview" className="mt-4 p-5 rounded-2xl border bg-card/60 space-y-4">
                  <div
                    className="prose dark:prose-invert max-w-none text-sm sm:text-base text-muted-foreground leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:ms-5 [&_ol]:list-decimal [&_ol]:ms-5"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(desc || "") }}
                  />
                </TabsContent>

                {/* Tab 2: Embedded Quote Form */}
                <TabsContent value="quote" className="mt-4">
                  <QuoteForm product={p} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* RELATED PRODUCTS SHOWCASE */}
      {/* ========================================================================= */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 lg:px-8 pt-20">
          <div className="border-t pt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground">
                  {isAr ? "منتجات وحلول ذات صلة" : "Related Products & Systems"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {isAr ? "اكتشف المزيد من المنظومات المتوافقة" : "Explore more engineered equipment & modules"}
                </p>
              </div>

              <Button asChild variant="ghost" size="sm" className="text-xs gap-1 text-accent">
                <Link to="/products">
                  <span>{isAr ? "تصفح الكل ←" : "View All →"}</span>
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => {
                const relName = (lang === "ar" ? rel.name_ar : rel.name_en) || rel.name_en;
                const relCat = (lang === "ar" ? rel.category_ar : rel.category_en) || rel.category_en;

                const relVendors = (rel.vendors || []).filter((v) => v && (v.logo || v.name));

                return (
                  <Link
                    key={rel.id}
                    to="/products/$slug"
                    params={{ slug: rel.slug }}
                    className="group rounded-xl border bg-card overflow-hidden hover:border-accent/60 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div className="relative aspect-square bg-muted/40 overflow-hidden flex items-center justify-center p-3">
                      {rel.image_url ? (
                        <img
                          src={rel.image_url}
                          alt={relName}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                      )}
                      {rel.featured && (
                        <div className="absolute top-2 start-2">
                          <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                            {isAr ? "مميز" : "Featured"}
                          </Badge>
                        </div>
                      )}

                      {/* Vendors Logo on image bottom center with interactive hover popups */}
                      <VendorBadgesOverlay vendors={rel.vendors} max={8} size="sm" />
                    </div>

                    <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between border-t">
                      <div>
                        {relCat && (
                          <div className="text-[10px] font-semibold text-accent uppercase tracking-wider truncate">
                            {relCat}
                          </div>
                        )}
                        <h3 className="font-semibold text-xs text-foreground line-clamp-2 group-hover:text-accent transition-colors mt-0.5">
                          {relName}
                        </h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-neutral-800 text-white flex flex-col items-center justify-center">
          <img src={activeImage} alt={name} className="max-h-[80vh] w-auto object-contain rounded-lg" />
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* COMMERCIAL RFQ QUOTE MODAL */}
      {/* ========================================================================= */}
      <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-card">
            <DialogTitle className="text-lg font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span>{isAr ? "طلب عرض سعر رسمي" : "Request Official Quote"}</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {isAr ? "المنتج:" : "Product:"} <span className="font-semibold text-foreground">{name}</span>
            </p>
          </DialogHeader>

          <div className="p-6">
            <QuoteForm product={p} onSuccess={() => setQuoteModalOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuoteForm({ product, onSuccess }: { product: Product; onSuccess?: () => void }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const t = {
    title: isAr ? "نموذج التسعير والمواصفات" : "Quotation & RFQ Form",
    sub: isAr
      ? "أرسل تفاصيل مشروعك وسيقوم مهندس الحلول بالتواصل معك وتزويدك بعرض سعر تفصيلي."
      : "Submit your project requirements and our solutions engineering team will provide a detailed proposal.",
    name: isAr ? "الاسم الكامل" : "Full name",
    email: isAr ? "البريد الإلكتروني للعمل" : "Work email",
    phone: isAr ? "رقم الهاتف" : "Phone number",
    company: isAr ? "اسم الشركة / المؤسسة" : "Company / Organization",
    message: isAr ? "الكمية المطلوبة أو متطلبات خاصة بالمشروع" : "Quantity or project requirements",
    send: isAr ? "إرسال طلب عرض السعر" : "Submit Quote Request",
    success: isAr
      ? "تم استلام طلبك بنجاح! سيتواصل معك أحد مهندسينا قريباً."
      : "Your request has been received. An engineer will contact you shortly.",
    required: isAr ? "يرجى تعبئة الاسم والبريد الإلكتروني" : "Please provide your name and email",
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error(t.required);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      source: "quote_request",
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      message: `Product Quote Request: ${product.name_en} (${product.slug})\nRequirements: ${form.message.trim()}`,
      product_id: product.id,
      product_name: product.name_en,
      product_slug: product.slug,
      lang,
      status: "new",
    } as any);

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success(t.success);
    if (onSuccess) {
      setTimeout(onSuccess, 2000);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
        <div className="font-semibold text-base text-foreground">{t.success}</div>
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "تم تسجيل طلبك في نظام الدعم الفني والمبيعات بنجاح."
            : "Your request has been registered in our CRM dispatch queue."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-5 sm:p-6 space-y-4 shadow-xs" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h3 className="font-semibold text-base sm:text-lg">{t.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t.sub}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t.name} <span className="text-destructive">*</span></Label>
          <Input
            required
            value={form.full_name}
            onChange={(ev) => setForm({ ...form, full_name: ev.target.value })}
            placeholder={isAr ? "حافظ رحيم" : "Hafez Rahim"}
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t.email} <span className="text-destructive">*</span></Label>
          <Input
            required
            type="email"
            value={form.email}
            onChange={(ev) => setForm({ ...form, email: ev.target.value })}
            placeholder="Hafez@company.com"
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t.phone}</Label>
          <Input
            value={form.phone}
            onChange={(ev) => setForm({ ...form, phone: ev.target.value })}
            placeholder="+201007419344"
            className="h-9 text-xs font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t.company}</Label>
          <Input
            value={form.company}
            onChange={(ev) => setForm({ ...form, company: ev.target.value })}
            placeholder={isAr ? "اسم الجهة أو المشروع" : "Company / Entity name"}
            className="h-9 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t.message}</Label>
        <Textarea
          rows={3}
          value={form.message}
          onChange={(ev) => setForm({ ...form, message: ev.target.value })}
          placeholder={
            isAr
              ? "حدد الكمية التقريبية، متطلبات الموقع، أو أي أسئلة فنية..."
              : "Specify estimated quantities, project deployment timeline, or technical specs..."
          }
          className="text-xs resize-none"
        />
      </div>

      <Button type="submit" size="lg" className="w-full gap-2 shadow-sm font-semibold text-sm" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        <span>{t.send}</span>
      </Button>
    </form>
  );
}
