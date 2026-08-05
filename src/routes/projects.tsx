import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { projects } from "@/data/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — Integrated Technics" }, { name: "description", content: "Selected case studies across telecom, government, oil & gas, hospitality and manufacturing." }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<string>("All");
  const industries = useMemo(() => ["All", ...Array.from(new Set(projects.map(p => p.industry)))], []);
  const filtered = filter === "All" ? projects : projects.filter(p => p.industry === filter);
  return (
    <div>
      <section className="gradient-surface relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="container mx-auto px-4 lg:px-8 py-24 relative">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Case Studies</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{t("projects.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{t("projects.sub")}</p>
        </div>
      </section>
      <Section>
        <div className="flex flex-wrap gap-2 mb-10">
          {industries.map(i => (
            <button key={i} onClick={() => setFilter(i)} className={cn("px-4 py-2 rounded-full text-sm font-medium border transition-colors", filter === i ? "bg-primary text-primary-foreground border-primary" : "hover:border-accent hover:text-accent")}>
              {i}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filtered.map(p => (
            <article key={p.id} className="group rounded-2xl overflow-hidden border bg-card glow-on-hover">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={p.image} alt={p.title[lang]} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-3 sm:p-6">
                <div className="text-[10px] sm:text-xs font-semibold text-accent uppercase tracking-wider mb-1 sm:mb-2">{p.industry}</div>
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 line-clamp-2">{p.title[lang]}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">{p.desc[lang]}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </div>
  );
}
