import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Section } from "@/components/site/Section";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { toast } from "sonner";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Shop — Integrated Technics" },
      { name: "description", content: "Browse our catalog of integrated systems products." },
      { property: "og:title", content: "Shop — Integrated Technics" },
      { property: "og:description", content: "Browse our catalog of integrated systems products." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { lang } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("active", true).order("sort_order").order("created_at", { ascending: false });
      setProducts((data as any[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      const c = lang === "ar" ? p.category_ar : p.category_en;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [products, lang]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter(p => {
      if (featuredOnly && !p.featured) return false;
      if (cat !== "all") {
        const c = lang === "ar" ? p.category_ar : p.category_en;
        if (c !== cat) return false;
      }
      if (term) {
        const n = (lang === "ar" ? p.name_ar : p.name_en) || "";
        if (!n.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [products, q, cat, featuredOnly, lang]);

  return (
    <Section eyebrow="Products" title={lang === "ar" ? "المنتجات" : "Products"} sub={lang === "ar" ? "تصفح منتجاتنا المتكاملة" : "Browse our integrated products"}>
      <div className="space-y-8">
        {/* Category Tabs */}
        {!loading && categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 justify-center">
            <button
              onClick={() => setCat("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                cat === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {lang === "ar" ? "الكل" : "All"}
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div>
          {loading ? <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div> :
           filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />
              {lang === "ar" ? "لا توجد منتجات مطابقة." : "No products match your filters."}
            </div>
           ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
           )}
        </div>
      </div>
    </Section>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { lang } = useI18n();
  const name = (lang === "ar" ? p.name_ar : p.name_en) || p.name_en;
  const cat = (lang === "ar" ? p.category_ar : p.category_en) || p.category_en;

  return (
    <Link to="/products/$slug" params={{ slug: p.slug }} className="group rounded-2xl overflow-hidden border bg-card glow-on-hover block relative">
      <div className="aspect-square bg-muted overflow-hidden">
        {p.image_url ? (
          <img src={p.image_url} alt={name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground"><ShoppingBag className="h-8 w-8" /></div>
        )}
      </div>
      <div className="p-4">
        {cat && <div className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-1">{cat}</div>}
        <h3 className="text-sm font-semibold line-clamp-2 mb-1">{name}</h3>
      </div>
    </Link>
  );
}
