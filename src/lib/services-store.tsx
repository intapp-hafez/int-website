import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { services as defaultServicesData } from "@/data/site";
import {
  Shield,
  Network,
  MonitorPlay,
  Server,
  Layers,
  Lightbulb,
  ClipboardList,
  Cpu,
  Wifi,
  Lock,
  Radio,
  HardDrive,
  Headphones,
  Zap,
  Cloud,
  Database,
  Camera,
  Activity,
  LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

export type Bilingual = { en: string; ar: string };
export type ServiceDeliverable = { en: string; ar: string };

export type Service = {
  slug: string;
  title: Bilingual;
  desc: Bilingual;
  image: string;
  iconName: string;
  published: boolean;
  sortOrder: number;
  features: ServiceDeliverable[];
  seo?: {
    metaTitle?: Bilingual;
    metaDescription?: Bilingual;
    keywords?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
};

export const AVAILABLE_SERVICE_ICONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: "Shield", label: "Security / Shield", icon: Shield },
  { name: "Network", label: "Network / Cabling", icon: Network },
  { name: "MonitorPlay", label: "Audio / Video / Screen", icon: MonitorPlay },
  { name: "Server", label: "Data Center / Server", icon: Server },
  { name: "Layers", label: "Integration / Layers", icon: Layers },
  { name: "Lightbulb", label: "Consultation / Ideas", icon: Lightbulb },
  { name: "ClipboardList", label: "Project Management", icon: ClipboardList },
  { name: "Cpu", label: "Compute / Hardware", icon: Cpu },
  { name: "Wifi", label: "Wireless / Telecom", icon: Wifi },
  { name: "Lock", label: "Access Control / Locks", icon: Lock },
  { name: "Camera", label: "CCTV / Surveillance", icon: Camera },
  { name: "Cloud", label: "Cloud Services", icon: Cloud },
  { name: "Database", label: "Database / Storage", icon: Database },
  { name: "Zap", label: "Power & UPS", icon: Zap },
  { name: "Headphones", label: "Support & Helpdesk", icon: Headphones },
  { name: "Activity", label: "Monitoring / IoT", icon: Activity },
];

export function getServiceIcon(iconName?: string): LucideIcon {
  const found = AVAILABLE_SERVICE_ICONS.find((i) => i.name.toLowerCase() === (iconName || "").toLowerCase());
  return found ? found.icon : Layers;
}

