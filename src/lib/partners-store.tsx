import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { partners as seedPartners } from "@/data/site";

export type PartnerRow = {
  id: string;
  name_en: string;
  name_ar: string;
  logo: string;
  href: string;
  active: boolean;
  sort_order: number;
  featured?: boolean;
};

type Ctx = {
  partners: PartnerRow[];
  loading: boolean;
  upsert: (p: Partial<PartnerRow> & { id?: string }) => Promise<PartnerRow>;
  remove: (id: string) => Promise<void>;
  move: (id: string, dir: -1 | 1) => void;
};

const KEY = "it_partners_v1";
const PartnersContext = createContext<Ctx | null>(null);

function seed(): PartnerRow[] {
  return seedPartners.map((p, i) => ({
    id: `seed-${i}`,
    name_en: p.name,
    name_ar: p.name,
    logo: p.logo,
    href: "",
    active: true,
    sort_order: i,
    featured: false,
  }));
}

export function PartnersProvider({ children }: { children: ReactNode }) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as PartnerRow[];
        setPartners(Array.isArray(parsed) && parsed.length ? parsed : seed());
      } else {
        setPartners(seed());
      }
    } catch {
      setPartners(seed());
    }
    setLoading(false);
  }, []);

  const persist = (next: PartnerRow[]) => {
    setPartners(next);
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const upsert: Ctx["upsert"] = async (p) => {
    const id = p.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `p-${Date.now()}`);
    const existing = partners.find((x) => x.id === id);
    const row: PartnerRow = {
      id,
      name_en: p.name_en ?? existing?.name_en ?? "",
      name_ar: p.name_ar ?? existing?.name_ar ?? "",
      logo: p.logo ?? existing?.logo ?? "/placeholder.svg",
      href: p.href ?? existing?.href ?? "",
      active: p.active ?? existing?.active ?? true,
      sort_order: p.sort_order ?? existing?.sort_order ?? partners.length,
      featured: p.featured ?? existing?.featured ?? false,
    };
    const next = existing
      ? partners.map((x) => (x.id === id ? row : x))
      : [...partners, row];
    next.sort((a, b) => a.sort_order - b.sort_order);
    persist(next);
    return row;
  };

  const remove: Ctx["remove"] = async (id) => {
    persist(partners.filter((p) => p.id !== id));
  };

  const move: Ctx["move"] = (id, dir) => {
    const sorted = [...partners].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((p) => p.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const next = sorted.map((p, i) => ({ ...p, sort_order: i }));
    persist(next);
  };

  return (
    <PartnersContext.Provider value={{ partners, loading, upsert, remove, move }}>
      {children}
    </PartnersContext.Provider>
  );
}

export function usePartners() {
  const ctx = useContext(PartnersContext);
  if (!ctx) throw new Error("usePartners must be used within PartnersProvider");
  return ctx;
}