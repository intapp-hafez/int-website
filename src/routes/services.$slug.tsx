import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { services } from "@/data/site";
import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const s = services.find(x => x.slug === params.slug);
    if (!s) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => {
    const s = services.find(x => x.slug === params?.slug);
    return {
      meta: [
        { title: `${s?.title.en ?? "Service"} — Integrated Technics` },
        { name: "description", content: s?.desc.en ?? "Service detail" },
      ],
    };
  },
  notFoundComponent: () => <div className="container mx-auto py-32 text-center">Service not found</div>,
  errorComponent: ({ error }) => <div className="container mx-auto py-32 text-center">{error.message}</div>,
  component: ServiceDetail,
});

function ServiceDetail() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const s = services.find(x => x.slug === slug)!;
  const Icon = s.icon;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const serviceName = s.title[lang];
  const isAr = lang === "ar";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    setOpen(false);
    setForm({ name: "", email: "", phone: "", company: "", message: "" });
    toast.success(isAr ? "تم إرسال طلبك بنجاح" : "Your request has been submitted");
  };

  const features = [
    { en: "Architecture & design", ar: "التصميم والمعمارية" },
    { en: "Vendor-neutral selection", ar: "اختيار محايد للموردين" },
    { en: "Turnkey deployment", ar: "تنفيذ شامل" },
    { en: "Integration with existing systems", ar: "التكامل مع الأنظمة القائمة" },
    { en: "Documentation & training", ar: "التوثيق والتدريب" },
    { en: "Lifecycle support & SLA", ar: "دعم دورة الحياة واتفاقية SLA" },
  ];

  return (
    <div>
      <section className="gradient-surface relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="container mx-auto px-4 lg:px-8 py-20 relative">
          <Link to="/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent mb-8"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("nav.services")}</Link>
          <div className="flex items-start gap-5 max-w-3xl">
            <div className="h-16 w-16 rounded-2xl gradient-hero text-primary-foreground flex items-center justify-center shrink-0"><Icon className="h-8 w-8" /></div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{s.title[lang]}</h1>
              <p className="text-lg text-muted-foreground">{s.desc[lang]}</p>
            </div>
          </div>
        </div>
      </section>
      <Section>
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold mb-4">What we deliver</h2>
            <ul className="space-y-3">
              {features.map(f => (
                <li key={f.en} className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" /><span>{f[lang]}</span></li>
              ))}
            </ul>
          </div>
          <div className="p-8 rounded-2xl border bg-card">
            <h3 className="text-xl font-semibold mb-3">{isAr ? "تحدث مع مهندس حلول" : "Talk to a solutions architect"}</h3>
            <p className="text-sm text-muted-foreground mb-6">{isAr ? "أخبرنا عن مشروعك. سنرد خلال يوم عمل واحد." : "Tell us about your project. We respond within one business day."}</p>
            <Button type="button" className="w-full" onClick={() => setOpen(true)}>{t("cta.proposal")}</Button>
          </div>
        </div>
      </Section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "اطلب عرض سعر" : "Request a Quote"}</DialogTitle>
            <DialogDescription>
              {isAr ? "الخدمة" : "Service"}: <span className="font-medium text-foreground">{serviceName}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{isAr ? "الخدمة" : "Service"}</Label>
              <Input value={serviceName} readOnly />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="q-name">{isAr ? "الاسم الكامل" : "Full name"} *</Label>
                <Input id="q-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-email">{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
                <Input id="q-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-phone">{isAr ? "رقم الهاتف" : "Phone"} *</Label>
                <Input id="q-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required maxLength={30} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-company">{isAr ? "الشركة" : "Company"}</Label>
                <Input id="q-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} maxLength={150} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-message">{isAr ? "تفاصيل المشروع" : "Project details"}</Label>
              <Textarea id="q-message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={1000} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button type="submit" disabled={submitting}>{submitting ? (isAr ? "جارٍ الإرسال..." : "Submitting...") : (isAr ? "إرسال الطلب" : "Submit Request")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
