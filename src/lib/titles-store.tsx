import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export interface TitleEntry {
  key: string;
  page: string;
  section: string;
  badgeEn?: string;
  badgeAr?: string;
  titleEn: string;
  titleAr: string;
  subtitleEn?: string;
  subtitleAr?: string;
  updatedAt?: string;
}

export const DEFAULT_TITLES: Record<string, TitleEntry> = {
  "home.hero": {
    key: "home.hero",
    page: "home",
    section: "Hero Section",
    badgeEn: "Enterprise System Integration",
    badgeAr: "تكامل الأنظمة المؤسسية",
    titleEn: "Integrated Technics for Enterprise Excellence",
    titleAr: "حلول أمنية وتقنية متكاملة للمؤسسات الرائدة",
    subtitleEn: "Turnkey integration across security, networks, audio-visual and data centers — delivered end-to-end by certified engineers.",
    subtitleAr: "حلول جاهزة وشاملة في الأمن والشبكات والأنظمة الصوتية والمرئية ومراكز البيانات — يقدمها مهندسون معتمدون من البداية إلى التشغيل.",
  },
  "home.wheel": {
    key: "home.wheel",
    page: "home",
    section: "Interactive Wheel Hub",
    badgeEn: "Core Disciplines",
    badgeAr: "مجالات التخصص",
    titleEn: "Interactive Systems Architecture",
    titleAr: "هندسة الأنظمة التفاعلية",
    subtitleEn: "Explore our core engineering disciplines through our unified architecture wheel.",
    subtitleAr: "استكشف مجالاتنا الهندسية المتكاملة من خلال عجلة المعمارية التفاعلية.",
  },
  "home.solutions": {
    key: "home.solutions",
    page: "home",
    section: "Solutions Section",
    badgeEn: "Integrated Solutions",
    badgeAr: "الحلول المتكاملة",
    titleEn: "Turnkey Engineering Systems",
    titleAr: "أنظمة هندسية متكاملة",
    subtitleEn: "End-to-end design, supply, installation, testing and commissioning for critical infrastructure.",
    subtitleAr: "تصميم وتوريد وتركيب واختبار وتشغيل متكامل للبنى التحتية الحيوية.",
  },
  "home.services": {
    key: "home.services",
    page: "home",
    section: "Services Section",
    badgeEn: "Our Services",
    badgeAr: "خدماتنا الأساسية",
    titleEn: "Core Services",
    titleAr: "خدماتنا الأساسية",
    subtitleEn: "End-to-end design, integration and support for mission-critical infrastructure.",
    subtitleAr: "تصميم وتكامل ودعم شامل للبنى التحتية الحرجة.",
  },
  "home.products": {
    key: "home.products",
    page: "home",
    section: "Systems Catalog Section",
    badgeEn: "Enterprise Systems",
    badgeAr: "أنظمة المؤسسات",
    titleEn: "Certified Hardware & Technology Ecosystem",
    titleAr: "أجهزة ومنظومات تقنية معتمدة",
    subtitleEn: "Enterprise-grade equipment and hardware platforms from global OEM partners.",
    subtitleAr: "أحدث الأجهزة والمعدات المؤسسية من شركائنا العالمية المعتمدين.",
  },
  "home.projects": {
    key: "home.projects",
    page: "home",
    section: "Projects Section",
    badgeEn: "Case Studies",
    badgeAr: "مشاريع مختارة",
    titleEn: "Featured Projects",
    titleAr: "مشاريع مختارة",
    subtitleEn: "Selected case studies across the region.",
    subtitleAr: "نماذج من أعمالنا ومشاريعنا المنفذة في المنطقة.",
  },
  "home.industries": {
    key: "home.industries",
    page: "home",
    section: "Industries Section",
    badgeEn: "Industries",
    badgeAr: "القطاعات",
    titleEn: "Industries We Serve",
    titleAr: "القطاعات التي نخدمها",
    subtitleEn: "Trusted across regulated, high-availability sectors.",
    subtitleAr: "موثوق بنا في القطاعات عالية الأهمية والحساسية.",
  },
  "home.partners": {
    key: "home.partners",
    page: "home",
    section: "Partners Section",
    badgeEn: "Ecosystem",
    badgeAr: "شركاء التكنولوجيا",
    titleEn: "Technology Partners",
    titleAr: "شركاؤنا التقنيون",
    subtitleEn: "Authorized partner of the world's leading vendors.",
    subtitleAr: "شريك معتمد لأبرز الشركات العالمية ومصنعي التكنولوجيا.",
  },
  "home.why": {
    key: "home.why",
    page: "home",
    section: "Why Choose Us Section",
    badgeEn: "Why Us",
    badgeAr: "لماذا تختارنا",
    titleEn: "Why Choose Us",
    titleAr: "لماذا تختارنا",
    subtitleEn: "Architectures designed for operational reality, backed by OEM certifications and round-the-clock SLAs.",
    subtitleAr: "معماريات مصممة لواقعك التشغيلي، مدعومة باعتمادات المصنّعين واتفاقيات دعم على مدار الساعة.",
  },
  "home.testimonials": {
    key: "home.testimonials",
    page: "home",
    section: "Testimonials Section",
    badgeEn: "Testimonials",
    badgeAr: "آراء العملاء",
    titleEn: "What Our Clients Say",
    titleAr: "ماذا يقول عملاؤنا",
    subtitleEn: "Feedback from enterprise leaders and project directors across Egypt.",
    subtitleAr: "شهادات وتقييمات من قيادات المؤسسات ومديري المشاريع في مصر.",
  },
  "home.recommendations": {
    key: "home.recommendations",
    page: "home",
    section: "Smart Advisor Section",
    badgeEn: "Smart Advisor",
    badgeAr: "المستشار الذكي",
    titleEn: "Find the Right Solution for Your Facility",
    titleAr: "اكتشف الحل الأمثل لمنشأتك",
    subtitleEn: "Answer a few questions to get tailored architecture and system recommendations.",
    subtitleAr: "أجب عن بضعة أسئلة للحصول على توصيات معمارية وأنظمة مخصصة لاحتياجاتك.",
  },
  "home.news": {
    key: "home.news",
    page: "home",
    section: "Latest News Section",
    badgeEn: "Insights",
    badgeAr: "الأخبار والمقالات",
    titleEn: "Latest News",
    titleAr: "آخر الأخبار",
    subtitleEn: "Updates and insights from across our engineering projects.",
    subtitleAr: "تحديثات ومقالات ورؤى من واقع مشاريعنا الهندسية.",
  },
  "home.cta": {
    key: "home.cta",
    page: "home",
    section: "Call to Action Section",
    badgeEn: "Get Started",
    badgeAr: "ابدأ الآن",
    titleEn: "Start Your Project With Us Today",
    titleAr: "ابدأ مشروعك معنا اليوم",
    subtitleEn: "Talk to a solutions architect and receive a tailored proposal in 48 hours.",
    subtitleAr: "تحدث مع مهندس حلول واحصل على عرض مخصص خلال 48 ساعة.",
  },
  "page.about": {
    key: "page.about",
    page: "about",
    section: "Header Banner",
    badgeEn: "About Us",
    badgeAr: "من نحن",
    titleEn: "About Integrated Technics",
    titleAr: "عن Integrated Technics",
    subtitleEn: "Two decades engineering complex systems for the region's most demanding enterprises.",
    subtitleAr: "عقدان من هندسة الأنظمة المعقدة لأكثر المؤسسات تطلبًا في المنطقة.",
  },
  "page.services": {
    key: "page.services",
    page: "services",
    section: "Header Banner",
    badgeEn: "Specialized Services",
    badgeAr: "خدماتنا المتخصصة",
    titleEn: "Comprehensive Engineering Services",
    titleAr: "خدمات هندسية متكاملة",
    subtitleEn: "End-to-end design, implementation, and lifecycle management for enterprise low-current & ICT infrastructure.",
    subtitleAr: "تصميم وتنفيذ وإدارة شاملة للبنى التحتية للتيار الخفيف وتكنولوجيا المعلومات.",
  },
  "page.solutions": {
    key: "page.solutions",
    page: "solutions",
    section: "Header Banner",
    badgeEn: "Turnkey Solutions",
    badgeAr: "حلول متكاملة",
    titleEn: "Enterprise Technology Solutions",
    titleAr: "حلول تقنية للمؤسسات",
    subtitleEn: "Explore integrated systems engineered for enterprise scale, security, and reliability.",
    subtitleAr: "استكشف أنظمة متكاملة مصممة لتلائم حجم المؤسسات وأعلى معايير الأمان والاعتمادية.",
  },
  "page.products": {
    key: "page.products",
    page: "products",
    section: "Header Banner",
    badgeEn: "Systems Catalog",
    badgeAr: "كتالوج الأنظمة",
    titleEn: "Certified Hardware & Technology Systems",
    titleAr: "أجهزة ومنظومات تقنية معتمدة",
    subtitleEn: "Browse certified enterprise hardware, switches, servers, IP surveillance, and access control solutions.",
    subtitleAr: "استعرض أجهزة المؤسسات المعتمدة ومحولات الشبكة والخوادم وكاميرات المراقبة وأنظمة التحكم بالدخول.",
  },
  "page.projects": {
    key: "page.projects",
    page: "projects",
    section: "Header Banner",
    badgeEn: "Our Portfolio",
    badgeAr: "سجل مشاريعنا",
    titleEn: "Engineering Projects Portfolio",
    titleAr: "سجل المشاريع والأعمال الهندسية",
    subtitleEn: "Showcasing delivered enterprise security, networking, AV and smart building installations across Egypt.",
    subtitleAr: "استعراض للمشاريع المنفذة في الأمن والشبكات والصوتيات والمباني الذكية في مصر.",
  },
  "page.industries": {
    key: "page.industries",
    page: "industries",
    section: "Header Banner",
    badgeEn: "Sectors",
    badgeAr: "القطاعات",
    titleEn: "Industries We Serve",
    titleAr: "القطاعات التي نخدمها",
    subtitleEn: "Specialized low-current and ICT systems tailored to regulatory and operational demands of critical sectors.",
    subtitleAr: "أنظمة تيار خفيف وتكنولوجيا معلومات مخصصة للمتطلبات التشغيلية والتنظيمية للقطاعات الحيوية.",
  },
  "page.partners": {
    key: "page.partners",
    page: "partners",
    section: "Header Banner",
    badgeEn: "Global Alliances",
    badgeAr: "تحالفات عالمية",
    titleEn: "Technology Partners & Vendor Ecosystem",
    titleAr: "منظومة الشركاء والموردين العالميين",
    subtitleEn: "We partner with world-renowned technology brands to deliver certified turnkey solutions.",
    subtitleAr: "نتعاون مع كبرى الشركات العالمية لتقديم حلول معتمدة ومتكاملة.",
  },
  "page.careers": {
    key: "page.careers",
    page: "careers",
    section: "Header Banner",
    badgeEn: "Join Our Team",
    badgeAr: "انضم إلى فريقنا",
    titleEn: "Build the Future With Integrated Technics",
    titleAr: "اصنع مستقبلك مع إنتجريتد تكنيكس",
    subtitleEn: "Explore open engineering, project management, and technology career opportunities.",
    subtitleAr: "استكشف الوظائف الشاغرة للمهندسين ومديري المشاريع والمتخصصين في التكنولوجيا.",
  },
  "page.news": {
    key: "page.news",
    page: "news",
    section: "Header Banner",
    badgeEn: "Press & Articles",
    badgeAr: "الأخبار والمقالات",
    titleEn: "News, Insights & Technology Updates",
    titleAr: "أحدث الأخبار والمقالات والتقنيات",
    subtitleEn: "Stay updated with industry trends, project milestones, and tech announcements.",
    subtitleAr: "تابع أحدث اتجاهات الصناعة وإنجازات مشاريعنا وأخبار التكنولوجيا.",
  },
  "page.events": {
    key: "page.events",
    page: "events",
    section: "Header Banner",
    badgeEn: "Events & Expos",
    badgeAr: "الفعاليات والمعارض",
    titleEn: "Upcoming Events & Industry Conferences",
    titleAr: "الفعاليات القادمة والمؤتمرات التقنية",
    subtitleEn: "Connect with our engineering leaders at international technology exhibitions and workshops.",
    subtitleAr: "تواصل مع قياداتنا الهندسية في المعارض وورش العمل التقنية الدولية.",
  },
  "page.training": {
    key: "page.training",
    page: "training",
    section: "Header Banner",
    badgeEn: "Academy",
    badgeAr: "أكاديمية التدريب",
    titleEn: "Professional Engineering Training & Certifications",
    titleAr: "برامج تدريب هندسية وشهادات معتمدة",
    subtitleEn: "Hands-on training courses in low-current, networking, security, and smart building integration.",
    subtitleAr: "دورات تدريبية عملية في مجالات التيار الخفيف والشبكات والأنظمة الأمنية والمباني الذكية.",
  },
  "page.contact": {
    key: "page.contact",
    page: "contact",
    section: "Header Banner",
    badgeEn: "Get In Touch",
    badgeAr: "تواصل معنا",
    titleEn: "Let's Architect Your Infrastructure",
    titleAr: "لنبني معاً بنيتك التحتية المتكاملة",
    subtitleEn: "Talk directly to our senior certified engineers. Tailored proposals within 24–48 hours.",
    subtitleAr: "تحدث مباشرة مع كبار مهندسينا المعتمدين. عروض أسعار ودراسات فنية خلال 24–48 ساعة.",
  },
  "page.faqs": {
    key: "page.faqs",
    page: "faqs",
    section: "Header Banner",
    badgeEn: "FAQ",
    badgeAr: "الأسئلة الشائعة",
    titleEn: "Frequently Asked Questions",
    titleAr: "الأسئلة الأكثر شيوعاً",
    subtitleEn: "Everything you need to know about our turnkey integration process, warranties, and support.",
    subtitleAr: "كل ما تحتاج لمعرفته حول مراحل تنفيذ المشاريع وفترات الضمان وخدمات الدعم الفني.",
  },
  "global.footer": {
    key: "global.footer",
    page: "global",
    section: "Footer Section",
    titleEn: "Integrated Technics",
    titleAr: "إنتجريتد تكنيكس",
    subtitleEn: "Integrated security and ICT solutions for the enterprises that power the region.",
    subtitleAr: "حلول أمنية وتقنية متكاملة للمؤسسات الرائدة في المنطقة.",
  },
};

