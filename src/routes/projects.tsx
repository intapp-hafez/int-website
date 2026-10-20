import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  ExternalLink,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  Maximize2,
  X
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useProjects, type Project } from "@/lib/projects-store";
import { cn } from "@/lib/utils";
import { ProjectDetailDialog } from "@/components/site/ProjectDetailDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Clientele, Projects References & Gallery — Integrated Technics" },
      {
        name: "description",
        content: "Turnkey engineering references across government, banking, airports, smart cities, luxury hospitality and gated communities.",
      },
    ],
  }),
  component: ProjectsPage,
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function parseScopeItems(desc: string): string[] {
  if (desc.includes("•")) {
    return desc.split("•").map((s) => s.trim()).filter(Boolean);
  }
  if (desc.includes(" - ")) {
    return desc.split(" - ").map((s) => s.trim()).filter(Boolean);
  }
  return [desc];
}

const INDUSTRY_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  All: { en: "All Sectors", ar: "جميع القطاعات" },
  "Smart Cities": { en: "Smart Cities", ar: "المدن الذكية" },
  Government: { en: "Government & Sovereign", ar: "الجهات الحكومية والسيادية" },
  Banking: { en: "Banking & Finance", ar: "البنوك والمؤسسات المالية" },
  "Aviation & Transport": { en: "Aviation & Transport", ar: "المطارات والنقل" },
  Hospitality: { en: "Hospitality & Resorts", ar: "الضيافة والمنتجعات" },
  Residential: { en: "Residential & Compounds", ar: "المجمعات السكنية" },
  "Research & Education": { en: "Research & Education", ar: "الأبحاث والتعليم" },
};

