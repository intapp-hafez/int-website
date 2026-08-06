import { Link } from "@tanstack/react-router";
import { Calendar, ArrowRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { useNews } from "@/lib/news-store";

export function LatestNews() {
  const { t, lang, dir } = useI18n();
  const { posts } = useNews();
  const active = posts.filter((p) => p.active);
  if (active.length === 0) return null;

  const featured = active.find((p) => p.featured) ?? active[0];
  const rest = active.filter((p) => p.id !== featured.id).slice(0, 3);
  const locale = lang === "ar" ? "ar" : "en-US";
  const fmt = (d: string) => new Date(d).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
  const isRtl = dir === "rtl";

  return (
    <Section eyebrow="Newsroom" title={t("news.title")} sub={t("news.sub")}>
      <div className="grid lg:grid-cols-2 gap-5 sm:gap-7" dir={isRtl ? "rtl" : "ltr"}>
        {/* Large featured card */}
        <Link
          to="/news/$slug"
          params={{ slug: featured.slug }}
          className={`group relative overflow-hidden rounded-3xl border bg-card glow-on-hover h-full flex flex-col ${isRtl ? "lg:order-2" : "lg:order-1"}`}
        >
          <div className="relative aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto overflow-hidden bg-muted">
            {featured.image_url ? (
              <img
                src={featured.image_url}
                alt={(lang === "ar" ? featured.title_ar : featured.title_en) || featured.title_en}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : null}
          </div>
          <div className={`absolute inset-x-0 bottom-0 p-5 sm:p-7 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white ${isRtl ? "text-right" : "text-left"}`}>
            {(lang === "ar" ? featured.category_ar : featured.category_en) && (
              <span className="inline-block text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent text-accent-foreground mb-3">
                {lang === "ar" ? featured.category_ar : featured.category_en}
              </span>
            )}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 line-clamp-2">
              {lang === "ar" ? featured.title_ar : featured.title_en}
            </h3>
            <p className="text-sm sm:text-base opacity-90 line-clamp-2 mb-3">
              {lang === "ar" ? featured.excerpt_ar : featured.excerpt_en}
            </p>
            <div className="flex items-center gap-3 text-xs sm:text-sm opacity-90">
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmt(featured.published_at)}</span>
              <span className="inline-flex items-center gap-1 font-medium group-hover:gap-2 transition-all">
                {t("cta.learn")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </span>
            </div>
          </div>
        </Link>

        {/* Three smaller cards stacked on the opposite side */}
        <div className={`flex flex-col gap-4 sm:gap-5 ${isRtl ? "lg:order-1" : "lg:order-2"}`}>
          {rest.map((p) => (
            <Link
              key={p.id}
              to="/news/$slug"
              params={{ slug: p.slug }}
              className="group flex gap-4 p-3 sm:p-4 rounded-2xl border bg-card glow-on-hover"
            >
              <div className="shrink-0 w-28 sm:w-36 aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                {p.image_url ? (
                  <img src={p.image_url} alt={lang === "ar" ? p.title_ar : p.title_en} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : null}
              </div>
              <div className={`min-w-0 flex-1 ${isRtl ? "text-right" : "text-left"}`}>
                {(lang === "ar" ? p.category_ar : p.category_en) && (
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-accent mb-1">
                    {lang === "ar" ? p.category_ar : p.category_en}
                  </div>
                )}
                <h4 className="text-sm sm:text-base font-semibold mb-1 line-clamp-2 group-hover:text-accent transition-colors">
                  {lang === "ar" ? p.title_ar : p.title_en}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {lang === "ar" ? p.excerpt_ar : p.excerpt_en}
                </p>
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>{fmt(p.published_at)}</span>
                  <span className="mx-1 opacity-50">·</span>
                  <span className="inline-flex items-center gap-1 text-accent font-medium group-hover:gap-2 transition-all">
                    {lang === "ar" ? "اقرأ" : t("cta.learn")} <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          {lang === "ar" ? "عرض الكل" : "View all"} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>
    </Section>
  );
}