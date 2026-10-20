import { createFileRoute, Link } from "@tanstack/react-router";
import { usePartners } from "@/lib/partners-store";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Award,
  Sparkles,
  Headphones,
  CheckCircle2,
  ArrowRight,
  Layers,
  Wrench,
  Clock,
  Building2,
} from "lucide-react";
import { SmartLogo } from "@/components/ui/smart-logo";
import DOMPurify from "dompurify";

export const Route = createFileRoute("/partners_/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Partner Overview — Integrated Technics` },
      { name: "description", content: "Certified technology partnership, architecture integration, and enterprise engineering." },
    ],
  }),
  component: PartnerDetailsPage,
});

function PartnerDetailsPage() {
  const { id } = Route.useParams();
  const { partners, loading } = usePartners();
  const { t, lang, dir } = useI18n();
  const isAr = lang === "ar";

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">{isAr ? "جاري تحميل بيانات الشريك..." : "Loading partner profile..."}</p>
      </div>
    );
  }

  // Find partner by id, fallback slug, or normalized name
  const partner = partners.find(
    (p) =>
      p.id === id ||
      p.id === `default-${id}` ||
      (p.name_en || "").toLowerCase().replace(/[^a-z0-9]+/g, "-") === id.toLowerCase()
  );

  if (!partner) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-2">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          {isAr ? "لم يتم العثور على الشريك" : "Partner Profile Not Found"}
        </h1>
        <p className="text-muted-foreground max-w-md text-sm">
          {isAr
            ? "عذراً، الشريك المطلوب غير متوفر حالياً أو تم نقل الرابط."
            : "The partner technology profile you are looking for is currently unavailable or has been relocated."}
        </p>
        <Button asChild className="bg-accent hover:bg-accent/90 text-white mt-2">
          <Link to="/partners">
            {isAr ? <ChevronRight className="h-4 w-4 ms-2" /> : <ChevronLeft className="h-4 w-4 me-2" />}
            {isAr ? "العودة إلى دليل الشركاء" : "Back to Technology Partners"}
          </Link>
        </Button>
      </div>
    );
  }

  const displayName = (isAr ? partner.name_ar : partner.name_en) || partner.name_en || partner.name_ar;
  const description = isAr ? partner.description_ar : partner.description_en;

  // Other featured partners for sidebar recommendation
  const otherPartners = partners
    .filter((p) => p.id !== partner.id && p.active)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-20" dir={dir}>
      {/* Top Breadcrumb & Hero Area */}
      <div className="relative gradient-surface border-b border-border/40 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className={`absolute ${isAr ? "-left-40" : "-right-40"} -top-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl`} />

        <div className="container mx-auto px-4 lg:px-8 pt-8 pb-14 relative z-10">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link to="/" className="hover:text-accent transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <span className="text-border">/</span>
            <Link to="/partners" className="hover:text-accent transition-colors">
              {isAr ? "الشركاء" : "Partners"}
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground font-semibold truncate max-w-[200px]">{displayName}</span>
          </nav>

          {/* Hero Card with Solid Orange Frame & Hover Beam */}
          <div className="relative rounded-2xl p-[2px] bg-accent shadow-xl shadow-accent/10 overflow-hidden group/hero">
            {/* Live Animated Border Beam on hover */}
            <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_200deg,rgba(255,255,255,0.95)_300deg,#FFA066_335deg,var(--electric)_360deg)] opacity-0 group-hover/hero:opacity-100 group-hover/hero:animate-border-beam transition-opacity duration-300 pointer-events-none" />

            {/* Inner Content */}
            <div className="relative z-10 w-full h-full rounded-[14px] bg-card p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left Side: Brand Logo Well + Information */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-start gap-6 w-full lg:w-auto">
                {/* Logo Canvas: Clean borderless well */}
                <div className="w-36 h-28 sm:w-44 sm:h-32 shrink-0 rounded-2xl bg-white dark:bg-white/5 shadow-md border border-border/40 p-4 flex items-center justify-center">
                  <SmartLogo
                    src={partner.logo}
                    alt={displayName}
                    name={displayName}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Vendor Metadata */}
                <div className="flex flex-col items-center sm:items-start">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                      <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                      <span>
                        {partner.featured
                          ? (isAr ? "شريك تكنولوجي استراتيجي" : "Strategic Technology Partner")
                          : (isAr ? "شريك معتمد وموزع رسمي" : "Certified Integration Partner")}
                      </span>
                    </span>

                    {partner.featured && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold">
                        <Sparkles className="h-3 w-3 fill-amber-400" />
                        <span>{isAr ? "الفئة الأولى (Tier-1)" : "Tier-1 Vendor"}</span>
                      </span>
                    )}
                  </div>

                  <h1 className={`text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-2 ${isAr ? "font-arabic" : ""}`}>
                    {displayName}
                  </h1>

                  <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                    {isAr
                      ? "شراكة استراتيجية لتوريد وتركيب ودعم أحدث الحلول والأنظمة المتطورة بأعلى معايير الجودة والضمان المعتمد."
                      : "Official strategic partnership delivering enterprise hardware provisioning, solution design, and mission-critical 24/7 technical support."}
                  </p>
                </div>
              </div>

              {/* Right Side: Quick Action CTAs */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-64 shrink-0">
                <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-white gap-2 shadow-lg shadow-accent/20">
                  <Link to="/contact">
                    <span>{isAr ? "طلب دراسة مشروع" : "Request Proposal"}</span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>

                {partner.href && (
                  <Button asChild variant="outline" size="lg" className="w-full border-border/80 hover:border-accent hover:text-accent gap-2">
                    <a href={partner.href} target="_blank" rel="noreferrer">
                      <span>{isAr ? "الموقع الرسمي للمصنع" : "Vendor Portal"}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body: 2-Column Content Layout */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Main Article Content (8 Cols) */}
          <main className="lg:col-span-8 space-y-8">
            {/* Rich Content Article */}
            <article className="rounded-3xl border border-border/70 bg-card p-6 sm:p-10 md:p-12 shadow-sm">
              <div className="flex items-center gap-2 pb-4 mb-8 border-b border-border/50 text-xs font-semibold text-accent uppercase tracking-wider">
                <Award className="h-4 w-4" />
                <span>{isAr ? "نطاق الشراكة والحلول المتكاملة" : "Partnership Scope & Technology Domain"}</span>
              </div>

              {description ? (
                <div
                  className={`partner-rich-text ${isAr ? "font-arabic text-right" : "text-left"}`}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
                />
              ) : (
                <div className="py-12 text-center text-muted-foreground italic">
                  {isAr
                    ? "يجري حالياً تحديث الملف الفني والمواصفات الهندسية الخاصة بهذا الشريك."
                    : "The engineering specification sheet and integration catalog for this partner are currently being refreshed."}
                </div>
              )}
            </article>

            {/* Certified Capabilities Banner */}
            <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8">
              <h3 className="text-lg font-display font-bold text-foreground mb-6 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <span>{isAr ? "قدراتنا الهندسية المعتمدة مع هذا الشريك" : "Our Certified Engineering Capabilities"}</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{isAr ? "تصميم الحلول والأنظمة" : "Solution Architecture"}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isAr ? "تصميم متكامل للمخططات الهندسية ومطابقتها للمتطلبات والمعايير." : "End-to-end infrastructure sizing and architectural blueprint validation."}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{isAr ? "التوريد والتركيب المباشر" : "Certified Deployment"}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isAr ? "توريد الأجهزة الأصلية مع إشراف مهندسين معتمدين وضمان الوكيل." : "Factory-original hardware delivery with certified deployment engineers."}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{isAr ? "عقود الصيانة وSLA" : "24/7 SLA & Maintenance"}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isAr ? "اتفاقيات مستوى خدمة صارمة لضمان استمرارية التشغيل وحل الأعطال." : "Mission-critical response times, spare parts inventory, and SLA coverage."}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Headphones className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{isAr ? "الدعم الفني المحلي" : "Local Tier-3 Support"}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isAr ? "فريق عمل محلي متخصص ومتاح فوراً لتقديم الاستشارات والدعم الميداني." : "On-site and remote engineering support tailored for enterprise operations."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Proposal CTA */}
            <div className="relative rounded-3xl overflow-hidden gradient-hero p-8 sm:p-10 text-white">
              <div className="absolute inset-0 grid-bg opacity-20" />
              <div className="relative z-10 max-w-xl">
                <h3 className="text-2xl sm:text-3xl font-display font-bold mb-3">
                  {isAr ? `هل تخطط لمشروع يعتمد على ${displayName}؟` : `Planning an infrastructure rollout with ${displayName}?`}
                </h3>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                  {isAr
                    ? "تواصل مع خبرائنا المعتمدين لمناقشة المتطلبات الفنية والحصول على دراسة هندسية وعرض أسعار مخصص لمشروعك."
                    : "Speak with our certified solutions engineers to review technical blueprints, calculate sizing, and receive an enterprise quotation."}
                </p>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2">
                  <Link to="/contact">
                    <span>{isAr ? "تواصل مع مهندس الحلول" : "Speak to a Solution Architect"}</span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            </div>
          </main>

          {/* Sticky Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            {/* Quick Specs Card */}
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50 text-xs font-bold text-accent uppercase tracking-wider">
                <Building2 className="h-4 w-4" />
                <span>{isAr ? "بيانات الشراكة" : "Partnership Overview"}</span>
              </div>

              <dl className="space-y-4 text-xs">
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">{isAr ? "اسم الشريك" : "Vendor Brand"}</dt>
                  <dd className="text-foreground font-bold text-sm">{displayName}</dd>
                </div>

                <div>
                  <dt className="text-muted-foreground font-medium mb-1">{isAr ? "مستوى الاعتماد" : "Partnership Tier"}</dt>
                  <dd className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{partner.featured ? (isAr ? "شريك استراتيجي رئيسي" : "Strategic Alliance") : (isAr ? "شريك معتمد" : "Authorized Partner")}</span>
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground font-medium mb-1">{isAr ? "التغطية الجغرافية" : "Territory Coverage"}</dt>
                  <dd className="text-foreground font-semibold">{isAr ? "مصر والشرق الأوسط وأفريقيا" : "Egypt & Middle East"}</dd>
                </div>

                <div>
                  <dt className="text-muted-foreground font-medium mb-1">{isAr ? "مستوى الدعم الفني" : "Support SLA Level"}</dt>
                  <dd className="text-foreground font-semibold">{isAr ? "مستوى 3 (Tier-3) على مدار الساعة" : "24/7/365 Tier-3 SLA"}</dd>
                </div>

                {partner.href && (
                  <div className="pt-2">
                    <a
                      href={partner.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-accent font-semibold hover:underline"
                    >
                      <span>{isAr ? "زيارة بوابة الشريك العالمية" : "Visit Official Global Website"}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </dl>
            </div>

            {/* Quick Contact Card */}
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm text-center">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3">
                <Headphones className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-1">{isAr ? "استشارة فنية متخصصة" : "Dedicated Consultation"}</h4>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {isAr
                  ? "هل تحتاج للمساعدة في اختيار المعدات والبرمجيات الأنسب لمؤسستك؟"
                  : "Need guidance on product selection, licensing, or infrastructure architecture?"}
              </p>
              <Button asChild variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-white">
                <Link to="/contact">{isAr ? "طلب استشارة هندسية" : "Schedule a Tech Call"}</Link>
              </Button>
            </div>

            {/* Other Strategic Partners */}
            {otherPartners.length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 pb-2 border-b border-border/50">
                  {isAr ? "شركاء استراتيجيون آخرون" : "Other Strategic Alliances"}
                </h4>

                <div className="space-y-3">
                  {otherPartners.map((item) => {
                    const name = (isAr ? item.name_ar : item.name_en) || item.name_en;
                    return (
                      <Link
                        key={item.id}
                        to="/partners/$id"
                        params={{ id: item.id }}
                        className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/5 border border-transparent hover:border-accent/30 transition-all"
                      >
                        <div className="h-10 w-14 rounded-lg bg-white dark:bg-white/5 border border-border/40 p-1 flex items-center justify-center shrink-0">
                          <SmartLogo src={item.logo} alt={name} name={name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-foreground group-hover:text-accent transition-colors truncate">
                            {name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {item.featured ? (isAr ? "شريك استراتيجي" : "Strategic Partner") : (isAr ? "شريك معتمد" : "Authorized Partner")}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-all shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Scoped CSS for Rich Text formatting */}
      <style>{`
        .partner-rich-text h2 {
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--color-foreground);
          margin-top: 2.25rem;
          margin-bottom: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          letter-spacing: -0.015em;
        }
        .partner-rich-text h2:first-child {
          margin-top: 0;
        }
        .partner-rich-text p {
          font-size: 1rem;
          color: var(--color-muted-foreground);
          line-height: 1.85;
          margin-bottom: 1.25rem;
        }
        .partner-rich-text strong {
          color: var(--color-foreground);
          font-weight: 600;
        }
        .partner-rich-text ul {
          list-style-type: disc;
          padding-inline-start: 1.5rem;
          margin-bottom: 1.5rem;
          color: var(--color-muted-foreground);
          line-height: 1.8;
        }
        .partner-rich-text li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}
