import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { industries } from "@/data/site";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/industries")({
  head: () => ({ meta: [{ title: "Industries — Integrated Technics" }, { name: "description", content: "Solutions tailored for telecom, oil & gas, real estate, hospitality, manufacturing and government." }] }),
  component: IndustriesPage,
});

function IndustriesPage() {
  const { t, lang } = useI18n();
  const blurbs: Record<string, { en: string; ar: string }> = {
    telecom: { en: "Carrier-grade infrastructure for nationwide networks.", ar: "بنية تحتية بمستوى المشغلين الإقليميين." },
    "oil-gas": { en: "Hardened systems for hazardous-area environments.", ar: "أنظمة معززة للمواقع ذات المخاطر العالية." },
    "real-estate": { en: "Smart-building integration for premium developments.", ar: "تكامل المباني الذكية للمشاريع المميزة." },
    hospitality: { en: "Guest-experience tech across multi-property portfolios.", ar: "حلول تجربة الضيف لمحافظ فندقية متعددة." },
    manufacturing: { en: "OT/IT convergence for resilient operations.", ar: "دمج OT/IT لعمليات تشغيل موثوقة." },
    government: { en: "Mission-critical systems with strict compliance.", ar: "أنظمة حرجة بمتطلبات امتثال صارمة." },
  };
  return (
    <div>
      <section className="gradient-surface relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="container mx-auto px-4 lg:px-8 py-24 relative">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Industries</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{t("industries.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{t("industries.sub")}</p>
        </div>
      </section>
      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {industries.map(i => (
            <div key={i.slug} className="p-4 sm:p-7 rounded-2xl border bg-card glow-on-hover">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl gradient-hero text-primary-foreground flex items-center justify-center mb-3 sm:mb-4"><Building2 className="h-5 w-5 sm:h-6 sm:w-6" /></div>
              <h3 className="text-base sm:text-xl font-semibold mb-1.5 sm:mb-2">{i.title[lang]}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 sm:line-clamp-none">{blurbs[i.slug][lang]}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
