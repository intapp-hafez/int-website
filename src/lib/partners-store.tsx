import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { partnerDescriptions } from "@/data/partner-descriptions";

export type PartnerRow = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  logo: string;
  href: string;
  active: boolean;
  sort_order: number;
  featured?: boolean;
};

export const defaultPartnersData: PartnerRow[] = [
  {
    id: "default-cisco-systems",
    name_en: "Cisco Systems",
    name_ar: "سيسكو",
    logo: "/partners/cisco-systems.png",
    href: "https://www.cisco.com/",
    active: true,
    sort_order: 0,
    featured: true,
  },
  {
    id: "default-dell",
    name_en: "Dell",
    name_ar: "ديل تكنولوجيز",
    logo: "/partners/dell.jpg",
    href: "https://www.delltechnologies.com/",
    active: true,
    sort_order: 1,
    featured: true,
  },
  {
    id: "default-fortinet",
    name_en: "Fortinet",
    name_ar: "فورتينت",
    logo: "/partners/fortinet.jpg",
    href: "https://www.fortinet.com/",
    active: true,
    sort_order: 2,
    featured: true,
  },
  {
    id: "default-aruba-networks",
    name_en: "Aruba Networks",
    name_ar: "أروبا نتوركس",
    logo: "/partners/aruba-networks.jpg",
    href: "https://www.arubanetworks.com/",
    active: true,
    sort_order: 3,
    featured: true,
  },
  {
    id: "default-h3c",
    name_en: "H3C",
    name_ar: "إتش ثري سي",
    logo: "/partners/h3c.png",
    href: "https://www.h3c.com/en/",
    active: true,
    sort_order: 4,
    featured: false,
  },
  {
    id: "default-ericsson",
    name_en: "Ericsson",
    name_ar: "إريكسون",
    logo: "/partners/ericsson.jpg",
    href: "https://www.ericsson.com/",
    active: true,
    sort_order: 5,
    featured: false,
  },
  {
    id: "default-aviat-networks",
    name_en: "Aviat Networks",
    name_ar: "أفيات نتوركس",
    logo: "/partners/aviat-networks.png",
    href: "https://aviatnetworks.com/",
    active: true,
    sort_order: 6,
    featured: false,
  },
  {
    id: "default-motorola-solutions",
    name_en: "Motorola Solutions",
    name_ar: "موتورولا سوليوشنز",
    logo: "/partners/motorola-solutions.png",
    href: "https://www.motorolasolutions.com/en_xu.html",
    active: true,
    sort_order: 7,
    featured: true,
  },
  {
    id: "default-pelco",
    name_en: "Pelco",
    name_ar: "بيلكو",
    logo: "/partners/pelco.jpg",
    href: "https://www.pelco.com/products/cameras/",
    active: true,
    sort_order: 8,
    featured: false,
  },
  {
    id: "default-avigilon",
    name_en: "Avigilon",
    name_ar: "أفيجيلون",
    logo: "/partners/avigilon.png",
    href: "https://docs.avigilon.com/",
    active: true,
    sort_order: 9,
    featured: true,
  },
  {
    id: "default-halo-smart-sensor",
    name_en: "HALO Smart Sensor",
    name_ar: "مستشعر هالو الذكي",
    logo: "/partners/halo-smart-sensor.png",
    href: "https://halodetect.com/",
    active: true,
    sort_order: 10,
    featured: false,
  },
  {
    id: "default-genetec",
    name_en: "genetec",
    name_ar: "جينيتك",
    logo: "/partners/genetec.jpg",
    href: "https://www.genetec.com/",
    active: true,
    sort_order: 11,
    featured: false,
  },
  {
    id: "default-linev-systems",
    name_en: "LINEV SYSTEMS",
    name_ar: "لينيف سيستمز",
    logo: "/partners/linev-systems.png",
    href: "https://www.linevsystems.com/products/security-x-ray-screening/",
    active: true,
    sort_order: 12,
    featured: false,
  },
  {
    id: "default-ceia",
    name_en: "CEIA",
    name_ar: "سي إي آي إيه",
    logo: "/partners/ceia.png",
    href: "https://www.ceia.net/",
    active: true,
    sort_order: 13,
    featured: false,
  },
  {
    id: "default-hikvision",
    name_en: "Hikvision",
    name_ar: "هيكفيجن",
    logo: "/partners/hikvision.png",
    href: "https://www.hikvision.com/uk/",
    active: true,
    sort_order: 14,
    featured: true,
  },
  {
    id: "default-analogic",
    name_en: "ANALOGIC",
    name_ar: "أنالوجيك",
    logo: "/partners/analogic.png",
    href: "https://www.analogic.com/",
    active: true,
    sort_order: 15,
    featured: false,
  },
  {
    id: "default-milestone-systems",
    name_en: "Milestone Systems",
    name_ar: "مايلستون سيستمز",
    logo: "/partners/milestone-systems.jpg",
    href: "https://www.milestonesys.com/",
    active: true,
    sort_order: 16,
    featured: true,
  },
  {
    id: "default-faac",
    name_en: "FAAC",
    name_ar: "تقنيات فاك",
    logo: "/partners/faac-technology.jpg",
    href: "https://www.faac.co.uk/",
    active: true,
    sort_order: 17,
    featured: false,
  },
  {
    id: "default-ict",
    name_en: "ICT",
    name_ar: "آي سي تي للأمن",
    logo: "/partners/ict.png",
    href: "https://ict.co/",
    active: true,
    sort_order: 18,
    featured: false,
  },
  {
    id: "default-stid",
    name_en: "stid",
    name_ar: "إس تي آي دي",
    logo: "/partners/stid.jpg",
    href: "https://stid-security.com/en/",
    active: true,
    sort_order: 19,
    featured: false,
  },
  {
    id: "default-bas-ip",
    name_en: "BAS-IP",
    name_ar: "باس آي بي",
    logo: "/partners/bas-ip.jpg",
    href: "https://bas-ip.com/",
    active: true,
    sort_order: 20,
    featured: false,
  },
  {
    id: "default-salto-systems",
    name_en: "SALTO Systems",
    name_ar: "سالتو سيستمز",
    logo: "/partners/salto-systems.png",
    href: "https://saltosystems.com/en/",
    active: true,
    sort_order: 21,
    featured: false,
  },
  {
    id: "default-tbs",
    name_en: "TBS",
    name_ar: "تي بي إس للقياسات الحيوية",
    logo: "/partners/tbs.jpg",
    href: "https://tbs-biometrics.com/en/",
    active: true,
    sort_order: 22,
    featured: false,
  },
  {
    id: "default-inner-range",
    name_en: "Inner Range",
    name_ar: "إنر رينج",
    logo: "/partners/inner-range.jpg",
    href: "https://www.innerrange.com/",
    active: true,
    sort_order: 23,
    featured: false,
  },
  {
    id: "default-b-k",
    name_en: "B&K",
    name_ar: "بي آند كيه للأنظمة الأمنية",
    logo: "/partners/b-k.jpg",
    href: "https://bk-securitysystems.com/",
    active: true,
    sort_order: 24,
    featured: false,
  },
  {
    id: "default-secuscan",
    name_en: "Secuscan",
    name_ar: "سيكيوسكان",
    logo: "/partners/secuscan.jpg",
    href: "https://www.secuscan.com/",
    active: true,
    sort_order: 25,
    featured: false,
  },
  {
    id: "default-magnetic",
    name_en: "Magnetic",
    name_ar: "ماجنتيك أوتودور",
    logo: "/partners/magnetic.jpg",
    href: "https://www.magnetic-access.com/en/",
    active: true,
    sort_order: 26,
    featured: false,
  },
  {
    id: "default-hub",
    name_en: "HUB",
    name_ar: "هاب للمواقف الذكية",
    logo: "/partners/hub.jpg",
    href: "https://www.hubparking.com/",
    active: true,
    sort_order: 27,
    featured: false,
  },
  {
    id: "default-herta",
    name_en: "Herta",
    name_ar: "هيرتا سيكيورتي",
    logo: "/partners/herta.jpg",
    href: "https://hertasecurity.com/",
    active: true,
    sort_order: 28,
    featured: false,
  },
  {
    id: "default-tattile",
    name_en: "Tattile",
    name_ar: "تاتيل للرؤية الذكية",
    logo: "/partners/tattile.jpg",
    href: "https://www.tattile.com/",
    active: true,
    sort_order: 29,
    featured: false,
  },
  {
    id: "default-schneider-electric",
    name_en: "Schneider Electric",
    name_ar: "شنايدر إلكتريك",
    logo: "/partners/schneider-electric.jpg",
    href: "https://www.se.com/",
    active: true,
    sort_order: 30,
    featured: true,
  },
  {
    id: "default-iee-sa",
    name_en: "IEE SA",
    name_ar: "آي إي إي",
    logo: "/partners/iee-sa.jpg",
    href: "https://www.iee-sensing.com/",
    active: true,
    sort_order: 31,
    featured: false,
  },
  {
    id: "default-crestron",
    name_en: "Crestron",
    name_ar: "كريسترون",
    logo: "/partners/crestron.png",
    href: "https://www.crestron.com/",
    active: true,
    sort_order: 32,
    featured: true,
  },
  {
    id: "default-toa-electronics",
    name_en: "TOA Electronics",
    name_ar: "تي أو إيه للصوتيات",
    logo: "/partners/toa-electronics.jpg",
    href: "https://www.toaelectronics.com/",
    active: true,
    sort_order: 33,
    featured: false,
  },
  {
    id: "default-absen",
    name_en: "ABSEN",
    name_ar: "أبسن للشاشات",
    logo: "/partners/absen.png",
    href: "https://www.absen.com/",
    active: true,
    sort_order: 34,
    featured: false,
  },
  {
    id: "default-exterity",
    name_en: "exterity",
    name_ar: "إكستيريتي",
    logo: "/partners/exterity.jpg",
    href: "https://www.exterity.com/",
    active: true,
    sort_order: 35,
    featured: false,
  },
  {
    id: "default-biamp",
    name_en: "Biamp",
    name_ar: "بيامب",
    logo: "/partners/biamp.jpg",
    href: "https://www.biamp.com/",
    active: true,
    sort_order: 36,
    featured: false,
  },
  {
    id: "default-barco",
    name_en: "Barco",
    name_ar: "باركو",
    logo: "/partners/barco.jpg",
    href: "https://www.barco.com/",
    active: true,
    sort_order: 37,
    featured: false,
  },
  {
    id: "default-lundhalsey",
    name_en: "LundHalsey",
    name_ar: "لوند هالسي",
    logo: "/partners/lundhalsey.jpg",
    href: "https://www.lundhalsey.com/",
    active: true,
    sort_order: 38,
    featured: false,
  },
  {
    id: "default-triple-play",
    name_en: "Triple Play",
    name_ar: "تريبل بلاي",
    logo: "/partners/triple-play.png",
    href: "https://tripleplay.tv/",
    active: true,
    sort_order: 39,
    featured: false,
  },
  {
    id: "default-gesab",
    name_en: "GESAB",
    name_ar: "جيساب لغرف التحكم",
    logo: "/partners/gesab.jpg",
    href: "https://gesab.com/",
    active: true,
    sort_order: 40,
    featured: false,
  },
  {
    id: "default-lg-electronics",
    name_en: "LG Electronics",
    name_ar: "إل جي إلكترونيكس",
    logo: "/partners/lg-electronics.jpg",
    href: "https://lg.com",
    active: true,
    sort_order: 41,
    featured: true,
  },
  {
    id: "default-samsung",
    name_en: "Samsung",
    name_ar: "سامسونج",
    logo: "/partners/samsung.jpg",
    href: "https://www.samsung.com/",
    active: true,
    sort_order: 42,
    featured: true,
  },
  {
    id: "default-interel",
    name_en: "Interel",
    name_ar: "إنترريل",
    logo: "/partners/interel.jpg",
    href: "https://interel.com/",
    active: true,
    sort_order: 43,
    featured: false,
  },
  {
    id: "default-bsvt",
    name_en: "Bsvt",
    name_ar: "بي إس في تي",
    logo: "/partners/bsvt.jpg",
    href: "https://bsvt.by/en/",
    active: true,
    sort_order: 44,
    featured: false,
  },
  {
    id: "default-lemt",
    name_en: "lemt",
    name_ar: "ليمت",
    logo: "/partners/lemt.jpg",
    href: "https://www.google.com/search?q=lemt%20official%20website",
    active: true,
    sort_order: 45,
    featured: false,
  },
  {
    id: "default-display",
    name_en: "Display",
    name_ar: "ديسبلاي",
    logo: "/partners/display.jpg",
    href: "https://www.google.com/search?q=Display%20official%20website",
    active: true,
    sort_order: 46,
    featured: false,
  },
  {
    id: "default-check-point",
    name_en: "Check Point",
    name_ar: "تشيك بوينت سيكيورتي",
    logo: "/partners/check-point.png",
    href: "https://www.checkpoint.com/",
    active: true,
    sort_order: 47,
    featured: true,
  },
].map(p => ({
  ...p,
  description_en: partnerDescriptions[p.name_en]?.en || "",
  description_ar: partnerDescriptions[p.name_en]?.ar || ""
}));

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
        const dbNames = new Set(data.map((p: any) => (p.name_en || '').toLowerCase()));
        const missingDefaults = defaultPartnersData.filter(
          (p) => !dbNames.has((p.name_en || '').toLowerCase())
        );
        const upgradedDbData = data.map((p: any) => {
          const def = defaultPartnersData.find(d => (d.name_en || '').toLowerCase() === (p.name_en || '').toLowerCase());
          if (def && (!p.logo || p.logo.includes('simpleicons') || p.logo.includes('clearbit'))) {
            return { ...p, logo: def.logo };
          }
          return p;
        });
        setPartners([...upgradedDbData, ...missingDefaults] as PartnerRow[]);
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
    const isNewDbRow = !p.id || p.id.startsWith("default-") || p.id.startsWith("local-");
    const payload = {
      name_en: p.name_en ?? "",
      name_ar: p.name_ar ?? "",
      description_en: p.description_en ?? "",
      description_ar: p.description_ar ?? "",
      logo: p.logo ?? "https://cdn.simpleicons.org/cisco/005073",
      href: p.href ?? "",
      active: p.active ?? true,
      sort_order: p.sort_order ?? partners.length,
      featured: p.featured ?? false,
      ...(!isNewDbRow ? { id: p.id } : {}),
    };

    const isNewToList = !p.id;
    const tempId = p.id || `local-${Date.now()}`;

    setPartners((prev) => {
      if (isNewToList) {
        return [...prev, { ...payload, id: tempId } as PartnerRow];
      }
      return prev.map((item) => (item.id === p.id ? { ...item, ...payload } : item));
    });

    try {
      const { data, error } = await db.from("partners").upsert(payload).select().single();
      if (error) {
        console.error("[partners] save error", error);
        return { ...payload, id: tempId } as PartnerRow;
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