import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations } from "@/data/translations";
import { supabase } from "@/integrations/supabase/client";

export type Bilingual = { en: string; ar: string };

export type AboutValue = { title: Bilingual; desc: Bilingual };

/**
 * Resolve a bilingual value with graceful fallback when one language is missing.
 * Order: requested lang → other lang → provided fallback → "".
 * Accepts null/undefined/partial inputs so the UI never crashes on bad data.
 */
export function pickBi(
  b: Partial<Bilingual> | null | undefined,
  lang: "en" | "ar",
  fallback: string = "",
): string {
  if (!b || typeof b !== "object") return fallback;
  const primary = (b[lang] ?? "").trim();
  if (primary) return primary;
  const other = lang === "en" ? "ar" : "en";
  const alt = (b[other] ?? "").trim();
  if (alt) return alt;
  return fallback;
}

export type TeamMember = {
  key: string;
  name: Bilingual;
  role: Bilingual;
  image?: string;
  department?: Bilingual;
};

export type AboutStat = {
  value: string;
  label: Bilingual;
  sub: Bilingual;
  iconName?: string;
};

export type AboutContent = {
  eyebrow: Bilingual;
  title: Bilingual;
  sub: Bilingual;
  overviewT: Bilingual;
  overviewD: Bilingual;
  visionT: Bilingual;
  visionD: Bilingual;
  missionT: Bilingual;
  missionD: Bilingual;
  valuesT: Bilingual;
  values: [AboutValue, AboutValue, AboutValue];
  certificationsT: Bilingual;
  certificationsSub: Bilingual;
  certifications: string[];
  ownerEyebrow: Bilingual;
  ownerTitle: Bilingual;
  ownerName: Bilingual;
  ownerRole: Bilingual;
  ownerBio: Bilingual;
  ownerImage?: string;
  teamTitle: Bilingual;
  teamSub: Bilingual;
  team: TeamMember[];
  stats?: AboutStat[];
};

export type AboutHero = {
  image_url: string | null;
  focal_x: number;
  focal_y: number;
  zoom: number;
  mirror_rtl: boolean;
};

export const defaultHero: AboutHero = {
  image_url: null,
  focal_x: 50,
  focal_y: 50,
  zoom: 1,
  mirror_rtl: false,
};

const tk = (k: keyof typeof translations.en): Bilingual => ({
  en: (translations.en as any)[k] ?? "",
  ar: (translations.ar as any)[k] ?? "",
});

export const DEFAULT_ABOUT_STATS: AboutStat[] = [
  {
    value: "20+",
    label: { en: "Years of Engineering Mastery", ar: "عاماً من التميز الهندسي" },
    sub: { en: "Since 2004", ar: "منذ عام 2004" },
    iconName: "Clock",
  },
  {
    value: "500+",
    label: { en: "Mega Turnkey Projects", ar: "مشروع متكامل تم تسليمه" },
    sub: { en: "Government & Enterprise", ar: "حكومي وخاص" },
    iconName: "Building2",
  },
  {
    value: "100%",
    label: { en: "Certified Engineers & SLA", ar: "مهندسون معتمدون ودعم 24/7" },
    sub: { en: "Tier-3 & BICSI certified", ar: "معتمدون دولياً" },
    iconName: "ShieldCheck",
  },
  {
    value: "99.9%",
    label: { en: "Mission-Critical Uptime", ar: "جاهزية واستقرار تشغيلي" },
    sub: { en: "24/7 NOC Monitoring", ar: "مراقبة مستمرة" },
    iconName: "Zap",
  },
];

