import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Layers } from "lucide-react";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { useServices, getServiceIcon } from "@/lib/services-store";

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
    <div className="bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] mix-blend-screen opacity-50"></div>
      </div>

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
            <Layers className="h-3.5 w-3.5" />
            {t("nav.services")}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className={`text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-foreground ${
              lang === "ar" ? "leading-[1.4] sm:leading-[1.3]" : ""
            }`}
          >
            {lang === "ar" ? (
              <>
                حلول هندسية متكاملة{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  للمهام الحيوية والحرجة
                </span>
              </>
            ) : (
              <>
                Mission-Critical{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Solutions
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
            {t("services.sub")}
          </motion.p>
        </motion.div>
      </section>

      <div className="relative z-10 bg-background">
        {activeServices.map((s, idx) => {
          const Icon = getServiceIcon(s.iconName);
          const title = s.title?.[lang] || s.title?.en || "Service";
          const rawDesc = s.desc?.[lang] || s.desc?.en || "";
          const plainDesc = stripHtml(rawDesc);
          const isEven = idx % 2 === 0;

          return (
            <section key={s.slug} className={`py-16 lg:py-24 ${isEven ? 'bg-background' : 'bg-muted/30'}`}>
              <div className="container mx-auto px-4 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                  
                  {/* Image Column */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`relative rounded-3xl overflow-hidden shadow-2xl shadow-black/5 aspect-[4/3] group ${!isEven ? 'lg:order-last' : ''}`}
                  >
                    {s.image ? (
                      <img 
                        src={s.image} 
                        alt={title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Icon className="h-20 w-20 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent opacity-60"></div>
                    
                    {/* Floating Icon Badge */}
                    <div className="absolute bottom-6 left-6 lg:bottom-8 lg:left-8 h-16 w-16 bg-background/90 backdrop-blur-md rounded-2xl border border-border shadow-lg flex items-center justify-center text-primary group-hover:text-accent group-hover:-translate-y-2 transition-all duration-500">
                      <Icon className="h-8 w-8" />
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
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-foreground tracking-tight">
                      {title}
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                      {plainDesc}
                    </p>
                    
                    <div>
                      <Link
                        to="/services/$slug"
                        params={{ slug: s.slug }}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 group"
                      >
                        {t("cta.learn")} 
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>

                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
