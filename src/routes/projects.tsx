import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { useProjects, type Project } from "@/lib/projects-store";
import { cn } from "@/lib/utils";
import { ProjectDetailDialog } from "@/components/site/ProjectDetailDialog";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — Integrated Technics" }, { name: "description", content: "Selected case studies across telecom, government, oil & gas, hospitality and manufacturing." }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { t, lang } = useI18n();
  const { items: projects, loading } = useProjects();
  const [filter, setFilter] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const activeProjects = useMemo(() => projects.filter((p) => p.active === true), [projects]);
  const industries = useMemo(() => ["All", ...Array.from(new Set(activeProjects.map((p) => p.industry).filter(Boolean)))], [activeProjects]);
  const filtered = filter === "All" ? activeProjects : activeProjects.filter((p) => p.industry === filter);

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
          {industries.map((i) => (
            <button
              key={i}
              onClick={() => setFilter(i)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                filter === i ? "bg-primary text-primary-foreground border-primary" : "hover:border-accent hover:text-accent"
              )}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filtered.map((p) => (
            <article
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="group rounded-2xl overflow-hidden border bg-card glow-on-hover flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-accent/60"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={p.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"}
                  alt={p.title[lang] || p.title.en}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4">
                  <span className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6 flex flex-col flex-1">
                <div className="text-[10px] sm:text-xs font-semibold text-accent uppercase tracking-wider mb-1 sm:mb-2">{p.industry}</div>
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                  {p.title[lang] || p.title.en}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
                  {p.desc[lang] || p.desc.en}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <ProjectDetailDialog
        project={selectedProject}
        open={Boolean(selectedProject)}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
      />
    </div>
  );
}
