import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Section } from "@/components/site/Section";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, ShoppingBag, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/")({
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
  const [maxPrice, setMaxPrice] = useState<string>("");

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
    const max = maxPrice ? Number(maxPrice) : Infinity;
    return products.filter(p => {
      if (featuredOnly && !p.featured) return false;
      if (cat !== "all") {
        const c = lang === "ar" ? p.category_ar : p.category_en;
        if (c !== cat) return false;
      }
      if (term) {
        const n = (lang === "ar" ? p.name_ar : p.name_en) || "";
        if (!n.toLowerCase().includes(term) && !p.sku.toLowerCase().includes(term)) return false;
      }
      if (p.price != null && p.price > max) return false;
      return true;
    });
  }, [products, q, cat, featuredOnly, maxPrice, lang]);

  return (
    <Section eyebrow="Shop" title={lang === "ar" ? "المتجر" : "Shop"} sub={lang === "ar" ? "تصفح منتجاتنا المتكاملة" : "Browse our integrated products"}>
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-4 lg:sticky lg:top-28 h-fit">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "بحث" : "Search"}</label>
            <div className="relative mt-1">
              <Search className="h-4 w-4 absolute start-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="ps-8" value={q} onChange={ev => setQ(ev.target.value)} placeholder={lang === "ar" ? "ابحث…" : "Search…"} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "الفئة" : "Category"}</label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "ar" ? "الكل" : "All"}</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "السعر الأقصى" : "Max price"}</label>
            <Input type="number" min={0} value={maxPrice} onChange={ev => setMaxPrice(ev.target.value)} className="mt-1" />
          </div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={featuredOnly} onCheckedChange={setFeaturedOnly} /> {lang === "ar" ? "المميزة فقط" : "Featured only"}</label>
        </aside>

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
  const { add } = useCart();
  const isAr = lang === "ar";
  const name = (lang === "ar" ? p.name_ar : p.name_en) || p.name_en;
  const cat = (lang === "ar" ? p.category_ar : p.category_en) || p.category_en;
  const inStock = p.stock_status === "in_stock";
  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(p, 1);
    toast.success(isAr ? "تمت إضافة المنتج إلى السلة" : "Added to cart");
  };
  return (
    <Link to="/shop/$slug" params={{ slug: p.slug }} className="group rounded-2xl overflow-hidden border bg-card glow-on-hover block relative">
      <button
        type="button"
        onClick={onAdd}
        disabled={!inStock}
        aria-label={isAr ? "أضف إلى السلة" : "Add to cart"}
        title={isAr ? "أضف إلى السلة" : "Add to cart"}
        className="absolute top-2 end-2 z-10 h-9 w-9 inline-flex items-center justify-center rounded-full bg-background/90 backdrop-blur border shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="h-4 w-4" />
      </button>
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
        {p.price != null && <div className="text-sm font-medium">{p.price} {p.currency}</div>}
      </div>
    </Link>
  );
}