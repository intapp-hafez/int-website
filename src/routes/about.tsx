import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Target, Heart, Sparkles, ShieldCheck, Award, Linkedin, Lightbulb, Rocket, FileText, CalendarCheck, MapPin } from "lucide-react";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAboutContent, withCacheBust, pickBi } from "@/lib/about-store";
import { useSettings } from "@/lib/settings-store";
import { trackCta } from "@/lib/cta-tracking";
import ownerImg from "@/assets/owner.jpg";
import teamKarim from "@/assets/team-karim.jpg";
import teamLayla from "@/assets/team-layla.jpg";
import teamOmar from "@/assets/team-omar.jpg";
import teamNadia from "@/assets/team-nadia.jpg";
import teamSamir from "@/assets/team-samir.jpg";
import teamDina from "@/assets/team-dina.jpg";


export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Integrated Technics" },
      { name: "description", content: "20+ years engineering complex security and ICT systems for the region's most demanding enterprises." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { lang, t } = useI18n();
  const { content, hero, updatedAt } = useAboutContent();
  const { settings } = useSettings();
  const L = (b: { en: string; ar: string } | null | undefined, fallback = "") =>
    pickBi(b, lang === "ar" ? "ar" : "en", fallback);
  const valueIcons = [Heart, Sparkles, ShieldCheck];
  const isRtl = lang === "ar";
  const shouldMirror = hero.mirror_rtl && isRtl;
  const heroSrc = withCacheBust(hero.image_url, updatedAt);

  const jumpLinks = [
    { href: "#overview", label: isRtl ? "نظرة عامة" : "Overview" },
    { href: "#leadership", label: isRtl ? "القيادة" : "Leadership" },
    { href: "#values", label: isRtl ? "قيمنا" : "Values" },
    { href: "#certifications", label: isRtl ? "الشهادات" : "Certifications" },
    { href: "#location", label: isRtl ? "الموقع" : "Location" },
  ];

  const teamImageByKey: Record<string, string> = {
    ceo: teamKarim, cto: teamLayla, operations: teamOmar,
    projects: teamNadia, security: teamSamir, ict: teamDina,
  };

  const departmentByKey: Record<string, { en: string; ar: string }> = {
    ceo: { en: "Executive Leadership", ar: "القيادة التنفيذية" },
    cto: { en: "Technology & Engineering", ar: "التقنية والهندسة" },
    operations: { en: "Operations & Delivery", ar: "العمليات والتنفيذ" },
    projects: { en: "Project Governance", ar: "حوكمة المشاريع" },
    security: { en: "Security Architecture", ar: "معمارية الأمن السيبراني" },
    ict: { en: "ICT Infrastructure", ar: "البنية التحتية للاتصالات" },
  };

  return (
    <div>
      <section className="gradient-surface relative overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/80" />
          </>
        ) : (
          <div className="absolute inset-0 grid-bg opacity-50" />
        )}
        <div className="container mx-auto px-4 lg:px-8 py-24 md:py-32 relative">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">{L(content.eyebrow)}</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{L(content.title)}</h1>
            <p className="text-lg text-muted-foreground">{L(content.sub)}</p>
          </div>
        </div>
      </section>

      {/* Anchor navigation */}
      <nav aria-label={isRtl ? "أقسام الصفحة" : "Page sections"} className="sticky top-16 z-20 border-b bg-background/85 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-8">
          <ul className="flex flex-wrap gap-1 py-2 text-sm">
            {jumpLinks.map(j => (
              <li key={j.href}>
                <a href={j.href} className="inline-block px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  {j.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <Section id="leadership" className="bg-muted/30 scroll-mt-32">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
            <div className="absolute inset-6 gradient-hero rounded-full blur-3xl opacity-25" />
            <img
              src={ownerImg}
              alt={t("about.ownerName")}
              loading="lazy"
              width={1024}
              height={1024}
              className="relative w-full h-auto aspect-square object-cover rounded-2xl shadow-glow"
            />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">{L(content.ownerEyebrow)}</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{L(content.ownerTitle)}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">{L(content.ownerBio)}</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-semibold text-lg">{L(content.ownerName, "—")}</p>
                <p className="text-sm text-muted-foreground">{L(content.ownerRole, "")}</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA block right after the leadership message */}
      <section aria-label={isRtl ? "دعوة للتواصل" : "Call to action"} className="py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border gradient-hero text-primary-foreground p-8 md:p-12 shadow-glow">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  {isRtl ? "جاهز لبدء مشروعك القادم؟" : "Ready to start your next project?"}
                </h3>
                <p className="text-primary-foreground/85 max-w-xl">
                  {isRtl
                    ? "احصل على عرض مخصص خلال 48 ساعة أو احجز استشارة مباشرة مع خبير الحلول."
                    : "Get a tailored proposal within 48 hours, or book a live consultation with a solutions architect."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary" className="shadow-lg">
                  <Link to="/contact" onClick={() => trackCta("request_proposal")}>
                    <FileText className="h-4 w-4 me-2" />
                    {isRtl ? "طلب عرض سعر" : "Request Proposal"}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground">
                  <Link to="/contact" onClick={() => trackCta("book_consultation")}>
                    <CalendarCheck className="h-4 w-4 me-2" />
                    {isRtl ? "احجز استشارة" : "Book Consultation"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section id="overview" className="scroll-mt-32">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">{L(content.overviewT)}</h2>
          <p className="text-muted-foreground leading-relaxed">{L(content.overviewD)}</p>
        </div>
      </Section>

      <Section className="bg-muted/30">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">{lang === "ar" ? "رؤيتنا" : "Our Vision"}</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{L(content.visionT)}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">{L(content.visionD)}</p>
          </div>
          <div className="order-1 lg:order-2 flex items-center justify-center">
            <div className="h-32 w-32 rounded-3xl gradient-hero text-primary-foreground flex items-center justify-center shadow-glow">
              <Eye className="h-14 w-14" />
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="flex items-center justify-center">
            <div className="h-32 w-32 rounded-3xl gradient-hero text-primary-foreground flex items-center justify-center shadow-glow">
              <Target className="h-14 w-14" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">{lang === "ar" ? "مهمتنا" : "Our Mission"}</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{L(content.missionT)}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">{L(content.missionD)}</p>
          </div>
        </div>
      </Section>

      <Section id="values" className="bg-muted/30 scroll-mt-32" title={L(content.valuesT)} center>
        <div className="grid md:grid-cols-3 gap-6">
          {content.values.map((v, idx) => {
            const Icon = valueIcons[idx] ?? Heart;
            return (
            <div key={idx} className="p-8 rounded-2xl border bg-card text-center">
              <div className="h-12 w-12 mx-auto rounded-xl gradient-hero text-primary-foreground flex items-center justify-center mb-4"><Icon className="h-6 w-6" /></div>
              <h3 className="font-display text-xl font-semibold mb-2">{L(v.title)}</h3>
              <p className="text-sm text-muted-foreground">{L(v.desc)}</p>
            </div>
          );})}
        </div>
      </Section>

      <Section id="certifications" className="scroll-mt-32" title={L(content.certificationsT)} sub={L(content.certificationsSub)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {content.certifications.map(c => (
            <div key={c} className="p-5 rounded-xl border bg-card flex items-center gap-3">
              <Award className="h-5 w-5 text-accent" />
              <span className="font-medium text-sm">{c}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="location" className="bg-muted/30 scroll-mt-32" title={isRtl ? "موقعنا" : "Our Location"}>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-accent mt-0.5 shrink-0" />
              <p className="text-lg" dir={isRtl ? "rtl" : "ltr"}>{pickBi(settings.address, isRtl ? "ar" : "en", "")}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.phone} · <a className="hover:text-foreground" href={`mailto:${settings.email}`}>{settings.email}</a>
            </p>
          </div>
          {settings.mapUrl && (
            <div className="rounded-2xl overflow-hidden border aspect-video">
              <iframe src={settings.mapUrl} title="Map" className="w-full h-full" loading="lazy" />
            </div>
          )}
        </div>
      </Section>

      <Section title={L(content.teamTitle)} sub={L(content.teamSub)} center>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {content.team.map((m) => {
            const dept = departmentByKey[m.key] ?? { en: "Leadership", ar: "القيادة" };
            return (
              <div
                key={m.key}
                className="group relative rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card to-card/90 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-accent/10 hover:border-accent/50 transition-all duration-500 hover:-translate-y-2 flex flex-col"
              >
                {/* Image Container with balanced portrait aspect ratio */}
                <div className="relative aspect-[4/4.5] w-[calc(100%-1.25rem)] mx-auto mt-2.5 overflow-hidden rounded-2xl bg-muted/30">
                  <img
                    src={teamImageByKey[m.key] ?? teamKarim}
                    alt={L(m.name)}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Gentle gradient overlay at bottom of photo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-500" />

                  {/* Floating Department Badge */}
                  <div className="absolute top-3 start-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-background/85 backdrop-blur-md border border-white/20 text-foreground shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                      {L(dept)}
                    </span>
                  </div>

                  {/* Floating LinkedIn / Profile Connect */}
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
                      <span>{isRtl ? "معتمد وموثق" : "Certified Executive"}</span>
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
    </div>
  );
}
