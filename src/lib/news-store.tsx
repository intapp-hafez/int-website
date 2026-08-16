import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NewsPost = {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  excerpt_en: string;
  excerpt_ar: string;
  body_en: string;
  body_ar: string;
  category_en: string;
  category_ar: string;
  image_url: string;
  published_at: string;
  active: boolean;
  featured: boolean;
  sort_order: number;
  seo_title_en: string;
  seo_title_ar: string;
  seo_description_en: string;
  seo_description_ar: string;
};

export const DEFAULT_NEWS_POSTS: NewsPost[] = [
  {
    id: "news-001",
    slug: "cctv-ai-security-capital-expansion",
    title_en: "Integrated Technics Expands Turnkey CCTV & AI Security Operations in New Administrative Capital",
    title_ar: "إنترجريتد تكنيكس توسع عملياتها لأنظمة المراقبة الذكية والذكاء الاصطناعي في العاصمة الإدارية الجديدة",
    excerpt_en: "Integrated Technics announces the delivery of integrated AI surveillance and optical fiber infrastructure across government headquarters.",
    excerpt_ar: "أعلنت شركة إنترجريتد تكنيكس عن تسليم البنية التحتية المتكاملة لأنظمة المراقبة الذكية والألياف الضوئية للمقرات الحكومية بالعاصمة الإدارية.",
    body_en: "<p>Integrated Technics is proud to announce the successful deployment of next-generation physical security solutions across key governmental and administrative zones in the New Administrative Capital.</p><h3>Project Highlights</h3><ul><li>Over 2,400 AI-powered 4K cameras with automated license plate recognition (ALPR).</li><li>Redundant optical fiber backbone connecting multi-tier control rooms.</li><li>Centralized command and control software with real-time video analytics.</li></ul>",
    body_ar: "<p>تفخر شركة إنترجريتد تكنيكس بالإعلان عن الإنجاز الناجح لمشاريع الحلول الأمنية المتقدمة عبر مقرات استراتيجية في العاصمة الإدارية الجديدة.</p><h3>أبرز ملامح المشروع</h3><ul><li>أكثر من 2,400 كاميرا ذكية بدقة 4K مع التعرف التلقائي على لوحات المركبات (ALPR).</li><li>شبكة ألياف ضوئية فائقة السرعة مع مسارات احتياطية لغرف التحكم والمراقبة المركزية.</li><li>منظومة تحكم وإدارة موحدة تدعم التحليلات المرئية الفورية بالذكاء الاصطناعي.</li></ul>",
    category_en: "Projects & Expansion",
    category_ar: "المشاريع والتوسع",
    image_url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&q=80",
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    active: true,
    featured: true,
    sort_order: 1,
    seo_title_en: "Turnkey CCTV & AI Security Projects | Integrated Technics",
    seo_title_ar: "مشاريع المراقبة الذكية والتحكم الأمني | إنترجريتد تكنيكس",
    seo_description_en: "Integrated Technics deploys AI surveillance, ALPR, and optical fiber across strategic enterprise infrastructure.",
    seo_description_ar: "أنظمة مراقبة ذكية بالذكاء الاصطناعي وتحكم مركزي متقدم للبنية التحتية الحيوية من إنترجريتد تكنيكس.",
  },
  {
    id: "news-002",
    slug: "strategic-datacenter-partnership-cisco-fortinet",
    title_en: "Strategic Partnership with Cisco & Fortinet for Tier-3 Enterprise Data Centers",
    title_ar: "شراكة استراتيجية مع سيسكو وفورتينت لتجهيز مراكز البيانات المعتمدة من المستوى الثالث",
    excerpt_en: "New alliance delivering next-generation cybersecurity, SD-WAN, and high-density computing infrastructure for banks and telecom operators.",
    excerpt_ar: "تحالف جديد لتقديم حلول الأمن السيبراني المتقدمة والبنية التحتية لمراكز البيانات عالية الكثافة للبنوك وشركات الاتصالات.",
    body_en: "<p>As part of our commitment to delivering mission-critical technology, Integrated Technics has finalized top-tier strategic distribution and integration agreements with Cisco Systems and Fortinet.</p><p>This partnership empowers enterprise clients with zero-trust network architectures, next-generation firewalls, and certified Tier-3 modular data center deployments.</p>",
    body_ar: "<p>في إطار التزامنا بتقديم أعلى معايير البنية التحتية التكنولوجية، أبرمت شركة إنترجريتد تكنيكس اتفاقيات شراكة وتكامل تقني متقدمة مع كبرى الشركات العالمية سيسكو وفورتينت.</p><p>تتيح هذه الشراكة لعملائنا في القطاعين المصرفي والاتصالات الاستفادة من حلول أمن الشبكات القائمة على مبدأ انعدام الثقة (Zero Trust) وتجهيز مراكز بيانات معتمدة من المستوى الثالث.</p>",
    category_en: "Partnerships",
    category_ar: "شراكات استراتيجية",
    image_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80",
    published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    active: true,
    featured: false,
    sort_order: 2,
    seo_title_en: "Tier-3 Data Center & Cybersecurity Solutions | Integrated Technics",
    seo_title_ar: "حلول مراكز البيانات والأمن السيبراني | إنترجريتد تكنيكس",
    seo_description_en: "Enterprise Cisco and Fortinet integration for Tier-3 certified data centers and mission-critical networks.",
    seo_description_ar: "تجهيز وتكامل مراكز البيانات المعتمدة وشبكات سيسكو وفورتينت المتقدمة للشركات والبنوك.",
  },
  {
    id: "news-003",
    slug: "smart-boardrooms-banking-sector",
    title_en: "Delivery of Intelligent Audio/Visual & Boardroom Systems for Top Banking Headquarters",
    title_ar: "تسليم أنظمة القاعات الذكية والصوتيات والمرئيات للمقرات الرئيسية للبنوك الكبرى",
    excerpt_en: "State-of-the-art interactive conferencing, acoustic treatment, and central video matrix deployed for executive governance suites.",
    excerpt_ar: "تجهيز قاعات المؤتمرات التفاعلية وأحدث أنظمة العرض والمعالجات الصوتية الذكية لمجالس الإدارة بالقطاع المصرفي.",
    body_en: "<p>Integrated Technics Audio/Visual division has completed the comprehensive outfitting of multi-purpose auditoriums and executive boardrooms for leading regional financial institutions.</p><ul><li>4K laser projection and ultra-narrow bezel interactive LED video walls.</li><li>Automated beamforming microphone arrays with acoustic echo cancellation.</li><li>Crestron/Extron central touch control panels for unified meeting automation.</li></ul>",
    body_ar: "<p>أنجز قطاع الأنظمة السمعية والبصرية بشركة إنترجريتد تكنيكس تجهيز قاعات الاجتماعات الرئيسية وقاعات المؤتمرات التفاعلية لعدد من كبرى البنوك والمؤسسات المالية.</p><ul><li>شاشات جدارية تفاعلية فائقة الدقة 4K مع إضاءة ليزرية متقدمة.</li><li>مصفوفات ميكروفونات ذكية تعتمد تقنية التتبع الصوتي المباشر مع عزل الضوضاء والصدى.</li><li>أنظمة تحكم مركزي موحدة تعمل باللمس لتسهيل الاجتماعات الهجينة والافتراضية.</li></ul>",
    category_en: "Audio & Visual",
    category_ar: "الصوتيات والمرئيات",
    image_url: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80",
    published_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    active: true,
    featured: false,
    sort_order: 3,
    seo_title_en: "Smart Boardrooms & AV Integration | Integrated Technics",
    seo_title_ar: "قاعات الاجتماعات الذكية والأنظمة الصوتية المرئية | إنترجريتد تكنيكس",
    seo_description_en: "Turnkey audiovisual conference rooms, video walls, and meeting automation by Integrated Technics.",
    seo_description_ar: "تجهيز قاعات الاجتماعات وغرف المؤتمرات الذكية وشاشات العرض الاحترافية.",
  },
  {
    id: "news-004",
    slug: "best-infrastructure-integrator-award-2026",
    title_en: "Integrated Technics Wins Best Infrastructure Integrator 2026 Award",
    title_ar: "إنترجريتد تكنيكس تفوز بجائزة أفضل منفذ للبنية التحتية المتكاملة لعام 2026",
    excerpt_en: "Recognized for engineering excellence in mission-critical infrastructure, access control, and large-scale industrial IoT integration.",
    excerpt_ar: "تكريم الشركة لتميزها الهندسي في تنفيذ مشاريع البنية التحتية الحيوية وأنظمة التحكم بالدخول والربط الصناعي.",
    body_en: "<p>At the Annual ICT & Security Summit 2026, Integrated Technics was awarded the prestigious trophy for Best Enterprise Infrastructure Integrator, recognizing over two decades of engineering leadership.</p>",
    body_ar: "<p>خلال فعاليات القمة السنوية لتكنولوجيا المعلومات والأنظمة الأمنية 2026، حصدت شركة إنترجريتد تكنيكس درع التميز كأفضل منفذ للبنية التحتية المتكاملة للمشاريع الكبرى.</p>",
    category_en: "Awards & Recognition",
    category_ar: "جوائز وتكريمات",
    image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80",
    published_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    active: true,
    featured: false,
    sort_order: 4,
    seo_title_en: "Best Infrastructure Integrator Award 2026 | Integrated Technics",
    seo_title_ar: "جائزة أفضل منفذ للبنية التحتية 2026 | إنترجريتد تكنيكس",
    seo_description_en: "Integrated Technics awarded Best Enterprise Infrastructure Integrator for engineering excellence.",
    seo_description_ar: "فوز إنترجريتد تكنيكس بجائزة أفضل منفذ للبنية التحتية المتكاملة لعام 2026.",
  },
  {
    id: "news-005",
    slug: "launch-247-managed-noc-sla-support",
    title_en: "Launch of Next-Gen 24/7 Managed NOC & Maintenance SLA Packages",
    title_ar: "إطلاق باقات المراقبة الاستباقية لغرف العمليات (NOC) على مدار الساعة والصيانة الوقائية",
    excerpt_en: "Introducing 24/7 proactive network operations center (NOC) monitoring, preventive maintenance, and guaranteed 2-hour SLA response.",
    excerpt_ar: "إطلاق باقات المراقبة الاستباقية لغرف العمليات (NOC) على مدار الساعة والصيانة الوقائية مع استجابة فورية خلال ساعتين.",
    body_en: "<p>We are excited to announce the expansion of our Managed Services division with 24/7/365 Network Operations Center (NOC) monitoring and specialized SLA maintenance contracts for critical infrastructure.</p>",
    body_ar: "<p>يسرنا الإعلان عن إطلاق خدمات إدارة وتشغيل الشبكات وغرف العمليات المركزية (NOC) على مدار الساعة مع عقود صيانة سنوية مخصصة تضمن استجابة فورية لحماية استمرارية الأعمال.</p>",
    category_en: "Services & SLA",
    category_ar: "خدمات الصيانة والتشغيل",
    image_url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80",
    published_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    active: true,
    featured: false,
    sort_order: 5,
    seo_title_en: "24/7 Managed NOC & SLA Maintenance Contracts | Integrated Technics",
    seo_title_ar: "عقود الصيانة وخدمات إدارة العمليات 24/7 | إنترجريتد تكنيكس",
    seo_description_en: "Proactive 24/7 NOC monitoring and rapid SLA support for enterprise IT, security, and low-current networks.",
    seo_description_ar: "خدمات إدارة الشبكات والصيانة الوقائية على مدار الساعة مع ضمان أعلى مستويات الجودة واستمرارية الخدمة.",
  },
];

