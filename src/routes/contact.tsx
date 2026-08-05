import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, CheckCircle2, Navigation, Linkedin, Twitter, Facebook, Instagram, Youtube, Loader2 } from "lucide-react";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-store";
import { ContactMap } from "@/components/site/ContactMap";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Integrated Technics" }, { name: "description", content: "Talk to a solutions architect. Tailored proposals within 48 hours." }] }),
  component: ContactPage,
});

const CATEGORY_KEYS = ["general", "sales", "support", "partnership", "careers"] as const;
const PRIORITY_KEYS = ["low", "normal", "high", "urgent"] as const;

const CATEGORY_LABEL: Record<typeof CATEGORY_KEYS[number], { en: string; ar: string }> = {
  general:    { en: "General inquiry",  ar: "استفسار عام" },
  sales:      { en: "Sales",            ar: "المبيعات" },
  support:    { en: "Technical support", ar: "الدعم الفني" },
  partnership:{ en: "Partnership",      ar: "شراكة" },
  careers:    { en: "Careers",          ar: "الوظائف" },
};
const PRIORITY_LABEL: Record<typeof PRIORITY_KEYS[number], { en: string; ar: string; hint: { en: string; ar: string } }> = {
  low:    { en: "Low",     ar: "منخفضة", hint: { en: "Reply within 3 business days", ar: "الرد خلال 3 أيام عمل" } },
  normal: { en: "Normal",  ar: "عادية",  hint: { en: "Reply within 1 business day",  ar: "الرد خلال يوم عمل" } },
  high:   { en: "High",    ar: "عالية",  hint: { en: "Reply within 4 business hours", ar: "الرد خلال 4 ساعات عمل" } },
  urgent: { en: "Urgent",  ar: "عاجلة",  hint: { en: "Reply within 1 hour",           ar: "الرد خلال ساعة" } },
};