export const DEFAULT_SERVICE_DELIVERABLES: Record<string, ServiceDeliverable[]> = {
  security: [
    { en: "AI-powered CCTV surveillance & video analytics", ar: "كاميرات مراقبة ذكية مدعومة بالذكاء الاصطناعي وتحليل الفيديو" },
    { en: "Biometric & RFID access control systems", ar: "أنظمة التحكم في الدخول الحيوية والبطاقات الذكية" },
    { en: "Perimeter intrusion detection & alarm integration", ar: "أنظمة حماية المحيط والإنذار المبكر ضد التسلل" },
    { en: "Centralized Command & Control Center (C4I) consoles", ar: "غرف تحكم وسيطرة مركزية متكاملة" },
    { en: "Automated license plate recognition (ALPR/ANPR)", ar: "أنظمة قراءة لوحات المركبات التلقائية" },
    { en: "24/7 preventative maintenance & SLA compliance", ar: "عقود صيانة وقائية 24/7 واستجابة فورية للأعطال" },
  ],
  network: [
    { en: "Certified structured cabling (Cat6A / Cat7 / Fiber)", ar: "تمديدات الكابلات الهيكلية والألياف الضوئية المعتمدة" },
    { en: "High-availability Core & Edge switching backbones", ar: "محولات شبكة رئيسية وفرعية عالية التوافرية" },
    { en: "Enterprise Wi-Fi 6/6E wireless site surveys & tuning", ar: "تغطية لاسلكية ذكية بمعايير Wi-Fi 6/6E ودراسات مسح ميداني" },
    { en: "Software-Defined Networking (SDN) & SD-WAN", ar: "شبكات معرّفة بالبرمجيات وحلول SD-WAN المتطورة" },
    { en: "Next-Generation Firewall (NGFW) deployment", ar: "جدران حماية وأمن شبكات من الجيل التالي" },
    { en: "Full OTDR cable certification & documentation", ar: "اختبارات واعتماد الكابلات بأجهزة OTDR ومخططات هندسية" },
  ],
  "audio-video": [
    { en: "Smart interactive boardrooms & touch control panels", ar: "قاعات اجتماعات ذكية تفاعلية مع شاشات تحكم لمسية" },
    { en: "Ultra-HD fine-pitch LED & LCD video wall arrays", ar: "شاشات عرض جدارية LED و LCD فائقة الوضوح" },
    { en: "Unified Microsoft Teams / Zoom Rooms integration", ar: "أنظمة مؤتمرات مرئية معتمدة لـ Teams و Zoom" },
    { en: "Professional acoustic treatment & audio DSP calibration", ar: "معالجة صوتية هندسية ومعايرة DSP متقدمة" },
    { en: "Enterprise digital signage & IPTV distribution", ar: "لافتات رقمية وشبكات توزيع محتوى IPTV مركزي" },
    { en: "Wireless presentation & BYOD screen sharing", ar: "حلول العرض اللاسلكي ومشاركة الشاشات الذكية" },
  ],
  "data-centers": [
    { en: "Tier-II/III/IV certified architectural & MEP layout", ar: "تصميم معماري وهندسي متوافق مع معايير Tier II/III/IV" },
    { en: "Precision InRow & perimeter cooling solutions", ar: "أنظمة تبريد دقيق مع ممرات عزل حراري محكمة" },
    { en: "Modular N+1 / 2N UPS power & ATS generators", ar: "وحدات طاقة غير منقطعة UPS ومولدات احتياطية" },
    { en: "High-density server containment racks & PDU metering", ar: "كبائن خوادم عالية الكثافة مع قياس ذكي للطاقة PDU" },
    { en: "DCIM real-time environmental & thermal monitoring", ar: "أنظمة DCIM للمراقبة البيئية والحرارية اللحظية" },
    { en: "Clean agent fire suppression (FM200 / NOVEC 1230)", ar: "أنظمة إطفاء حرائق بالغازات النظيفة الصديقة للبيئة" },
  ],
  integration: [
    { en: "Unified Single-Pane-of-Glass management dashboard", ar: "لوحة تحكم مركزية موحدة لجميع الأنظمة التكنولوجية" },
    { en: "Custom REST / GraphQL API middleware development", ar: "تطوير واجهات برمجية مخصصة للربط بين الأنظمة" },
    { en: "BMS & IoT building automation protocol bridging", ar: "ربط أنظمة إدارة المباني الذكية BMS وبروتوكولات IoT" },
    { en: "Automated incident triggers & cross-system alerts", ar: "أتمتة الاستجابة للحوادث والتنبيهات المتقاطعة" },
    { en: "Legacy protocol modernization & cloud sync", ar: "تحديث البروتوكولات القديمة والمزامنة السحابية" },
    { en: "Custom telemetry reporting & analytics export", ar: "تقارير وتحليلات أداء تشغيلية قابلة للتخصيص" },
  ],
  consultation: [
    { en: "Strategic ICT & ELV infrastructure roadmap design", ar: "وضع خرائط طريق شاملة للبنية التحتية التكنولوجية" },
    { en: "Detailed Bill of Quantities (BOQ) preparation", ar: "إعداد وتدقيق جداول الكميات والمواصفات الفنية BOQ" },
    { en: "Vendor-neutral RFP & tender specifications authoring", ar: "صياغة كراسات الشروط والمناقصات التقنية المحايدة" },
    { en: "Value engineering & CAPEX / OPEX optimization", ar: "الهندسة القيمة وتحسين التكاليف الاستثمارية والتشغيلية" },
    { en: "Compliance audits against local & global standards", ar: "مراجعة ومطابقة الأنظمة للمعايير المحلية والدولية" },
    { en: "Third-party technical QA/QC site inspection", ar: "فحص وتقييم الجودة الفنية المستقل بالمواقع" },
  ],
  "project-management": [
    { en: "PMP-certified governance and milestone tracking", ar: "إدارة مشاريع معتمدة وفق معايير PMP ومتابعة دقيقة للمراحل" },
    { en: "Full on-site engineering supervision & coordination", ar: "إشراف هندسي ميداني وتنسيق متكامل بين المقاولين" },
    { en: "Proactive risk management & mitigation plans", ar: "إدارة استباقية للمخاطر وتفادي التأخير" },
    { en: "Rigorous QA/QC inspection checklists & factory tests", ar: "فحوصات جودة صارمة واختبارات قبول المصنع (FAT/SAT)" },
    { en: "Comprehensive As-Built drawings & O&M manuals", ar: "تسليم المخططات التنفيذية As-Built وكتيبات التشغيل" },
    { en: "End-to-end testing, commissioning & handover", ar: "الفحص والتشغيل التجريبي والتسليم النهائي للمشروع" },
  ],
};

