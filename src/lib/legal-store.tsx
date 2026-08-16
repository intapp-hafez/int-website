import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BilingualLegal = {
  en: string;
  ar: string;
};

export const DEFAULT_TERMS: BilingualLegal = {
  en: `<h2>1. Acceptance of Terms</h2>
<p>By accessing the Integrated Technics portal, engaging our turnkey system integration engineering services, or submitting technical Request for Quotations (RFQs), you agree to be bound by these Master Terms of Service and any project-specific Service Level Agreements (SLAs).</p>

<h2>2. Scope of Engineering & Integration Services</h2>
<p>Integrated Technics provides engineering design, hardware procurement, on-site commissioning, and post-deployment maintenance for IP Video Surveillance (CCTV), Tier-3 Data Center infrastructure, Structured Cabling, Access Control, and Smart Audio/Visual Boardrooms.</p>

<h2>3. Commercial Quotations & Payment Milestones</h2>
<p>Official technical quotations remain valid for thirty (30) calendar days from issuance. Standard project milestone disbursements follow a 40% initial procurement advance, 40% upon site delivery and hardware inspection, and 20% following final Factory/Site Acceptance Testing (FAT/SAT) and formal commissioning signoff.</p>

<h2>4. Warranties & Hardware RMA Coverage</h2>
<p>All passive and active hardware supplied includes manufacturer warranties backed by Integrated Technics certified engineers. Warranty claims for defective components are processed via expedited RMA replacement.</p>

<h2>5. 24/7 SLA & Maintenance Deliverables</h2>
<p>Enterprise SLA contracts guarantee maximum 2-hour on-site dispatch for critical Severity-1 outages and continuous 24/7/365 NOC monitoring.</p>

<h2>6. Governing Law & Jurisdiction</h2>
<p>These terms shall be governed by and construed in accordance with the laws of the Arab Republic of Egypt and the commercial courts of Cairo.</p>`,
  ar: `<h2>١. قبول الشروط والأحكام</h2>
<p>باستخدامك لموقع وبوابة إنترجريتد تكنيكس أو طلب عروض الأسعار الهندسية والتعاقد على خدماتنا المتكاملة، فإنك توافق على الالتزام ببنود هذه الاتفاقية الرئيسية واتفاقيات مستوى الخدمة (SLA) المرتبطة بمشروعك.</p>

<h2>٢. نطاق الخدمات الهندسية والتكامل</h2>
<p>تتخصص شركة إنترجريتد تكنيكس في التصميم الهندسي والتوريد والتركيب والتشغيل والصيانة لأنظمة المراقبة بالكاميرات CCTV، مراكز البيانات Tier-3، شبكات وكابلات الفايبر والنحاس، أنظمة التحكم بالدخول، والقاعات الذكية وأنظمة الصوتيات والمرئيات.</p>

<h2>٣. عروض الأسعار والدفعات المالية</h2>
<p>تكون عروض الأسعار الفنية والمالية سارية لمدة ثلاثين (٣٠) يوماً من تاريخ إصدارها. وتخضع الدفعات لجدول الإنجاز الهندسي: ٤٠٪ دفعة مقدمة للتوريدات، ٤٠٪ عند التوريد الموقع والفحص، و٢٠٪ بعد اختبارات القبول والتشغيل النهائي والتسليم.</p>

<h2>٤. الضمان وخدمات استبدال المعدات</h2>
<p>تشمل جميع الأنظمة والمعدات الموردة ضمان المصنع المعتمد مع توفير قطع الغيار الأصلية والدعم الفني المباشر من مهندسينا المعتمدين.</p>

<h2>٥. اتفاقيات الصيانة والدعم الفني 24/7</h2>
<p>تضمن عقود الصيانة المعتمدة استجابة موقعية طارئة خلال ساعتين كحد أقصى للأعطال الحرجة مع مراقبة استباقية لغرف العمليات على مدار الساعة.</p>

<h2>٦. القانون الواجب التطبيق والاختصاص القضائي</h2>
<p>تخضع هذه الشروط وتفسر وفقاً لأحكام القوانين السارية في جمهورية مصر العربية ومحاكم القاهرة المختصة.</p>`,
};

