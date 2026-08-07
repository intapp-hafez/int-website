import { createFileRoute, Link, useParams } from "@tanstack/react-router";

import { useEffect, useMemo } from "react";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { useNews } from "@/lib/news-store";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Countdown } from "@/components/ui/countdown";

export const Route = createFileRoute("/news/$slug")({
  head: () => ({ meta: [{ title: "News — Integrated Technics" }] }),
  component: NewsDetailsPage,
});

function NewsDetailsPage() {
  const { slug } = useParams({ from: "/news/$slug" });
  const { lang } = useI18n();
  const { posts, loading } = useNews();
  const post = posts.find((p) => p.slug === slug);
  const locale = lang === "ar" ? "ar" : "en-US";
  const isRtl = lang === "ar";

  const related = useMemo(() => {
    if (!post) return [];
    const allActive = posts.filter((p) => p.active && p.slug !== slug);
    let r = allActive.filter((p) => p.category_en === post.category_en || p.category_ar === post.category_ar);
    if (r.length < 3) {
      const others = allActive.filter((p) => !r.includes(p));
      r = [...r, ...others];
    }
    return r.slice(0, 6);
  }, [posts, post, slug]);

  // Per-post SEO overrides (title + description + canonical og:image)
  useEffect(() => {
    if (!post || typeof document === "undefined") return;
    const t =
      (lang === "ar" ? post.seo_title_ar : post.seo_title_en) ||
      (lang === "ar" ? post.title_ar : post.title_en);
    const d =
      (lang === "ar" ? post.seo_description_ar : post.seo_description_en) ||
      (lang === "ar" ? post.excerpt_ar : post.excerpt_en);
    if (t) document.title = t;
    const upsert = (attr: "name" | "property", k: string, v: string) => {
      if (!v) return;
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${k}"][data-news="1"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, k); el.setAttribute("data-news", "1"); document.head.appendChild(el); }
      el.setAttribute("content", v);
    };
    upsert("name", "description", d);
    upsert("property", "og:title", t);
    upsert("property", "og:description", d);
    if (post.image_url) upsert("property", "og:image", post.image_url);
    return () => { document.head.querySelectorAll('meta[data-news="1"]').forEach((n) => n.remove()); };
  }, [post, lang]);

  if (loading) {
    return <div className="container mx-auto px-4 lg:px-8 py-24 text-center text-muted-foreground">…</div>;
  }
  if (!post) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-bold mb-3">{lang === "ar" ? "المقال غير موجود" : "Article not found"}</h1>
        <Link to="/news" className="text-accent inline-flex items-center gap-1.5"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{lang === "ar" ? "العودة إلى الأخبار" : "Back to news"}</Link>
      </div>
    );
  }
  const title = lang === "ar" ? post.title_ar : post.title_en;
  const excerpt = lang === "ar" ? post.excerpt_ar : post.excerpt_en;
  const body = lang === "ar" ? post.body_ar : post.body_en;
  const category = lang === "ar" ? post.category_ar : post.category_en;
  const isHtml = /<[a-z][\s\S]*>/i.test(body || "");

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 md:py-20 max-w-7xl">
      <Link to="/news" className="text-sm text-accent inline-flex items-center gap-1.5 mb-8 hover:underline">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />{lang === "ar" ? "كل الأخبار" : "All news"}
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Side: Image */}
        {post.image_url && (
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-3xl overflow-hidden border bg-muted/20">
              <img src={post.image_url} alt={title} className="w-full h-auto aspect-[4/3] object-cover" />
            </div>
          </div>
        )}

        {/* Right Side: Contents */}
        <div className={post.image_url ? "lg:col-span-7" : "lg:col-span-12"}>
          {category && (
            <div className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">{category}</div>
          )}
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">{title}</h1>
          
          <div className="text-sm text-muted-foreground inline-flex items-center gap-1.5 mb-10 pb-8 border-b w-full">
            <Calendar className="h-4 w-4" />
            {new Date(post.published_at).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
          </div>

          <article>
            {excerpt && <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium">{excerpt}</p>}
            
            {isHtml ? (
              <div
                className="prose prose-neutral dark:prose-invert max-w-none text-[17px] leading-[1.9] [&_p]:mb-6 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-6 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-4 [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:mb-6 [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:mb-6 [&_blockquote]:border-s-4 [&_blockquote]:border-accent [&_blockquote]:ps-6 [&_blockquote]:italic [&_blockquote]:my-8 [&_blockquote]:text-xl [&_blockquote]:text-muted-foreground [&_a]:text-accent [&_a]:underline hover:[&_a]:text-accent/80 [&_hr]:my-10"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : (
              <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-[17px] leading-[1.9]">
                {body}
              </div>
            )}
          </article>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20 pt-16 border-t">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">{lang === "ar" ? "أخبار ذات صلة" : "Related News"}</h2>
            <Link to="/news" className="text-accent text-sm font-medium hover:underline inline-flex items-center gap-1">
              {lang === "ar" ? "عرض الكل" : "View all"} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
          <Carousel opts={{ align: "start", direction: isRtl ? "rtl" : "ltr" }} className="w-full">
            <CarouselContent className="-ml-4">
              {related.map((n) => (
                <CarouselItem key={n.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Link to="/news/$slug" params={{ slug: n.slug }} className="group p-0 rounded-2xl border bg-card overflow-hidden glow-on-hover flex flex-col h-full">
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
                      <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mb-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(n.published_at).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-accent transition-colors">{lang === "ar" ? n.title_ar : n.title_en}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{lang === "ar" ? n.excerpt_ar : n.excerpt_en}</p>
                      <span className="mt-auto text-sm font-medium text-accent inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        {lang === "ar" ? "اقرأ المزيد" : "Read more"} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                      </span>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-end gap-2 mt-6">
              <CarouselPrevious className="static translate-y-0 h-10 w-10" />
              <CarouselNext className="static translate-y-0 h-10 w-10" />
            </div>
          </Carousel>
        </div>
      )}
    </div>
  );
}