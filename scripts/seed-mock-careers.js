import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

try {
  const envContent = readFileSync(".env", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
} catch (e) {}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

const mockJobs = [
  {
    title_en: "Senior Network & Cloud Engineer",
    title_ar: "مهندس شبكات وسحابة أول",
    location_en: "Cairo, Egypt",
    location_ar: "القاهرة، مصر",
    department_en: "Network Infrastructure",
    department_ar: "البنية التحتية للشبكات",
    description_en: "Design, deploy and optimize enterprise-grade campus and SD-WAN networks for government and telecom clients across the region.",
    description_ar: "تصميم وتنفيذ وتحسين شبكات المؤسسات وحلول SD-WAN لعملاء القطاع الحكومي والاتصالات في المنطقة.",
    responsibilities_en: "- Lead multi-site SD-WAN and MPLS network rollouts\n- Own low-level design (LLD) and migration runbooks\n- Mentor junior engineers and review change requests\n- Coordinate with telecom providers and cloud hosts",
    responsibilities_ar: "- قيادة مشاريع شبكات SD-WAN وMPLS متعددة المواقع\n- إعداد التصاميم التفصيلية (LLD) وخطط الترحيل\n- توجيه المهندسين المبتدئين ومراجعة طلبات التغيير\n- التنسيق مع مزودي الاتصالات والاستضافة السحابية",
    requirements_en: "- 7+ years in enterprise networking\n- CCNP or equivalent certification\n- Hands-on with Cisco, Fortinet and Juniper platforms\n- Strong experience with BGP, OSPF, and IPsec VPNs",
    requirements_ar: "- خبرة 7 سنوات فأكثر في شبكات المؤسسات\n- شهادة CCNP أو ما يعادلها\n- خبرة عملية مع منصات Cisco وFortinet وJuniper\n- إلمام قوي ببروتوكولات BGP وOSPF وشبكات IPsec VPN",
    nice_to_have_en: "- CCIE certification\n- Automation with Python or Ansible\n- Cloud networking (AWS / Azure)",
    nice_to_have_ar: "- شهادة CCIE\n- الأتمتة باستخدام Python أو Ansible\n- شبكات سحابية (AWS / Azure)",
    benefits_en: "- Competitive salary and performance bonus\n- Private medical insurance for you and family\n- Certification sponsorship\n- Flexible hybrid working schedule",
    benefits_ar: "- راتب تنافسي ومكافأة أداء\n- تأمين طبي خاص لك وللعائلة\n- رعاية تكاليف الشهادات المهنية\n- جدول عمل هجين ومرن",
    employment_type: "full_time",
    experience_level: "senior",
    remote_policy: "hybrid",
    min_years_experience: 7,
    openings: 2,
    deadline: "2026-11-30",
    salary_min: 4000,
    salary_max: 6000,
    salary_currency: "USD",
    skills: ["SD-WAN", "BGP", "Cisco", "Fortinet", "Network Design", "VPN"],
    apply_email: "careers@integratedtechnics.com",
    active: true,
    sort_order: 1,
  },
  {
    title_en: "Security Systems Engineer (CCTV / Access Control)",
    title_ar: "مهندس أنظمة أمنية (كاميرات مراقبة / تحكم بالدخول)",
    location_en: "Riyadh, Saudi Arabia",
    location_ar: "الرياض، السعودية",
    department_en: "Security & Low Current",
    department_ar: "الأمن والتيار الخفيف",
    description_en: "Design, install and commission enterprise physical security systems including IP CCTV, access control, and intrusion detection across major commercial projects.",
    description_ar: "تصميم وتركيب وتشغيل أنظمة الأمن المادي المتكاملة من كاميرات مراقبة IP وتحكم في الدخول وأنظمة الإنذار في كبرى المشاريع التجارية.",
    responsibilities_en: "- Prepare technical designs, BoQs and shop drawings\n- Configure IP cameras, NVRs, access controllers and intercoms\n- Lead on-site installation, testing and commissioning\n- Train client operations teams and produce as-built documentation",
    responsibilities_ar: "- إعداد التصاميم الفنية وجداول الكميات والمخططات التنفيذية\n- ضبط وبرمجة كاميرات IP وأجهزة NVR وأجهزة التحكم بالدخول\n- قيادة التركيب والاختبار والتشغيل الميداني\n- تدريب فرق عمليات العملاء وإعداد الوثائق النهائية",
    requirements_en: "- Bachelor's degree in Electrical / Electronics / Communications Engineering\n- 4+ years hands-on with Hikvision, Axis, HID or LenelS2\n- Strong networking fundamentals (VLAN, PoE, IP addressing)\n- Ability to read architectural and MEP drawings",
    requirements_ar: "- بكالوريوس في الهندسة الكهربائية أو الإلكترونيات أو الاتصالات\n- خبرة 4 سنوات في أنظمة Hikvision أو Axis أو HID أو LenelS2\n- إلمام قوي بأساسيات الشبكات (VLAN, PoE, IP)\n- القدرة على قراءة المخططات المعمارية والكهروميكانيكية",
    nice_to_have_en: "- Certifications: Milestone, Genetec, Lenel\n- Valid driving license in GCC\n- Experience with high-security facilities",
    nice_to_have_ar: "- شهادات معتمدة في Milestone أو Genetec أو Lenel\n- رخصة قيادة سارية في دول الخليج\n- خبرة في المنشآت عالية الحساسية والأمان",
    benefits_en: "- Comprehensive medical insurance\n- Housing & transportation allowance\n- Annual flight ticket allowance\n- Continuous vendor certifications",
    benefits_ar: "- تأمين طبي شامل\n- بدل سكن وانتقال\n- تذاكر سفر سنوية\n- شهادات تدريبية مستمرة مع كبرى الشركات",
    employment_type: "full_time",
    experience_level: "mid",
    remote_policy: "onsite",
    min_years_experience: 4,
    openings: 3,
    deadline: "2026-10-31",
    salary_min: 12000,
    salary_max: 18000,
    salary_currency: "SAR",
    skills: ["CCTV", "Access Control", "Hikvision", "Axis", "Genetec", "Milestone"],
    apply_email: "careers@integratedtechnics.com",
    active: true,
    sort_order: 2,
  },
  {
    title_en: "Data Center Infrastructure Project Manager",
    title_ar: "مدير مشاريع البنية التحتية لمراكز البيانات",
    location_en: "Dubai, UAE",
    location_ar: "دبي، الإمارات",
    department_en: "Data Centers",
    department_ar: "مراكز البيانات",
    description_en: "Own end-to-end delivery of Tier-III & Tier-IV data center build-outs, from design review through MEP commissioning and final handover.",
    description_ar: "إدارة تنفيذ مراكز البيانات من الفئة الثالثة والرابعة من مراجعة التصميم حتى التشغيل والاختبار الكهروميكانيكي والتسليم النهائي.",
    responsibilities_en: "- Manage scope, schedule, budget and quality across subcontractors\n- Supervise critical power (UPS, generators) and precision cooling installation\n- Run commissioning tests and obtain client acceptance\n- Report weekly milestones to executive stakeholders",
    responsibilities_ar: "- إدارة النطاق والجدول الزمني والميزانية والجودة مع مقاولي الباطن\n- الإشراف على تركيبات الطاقة الحرجة (UPS والمولدات) والتبريد الدقيق\n- إجراء اختبارات التشغيل التجريبي واستلام اعتماد العميل\n- رفع تقارير دورية للإدارة التنفيذية وأصحاب المصلحة",
    requirements_en: "- 6+ years managing critical facilities & data center projects\n- PMP or PRINCE2 certified\n- Strong MEP coordination and technical problem-solving skills",
    requirements_ar: "- خبرة 6 سنوات في إدارة مشاريع المرافق الحرجة ومراكز البيانات\n- شهادة PMP أو PRINCE2 معتمدة\n- خبرة قوية في تنسيق الأعمال الكهروميكانيكية وحل المشكلات الفنية",
    nice_to_have_en: "- Uptime Institute ATD / ATS certification\n- Fluency in both English and Arabic\n- Experience with modular / edge data centers",
    nice_to_have_ar: "- شهادة معتمدة من Uptime Institute (ATD / ATS)\n- إتقان تام للغتين الإنجليزية والعربية\n- خبرة في مراكز البيانات المعيارية والحوسبة الطرفية",
    benefits_en: "- Executive compensation package\n- Family health insurance cover\n- Project milestone completion bonuses\n- Relocation assistance if applicable",
    benefits_ar: "- حزمة تعويضات تنفيذية مجزية\n- تغطية تأمين صحي شامل للعائلة\n- مكافآت إنجاز مراحل المشروع\n- دعم الانتقال وبدلات إقامة",
    employment_type: "full_time",
    experience_level: "lead",
    remote_policy: "onsite",
    min_years_experience: 6,
    openings: 1,
    deadline: "2026-10-15",
    salary_min: 22000,
    salary_max: 30000,
    salary_currency: "AED",
    skills: ["PMP", "Tier-III", "MEP", "Precision Cooling", "UPS", "Commissioning"],
    apply_email: "careers@integratedtechnics.com",
    active: true,
    sort_order: 3,
  },
  {
    title_en: "AV & Smart Workplace Solutions Engineer",
    title_ar: "مهندس حلول الصوتيات والمرئيات ومساحات العمل الذكية",
    location_en: "Cairo, Egypt",
    location_ar: "القاهرة، مصر",
    department_en: "Audio / Video Systems",
    department_ar: "أنظمة الصوت والصورة",
    description_en: "Scope, engineer and program state-of-the-art boardroom, auditorium and command-center AV systems and smart room automation.",
    description_ar: "تحديد وتصميم وبرمجة أحدث أنظمة الصوت والصورة لقاعات الاجتماعات والمسارح ومراكز القيادة وحلول أتمتة الغرف الذكية.",
    responsibilities_en: "- Produce detailed AV schematics, line diagrams and BOQs\n- Program control systems (Crestron / Q-SYS / Extron) and audio DSPs\n- Conduct site commissioning, tuning, and customer training\n- Support pre-sales engineering with technical demos and validation",
    responsibilities_ar: "- إعداد المخططات الفنية المفصلة ورسومات التوصيل وجداول الكميات\n- برمجة أنظمة التحكم (Crestron / Q-SYS / Extron) ومعالجات الصوت الرقمية\n- إجراء المعايرة والتشغيل التجريبي في الموقع وتدريب العملاء\n- دعم ما قبل البيع بالعروض الفنية والتحقق من الجدوى",
    requirements_en: "- 3+ years in professional commercial AV engineering\n- AVIXA CTS certification or equivalent practical experience\n- Hands-on experience with digital signal processors (Biamp, QSC, Shure)",
    requirements_ar: "- خبرة لا تقل عن 3 سنوات في هندسة أنظمة AV التجارية\n- شهادة AVIXA CTS أو خبرة عملية مكافئة\n- خبرة عملية في معالجات الإشارة الصوتية (Biamp, QSC, Shure)",
    nice_to_have_en: "- CTS-D / CTS-I certification\n- Dante audio networking level 2/3\n- Knowledge of video over IP (SDVoE / NDI)",
    nice_to_have_ar: "- شهادات CTS-D أو CTS-I\n- شهادة شبكات الصوت Dante المستوى 2 أو 3\n- دراية بتقنيات نقل الفيديو عبر الشبكات (SDVoE / NDI)",
    benefits_en: "- Competitive salary + hardware testing budget\n- Full medical coverage\n- Certified training & vendor exams funded\n- Professional growth path into Solution Architecture",
    benefits_ar: "- راتب مجزٍ + ميزانية تجارب واختبار للأجهزة الحديثة\n- تأمين طبي شامل\n- تمويل الشهادات والامتحانات الاحترافية\n- مسار تطور وظيفي نحو هندسة الحلول المتكاملة",
    employment_type: "full_time",
    experience_level: "mid",
    remote_policy: "hybrid",
    min_years_experience: 3,
    openings: 2,
    deadline: "2026-11-15",
    salary_min: 3500,
    salary_max: 5000,
    salary_currency: "USD",
    skills: ["Crestron", "Q-SYS", "Extron", "Dante", "AV Design", "DSP", "Shure"],
    apply_email: "careers@integratedtechnics.com",
    active: true,
    sort_order: 4,
  },
  {
    title_en: "ICT & Systems Engineering Trainee",
    title_ar: "متدرب هندسة النظم وتكنولوجيا المعلومات",
    location_en: "Cairo, Egypt",
    location_ar: "القاهرة، مصر",
    department_en: "Integration & Services",
    department_ar: "التكامل والخدمات الفنية",
    description_en: "A structured 6-month intensive training program rotating across network engineering, physical security, and data center support teams.",
    description_ar: "برنامج تدريبي مكثف لمدة 6 أشهر بالتناوب بين فرق هندسة الشبكات، والأمن المادي، ودعم مراكز البيانات مع إشراف مباشر من كبار المهندسين.",
    responsibilities_en: "- Assist senior engineers in on-site installations and physical testing\n- Help prepare system documentation and test validation reports\n- Participate in lab mockups and configuration staging\n- Learn modern enterprise standards and safety protocols",
    responsibilities_ar: "- مساعدة كبار المهندسين في التركيبات الميدانية والفحص الفني\n- المساعدة في إعداد الوثائق الفنية وتقارير الاختبار\n- المشاركة في تجارب المعمل وتجهيز الإعدادات المسبقة\n- تعلم معايير المؤسسات الحديثة وبروتوكولات السلامة",
    requirements_en: "- Bachelor's in Communications, Computer Engineering, or IT (recent grad or final year)\n- Passion for low-current, networking, and critical infrastructure\n- Good verbal and written communication in English",
    requirements_ar: "- بكالوريوس في هندسة الاتصالات أو الحاسب أو تكنولوجيا المعلومات (حديث التخرج أو سنة نهائية)\n- شغف بالتيار الخفيف والشبكات والبنية التحتية الحرجة\n- إجادة التواصل باللغتين العربية والإنجليزية",
    nice_to_have_en: "- Self-study CCNA or Network+ courses\n- Prior student club or technical project experience",
    nice_to_have_ar: "- دراسة ذاتية لدورات CCNA أو Network+\n- خبرة سابقة في أنشطة طلابية أو مشاريع تخرج مميزة",
    benefits_en: "- Monthly paid training stipend\n- Fast-track direct employment offer for outstanding graduates\n- Mentorship by certified industry architects\n- Certificate of completion upon finishing",
    benefits_ar: "- مكافأة تدريب شهرية مدفوعة\n- أولوية التعيين المباشر بدوام كامل للمتميزين\n- إشراف مباشر من مهندسين واستشاريين معتمدين\n- شهادة إتمام تدريب معتمدة",
    employment_type: "internship",
    experience_level: "intern",
    remote_policy: "onsite",
    min_years_experience: 0,
    openings: 5,
    deadline: "2026-10-01",
    salary_min: 5000,
    salary_max: 7500,
    salary_currency: "EGP",
    skills: ["Networking", "Cabling", "Troubleshooting", "Documentation", "Teamwork"],
    apply_email: "careers@integratedtechnics.com",
    active: true,
    sort_order: 5,
  }
];

async function seed() {
  console.log("Seeding mockup careers into career_jobs table...");
  const { data: existing, error: fetchErr } = await supabase.from("career_jobs").select("id");
  if (fetchErr) {
    console.error("Fetch error:", fetchErr.message);
  } else {
    console.log(`Current jobs count: ${existing?.length || 0}`);
  }

  const { data, error } = await supabase.from("career_jobs").insert(mockJobs).select();
  if (error) {
    console.error("Error inserting mock jobs:", error.message);
    process.exit(1);
  }

  console.log(`Successfully seeded ${data?.length || mockJobs.length} mockup careers!`);
}

seed();
