import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { useServices, getServiceIcon } from "@/lib/services-store";
import { FaqSection } from "@/components/site/FaqSection";

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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function ServicesIndex() {
  const { t, lang } = useI18n();
  const { services } = useServices();
  const activeServices = services.filter((s) => s.published !== false);

  return (
    <div>
      <section className="gradient-surface relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="container mx-auto px-4 lg:px-8 py-20 lg:py-24 relative">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">{t("nav.services")}</div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4">{t("services.title")}</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">{t("services.sub")}</p>
        </div>
      </section>
      <Section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeServices.map((s) => {
            const Icon = getServiceIcon(s.iconName);
            const title = s.title?.[lang] || s.title?.en || "Service";
            const rawDesc = s.desc?.[lang] || s.desc?.en || "";
            const plainDesc = stripHtml(rawDesc);

            return (
              <Link
                key={s.slug}
                to="/services/$slug"
                params={{ slug: s.slug }}
                className="group p-5 sm:p-7 rounded-2xl border bg-card glow-on-hover flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-accent/60"
              >
                <div>
                  <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-accent transition-colors">{title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">{plainDesc}</p>
                </div>
                <span className="text-xs sm:text-sm font-medium text-accent inline-flex items-center gap-1 group-hover:gap-2 transition-all pt-2 border-t">
                  {t("cta.learn")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* Dynamic Services FAQ Section */}
      <FaqSection className="border-t bg-muted/10" />
    </div>
  );
}
