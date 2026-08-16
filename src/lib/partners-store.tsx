import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export const defaultPartnersData: PartnerRow[] = [
  {
    id: "default-cisco",
    name_en: "Cisco Systems",
    name_ar: "سيسكو",
    logo: "https://cdn.simpleicons.org/cisco/005073",
    href: "https://www.cisco.com",
    active: true,
    sort_order: 0,
    featured: true,
  },
  {
    id: "default-dell",
    name_en: "Dell Technologies",
    name_ar: "ديل تكنولوجيز",
    logo: "https://cdn.simpleicons.org/dell/0076CE",
    href: "https://www.dell.com",
    active: true,
    sort_order: 1,
    featured: true,
  },
  {
    id: "default-fortinet",
    name_en: "Fortinet",
    name_ar: "فورتينت",
    logo: "https://cdn.simpleicons.org/fortinet/EE3124",
    href: "https://www.fortinet.com",
    active: true,
    sort_order: 2,
    featured: true,
  },
  {
    id: "default-schneider",
    name_en: "Schneider Electric",
    name_ar: "شنايدر إلكتريك",
    logo: "https://cdn.simpleicons.org/schneiderelectric/3DCD58",
    href: "https://www.se.com",
    active: true,
    sort_order: 3,
    featured: true,
  },
  {
    id: "default-hikvision",
    name_en: "Hikvision",
    name_ar: "هيكفيجن",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Hikvision_logo.svg/800px-Hikvision_logo.svg.png",
    href: "https://www.hikvision.com",
    active: true,
    sort_order: 4,
    featured: true,
  },
  {
    id: "default-dahua",
    name_en: "Dahua Technology",
    name_ar: "داهوا تكنولوجي",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Dahua_Technology_logo.svg/800px-Dahua_Technology_logo.svg.png",
    href: "https://www.dahuasecurity.com",
    active: true,
    sort_order: 5,
    featured: true,
  },
  {
    id: "default-axis",
    name_en: "Axis Communications",
    name_ar: "أكسيس كوميونيكيشنز",
    logo: "https://cdn.simpleicons.org/axiscommunications/FFD200",
    href: "https://www.axis.com",
    active: true,
    sort_order: 6,
    featured: false,
  },
  {
    id: "default-bosch",
    name_en: "Bosch Security",
    name_ar: "بوش للأنظمة الأمنية",
    logo: "https://cdn.simpleicons.org/bosch/EA001F",
    href: "https://www.boschsecurity.com",
    active: true,
    sort_order: 7,
    featured: false,
  },
  {
    id: "default-honeywell",
    name_en: "Honeywell",
    name_ar: "هانيويل",
    logo: "https://cdn.simpleicons.org/honeywell/EE3124",
    href: "https://www.honeywell.com",
    active: true,
    sort_order: 8,
    featured: false,
  },
  {
    id: "default-hpe",
    name_en: "HPE Aruba Networking",
    name_ar: "إتش بي إي أروبا",
    logo: "https://cdn.simpleicons.org/hp/0096D6",
    href: "https://www.arubanetworks.com",
    active: true,
    sort_order: 9,
    featured: false,
  },
  {
    id: "default-commscope",
    name_en: "CommScope",
    name_ar: "كومسكوب",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/CommScope_Logo.svg/800px-CommScope_Logo.svg.png",
    href: "https://www.commscope.com",
    active: true,
    sort_order: 10,
    featured: false,
  },
  {
    id: "default-panduit",
    name_en: "Panduit",
    name_ar: "باندويت",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Panduit_logo.svg/800px-Panduit_logo.svg.png",
    href: "https://www.panduit.com",
    active: true,
    sort_order: 11,
    featured: false,
  },
  {
    id: "default-legrand",
    name_en: "Legrand",
    name_ar: "ليجراند",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Legrand_logo.svg/800px-Legrand_logo.svg.png",
    href: "https://www.legrand.com",
    active: true,
    sort_order: 12,
    featured: false,
  },
  {
    id: "default-vmware",
    name_en: "VMware by Broadcom",
    name_ar: "في إم وير",
    logo: "https://cdn.simpleicons.org/vmware/607078",
    href: "https://www.vmware.com",
    active: true,
    sort_order: 13,
    featured: false,
  },
];

type Ctx = {
  partners: PartnerRow[];
  loading: boolean;
  upsert: (p: Partial<PartnerRow> & { id?: string }) => Promise<PartnerRow | null>;
  remove: (id: string) => Promise<void>;
  move: (id: string, dir: -1 | 1) => Promise<void>;
  refresh: () => Promise<void>;
};

const PartnersContext = createContext<Ctx | null>(null);

const db = supabase as any;

export function PartnersProvider({ children }: { children: ReactNode }) {
  const [partners, setPartners] = useState<PartnerRow[]>(defaultPartnersData);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data, error } = await db
        .from("partners")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("[partners] load failed, using fallback:", error.message);
      } else if (data && data.length > 0) {
        setPartners(data as PartnerRow[]);
      }
    } catch (err) {
      console.warn("[partners] fetch exception", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel("partners_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "partners" }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const upsert: Ctx["upsert"] = async (p) => {
    const isNew = !p.id || p.id.startsWith("default-");
    const payload = {
      name_en: p.name_en ?? "",
      name_ar: p.name_ar ?? "",
      logo: p.logo ?? "https://cdn.simpleicons.org/cisco/005073",
      href: p.href ?? "",
      active: p.active ?? true,
      sort_order: p.sort_order ?? partners.length,
      featured: p.featured ?? false,
      ...(!isNew ? { id: p.id } : {}),
    };

    try {
      const { data, error } = await db.from("partners").upsert(payload).select().single();
      if (error) {
        console.error("[partners] save error", error);
        const updated = isNew
          ? [...partners, { ...payload, id: `local-${Date.now()}` }]
          : partners.map((item) => (item.id === p.id ? { ...item, ...payload } : item));
        setPartners(updated);
        return { ...payload, id: p.id || `local-${Date.now()}` } as PartnerRow;
      }
      await refresh();
      return data as PartnerRow;
    } catch (err) {
      console.error("[partners] save failed", err);
      return null;
    }
  };

  const remove: Ctx["remove"] = async (id) => {
    setPartners((prev) => prev.filter((item) => item.id !== id));
    try {
      const { error } = await db.from("partners").delete().eq("id", id);
      if (error) console.error("[partners] delete error", error);
      else await refresh();
    } catch (err) {
      console.error("[partners] remove failed", err);
    }
  };

  const move: Ctx["move"] = async (id, dir) => {
    const sorted = [...partners].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((p) => p.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;

    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];

    const updated = sorted.map((item, index) => ({
      ...item,
      sort_order: index,
    }));
    setPartners(updated);

    try {
      const updates = [
        { id: sorted[idx].id, sort_order: idx },
        { id: sorted[swapIdx].id, sort_order: swapIdx },
      ];
      await db.from("partners").upsert(updates);
    } catch (err) {
      console.warn("[partners] move error", err);
    }
  };

  return (
    <PartnersContext.Provider value={{ partners, loading, upsert, remove, move, refresh }}>
      {children}
    </PartnersContext.Provider>
  );
}

export function usePartners() {
  const ctx = useContext(PartnersContext);
  if (!ctx) throw new Error("usePartners must be used within PartnersProvider");
  return ctx;
}