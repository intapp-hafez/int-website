import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { projects as defaultProjectsData } from "@/data/site";
import { toast } from "sonner";

export type Bilingual = { en: string; ar: string };
export type Project = {
  id: number;
  image: string;
  title: Bilingual;
  industry: string;
  desc: Bilingual;
  active: boolean;
  seo?: {
    metaTitle?: Bilingual;
    metaDescription?: Bilingual;
    keywords?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
};

const getLocalActiveMap = (): Record<number, boolean> => {
  try {
    const raw = localStorage.getItem("it_projects_active_map");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setLocalActive = (id: number, active: boolean) => {
  try {
    const current = getLocalActiveMap();
    current[id] = active;
    localStorage.setItem("it_projects_active_map", JSON.stringify(current));
  } catch {}
};

const getInitialFallback = (): Project[] => {
  const localMap = getLocalActiveMap();
  return defaultProjectsData.map((p, idx) => {
    const id = p.id || (idx + 1);
    const active = localMap[id] !== undefined ? localMap[id] : true;
    return {
      id,
      image: p.image,
      title: { en: p.title.en, ar: p.title.ar },
      industry: p.industry,
      desc: { en: p.desc.en, ar: p.desc.ar },
      active,
    };
  });
};

type Ctx = {
  items: Project[];
  loading: boolean;
  refresh: () => Promise<void>;
  add: (p: Omit<Project, "id">) => Promise<Project | null>;
  update: (id: number, patch: Partial<Project>) => Promise<void>;
  toggleActive: (id: number, active: boolean) => Promise<void>;
  remove: (id: number) => Promise<void>;
  get: (id: number) => Project | undefined;
};

const ProjectsContext = createContext<Ctx | null>(null);

const db = supabase as any;

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Project[]>(getInitialFallback);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const localMap = getLocalActiveMap();
    try {
      const { data, error } = await db
        .from("projects")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.warn("[projects] load failed, using fallback:", error.message);
      } else if (data && data.length > 0) {
        const mapped: Project[] = data.map((d: any, idx: number) => {
          let titleEn = "";
          let titleAr = "";
          if (typeof d.title === "object" && d.title !== null) {
            titleEn = d.title.en || "";
            titleAr = d.title.ar || "";
          } else if (typeof d.title === "string") {
            titleEn = d.title;
            titleAr = d.title;
          }
          if (d.title_en) titleEn = d.title_en;
          if (d.title_ar) titleAr = d.title_ar;

          let descEn = "";
          let descAr = "";
          if (typeof d.desc === "object" && d.desc !== null) {
            descEn = d.desc.en || "";
            descAr = d.desc.ar || "";
          } else if (typeof d.desc === "string") {
            descEn = d.desc;
            descAr = d.desc;
          }
          if (d.desc_en) descEn = d.desc_en;
          if (d.desc_ar) descAr = d.desc_ar;

          const id = Number(d.id) || (idx + 1);
          const active = localMap[id] !== undefined
            ? localMap[id]
            : (d.active !== false && d.active !== 'false' && d.active !== 0);

          return {
            id,
            image: d.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
            title: { en: titleEn || "Untitled Project", ar: titleAr || titleEn || "مشروع بدون عنوان" },
            industry: d.industry || "General",
            desc: { en: descEn || "", ar: descAr || "" },
            active,
            seo: {
              metaTitle: { en: d.meta_title_en || d.seo?.metaTitle?.en || "", ar: d.meta_title_ar || d.seo?.metaTitle?.ar || "" },
              metaDescription: { en: d.meta_description_en || d.seo?.metaDescription?.en || "", ar: d.meta_description_ar || d.seo?.metaDescription?.ar || "" },
              keywords: d.meta_keywords || d.seo?.keywords || "",
              ogImage: d.og_image || d.seo?.ogImage || "",
              canonicalUrl: d.canonical_url || d.seo?.canonicalUrl || "",
            },
          };
        });
        setItems(mapped);
      }
    } catch (err) {
      console.warn("[projects] fetch exception", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel("projects_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const add: Ctx["add"] = async (p) => {
    const payload = {
      image: p.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
      title_en: p.title.en,
      title_ar: p.title.ar,
      industry: p.industry,
      desc_en: p.desc.en,
      desc_ar: p.desc.ar,
      active: p.active !== false,
      meta_title_en: p.seo?.metaTitle?.en,
      meta_title_ar: p.seo?.metaTitle?.ar,
      meta_description_en: p.seo?.metaDescription?.en,
      meta_description_ar: p.seo?.metaDescription?.ar,
      meta_keywords: p.seo?.keywords,
      og_image: p.seo?.ogImage,
      canonical_url: p.seo?.canonicalUrl,
    };
    try {
      const { data, error } = await db.from("projects").insert(payload).select().single();
      if (error) {
        console.error("[projects] add error", error);
        const newItem: Project = { ...p, active: p.active !== false, id: Date.now() };
        setLocalActive(newItem.id, newItem.active);
        setItems((prev) => [newItem, ...prev]);
        toast.success("Project created");
        return newItem;
      }
      await refresh();
      if (data) {
        setLocalActive(Number(data.id), data.active !== false);
        toast.success("Project created");
        return {
          id: Number(data.id),
          image: data.image,
          title: { en: data.title_en, ar: data.title_ar },
          industry: data.industry,
          desc: { en: data.desc_en, ar: data.desc_ar },
          active: data.active !== false,
        };
      }
    } catch (err) {
      console.error("[projects] add failed", err);
    }
    return null;
  };

  const update: Ctx["update"] = async (id, patch) => {
    if (patch.active !== undefined) {
      setLocalActive(id, patch.active);
    }

    const payload: any = {};
    if (patch.image !== undefined) payload.image = patch.image;
    if (patch.title?.en !== undefined) payload.title_en = patch.title.en;
    if (patch.title?.ar !== undefined) payload.title_ar = patch.title.ar;
    if (patch.industry !== undefined) payload.industry = patch.industry;
    if (patch.desc?.en !== undefined) payload.desc_en = patch.desc.en;
    if (patch.desc?.ar !== undefined) payload.desc_ar = patch.desc.ar;
    if (patch.active !== undefined) payload.active = patch.active;
    if (patch.seo?.metaTitle?.en !== undefined) payload.meta_title_en = patch.seo.metaTitle.en;
    if (patch.seo?.metaTitle?.ar !== undefined) payload.meta_title_ar = patch.seo.metaTitle.ar;
    if (patch.seo?.metaDescription?.en !== undefined) payload.meta_description_en = patch.seo.metaDescription.en;
    if (patch.seo?.metaDescription?.ar !== undefined) payload.meta_description_ar = patch.seo.metaDescription.ar;
    if (patch.seo?.keywords !== undefined) payload.meta_keywords = patch.seo.keywords;
    if (patch.seo?.ogImage !== undefined) payload.og_image = patch.seo.ogImage;
    if (patch.seo?.canonicalUrl !== undefined) payload.canonical_url = patch.seo.canonicalUrl;

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch, title: { ...item.title, ...(patch.title ?? {}) }, desc: { ...item.desc, ...(patch.desc ?? {}) } } : item))
    );
    toast.success("Project updated");

    try {
      const { error } = await db.from("projects").update(payload).eq("id", id);
      if (error) console.error("[projects] update error", error);
      else await refresh();
    } catch (err) {
      console.error("[projects] update failed", err);
    }
  };

  const toggleActive: Ctx["toggleActive"] = async (id, active) => {
    setLocalActive(id, active);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, active } : item)));
    toast.success(active ? "Project published to website" : "Project hidden from website");

    try {
      const { error } = await db.from("projects").update({ active }).eq("id", id);
      if (error) console.warn("[projects] toggleActive DB warning:", error.message);
    } catch (err) {
      console.warn("[projects] toggleActive failed", err);
    }
  };

  const remove: Ctx["remove"] = async (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Project deleted");
    try {
      const { error } = await db.from("projects").delete().eq("id", id);
      if (error) console.error("[projects] remove error", error);
      else await refresh();
    } catch (err) {
      console.error("[projects] remove failed", err);
    }
  };

  const get: Ctx["get"] = (id) => items.find((x) => x.id === id);

  return (
    <ProjectsContext.Provider value={{ items, loading, refresh, add, update, toggleActive, remove, get }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}