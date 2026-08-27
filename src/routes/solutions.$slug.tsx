import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Layers, Workflow, Building2, ExternalLink, ShieldCheck, Mail, Phone, User, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSolutions, getSolutionIcon } from "@/lib/solutions-store";
import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/solutions/$slug")({
  head: () => ({
    meta: [
      { title: "Solution Details — Integrated Technics" },
      { name: "description", content: "End-to-end engineered ICT and security enterprise solutions." },
    ],
  }),
  notFoundComponent: () => (
    <div className="container mx-auto py-32 text-center space-y-4">
      <h1 className="text-3xl font-bold">Solution not found</h1>
      <Button asChild variant="outline">
        <Link to="/solutions">Back to Solutions</Link>
      </Button>
    </div>
  ),
  component: SolutionDetail,
});

function SolutionDetail() {
  const { slug } = Route.useParams();
  const { lang, t } = useI18n();
  const isAr = lang === "ar";
  const { solutions, loading } = useSolutions();

  const sol = solutions.find((s) => s.slug === slug);
  const otherSolutions = solutions.filter((s) => s.slug !== slug && s.active !== false).slice(0, 3);

  // Proposal modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  if (!sol) {
    if (loading) {
      return (
        <div className="container mx-auto py-32 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span>{isAr ? "جاري تحميل الحل..." : "Loading solution architecture..."}</span>
        </div>
      );
    }
    return (
      <div className="container mx-auto py-32 text-center space-y-4">
        <h1 className="text-3xl font-bold">{isAr ? "الحل غير موجود" : "Solution not found"}</h1>
        <Button asChild variant="outline">
          <Link to="/solutions">{isAr ? "العودة للحلول" : "Back to Solutions"}</Link>
        </Button>
      </div>
    );
  }

  const solutionName = isAr ? sol.name_ar || sol.name_en : sol.name_en;
  const bio = isAr ? sol.bio_ar || sol.bio_en : sol.bio_en;

  const handleSubmitProposal = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      return toast.error(isAr ? "يرجى تعبئة الاسم والبريد الإلكتروني" : "Please enter your name and email");
    }

    setSubmitting(true);
    try {
      // Save lead to Supabase leads table
      const { error } = await supabase.from("leads").insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        notes: `Solution Inquiry: ${solutionName} (${sol.slug})\nMessage: ${form.message.trim()}`,
        status: "new",
      } as any);

      if (error) {
        console.warn("Leads table error:", error);
      }

      toast.success(isAr ? "تم إرسال طلبك بنجاح. سيتواصل معك أحد مهندسينا قريباً." : "Your request has been submitted successfully. Our engineering team will contact you shortly.");
      setDialogOpen(false);
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
    } catch (err: any) {
      console.error(err);
      toast.error(isAr ? "فشل إرسال الطلب، يرجى المحاولة لاحقاً" : "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen relative pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 lg:pt-16 pb-16 lg:pb-24 border-b overflow-hidden bg-muted/20">
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30">
          <img src={sol.image || "/placeholder.svg"} alt="" className="w-full h-full object-cover blur-2xl scale-110" />
          <div className="absolute inset-0 bg-background/90 backdrop-blur-3xl" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              to="/solutions"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              <span>{isAr ? "العودة إلى جميع الحلول" : "Back to All Solutions"}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest">
                <Layers className="h-3.5 w-3.5" />
                <span>{isAr ? "منظومة حلول معتمدة" : "Engineered Solution"}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground font-display leading-tight">
                {solutionName}
              </h1>

              <div
                className="prose dark:prose-invert max-w-none text-base sm:text-lg text-muted-foreground leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ms-5 [&_ol]:list-decimal [&_ol]:ms-5"
                dangerouslySetInnerHTML={{ __html: bio }}
              />

              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <Button size="lg" className="gap-2 shadow-md" onClick={() => setDialogOpen(true)}>
                  <Sparkles className="h-4 w-4" />
                  <span>{isAr ? "اطلب دراسة وعرض سعر للحل" : "Request Solution Architecture Proposal"}</span>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/contact">{isAr ? "استشارة مهندس مختص" : "Consult an Architect"}</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border bg-card/80 overflow-hidden shadow-2xl aspect-video sm:aspect-4/3">
                <img
                  src={sol.image || "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=1200&q=80"}
                  alt={solutionName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Related Sub-Solutions Grid */}
      <section className="container mx-auto px-4 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest">
            <Workflow className="h-3.5 w-3.5" />
            <span>{isAr ? "مكونات المنظومة" : "Solution Architecture Breakdown"}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display tracking-tight">
            {isAr ? "الأنظمة والحلول الفرعية المتكاملة" : "Related Sub-Systems & Architectures"}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {isAr
              ? "مجموعة من الوحدات الهندسية المتوافقة التي تشكل النواة التشغيلية الشاملة لهذه المنظومة."
              : "Comprehensive modular components integrated seamlessly to deliver end-to-end reliability and compliance."}
          </p>
        </div>

        {sol.related_solutions && sol.related_solutions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sol.related_solutions.map((rel, idx) => {
              const IconComp = getSolutionIcon(rel.icon);
              return (
                <motion.div
                  key={rel.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="p-6 sm:p-8 rounded-2xl border bg-card/60 backdrop-blur-xs hover:border-accent/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
                        <IconComp className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                        Module 0{idx + 1}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold font-display text-foreground group-hover:text-accent transition-colors">
                        {isAr ? rel.title_ar || rel.title_en : rel.title_en}
                      </h3>
                      <div
                        className="text-sm text-muted-foreground leading-relaxed mt-2 prose-sm dark:prose-invert [&_p]:mb-1"
                        dangerouslySetInnerHTML={{ __html: isAr ? rel.bio_ar || rel.bio_en : rel.bio_en }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t flex items-center gap-2 text-xs font-semibold text-accent">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isAr ? "جاهز للتكامل والتنفيذ الميداني" : "Turnkey Deployment & SLA Ready"}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center border rounded-2xl bg-card/40 text-muted-foreground text-sm">
            {isAr ? "لا توجد تفاصيل فرعية مضافة بعد." : "No sub-solutions documented yet."}
          </div>
        )}
      </section>

      {/* Section 3: Technology Vendors & Partners */}
      {sol.vendors && sol.vendors.length > 0 && (
        <section className="container mx-auto px-4 lg:px-8 py-12 border-t">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest">
              <Building2 className="h-3.5 w-3.5" />
              <span>{isAr ? "الشركاء والتقنيات المعتمدة" : "Technology Vendor Ecosystem"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display">
              {isAr ? "المصنعين والشركاء العالميين للحل" : "OEM & Global Technology Partners"}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {isAr
                ? "نعتمد على أفضل الشركات المصنعة عالمياً لضمان أعلى مستويات الأداء والتوافق والضمان المعتمد."
                : "Partnered with Tier-1 technology providers to guarantee enterprise performance, longevity, and OEM warranties."}
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-start gap-6 sm:gap-8 max-w-4xl mx-auto">
            {sol.vendors.map((vendor) => {
              const CardWrapper = vendor.website_url ? "a" : "div";
              const linkProps = vendor.website_url
                ? {
                    href: vendor.website_url,
                    target: "_blank",
                    rel: "noreferrer",
                    title: `${vendor.name} — ${isAr ? "الموقع الرسمي" : "Official Website"}`,
                  }
                : {};

              return (
                <CardWrapper
                  key={vendor.id}
                  {...linkProps}
                  className={`group flex flex-col items-center text-center max-w-[110px] transition-all duration-300 ${
                    vendor.website_url ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="relative">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-border/80 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-850 dark:via-slate-900 dark:to-slate-950 p-3.5 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-105 group-hover:border-accent/60 group-hover:ring-4 group-hover:ring-accent/15 transition-all duration-300">
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

                  <div className="mt-2.5 text-center">
                    <span className="block font-bold text-xs text-foreground group-hover:text-accent transition-colors truncate max-w-[104px] tracking-wide uppercase">
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
        </section>
      )}

      {/* Call to Action Banner */}
      <section className="container mx-auto px-4 lg:px-8 py-12">
        <div className="rounded-3xl border bg-gradient-to-br from-card via-card to-accent/10 p-8 sm:p-12 text-center max-w-4xl mx-auto relative overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display">
              {isAr ? `جاهز لتطبيق منظومة ${solutionName} في منشأتك؟` : `Ready to Deploy ${solutionName}?`}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              {isAr
                ? "تواصل مع خبرائنا اليوم للحصول على دراسة فنية مخصصة وعرض سعر شامل ومخطط هندسي كامل."
                : "Connect with our certified solution architects for a tailored technical design, bill of quantities (BOQ), and turnkey quotation."}
            </p>
            <div className="pt-2">
              <Button size="lg" className="gap-2 shadow-lg" onClick={() => setDialogOpen(true)}>
                <Sparkles className="h-4 w-4" />
                <span>{isAr ? "اطلب عرض سعر مخصص الآن" : "Request Customized Proposal"}</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Other Solutions */}
      {otherSolutions.length > 0 && (
        <section className="container mx-auto px-4 lg:px-8 py-12 border-t">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold font-display">{isAr ? "استكشف حلولاً أخرى" : "Explore More Solutions"}</h3>
              <p className="text-xs text-muted-foreground">{isAr ? "منظومات وتقنيات متكاملة تناسب احتياجاتك" : "Other engineered architectures"}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/solutions">{isAr ? "عرض الكل" : "View All"}</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {otherSolutions.map((other) => (
              <Link
                key={other.id}
                to="/solutions/$slug"
                params={{ slug: other.slug }}
                className="group block rounded-xl border bg-card/60 overflow-hidden hover:border-accent transition-all shadow-xs"
              >
                <div className="h-36 w-full bg-muted overflow-hidden">
                  <img
                    src={other.image || "/placeholder.svg"}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 space-y-1.5">
                  <h4 className="font-semibold text-sm group-hover:text-accent transition-colors truncate">
                    {isAr ? other.name_ar || other.name_en : other.name_en}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {isAr ? other.bio_ar || other.bio_en : other.bio_en}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PROPOSAL DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span>{isAr ? "طلب عرض سعر ودراسة هندسية" : "Request Solution Proposal"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? `طلب دراسة فنية وعرض سعر لمنظومة: ${solutionName}`
                : `Tailored engineering proposal for: ${solutionName}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitProposal} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الاسم الكامل" : "Full Name"} *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={isAr ? "حافظ رحيم" : "Hafez Rahim"}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "البريد الإلكتروني" : "Work Email"} *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Hafez@company.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "رقم الهاتف" : "Phone Number"}</Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+201007419344"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "اسم الشركة / المنشأة" : "Company Name"}</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Acme Corp"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "تفاصيل المشروع أو المتطلبات" : "Project Requirements"}</Label>
              <Textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder={isAr ? "يرجى ذكر حجم المشروع، الموقع، أو أي مواصفات خاصة..." : "Mention scale, site location, timeline, or key technical specifications..."}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>{submitting ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الطلب" : "Submit Request")}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
