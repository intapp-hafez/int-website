import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FaqItem = {
  id: string;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  category_en: string;
  category_ar: string;
  active: boolean;
  sort_order: number;
};

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "faq-01",
    question_en: "What industries and enterprise sectors do you serve?",
    question_ar: "ما القطاعات والمجالات التي تخدمونها؟",
    answer_en: "Integrated Technics serves government entities, banking & financial institutions, healthcare networks, oil & gas facilities, telecommunications operators, and commercial mega-campuses across Egypt and the MENA region.",
    answer_ar: "تقدم إنترجريتد تكنيكس خدماتها للجهات الحكومية، القطاع المصرفي والبنوك، مجمعات الرعاية الصحية، قطاع البترول والغاز، مشغلي الاتصالات، والمشاريع التجارية الكبرى في مصر والشرق الأوسط.",
    category_en: "General",
    category_ar: "عام",
    active: true,
    sort_order: 1,
  },
  {
    id: "faq-02",
    question_en: "What types of security surveillance and CCTV systems do you engineer?",
    question_ar: "ما نوعية أنظمة المراقبة والكاميرات CCTV التي تقومون بتنفيذها؟",
    answer_en: "We engineer turnkey IP surveillance solutions ranging from 4K/8K AI-driven cameras, Automated Number Plate Recognition (ANPR), perimeter thermal radar, and explosive-proof ATEX cameras to centralized multi-tier video management systems (VMS) with video wall command centers.",
    answer_ar: "نقوم بتصميم وتنفيذ حلول المراقبة الذكية المتكاملة بدقة 4K و8K المدعومة بالذكاء الاصطناعي، أنظمة التعرف على لوحات السيارات، الرادارات الحرارية لتأمين الأسوار، والكاميرات المقاومة للانفجار مع ربطها بغرف تحكم مركزية وشاشات عرض موحدة.",
    category_en: "Security & CCTV",
    category_ar: "الأنظمة الأمنية والمراقبة",
    active: true,
    sort_order: 2,
  },
  {
    id: "faq-03",
    question_en: "Do you design and build certified Tier-3 / Tier-4 data centers?",
    question_ar: "هل تقومون بتصميم وبناء مراكز بيانات معتمدة من المستوى الثالث Tier-3؟",
    answer_en: "Yes. We provide end-to-end data center turnkey delivery including precision cooling (CRAC/InRow), modular UPS power backup, clean-agent fire suppression (FM-200 / Novec 1230), environmental DCIM monitoring, and certified structured copper/fiber cabling.",
    answer_ar: "نعم. نقدم حلول مراكز البيانات الشاملة التي تشمل التبريد الدقيق، أنظمة الطاقة غير المنقطعة UPS المعيارية، أنظمة إطفاء الحرائق بالغازات النظيفة، أنظمة المراقبة البيئية DCIM، وتمديدات كابلات الفايبر والنحاس المعتمدة.",
    category_en: "Data Centers & Networks",
    category_ar: "مراكز البيانات والشبكات",
    active: true,
    sort_order: 3,
  },
  {
    id: "faq-04",
    question_en: "What post-deployment SLA support and maintenance packages are available?",
    question_ar: "ما باقات الصيانة واتفاقيات مستوى الخدمة (SLA) المتاحة بعد التنفيذ؟",
    answer_en: "We provide 24/7/365 proactive NOC monitoring, guaranteed on-site emergency dispatch within 2 hours, preventative quarterly maintenance audits, and full spare-parts replacement warranties tailored to critical enterprise operations.",
    answer_ar: "نوفر مراقبة استباقية لغرف العمليات على مدار الساعة 24/7، استجابة موقعية طارئة مضمونة خلال ساعتين، زيارات صيانة وقائية دورية، وضمان استبدال قطع الغيار الأصلية المعتمدة.",
    category_en: "Maintenance & SLAs",
    category_ar: "الصيانة ومستويات الخدمة",
    active: true,
    sort_order: 4,
  },
  {
    id: "faq-05",
    question_en: "Can your solutions integrate with our existing legacy infrastructure?",
    question_ar: "هل يمكن دمج حلولكم مع أنظمتنا الحالية ومعداتنا السابقة؟",
    answer_en: "Yes. Our certified systems architects specialize in vendor-agnostic interoperability using standard open APIs (ONVIF, BACnet, Modbus, REST, SNMP) to unify legacy equipment with state-of-the-art management platforms seamlessly.",
    answer_ar: "نعم. يتخصص مهندسونا المعتمدون في التكامل بين مختلف الأنظمة والمصنعين عبر البروتوكولات المفتوحة (ONVIF، BACnet، Modbus، REST، SNMP) لربط الأنظمة القائمة مع منصات الإدارة الحديثة بدون تعارض.",
    category_en: "Integration",
    category_ar: "التكامل والربط البرمجي",
    active: true,
    sort_order: 5,
  },
  {
    id: "faq-06",
    question_en: "What interactive audio/visual and smart boardroom technologies do you supply?",
    question_ar: "ما حلول القاعات الذكية والأنظمة الصوتية والمرئية التي تقدمونها؟",
    answer_en: "We install unified conferencing rooms featuring beamforming microphone arrays, automated speaker tracking 4K PTZ cameras, wireless screen sharing, ultra-narrow LED video walls, and centralized touch automation (Crestron/Extron).",
    answer_ar: "نقوم بتجهيز قاعات المؤتمرات التفاعلية بمصفوفات ميكروفونات ذكية لتتبع المتحدثين، كاميرات 4K PTZ آلية، شاشات عرض عملاقة بدون حواف، وأنظمة تحكم أوتوماتيكي ذكي تعمل باللمس.",
    category_en: "Audio & Visual",
    category_ar: "الصوتيات والمرئيات",
    active: true,
    sort_order: 6,
  },
  {
    id: "faq-07",
    question_en: "How do I request a technical site survey or commercial quotation?",
    question_ar: "كيف يمكنني طلب معاينة موقعية أو عرض أسعار لمشروعي؟",
    answer_en: "You can submit your project details via our /contact page, request a direct technical callback on WhatsApp, or email sales@integratedtechnics.com. A senior solutions engineer will contact you within 24 hours.",
    answer_ar: "يمكنك إرسال تفاصيل مشروعك عبر صفحة التواصل، أو طلب محادثة مباشرة عبر واتساب، أو مراسلتنا على sales@integratedtechnics.com، وسيتواصل معك مهندس حلول معتمد خلال 24 ساعة.",
    category_en: "General",
    category_ar: "عام",
    active: true,
    sort_order: 7,
  },
];

