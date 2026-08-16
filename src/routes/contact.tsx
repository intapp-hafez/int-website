import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Navigation,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Loader2,
  Clock,
  MessageSquare,
  Building,
  ShieldCheck,
  Headphones,
  Briefcase,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useSettings, type OfficeBranch } from "@/lib/settings-store";
import { ContactMap } from "@/components/site/ContactMap";
import { FaqSection } from "@/components/site/FaqSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Integrated Technics" },
      { name: "description", content: "Talk to our senior certified engineers. Turnkey quotations and technical proposals delivered within 24-48 hours." },
    ],
  }),
  component: ContactPage,
});

const CATEGORY_KEYS = ["general", "sales", "support", "partnership", "careers"] as const;
const PRIORITY_KEYS = ["low", "normal", "high", "urgent"] as const;

const CATEGORY_LABEL: Record<typeof CATEGORY_KEYS[number], { en: string; ar: string }> = {
  general: { en: "General inquiry", ar: "استفسار عام" },
  sales: { en: "Commercial quotation / RFQ", ar: "طلب عرض أسعار ومناقصات" },
  support: { en: "Technical support & SLA", ar: "الدعم الفني وعقود الصيانة" },
  partnership: { en: "Vendor & Strategic Partnership", ar: "شراكات تقنية وموردين" },
  careers: { en: "Careers & Recruitment", ar: "الوظائف والتوظيف" },
};

const PRIORITY_LABEL: Record<typeof PRIORITY_KEYS[number], { en: string; ar: string; hint: { en: string; ar: string } }> = {
  low: { en: "Low", ar: "منخفضة", hint: { en: "Reply within 3 business days", ar: "الرد خلال 3 أيام عمل" } },
  normal: { en: "Normal", ar: "عادية", hint: { en: "Reply within 24 hours", ar: "الرد خلال 24 ساعة عمل" } },
  high: { en: "High", ar: "عالية", hint: { en: "Reply within 4 business hours", ar: "الرد خلال 4 ساعات عمل" } },
  urgent: { en: "Critical SLA", ar: "عاجلة (SLA طوارئ)", hint: { en: "Immediate dispatch within 1 hour", ar: "استجابة فورية خلال ساعة" } },
};

