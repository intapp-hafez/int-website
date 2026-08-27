import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Section } from "@/components/site/Section";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { VendorBadgesOverlay } from "@/components/site/VendorBadgesOverlay";
import type { Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { useCarouselAutoplay } from "@/hooks/use-carousel-autoplay";

export function FeaturedProducts() {
  const { lang, dir } = useI18n();
  const isRtl = dir === "rtl";
  const [items, setItems] = useState<Product[]>([]);
  const { autoplayRef, containerRef } = useCarouselAutoplay(4000);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("active", true).eq("featured", true).order("sort_order").limit(12);
      setItems((data as any[]) ?? []);
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <Section eyebrow={lang === "ar" ? "متجرنا" : "Products"} title={lang === "ar" ? "منتجات مميزة" : "Featured Products"} sub={lang === "ar" ? "أبرز منتجاتنا المختارة" : "Our most popular integrated solutions"} center>
      <Carousel
        ref={containerRef}
        opts={{ loop: items.length > 4, align: "start", direction: isRtl ? "rtl" : "ltr" }}
        plugins={[autoplayRef.current]}
        className="relative"
        tabIndex={0}
        aria-label={lang === "ar" ? "منتجات مميزة" : "Featured products carousel"}
      >
        <CarouselContent className="-ms-2">
          {items.map((p, idx) => {
            const name = (lang === "ar" ? p.name_ar : p.name_en) || p.name_en;
            const cat = (lang === "ar" ? p.category_ar : p.category_en) || p.category_en;
            const vendors = (p.vendors || []).filter((v) => v && (v.logo || v.name));

            return (
              <CarouselItem
                key={p.id}
                className="ps-2 basis-full md:basis-1/2 lg:basis-1/4"
                aria-label={`${name} (${idx + 1} ${lang === "ar" ? "من" : "of"} ${items.length})`}
              >
                <Link to="/products/$slug" params={{ slug: p.slug }} className="group rounded-2xl overflow-hidden border bg-card glow-on-hover block h-full shadow-xs hover:shadow-md transition-all duration-300">
                  <div className="aspect-square bg-muted overflow-hidden relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground"><ShoppingBag className="h-8 w-8" /></div>
                    )}

                    {/* Vendors Logo on image bottom center with interactive hover popups */}
                    <VendorBadgesOverlay vendors={p.vendors} max={8} size="md" />
                  </div>
                  <div className="p-4">
                    {cat && <div className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-1">{cat}</div>}
                    <h3 className="text-sm font-semibold line-clamp-2 mb-1 group-hover:text-accent transition-colors">{name}</h3>
                  </div>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious
          className="-start-3 hidden md:flex"
          aria-label={lang === "ar" ? "المنتج السابق" : "Previous product"}
        />
        <CarouselNext
          className="-end-3 hidden md:flex"
          aria-label={lang === "ar" ? "المنتج التالي" : "Next product"}
        />
      </Carousel>
      <div className="text-center mt-8">
        <Button asChild variant="outline"><Link to="/products">{lang === "ar" ? "زر المتجر" : "Visit shop"} <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" /></Link></Button>
      </div>
    </Section>
  );
}