export const DEFAULT_POLICIES: BilingualLegal = {
  en: `<h2>1. Executive Commitment</h2>
<p>Integrated Technics is committed to safeguarding the privacy and confidentiality of corporate clients, engineering partners, and portal visitors in accordance with global data protection standards and Egyptian Personal Data Protection Law No. 151.</p>

<h2>2. Information We Collect</h2>
<p>We collect corporate contact credentials (name, enterprise email, telephone, company identity), technical project specifications, architectural site requirements submitted via RFQ forms, and server telemetry.</p>

<h2>3. Purpose of Processing</h2>
<p>All data submitted is used strictly for engineering feasibility reviews, commercial quote formulation, SLA dispatch orchestration, account management, and client communication.</p>

<h2>4. Cyber Security & Infrastructure Integrity</h2>
<p>We employ enterprise-grade TLS 1.3 encryption in transit, AES-256 encryption at rest, multi-tenant role-based access controls (RBAC), and continuous vulnerability monitoring.</p>

<h2>5. Data Retention & Client Rights</h2>
<p>You maintain the right to inspect, correct, export, or request the secure erasure of your personal data at any time by contacting our Data Protection Officer at privacy@integratedtechnics.com.</p>`,
  ar: `<h2>١. التزامنا بحماية الخصوصية</h2>
<p>تلتزم شركة إنترجريتد تكنيكس بحماية خصوصية وسرية بيانات عملائها وشركائها وزوار بوابتها الإلكترونية وفقاً لأعلى معايير الأمان وقانون حماية البيانات الشخصية المصري رقم ١٥١ لسنة ٢٠٢٠.</p>

<h2>٢. البيانات التي نجمعها</h2>
<p>نقوم بجمع بيانات الاتصال المهنية (الاسم، البريد المؤسسي، رقم الهاتف، اسم الشركة) بالإضافة إلى المواصفات الفنية ومتطلبات المشروعات المرسلة عبر نماذج التواصل وطلبات عروض الأسعار.</p>

<h2>٣. الغرض من معالجة البيانات</h2>
<p>تُستخدم البيانات حصرياً لغرض إعداد الدراسات الهندسية، إصدار عروض الأسعار والمواصفات الفنية، إدارة ومتابعة تذاكر الصيانة وبلاغات الأعطال، والتواصل الرسمي بشأن المشروعات.</p>

<h2>٤. الأمن السيبراني وحماية البنية التحتية</h2>
<p>نطبق بروتوكولات التشفير المتقدمة TLS 1.3 أثناء النقل و AES-256 للبيانات المخزنة، مع تطبيق صلاحيات الوصول الصارمة RBAC والمراقبة المستمرة ضد الاختراق.</p>

<h2>٥. حقوق العملاء وسرية البيانات</h2>
<p>يحق لجميع عملائنا طلب مراجعة أو تعديل أو تصدير أو حذف بياناتهم في أي وقت بمراسلة مسؤول حماية البيانات عبر privacy@integratedtechnics.com.</p>`,
};

/**
 * Hook to read and save legal texts (Terms or Policies) with Supabase persistence and local storage cache.
 */
export function useLegalContent(settingKey: "terms_content" | "policies_content", defaultContent: BilingualLegal) {
  const cacheKey = `site.${settingKey}`;
  const [content, setContent] = useState<BilingualLegal>(() => {
    if (typeof window === "undefined") return defaultContent;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object" && ("en" in parsed || "ar" in parsed)) {
          return { en: parsed.en || defaultContent.en, ar: parsed.ar || defaultContent.ar };
        }
      }
    } catch {}
    return defaultContent;
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchFromDb = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("site_settings")
        .select("value")
        .eq("id", settingKey)
        .maybeSingle();

      if (!error && data?.value) {
        const payload = data.value as any;
        const final: BilingualLegal = {
          en: payload.en || defaultContent.en,
          ar: payload.ar || defaultContent.ar,
        };
        setContent(final);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(final));
        } catch {}
      }
    } catch {
      // Keep cached / default
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFromDb();

    const channel = supabase
      .channel(`legal_changes_${settingKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => {
        void fetchFromDb();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [settingKey]);

  const save = async (newContent: BilingualLegal) => {
    setSaving(true);
    setContent(newContent);
    try {
      localStorage.setItem(cacheKey, JSON.stringify(newContent));
    } catch {}

    try {
      const { error } = await (supabase as any).from("site_settings").upsert({
        id: settingKey,
        value: newContent,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn(`[site_settings] Saved locally for ${settingKey}:`, err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { content, setContent, save, loading, saving, refresh: fetchFromDb };
}