const getLocalServicesCache = (): Record<string, Partial<Service>> => {
  try {
    const raw = localStorage.getItem("it_services_cache");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setLocalServiceCache = (slug: string, patch: Partial<Service>) => {
  try {
    const current = getLocalServicesCache();
    current[slug] = { ...current[slug], ...patch };
    localStorage.setItem("it_services_cache", JSON.stringify(current));
  } catch {}
};

const getInitialFallback = (): Service[] => {
  const localCache = getLocalServicesCache();
  return defaultServicesData.map((s, idx) => {
    const cached = localCache[s.slug] || {};
    const iconName = s.slug === "security" ? "Shield"
      : s.slug === "network" ? "Network"
      : s.slug === "audio-video" ? "MonitorPlay"
      : s.slug === "data-centers" ? "Server"
      : s.slug === "integration" ? "Layers"
      : s.slug === "consultation" ? "Lightbulb"
      : s.slug === "project-management" ? "ClipboardList"
      : "Layers";

    const defaultFeatures = DEFAULT_SERVICE_DELIVERABLES[s.slug] || [
      { en: "Architecture & engineering design", ar: "التصميم والمعمارية الهندسية" },
      { en: "Vendor-neutral multi-brand selection", ar: "اختيار محايد للتقنيات والموردين" },
      { en: "Turnkey project execution & testing", ar: "تنفيذ واختبار شامل للمشروع" },
      { en: "24/7 SLA maintenance & lifecycle support", ar: "دعم فني مستمر وصيانة دورية 24/7" },
    ];

    return {
      slug: s.slug,
      title: cached.title || { en: s.title.en, ar: s.title.ar },
      desc: cached.desc || { en: s.desc.en, ar: s.desc.ar },
      image: cached.image || s.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
      iconName: cached.iconName || iconName,
      published: cached.published !== undefined ? cached.published : true,
      sortOrder: cached.sortOrder !== undefined ? cached.sortOrder : idx,
      features: cached.features || defaultFeatures,
      seo: cached.seo || {
        metaTitle: { en: s.title.en, ar: s.title.ar },
        metaDescription: { en: s.desc.en, ar: s.desc.ar },
      },
    };
  });
};

type Ctx = {
  services: Service[];
  loading: boolean;
  refresh: () => Promise<void>;
  upsert: (s: Service) => Promise<void>;
  togglePublish: (slug: string, published: boolean) => Promise<void>;
  remove: (slug: string) => Promise<void>;
  get: (slug: string) => Service | undefined;
};

const ServicesContext = createContext<Ctx | null>(null);

const db = supabase as any;

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>(getInitialFallback);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const localCache = getLocalServicesCache();
    try {
      const { data, error } = await db
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("[services] Supabase load warning, using fallback:", error.message);
      } else if (data && data.length > 0) {
        const mapped: Service[] = data.map((d: any, idx: number) => {
          const cached = localCache[d.slug] || {};
          let titleEn = d.title_en || d.title?.en || d.title || "";
          let titleAr = d.title_ar || d.title?.ar || titleEn;
          let descEn = d.desc_en || d.desc?.en || d.desc || "";
          let descAr = d.desc_ar || d.desc?.ar || descEn;

          const published = cached.published !== undefined
            ? cached.published
            : (d.published !== false && d.active !== false && d.published !== 'false');

          let features: ServiceDeliverable[] = [];
          if (Array.isArray(d.features) && d.features.length > 0) {
            features = d.features;
          } else if (cached.features && cached.features.length > 0) {
            features = cached.features;
          } else if (DEFAULT_SERVICE_DELIVERABLES[d.slug]) {
            features = DEFAULT_SERVICE_DELIVERABLES[d.slug];
          }

          return {
            slug: d.slug || `service-${idx + 1}`,
            title: { en: titleEn || "Service", ar: titleAr || "خدمة" },
            desc: { en: descEn || "", ar: descAr || "" },
            image: d.image || d.image_url || cached.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
            iconName: d.icon_name || d.iconName || cached.iconName || "Layers",
            published,
            sortOrder: d.sort_order ?? idx,
            features,
            seo: {
              metaTitle: { en: d.meta_title_en || d.seo?.metaTitle?.en || titleEn, ar: d.meta_title_ar || d.seo?.metaTitle?.ar || titleAr },
              metaDescription: { en: d.meta_description_en || d.seo?.metaDescription?.en || descEn, ar: d.meta_description_ar || d.seo?.metaDescription?.ar || descAr },
              keywords: d.meta_keywords || d.seo?.keywords || "",
              ogImage: d.og_image || d.seo?.ogImage || "",
              canonicalUrl: d.canonical_url || d.seo?.canonicalUrl || "",
            },
          };
        });
        setServices(mapped);
      }
    } catch (err) {
      console.warn("[services] fetch exception", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel("services_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const upsert: Ctx["upsert"] = async (s) => {
    setLocalServiceCache(s.slug, s);
    setServices((prev) => {
      const idx = prev.findIndex((x) => x.slug === s.slug);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = s;
        return next;
      }
      return [s, ...prev];
    });

    const payload = {
      slug: s.slug,
      title_en: s.title.en,
      title_ar: s.title.ar,
      desc_en: s.desc.en,
      desc_ar: s.desc.ar,
      image: s.image,
      icon_name: s.iconName,
      published: s.published !== false,
      sort_order: s.sortOrder ?? 0,
      meta_title_en: s.seo?.metaTitle?.en,
      meta_title_ar: s.seo?.metaTitle?.ar,
      meta_description_en: s.seo?.metaDescription?.en,
      meta_description_ar: s.seo?.metaDescription?.ar,
      meta_keywords: s.seo?.keywords,
      og_image: s.seo?.ogImage,
      canonical_url: s.seo?.canonicalUrl,
    };

    try {
      const { error } = await db.from("services").upsert(payload, { onConflict: "slug" });
      if (error) throw new Error(error.message);
      await refresh();
    } catch (err) {
      console.warn("[services] DB upsert exception:", err);
      throw err;
    }
  };

  const togglePublish: Ctx["togglePublish"] = async (slug, published) => {
    setLocalServiceCache(slug, { published });
    setServices((prev) => prev.map((s) => (s.slug === slug ? { ...s, published } : s)));
    toast.success(published ? "Service published to website" : "Service hidden from website");

    try {
      const { error } = await db.from("services").update({ published }).eq("slug", slug);
      if (error) console.warn("[services] togglePublish DB warning:", error.message);
    } catch (err) {
      console.warn("[services] togglePublish exception:", err);
    }
  };

  const remove: Ctx["remove"] = async (slug) => {
    setServices((prev) => prev.filter((s) => s.slug !== slug));
    toast.success("Service removed");

    try {
      const { error } = await db.from("services").delete().eq("slug", slug);
      if (error) console.warn("[services] DB delete warning:", error.message);
      else await refresh();
    } catch (err) {
      console.warn("[services] DB delete exception:", err);
    }
  };

  const get: Ctx["get"] = (slug) => services.find((s) => s.slug === slug);

  return (
    <ServicesContext.Provider value={{ services, loading, refresh, upsert, togglePublish, remove, get }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be used within ServicesProvider");
  return ctx;
}
