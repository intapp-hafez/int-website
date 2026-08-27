import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Network,
  Globe,
  Wifi,
  Server,
  Shield,
  Lock,
  Cpu,
  Activity,
  Video,
  Key,
  Layers,
  Bell,
  Database,
  Zap,
  HardDrive,
  Cable,
  Cloud,
  Workflow,
  Radio,
  Terminal,
  Sliders,
  Eye,
  Compass,
  Share2,
  Code,
  Box,
  Laptop,
  Monitor,
  Smartphone,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

export type RelatedSolutionItem = {
  id: string;
  icon: string;
  title_en: string;
  title_ar: string;
  bio_en: string;
  bio_ar: string;
};

export type VendorItem = {
  id: string;
  name: string;
  logo: string;
  website_url?: string;
};

export type SolutionRow = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  bio_en: string;
  bio_ar: string;
  image: string;
  related_solutions: RelatedSolutionItem[];
  vendors: VendorItem[];
  active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export const AVAILABLE_SOLUTION_ICONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: "Network", label: "Network / Routing", icon: Network },
  { name: "Shield", label: "Security / Cyber Defense", icon: Shield },
  { name: "Video", label: "CCTV / Surveillance", icon: Video },
  { name: "Server", label: "Data Center / Servers", icon: Server },
  { name: "Lock", label: "Access Control / Locks", icon: Lock },
  { name: "Key", label: "Credentials / Auth", icon: Key },
  { name: "Wifi", label: "Wireless / Wi-Fi", icon: Wifi },
  { name: "Cable", label: "Fiber / Structured Cabling", icon: Cable },
  { name: "Cloud", label: "Cloud / Hybrid", icon: Cloud },
  { name: "Database", label: "Database / Storage", icon: Database },
  { name: "HardDrive", label: "NVMe / Storage Arrays", icon: HardDrive },
  { name: "Zap", label: "Power / UPS", icon: Zap },
  { name: "Activity", label: "Monitoring / SIEM", icon: Activity },
  { name: "Bell", label: "Alarm / Intrusion Detection", icon: Bell },
  { name: "Workflow", label: "Process / Integration", icon: Workflow },
  { name: "Sliders", label: "Control / Automation", icon: Sliders },
  { name: "Layers", label: "Layered Architecture", icon: Layers },
  { name: "Cpu", label: "Compute / Hardware", icon: Cpu },
  { name: "Globe", label: "Wide Area / Telecom", icon: Globe },
  { name: "Radio", label: "Radio / Wireless Comms", icon: Radio },
  { name: "Eye", label: "Optical / Thermal Vision", icon: Eye },
  { name: "Box", label: "Edge Hardware / Appliances", icon: Box },
  { name: "Terminal", label: "Command / CLI", icon: Terminal },
  { name: "Laptop", label: "Endpoint / Workstations", icon: Laptop },
  { name: "Monitor", label: "Operations Video Wall", icon: Monitor },
];

const ICON_MAP: Record<string, LucideIcon> = {
  Network,
  Globe,
  Wifi,
  Server,
  Shield,
  Lock,
  Cpu,
  Activity,
  Video,
  Key,
  Layers,
  Bell,
  Database,
  Zap,
  HardDrive,
  Cable,
  Cloud,
  Workflow,
  Radio,
  Terminal,
  Sliders,
  Eye,
  Compass,
  Share2,
  Code,
  Box,
  Laptop,
  Monitor,
  Smartphone,
};

