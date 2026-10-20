import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Eye,
  Target,
  Heart,
  Sparkles,
  ShieldCheck,
  Award,
  Linkedin,
  Rocket,
  FileText,
  CalendarCheck,
  Clock,
  Building2,
  Users2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Cpu,
  Globe2,
  Flame,
  Zap,
  Gem,
  HeartHandshake,
  Quote,
  BadgeCheck,
} from "lucide-react";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  useAboutContent,
  withCacheBust,
  pickBi,
  DEFAULT_ABOUT_STATS,
  type AboutStat,
} from "@/lib/about-store";
import { useSettings } from "@/lib/settings-store";
import { trackCta } from "@/lib/cta-tracking";

import teamKarim from "@/assets/team-karim.jpg";
import teamLayla from "@/assets/team-layla.jpg";
import teamOmar from "@/assets/team-omar.jpg";
import teamNadia from "@/assets/team-nadia.jpg";
import teamSamir from "@/assets/team-samir.jpg";
import teamDina from "@/assets/team-dina.jpg";
import logoImg from "@/assets/logo.png";
import artboard39Logo from "@/assets/artboard-39.svg";
import { AboutLogoWheel } from "@/components/site/AboutLogoWheel";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Integrated Technics" },
      {
        name: "description",
        content: "20+ years engineering mission-critical security, ICT, AV, and Tier-3 Data Center infrastructure for the region's largest enterprises.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { lang, t } = useI18n();
  const { content, hero, updatedAt } = useAboutContent();
  const { settings } = useSettings();
  const isAr = lang === "ar";
  const L = (b: { en: string; ar: string } | null | undefined, fallback = "") =>
    pickBi(b, isAr ? "ar" : "en", fallback);

  const shouldMirror = hero.mirror_rtl && isAr;
  const heroSrc = withCacheBust(hero.image_url, updatedAt);

  const statIcons: Record<string, any> = {
    Clock,
    Building2,
    ShieldCheck,
    Zap,
    TrendingUp,
    Award,
    Users2,
    Globe2,
  };

  const activeStats = content.stats && content.stats.length > 0 ? content.stats : DEFAULT_ABOUT_STATS;

  const teamImageByKey: Record<string, string> = {
    ceo: content.ownerImage || "https://integratedtechnics.com/wp-content/uploads/2026/05/fghjkm.webp",
    cto: teamLayla,
    operations: teamOmar,
    projects: teamNadia,
    security: teamSamir,
    ict: teamDina,
  };

  const departmentByKey: Record<string, { en: string; ar: string }> = {
    ceo: { en: "Executive Leadership", ar: "القيادة التنفيذية" },
    cto: { en: "Technology & Engineering", ar: "التقنية والهندسة" },
    operations: { en: "Operations & Delivery", ar: "العمليات والتنفيذ" },
    projects: { en: "Project Governance", ar: "حوكمة المشاريع" },
    security: { en: "Security Architecture", ar: "معمارية الأمن السيبراني" },
    ict: { en: "ICT Infrastructure", ar: "البنية التحتية للاتصالات" },
  };

  const valueIcons = [Heart, Sparkles, ShieldCheck, Cpu, Globe2, Flame];

  return (
    <div className="space-y-0">
      {/* 1. HERO SECTION WITH MODERN DYNAMIC BACKDROP */}
      <section className="relative min-h-[460px] lg:min-h-[520px] flex items-center justify-center overflow-hidden border-b gradient-surface">
        {heroSrc ? (
          <>
            <img
              src={heroSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                objectPosition: `${hero.focal_x}% ${hero.focal_y}%`,
                transform: `scale(${hero.zoom})${shouldMirror ? " scaleX(-1)" : ""}`,
                transformOrigin: `${hero.focal_x}% ${hero.focal_y}%`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60 backdrop-blur-[2px]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 grid-bg opacity-40" />
            <div className="absolute -top-40 start-1/4 h-96 w-96 rounded-full bg-accent/15 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-20 end-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[140px] pointer-events-none" />
          </>
        )}

        <div className="container mx-auto px-4 lg:px-8 pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24 relative z-10 text-center max-w-4xl">
          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight text-foreground leading-tight sm:leading-tight lg:leading-tight mb-5 animate-fade-in-up">
            {L(content.title, isAr ? "ريادة هندسية متكاملة للمؤسسات الكبرى" : "Pioneering Mission-Critical System Integration")}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 animate-fade-in-up">
            {L(
              content.sub,
              isAr
                ? "أكثر من عقدين من الخبرة في تصميم وتنفيذ البنية التحتية لمراكز البيانات والأنظمة الأمنية والشبكات وحلول القاعات الذكية."
                : "Over two decades architecting turnkey ICT, IP security, certified Tier-3 data centers, and unified AV environments across the MENA region."
            )}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 animate-fade-in-up">
            <Button asChild size="lg" className="shadow-lg shadow-accent/20 h-12 px-6 text-sm font-semibold">
              <Link to="/contact" onClick={() => trackCta("request_proposal")}>
                <FileText className="h-4 w-4 me-2" />
                {isAr ? "طلب استشارة هندسية" : "Request Engineering Consultation"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-sm bg-card/60 backdrop-blur-md">
              <Link to="/services">
                <span>{isAr ? "استكشف خدماتنا" : "Explore Solutions"}</span>
                <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. STATS & KEY METRICS COUNTER BAR */}
      <section className="relative -mt-10 z-20 container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 rounded-3xl border bg-card/95 backdrop-blur-xl shadow-xl">
          {activeStats.map((st: AboutStat, idx: number) => {
            const fallbackIcons = [Clock, Building2, ShieldCheck, Zap];
            const Icon = (st.iconName && statIcons[st.iconName]) || fallbackIcons[idx % fallbackIcons.length];
            return (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/40 hover:border-accent/40 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-2xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight group-hover:text-accent transition-colors">
                    {st.value}
                  </span>
                  <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-xs sm:text-sm text-foreground leading-snug">
                    {L(st.label)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {L(st.sub)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. WHO WE ARE / OVERVIEW WITH BRAND ELEVATION */}
      <Section id="overview" className="scroll-mt-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 space-y-5 text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
              <Building2 className="h-3.5 w-3.5" />
              <span>{isAr ? "من نحن وقصتنا" : "Who We Are & History"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-display text-foreground leading-snug">
              {L(content.overviewT, isAr ? "نبذة عن إنترجريتد تكنيكس" : "Architecting the Future of Enterprise Technology")}
            </h2>
            <div className="text-muted-foreground leading-relaxed text-sm sm:text-base space-y-4">
              <p>
                {L(
                  content.overviewD,
                  isAr
                    ? "تأسست شركة إنترجريتد تكنيكس لتكون الشريك الهندسي المعتمد للهيئات والمؤسسات الكبرى في تصميم وتنفيذ البنية التحتية التكنولوجية وحلول الأمن المتكاملة."
                    : "Integrated Technics stands as a premier regional technology engineering and systems integration firm, delivering certified turnkey infrastructure for high-demand enterprise environments."
                )}
              </p>
              <p>
                {isAr
                  ? "نعتمد على منهجية هندسية صارمة تضمن أعلى معايير الجودة والسلامة والجاهزية التشغيلية (99.9% Uptime) مع دعم فني متواصل 24/7."
                  : "We leverage vendor-agnostic interoperability, strict adherence to international standards (BICSI, TIA-942 Tier-3, ISO 27001), and a 24/7 proactive NOC support team."}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-foreground p-3 rounded-xl bg-muted/40 border">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{isAr ? "توريدات معتمدة من كبرى الشركات العالمية" : "Authorized Global Vendor Partner"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-foreground p-3 rounded-xl bg-muted/40 border">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{isAr ? "اتفاقيات صيانة SLA مضمونة خلال ساعتين" : "Guaranteed 2-Hour Emergency SLA"}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full max-w-md lg:max-w-xl aspect-square rounded-3xl border bg-card/95 backdrop-blur-md p-4 sm:p-6 pt-8 sm:pt-10 flex flex-col items-center justify-center shadow-2xl group">
              <div className="absolute inset-0 gradient-surface opacity-60 pointer-events-none" />
              <div className="absolute -top-20 -end-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
              <div className="absolute -bottom-20 -start-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
              
              <div className="relative z-10 w-full flex items-center justify-center">
                <AboutLogoWheel />
              </div>

              <div className="relative z-10 text-center mt-3 pt-3 border-t border-border/70 w-full">
                <div className="font-display font-bold text-base sm:text-lg text-foreground tracking-wide">Integrated Technics</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">{isAr ? "الأنظمة الهندسية المتكاملة" : "Certified Engineering Systems"}</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 4. STRATEGIC VISION, MISSION & VALUES TRIAD */}
      <Section className="bg-muted/20 border-y relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-96 bg-[#E8722C]/5 blur-[140px] pointer-events-none rounded-full" />

        <div className="text-center space-y-3 mb-14 max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8722C]/10 border border-[#E8722C]/30 text-[#E8722C] text-xs font-bold uppercase tracking-wider shadow-xs">
            <Rocket className="h-3.5 w-3.5 text-[#E8722C]" />
            <span>{isAr ? "بوصلتنا الاستراتيجية وقيمنا" : "Strategic Compass & Values"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-foreground">
            {isAr ? (
              <>
                الرؤية، الرسالة{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#E8722C] to-accent">
                  والقيم الجوهرية
                </span>
              </>
            ) : (
              <>
                Vision, Mission &{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#E8722C] to-accent">
                  Core Values
                </span>
              </>
            )}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? "الركائز الأساسية التي تقود استراتيجيتنا الهندسية، معايير الجودة الصارمة، والتزامنا الأخلاقي المستمر تجاه عملائنا."
              : "The foundational pillars that guide our engineering strategy, stringent quality standards, and ethical commitment to enterprise clients."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto relative z-10">
          {/* Card 1: Vision */}
          <div className="group rounded-3xl border-2 border-[#E8722C] bg-card p-7 sm:p-8 shadow-[0_4px_28px_rgba(232,114,44,0.12)] hover:shadow-[0_12px_44px_rgba(232,114,44,0.25)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between relative overflow-hidden">
            {/* Live animated border beam on hover */}
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden z-20">
              <span className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#E8722C_85%,transparent_100%)] opacity-80" />
            </div>

            <div className="absolute top-0 end-0 h-40 w-40 bg-[#E8722C]/15 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-[#E8722C]/10 text-[#E8722C] border border-[#E8722C]/30 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#E8722C] group-hover:text-white transition-all duration-300">
                  <Eye className="h-7 w-7" />
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-muted text-[#E8722C] border border-[#E8722C]/30">
                  01
                </span>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-[#E8722C]">
                {isAr ? "رؤيتنا المستقبلية" : "Our Vision"}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground group-hover:text-[#E8722C] transition-colors">
                {L(content.visionT, isAr ? "ريادة التكامل التكنولوجي بالشرق الأوسط" : "Leading Regional Innovation")}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {L(
                  content.visionD,
                  isAr
                    ? "أن نكون الخيار الأول والنموذج الأكثر موثوقية في الشرق الأوسط في تقديم حلول الأنظمة المتكاملة وتجهيز مراكز البيانات الذكية."
                    : "To be the region's most trusted partner for integrated technology systems that secure, connect and empower enterprises."
                )}
              </p>

              {/* Highlights */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#E8722C] shrink-0" />
                  <span>{isAr ? "ريادة إقليمية معتمدة" : "Regional Enterprise Leadership"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#E8722C] shrink-0" />
                  <span>{isAr ? "بنية تحتية ذكية للمستقبل" : "Future-Ready Smart Infrastructure"}</span>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-border/60 flex items-center gap-2 text-xs font-bold text-[#E8722C] relative z-10">
              <Sparkles className="h-4 w-4" />
              <span>{isAr ? "ابتكار مستمر وتطوير هندسي" : "Continuous Technological Evolution"}</span>
            </div>
          </div>

          {/* Card 2: Mission */}
          <div className="group rounded-3xl border-2 border-[#E8722C] bg-card p-7 sm:p-8 shadow-[0_4px_28px_rgba(232,114,44,0.12)] hover:shadow-[0_12px_44px_rgba(232,114,44,0.25)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between relative overflow-hidden">
            {/* Live animated border beam on hover */}
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden z-20">
              <span className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#E8722C_85%,transparent_100%)] opacity-80" />
            </div>

            <div className="absolute top-0 end-0 h-40 w-40 bg-primary/15 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-[#E8722C]/10 text-[#E8722C] border border-[#E8722C]/30 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#E8722C] group-hover:text-white transition-all duration-300">
                  <Target className="h-7 w-7" />
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-muted text-[#E8722C] border border-[#E8722C]/30">
                  02
                </span>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-[#E8722C]">
                {isAr ? "مهمتنا التشغيلية" : "Our Mission"}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground group-hover:text-[#E8722C] transition-colors">
                {L(content.missionT, isAr ? "تمكين المؤسسات بحلول مستدامة" : "Empowering Enterprise Operations")}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {L(
                  content.missionD,
                  isAr
                    ? "تسخير أحدث التقنيات العالمية والكوادر الهندسية المعتمدة لتقديم مشروعات متكاملة تلبي أعلى معايير الأمان والاستمرارية."
                    : "Deliver end-to-end engineered solutions with uncompromising quality, certified expertise, and lifelong client partnership."
                )}
              </p>

              {/* Highlights */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#E8722C] shrink-0" />
                  <span>{isAr ? "كوادر هندسية معتمدة دولياً" : "Certified Engineering Mastery"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#E8722C] shrink-0" />
                  <span>{isAr ? "دعم تشغيلي والتزام 24/7" : "24/7 Mission-Critical SLA"}</span>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-border/60 flex items-center gap-2 text-xs font-bold text-[#E8722C] relative z-10">
              <ShieldCheck className="h-4 w-4" />
              <span>{isAr ? "معايير أمان معتمدة وجودة قياسية" : "Stringent Quality & Reliability Standards"}</span>
            </div>
          </div>

          {/* Card 3: Values */}
          <div className="group rounded-3xl border-2 border-[#E8722C] bg-card p-7 sm:p-8 shadow-[0_4px_28px_rgba(232,114,44,0.12)] hover:shadow-[0_12px_44px_rgba(232,114,44,0.25)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between relative overflow-hidden">
            {/* Live animated border beam on hover */}
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden z-20">
              <span className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#E8722C_85%,transparent_100%)] opacity-80" />
            </div>

            <div className="absolute top-0 end-0 h-40 w-40 bg-amber-500/15 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-[#E8722C]/10 text-[#E8722C] border border-[#E8722C]/30 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#E8722C] group-hover:text-white transition-all duration-300">
                  <Gem className="h-7 w-7" />
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-muted text-[#E8722C] border border-[#E8722C]/30">
                  03
                </span>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-[#E8722C]">
                {isAr ? "قيمنا الجوهرية" : "Our Values"}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground group-hover:text-[#E8722C] transition-colors">
                {isAr ? "النزاهة، الدقة والشراكة" : "Integrity, Precision & Partnership"}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {isAr
                  ? "ترسيخ النزاهة الهندسية المطلقة، الدقة التقنية، الالتزام بأعلى معايير السلامة، وبناء شراكات وثيقة ومستدامة في كل مشروع."
                  : "Upholding uncompromising integrity, technical excellence, safety compliance, and lifelong client partnership in every deployment."}
              </p>

              {/* Highlights */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#E8722C] shrink-0" />
                  <span>{isAr ? "النزاهة والشفافية المهنية" : "Uncompromising Technical Integrity"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#E8722C] shrink-0" />
                  <span>{isAr ? "الابتكار الموجه لخدمة العميل" : "Client-Centric Innovation & Trust"}</span>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-border/60 flex items-center gap-2 text-xs font-bold text-[#E8722C] relative z-10">
              <HeartHandshake className="h-4 w-4" />
              <span>{isAr ? "ريادة أخلاقية والتزام هندسي أصيل" : "Ethical Leadership & Engineering Integrity"}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* 5. EXECUTIVE LEADERSHIP / FOUNDER SPOTLIGHT */}
      <Section id="leadership" className="scroll-mt-28">
        <div className="max-w-6xl mx-auto rounded-3xl border-2 border-[#E8722C] shadow-[0_8px_40px_rgba(232,114,44,0.16)] hover:shadow-[0_16px_56px_rgba(232,114,44,0.26)] transition-all duration-500 relative overflow-hidden bg-card p-8 sm:p-12 lg:p-14 group">
          {/* Live animated border beam on hover */}
          <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden z-20">
            <span className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#E8722C_85%,transparent_100%)] opacity-80" />
          </div>

          {/* Ambient background glows */}
          <div className="absolute -top-32 -end-32 h-96 w-96 rounded-full bg-[#E8722C]/15 blur-[130px] pointer-events-none" />
          <div className="absolute -bottom-32 -start-32 h-96 w-96 rounded-full bg-primary/15 blur-[130px] pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
            {/* Founder Portrait Column */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-[4/4.8] rounded-3xl overflow-hidden border-2 border-[#E8722C] shadow-2xl group/img bg-muted">
                <img
                  src={content.ownerImage || "https://integratedtechnics.com/wp-content/uploads/2026/05/fghjkm.webp"}
                  alt={L(content.ownerName, "Founder & CEO")}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-80" />

                {/* Floating Experience Milestone Badge */}
                <div className="absolute top-4 start-4 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-[#E8722C]/40 text-foreground text-xs font-bold shadow-md flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-[#E8722C]" />
                  <span>{isAr ? "+20 عاماً من الريادة" : "20+ Years Track Record"}</span>
                </div>

                {/* Bottom Founder Title Card */}
                <div className="absolute bottom-4 inset-x-4 p-4 rounded-2xl bg-background/95 backdrop-blur-md border border-[#E8722C]/40 shadow-xl text-center">
                  <div className="font-bold text-base sm:text-lg text-foreground flex items-center justify-center gap-1.5">
                    <span>{L(content.ownerName, "Founder & CEO")}</span>
                    <BadgeCheck className="h-4 w-4 text-[#E8722C] shrink-0" />
                  </div>
                  <div className="text-xs text-[#E8722C] font-semibold mt-0.5 tracking-wide">
                    {L(content.ownerRole, "Founder & Managing Director")}
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Message Column */}
            <div className="lg:col-span-7 space-y-6 text-start">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8722C]/10 border border-[#E8722C]/30 text-[#E8722C] text-xs font-bold uppercase tracking-wider shadow-xs">
                <Award className="h-3.5 w-3.5 text-[#E8722C]" />
                <span>{L(content.ownerEyebrow, isAr ? "كلمة الإدارة التنفيذية" : "Executive Leadership")}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground leading-tight">
                {L(content.ownerTitle, isAr ? "الالتزام بالتميز الهندسي والنزاهة المؤسسية" : "Engineering Integrity & Lasting Value")}
              </h2>

              <div className="relative p-5 rounded-2xl bg-muted/40 border border-border/70">
                <Quote className="h-8 w-8 text-[#E8722C]/30 absolute top-3 end-4 pointer-events-none" />
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base relative z-10 italic">
                  "{L(
                    content.ownerBio,
                    isAr
                      ? "نفخر بمسيرتنا التي تمتد لأكثر من 20 عاماً في خدمة كبرى المشروعات القومية والتجارية، واضعين معايير الجودة ورضا العملاء في صدارة أولوياتنا."
                      : "For more than 20 years, our foundational philosophy has remained unchanged: delivering robust, future-proof engineering integration that empowers corporate growth."
                  )}"
                </p>
              </div>

              {/* 3 Executive Pillars */}
              <div className="grid sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center gap-2.5 shadow-xs">
                  <CheckCircle2 className="h-4 w-4 text-[#E8722C] shrink-0" />
                  <span className="text-xs font-semibold text-foreground leading-tight">
                    {isAr ? "معايير أمان معتمدة" : "Zero-Defect QA"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center gap-2.5 shadow-xs">
                  <CheckCircle2 className="h-4 w-4 text-[#E8722C] shrink-0" />
                  <span className="text-xs font-semibold text-foreground leading-tight">
                    {isAr ? "إشراف تنفيذي مباشر" : "Direct Oversight"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center gap-2.5 shadow-xs">
                  <CheckCircle2 className="h-4 w-4 text-[#E8722C] shrink-0" />
                  <span className="text-xs font-semibold text-foreground leading-tight">
                    {isAr ? "شراكات OEM كبرى" : "Tier-1 OEM Alliances"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Button asChild size="default" className="bg-[#E8722C] hover:bg-[#d0621f] text-white font-bold shadow-lg shadow-[#E8722C]/25 px-6">
                  <Link to="/contact">
                    <CalendarCheck className="h-4 w-4 me-2" />
                    {isAr ? "حجز استشارة تنفيذية" : "Schedule Executive Consultation"}
                  </Link>
                </Button>
                {settings.social?.linkedin && (
                  <Button asChild size="default" variant="outline" className="border-[#E8722C]/40 hover:border-[#E8722C] hover:bg-[#E8722C]/10 text-foreground font-semibold">
                    <a href={settings.social.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4 me-2 text-[#E8722C]" />
                      <span>{isAr ? "حساب LinkedIn الرسمي" : "Connect on LinkedIn"}</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 6. CORE VALUES */}
      <Section id="values" className="bg-muted/30 border-y scroll-mt-28 relative overflow-hidden">
        <div className="text-center space-y-3 mb-14 max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8722C]/10 border border-[#E8722C]/30 text-[#E8722C] text-xs font-bold uppercase tracking-wider shadow-xs">
            <Heart className="h-3.5 w-3.5 text-[#E8722C]" />
            <span>{isAr ? "ركائزنا ومبادئنا الراسخة" : "Uncompromising Principles"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-foreground">
            {L(content.valuesT, isAr ? "القيم الجوهرية التي تحكم عملنا" : "The Core Values Driving Our Engineering")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? "ستة معايير لا مساومة عليها تحكم كل تمديد كابل، تجهيز غرفة عمليات، وشراكة نبنيها مع كبرى المؤسسات."
              : "Six immutable principles that govern every cable run, command center configuration, and client relationship."}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto relative z-10">
          {content.values.map((v, idx) => {
            const Icon = valueIcons[idx % valueIcons.length] ?? Heart;
            return (
              <div
                key={idx}
                className="group p-7 sm:p-8 rounded-3xl border-2 border-[#E8722C] bg-card shadow-[0_4px_24px_rgba(232,114,44,0.12)] hover:shadow-[0_12px_40px_rgba(232,114,44,0.22)] transition-all duration-300 hover:-translate-y-1.5 text-start flex flex-col justify-between relative overflow-hidden"
              >
                {/* Live animated border beam on hover */}
                <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden z-20">
                  <span className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#E8722C_85%,transparent_100%)] opacity-80" />
                </div>

                <div className="absolute top-0 end-0 h-32 w-32 bg-[#E8722C]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="h-13 w-13 rounded-2xl bg-[#E8722C]/10 text-[#E8722C] border border-[#E8722C]/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#E8722C] group-hover:text-white transition-all duration-300 shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-muted text-[#E8722C] border border-[#E8722C]/30">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-foreground group-hover:text-[#E8722C] transition-colors">
                    {L(v.title)}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {L(v.desc)}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-1.5 text-xs font-bold text-[#E8722C] relative z-10">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isAr ? "معيار تشغيلي صارم" : "Strict Operational Standard"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 7. CERTIFICATIONS & ACCREDITATIONS */}
      <Section id="certifications" className="scroll-mt-28">
        <div className="text-center space-y-3 mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Award className="h-3.5 w-3.5" />
            <span>{isAr ? "الاعتمادات والمعايير" : "Quality Certifications"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {L(content.certificationsT, isAr ? "الشهادات والاعتمادات الدولية" : "Certified Standards & Compliance")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {L(content.certificationsSub, isAr ? "نلتزم بأعلى معايير السلامة والجودة العالمية" : "Engineered in accordance with rigorous global standards")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {content.certifications.map((c, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border bg-card hover:border-emerald-500/50 transition-all flex items-center gap-3 shadow-xs"
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="font-semibold text-xs sm:text-sm text-foreground truncate">{c}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 8. EXECUTIVE TEAM SECTION */}
      <Section className="bg-muted/20 border-t relative overflow-hidden" center>
        <div className="text-center space-y-3 mb-14 max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8722C]/10 border border-[#E8722C]/30 text-[#E8722C] text-xs font-bold uppercase tracking-wider shadow-xs">
            <Users2 className="h-3.5 w-3.5 text-[#E8722C]" />
            <span>{isAr ? "قادة الهندسة والتنفيذ" : "Engineering Leadership"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-foreground">
            {L(content.teamTitle, isAr ? "فريق القيادة والهندسة المعتمد" : "Leadership & Engineering Team")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {L(
              content.teamSub,
              isAr
                ? "مهندسون معتمدون وقادة مشاريع ومستشارون يحولون التعقيد إلى نتائج موثوقة لأكثر من 500 مشروع قومي وخاص."
                : "Certified systems architects, project leaders and engineering directors transforming complexity into reliable turnkey outcomes."
            )}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto relative z-10">
          {content.team.map((m) => {
            const dept = m.department ? m.department : (departmentByKey[m.key] ?? { en: "Leadership", ar: "القيادة" });
            const memberImg = m.image || teamImageByKey[m.key] || teamKarim;
            return (
              <div
                key={m.key}
                className="group relative rounded-3xl border-2 border-[#E8722C] bg-card overflow-hidden shadow-[0_4px_24px_rgba(232,114,44,0.12)] hover:shadow-[0_12px_44px_rgba(232,114,44,0.24)] transition-all duration-500 hover:-translate-y-2 flex flex-col text-start"
              >
                {/* Live animated border beam on hover */}
                <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden z-20">
                  <span className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#E8722C_85%,transparent_100%)] opacity-80" />
                </div>

                {/* Image Container */}
                <div className="relative aspect-[4/4.5] w-[calc(100%-1.25rem)] mx-auto mt-2.5 overflow-hidden rounded-2xl bg-muted/40">
                  <img
                    src={memberImg}
                    alt={L(m.name)}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-50 group-hover:opacity-30 transition-opacity duration-500" />

                  {/* Floating Department Badge */}
                  <div className="absolute top-3 start-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-background/90 backdrop-blur-md border border-[#E8722C]/40 text-foreground shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E8722C] animate-pulse" />
                      {L(dept)}
                    </span>
                  </div>

                  {/* Floating LinkedIn */}
                  {settings.social?.linkedin && (
                    <div className="absolute bottom-3 end-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                      <a
                        href={settings.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`LinkedIn - ${L(m.name)}`}
                        className="h-10 w-10 rounded-full bg-[#E8722C] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Card Content Details */}
                <div className="p-6 text-start flex-1 flex flex-col justify-between relative z-10">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-xl font-bold text-foreground group-hover:text-[#E8722C] transition-colors duration-300">
                        {L(m.name)}
                      </h3>
                      <BadgeCheck className="h-4 w-4 text-[#E8722C] shrink-0" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground mt-1">
                      {L(m.role)}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 text-[#E8722C] font-semibold">
                      <Award className="h-3.5 w-3.5" />
                      <span>{isAr ? "معتمد وموثق" : "Certified Lead"}</span>
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider font-bold opacity-60">
                      INT-{m.key.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
      {/* 9. BOTTOM MASTER CALL-TO-ACTION */}
      <section aria-label={isAr ? "دعوة للتواصل" : "Call to action"} className="py-16 md:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border gradient-hero text-primary-foreground p-8 md:p-14 shadow-2xl">
            <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
              <div className="space-y-2">
                <h3 className="font-display text-2xl md:text-4xl font-bold tracking-tight">
                  {isAr ? "جاهز لبدء مشروعك الهندسي القادم؟" : "Ready to Engineer Your Next Turnkey Facility?"}
                </h3>
                <p className="text-primary-foreground/85 text-sm md:text-base max-w-2xl leading-relaxed">
                  {isAr
                    ? "تواصل مع كبار مهندسينا للحصول على دراسة جدوى مجانية وعرض فني ومالي مفصل خلال 24-48 ساعة."
                    : "Connect with our certified systems architects for an on-site technical assessment and formal proposal delivered within 24-48 hours."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary" className="shadow-lg h-12 px-6 font-semibold">
                  <Link to="/contact" onClick={() => trackCta("request_proposal")}>
                    <FileText className="h-4 w-4 me-2" />
                    {isAr ? "طلب عرض سعر" : "Request Proposal"}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 font-semibold bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                >
                  <Link to="/contact" onClick={() => trackCta("book_consultation")}>
                    <CalendarCheck className="h-4 w-4 me-2" />
                    {isAr ? "حجز استشارة مباشرة" : "Book Consultation"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
