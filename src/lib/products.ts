export type Product = {
  id: string;
  slug: string;
  sku: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  category_en: string;
  category_ar: string;
  price: number | null;
  currency: string;
  image_url: string;
  gallery: string[];
  stock_status: string;
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
  slug: "", sku: "",
  name_en: "", name_ar: "",
  description_en: "", description_ar: "",
  category_en: "", category_ar: "",
  price: null, currency: "USD",
  image_url: "", gallery: [],
  stock_status: "in_stock",
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

export const STOCK_OPTIONS = [
  { value: "in_stock", en: "In stock", ar: "متوفر" },
  { value: "out_of_stock", en: "Out of stock", ar: "غير متوفر" },
  { value: "preorder", en: "Pre-order", ar: "طلب مسبق" },
] as const;