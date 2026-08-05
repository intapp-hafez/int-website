import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SlideRow = {
  id: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  cta_en: string;
  cta_ar: string;
  href: string;
  image: string;
  active: boolean;
  sort_order: number;
};

type Ctx = {
  slides: SlideRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  upsert: (s: Partial<SlideRow> & { id?: string }) => Promise<SlideRow | null>;
  remove: (id: string) => Promise<void>;
};

const SlidesContext = createContext<Ctx | null>(null);

export function SlidesProvider({ children }: { children: ReactNode }) {
  const [slides, setSlides] = useState<SlideRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("homepage_slides")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[slides] load failed", error);
    } else {
      setSlides((data ?? []) as SlideRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const upsert: Ctx["upsert"] = async (s) => {
    const payload = {
      title_en: s.title_en ?? "",
      title_ar: s.title_ar ?? "",
      subtitle_en: s.subtitle_en ?? "",
      subtitle_ar: s.subtitle_ar ?? "",
      cta_en: s.cta_en ?? "",
      cta_ar: s.cta_ar ?? "",
      href: s.href ?? "/",
      image: s.image ?? "/placeholder.svg",
      active: s.active ?? true,
      sort_order: s.sort_order ?? 0,
      ...(s.id ? { id: s.id } : {}),
    };
    const { data, error } = await supabase
      .from("homepage_slides")
      .upsert(payload)
      .select()
      .single();
    if (error) {
      console.error("[slides] save failed", error);
      throw error;
    }
    await refresh();
    return data as SlideRow;
  };

  const remove: Ctx["remove"] = async (id) => {
    const { error } = await supabase.from("homepage_slides").delete().eq("id", id);
    if (error) {
      console.error("[slides] delete failed", error);
      throw error;
    }
    await refresh();
  };

  return (
    <SlidesContext.Provider value={{ slides, loading, refresh, upsert, remove }}>
      {children}
    </SlidesContext.Provider>
  );
}

export function useSlides() {
  const ctx = useContext(SlidesContext);
  if (!ctx) throw new Error("useSlides must be used within SlidesProvider");
  return ctx;
}