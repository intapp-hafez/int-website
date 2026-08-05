import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NewsPost = {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  excerpt_en: string;
  excerpt_ar: string;
  body_en: string;
  body_ar: string;
  category_en: string;
  category_ar: string;
  image_url: string;
  published_at: string;
  active: boolean;
  featured: boolean;
  sort_order: number;
  seo_title_en: string;
  seo_title_ar: string;
  seo_description_en: string;
  seo_description_ar: string;
};

type Ctx = {
  posts: NewsPost[];
  loading: boolean;
  refresh: () => Promise<void>;
  upsert: (p: Partial<NewsPost> & { id?: string }) => Promise<NewsPost | null>;
  remove: (id: string) => Promise<void>;
};

const NewsContext = createContext<Ctx | null>(null);

function slugify(s: string) {
  return (s || "post")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `post-${Date.now()}`;
}

export function NewsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("news_posts")
      .select("*")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false });
    if (error) console.error("[news] load failed", error);
    else setPosts((data ?? []) as NewsPost[]);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const upsert: Ctx["upsert"] = async (p) => {
    const baseSlug = p.slug?.trim() || slugify(p.title_en || p.title_ar || "post");
    const payload: any = {
      slug: baseSlug,
      title_en: p.title_en ?? "",
      title_ar: p.title_ar ?? "",
      excerpt_en: p.excerpt_en ?? "",
      excerpt_ar: p.excerpt_ar ?? "",
      body_en: p.body_en ?? "",
      body_ar: p.body_ar ?? "",
      category_en: p.category_en ?? "",
      category_ar: p.category_ar ?? "",
      image_url: p.image_url ?? "",
      published_at: p.published_at ?? new Date().toISOString(),
      active: p.active ?? true,
      featured: p.featured ?? false,
      sort_order: p.sort_order ?? 0,
      seo_title_en: p.seo_title_en ?? "",
      seo_title_ar: p.seo_title_ar ?? "",
      seo_description_en: p.seo_description_en ?? "",
      seo_description_ar: p.seo_description_ar ?? "",
    };
    if (p.id) payload.id = p.id;
    const { data, error } = await supabase.from("news_posts").upsert(payload).select().single();
    if (error) { console.error("[news] save failed", error); throw error; }
    await refresh();
    return data as NewsPost;
  };

  const remove: Ctx["remove"] = async (id) => {
    const { error } = await supabase.from("news_posts").delete().eq("id", id);
    if (error) { console.error("[news] delete failed", error); throw error; }
    await refresh();
  };

  return (
    <NewsContext.Provider value={{ posts, loading, refresh, upsert, remove }}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used within NewsProvider");
  return ctx;
}