import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { usePartners } from "@/lib/partners-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

export const Route = createFileRoute("/partners")({
  head: () => ({ meta: [{ title: "Partners — Integrated Technics" }, { name: "description", content: "Authorized partner of the world's leading technology vendors." }] }),
  component: PartnersPage,
});

function PartnersPage() {
  const { t, lang, dir } = useI18n();
  const { partners, loading } = usePartners();
  const isAr = lang === "ar";
  const list = partners
    .filter((p) => p.active)
    .sort((a, b) => {
      const fa = a.featured ? 1 : 0;
      const fb = b.featured ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return a.sort_order - b.sort_order;
    });
  return (
    <div dir={dir}>
      <section className="gradient-surface relative" dir={dir}>
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className={`container mx-auto px-4 lg:px-8 py-24 relative ${isAr ? "text-right" : "text-left"}`}>
          <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">{isAr ? "المنظومة" : "Ecosystem"}</div>
          <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${isAr ? "font-arabic leading-[1.3]" : ""}`}>{t("partners.title")}</h1>
          <p className={`text-lg text-muted-foreground max-w-2xl ${isAr ? "font-arabic leading-loose ms-auto" : ""}`}>{t("partners.sub")}</p>
        </div>
      </section>
      <Section>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/2] rounded-xl" />
              ))
            : list.map((p) => {
                const name = (lang === "ar" ? p.name_ar : p.name_en) || p.name_en || p.name_ar;
                const inner = (
                  <div className="relative aspect-[3/2] rounded-xl border bg-card flex flex-col items-center justify-center gap-2 p-4 hover:border-accent transition-colors group">
                    {p.featured && (
                      <span className="absolute top-2 end-2 inline-flex items-center gap-1 text-[10px] font-semibold bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                        <Star className="h-3 w-3 fill-current" />
                      </span>
                    )}
                    <img src={p.logo} alt={name} loading="lazy" referrerPolicy="no-referrer" className="max-h-10 max-w-[80%] object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition" />
                    <div className={`text-xs font-medium text-muted-foreground group-hover:text-accent text-center ${isAr ? "font-arabic" : ""}`} dir={isAr ? "rtl" : "ltr"}>{name}</div>
                  </div>
                );
                return p.href ? (
                  <a key={p.id} href={p.href} target="_blank" rel="noreferrer" dir="ltr">{inner}</a>
                ) : <div key={p.id}>{inner}</div>;
              })}
        </div>
      </Section>
    </div>
  );
}
