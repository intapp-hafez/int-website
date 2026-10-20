import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, CheckCircle2, Shield, Users, Award, Clock, Star, Quote, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartLogo } from "@/components/ui/smart-logo";
import { Section } from "@/components/site/Section";
import { StatCounter } from "@/components/site/Stat";
import { useI18n } from "@/lib/i18n";
import { services, industries, projects } from "@/data/site";
import { useSettings } from "@/lib/settings-store";
import { usePartners } from "@/lib/partners-store";
import { Skeleton } from "@/components/ui/skeleton";

import { useSlides } from "@/lib/slides-store";
import { useIndustries } from "@/lib/industries-store";
import { useProjects } from "@/lib/projects-store";
import { useServices, getServiceIcon } from "@/lib/services-store";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { CarouselDots } from "@/components/ui/carousel-dots";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState, useEffect } from "react";
import { useCarouselAutoplay } from "@/hooks/use-carousel-autoplay";
import { FeaturedProducts } from "@/components/site/FeaturedProducts";
import { LatestNews } from "@/components/site/LatestNews";
import { InteractiveHeroWheel } from "@/components/site/InteractiveHeroWheel";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Integrated Technics — Enterprise System Integrator" },
      { name: "description", content: "Turnkey security, ICT, AV and data center integration delivered end-to-end by certified engineers." },
      { property: "og:title", content: "Integrated Technics — Enterprise System Integrator" },
      { property: "og:description", content: "Turnkey security, ICT, AV and data center integration delivered end-to-end by certified engineers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Integrated Technics", description: "Enterprise security, ICT, AV and data center system integrator." }) },
      { type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "Integrated Technics" }) },
    ],
  }),
  component: Home,
});

const whyIcons = [Shield, Award, Clock, Users];

