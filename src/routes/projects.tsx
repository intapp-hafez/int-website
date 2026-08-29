import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, ExternalLink, Building2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useProjects, type Project } from "@/lib/projects-store";
import { cn } from "@/lib/utils";
import { ProjectDetailDialog } from "@/components/site/ProjectDetailDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Integrated Technics" },
      { name: "description", content: "Selected case studies across telecom, government, oil & gas, hospitality and manufacturing." },
    ],
  }),
  component: ProjectsPage,
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function ProjectsPage() {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";
  const { items: projects, loading } = useProjects();
  const [filter, setFilter] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const activeProjects = useMemo(() => projects.filter((p) => p.active === true), [projects]);
  const industries = useMemo(
    () => ["All", ...Array.from(new Set(activeProjects.map((p) => p.industry).filter(Boolean)))],
    [activeProjects]
  );
  const filtered = filter === "All" ? activeProjects : activeProjects.filter((p) => p.industry === filter);

  return (
    <div className="bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] mix-blend-screen opacity-50"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 lg:pt-16 pb-12 lg:pb-16 border-b border-border/50 bg-background overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="container mx-auto px-4 lg:px-8 relative z-10 text-center max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Briefcase className="h-3.5 w-3.5" />
            {isAr ? "دراسات الحالة والمشاريع" : "Case Studies & Projects"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className={`text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-foreground ${
              isAr ? "leading-[1.4] sm:leading-[1.3]" : ""
            }`}
          >
            {isAr ? (
              <>
                سجل حافل من{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  المشاريع والإنجازات الهندسيّة
                </span>
              </>
            ) : (
              <>
                Featured{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Engineering Projects
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-medium"
          >
            {t("projects.sub")}
          </motion.p>
        </motion.div>
      </section>

      {/* Filter Tabs */}
      <div className="py-8 bg-muted/20 border-b border-border/40 sticky top-16 z-20 backdrop-blur-md bg-background/80">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar justify-center flex-wrap">
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setFilter(ind)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-all whitespace-nowrap",
                  filter === ind
                    ? "bg-accent text-accent-foreground border-accent font-semibold shadow-sm"
                    : "bg-card border-border/60 hover:border-accent/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {ind === "All" ? (isAr ? "جميع القطاعات" : "All Industries") : ind}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Per-Card Per-Row List (Matching Services Layout) */}
      <div className="relative z-10 bg-background">
        {loading ? (
          <div className="py-24 text-center text-muted-foreground">
            <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p>{isAr ? "جارٍ تحميل المشاريع..." : "Loading projects..."}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            <p>{isAr ? "لا توجد مشاريع مطابقة حالياً." : "No projects match the selected filter."}</p>
          </div>
        ) : (
          filtered.map((p, idx) => {
            const title = p.title[lang] || p.title.en || "Project";
            const rawDesc = p.desc[lang] || p.desc.en || "";
            const plainDesc = stripHtml(rawDesc);
            const isEven = idx % 2 === 0;

            return (
              <section key={p.id} className={`py-16 lg:py-24 ${isEven ? "bg-background" : "bg-muted/30"}`}>
                <div className="container mx-auto px-4 lg:px-8">
                  <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Image Column */}
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      onClick={() => setSelectedProject(p)}
                      className={`relative rounded-3xl overflow-hidden shadow-2xl shadow-black/5 aspect-[4/3] group cursor-pointer ${
                        !isEven ? "lg:order-last" : ""
                      }`}
                    >
                      <img
                        src={p.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity"></div>

                      {/* Floating Industry Badge */}
                      <div className="absolute bottom-6 left-6 lg:bottom-8 lg:left-8 px-4 py-2.5 bg-background/90 backdrop-blur-md rounded-2xl border border-border shadow-lg flex items-center gap-2 text-foreground font-semibold text-xs group-hover:-translate-y-1 transition-all duration-300">
                        <Building2 className="h-4 w-4 text-accent" />
                        <span>{p.industry}</span>
                      </div>

                      {/* Hover Action Badge */}
                      <div className="absolute top-6 right-6 h-12 w-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ExternalLink className="h-5 w-5" />
                      </div>
                    </motion.div>

                    {/* Text Column */}
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      className="flex flex-col justify-center max-w-xl mx-auto lg:mx-0"
                    >
                      <div className="inline-flex items-center gap-2 text-accent font-semibold text-sm mb-4">
                        <span className="h-1.5 w-6 rounded-full bg-accent"></span>
                        {String(idx + 1).padStart(2, "0")} • {p.industry}
                      </div>

                      <h2
                        onClick={() => setSelectedProject(p)}
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-foreground tracking-tight cursor-pointer hover:text-accent transition-colors"
                      >
                        {title}
                      </h2>

                      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                        {plainDesc}
                      </p>

                      <div>
                        <Button
                          onClick={() => setSelectedProject(p)}
                          className="inline-flex items-center justify-center gap-2 px-8 py-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 group text-base"
                        >
                          <span>{isAr ? "عرض تفاصيل المشروع" : "View Case Study"}</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform" />
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>

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
