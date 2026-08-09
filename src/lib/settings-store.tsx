import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
  contactSeo: {
    title: Bilingual;
    description: Bilingual;
    ogImage: Bilingual;
  };
  invoiceWatermark: InvoiceWatermark;
  visibility: PageVisibility;
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
  whatsapp: env.VITE_CONTACT_WHATSAPP || "+20210000000",
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
    { value: 20,  suffix: "+", label: { en: "Years of Experience", ar: "سنوات خبرة" } },
    { value: 80,  suffix: "+", label: { en: "Certified Engineers", ar: "مهندس معتمد" } },
  ],
  testimonials: [
    {
      quote: {
        en: "Integrated Technics completely transformed our IT infrastructure. Their team is highly professional and delivered on time.",
        ar: "قامت إنتجريتد تكنيكس بتحويل بنيتنا التحتية لتكنولوجيا المعلومات بالكامل. فريقهم محترف للغاية وسلم المشروع في الوقت المحدد."
      },
      author: { en: "Ahmed Hassan", ar: "أحمد حسن" },
      role: { en: "CTO, Global Tech", ar: "المدير التقني، جلوبال تك" },
      rating: 5,
    },
    {
      quote: {
        en: "The security systems installed by Integrated Technics are top-notch. We feel much more secure now.",
        ar: "الأنظمة الأمنية التي تم تركيبها بواسطة إنتجريتد تكنيكس من الدرجة الأولى. نشعر بأمان أكبر الآن."
      },
      author: { en: "Sarah Johnson", ar: "سارة جونسون" },
      role: { en: "Operations Manager", ar: "مديرة العمليات" },
      rating: 5,
    },
    {
      quote: {
        en: "Their smart home solutions are incredibly intuitive and easy to use. Highly recommended for anyone looking to upgrade.",
        ar: "حلول المنزل الذكي لديهم بديهية وسهلة الاستخدام بشكل لا يصدق. نوصي بها بشدة لأي شخص يبحث عن الترقية."
      },
      author: { en: "Omar Ali", ar: "عمر علي" },
      role: { en: "Real Estate Developer", ar: "مطور عقاري" },
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
  update: (patch: Partial<SiteSettings> & { social?: Partial<SiteSettings["social"]> }) => void;
  reset: () => void;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // Migrate string address → bilingual
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
    } catch {}
  }, []);

  const persist = (next: SiteSettings) => {
    setSettings(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const update: Ctx["update"] = (patch) => {
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
    persist(next);
  };

  const reset = () => {
    try { localStorage.removeItem(KEY); } catch {}
    setSettings(defaultSettings);
  };

  return <SettingsContext.Provider value={{ settings, update, reset }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