export const defaultAboutContent: AboutContent = {
  eyebrow: { en: "About Us", ar: "من نحن" },
  title: tk("about.title"),
  sub: tk("about.sub"),
  overviewT: tk("about.overviewT"),
  overviewD: tk("about.overviewD"),
  visionT: tk("about.visionT"),
  visionD: tk("about.visionD"),
  missionT: tk("about.missionT"),
  missionD: tk("about.missionD"),
  valuesT: tk("about.valuesT"),
  values: [
    { title: tk("about.value1"), desc: { en: "Long-term partnerships built on integrity and reliability.", ar: "شراكات طويلة الأمد مبنية على النزاهة والموثوقية." } },
    { title: tk("about.value2"), desc: { en: "Engineering creative solutions for complex problems.", ar: "هندسة حلول مبتكرة للمشكلات المعقدة." } },
    { title: tk("about.value3"), desc: { en: "Uncompromising commitment to delivery quality.", ar: "التزام ثابت بجودة التنفيذ." } },
  ],
  certificationsT: { en: "Certifications & Compliance", ar: "الشهادات والامتثال" },
  certificationsSub: { en: "Vetted by global standards bodies and OEM partners.", ar: "معتمدون من هيئات المعايير العالمية وشركاء التصنيع." },
  certifications: ["ISO 9001", "ISO 27001", "ISO 14001", "OHSAS 45001", "Cisco Gold", "Fortinet Expert", "Dell Titanium", "PMP-led"],
  ownerEyebrow: { en: "Leadership", ar: "القيادة" },
  ownerTitle: { en: "Message from Our Founder", ar: "رسالة من مؤسسنا" },
  ownerName: { en: "Eng: Waleed Al Agamy", ar: "م. وليد العجمي" },
  ownerRole: { en: "Founder & CEO", ar: "المؤسس والرئيس التنفيذي" },
  ownerBio: {
    en: "For over two decades, I have believed that technology should serve people, not the other way around. Integrated Technics was built to bring world-class engineering, uncompromising ethics, and a client-first mindset to every project we touch.",
    ar: "على مدى أكثر من عقدين، آمنت بأن التكنولوجيا يجب أن تخدم الناس لا العكس. بُنيت Integrated Technics لتقدم هندسة عالمية المستوى، وأخلاقيات لا تُساوم، ونهج يضع العميل في المقام الأول.",
  },
  ownerImage: "https://integratedtechnics.com/wp-content/uploads/2026/05/fghjkm.webp",
  teamTitle: { en: "Meet the Team", ar: "تعرف على الفريق" },
  teamSub: { en: "Certified engineers, project leaders and advisors who turn complexity into reliable outcomes.", ar: "مهندسون معتمدون وقادة مشاريع ومستشارون يحولون التعقيد إلى نتائج موثوقة." },
  team: [
    { key: "ceo", name: { en: "Eng: Waleed Al Agamy", ar: "م. وليد العجمي" }, role: { en: "Founder & CEO", ar: "المؤسس والرئيس التنفيذي" } },
    { key: "cto", name: { en: "Layla Mahmoud", ar: "ليلى محمود" }, role: { en: "Chief Technology Officer", ar: "مديرة التقنية" } },
    { key: "operations", name: { en: "Omar Farouk", ar: "عمر فاروق" }, role: { en: "Operations Director", ar: "مدير العمليات" } },
    { key: "projects", name: { en: "Nadia Shami", ar: "نادية شامي" }, role: { en: "Projects Director", ar: "مديرة المشاريع" } },
    { key: "security", name: { en: "Samir Haddad", ar: "سمير حداد" }, role: { en: "Security Practice Lead", ar: "مدير ممارسة الأمن" } },
    { key: "ict", name: { en: "Dina Rizk", ar: "دينا رزق" }, role: { en: "ICT Practice Lead", ar: "مديرة ممارسة تقنية المعلومات والاتصالات" } },
  ],
  stats: DEFAULT_ABOUT_STATS,
};

const KEY = "it_about_content_v1";

type Ctx = {
  content: AboutContent;
  hero: AboutHero;
  /** ISO timestamp of the last server save — use as a cache-busting version. */
  updatedAt: string | null;
  loading: boolean;
  save: (next: { content: AboutContent; hero: AboutHero }) => Promise<void>;
  refresh: () => Promise<void>;
};

const AboutContext = createContext<Ctx | null>(null);

export function AboutProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<AboutContent>(defaultAboutContent);
  const [hero, setHero] = useState<AboutHero>(defaultHero);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("about_content")
      .select("data, hero_image_url, hero_focal_x, hero_focal_y, hero_zoom, hero_mirror_rtl, updated_at")
      .eq("id", "main")
      .maybeSingle();
    if (error) {
      console.error("[about] load failed", error);
      setLoading(false);
      return;
    }
    if (data) {
      const parsed = (data.data ?? {}) as Partial<AboutContent>;
      setContent({ ...defaultAboutContent, ...parsed });
      setHero({
        image_url: data.hero_image_url ?? null,
        focal_x: Number(data.hero_focal_x ?? 50),
        focal_y: Number(data.hero_focal_y ?? 50),
        zoom: Number(data.hero_zoom ?? 1),
        mirror_rtl: !!data.hero_mirror_rtl,
      });
      setUpdatedAt((data as any).updated_at ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    
    const channel = supabase
      .channel("about_content_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "about_content" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const save: Ctx["save"] = async (next) => {
    const payload = {
      id: "main",
      data: next.content as any,
      hero_image_url: next.hero.image_url,
      hero_focal_x: next.hero.focal_x,
      hero_focal_y: next.hero.focal_y,
      hero_zoom: next.hero.zoom,
      hero_mirror_rtl: next.hero.mirror_rtl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("about_content").upsert(payload);
    if (error) {
      console.warn("[about] client upsert fallback to server fn...", error);
      try {
        const { saveAboutContent } = await import("./about.functions");
        await saveAboutContent({
          data: {
            data: next.content as any,
            hero_image_url: next.hero.image_url,
            hero_focal_x: next.hero.focal_x,
            hero_focal_y: next.hero.focal_y,
            hero_zoom: next.hero.zoom,
            hero_mirror_rtl: next.hero.mirror_rtl,
          },
        });
      } catch (err) {
        console.error("[about] save error", err);
        throw error;
      }
    }

    setContent(next.content);
    setHero(next.hero);
    setUpdatedAt(new Date().toISOString());
  };

  return (
    <AboutContext.Provider value={{ content, hero, updatedAt, loading, save, refresh: load }}>
      {children}
    </AboutContext.Provider>
  );
}

export function useAboutContent() {
  const ctx = useContext(AboutContext);
  if (!ctx) throw new Error("useAboutContent must be used within AboutProvider");
  return ctx;
}

/** Append a stable version query string so browsers/CDNs refetch after updates. */
export function withCacheBust(url: string | null, version: string | null): string | null {
  if (!url) return url;
  const v = version ? Date.parse(version) || version : "";
  if (!v) return url;
  return url.includes("?") ? `${url}&v=${encodeURIComponent(String(v))}` : `${url}?v=${encodeURIComponent(String(v))}`;
}
