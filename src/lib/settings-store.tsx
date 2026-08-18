import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Bilingual = { en: string; ar: string };
export type InvoiceWatermark = "none" | "draft" | "paid" | "unpaid" | "void" | "copy";
export type HomepageStat = { value: number; suffix: string; label: Bilingual };
export type Testimonial = { quote: Bilingual; author: Bilingual; role: Bilingual; rating: number };
export type PageKey =
  | "home"
  | "about"
  | "services"
  | "shop"
  | "projects"
  | "industries"
  | "careers"
  | "news"
  | "partners"
  | "contact";
export type PageVisibility = Record<PageKey, boolean>;
export type StickyButtonConfig = {
  enabled: boolean;
  text: Bilingual;
};
export type StickyConfig = {
  side: "start" | "end";
  mobileCollapse: boolean;
  whatsapp: StickyButtonConfig;
  install: StickyButtonConfig;
};
export type OfficeBranch = {
  id: string;
  name: Bilingual;
  address: Bilingual;
  phone: string;
  email: string;
  isMain?: boolean;
};

export type ContactHeaderConfig = {
  badge: Bilingual;
  title: Bilingual;
  subtitle: Bilingual;
};

export type HeaderIconsConfig = {
  cart: boolean;
  tracking: boolean;
};

export type SiteSettings = {
  email: string;
  salesEmail: string;
  supportEmail: string;
  phone: string;
  whatsapp: string;
  address: Bilingual;
  coords: { lat: number; lng: number };
  bio: Bilingual;
  mapUrl: string;
  social: { linkedin: string; twitter: string; facebook: string; instagram: string; youtube: string };
  contactHeader: ContactHeaderConfig;
  contactHours: Bilingual;
  branches: OfficeBranch[];
  contactSeo: {
    title: Bilingual;
    description: Bilingual;
    ogImage: Bilingual;
  };
  invoiceWatermark: InvoiceWatermark;
  visibility: PageVisibility;
  headerIcons: HeaderIconsConfig;
  sticky: StickyConfig;
  stats: HomepageStat[];
  testimonials: Testimonial[];
};

const env = (import.meta as any).env ?? {};