export function getSolutionIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || HelpCircle;
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/\[\/?vc_[^\]]*\]/gi, "")
    .replace(/\[\/?wpb_[^\]]*\]/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export const DEFAULT_SOLUTIONS_DATA: SolutionRow[] = [
  {
    id: "sol-1",
    slug: "enterprise-networking-sdwan",
    name_en: "Enterprise Networking & SD-WAN",
    name_ar: "شبكات المؤسسات والربط الذكي SD-WAN",
    bio_en: "High-availability multi-cloud networking, structured fiber/copper cabling, intelligent SD-WAN switching, and secure wireless mesh architectures engineered for enterprise scale.",
    bio_ar: "حلول شبكات سحابية عالية التوافر، بنية تحتية للألياف الضوئية، تحويل ذكي عبر SD-WAN، وتغطية لاسلكية آمنة للمؤسسات.",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&q=80",
    related_solutions: [
      { id: "rel-1", icon: "Network", title_en: "SD-WAN & Dynamic Multipath Routing", title_ar: "الربط الذكي وتوجيه المسارات المتعددة", bio_en: "Zero-touch edge routing with automatic failover across fiber, 5G, and MPLS links.", bio_ar: "توجيه تلقائي ذكي عبر ألياف ضوئية وشبكات الجيل الخامس لضمان استمرارية الأعمال." },
      { id: "rel-2", icon: "Wifi", title_en: "Enterprise Wi-Fi 6E / 7 & High-Density Mesh", title_ar: "شبكات واي فاي 6E و 7 فائقة الكثافة", bio_en: "AI-driven RF optimization, seamless client roaming, and secure guest access portal.", bio_ar: "تحسين الترددات بالذكاء الاصطناعي مع تجوال سلس وبوابة دخول آمنة للزوار." },
      { id: "rel-3", icon: "Shield", title_en: "Network Access Control (802.1X NAC)", title_ar: "التحكم في الوصول إلى الشبكة (NAC)", bio_en: "Strict endpoint posture validation and dynamic VLAN segmentation per user role.", bio_ar: "التحقق الصارم من الأجهزة وتوزيع ديناميكي لشبكات VLAN حسب الصلاحيات." },
      { id: "rel-4", icon: "Cable", title_en: "Structured Cabling & OM4/OS2 Optical Fiber", title_ar: "التمديدات الهيكلية والألياف الضوئية", bio_en: "Certified Cat6A/Cat7 copper and 100G ready backbone optical distribution.", bio_ar: "تمديدات معتمدة لكابلات النحاس والألياف الضوئية بسرعات تصل إلى 100 جيجابت." },
    ],
    vendors: [
      { id: "v-1", name: "Cisco Systems", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/300px-Cisco_logo_blue_2016.svg.png", website_url: "https://cisco.com" },
      { id: "v-2", name: "Fortinet", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Fortinet_logo.svg/300px-Fortinet_logo.svg.png", website_url: "https://fortinet.com" },
      { id: "v-3", name: "Aruba (HPE)", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Aruba_Networks_logo.svg/300px-Aruba_Networks_logo.svg.png", website_url: "https://arubanetworks.com" },
    ],
    active: true,
    sort_order: 0,
  },
  {
    id: "sol-2",
    slug: "cybersecurity-zero-trust",
    name_en: "Cybersecurity & Zero Trust Architecture",
    name_ar: "الأمن السيبراني وبنية الثقة المعدومة Zero Trust",
    bio_en: "Next-generation firewalls, identity-driven micro-segmentation, continuous threat monitoring, and automated SOC response pipelines aligned with NCA standards.",
    bio_ar: "جدران حماية متقدمة، تجزئة دقيقة مبنية على الهوية، مراقبة مستمرة للتهديدات، واستجابة آلية متوافقة مع ضوابط الأمن السيبراني.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
    related_solutions: [
      { id: "rel-5", icon: "Lock", title_en: "Next-Gen Firewall & IPS/IDS Protection", title_ar: "جدار حماية متقدم ونظام منع الاختراق", bio_en: "Deep packet inspection, TLS 1.3 decryption, and zero-day threat emulation.", bio_ar: "فحص عميق للبيانات وفك تشفير TLS وحماية من ثغرات اليوم صفر." },
      { id: "rel-6", icon: "Key", title_en: "Privileged Access Management (PAM)", title_ar: "إدارة الوصول المتميز والصلاحيات", bio_en: "Session recording, credential vaulting, and just-in-time access elevation.", bio_ar: "تسجيل الجلسات، وتشفير بيانات الاعتماد، وإدارة الصلاحيات المؤقتة." },
      { id: "rel-7", icon: "Activity", title_en: "SIEM & SOC 24/7 Threat Intelligence", title_ar: "مركز مراقبة العمليات الأمنية SIEM / SOC", bio_en: "AI log correlation, incident triage, and automated containment playbooks.", bio_ar: "تحليل السجلات بالذكاء الاصطناعي والاستجابة الآلية للحوادث الأمنية." },
      { id: "rel-8", icon: "Shield", title_en: "Endpoint Detection & Response (EDR/XDR)", title_ar: "حماية النقاط الطرفية EDR / XDR", bio_en: "Behavioral telemetry monitoring with automated isolation of compromised assets.", bio_ar: "مراقبة سلوكية دقيقة للأجهزة وعزل فوري للأصول المشبوهة." },
    ],
    vendors: [
      { id: "v-4", name: "Palo Alto Networks", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Palo_Alto_Networks_2020_logo.svg/300px-Palo_Alto_Networks_2020_logo.svg.png", website_url: "https://paloaltonetworks.com" },
      { id: "v-5", name: "CrowdStrike", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/CrowdStrike_logo.svg/300px-CrowdStrike_logo.svg.png", website_url: "https://crowdstrike.com" },
      { id: "v-6", name: "Microsoft Security", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/300px-Microsoft_logo_%282012%29.svg.png", website_url: "https://microsoft.com/security" },
    ],
    active: true,
    sort_order: 1,
  },
  {
    id: "sol-3",
    slug: "smart-surveillance-physical-security",
    name_en: "Smart Surveillance & Integrated Physical Security",
    name_ar: "المراقبة الذكية والأنظمة الأمنية المتكاملة",
    bio_en: "AI-assisted CCTV analytics, biometric access control, perimeter intrusion detection, and centralized physical security information management (PSIM).",
    bio_ar: "كاميرات مراقبة بتحليلات الذكاء الاصطناعي، تحكم بالدخول البيومتري، حماية المحيط، ومنصة موحدة لإدارة الأمن المادي.",
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&q=80",
    related_solutions: [
      { id: "rel-9", icon: "Video", title_en: "AI Video Analytics & Object Recognition", title_ar: "تحليلات الفيديو الذكية والتعرف التلقائي", bio_en: "License plate recognition (ANPR), facial recognition, and crowd heatmapping.", bio_ar: "قراءة لوحات المركبات والتعرف على الوجوه وخرائط التجمع الحرارية." },
      { id: "rel-10", icon: "Key", title_en: "Biometric & RFID Access Control", title_ar: "أنظمة الدخول البيومتري والبطاقات الذكية", bio_en: "Speed turnstiles, multi-factor smart readers, and anti-passback zoning.", bio_ar: "بوابات مرور سريعة وقارئات ذكية متعددة العوامل وتحكم دقيق بالمناطق." },
      { id: "rel-11", icon: "Bell", title_en: "Perimeter Intrusion Detection & Radar", title_ar: "أنظمة حماية المحيط والرادار الأمني", bio_en: "Thermal optical tracking with laser fence and fence-mounted sensor cables.", bio_ar: "تتبع حراري مع حواجز ليزرية ومستشعرات ألياف على الأسوار." },
      { id: "rel-12", icon: "Sliders", title_en: "Unified PSIM Command & Control Center", title_ar: "مركز التحكم والسيطرة الموحد PSIM", bio_en: "Integrated map-based GIS incident dispatch and automated video wall matrix.", bio_ar: "إدارة البلاغات عبر الخرائط الجغرافية ومصفوفة شاشات المراقبة الجدارية." },
    ],
    vendors: [
      { id: "v-7", name: "Axis Communications", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Axis_Communications_logo.svg/300px-Axis_Communications_logo.svg.png", website_url: "https://axis.com" },
      { id: "v-8", name: "Hikvision Enterprise", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Hikvision_logo.svg/300px-Hikvision_logo.svg.png", website_url: "https://hikvision.com" },
      { id: "v-9", name: "Genetec", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Genetec_Logo.svg/300px-Genetec_Logo.svg.png", website_url: "https://genetec.com" },
    ],
    active: true,
    sort_order: 2,
  },
  {
    id: "sol-4",
    slug: "data-center-cloud-infrastructure",
    name_en: "Data Center & Cloud Infrastructure",
    name_ar: "مراكز البيانات والبنية السحابية",
    bio_en: "Modular Tier III data center engineering, precision cooling (In-Row/Chilled Water), clean agent fire suppression, and scalable hyper-converged infrastructure.",
    bio_ar: "هندسة مراكز البيانات المعيارية Tier III، تبريد دقيق، إطفاء حريق بالغاز النظيف، وبنية تحتية فائقة التقارب قابلة للتوسع.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80",
    related_solutions: [
      { id: "rel-13", icon: "Server", title_en: "Hyper-Converged Infrastructure (HCI)", title_ar: "البنية التحتية فائقة التقارب (HCI)", bio_en: "Software-defined compute, storage, and networking with NVMe flash arrays.", bio_ar: "معالجة وسعات تخزين وشبكات برمجية بمصفوفات NVMe فائقة السرعة." },
      { id: "rel-14", icon: "Zap", title_en: "Modular UPS & Redundant Power Delivery", title_ar: "أنظمة الطاقة غير المنقطعة UPS والتوزيع المزدوج", bio_en: "N+1 modular power systems with lithium-ion backup and automatic transfer switches.", bio_ar: "طاقة معيارية N+1 ببطاريات الليثيوم ومفاتيح تحويل أوتوماتيكية." },
      { id: "rel-15", icon: "HardDrive", title_en: "Precision Cooling & Hot/Cold Aisle Containment", title_ar: "التبريد الدقيق واحتواء الممرات الحرارية", bio_en: "Variable speed EC fans, chilled water loops, and smart rack environmental monitoring.", bio_ar: "مراوح متغيرة السرعة وحلقات ماء مبرد ومراقبة بيئية ذكية للخزائن." },
      { id: "rel-16", icon: "Cloud", title_en: "Hybrid Cloud Orchestration & Backup", title_ar: "إدارة السحابة الهجينة والنسخ الاحتياطي", bio_en: "Immutable ransomware-proof backup with instant disaster recovery replication.", bio_ar: "نسخ احتياطي غير قابل للتعديل ومقاوم للفدية مع استعادة فورية عند الكوارث." },
    ],
    vendors: [
      { id: "v-10", name: "Schneider Electric (APC)", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Schneider_Electric_2007.svg/300px-Schneider_Electric_2007.svg.png", website_url: "https://se.com" },
      { id: "v-11", name: "Dell Technologies", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/300px-Dell_Logo.svg.png", website_url: "https://dell.com" },
      { id: "v-12", name: "Vertiv", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Vertiv_logo.svg/300px-Vertiv_logo.svg.png", website_url: "https://vertiv.com" },
    ],
    active: true,
    sort_order: 3,
  },
];

type SolutionsContextType = {
  solutions: SolutionRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  upsert: (sol: Partial<SolutionRow> & { slug: string }) => Promise<any>;
  remove: (idOrSlug: string) => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<void>;
  move: (id: string, direction: "up" | "down") => Promise<void>;
  get: (slug: string) => SolutionRow | undefined;
};

const SolutionsContext = createContext<SolutionsContextType | null>(null);

const db = supabase as any;

export function SolutionsProvider({ children }: { children: ReactNode }) {
  const [solutions, setSolutions] = useState<SolutionRow[]>(DEFAULT_SOLUTIONS_DATA);
  const [loading, setLoading] = useState(true);

  const fetchSolutions = async () => {
    try {
      const { data, error } = await db
        .from("solutions")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("[solutions-store] Fetch error, using cached/default:", error);
      } else if (data && data.length > 0) {
        setSolutions(
          data.map((item: any) => ({
            id: item.id,
            slug: item.slug,
            name_en: item.name_en || "",
            name_ar: item.name_ar || "",
            bio_en: item.bio_en || "",
            bio_ar: item.bio_ar || "",
            image: item.image || "",
            related_solutions: Array.isArray(item.related_solutions) ? item.related_solutions : [],
            vendors: Array.isArray(item.vendors) ? item.vendors : [],
            active: item.active !== false,
            sort_order: item.sort_order ?? 0,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }))
        );
      }
    } catch (err) {
      console.warn("[solutions-store] Unexpected fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSolutions();

    // Single realtime channel subscription
    const channel = supabase
      .channel("solutions_realtime_provider")
      .on("postgres_changes", { event: "*", schema: "public", table: "solutions" }, () => {
        void fetchSolutions();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const upsert = async (sol: Partial<SolutionRow> & { slug: string }) => {
    const payload = {
      slug: sol.slug,
      name_en: sol.name_en ?? "",
      name_ar: sol.name_ar ?? "",
      bio_en: sol.bio_en ?? "",
      bio_ar: sol.bio_ar ?? "",
      image: sol.image ?? "",
      related_solutions: sol.related_solutions ?? [],
      vendors: sol.vendors ?? [],
      active: sol.active !== false,
      sort_order: sol.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from("solutions")
      .upsert(payload as any, { onConflict: "slug" })
      .select()
      .single();

    if (error) throw error;
    await fetchSolutions();
    return data;
  };

  const remove = async (idOrSlug: string) => {
    const isUuid = idOrSlug.includes("-") && idOrSlug.length === 36;
    const query = isUuid
      ? db.from("solutions").delete().eq("id", idOrSlug)
      : db.from("solutions").delete().eq("slug", idOrSlug);

    const { error } = await query;
    if (error) throw error;
    await fetchSolutions();
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await db
      .from("solutions")
      .update({ active, updated_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) throw error;
    await fetchSolutions();
  };

  const move = async (id: string, direction: "up" | "down") => {
    const sorted = [...solutions].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((s) => s.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];

    const currentOrder = current.sort_order;
    const targetOrder = target.sort_order;

    await db.from("solutions").update({ sort_order: targetOrder } as any).eq("id", current.id);
    await db.from("solutions").update({ sort_order: currentOrder } as any).eq("id", target.id);

    await fetchSolutions();
  };

  const get = (slug: string) => solutions.find((s) => s.slug === slug);

  return (
    <SolutionsContext.Provider
      value={{
        solutions,
        loading,
        refresh: fetchSolutions,
        upsert,
        remove,
        toggleActive,
        move,
        get,
      }}
    >
      {children}
    </SolutionsContext.Provider>
  );
}

export function useSolutions() {
  const ctx = useContext(SolutionsContext);
  if (!ctx) {
    // Graceful fallback if rendered outside provider
    return {
      solutions: DEFAULT_SOLUTIONS_DATA,
      loading: false,
      refresh: async () => {},
      upsert: async () => {},
      remove: async () => {},
      toggleActive: async () => {},
      move: async () => {},
      get: (slug: string) => DEFAULT_SOLUTIONS_DATA.find((s) => s.slug === slug),
    };
  }
  return ctx;
}
