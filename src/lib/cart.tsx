import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import type { Product } from "./products";

export type CartItem = {
  id: string;
  slug: string;
  sku: string;
  name_en: string;
  name_ar: string;
  image_url: string;
  price: number | null;
  currency: string;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  currency: string;
  add: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "it_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, loaded]);

  const add = useCallback((p: Product, qty = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, {
        id: p.id, slug: p.slug, sku: p.sku,
        name_en: p.name_en, name_ar: p.name_ar,
        image_url: p.image_url, price: p.price, currency: p.currency || "USD",
        quantity: qty,
      }];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i));
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotal, currency } = useMemo(() => {
    let c = 0, s = 0;
    const cur = items[0]?.currency || "USD";
    for (const i of items) {
      c += i.quantity;
      if (i.price != null) s += i.price * i.quantity;
    }
    return { count: c, subtotal: s, currency: cur };
  }, [items]);

  return <Ctx.Provider value={{ items, count, subtotal, currency, add, setQty, remove, clear }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}