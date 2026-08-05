import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { services } from "@/data/site";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Integrated Technics" },
      { name: "description", content: "End-to-end security, ICT, AV, and data center services delivered by certified engineers." },
    ],
  }),
  component: ServicesLayout,
});

function ServicesLayout() {
  const matches = useMatches();
  const isChild = matches.some(m => m.routeId !== "/services" && m.routeId.startsWith("/services"));
  if (isChild) return <Outlet />;
  return <ServicesIndex />;
}

function ServicesIndex() {
  const { t, lang } = useI18n();
  return (
    <div>
      <section className="gradient-surface relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="container mx-auto px-4 lg:px-8 py-24 relative">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Services</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{t("services.title")}</h1>
            <p className="text-lg text-muted-foreground">{t("services.sub")}</p>
          </div>
        </div>
      </section>
      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {services.map(s => {
            const Icon = s.icon;
            return (
              <Link key={s.slug} to="/services/$slug" params={{ slug: s.slug }} className="group p-4 sm:p-7 rounded-2xl border bg-card glow-on-hover">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground mb-3 sm:mb-5"><Icon className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                <h3 className="text-base sm:text-xl font-semibold mb-1.5 sm:mb-2">{s.title[lang]}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-3 sm:line-clamp-none">{s.desc[lang]}</p>
                <span className="text-xs sm:text-sm font-medium text-accent inline-flex items-center gap-1 group-hover:gap-2 transition-all">{t("cta.learn")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" /></span>
              </Link>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
