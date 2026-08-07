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
    
    let fetched = (data ?? []) as NewsPost[];
    
    // Global Mock Data if database is empty
    if (fetched.length === 0) {
      fetched = [
        { id: "1", slug: "mock-1", title_en: "Annual Tech Conference 2026", title_ar: "المؤتمر التقني السنوي 2026", excerpt_en: "Join us for the biggest tech conference in the region.", excerpt_ar: "انضم إلينا في أكبر مؤتمر تقني في المنطقة.", body_en: "<p>Full details about the upcoming conference.</p>", body_ar: "<p>تفاصيل كاملة حول المؤتمر القادم.</p>", category_en: "Events", category_ar: "فعاليات", published_at: new Date(Date.now() + 86400000 * 5).toISOString(), image_url: "https://images.unsplash.com/photo-1540575467063-118a5b11644d?w=800&q=80", featured: true, active: true } as any,
        { id: "2", slug: "mock-2", title_en: "Cybersecurity Summit", title_ar: "قمة الأمن السيبراني", excerpt_en: "A deep dive into the future of cyber defense.", excerpt_ar: "نظرة متعمقة في مستقبل الدفاع السيبراني.", body_en: "<p>Experts gather to discuss emerging threats.</p>", body_ar: "<p>يجتمع الخبراء لمناقشة التهديدات الناشئة.</p>", category_en: "Events", category_ar: "فعاليات", published_at: new Date(Date.now() + 86400000 * 12).toISOString(), image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80", featured: false, active: true } as any,
        { id: "3", slug: "mock-3", title_en: "Smart Cities Expo", title_ar: "معرض المدن الذكية", excerpt_en: "Exploring the infrastructure of tomorrow.", excerpt_ar: "استكشاف البنية التحتية للمستقبل.", body_en: "<p>Showcasing our smart city solutions.</p>", body_ar: "<p>عرض حلولنا للمدن الذكية.</p>", category_en: "Events", category_ar: "فعاليات", published_at: new Date(Date.now() + 86400000 * 30).toISOString(), image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&q=80", featured: false, active: true } as any,
        { id: "4", slug: "mock-4", title_en: "Data Center Expansion", title_ar: "توسعة مركز البيانات", excerpt_en: "Our tier 3 data center has been expanded significantly.", excerpt_ar: "تمت توسعة مركز البيانات الخاص بنا بشكل كبير.", body_en: "<p>Expansion details...</p>", body_ar: "<p>تفاصيل التوسعة...</p>", category_en: "News", category_ar: "أخبار", published_at: new Date(Date.now() - 86400000 * 3).toISOString(), image_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80", featured: false, active: true } as any
      ];
    }
    
    setPosts(fetched);
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