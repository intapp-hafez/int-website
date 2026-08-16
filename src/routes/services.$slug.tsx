import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useServices, getServiceIcon } from "@/lib/services-store";
import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/services/$slug")({
  head: () => ({
    meta: [
      { title: "Service Details — Integrated Technics" },
      { name: "description", content: "End-to-end security, ICT, AV, and data center services." },
    ],
  }),
  notFoundComponent: () => (
    <div className="container mx-auto py-32 text-center space-y-4">
      <h1 className="text-3xl font-bold">Service not found</h1>
      <Button asChild variant="outline"><Link to="/services">Back to Services</Link></Button>
    </div>
  ),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const { get, loading } = useServices();
  const s = get(slug);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const isAr = lang === "ar";

  if (!s) {
    if (loading) {
      return (
        <div className="container mx-auto py-32 text-center text-muted-foreground">
          Loading service...
        </div>
      );
    }
    return (
      <div className="container mx-auto py-32 text-center space-y-4">
        <h1 className="text-3xl font-bold">{isAr ? "الخدمة غير موجودة" : "Service not found"}</h1>
        <Button asChild variant="outline">
          <Link to="/services">{isAr ? "العودة للخدمات" : "Back to Services"}</Link>
        </Button>
      </div>
    );
  }

  const Icon = getServiceIcon(s.iconName);
  const serviceName = s.title?.[lang] || s.title?.en || "Service";
  const desc = s.desc?.[lang] || s.desc?.en || "";
  const isRich = /<[a-z][\s\S]*>/i.test(desc);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setOpen(false);
    setForm({ name: "", email: "", phone: "", company: "", message: "" });
    toast.success(isAr ? "تم إرسال طلبك بنجاح" : "Your request has been submitted");
  };

  const defaultFeatures = [
    { en: "Enterprise Architecture & Engineering Design", ar: "التصميم والمعمارية الهندسية المتطورة" },
    { en: "Vendor-Neutral Multi-Brand Technology Selection", ar: "اختيار محايد للموردين متعددي المصنعين" },
    { en: "Turnkey Implementation & Project Governance", ar: "تنفيذ وإدارة شاملة للمشروع حتى التسليم" },
    { en: "Seamless Integration with Legacy & Modern Systems", ar: "التكامل السلس مع الأنظمة القائمة والحديثة" },
    { en: "Full Documentation, Schematics & Certified Training", ar: "التوثيق والمخططات الشاملة والتدريب المعتمد" },
    { en: "24/7 SLA Lifecycle Support & Preventative Maintenance", ar: "دعم فني مستمر 24/7 وصيانة وقائية معتمدة" },
  ];

  const features = (s.features && s.features.length > 0) ? s.features : defaultFeatures;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 md:py-20 max-w-7xl">
      <Link to="/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent mb-8">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("nav.services")}
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Side: Image */}
        {s.image && (
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-3xl overflow-hidden border bg-muted/20 relative group shadow-sm">
              <img
                src={s.image}
                alt={serviceName}
                className="w-full h-auto aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 h-12 w-12 rounded-xl gradient-hero text-primary-foreground flex items-center justify-center shadow-lg">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Contents */}
        <div className={s.image ? "lg:col-span-7" : "lg:col-span-12"}>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">{serviceName}</h1>
          
          <div className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed font-normal pb-8 border-b w-full">
            {isRich ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-display"
                dangerouslySetInnerHTML={{ __html: desc }}
              />
            ) : (
              <p className="whitespace-pre-wrap">{desc}</p>
            )}
          </div>
          
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{isAr ? "ما نقدمه في هذه الخدمة" : "What we deliver"}</h2>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {features.map((f, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-[16px]">{f[lang] || f.en || f.ar}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-8 rounded-3xl border bg-card relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 bg-accent/5" />
            <div className="relative">
              <h3 className="text-xl font-semibold mb-3">{isAr ? "تحدث مع مهندس حلول" : "Talk to a solutions architect"}</h3>
              <p className="text-[15px] text-muted-foreground mb-6">
                {isAr ? "أخبرنا عن مشروعك. سنرد خلال يوم عمل واحد." : "Tell us about your project. We respond within one business day."}
              </p>
              <Button size="lg" type="button" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
                {t("cta.proposal")}
              </Button>
            </div>
          </div>
        </div>
      </div>

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
              <Button type="submit" disabled={submitting}>
                {submitting ? (isAr ? "جارٍ الإرسال..." : "Submitting...") : (isAr ? "إرسال الطلب" : "Submit Request")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