type Ctx = {
  posts: NewsPost[];
  loading: boolean;
  refresh: () => Promise<void>;
  upsert: (p: Partial<NewsPost> & { id?: string }) => Promise<NewsPost | null>;
  remove: (id: string) => Promise<void>;
};

const NewsContext = createContext<Ctx | null>(null);

function slugify(s: string) {
  return (s || "post")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `post-${Date.now()}`;
}

export function NewsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("published_at", { ascending: false });

      if (error || !data || data.length === 0) {
        setPosts(DEFAULT_NEWS_POSTS);
      } else {
        setPosts(data as NewsPost[]);
      }
    } catch {
      setPosts(DEFAULT_NEWS_POSTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const upsert: Ctx["upsert"] = async (p) => {
    const baseSlug = p.slug?.trim() || slugify(p.title_en || p.title_ar || "post");
    const payload: any = {
      slug: baseSlug,
      title_en: p.title_en ?? "",
      title_ar: p.title_ar ?? "",
      excerpt_en: p.excerpt_en ?? "",
      excerpt_ar: p.excerpt_ar ?? "",
      body_en: p.body_en ?? "",
      body_ar: p.body_ar ?? "",
      category_en: p.category_en ?? "",
      category_ar: p.category_ar ?? "",
      image_url: p.image_url ?? "",
      published_at: p.published_at ?? new Date().toISOString(),
      active: p.active ?? true,
      featured: p.featured ?? false,
      sort_order: p.sort_order ?? 0,
      seo_title_en: p.seo_title_en ?? "",
      seo_title_ar: p.seo_title_ar ?? "",
      seo_description_en: p.seo_description_en ?? "",
      seo_description_ar: p.seo_description_ar ?? "",
    };
    if (p.id) payload.id = p.id;
    try {
      const { data, error } = await supabase.from("news_posts").upsert(payload).select().single();
      if (error) {
        // Fallback optimistic update
        setPosts((prev) => {
          const index = prev.findIndex((item) => item.id === (p.id || payload.id) || item.slug === payload.slug);
          const newItem = { ...(index >= 0 ? prev[index] : {}), ...payload, id: p.id || payload.id || crypto.randomUUID() };
          if (index >= 0) {
            const copy = [...prev];
            copy[index] = newItem;
            return copy;
          }
          return [newItem, ...prev];
        });
        return payload as NewsPost;
      }
      await refresh();
      return data as NewsPost;
    } catch {
      setPosts((prev) => {
        const index = prev.findIndex((item) => item.id === p.id || item.slug === payload.slug);
        const newItem = { ...(index >= 0 ? prev[index] : {}), ...payload, id: p.id || crypto.randomUUID() };
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = newItem;
          return copy;
        }
        return [newItem, ...prev];
      });
      return payload as NewsPost;
    }
  };

  const remove: Ctx["remove"] = async (id) => {
    try {
      await supabase.from("news_posts").delete().eq("id", id);
    } catch {}
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <NewsContext.Provider value={{ posts, loading, refresh, upsert, remove }}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used within NewsProvider");
  return ctx;
}