export const defaultSettings: SiteSettings = {
  email: env.VITE_CONTACT_EMAIL || "info@integratedtechnics.com",
  salesEmail: env.VITE_SALES_EMAIL || "sales@integratedtechnics.com",
  supportEmail: env.VITE_SUPPORT_EMAIL || "support@integratedtechnics.com",
  phone: env.VITE_CONTACT_PHONE || "+20 100 741 9344",
  whatsapp: env.VITE_CONTACT_WHATSAPP || "+201007419344",
  address: {
    en: env.VITE_CONTACT_ADDRESS_EN || env.VITE_CONTACT_ADDRESS || "Cairo, Egypt",
    ar: env.VITE_CONTACT_ADDRESS_AR || "القاهرة، مصر",
  },
  coords: {
    lat: Number(env.VITE_CONTACT_LAT) || 30.0444,
    lng: Number(env.VITE_CONTACT_LNG) || 31.2357,
  },
  bio: {
    en: env.VITE_SITE_BIO_EN || "Integrated Technics delivers reliable IT, networking and smart solutions across Egypt.",
    ar: env.VITE_SITE_BIO_AR || "إنتجريتد تكنيكس تقدم حلول تقنية المعلومات والشبكات والحلول الذكية في جميع أنحاء مصر.",
  },
  mapUrl: env.VITE_CONTACT_MAP_URL || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3453.645091723737!2d31.32836267555355!3d30.046995681881665!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583e606a282f1b%3A0xd389476b3f71c432!2sIntegrated%20Technics!5e0!3m2!1sen!2seg!4v1699999999999!5m2!1sen!2seg",
  social: {
    linkedin: env.VITE_SOCIAL_LINKEDIN || "https://www.linkedin.com/",
    twitter: env.VITE_SOCIAL_TWITTER || "https://twitter.com/",
    facebook: env.VITE_SOCIAL_FACEBOOK || "https://www.facebook.com/",
    instagram: env.VITE_SOCIAL_INSTAGRAM || "",
    youtube: env.VITE_SOCIAL_YOUTUBE || "",
  },
  contactHeader: {
    badge: { en: "Get In Touch", ar: "تواصل معنا" },
    title: { en: "Let's Architect Your Infrastructure", ar: "لنبني معاً بنيتك التحتية المتكاملة" },
    subtitle: {
      en: "Talk directly to our senior certified engineers. Tailored turnkey quotations, site surveys, and technical assessments delivered within 24–48 hours.",
      ar: "تحدث مباشرة مع كبار مهندسينا المعتمدين. عروض أسعار ودراسات فنية متكاملة للمشاريع خلال 24–48 ساعة.",
    },
  },
  contactHours: {
    en: "Sunday – Thursday: 9:00 AM – 6:00 PM (Cairo UTC+2)",
    ar: "الأحد – الخميس: 9:00 صباحاً – 6:00 مساءً (بتوقيت القاهرة)",
  },
  branches: [
    {
      id: "cairo-hq",
      name: { en: "Cairo Headquarters", ar: "المقر الرئيسي — القاهرة" },
      address: { en: "15 Makram Ebeid, Nasr City, Cairo, Egypt", ar: "15 شارع مكرم عبيد، مدينة نصر، القاهرة، مصر" },
      phone: "+20 100 741 9344",
      email: "info@integratedtechnics.com",
      isMain: true,
    },
    {
      id: "alex-branch",
      name: { en: "Alexandria Hub", ar: "فرع الإسكندرية والساحل" },
      address: { en: "Fouad Street, Downtown, Alexandria, Egypt", ar: "شارع فؤاد، وسط البلد، الإسكندرية، مصر" },
      phone: "+20 3 480 0000",
      email: "alex@integratedtechnics.com",
      isMain: false,
    },
  ],
  contactSeo: {
    title: {
      en: "Contact — Integrated Technics",
      ar: "تواصل معنا — إنتجريتد تكنيكس",
    },
    description: {
      en: "Talk to a solutions architect. Tailored proposals within 48 hours.",
      ar: "تحدث مع خبير حلول. عروض مخصصة خلال 48 ساعة.",
    },
    ogImage: { en: "", ar: "" },
  },
  invoiceWatermark: "none",
  stats: [
    { value: 150, suffix: "+", label: { en: "Clients Served", ar: "عميل" } },
    { value: 350, suffix: "+", label: { en: "Projects Delivered", ar: "مشروع منجز" } },
    { value: 20, suffix: "+", label: { en: "Years of Experience", ar: "سنوات خبرة" } },
    { value: 80, suffix: "+", label: { en: "Certified Engineers", ar: "مهندس معتمد" } },
  ],
  testimonials: [
    {
      quote: {
        en: "Integrated Technics completely transformed our tier-3 data center and campus infrastructure. Their precision engineering, structured cabling, and zero-downtime execution were world-class.",
        ar: "قامت إنتجريتد تكنيكس بتطوير مركز بيانات Tier-III والبنية التحتية لمقرنا بالكامل. تميز عملهم بالدقة الهندسية والتسليم بدون أي انقطاع في الخدمة."
      },
      author: { en: "Eng. Tarek Mansour", ar: "م. طارق منصور" },
      role: { en: "Head of Infrastructure, Middle East Telecom", ar: "رئيس البنية التحتية، ميدل إيست تيليكوم" },
      rating: 5,
    },
    {
      quote: {
        en: "The integrated IP surveillance, perimeter radar, and automated access control deployed across our medical campus exceeded our stringent compliance and security requirements.",
        ar: "تجاوزت منظومة المراقبة الذكية والرادار المحيطي والتحكم في الدخول المنفذة في مجمعنا الطبي كافة متطلبات الأمان والامتثال المعتمدة لدينا."
      },
      author: { en: "Dr. Khaled Abdelrahman", ar: "د. خالد عبد الرحمن" },
      role: { en: "Director of Security & Operations, Healthcare Group", ar: "مدير الأمن والعمليات، مجموعة الرعاية الصحية" },
      rating: 5,
    },
    {
      quote: {
        en: "Their hospitality AV systems, high-density Wi-Fi 6, and smart room management elevated our guest experience across 450 keys. Exceptional support and technical mastery.",
        ar: "ساهمت شبكة Wi-Fi 6 عالية الكثافة وأنظمة إدارة الغرف الذكية والأنظمة الصوتية والمرئية في رفع مستوى تجربة ضيوفنا في 450 غرفة بشكل ملموس."
      },
      author: { en: "Mona El-Sayed", ar: "منى السيد" },
      role: { en: "Projects Director, Red Sea Hospitality", ar: "مديرة المشاريع، مجموعة فنادق البحر الأحمر" },
      rating: 5,
    },
    {
      quote: {
        en: "Delivered a rock-solid industrial IoT and ATEX explosion-proof surveillance network for our petrochemical facility with top-tier reliability under extreme environmental conditions.",
        ar: "قدموا شبكة إنترنت أشياء صناعية ومنظومة كاميرات مقاومة للانفجار ATEX لمصنعنا البتروكيماوي بأعلى معايير الاعتمادية تحت أقسى الظروف البيئية."
      },
      author: { en: "Eng. Omar Al-Ghamdi", ar: "م. عمر الغامدي" },
      role: { en: "VP of Operations, Industrial Petrochemicals", ar: "نائب رئيس العمليات، البتروكيماويات الصناعية" },
      rating: 5,
    }
  ],
  visibility: {
    home: true,
    about: true,
    services: true,
    shop: true,
    projects: true,
    industries: true,
    careers: true,
    news: true,
    partners: true,
    contact: true,
  },
  headerIcons: {
    cart: true,
    tracking: true,
  },
  sticky: {
    side: "end",
    mobileCollapse: true,
    whatsapp: {
      enabled: true,
      text: { en: "Chat on WhatsApp", ar: "تواصل عبر واتساب" },
    },
    install: {
      enabled: true,
      text: { en: "Install app", ar: "تثبيت التطبيق" },
    },
  },
};