interface TitlesContextType {
  titles: Record<string, TitleEntry>;
  loading: boolean;
  refresh: () => Promise<void>;
  updateTitle: (entry: TitleEntry) => Promise<void>;
  deleteTitle: (key: string) => Promise<void>;
  resetToDefault: (key: string) => Promise<void>;
  resetAll: () => Promise<void>;
  getTitle: (key: string) => TitleEntry;
}

const TitlesContext = createContext<TitlesContextType | null>(null);

function dbRowToEntry(row: any): TitleEntry {
  return {
    key: row.key,
    page: row.page || "home",
    section: row.section || "General",
    badgeEn: row.badge_en ?? row.badgeEn,
    badgeAr: row.badge_ar ?? row.badgeAr,
    titleEn: row.title_en ?? row.titleEn ?? "",
    titleAr: row.title_ar ?? row.titleAr ?? "",
    subtitleEn: row.subtitle_en ?? row.subtitleEn,
    subtitleAr: row.subtitle_ar ?? row.subtitleAr,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function entryToDbRow(e: TitleEntry) {
  return {
    key: e.key,
    page: e.page,
    section: e.section,
    badge_en: e.badgeEn || null,
    badge_ar: e.badgeAr || null,
    title_en: e.titleEn,
    title_ar: e.titleAr,
    subtitle_en: e.subtitleEn || null,
    subtitle_ar: e.subtitleAr || null,
    updated_at: new Date().toISOString(),
  };
}

export function TitlesProvider({ children }: { children: ReactNode }) {
  const [titles, setTitles] = useState<Record<string, TitleEntry>>(DEFAULT_TITLES);
  const [loading, setLoading] = useState(true);

  const loadFromDatabase = async () => {
    try {
      // 1. Try querying dedicated site_titles table
      const { data: tableData, error: tableError } = await (supabase as any)
        .from("site_titles")
        .select("*");

      if (!tableError && Array.isArray(tableData) && tableData.length > 0) {
        const merged = { ...DEFAULT_TITLES };
        for (const row of tableData) {
          const entry = dbRowToEntry(row);
          merged[entry.key] = entry;
        }
        setTitles(merged);
        setLoading(false);
        return;
      }

      // 2. Fallback: check site_settings for id = 'site_titles'
      const { data: settingsData, error: settingsError } = await (supabase as any)
        .from("site_settings")
        .select("value")
        .eq("id", "site_titles")
        .maybeSingle();

      if (!settingsError && settingsData?.value && typeof settingsData.value === "object") {
        const dbMap = settingsData.value as Record<string, TitleEntry>;
        setTitles({ ...DEFAULT_TITLES, ...dbMap });
      }
    } catch (err) {
      console.error("[TitlesProvider] Error loading titles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFromDatabase();

    // Subscribe to realtime changes on site_settings or site_titles
    const channel = supabase
      .channel("site_titles_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "id=eq.site_titles" },
        () => void loadFromDatabase(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_titles" },
        () => void loadFromDatabase(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const saveToDatabase = async (nextTitles: Record<string, TitleEntry>) => {
    let success = false;
    let lastError: any = null;

    // 1. Attempt updating site_settings with id: 'site_titles'
    try {
      const { error: settingsError } = await (supabase as any)
        .from("site_settings")
        .upsert({
          id: "site_titles",
          value: nextTitles,
          updated_at: new Date().toISOString(),
        });
      if (!settingsError) {
        success = true;
      } else {
        lastError = settingsError;
      }
    } catch (e) {
      lastError = e;
    }

    // 2. Also try site_titles table if available
    try {
      const rows = Object.values(nextTitles).map(entryToDbRow);
      const { error: tableError } = await (supabase as any)
        .from("site_titles")
        .upsert(rows);
      if (!tableError) {
        success = true;
      }
    } catch {
      // ignore table error if table hasn't been created yet
    }

    if (!success && lastError) {
      throw lastError;
    }
  };

  const updateTitle = async (entry: TitleEntry) => {
    const updated = {
      ...titles,
      [entry.key]: { ...entry, updatedAt: new Date().toISOString() },
    };
    await saveToDatabase(updated);
    setTitles(updated);
  };

  const deleteTitle = async (key: string) => {
    const updated = { ...titles };
    delete updated[key];
    await saveToDatabase(updated);
    setTitles(updated);
  };

  const resetToDefault = async (key: string) => {
    const def = DEFAULT_TITLES[key];
    if (def) {
      await updateTitle(def);
    } else {
      await deleteTitle(key);
    }
  };

  const resetAll = async () => {
    await saveToDatabase(DEFAULT_TITLES);
    setTitles(DEFAULT_TITLES);
  };

  const getTitle = (key: string): TitleEntry => {
    return titles[key] || DEFAULT_TITLES[key] || {
      key,
      page: "general",
      section: key,
      titleEn: key,
      titleAr: key,
    };
  };

  return (
    <TitlesContext.Provider
      value={{
        titles,
        loading,
        refresh: loadFromDatabase,
        updateTitle,
        deleteTitle,
        resetToDefault,
        resetAll,
        getTitle,
      }}
    >
      {children}
    </TitlesContext.Provider>
  );
}

export function useSiteTitles() {
  const ctx = useContext(TitlesContext);
  if (!ctx) {
    throw new Error("useSiteTitles must be used within a TitlesProvider");
  }
  return ctx;
}

/**
 * Convenience hook for a specific section title, automatically reflecting current site language
 */
export function useSectionTitle(key: string, fallback?: Partial<TitleEntry>) {
  const ctx = useContext(TitlesContext);
  const { lang } = useI18n();

  const entry = useMemo(() => {
    if (ctx) {
      const found = ctx.getTitle(key);
      if (found) return found;
    }
    return (
      DEFAULT_TITLES[key] || {
        key,
        page: "general",
        section: key,
        titleEn: fallback?.titleEn || key,
        titleAr: fallback?.titleAr || key,
        subtitleEn: fallback?.subtitleEn,
        subtitleAr: fallback?.subtitleAr,
        badgeEn: fallback?.badgeEn,
        badgeAr: fallback?.badgeAr,
      }
    );
  }, [ctx, key, fallback]);

  const isAr = lang === "ar";

  return {
    badge: isAr ? (entry.badgeAr || entry.badgeEn || "") : (entry.badgeEn || entry.badgeAr || ""),
    title: isAr ? (entry.titleAr || entry.titleEn || "") : (entry.titleEn || entry.titleAr || ""),
    subtitle: isAr ? (entry.subtitleAr || entry.subtitleEn || "") : (entry.subtitleEn || entry.subtitleAr || ""),
    raw: entry,
  };
}

