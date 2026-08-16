import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { industries as defaultIndustriesData } from "@/data/site";

export type IndustryItem = {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  image: string;
  description_en?: string;
  description_ar?: string;
  active: boolean;
  sort_order: number;
};

// Initial fallback mapped from default static list
const initialFallback: IndustryItem[] = defaultIndustriesData.map((d, index) => ({
  id: `default-${d.slug}`,
  slug: d.slug,
  title_en: d.title.en,
  title_ar: d.title.ar,
  image: d.image,
  active: true,
  sort_order: index,
}));

type Ctx = {
  industries: IndustryItem[];
  loading: boolean;
  upsert: (item: Partial<IndustryItem> & { id?: string }) => Promise<IndustryItem | null>;
  remove: (id: string) => Promise<void>;
  move: (id: string, dir: -1 | 1) => Promise<void>;
  refresh: () => Promise<void>;
};

const IndustriesContext = createContext<Ctx | null>(null);

const db = supabase as any;

export function IndustriesProvider({ children }: { children: ReactNode }) {
  const [industries, setIndustries] = useState<IndustryItem[]>(initialFallback);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data, error } = await db
        .from("industries")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("[industries] table query fallback to default", error.message);
      } else if (data && data.length > 0) {
        setIndustries(data as IndustryItem[]);
      }
    } catch (err) {
      console.warn("[industries] fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel("industries_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "industries" }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const upsert: Ctx["upsert"] = async (item) => {
    const isNew = !item.id || item.id.startsWith("default-");
    const payload = {
      slug: item.slug || (item.title_en ? item.title_en.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `industry-${Date.now()}`),
      title_en: item.title_en ?? "",
      title_ar: item.title_ar ?? "",
      image: item.image ?? "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=800&q=80",
      description_en: item.description_en ?? "",
      description_ar: item.description_ar ?? "",
      active: item.active ?? true,
      sort_order: item.sort_order ?? industries.length,
      ...(!isNew ? { id: item.id } : {}),
    };

    try {
      const { data, error } = await db.from("industries").upsert(payload).select().single();
      if (error) {
        console.error("[industries] upsert error", error);
        // Fallback state update for immediate local feedback
        const updated = isNew
          ? [...industries, { ...payload, id: `local-${Date.now()}` }]
          : industries.map((i) => (i.id === item.id ? { ...i, ...payload } : i));
        setIndustries(updated);
        return { ...payload, id: item.id || `local-${Date.now()}` } as IndustryItem;
      }
      await refresh();
      return data as IndustryItem;
    } catch (err) {
      console.error("[industries] save failed", err);
      return null;
    }
  };

  const remove: Ctx["remove"] = async (id) => {
    try {
      const { error } = await db.from("industries").delete().eq("id", id);
      if (error) {
        console.warn("[industries] delete db error, filtering locally", error.message);
      }
      setIndustries((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("[industries] remove failed", err);
    }
  };

  const move: Ctx["move"] = async (id, dir) => {
    const sorted = [...industries].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((p) => p.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;

    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];

    const updated = sorted.map((item, index) => ({
      ...item,
      sort_order: index,
    }));
    setIndustries(updated);

    try {
      const updates = [
        { id: sorted[idx].id, sort_order: idx },
        { id: sorted[swapIdx].id, sort_order: swapIdx },
      ];
      await db.from("industries").upsert(updates);
    } catch (err) {
      console.warn("[industries] move reorder sync error", err);
    }
  };

  return (
    <IndustriesContext.Provider value={{ industries, loading, upsert, remove, move, refresh }}>
      {children}
    </IndustriesContext.Provider>
  );
}

export function useIndustries() {
  const ctx = useContext(IndustriesContext);
  if (!ctx) throw new Error("useIndustries must be used within IndustriesProvider");
  return ctx;
}