const KEY = "it_site_settings_v5";

type Ctx = {
  settings: SiteSettings;
  loading: boolean;
  update: (patch: Partial<SiteSettings> & { social?: Partial<SiteSettings["social"]> }) => Promise<void>;
  save: (next: SiteSettings) => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("site_settings")
        .select("value")
        .eq("id", "main")
        .maybeSingle();

      if (!error && data?.value) {
        const parsed: any = data.value;
        if (typeof parsed.address === "string") {
          parsed.address = { en: parsed.address, ar: defaultSettings.address.ar };
        }
        setSettings({
          ...defaultSettings,
          ...parsed,
          address: { ...defaultSettings.address, ...(parsed.address ?? {}) },
          coords: { ...defaultSettings.coords, ...(parsed.coords ?? {}) },
          bio: { ...defaultSettings.bio, ...(parsed.bio ?? {}) },
          social: { ...defaultSettings.social, ...(parsed.social ?? {}) },
          contactSeo: {
            title: { ...defaultSettings.contactSeo.title, ...((parsed.contactSeo?.title) ?? {}) },
            description: { ...defaultSettings.contactSeo.description, ...((parsed.contactSeo?.description) ?? {}) },
            ogImage: { ...defaultSettings.contactSeo.ogImage, ...((parsed.contactSeo?.ogImage) ?? {}) },
          },
          contactHeader: {
            badge: { ...defaultSettings.contactHeader.badge, ...(parsed.contactHeader?.badge ?? {}) },
            title: { ...defaultSettings.contactHeader.title, ...(parsed.contactHeader?.title ?? {}) },
            subtitle: { ...defaultSettings.contactHeader.subtitle, ...(parsed.contactHeader?.subtitle ?? {}) },
          },
          contactHours: { ...defaultSettings.contactHours, ...(parsed.contactHours ?? {}) },
          branches: Array.isArray(parsed.branches) && parsed.branches.length > 0
            ? parsed.branches
            : defaultSettings.branches,
          stats: Array.isArray(parsed.stats) && parsed.stats.length === 4
            ? parsed.stats.map((s: HomepageStat, i: number) => ({
                ...defaultSettings.stats[i],
                ...s,
                label: { ...defaultSettings.stats[i].label, ...(s.label ?? {}) },
              }))
            : defaultSettings.stats,
          testimonials: Array.isArray(parsed.testimonials)
            ? parsed.testimonials.map((t: Testimonial) => ({
                ...t,
                quote: { ...t.quote },
                author: { ...t.author },
                role: { ...t.role },
              }))
            : defaultSettings.testimonials,
          visibility: { ...defaultSettings.visibility, ...(parsed.visibility ?? {}) },
          headerIcons: {
            cart: parsed.headerIcons?.cart !== undefined ? Boolean(parsed.headerIcons.cart) : defaultSettings.headerIcons.cart,
            tracking: parsed.headerIcons?.tracking !== undefined ? Boolean(parsed.headerIcons.tracking) : defaultSettings.headerIcons.tracking,
          },
          sticky: {
            ...defaultSettings.sticky,
            ...(parsed.sticky ?? {}),
            whatsapp: {
              ...defaultSettings.sticky.whatsapp,
              ...(parsed.sticky?.whatsapp ?? {}),
              text: { ...defaultSettings.sticky.whatsapp.text, ...(parsed.sticky?.whatsapp?.text ?? {}) },
            },
            install: {
              ...defaultSettings.sticky.install,
              ...(parsed.sticky?.install ?? {}),
              text: { ...defaultSettings.sticky.install.text, ...(parsed.sticky?.install?.text ?? {}) },
            },
          },
        });
      }
    } catch (err) {
      console.warn("[settings] refresh failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel("site_settings_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const save = async (next: SiteSettings) => {
    setSettings(next);
    const { error } = await (supabase as any).from("site_settings").upsert({
      id: "main",
      value: next as any,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error("[settings] save error", error);
      throw new Error(error.message || "Failed to save settings");
    }
  };

  const update: Ctx["update"] = async (patch) => {
    const next: SiteSettings = {
      ...settings,
      ...patch,
      address: { ...settings.address, ...((patch as any).address ?? {}) },
      coords: { ...settings.coords, ...((patch as any).coords ?? {}) },
      bio: { ...settings.bio, ...((patch as any).bio ?? {}) },
      social: { ...settings.social, ...(patch.social ?? {}) },
      contactSeo: {
        title: { ...settings.contactSeo.title, ...(((patch as any).contactSeo?.title) ?? {}) },
        description: { ...settings.contactSeo.description, ...(((patch as any).contactSeo?.description) ?? {}) },
        ogImage: { ...settings.contactSeo.ogImage, ...(((patch as any).contactSeo?.ogImage) ?? {}) },
      },
      stats: (patch as any).stats ?? settings.stats,
      testimonials: (patch as any).testimonials ?? settings.testimonials,
      visibility: { ...settings.visibility, ...((patch as any).visibility ?? {}) },
      headerIcons: { ...settings.headerIcons, ...((patch as any).headerIcons ?? {}) },
      sticky: {
        ...settings.sticky,
        ...((patch as any).sticky ?? {}),
        whatsapp: {
          ...settings.sticky.whatsapp,
          ...(((patch as any).sticky?.whatsapp) ?? {}),
          text: { ...settings.sticky.whatsapp.text, ...(((patch as any).sticky?.whatsapp?.text) ?? {}) },
        },
        install: {
          ...settings.sticky.install,
          ...(((patch as any).sticky?.install) ?? {}),
          text: { ...settings.sticky.install.text, ...(((patch as any).sticky?.install?.text) ?? {}) },
        },
      },
    };
    await save(next);
  };

  const reset = async () => {
    await (supabase as any).from("site_settings").delete().eq("id", "main");
    setSettings(defaultSettings);
  };

  return <SettingsContext.Provider value={{ settings, loading, update, save, reset, refresh }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