export default function ProjectsPage() {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";
  const { items: projects, loading } = useProjects();
  const [filter, setFilter] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [clienteleModalOpen, setClienteleModalOpen] = useState(false);

  const activeProjects = useMemo(() => projects.filter((p) => p.active === true), [projects]);

  const industries = useMemo(() => {
    const set = new Set(activeProjects.map((p) => p.industry).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [activeProjects]);

  const filtered = filter === "All" ? activeProjects : activeProjects.filter((p) => p.industry === filter);

  return (
    <div className="bg-background relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[130px] mix-blend-screen opacity-50" />
        <div className="absolute top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#E8722C]/20 blur-[130px] mix-blend-screen opacity-50" />
      </div>

      {/* Hero Header */}
      <section className="relative pt-14 lg:pt-20 pb-12 lg:pb-16 border-b border-border/50 bg-background overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="container mx-auto px-4 lg:px-8 relative z-10 text-center max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8722C]/10 border border-[#E8722C]/30 text-[#E8722C] text-xs font-bold uppercase tracking-wider mb-6 shadow-sm"
          >
            <Briefcase className="h-3.5 w-3.5" />
            {isAr ? "العملاء والمشاريع المرجعية والمعرض" : "Clientele, Projects References & Gallery"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8 }}
            className={`text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-foreground ${
              isAr ? "leading-[1.35] sm:leading-[1.25]" : ""
            }`}
          >
            {isAr ? (
              <>
                سجل المشاريع{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#E8722C] to-accent">
                  والإنجازات الهندسية المرجعية
                </span>
              </>
            ) : (
              <>
                Prestigious References &{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#E8722C] to-accent">
                  Engineering Showcase
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed"
          >
            {isAr
              ? "نخبة من المشاريع القومية والسيادية، المطارات، البنوك المركزية، والمدن الذكية المنفذة بأعلى معايير الجودة والاعتماد العالمي."
              : "A showcase of turnkey security, ICT, BMS and audiovisual infrastructure delivered for Egypt's top government ministries, central banks, and mega-cities."}
          </motion.p>
        </motion.div>
      </section>

      {/* Clientele Gallery Showcase Section */}
      <section className="py-12 bg-muted/20 border-b border-border/40 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E8722C] uppercase tracking-wider mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  {isAr ? "قائمة الشركاء والعملاء الاستراتيجيين" : "Trusted By Leading Enterprise Clients"}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {isAr ? "عملاؤنا وسجل الثقة والاعتماد" : "Our Clientele Wall & Reference Network"}
                </h2>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setClienteleModalOpen(true)}
                className="gap-2 border-[#E8722C]/40 text-foreground hover:border-[#E8722C] hover:bg-[#E8722C]/10 self-start md:self-auto"
              >
                <Maximize2 className="h-4 w-4 text-[#E8722C]" />
                <span>{isAr ? "تكبير معرض العملاء" : "Expand Clientele Wall"}</span>
              </Button>
            </div>

            {/* Clientele Banner Card with signature orange border and live animated hover beam */}
            <div
              onClick={() => setClienteleModalOpen(true)}
              className="relative group cursor-pointer rounded-2xl overflow-hidden bg-card border-2 border-[#E8722C] shadow-[0_4px_28px_rgba(232,114,44,0.14)] p-4 sm:p-6 transition-all duration-300 hover:shadow-[0_8px_36px_rgba(232,114,44,0.22)]"
            >
              {/* Live animated border beam on hover */}
              <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                <span className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#E8722C_85%,transparent_100%)] opacity-80" />
              </div>

              <div className="relative z-10 bg-background/90 backdrop-blur-sm rounded-xl p-3 sm:p-5 flex flex-col items-center justify-center">
                <img
                  src="/projects/clientele-wall.png"
                  alt="Integrated Technics Clientele"
                  className="w-full max-h-[380px] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted-foreground border-t border-border/60 pt-4 w-full">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-[#E8722C]" />
                    {isAr ? "+150 عميل استراتيجي" : "150+ Enterprise Clients"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Award className="h-4 w-4 text-[#E8722C]" />
                    {isAr ? "مؤسسات سيادية وبنوك كبرى" : "Sovereign Ministries & Tier-1 Banks"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Layers className="h-4 w-4 text-[#E8722C]" />
                    {isAr ? "+350 مشروع متكامل منجز" : "350+ Turnkey Deliveries"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="py-6 bg-background/80 backdrop-blur-md sticky top-16 z-20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar justify-center flex-wrap">
            {industries.map((ind) => {
              const label = INDUSTRY_TRANSLATIONS[ind]
                ? (isAr ? INDUSTRY_TRANSLATIONS[ind].ar : INDUSTRY_TRANSLATIONS[ind].en)
                : ind;

              const count = ind === "All"
                ? activeProjects.length
                : activeProjects.filter((p) => p.industry === ind).length;

              return (
                <button
                  key={ind}
                  onClick={() => setFilter(ind)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-all whitespace-nowrap flex items-center gap-2",
                    filter === ind
                      ? "bg-[#E8722C] text-white border-[#E8722C] font-semibold shadow-md shadow-[#E8722C]/20"
                      : "bg-card border-border/60 hover:border-[#E8722C]/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{label}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                      filter === ind ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="relative z-10 bg-background">
        {loading ? (
          <div className="py-24 text-center text-muted-foreground">
            <div className="animate-spin h-8 w-8 border-2 border-[#E8722C] border-t-transparent rounded-full mx-auto mb-4" />
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
            const scopeBullets = parseScopeItems(plainDesc);
            const isEven = idx % 2 === 0;

            const industryLabel = INDUSTRY_TRANSLATIONS[p.industry]
              ? (isAr ? INDUSTRY_TRANSLATIONS[p.industry].ar : INDUSTRY_TRANSLATIONS[p.industry].en)
              : p.industry;

            return (
              <section key={p.id} className={`py-16 lg:py-20 ${isEven ? "bg-background" : "bg-muted/20"}`}>
                <div className="container mx-auto px-4 lg:px-8">
                  <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Image Column with solid orange border and live animated border beam on hover */}
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      onClick={() => setSelectedProject(p)}
                      className={`relative rounded-3xl overflow-hidden cursor-pointer group border-2 border-[#E8722C] shadow-[0_4px_24px_rgba(232,114,44,0.14)] aspect-[4/3] ${
                        !isEven ? "lg:order-last" : ""
                      }`}
                    >
                      {/* Live animated border beam on hover */}
                      <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden z-20">
                        <span className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#E8722C_85%,transparent_100%)] opacity-80" />
                      </div>

                      <div className="relative z-10 w-full h-full overflow-hidden bg-muted">
                        <img
                          src={p.image || "/projects/alamein.jpg"}
                          alt={title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-50 transition-opacity" />

                        {/* Floating Industry Badge */}
                        <div className="absolute bottom-5 left-5 lg:bottom-6 lg:left-6 px-4 py-2 bg-background/90 backdrop-blur-md rounded-xl border border-[#E8722C]/40 shadow-lg flex items-center gap-2 text-foreground font-semibold text-xs group-hover:-translate-y-1 transition-all duration-300">
                          <Building2 className="h-4 w-4 text-[#E8722C]" />
                          <span>{industryLabel}</span>
                        </div>

                        {/* Hover Action Badge */}
                        <div className="absolute top-5 right-5 h-11 w-11 rounded-full bg-[#E8722C] text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <ExternalLink className="h-5 w-5" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Text Details Column */}
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? 40 : -40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
                      className="flex flex-col justify-center max-w-xl mx-auto lg:mx-0"
                    >
                      <div className="inline-flex items-center gap-2 text-[#E8722C] font-semibold text-xs uppercase tracking-wider mb-3">
                        <span className="h-2 w-2 rounded-full bg-[#E8722C]"></span>
                        {String(idx + 1).padStart(2, "0")} • {industryLabel}
                      </div>

                      <h2
                        onClick={() => setSelectedProject(p)}
                        className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-5 text-foreground tracking-tight cursor-pointer hover:text-[#E8722C] transition-colors"
                      >
                        {title}
                      </h2>

                      {/* Scope highlights as executive bullet tags */}
                      <div className="space-y-2 mb-6">
                        {scopeBullets.slice(0, 4).map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-[#E8722C] shrink-0 mt-0.5" />
                            <span className="leading-snug">{bullet}</span>
                          </div>
                        ))}
                        {scopeBullets.length > 4 && (
                          <div className="text-xs font-semibold text-[#E8722C] pt-1">
                            +{scopeBullets.length - 4} {isAr ? "أنظمة إضافية منفذة في هذا المشروع" : "more specialized systems integrated"}
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <Button
                          onClick={() => setSelectedProject(p)}
                          className="inline-flex items-center justify-center gap-2 px-7 py-5 rounded-full bg-[#E8722C] hover:bg-[#d0621f] text-white font-bold shadow-lg shadow-[#E8722C]/25 transition-all hover:-translate-y-0.5 group text-sm"
                        >
                          <span>{isAr ? "عرض النطاق الهندسي الكامل" : "View Full Case Study"}</span>
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

      {/* Clientele Modal Lightbox */}
      <AnimatePresence>
        {clienteleModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setClienteleModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full bg-card rounded-2xl border-2 border-[#E8722C] shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#E8722C]" />
                  <h3 className="text-lg font-bold text-foreground">
                    {isAr ? "معرض عملاء وشركاء التقنيات المتكاملة" : "Integrated Technics Clientele Gallery"}
                  </h3>
                </div>
                <button
                  onClick={() => setClienteleModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-6 overflow-y-auto flex items-center justify-center">
                <img
                  src="/projects/clientele-wall.png"
                  alt="Integrated Technics Clientele Full Wall"
                  className="w-full object-contain max-h-[70vh] rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>{isAr ? "مصدر البيانات: الموقع الرسمي لشركة التقنيات المتكاملة" : "Source: Official Integrated Technics Reference Portfolio"}</span>
                <Button size="sm" onClick={() => setClienteleModalOpen(false)} className="bg-[#E8722C] hover:bg-[#d0621f] text-white">
                  {isAr ? "إغلاق" : "Close"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Detail Modal */}
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