function TestimonialsSection() {
  const { lang } = useI18n();
  const { settings } = useSettings();
  const [dbReviews, setDbReviews] = useState<any[]>([]);

  useEffect(() => {
    const loadApprovedReviews = async () => {
      try {
        const { data } = await supabase
          .from("reviews")
          .select("*")
          .eq("approved", true)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setDbReviews(data);
        }
      } catch (err) {
        console.warn("[homepage-reviews] fetch error:", err);
      }
    };
    void loadApprovedReviews();
  }, []);

  const items = dbReviews.length > 0
    ? dbReviews.map((r) => ({
        quote: { en: r.text, ar: r.text },
        author: { en: r.author, ar: r.author },
        role: { en: r.company, ar: r.company },
        rating: r.rating || 5,
      }))
    : settings.testimonials || [];

  if (!items || items.length === 0) return null;

  return (
    <Section eyebrow="Testimonials" title={lang === "ar" ? "ماذا يقول عملاؤنا" : "What Our Clients Say"} center className="bg-muted/30">
      <div className={`grid gap-6 ${items.length % 2 === 0 ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
        {items.map((t, i) => {
          const quote = t.quote?.[lang] || t.quote?.en || t.quote?.ar || "";
          const author = t.author?.[lang] || t.author?.en || t.author?.ar || "";
          const role = t.role?.[lang] || t.role?.en || t.role?.ar || "";
          const rating = t.rating || 5;

          return (
            <div key={i} className="bg-card border rounded-2xl p-6 md:p-8 flex flex-col relative glow-on-hover transition-all duration-300 hover:-translate-y-1 hover:border-accent/60">
              <Quote className="absolute top-6 end-6 h-8 w-8 text-accent/20" />
              <div className="flex gap-1 mb-4">
                {[...Array(rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mb-6 flex-1 leading-relaxed">
                "{quote}"
              </p>
              <div className="border-t pt-3">
                <div className="font-semibold text-foreground text-sm">{author}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{role}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ServicesCarouselSection() {
  const { t, lang, dir } = useI18n();
  const isRtl = dir === "rtl";
  const { services } = useServices();
  const { autoplayRef, containerRef } = useCarouselAutoplay(4000);
  const [api, setApi] = useState<CarouselApi>();

  const activeServices = services.filter((s) => s.published !== false);
  if (activeServices.length === 0) return null;

  return (
    <Section eyebrow="Services" title={t("services.title")} sub={t("services.sub")} center>
      <Carousel
        ref={containerRef}
        opts={{ align: "start", direction: isRtl ? "rtl" : "ltr" }}
        plugins={[autoplayRef.current]}
        setApi={setApi}
        className="w-full"
        tabIndex={0}
        aria-label={lang === "ar" ? "خدماتنا" : "Services carousel"}
      >
        <CarouselContent className="-ml-3 sm:-ml-5">
          {activeServices.slice(0, 8).map((s, idx, arr) => {
            const Icon = getServiceIcon(s.iconName);
            const title = s.title?.[lang] || s.title?.en || "Service";
            const rawDesc = s.desc?.[lang] || s.desc?.en || "";
            const plainDesc = rawDesc.replace(/<[^>]*>?/gm, "").trim();
            const firstFeature = s.features?.[0]?.[lang] || s.features?.[0]?.en;
            const indexNumber = String(idx + 1).padStart(2, "0");

            return (
              <CarouselItem
                key={s.slug}
                className="pl-3 sm:pl-5 basis-full md:basis-1/2 lg:basis-1/4"
                aria-label={`${title} (${idx + 1} ${lang === "ar" ? "من" : "of"} ${arr.length})`}
              >
                <Link
                  to="/services/$slug"
                  params={{ slug: s.slug }}
                  className="group relative h-full p-5 sm:p-6 rounded-2xl border border-border/80 bg-card hover:bg-card/95 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent/10 hover:border-accent/50 overflow-hidden"
                >
                  {/* Subtle top accent gradient line on hover */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div>
                    {/* Header: Solid Orange Icon + Index + Arrow Action */}
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                      <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-accent text-white flex items-center justify-center shadow-md shadow-accent/25 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-muted-foreground/60 tracking-wider">
                          {indexNumber}
                        </span>
                        <div className="h-8 w-8 rounded-full border border-border/70 bg-muted/30 group-hover:bg-accent group-hover:border-accent text-muted-foreground group-hover:text-white flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                          <ArrowUpRight className="h-4 w-4 rtl:rotate-[-90deg] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold mb-2 group-hover:text-accent transition-colors duration-200 line-clamp-1">
                      {title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                      {plainDesc}
                    </p>
                  </div>

                  {/* Footer: Feature tag or Explore Link */}
                  <div className="pt-3.5 border-t border-border/60 flex items-center justify-between text-xs mt-auto gap-2">
                    {firstFeature ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium text-[11px] truncate max-w-[150px] sm:max-w-[170px]">
                        <span className="h-1 w-1 rounded-full bg-accent shrink-0" />
                        <span className="truncate">{firstFeature}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-medium text-[11px]">
                        {lang === "ar" ? "حلول متكاملة" : "Enterprise System"}
                      </span>
                    )}

                    <span className="font-semibold text-accent inline-flex items-center gap-1 group-hover:gap-1.5 transition-all text-xs shrink-0">
                      <span>{t("cta.learn")}</span>
                      <ArrowRight className="h-3 w-3 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </span>
                  </div>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious
          className="hidden lg:flex left-0 xl:-left-4"
          aria-label={lang === "ar" ? "الخدمة السابقة" : "Previous service"}
        />
        <CarouselNext
          className="hidden lg:flex right-0 xl:-right-4"
          aria-label={lang === "ar" ? "الخدمة التالية" : "Next service"}
        />
      </Carousel>
      <CarouselDots api={api} label={lang === "ar" ? "التنقل بين الخدمات" : "Services slide navigation"} />
    </Section>
  );
}

function PartnersSlider() {
  const { lang } = useI18n();
  const { partners: allPartners, loading } = usePartners();
  const partners = allPartners.filter((p) => p.active);
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/2] rounded-lg" />
        ))}
      </div>
    );
  }

  const firstRow = partners.slice(0, Math.ceil(partners.length / 2));
  const secondRow = partners.slice(Math.ceil(partners.length / 2));

  // Repeat 4 times to ensure it covers wide screens
  const firstRowRepeated = [...firstRow, ...firstRow, ...firstRow, ...firstRow];
  const secondRowRepeated = [...secondRow, ...secondRow, ...secondRow, ...secondRow];

  return (
    <div className="flex flex-col gap-6 relative py-4">
      {/* Row 1 */}
      <div className="flex w-full overflow-hidden group">
        <div className="flex w-max min-w-full animate-marquee group-hover:[animation-play-state:paused] gap-4 sm:gap-6 px-2 sm:px-3">
          {firstRowRepeated.map((p, idx) => {
            const displayName = (lang === "ar" ? p.name_ar : p.name_en) || p.name_en || p.name_ar;
            return (
              <Link key={`${p.id}-${idx}`} to="/partners/$id" params={{ id: p.id }} className="block">
                <div className="group/item relative w-52 sm:w-64 shrink-0 rounded-2xl p-[2px] bg-accent transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-accent/25 overflow-hidden">
                  {/* Live Animated Border Beam on hover */}
                  <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_200deg,rgba(255,255,255,0.95)_300deg,#FFA066_335deg,var(--electric)_360deg)] opacity-0 group-hover/item:opacity-100 group-hover/item:animate-border-beam transition-opacity duration-300 pointer-events-none" />

                  {/* Card Inner Content */}
                  <div className="relative z-10 w-full h-full rounded-[14px] bg-card p-4 sm:p-5 flex flex-col items-center justify-between text-center">
                    {/* Logo Container (no inside border) */}
                    <div className="w-full h-24 sm:h-28 rounded-xl bg-white dark:bg-white/5 px-2.5 sm:px-3 py-2 flex items-center justify-center transition-all duration-300">
                      <SmartLogo
                        src={p.logo}
                        alt={displayName}
                        name={displayName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Partner Info */}
                    <div className="mt-3.5 w-full flex flex-col items-center">
                      <div className="text-sm sm:text-base font-display font-bold text-foreground group-hover/item:text-accent transition-colors line-clamp-1">
                        {displayName}
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-semibold mt-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        <span>{p.featured ? (lang === "ar" ? "شريك استراتيجي" : "Strategic Partner") : (lang === "ar" ? "شريك معتمد" : "Authorized Partner")}</span>
                      </div>
                    </div>

                    {/* Action Link */}
                    <div className="mt-3 pt-3 border-t border-border/50 w-full flex items-center justify-center text-xs font-semibold text-muted-foreground group-hover/item:text-accent transition-colors gap-1">
                      <span>{lang === "ar" ? "تفاصيل الشراكة" : "View Partnership"}</span>
                      <ArrowRight className="h-3 w-3 rtl:rotate-180 transition-transform group-hover/item:translate-x-1 rtl:group-hover/item:-translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Row 2 (Reverse Marquee) */}
      <div className="flex w-full overflow-hidden group">
        <div className="flex w-max min-w-full animate-marquee-reverse group-hover:[animation-play-state:paused] gap-4 sm:gap-6 px-2 sm:px-3">
          {secondRowRepeated.map((p, idx) => {
            const displayName = (lang === "ar" ? p.name_ar : p.name_en) || p.name_en || p.name_ar;
            return (
              <Link key={`${p.id}-${idx}`} to="/partners/$id" params={{ id: p.id }} className="block">
                <div className="group/item relative w-52 sm:w-64 shrink-0 rounded-2xl p-[2px] bg-accent transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-accent/25 overflow-hidden">
                  {/* Live Animated Border Beam on hover */}
                  <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_200deg,rgba(255,255,255,0.95)_300deg,#FFA066_335deg,var(--electric)_360deg)] opacity-0 group-hover/item:opacity-100 group-hover/item:animate-border-beam transition-opacity duration-300 pointer-events-none" />

                  {/* Card Inner Content */}
                  <div className="relative z-10 w-full h-full rounded-[14px] bg-card p-4 sm:p-5 flex flex-col items-center justify-between text-center">
                    {/* Logo Container (no inside border) */}
                    <div className="w-full h-24 sm:h-28 rounded-xl bg-white dark:bg-white/5 px-2.5 sm:px-3 py-2 flex items-center justify-center transition-all duration-300">
                      <SmartLogo
                        src={p.logo}
                        alt={displayName}
                        name={displayName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Partner Info */}
                    <div className="mt-3.5 w-full flex flex-col items-center">
                      <div className="text-sm sm:text-base font-display font-bold text-foreground group-hover/item:text-accent transition-colors line-clamp-1">
                        {displayName}
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-semibold mt-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        <span>{p.featured ? (lang === "ar" ? "شريك استراتيجي" : "Strategic Partner") : (lang === "ar" ? "شريك معتمد" : "Authorized Partner")}</span>
                      </div>
                    </div>

                    {/* Action Link */}
                    <div className="mt-3 pt-3 border-t border-border/50 w-full flex items-center justify-center text-xs font-semibold text-muted-foreground group-hover/item:text-accent transition-colors gap-1">
                      <span>{lang === "ar" ? "تفاصيل الشراكة" : "View Partnership"}</span>
                      <ArrowRight className="h-3 w-3 rtl:rotate-180 transition-transform group-hover/item:translate-x-1 rtl:group-hover/item:-translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ImageWithSkeleton({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`${className ?? ""} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

import { ProjectDetailDialog } from "@/components/site/ProjectDetailDialog";
import type { Project } from "@/lib/projects-store";

function ProjectsCarouselSection() {
  const { t, lang, dir } = useI18n();
  const isRtl = dir === "rtl";
  const { items: projectItems } = useProjects();
  const { autoplayRef, containerRef } = useCarouselAutoplay(4000);
  const [api, setApi] = useState<CarouselApi>();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const activeProjects = projectItems.filter((p) => p.active === true);
  const displayedProjects = activeProjects.slice(0, 6);

  if (displayedProjects.length === 0) return null;

  return (
    <Section eyebrow="Case Studies" title={t("projects.title")} sub={t("projects.sub")}>
      <Carousel
        ref={containerRef}
        opts={{ align: "start", direction: isRtl ? "rtl" : "ltr" }}
        plugins={[autoplayRef.current]}
        setApi={setApi}
        className="w-full"
        tabIndex={0}
        aria-label={lang === "ar" ? "مشاريع مميزة" : "Featured projects carousel"}
      >
        <CarouselContent className="-ml-3 sm:-ml-5">
          {displayedProjects.map((p, idx, arr) => (
            <CarouselItem
              key={p.id}
              className="pl-3 sm:pl-5 basis-full md:basis-1/2 lg:basis-1/3"
              aria-label={`${p.title[lang]} (${idx + 1} ${lang === "ar" ? "من" : "of"} ${arr.length})`}
            >
              <article
                onClick={() => setSelectedProject(p)}
                className="group relative h-full rounded-2xl overflow-hidden bg-card flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 border-2 border-[#E8722C] shadow-[0_4px_24px_rgba(232,114,44,0.12)] hover:shadow-[0_8px_32px_rgba(232,114,44,0.22)]"
              >
                {/* Live animated border beam on hover */}
                <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden z-20">
                  <span className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#E8722C_85%,transparent_100%)] opacity-80" />
                </div>

                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <ImageWithSkeleton src={p.image} alt={p.title[lang]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                </div>
                <div className="p-4 sm:p-5 flex flex-col flex-1 relative z-10">
                  <div className="text-[10px] sm:text-xs font-bold text-[#E8722C] uppercase tracking-wider mb-1.5">{p.industry}</div>
                  <h3 className="text-sm sm:text-base font-bold mb-2 line-clamp-1 group-hover:text-[#E8722C] transition-colors">{p.title[lang]}</h3>
                  
                  {(() => {
                    const descText = p.desc[lang] || p.desc.en || "";
                    const items = descText.includes("•")
                      ? descText.split("•").map((s) => s.trim()).filter(Boolean)
                      : descText.includes(" - ")
                      ? descText.split(" - ").map((s) => s.trim()).filter(Boolean)
                      : [descText];

                    if (items.length > 1) {
                      return (
                        <div className="space-y-1.5 mt-1 flex-1">
                          {items.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#E8722C] shrink-0 mt-1.5" />
                              <span className="line-clamp-1">{item}</span>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <div className="text-[11px] font-semibold text-[#E8722C] pt-1">
                              +{items.length - 3} {lang === "ar" ? "أنظمة وتقنيات إضافية" : "more systems"}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {descText}
                      </p>
                    );
                  })()}
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          className="hidden lg:flex left-0 xl:-left-4"
          aria-label={lang === "ar" ? "المشروع السابق" : "Previous project"}
        />
        <CarouselNext
          className="hidden lg:flex right-0 xl:-right-4"
          aria-label={lang === "ar" ? "المشروع التالي" : "Next project"}
        />
      </Carousel>
      <CarouselDots api={api} label={lang === "ar" ? "التنقل بين المشاريع" : "Projects slide navigation"} />
      <div className="text-center mt-6">
        <Button asChild variant="outline"><Link to="/projects">{t("nav.projects")} <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" /></Link></Button>
      </div>

      <ProjectDetailDialog
        project={selectedProject}
        open={Boolean(selectedProject)}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
      />
    </Section>
  );
}

function Home() {
  const { t, lang, dir } = useI18n();
  const isRtl = dir === "rtl";
  const { settings } = useSettings();
  const { slides } = useSlides();
  const activeSlides = slides.filter(s => s.active);
  const autoplay = useRef(Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [heroApi, setHeroApi] = useState<CarouselApi>();
  return (
    <div>
      {/* Hero — slider when admin slides exist, else default */}
      {activeSlides.length > 0 ? (
        <section className="relative overflow-hidden gradient-surface">
          <div className="absolute inset-0 grid-bg opacity-60" />
          <Carousel
            opts={{ loop: true, direction: isRtl ? "rtl" : "ltr" }}
            plugins={[autoplay.current]}
            setApi={setHeroApi}
            className="relative"
            aria-label={lang === "ar" ? "الشرائح الرئيسية" : "Hero slider"}
          >
            <CarouselContent>
              {activeSlides.map((s) => {
                const title = (lang === "ar" ? s.title_ar : s.title_en) || s.title_en || s.title_ar;
                const subtitle = (lang === "ar" ? s.subtitle_ar : s.subtitle_en) || s.subtitle_en || s.subtitle_ar;
                const cta = (lang === "ar" ? s.cta_ar : s.cta_en) || s.cta_en || s.cta_ar;
                return (
                  <CarouselItem key={s.id}>
                    <div className="container mx-auto px-4 lg:px-8 relative pt-3 pb-8 md:pt-5 md:pb-16 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                      <div className="order-2 lg:order-1 text-center lg:text-start">
                        <h2 className={`font-bold mb-4 sm:mb-6 ${isRtl ? "text-[28px] sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.5]" : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15]"}`}>
                          <span className="gradient-text">{title}</span>
                        </h2>
                        {subtitle && (
                          <p className={`text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 ${isRtl ? "text-[15px] sm:text-lg leading-[2]" : "text-base sm:text-lg leading-relaxed"}`}>{subtitle}</p>
                        )}
                        {cta && (
                          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                            <Button asChild size="lg" className="gap-2">
                              <a href={s.href || "/"}>{cta} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></a>
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="relative order-1 lg:order-2 mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
                        <div className="absolute inset-6 gradient-hero rounded-full blur-3xl opacity-25" />
                        <img
                          src={s.image}
                          alt={title}
                          loading="eager"
                          decoding="async"
                          className="relative w-full h-auto aspect-square object-cover rounded-2xl"
                        />
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            {activeSlides.length > 1 && (
              <>
                <CarouselPrevious className="left-4 hidden md:flex" aria-label="Previous hero slide" />
                <CarouselNext className="right-4 hidden md:flex" aria-label="Next hero slide" />
              </>
            )}
          </Carousel>
          {activeSlides.length > 1 && (
            <div className="relative pb-6">
              <CarouselDots api={heroApi} label={lang === "ar" ? "التنقل بين الشرائح" : "Hero slide navigation"} />
            </div>
          )}
        </section>
      ) : (
      <section className="relative overflow-hidden gradient-surface">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className={`absolute ${isRtl ? "-left-32" : "-right-32"} -top-32 h-[600px] w-[600px] rounded-full bg-accent/10 blur-3xl`} />
        <div className="container mx-auto px-4 lg:px-8 relative pt-3 pb-8 md:pt-5 md:pb-16 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="animate-fade-in-up order-2 lg:order-1 text-center lg:text-start">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-semibold mb-4 sm:mb-6 ${isRtl ? "text-xs sm:text-sm tracking-normal" : "text-[10px] sm:text-xs uppercase tracking-wider"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> {t("hero.eyebrow")}
            </div>
            <h1 className={`font-bold mb-4 sm:mb-6 ${isRtl ? "text-[28px] sm:text-4xl md:text-5xl lg:text-[56px] xl:text-6xl leading-[1.5] tracking-normal [word-spacing:0.05em]" : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.15]"}`}>
              {t("hero.title").split(" ").slice(0, -3).join(" ")}{" "}
              <span className="gradient-text">{t("hero.title").split(" ").slice(-3).join(" ")}</span>
            </h1>
            <p className={`text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 ${isRtl ? "text-[15px] sm:text-lg leading-[2] tracking-normal" : "text-base sm:text-lg leading-relaxed"}`}>{t("hero.sub")}</p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
                <Link to="/contact">{t("cta.proposal")} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/services">{t("cta.explore")}</Link>
              </Button>
            </div>
          </div>
          <div className="relative animate-scale-in order-1 lg:order-2 mx-auto w-full flex items-center justify-center">
            <InteractiveHeroWheel />
          </div>
        </div>
      </section>
      )}

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {settings.stats.map((s, i) => (
            <div key={i} className="text-center">
              <StatCounter value={s.value} suffix={s.suffix} />
              <div className="text-sm text-muted-foreground mt-2 font-medium">{lang === "ar" ? s.label.ar : s.label.en}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <ServicesCarouselSection />

      {/* Industries */}
      <IndustriesSection />

      {/* Featured projects */}
      <ProjectsCarouselSection />

      {/* Latest News */}
      <LatestNews />

      {/* Featured products */}
      <FeaturedProducts />

      {/* Why Choose Us */}
      <Section className="bg-primary text-primary-foreground" eyebrow="Why Us" title={t("why.title")}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4].map((i, idx) => {
            const Icon = whyIcons[idx];
            return (
              <div key={i} className="p-4 sm:p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-accent flex items-center justify-center mb-3 sm:mb-4">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="font-display font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">{t(`why.${i}.t` as any)}</h3>
                <p className="text-xs sm:text-sm opacity-75 line-clamp-3 sm:line-clamp-none">{t(`why.${i}.d` as any)}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Partners */}
      <Section eyebrow="Ecosystem" title={t("partners.title")} sub={t("partners.sub")} center>
        <PartnersSlider />
      </Section>

      {/* CTA */}
      <section className="container mx-auto px-4 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 md:p-16 text-primary-foreground">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t("ctaSection.title")}</h2>
            <p className="text-lg opacity-85 mb-8">{t("ctaSection.sub")}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary"><Link to="/contact">{t("cta.contact")}</Link></Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/contact">{t("cta.proposal")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />
    </div>
  );
}

function IndustriesSection() {
  const { t, lang } = useI18n();
  const { industries } = useIndustries();
  const activeIndustries = industries.filter((i) => i.active !== false);
  const isRtl = lang === "ar";

  if (activeIndustries.length === 0) return null;

  const half = Math.ceil(activeIndustries.length / 2);
  const row1 = activeIndustries.slice(0, half);
  const row2 = activeIndustries.slice(half).length > 0 ? activeIndustries.slice(half) : row1;

  // Duplicate for smooth infinite CSS marquee loop
  const list1 = [...row1, ...row1, ...row1, ...row1];
  const list2 = [...row2, ...row2, ...row2, ...row2];

  return (
    <Section className="bg-muted/30 overflow-hidden" eyebrow="Industries" title={t("industries.title")} sub={t("industries.sub")}>
      <div className="flex flex-col gap-6 relative py-4">
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee { animation: marquee 40s linear infinite; }
          .animate-marquee-reverse { animation: marquee 40s linear infinite reverse; }
        `}</style>
        
        <div className="flex w-full overflow-hidden group">
          <div className={`flex w-max min-w-full ${isRtl ? 'animate-marquee-reverse' : 'animate-marquee'} group-hover:[animation-play-state:paused] gap-4 sm:gap-6 px-2 sm:px-3`}>
            {list1.map((i, idx) => {
              const title = lang === "ar" ? (i.title_ar || i.title_en) : (i.title_en || i.title_ar);
              return (
                <div key={`${i.id}-${idx}`} className="relative w-40 sm:w-56 shrink-0 aspect-[4/5] rounded-2xl overflow-hidden border border-border/50 bg-card flex items-end text-start p-4 sm:p-6 hover:border-accent hover:shadow-xl hover:shadow-accent/10 transition-all cursor-default group/item">
                  <img src={i.image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 group-hover/item:from-accent/90 group-hover/item:via-accent/40 transition-colors duration-500" />
                  <span className="relative font-display font-bold text-white drop-shadow-lg z-10 text-sm sm:text-lg">{title}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex w-full overflow-hidden group">
          <div className={`flex w-max min-w-full ${isRtl ? 'animate-marquee' : 'animate-marquee-reverse'} group-hover:[animation-play-state:paused] gap-4 sm:gap-6 px-2 sm:px-3`}>
            {list2.map((i, idx) => {
              const title = lang === "ar" ? (i.title_ar || i.title_en) : (i.title_en || i.title_ar);
              return (
                <div key={`${i.id}-${idx}`} className="relative w-40 sm:w-56 shrink-0 aspect-[4/5] rounded-2xl overflow-hidden border border-border/50 bg-card flex items-end text-start p-4 sm:p-6 hover:border-accent hover:shadow-xl hover:shadow-accent/10 transition-all cursor-default group/item">
                  <img src={i.image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 group-hover/item:from-accent/90 group-hover/item:via-accent/40 transition-colors duration-500" />
                  <span className="relative font-display font-bold text-white drop-shadow-lg z-10 text-sm sm:text-lg">{title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