function ContactPage() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const isAr = lang === "ar";
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string>("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    category: "sales" as typeof CATEGORY_KEYS[number],
    priority: "normal" as typeof PRIORITY_KEYS[number],
  });

  const address = (settings.address as any)?.[lang] ?? settings.address?.en ?? "Cairo, Egypt";
  const { lat, lng } = settings.coords ?? { lat: 30.0444, lng: 31.2357 };
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(address)}`;
  const mapEmbed = settings.mapUrl?.trim();

  const headerBadge = settings.contactHeader?.badge?.[lang] || (isAr ? "تواصل معنا" : "Get In Touch");
  const headerTitle = settings.contactHeader?.title?.[lang] || (isAr ? "لنبني معاً بنيتك التحتية المتكاملة" : "Let's Architect Your Infrastructure");
  const headerSubtitle =
    settings.contactHeader?.subtitle?.[lang] ||
    (isAr
      ? "تحدث مباشرة مع كبار مهندسينا المعتمدين. عروض أسعار ودراسات فنية متكاملة للمشاريع خلال 24–48 ساعة."
      : "Talk directly to our senior certified engineers. Turnkey quotations, site surveys, and technical assessments delivered within 24–48 hours.");

  const workingHours =
    settings.contactHours?.[lang] ||
    (isAr ? "الأحد – الخميس: 9:00 صباحاً – 6:00 مساءً (بتوقيت القاهرة)" : "Sunday – Thursday: 9:00 AM – 6:00 PM (Cairo UTC+2)");

  const branches = settings.branches?.length > 0 ? settings.branches : [];

  // Site Settings-driven SEO overrides
  useEffect(() => {
    const seo = settings.contactSeo;
    const title = (isAr ? seo?.title?.ar : seo?.title?.en) || seo?.title?.en;
    const desc = (isAr ? seo?.description?.ar : seo?.description?.en) || seo?.description?.en;
    const og = (isAr ? seo?.ogImage?.ar : seo?.ogImage?.en) || seo?.ogImage?.en;
    if (title) document.title = title;
    const upsert = (attr: "name" | "property", key: string, val: string | undefined) => {
      if (!val) return;
      const sel = `meta[${attr}="${key}"][data-contact-seo="1"]`;
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        el.setAttribute("data-contact-seo", "1");
        document.head.appendChild(el);
      }
      el.setAttribute("content", val);
    };
    upsert("name", "description", desc);
    upsert("property", "og:title", title);
    upsert("property", "og:description", desc);
    upsert("property", "og:image", og);
    upsert("name", "twitter:title", title);
    upsert("name", "twitter:description", desc);
    if (og) upsert("name", "twitter:image", og);
    return () => {
      document.head.querySelectorAll('meta[data-contact-seo="1"]').forEach((n) => n.remove());
    };
  }, [settings.contactSeo, isAr]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error(isAr ? "يرجى تعبئة الحقول المطلوبة" : "Please complete the required fields");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Insert Lead
      const { error: leadErr } = await supabase.from("leads").insert({
        source: "contact_form",
        full_name: form.full_name.trim().slice(0, 200),
        email: form.email.trim().slice(0, 255),
        phone: form.phone.trim().slice(0, 50),
        company: form.company.trim().slice(0, 200),
        message: form.message.trim().slice(0, 4000),
        category: form.category,
        priority: form.priority,
        lang,
        status: "new",
      });

      if (leadErr) throw leadErr;

      // 2. Insert In-App Admin Notification
      await supabase.from("admin_notifications").insert({
        type: form.category === "support" || form.category === "careers" ? "system" : "lead",
        title: `New Contact Inquiry (${CATEGORY_LABEL[form.category]?.[lang] || form.category})`,
        message: `${form.full_name}${form.company ? ` (${form.company})` : ""}: ${form.message.slice(0, 120)}...`,
        href: "/dashboard/admin/leads",
      });

      setSent(true);
      setForm({ full_name: "", email: "", phone: "", company: "", message: "", category: "sales", priority: "normal" });
      toast.success(isAr ? "تم استلام رسالتك بنجاح وسيتواصل معك مهندسونا قريباً" : "Your inquiry has been received. Our engineers will respond shortly.");
    } catch (err: any) {
      toast.error(err?.message || (isAr ? "حدث خطأ أثناء الإرسال" : "Failed to send message"));
    } finally {
      setSubmitting(false);
    }
  };

  const socials = [
    { Icon: Linkedin, href: settings.social.linkedin, label: "LinkedIn" },
    { Icon: Twitter, href: settings.social.twitter, label: isAr ? "تويتر" : "Twitter" },
    { Icon: Facebook, href: settings.social.facebook, label: isAr ? "فيسبوك" : "Facebook" },
    { Icon: Instagram, href: settings.social.instagram, label: isAr ? "إنستغرام" : "Instagram" },
    { Icon: Youtube, href: settings.social.youtube, label: isAr ? "يوتيوب" : "YouTube" },
  ].filter((s) => s.href && s.href.trim().length > 0);

  const waHref = settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(isAr ? "مرحباً، أود الاستفسار عن حلول وخدمات إنترجريتد تكنيكس." : "Hello, I would like to inquire about Integrated Technics engineering solutions.")}` : "";

  return (
    <div className="min-h-screen">
      {/* 1. DYNAMIC HERO SECTION */}
      <section className="gradient-surface relative overflow-hidden border-b">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 py-20 lg:py-24 relative">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{headerBadge}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.15]">
              {headerTitle}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {headerSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC QUICK CONTACT CHANNELS BAR */}
      <section className="container mx-auto px-4 lg:px-8 -mt-8 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sales & Quotes */}
          <div className="p-5 rounded-2xl border bg-card/95 backdrop-blur-md shadow-sm hover:border-accent/50 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{isAr ? "قسم المبيعات والمشاريع" : "Commercial Sales"}</div>
                <div className="text-sm font-bold">{isAr ? "عروض الأسعار والمناقصات" : "RFQs & Proposals"}</div>
              </div>
            </div>
            <a href={`mailto:${settings.salesEmail || settings.email}`} className="text-xs font-mono text-muted-foreground hover:text-accent truncate block mt-1">
              {settings.salesEmail || settings.email}
            </a>
          </div>

          {/* Technical Support & SLA */}
          <div className="p-5 rounded-2xl border bg-card/95 backdrop-blur-md shadow-sm hover:border-accent/50 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{isAr ? "الدعم الفني والصيانة" : "Technical Helpdesk"}</div>
                <div className="text-sm font-bold">{isAr ? "استجابة 24/7 للحالات الحرجة" : "24/7 SLA Engineering"}</div>
              </div>
            </div>
            <a href={`mailto:${settings.supportEmail || settings.email}`} className="text-xs font-mono text-muted-foreground hover:text-accent truncate block mt-1">
              {settings.supportEmail || settings.email}
            </a>
          </div>

          {/* Phone Hotline */}
          <div className="p-5 rounded-2xl border bg-card/95 backdrop-blur-md shadow-sm hover:border-accent/50 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{isAr ? "الخط المباشر" : "Direct Hotline"}</div>
                <div className="text-sm font-bold">{isAr ? "اتصال هاتفي فوري" : "Instant Voice Call"}</div>
              </div>
            </div>
            <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="text-xs font-mono font-semibold text-foreground hover:text-accent truncate block mt-1" dir="ltr">
              {settings.phone}
            </a>
          </div>

          {/* Direct WhatsApp Chat */}
          {waHref && (
            <div className="p-5 rounded-2xl border bg-card/95 backdrop-blur-md shadow-sm hover:border-emerald-500/50 transition-all group">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{isAr ? "واتساب مهندسينا" : "Live WhatsApp"}</div>
                  <div className="text-sm font-bold">{isAr ? "محادثة فورية مباشرة" : "Chat with Engineer"}</div>
                </div>
              </div>
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1 mt-1">
                <span>{isAr ? "فتح محادثة واتساب" : "Open WhatsApp"}</span>
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 3. MAIN FORM & DETAILS SECTION */}
      <Section className="pt-12">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Contact & Quotation Form */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-2xl border bg-card shadow-xs">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">{isAr ? "أرسل تفاصيل مشروعك أو استفسارك" : "Send an Inquiry or RFP"}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isAr
                  ? "املأ النموذج أدناه وسيتولى مهندس حلول متخصص مراجعة متطلباتك والرد عليك."
                  : "Fill in the details below and a certified solutions architect will review your project requirements."}
              </p>
            </div>

            {sent ? (
              <div className="text-center py-12 space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{isAr ? "تم إرسال رسالتك بنجاح!" : "Thank You! Message Received."}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {isAr
                    ? "تم تسجيل طلبك في نظام المتابعة لدينا وسيقوم الفريق الهندسي بالتواصل معك وفقاً لمستوى الخدمة المحدد."
                    : "Your inquiry is logged in our tracking system. Our engineering team will reach out to you within the specified SLA."}
                </p>
                <Button variant="outline" onClick={() => setSent(false)} className="mt-4">
                  {isAr ? "إرسال رسالة أخرى" : "Send Another Message"}
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("form.name")} *</Label>
                    <Input
                      required
                      maxLength={200}
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder={isAr ? "الاسم الكامل" : "Eng. Hafez Rahim"}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("form.email")} *</Label>
                    <Input
                      type="email"
                      required
                      maxLength={255}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("form.company")}</Label>
                    <Input
                      maxLength={200}
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder={isAr ? "اسم الشركة أو الجهة" : "Organization / Enterprise"}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("form.phone")}</Label>
                    <Input
                      type="tel"
                      maxLength={50}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+20 100 000 0000"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? "القسم أو موضوع الطلب" : "Inquiry Department"}</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {isAr ? CATEGORY_LABEL[k].ar : CATEGORY_LABEL[k].en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? "الأولوية ومستوى الاستجابة المطلوبة" : "Response SLA Priority"}</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            <span>{isAr ? PRIORITY_LABEL[k].ar : PRIORITY_LABEL[k].en}</span>
                            <span className="text-muted-foreground text-xs ms-1.5">
                              ({isAr ? PRIORITY_LABEL[k].hint.ar : PRIORITY_LABEL[k].hint.en})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t("form.message")} *</Label>
                  <Textarea
                    rows={5}
                    required
                    maxLength={4000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={
                      isAr
                        ? "اكتب تفاصيل استفسارك، موقع المشروع، المواصفات الفنية المطلوبة، أو أي ملاحظات..."
                        : "Describe project requirements, scope of work, technical specifications, or timeline..."
                    }
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    <span>{isAr ? "بياناتك محمية ومحفوظة بسرية تامة." : "Enterprise data protected with strict confidentiality."}</span>
                  </div>

                  <Button type="submit" size="lg" disabled={submitting} className="min-w-[160px] shadow-sm">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 me-2 animate-spin" />
                        {isAr ? "جاري الإرسال..." : "Sending..."}
                      </>
                    ) : (
                      <>
                        <span>{t("form.send")}</span>
                        <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Right Sidebar: Dynamic Contact Info, Hours & Branches */}
          <div className="space-y-4">
            {/* Headquarters Card */}
            <div className="p-6 rounded-2xl border bg-card shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl gradient-hero text-primary-foreground flex items-center justify-center shrink-0">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{isAr ? "المقر الرئيسي" : "Headquarters"}</h3>
                  <p className="text-xs text-muted-foreground">{isAr ? "القاهرة، جمهورية مصر العربية" : "Cairo, Egypt"}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-snug">{address}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-accent shrink-0" />
                  <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="font-semibold hover:text-accent font-mono" dir="ltr">
                    {settings.phone}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-accent shrink-0" />
                  <a href={`mailto:${settings.email}`} className="font-semibold hover:text-accent break-all">
                    {settings.email}
                  </a>
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <div className="font-medium text-foreground">{isAr ? "ساعات العمل الرسمية:" : "Business Working Hours:"}</div>
                    <div>{workingHours}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Additional Branches */}
            {branches.length > 1 && (
              <div className="p-5 rounded-2xl border bg-card shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{isAr ? "الفروع والمكاتب الإقليمية" : "Regional Branches"}</h4>
                  <Badge variant="outline" className="text-[10px]">{branches.length} {isAr ? "مواقع" : "Hubs"}</Badge>
                </div>

                <div className="space-y-2">
                  {branches.map((b) => (
                    <div key={b.id} className="p-3 rounded-xl border bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">{b.name[lang] || b.name.en}</span>
                        {b.isMain && <Badge className="text-[9px] py-0 h-4">{isAr ? "رئيسي" : "HQ"}</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{b.address[lang] || b.address.en}</p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                        {b.phone && <a href={`tel:${b.phone.replace(/\s+/g, "")}`} className="hover:text-accent">📞 {b.phone}</a>}
                        {b.email && <a href={`mailto:${b.email}`} className="hover:text-accent">✉ {b.email}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Media Links */}
            {socials.length > 0 && (
              <div className="p-5 rounded-2xl border bg-card shadow-xs">
                <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">{isAr ? "تواصل معنا عبر منصات التواصل" : "Connect On Social Media"}</div>
                <div className="flex flex-wrap gap-2">
                  {socials.map(({ Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="h-10 px-3 rounded-xl border bg-muted/30 flex items-center gap-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* 4. DYNAMIC INTERACTIVE LOCATION MAP */}
      <Section className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{isAr ? "موقع المقر على الخريطة" : "Headquarters Location"}</h2>
              <p className="text-xs text-muted-foreground">{address}</p>
            </div>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline border border-accent/20 px-3 py-1.5 rounded-lg bg-accent/5"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>{isAr ? "الاتجاهات على Google Maps" : "Open in Google Maps"}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="rounded-2xl overflow-hidden border bg-card relative shadow-xs">
            {mapEmbed ? (
              <iframe
                src={mapEmbed}
                title={lang === "ar" ? "خريطة الموقع" : "Location map"}
                className="w-full h-[380px] md:h-[480px] block border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <ContactMap lat={lat} lng={lng} label={address} className="w-full h-[380px] md:h-[480px]" />
            )}

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute z-[400] top-4 end-4 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-lg hover:opacity-95 transition"
            >
              <Navigation className="h-4 w-4" /> {lang === "ar" ? "احصل على الاتجاهات" : "Get directions"}
            </a>
          </div>
        </div>
      </Section>

      {/* 5. DYNAMIC FAQS SECTION */}
      <FaqSection className="border-t bg-muted/10" />
    </div>
  );
}
