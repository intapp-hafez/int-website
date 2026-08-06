import { createFileRoute, Link, useParams } from "@tanstack/react-router";

import { useEffect } from "react";
import { Calendar, ArrowLeft } from "lucide-react";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { useNews } from "@/lib/news-store";

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
    </div>
  );
}