import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { usePartners } from "@/lib/partners-store";
import { SmartLogo } from "@/components/ui/smart-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowRight, Sparkles, ShieldCheck, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/partners/")({
  head: () => ({
    meta: [
      { title: "Technology Partners & Alliances — Integrated Technics" },
      { name: "description", content: "Certified enterprise partner of the world's leading technology and security vendors." }
    ]
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const { t, lang, dir } = useI18n();
  const { partners, loading } = usePartners();
  const isAr = lang === "ar";

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "featured">("all");

  // Deduplicate partners by normalized name (e.g. merge "Dell" and "Dell Technologies")
  const dedupedList = useMemo(() => {
    const map = new Map<string, typeof partners[0]>();
    for (const p of partners) {
      if (!p.active) continue;
      // Normalize key to catch duplicate vendor entries
      const key = (p.name_en || "")
        .toLowerCase()
        .replace(/technologies|systems|security/g, "")
        .trim();

      if (!map.has(key) || (!map.get(key)!.featured && p.featured)) {
        map.set(key, p);
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const fa = a.featured ? 1 : 0;
      const fb = b.featured ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return a.sort_order - b.sort_order;
    });
  }, [partners]);

  // Filter by search query & tab
  const filteredList = useMemo(() => {
    return dedupedList.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (p.name_en || "").toLowerCase().includes(q) ||
        (p.name_ar || "").toLowerCase().includes(q);

      const matchTab = filterTab === "all" || (filterTab === "featured" && p.featured);

      return matchSearch && matchTab;
    });
  }, [dedupedList, search, filterTab]);

  return (
    <div dir={dir} className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-surface border-b border-border/40">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className={`absolute ${isAr ? "-left-32" : "-right-32"} -top-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl`} />

        <div className={`container mx-auto px-4 lg:px-8 pt-16 pb-14 relative ${isAr ? "text-right" : "text-left"}`}>
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-semibold text-xs mb-4">
            <ShieldCheck className="h-4 w-4" />
            <span>{isAr ? "المنظومة التقنية العالمية" : "Global Technology Alliances"}</span>
          </div>

          {/* Heading */}
          <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${isAr ? "font-arabic leading-[1.3]" : ""}`}>
            {isAr ? "شركاء التكنولوجيا" : "Technology Partners"}
          </h1>

          {/* Subtitle */}
          <p className={`text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed ${isAr ? "font-arabic leading-loose ms-auto" : ""}`}>
            {isAr
              ? "شريك معتمد واستراتيجي لأبرز الشركات العالمية في مجالات البنية التحتية، الشبكات، الأمن والمراقبة الذكية، والأنظمة المدمجة."
              : "Authorized and strategic integration partner with leading global hardware, networking, and enterprise security manufacturers."}
          </p>

          {/* Search & Filter Toolbar */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 max-w-3xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className={`absolute ${isAr ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "ابحث باسم الشريك أو المزود..." : "Search partner or vendor name..."}
                className={`w-full bg-card/90 backdrop-blur border-border/80 h-11 text-sm rounded-xl focus:border-accent ${
                  isAr ? "pr-10 pl-4" : "pl-10 pr-4"
                }`}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-card border border-border/70 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === "all"
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isAr ? `الكل (${dedupedList.length})` : `All (${dedupedList.length})`}
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("featured")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  filterTab === "featured"
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>{isAr ? "الاستراتيجيون" : "Strategic"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Partners Grid */}
      <section className="container mx-auto px-4 lg:px-8 py-12">
        {/* Results Count Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <span>
              {isAr
                ? `عرض ${filteredList.length} شريك معتمد`
                : `Displaying ${filteredList.length} verified vendors`}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            <span>{isAr ? "عقود توزيع وتكامل رسمي" : "Official Integration & Distribution Agreements"}</span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-[2px] bg-border/40">
                <div className="rounded-[14px] bg-card p-5 h-64 flex flex-col justify-between">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-border bg-card/50 max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {isAr ? "لم نجد نتائج مطابقة" : "No Partners Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {isAr
                ? `لم يتم العثور على شركاء يطابقون "${search}". جرب البحث بكلمة أخرى.`
                : `We couldn't find any partners matching "${search}". Try clearing your search.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilterTab("all");
              }}
              className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors"
            >
              {isAr ? "إعادة ضبط البحث" : "Clear Filters"}
            </button>
          </div>
        ) : (
          /* Partners Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredList.map((p) => {
              const displayName = (isAr ? p.name_ar : p.name_en) || p.name_en || p.name_ar;

              return (
                <Link key={p.id} to="/partners/$id" params={{ id: p.id }} className="block group/link">
                  <div className="group/item relative rounded-2xl p-[2px] bg-accent transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-accent/25 overflow-hidden h-full flex flex-col">
                    {/* Live Animated Border Beam on hover */}
                    <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_200deg,rgba(255,255,255,0.95)_300deg,#FFA066_335deg,var(--electric)_360deg)] opacity-0 group-hover/item:opacity-100 group-hover/item:animate-border-beam transition-opacity duration-300 pointer-events-none" />

                    {/* Card Inner Content */}
                    <div className="relative z-10 w-full h-full rounded-[14px] bg-card p-5 sm:p-6 flex flex-col items-center justify-between text-center flex-1">
                      {/* Top status bar: Strategic badge + Sparkle */}
                      <div className="w-full flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                          <span>
                            {p.featured
                              ? (isAr ? "شريك استراتيجي" : "Strategic Partner")
                              : (isAr ? "شريك معتمد" : "Authorized Partner")}
                          </span>
                        </span>

                        {p.featured && (
                          <span className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Sparkles className="h-3.5 w-3.5 fill-amber-400" />
                          </span>
                        )}
                      </div>

                      {/* Logo Canvas: Full width, zero inside border, clean background */}
                      <div className="w-full h-28 sm:h-32 rounded-xl bg-white dark:bg-white/5 px-3 py-3 flex items-center justify-center transition-all duration-300">
                        <SmartLogo
                          src={p.logo}
                          alt={displayName}
                          name={displayName}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Vendor Info */}
                      <div className="mt-4 w-full flex flex-col items-center flex-1 justify-center">
                        <h3 className="text-base sm:text-lg font-display font-bold text-foreground group-hover/item:text-accent transition-colors line-clamp-1">
                          {displayName}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {isAr
                            ? "حلول وتكامل هندسي معتمد للمشاريع الحيوية والمؤسسات الكبرى"
                            : "Certified engineering and deployment for mission-critical enterprise environments"}
                        </p>
                      </div>

                      {/* Action Link Footer */}
                      <div className="mt-4 pt-3 border-t border-border/50 w-full flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover/item:text-accent transition-colors">
                        <span>{isAr ? "تفاصيل الشراكة" : "View Partnership"}</span>
                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180 transition-transform group-hover/item:translate-x-1 rtl:group-hover/item:-translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
