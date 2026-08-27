import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VendorItem = {
  id: string;
  name: string;
  logo: string;
  website_url?: string;
};

export type Product = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  category_en: string;
  category_ar: string;
  image_url: string;
  gallery: string[];
  vendors?: VendorItem[];
  featured: boolean;
  active: boolean;
  sort_order: number;
  meta_title_en?: string | null;
  meta_title_ar?: string | null;
  meta_description_en?: string | null;
  meta_description_ar?: string | null;
  meta_keywords?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const emptyProduct: Omit<Product, "id"> = {
  slug: "",
  name_en: "", name_ar: "",
  description_en: "", description_ar: "",
  category_en: "", category_ar: "",
  image_url: "", gallery: [],
  vendors: [],
  featured: false, active: true, sort_order: 0,
  meta_title_en: "", meta_title_ar: "",
  meta_description_en: "", meta_description_ar: "",
  meta_keywords: "", og_image: "", canonical_url: "",
};

export function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Throws an Error listing all missing AR/EN pairs. */
export function assertBilingualPairs(pairs: Array<{ en: string; ar: string; label: string }>) {
  const missing: string[] = [];
  for (const p of pairs) {
    const e = String(p.en ?? "").trim();
    const a = String(p.ar ?? "").trim();
    if (!e && !a) missing.push(`${p.label} (EN+AR)`);
    else if (!e) missing.push(`${p.label} (EN)`);
    else if (!a) missing.push(`${p.label} (AR)`);
  }
  if (missing.length) throw new Error("Required bilingual fields missing: " + missing.join(", "));
}

export type ProductCategory = {
  id: string;
  name_en: string;
  name_ar: string;
};

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("product_categories" as any).select("*").order("name_en")
      .then(({ data }) => {
        if (data) setCategories(data as any as ProductCategory[]);
        setLoading(false);
      });
  }, []);

  return { categories, loading };
}