type Ctx = {
  faqs: FaqItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  upsert: (item: Partial<FaqItem> & { id?: string }) => Promise<FaqItem | null>;
  remove: (id: string) => Promise<void>;
  move: (id: string, delta: number) => Promise<void>;
};

const FaqsContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "it_faqs_cache_v2";

export function FaqsProvider({ children }: { children: ReactNode }) {
  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_FAQS;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_FAQS;
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("faqs")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error || !data || data.length === 0) {
        setFaqs((prev) => (prev.length > 0 ? prev : DEFAULT_FAQS));
      } else {
        const mapped: FaqItem[] = data.map((d: any) => ({
          id: d.id,
          question_en: d.question_en || "",
          question_ar: d.question_ar || "",
          answer_en: d.answer_en || "",
          answer_ar: d.answer_ar || "",
          category_en: d.category_en || "General",
          category_ar: d.category_ar || "عام",
          active: d.active !== false,
          sort_order: Number(d.sort_order) || 0,
        }));
        setFaqs(mapped);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        } catch {}
      }
    } catch {
      setFaqs((prev) => (prev.length > 0 ? prev : DEFAULT_FAQS));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel("faqs_realtime_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "faqs" }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const upsert: Ctx["upsert"] = async (item) => {
    const payload: any = {
      question_en: item.question_en ?? "",
      question_ar: item.question_ar ?? "",
      answer_en: item.answer_en ?? "",
      answer_ar: item.answer_ar ?? "",
      category_en: item.category_en ?? "General",
      category_ar: item.category_ar ?? "عام",
      active: item.active !== false,
      sort_order: item.sort_order ?? faqs.length + 1,
      updated_at: new Date().toISOString(),
    };
    if (item.id && !item.id.startsWith("faq-")) {
      payload.id = item.id;
    }

    try {
      const { data, error } = await (supabase as any)
        .from("faqs")
        .upsert(payload)
        .select()
        .single();

      if (error) {
        // Fallback optimistic update
        const id = item.id || `faq-${Date.now()}`;
        const finalItem: FaqItem = { ...payload, id };
        setFaqs((prev) => {
          const idx = prev.findIndex((f) => f.id === id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = finalItem;
            return copy;
          }
          return [...prev, finalItem];
        });
        return finalItem;
      }

      await refresh();
      return data as FaqItem;
    } catch {
      const id = item.id || `faq-${Date.now()}`;
      const finalItem: FaqItem = { ...payload, id };
      setFaqs((prev) => {
        const idx = prev.findIndex((f) => f.id === id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = finalItem;
          return copy;
        }
        return [...prev, finalItem];
      });
      return finalItem;
    }
  };

  const remove: Ctx["remove"] = async (id) => {
    try {
      await (supabase as any).from("faqs").delete().eq("id", id);
    } catch {}
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const move: Ctx["move"] = async (id, delta) => {
    const sorted = [...faqs].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((f) => f.id === id);
    if (index === -1) return;
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];

    const currentOrder = current.sort_order;
    const targetOrder = target.sort_order;

    // Swap orders
    current.sort_order = targetOrder;
    target.sort_order = currentOrder;

    setFaqs([...sorted]);

    try {
      await (supabase as any).from("faqs").upsert([
        { id: current.id, sort_order: current.sort_order },
        { id: target.id, sort_order: target.sort_order },
      ]);
    } catch {}
  };

  return (
    <FaqsContext.Provider value={{ faqs, loading, refresh, upsert, remove, move }}>
      {children}
    </FaqsContext.Provider>
  );
}

export function useFaqs() {
  const ctx = useContext(FaqsContext);
  if (!ctx) throw new Error("useFaqs must be used within FaqsProvider");
  return ctx;
}
