import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Layers, Workflow, Building2, Search, Sparkles, ExternalLink, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSolutions, getSolutionIcon, type SolutionRow } from "@/lib/solutions-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { title: "Solutions — Integrated Technics" },
      { name: "description", content: "Comprehensive integrated ICT, physical security, cloud, and networking solutions engineered for enterprise excellence." },
    ],
  }),
  component: SolutionsLayout,
});

function SolutionsLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId !== "/solutions" && m.routeId.startsWith("/solutions"));
  if (isChild) return <Outlet />;
  return <SolutionsIndex />;
}

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]*>?/gm, "").trim();
}

function SolutionsIndex() {
  const { lang, t } = useI18n();
  const isAr = lang === "ar";
  const { solutions, loading } = useSolutions();
  const [search, setSearch] = useState("");

  const activeSolutions = solutions.filter((s) => s.active !== false);

  const filtered = activeSolutions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (isAr ? s.name_ar : s.name_en).toLowerCase();
    const bio = stripHtml(isAr ? s.bio_ar : s.bio_en).toLowerCase();
    return name.includes(q) || bio.includes(q) || s.slug.toLowerCase().includes(q);
  });

  return (
    <div className="bg-background relative overflow-hidden min-h-screen">
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden pointer-events-none">
        <div className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[130px] mix-blend-screen opacity-60 dark:opacity-40" />
        <div className="absolute top-[10%] -right-[10%] w-[45%] h-[45%] rounded-full bg-accent/20 blur-[130px] mix-blend-screen opacity-60 dark:opacity-40" />
      </div>

      {/* Hero Header */}
      <section className="relative pt-12 lg:pt-20 pb-12 lg:pb-16 border-b border-border/50 bg-background/50 backdrop-blur-xs overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="container mx-auto px-4 lg:px-8 relative z-10 text-center max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest mb-5"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{isAr ? "الحلول المتكاملة" : "Enterprise Solutions"}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-foreground font-display"
          >
            {isAr ? (
              <>منظومات تقنية وهندسية <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">متكاملة</span></>
            ) : (
              <>End-to-End Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Solutions</span></>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8"
          >
            {isAr
              ? "تصميم وتنفيذ وتشغيل منظومات البنية التحتية، الأمن السيبراني، المراقبة الذكية ومراكز البيانات بأعلى معايير الجودة والاعتمادية العالمية."
              : "Turnkey enterprise integration spanning cyber defense, intelligent networking, optical surveillance, and next-generation data center infrastructure."}
          </motion.p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="max-w-md mx-auto relative"
          >
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "ابحث عن حل أو تقنية أو منظومة..." : "Search solutions, architectures, or modules..."}
              className="ps-10 h-11 bg-background/80 backdrop-blur-md rounded-xl border-border/80 shadow-sm"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Solutions Grid Section */}
      <section className="container mx-auto px-4 lg:px-8 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border bg-card/50 p-6 h-80 animate-pulse flex flex-col justify-between">
                <div className="h-44 bg-muted rounded-xl" />
                <div className="h-6 bg-muted rounded w-3/4 mt-4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border rounded-2xl bg-card/30">
            <Layers className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">{isAr ? "لا توجد نتائج مطابقة" : "No solutions found"}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "جرب البحث بكلمات أخرى أو تصفح القائمة الكاملة." : "Try adjusting your search criteria."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filtered.map((sol, idx) => (
              <motion.div
                key={sol.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="group relative rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden hover:border-accent/60 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between"
              >
                {/* Image Banner */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-muted">
                  <img
                    src={sol.image || "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=1200&q=80"}
                    alt={isAr ? sol.name_ar : sol.name_en}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

                  <div className="absolute top-4 start-4">
                    <Badge className="bg-background/80 backdrop-blur-md text-foreground border shadow-sm font-mono text-xs">
                      #{idx + 1}
                    </Badge>
                  </div>

                  <div className="absolute bottom-4 start-6 end-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-display drop-shadow-xs">
                      {isAr ? sol.name_ar || sol.name_en : sol.name_en}
                    </h2>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3">
                    {stripHtml(isAr ? sol.bio_ar || sol.bio_en : sol.bio_en)}
                  </p>

                  {/* Related Sub-Solutions Pills */}
                  {sol.related_solutions && sol.related_solutions.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Workflow className="h-3.5 w-3.5 text-accent" />
                        <span>{isAr ? "الأنظمة والحلول الفرعية المشمولة:" : "Key Sub-Architectures & Modules:"}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sol.related_solutions.slice(0, 4).map((rel) => {
                          const IconComp = getSolutionIcon(rel.icon);
                          return (
                            <div
                              key={rel.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border text-xs font-medium"
                            >
                              <IconComp className="h-3.5 w-3.5 text-accent shrink-0" />
                              <span className="truncate">{isAr ? rel.title_ar || rel.title_en : rel.title_en}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Technology Partners / Vendors */}
                  {sol.vendors && sol.vendors.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-purple-500" />
                        <span>{isAr ? "الشركاء والمصنعين المعتمدين:" : "Technology Vendors & OEMs:"}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {sol.vendors.map((v) => (
                          <div
                            key={v.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs font-semibold shadow-2xs"
                          >
                            {v.logo && (
                              <img src={v.logo} alt={v.name} className="h-3.5 w-auto max-w-[50px] object-contain" />
                            )}
                            <span>{v.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-4 pt-4 border-t mt-auto">
                    <Button asChild size="default" className="w-full sm:w-auto gap-2 shadow-sm">
                      <Link to="/solutions/$slug" params={{ slug: sol.slug }}>
                        <span>{isAr ? "استكشف تفاصيل الحل" : "Explore Solution Architecture"}</span>
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
