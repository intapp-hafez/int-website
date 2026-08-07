import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { useNews } from "@/lib/news-store";
import { Calendar, ArrowRight, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Countdown } from "@/components/ui/countdown";

export const Route = createFileRoute("/news/")({
  head: () => ({ meta: [{ title: "News — Integrated Technics" }, { name: "description", content: "Updates from our projects, alliances and recognitions." }] }),
  component: NewsPage,
});

function NewsPage() {
  const { t, lang, dir } = useI18n();
  const { posts } = useNews();
  const locale = lang === "ar" ? "ar" : "en-US";
  const isRtl = dir === "rtl";

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [visible, setVisible] = useState(9);

  const active = useMemo(() => posts.filter((p) => p.active), [posts]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    active.forEach((p) => {
      const key = (lang === "ar" ? p.category_ar : p.category_en).trim();
      if (key) map.set(key.toLowerCase(), key);
    });
    return Array.from(map.values()).sort();
  }, [active, lang]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() + 86_400_000 : null;
    return active.filter((p) => {
      const cAr = (p.category_ar || "").toLowerCase();
      const cEn = (p.category_en || "").toLowerCase();
      if (cat !== "all" && cAr !== cat && cEn !== cat) return false;
      const ts = new Date(p.published_at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts >= toTs) return false;
      if (qq) {
        const hay = [p.title_en, p.title_ar, p.excerpt_en, p.excerpt_ar, p.category_en, p.category_ar].join(" ").toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [active, q, cat, from, to]);

  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > shown.length;
  const clearAll = () => { setQ(""); setCat("all"); setFrom(""); setTo(""); setVisible(9); };
  const anyFilter = q || cat !== "all" || from || to;

  return (
    <div>
      <section className="gradient-surface relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="container mx-auto px-4 lg:px-8 pt-16 md:pt-24 pb-8 relative">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Newsroom</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{t("news.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{t("news.sub")}</p>
        </div>
      </section>
      <Section className="!pt-8 !md:pt-12">
        {active.length === 0 ? (
          <p className="text-center text-muted-foreground">{lang === "ar" ? "لا توجد أخبار بعد." : "No news yet."}</p>
        ) : (
          <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
            {/* Filters */}
            <div className="rounded-2xl border bg-card p-4 grid gap-3 md:grid-cols-12">
              <div className="md:col-span-4 relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRtl ? "right-3" : "left-3"}`} />
                <Input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setVisible(9); }}
                  placeholder={lang === "ar" ? "ابحث في الأخبار..." : "Search news..."}
                  className={isRtl ? "pr-9" : "pl-9"}
                />
              </div>
              <div className="md:col-span-3">
                <Select value={cat} onValueChange={(v) => { setCat(v); setVisible(9); }}>
                  <SelectTrigger><SelectValue placeholder={lang === "ar" ? "الفئة" : "Category"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{lang === "ar" ? "كل الفئات" : "All categories"}</SelectItem>
                    {categories.map((c) => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setVisible(9); }} aria-label={lang === "ar" ? "من" : "From"} />
              </div>
              <div className="md:col-span-2">
                <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setVisible(9); }} aria-label={lang === "ar" ? "إلى" : "To"} />
              </div>
              <div className="md:col-span-1 flex">
                <Button variant="outline" onClick={clearAll} disabled={!anyFilter} className="w-full" title={lang === "ar" ? "مسح" : "Clear"}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {lang === "ar"
                ? `عرض ${shown.length} من ${filtered.length}`
                : `Showing ${shown.length} of ${filtered.length}`}
            </p>

            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{lang === "ar" ? "لا توجد نتائج مطابقة." : "No matching results."}</p>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shown.map((n) => (
                    <Link to="/news/$slug" params={{ slug: n.slug }} key={n.id} className="group p-0 rounded-2xl border bg-card overflow-hidden glow-on-hover flex flex-col">
                      {n.image_url && (
                        <div className="aspect-[16/10] overflow-hidden bg-muted relative">
                          <img src={n.image_url} alt={lang === "ar" ? n.title_ar : n.title_en} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          {(n.category_en || "").toLowerCase() === "events" && new Date(n.published_at).getTime() > Date.now() && (
                            <Countdown date={n.published_at} />
                          )}
                        </div>
                      )}
                      <div className={`p-6 flex flex-col flex-1 ${isRtl ? "text-right" : "text-left"}`}>
                        {(lang === "ar" ? n.category_ar : n.category_en) && (
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-2">{lang === "ar" ? n.category_ar : n.category_en}</div>
                        )}
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mb-2"><Calendar className="h-3.5 w-3.5" />{new Date(n.published_at).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}</div>
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-accent transition-colors">{lang === "ar" ? n.title_ar : n.title_en}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{lang === "ar" ? n.excerpt_ar : n.excerpt_en}</p>
                        <span className="mt-auto text-sm font-medium text-accent inline-flex items-center gap-1 group-hover:gap-2 transition-all">{lang === "ar" ? "اقرأ المزيد" : "Read more"} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" /></span>
                      </div>
                    </Link>
                  ))}
                </div>
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={() => setVisible((v) => v + 9)}>
                      {lang === "ar" ? "تحميل المزيد" : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
