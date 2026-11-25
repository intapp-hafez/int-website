import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CirclePlay,
  Headphones,
  Layers,
  ShieldCheck,
  Users,
  Award,
  Clock,
  Star,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSectionTitle } from "@/lib/titles-store";
import { useSettings, defaultHeroConfig } from "@/lib/settings-store";
import backgroundImage from "@/assets/enterprise-background.webp";
import wheelImage from "@/assets/enterprise-wheel.webp";
import backgroundAsset from "@/assets/enterprise-background.png.asset.json";
import wheelAsset from "@/assets/enterprise-wheel.png.asset.json";

const defaultBackgroundUrl = backgroundImage || backgroundAsset.url;
const defaultWheelUrl = wheelImage || wheelAsset.url;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  ShieldCheck,
  Layers,
  Users,
  Headphones,
  Award,
  Clock,
  Star,
  CheckCircle2,
  Sparkles,
  Zap,
};

const disciplines = [
  { en: "Network Infrastructure", ar: "البنية التحتية للشبكات" },
  { en: "Security Solutions", ar: "الحلول الأمنية" },
  { en: "Smart Automation", ar: "الأتمتة الذكية" },
  { en: "Audio / Video", ar: "الصوت والصورة" },
];

export function EnterpriseHero() {
  const { lang } = useI18n();
  const { settings } = useSettings();
  const hero = settings?.hero || defaultHeroConfig;

  const content = useSectionTitle("home.hero");
  const title = content.title || "Integrated Technics for Enterprise Excellence";
  const split = lang === "en" ? title.indexOf(" for ") : -1;

  const bgUrl = (hero.backgroundImage || "").trim() || defaultBackgroundUrl;
  const wheelUrl = (hero.wheelImage || "").trim() || defaultWheelUrl;
  const showWheel = hero.showWheel !== false;
  const fit = hero.backgroundFit || "cover";
  const opacity = (hero.backgroundOpacity ?? 100) / 100;

  const primaryCta = hero.primaryCta || defaultHeroConfig.primaryCta;
  const secondaryCta = hero.secondaryCta || defaultHeroConfig.secondaryCta;
  const strengths = Array.isArray(hero.strengths) && hero.strengths.length > 0 ? hero.strengths : defaultHeroConfig.strengths;

  return (
    <section className="enterprise-hero" aria-labelledby="enterprise-hero-title">
      <img
        className="enterprise-hero-background"
        src={bgUrl}
        alt=""
        width={1752}
        height={897}
        loading="eager"
        fetchPriority="high"
        style={{ objectFit: fit, opacity }}
      />
      <div className="enterprise-hero-inner">
        <div className="enterprise-hero-copy">
          <p className="enterprise-hero-eyebrow">
            <span aria-hidden="true">/</span>
            {content.badge || (lang === "ar" ? "تكامل الأنظمة المؤسسية" : "Enterprise System Integration")}
          </p>
          <h1 id="enterprise-hero-title">
            {split >= 0 ? (
              <>
                {title.slice(0, split)}
                <span className="enterprise-hero-highlight">{title.slice(split + 1)}</span>
              </>
            ) : (
              title
            )}
          </h1>
          <p className="enterprise-hero-description">
            {content.subtitle ||
              (lang === "ar"
                ? "تكامل شامل للأنظمة الأمنية والتقنية والذكية لمؤسسات أكثر أماناً وذكاءً وترابطاً."
                : "End-to-end security, ICT and smart systems integration delivering safer, smarter and more connected organizations.")}
          </p>
          <div className="enterprise-hero-actions">
            {primaryCta.enabled && (
              <Button asChild size="lg" className="enterprise-hero-primary">
                <Link to={primaryCta.url || "/contact"}>
                  <CalendarDays aria-hidden="true" />
                  {lang === "ar" ? primaryCta.text.ar || primaryCta.text.en : primaryCta.text.en || primaryCta.text.ar}
                  <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
                </Link>
              </Button>
            )}
            {secondaryCta.enabled && (
              <Button asChild variant="outline" size="lg" className="enterprise-hero-secondary">
                <Link to={secondaryCta.url || "/solutions"}>
                  <CirclePlay aria-hidden="true" />
                  {lang === "ar" ? secondaryCta.text.ar || secondaryCta.text.en : secondaryCta.text.en || secondaryCta.text.ar}
                </Link>
              </Button>
            )}
          </div>
          <ul className="enterprise-hero-strengths">
            {strengths.map((s, idx) => {
              const Icon = (s.iconName && ICON_MAP[s.iconName]) || ShieldCheck;
              const label = lang === "ar" ? s.label.ar || s.label.en : s.label.en || s.label.ar;
              return (
                <li key={idx}>
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </li>
              );
            })}
          </ul>
        </div>
        {showWheel && (
          <div className="enterprise-hero-wheel" role="group" aria-label={lang === "ar" ? "مجالات الحلول" : "Our solution disciplines"}>
            <img
              src={wheelUrl}
              alt={lang === "ar" ? "عجلة حلول Integrated Technics" : "Integrated Technics: network infrastructure, security solutions, smart automation and audio / video"}
              width={564}
              height={572}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <div className="enterprise-hero-wheel-links">
              {disciplines.map(({ en, ar }) => (
                <Link key={en} to="/solutions" aria-label={lang === "ar" ? ar : en} title={lang === "ar" ? ar : en} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}