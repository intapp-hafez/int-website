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
import { FaqSection } from "@/components/site/FaqSection";

import teamKarim from "@/assets/team-karim.jpg";
import teamLayla from "@/assets/team-layla.jpg";
import teamOmar from "@/assets/team-omar.jpg";
import teamNadia from "@/assets/team-nadia.jpg";
import teamSamir from "@/assets/team-samir.jpg";
import teamDina from "@/assets/team-dina.jpg";
import logoImg from "@/assets/logo.png";
import artboard39Logo from "@/assets/artboard-39.svg";
import { InteractiveHeroWheel } from "@/components/site/InteractiveHeroWheel";

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
            <div className="relative w-full max-w-md lg:max-w-xl aspect-square rounded-3xl border bg-card/95 backdrop-blur-md p-4 sm:p-6 flex flex-col items-center justify-center shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 gradient-surface opacity-60 pointer-events-none" />
              <div className="absolute -top-20 -end-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
              <div className="absolute -bottom-20 -start-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
              
              <div className="relative z-10 w-full flex items-center justify-center">
                <InteractiveHeroWheel />
              </div>

              <div className="relative z-10 text-center mt-3 pt-3 border-t border-border/70 w-full">
                <div className="font-display font-bold text-base sm:text-lg text-foreground tracking-wide">Integrated Technics</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">{isAr ? "الأنظمة الهندسية المتكاملة" : "Certified Engineering Systems"}</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 4. STRATEGIC VISION & MISSION DUAL CARDS */}
      <Section className="bg-muted/20 border-y">
        <div className="text-center space-y-3 mb-12 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
            <Rocket className="h-3.5 w-3.5" />
            <span>{isAr ? "بوصلتنا الاستراتيجية" : "Strategic Compass"}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-foreground">
            {isAr ? "الرؤية والرسالة الهندسية" : "Vision & Mission for the Next Era"}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Vision Card */}
          <div className="group rounded-3xl border border-border/80 bg-card p-8 shadow-sm hover:shadow-xl hover:border-accent/50 transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 end-0 h-32 w-32 bg-accent/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <div className="space-y-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shadow-xs">
                <Eye className="h-7 w-7" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-accent">
                {isAr ? "رؤيتنا المستقبلية" : "Our Vision"}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                {L(content.visionT, isAr ? "ريادة التكامل التكنولوجي بالشرق الأوسط" : "Leading Regional Innovation")}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {L(
                  content.visionD,
                  isAr
                    ? "أن نكون الخيار الأول والنموذج الأكثر موثوقية في الشرق الأوسط في تقديم حلول الأنظمة المتكاملة وتجهيز مراكز البيانات الذكية."
                    : "To be the foremost and most trusted systems integrator in the MENA region, recognized for engineering precision, unyielding reliability, and turnkey innovation."
                )}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t flex items-center gap-2 text-xs font-medium text-accent">
              <Sparkles className="h-4 w-4" />
              <span>{isAr ? "ابتكار مستمر وتطوير هندسي" : "Continuous Technological Evolution"}</span>
            </div>
          </div>

          {/* Mission Card */}
          <div className="group rounded-3xl border border-border/80 bg-card p-8 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 end-0 h-32 w-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <div className="space-y-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <Target className="h-7 w-7" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                {isAr ? "مهمتنا اليومية" : "Our Mission"}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                {L(content.missionT, isAr ? "تمكين المؤسسات بحلول مستدامة" : "Empowering Enterprise Operations")}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {L(
                  content.missionD,
                  isAr
                    ? "تسخير أحدث التقنيات العالمية والكوادر الهندسية المعتمدة لتقديم مشروعات متكاملة تلبي أعلى معايير الأمان والاستمرارية."
                    : "Delivering world-class turnkey engineering solutions that ensure uncompromising security, resilience, and operational efficiency for critical infrastructure."
                )}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t flex items-center gap-2 text-xs font-medium text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>{isAr ? "معايير أمان معتمدة وجودة قياسية" : "Stringent Quality & Reliability Standards"}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* 5. EXECUTIVE LEADERSHIP / FOUNDER SPOTLIGHT */}
      <Section id="leadership" className="scroll-mt-28">
        <div className="max-w-5xl mx-auto rounded-3xl border bg-gradient-to-br from-card via-card to-muted/40 p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-xs aspect-square rounded-2xl overflow-hidden border-2 border-accent/30 shadow-2xl group">
                <img
                  src={content.ownerImage || "https://integratedtechnics.com/wp-content/uploads/2026/05/fghjkm.webp"}
                  alt={L(content.ownerName, "Founder & CEO")}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-3 start-3 end-3 p-2.5 rounded-xl bg-background/90 backdrop-blur-md border text-center">
                  <div className="font-bold text-xs text-foreground">{L(content.ownerName, "Founder & CEO")}</div>
                  <div className="text-[10px] text-accent font-medium">{L(content.ownerRole, "Executive Management")}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4 text-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                <Award className="h-3.5 w-3.5" />
                <span>{L(content.ownerEyebrow, isAr ? "كلمة الإدارة التنفيذية" : "Executive Message")}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                {L(content.ownerTitle, isAr ? "الالتزام بالتميز الهندسي" : "Leading with Engineering Integrity")}
              </h2>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {L(
                  content.ownerBio,
                  isAr
                    ? "نفخر بمسيرتنا التي تمتد لأكثر من 20 عاماً في خدمة كبرى المشروعات القومية والتجارية، واضعين معايير الجودة ورضا العملاء في صدارة أولوياتنا."
                    : "For more than 20 years, our foundational philosophy has remained unchanged: delivering robust, future-proof engineering integration that empowers corporate growth."
                )}
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Button asChild size="sm">
                  <Link to="/contact">
                    <CalendarCheck className="h-3.5 w-3.5 me-1.5" />
                    {isAr ? "حجز اجتماع مع القيادة" : "Schedule Executive Meeting"}
                  </Link>
                </Button>
                {settings.social?.linkedin && (
                  <Button asChild size="sm" variant="outline">
                    <a href={settings.social.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-3.5 w-3.5 me-1.5 text-accent" />
                      <span>{isAr ? "حساب LinkedIn الرسمي" : "Connect on LinkedIn"}</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 6. CORE VALUES (MODERN GLASS CARDS) */}
      <Section id="values" className="bg-muted/30 border-y scroll-mt-28">
        <div className="text-center space-y-3 mb-12 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
            <Heart className="h-3.5 w-3.5" />
            <span>{isAr ? "ركائزنا ومبادئنا" : "Core Values"}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-foreground">
            {L(content.valuesT, isAr ? "القيم التي تحكم عملنا" : "The Values That Drive Us")}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {content.values.map((v, idx) => {
            const Icon = valueIcons[idx % valueIcons.length] ?? Heart;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl border bg-card hover:border-accent/50 hover:shadow-lg transition-all text-start flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                    {L(v.title)}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {L(v.desc)}
                  </p>
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
      <Section className="bg-muted/20 border-t" title={L(content.teamTitle, isAr ? "فريق القيادة والهندسة" : "Leadership & Engineering Team")} center>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {content.team.map((m) => {
            const dept = m.department ? m.department : (departmentByKey[m.key] ?? { en: "Leadership", ar: "القيادة" });
            const memberImg = m.image || teamImageByKey[m.key] || teamKarim;
            return (
              <div
                key={m.key}
                className="group relative rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card to-card/90 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-accent/10 hover:border-accent/50 transition-all duration-500 hover:-translate-y-2 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/4.5] w-[calc(100%-1.25rem)] mx-auto mt-2.5 overflow-hidden rounded-2xl bg-muted/30">
                  <img
                    src={memberImg}
                    alt={L(m.name)}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-500" />

                  {/* Floating Department Badge */}
                  <div className="absolute top-3 start-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-background/85 backdrop-blur-md border border-white/20 text-foreground shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                      {L(dept)}
                    </span>
                  </div>

                  {/* Floating LinkedIn */}
                  {settings.social?.linkedin && (
                    <div className="absolute bottom-3 end-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <a
                        href={settings.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`LinkedIn - ${L(m.name)}`}
                        className="h-9 w-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Card Content Details */}
                <div className="p-6 text-start flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">
                        {L(m.name)}
                      </h3>
                      <ShieldCheck className="h-4 w-4 text-accent/80 shrink-0" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      {L(m.role)}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 text-accent/90 font-medium">
                      <Award className="h-3.5 w-3.5" />
                      <span>{isAr ? "معتمد وموثق" : "Certified Executive"}</span>
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider opacity-60">
                      INT-{m.key.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 9. DYNAMIC FAQS SECTION WITH PAGINATION AFTER 15 */}
      <FaqSection className="border-t bg-muted/10" pageSize={15} />

      {/* 10. BOTTOM MASTER CALL-TO-ACTION */}
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
