import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CirclePlay, Headphones, Layers, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSectionTitle } from "@/lib/titles-store";
import background from "@/assets/enterprise-background.png.asset.json";
import wheel from "@/assets/enterprise-wheel.png.asset.json";

const disciplines = [
  { en: "Network Infrastructure", ar: "البنية التحتية للشبكات" },
  { en: "Security Solutions", ar: "الحلول الأمنية" },
  { en: "Smart Automation", ar: "الأتمتة الذكية" },
  { en: "Audio / Video", ar: "الصوت والصورة" },
];
const strengths = [
  { icon: ShieldCheck, en: "Proven Expertise", ar: "خبرات مثبتة" },
  { icon: Layers, en: "Integrated Solutions", ar: "حلول متكاملة" },
  { icon: Users, en: "Certified Engineers", ar: "مهندسون معتمدون" },
  { icon: Headphones, en: "End-to-End Support", ar: "دعم شامل" },
];

export function EnterpriseHero() {
  const { lang } = useI18n();
  const content = useSectionTitle("home.hero");
  const title = content.title || "Integrated Technics for Enterprise Excellence";
  const split = lang === "en" ? title.indexOf(" for ") : -1;
  return (
    <section className="enterprise-hero" aria-labelledby="enterprise-hero-title">
      <img className="enterprise-hero-background" src={background.url} alt="" fetchPriority="high" />
      <div className="enterprise-hero-inner">
        <div className="enterprise-hero-copy">
          <p className="enterprise-hero-eyebrow"><span aria-hidden="true">/</span>{content.badge || (lang === "ar" ? "تكامل الأنظمة المؤسسية" : "Enterprise System Integration")}</p>
          <h1 id="enterprise-hero-title">
            {split >= 0 ? <>{title.slice(0, split)}<span className="enterprise-hero-highlight">{title.slice(split + 1)}</span></> : title}
          </h1>
          <p className="enterprise-hero-description">{content.subtitle || (lang === "ar" ? "تكامل شامل للأنظمة الأمنية والتقنية والذكية لمؤسسات أكثر أماناً وذكاءً وترابطاً." : "End-to-end security, ICT and smart systems integration delivering safer, smarter and more connected organizations.")}</p>
          <div className="enterprise-hero-actions">
            <Button asChild size="lg" className="enterprise-hero-primary"><Link to="/contact"><CalendarDays aria-hidden="true" />{lang === "ar" ? "طلب استشارة" : "Request a Consultation"}<ArrowRight className="rtl:rotate-180" aria-hidden="true" /></Link></Button>
            <Button asChild variant="outline" size="lg" className="enterprise-hero-secondary"><Link to="/solutions"><CirclePlay aria-hidden="true" />{lang === "ar" ? "حلولنا" : "Our Solutions"}</Link></Button>
          </div>
          <ul className="enterprise-hero-strengths">
            {strengths.map(({ icon: Icon, en, ar }) => <li key={en}><Icon aria-hidden="true" /><span>{lang === "ar" ? ar : en}</span></li>)}
          </ul>
        </div>
        <div className="enterprise-hero-wheel" role="group" aria-label={lang === "ar" ? "مجالات الحلول" : "Our solution disciplines"}>
          <img src={wheel.url} alt={lang === "ar" ? "عجلة حلول Integrated Technics" : "Integrated Technics: network infrastructure, security solutions, smart automation and audio / video"} fetchPriority="high" />
          <div className="enterprise-hero-wheel-links">
            {disciplines.map(({ en, ar }) => <Link key={en} to="/solutions" aria-label={lang === "ar" ? ar : en} title={lang === "ar" ? ar : en} />)}
          </div>
        </div>
      </div>
    </section>
  );
}