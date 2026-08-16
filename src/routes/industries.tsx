import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { useIndustries } from "@/lib/industries-store";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/industries")({
  head: () => ({ meta: [{ title: "Industries — Integrated Technics" }, { name: "description", content: "Solutions tailored for telecom, oil & gas, real estate, hospitality, manufacturing and government." }] }),
  component: IndustriesPage,
});

function IndustriesPage() {
  const { t, lang } = useI18n();
  const { industries } = useIndustries();
  const activeIndustries = industries.filter((i) => i.active !== false);

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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {activeIndustries.map((i) => {
            const title = lang === "ar" ? (i.title_ar || i.title_en) : (i.title_en || i.title_ar);
            const desc = lang === "ar" ? (i.description_ar || i.description_en) : (i.description_en || i.description_ar);
            return (
              <div key={i.id || i.slug} className="group relative rounded-2xl border bg-card overflow-hidden hover:border-accent hover:shadow-xl hover:shadow-accent/10 transition-all">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <img src={i.image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 start-3 h-10 w-10 rounded-xl bg-background/80 backdrop-blur text-accent flex items-center justify-center shadow">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-accent transition-colors">{title}</h3>
                  {desc && <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{desc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