function ContactPage() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const isAr = lang === "ar";
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    category: "general" as typeof CATEGORY_KEYS[number],
    priority: "normal" as typeof PRIORITY_KEYS[number],
  });
  const address = (settings.address as any)?.[lang] ?? settings.address?.en ?? "Cairo, Egypt";
  const { lat, lng } = settings.coords ?? { lat: 30.0444, lng: 31.2357 };
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(address)}`;
  const mapEmbed = settings.mapUrl?.trim();

  // Site Settings-driven SEO overrides (client-side; SeoHead DB metadata still applies first)
  useEffect(() => {
    const seo = settings.contactSeo;
    const title = (isAr ? seo?.title?.ar : seo?.title?.en) || seo?.title?.en;
    const desc  = (isAr ? seo?.description?.ar : seo?.description?.en) || seo?.description?.en;
    const og    = (isAr ? seo?.ogImage?.ar : seo?.ogImage?.en) || seo?.ogImage?.en;
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
    const { error } = await supabase.from("leads").insert({
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
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    setForm({ full_name: "", email: "", phone: "", company: "", message: "", category: "general", priority: "normal" });
  };

  const socials = [
    { Icon: Linkedin,  href: settings.social.linkedin,  label: "LinkedIn" },
    { Icon: Twitter,   href: settings.social.twitter,   label: isAr ? "تويتر" : "Twitter" },
    { Icon: Facebook,  href: settings.social.facebook,  label: isAr ? "فيسبوك" : "Facebook" },
    { Icon: Instagram, href: settings.social.instagram, label: isAr ? "إنستغرام" : "Instagram" },
    { Icon: Youtube,   href: settings.social.youtube,   label: isAr ? "يوتيوب" : "YouTube" },
  ].filter((s) => s.href && s.href.trim().length > 0);

  return (
    <div>
      <section className="gradient-surface relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="container mx-auto px-4 lg:px-8 py-24 relative">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">{t("nav.contact")}</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{t("contact.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{t("contact.sub")}</p>
        </div>
      </section>
      <Section>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-8 rounded-2xl border bg-card">
            {sent ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-accent mb-4" />
                <h3 className="text-xl font-semibold">{t("form.success")}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {isAr ? "تم استلام رسالتك وسنرد عليك حسب أولوية الطلب." : "Your message was received. We'll reply based on the selected priority."}
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>
                  {isAr ? "إرسال رسالة أخرى" : "Send another message"}
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-5">
                <div className="grid gap-2"><Label>{t("form.name")} *</Label><Input required maxLength={200} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div className="grid gap-2"><Label>{t("form.email")} *</Label><Input type="email" required maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="grid gap-2"><Label>{t("form.company")}</Label><Input maxLength={200} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                <div className="grid gap-2"><Label>{t("form.phone")}</Label><Input type="tel" maxLength={50} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="grid gap-2">
                  <Label>{isAr ? "الفئة" : "Category"}</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_KEYS.map((k) => (
                        <SelectItem key={k} value={k}>{isAr ? CATEGORY_LABEL[k].ar : CATEGORY_LABEL[k].en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{isAr ? "الأولوية / مستوى الخدمة" : "Priority / SLA"}</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_KEYS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {(isAr ? PRIORITY_LABEL[k].ar : PRIORITY_LABEL[k].en)} — <span className="text-muted-foreground text-xs">{isAr ? PRIORITY_LABEL[k].hint.ar : PRIORITY_LABEL[k].hint.en}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 sm:col-span-2"><Label>{t("form.message")} *</Label><Textarea rows={5} required maxLength={4000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
                <div className="sm:col-span-2">
                  <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                    {t("form.send")}
                  </Button>
                </div>
              </form>
            )}
          </div>
          <div className="space-y-4">
            {[
              { I: MapPin, t: address, d: "" },
              { I: Phone, t: settings.phone, d: lang === "ar" ? "الأحد – الخميس، 9ص – 6م" : "Sun – Thu, 9am – 6pm", href: `tel:${settings.phone.replace(/\s+/g, "")}` },
              { I: Mail, t: settings.email, d: lang === "ar" ? "نرد خلال يوم عمل" : "Replies within 1 business day", href: `mailto:${settings.email}` },
              { I: Mail, t: settings.salesEmail, d: lang === "ar" ? "قسم المبيعات" : "Sales department", href: `mailto:${settings.salesEmail}` },
              { I: Mail, t: settings.supportEmail, d: lang === "ar" ? "الدعم الفني" : "Technical support", href: `mailto:${settings.supportEmail}` },
            ].map(({ I, t, d, href }) => (
              <div key={t} className="p-5 rounded-2xl border bg-card flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg gradient-hero text-primary-foreground flex items-center justify-center shrink-0"><I className="h-5 w-5" /></div>
                <div className="min-w-0">
                  {href ? <a href={href} className="font-semibold hover:text-accent break-all">{t}</a> : <div className="font-semibold">{t}</div>}
                  {d && <div className="text-sm text-muted-foreground">{d}</div>}
                </div>
              </div>
            ))}
            {socials.length > 0 && (
              <div className="p-5 rounded-2xl border bg-card">
                <div className="text-sm font-semibold mb-3">{isAr ? "تابعنا" : "Follow us"}</div>
                <div className="flex flex-wrap gap-2">
                  {socials.map(({ Icon, href, label }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="h-10 w-10 rounded-md border flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>
      <Section className="pt-0">
        <div className="rounded-2xl overflow-hidden border bg-card relative">
          {mapEmbed ? (
            <iframe
              src={mapEmbed}
              title={lang === "ar" ? "خريطة الموقع" : "Location map"}
              className="w-full h-[360px] md:h-[460px] block border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <ContactMap lat={lat} lng={lng} label={address} className="w-full h-[360px] md:h-[460px]" />
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute z-[400] top-4 end-4 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-lg hover:opacity-90 transition"
          >
            <Navigation className="h-4 w-4" /> {lang === "ar" ? "احصل على الاتجاهات" : "Get directions"}
          </a>
        </div>
      </Section>
    </div>
  );
}
