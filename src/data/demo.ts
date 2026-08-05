// In-memory demo data shared across dashboard widgets.
import { projects } from "./site";

export type RequestStatus = "submitted" | "in_review" | "in_progress" | "completed";
export type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  service: string;
  message: string;
  status: "new" | "qualified" | "won" | "lost";
  createdAt: string;
};

export type ClientRequest = {
  id: string;
  title: string;
  service: string;
  description: string;
  status: RequestStatus;
  progress: number;
  updatedAt: string;
};

export const demoLeads: Lead[] = [
  { id: "L-1042", name: "Khaled Mansour", company: "Orascom Construction", email: "k.mansour@example.com", service: "Data Centers", message: "Need a Tier-III expansion plan.", status: "qualified", createdAt: "2026-04-22" },
  { id: "L-1041", name: "Sara Bouzid", company: "Etisalat", email: "sara@example.com", service: "Network Infrastructure", message: "Multi-site SDN refresh.", status: "new", createdAt: "2026-04-20" },
  { id: "L-1040", name: "Omar Haddad", company: "Rotana Hotels", email: "omar@example.com", service: "Audio / Video Systems", message: "AV for 14 properties.", status: "new", createdAt: "2026-04-18" },
  { id: "L-1039", name: "Lina Farouk", company: "Ministry of Interior", email: "lina@example.com", service: "Security Systems", message: "City surveillance RFP.", status: "won", createdAt: "2026-04-10" },
  { id: "L-1038", name: "Yousef Tariq", company: "ADNOC", email: "yousef@example.com", service: "Integration & Customization", message: "OT/IT convergence.", status: "qualified", createdAt: "2026-04-05" },
  { id: "L-1037", name: "Rana Aziz", company: "Emaar", email: "rana@example.com", service: "Consultation", message: "Smart building strategy.", status: "lost", createdAt: "2026-03-29" },
];

export const demoRequests: ClientRequest[] = [
  { id: "R-2031", title: "HQ Surveillance Upgrade", service: "Security Systems", description: "Replace analog with IP CCTV across HQ.", status: "in_progress", progress: 62, updatedAt: "2026-04-25" },
  { id: "R-2030", title: "Branch SD-WAN Roll-out", service: "Network Infrastructure", description: "12 branches connected via SD-WAN.", status: "in_review", progress: 20, updatedAt: "2026-04-19" },
  { id: "R-2029", title: "Boardroom AV Refresh", service: "Audio / Video Systems", description: "Two boardrooms with 4K video walls.", status: "completed", progress: 100, updatedAt: "2026-03-31" },
];

export const kpis = {
  leadsTotal: demoLeads.length,
  leadsNew: demoLeads.filter(l => l.status === "new").length,
  leadsQualified: demoLeads.filter(l => l.status === "qualified").length,
  leadsWon: demoLeads.filter(l => l.status === "won").length,
  projects: projects.length,
  conversionRate: Math.round((demoLeads.filter(l => l.status === "won").length / Math.max(demoLeads.length, 1)) * 100),
};

export type Bilingual = { en: string; ar: string };
export type Slide = { id: string; title: Bilingual; subtitle: Bilingual; image: string; cta: Bilingual; href: string; active: boolean };
export const demoSlides: Slide[] = [
  { id: "S-1", title: { en: "Enterprise System Integration", ar: "تكامل الأنظمة المؤسسية" }, subtitle: { en: "Security, ICT and Infrastructure under one roof.", ar: "الأمن وتقنية المعلومات والبنية التحتية تحت سقف واحد." }, image: "/placeholder.svg", cta: { en: "Explore services", ar: "استكشف الخدمات" }, href: "/services", active: true },
  { id: "S-2", title: { en: "Tier-III Data Centers", ar: "مراكز بيانات من الفئة الثالثة" }, subtitle: { en: "Designed, built and certified for the region's largest operators.", ar: "مصممة ومبنية ومعتمدة لأكبر المشغلين في المنطقة." }, image: "/placeholder.svg", cta: { en: "View case studies", ar: "اطلع على المشاريع" }, href: "/projects", active: true },
  { id: "S-3", title: { en: "Smart Surveillance at City Scale", ar: "مراقبة ذكية على مستوى المدينة" }, subtitle: { en: "AI-powered video analytics and command centers.", ar: "تحليلات فيديو بالذكاء الاصطناعي ومراكز قيادة." }, image: "/placeholder.svg", cta: { en: "Talk to an expert", ar: "تحدث مع خبير" }, href: "/contact", active: false },
];

export type AdminRole = "admin" | "manager" | "agent" | "seo" | "technician";
export type AdminUser = { id: string; name: string; email: string; role: AdminRole; active: boolean; lastLogin: string };
export const demoUsers: AdminUser[] = [
  { id: "U-01", name: "Hassan Ali", email: "hassan@itx.com", role: "admin", active: true, lastLogin: "2026-05-05" },
  { id: "U-02", name: "Mona Khalil", email: "mona@itx.com", role: "manager", active: true, lastLogin: "2026-05-04" },
  { id: "U-03", name: "Tarek Sami", email: "tarek@itx.com", role: "agent", active: false, lastLogin: "2026-04-18" },
  { id: "U-04", name: "Karim Zaki", email: "karim.seo@itx.com", role: "seo", active: true, lastLogin: "2026-05-05" },
  { id: "U-05", name: "Ahmed Nabil", email: "ahmed.tech@itx.com", role: "technician", active: true, lastLogin: "2026-05-04" },
];

export type Client = { id: string; company: string; contact: string; email: string; phone: string; tier: "Strategic" | "Enterprise" | "SMB"; projects: number };
export const demoClients: Client[] = [
  { id: "C-01", company: "Orascom Construction", contact: "Khaled Mansour", email: "k.mansour@example.com", phone: "+20 100 111 2222", tier: "Strategic", projects: 6 },
  { id: "C-02", company: "Etisalat", contact: "Sara Bouzid", email: "sara@example.com", phone: "+971 50 222 3333", tier: "Enterprise", projects: 4 },
  { id: "C-03", company: "Rotana Hotels", contact: "Omar Haddad", email: "omar@example.com", phone: "+971 50 333 4444", tier: "Enterprise", projects: 3 },
  { id: "C-04", company: "Emaar", contact: "Rana Aziz", email: "rana@example.com", phone: "+971 50 444 5555", tier: "SMB", projects: 1 },
];

export type Quotation = { id: string; client: string; service: string; amount: number; currency: string; status: "draft" | "sent" | "accepted" | "rejected"; date: string };
export const demoQuotations: Quotation[] = [
  { id: "Q-3001", client: "Orascom Construction", service: "Data Center Expansion", amount: 1850000, currency: "USD", status: "sent", date: "2026-04-21" },
  { id: "Q-3002", client: "Etisalat", service: "SD-WAN Roll-out", amount: 620000, currency: "USD", status: "accepted", date: "2026-04-15" },
  { id: "Q-3003", client: "Rotana Hotels", service: "AV Boardrooms", amount: 145000, currency: "USD", status: "draft", date: "2026-04-30" },
  { id: "Q-3004", client: "Emaar", service: "Smart Building Consultation", amount: 78000, currency: "USD", status: "rejected", date: "2026-03-29" },
];

export type Review = { id: string; author: string; company: string; rating: number; text: string; approved: boolean; date: string };
export const demoReviews: Review[] = [
  { id: "RV-1", author: "Khaled Mansour", company: "Orascom Construction", rating: 5, text: "Delivered on time with exceptional quality.", approved: true, date: "2026-04-12" },
  { id: "RV-2", author: "Sara Bouzid", company: "Etisalat", rating: 4, text: "Strong technical team, smooth handover.", approved: true, date: "2026-04-02" },
  { id: "RV-3", author: "Omar Haddad", company: "Rotana Hotels", rating: 5, text: "Best AV deployment we've worked on.", approved: false, date: "2026-04-29" },
];

export type TicketCategory = "billing" | "technical" | "account" | "feature" | "general" | "other";
export type Ticket = { id: string; subject: string; client: string; priority: "low" | "medium" | "high" | "urgent"; status: "open" | "pending" | "resolved" | "closed"; updated: string; category?: TicketCategory };
export const demoTickets: Ticket[] = [
  { id: "T-7001", subject: "CCTV camera offline at Gate 3", client: "Orascom Construction", priority: "high", status: "open", updated: "2026-05-05" },
  { id: "T-7002", subject: "Firewall throughput drop", client: "Etisalat", priority: "urgent", status: "pending", updated: "2026-05-04" },
  { id: "T-7003", subject: "AV remote re-pairing", client: "Rotana Hotels", priority: "low", status: "resolved", updated: "2026-04-28" },
  { id: "T-7004", subject: "Access control card issue", client: "Emaar", priority: "medium", status: "closed", updated: "2026-04-20" },
];

export type FaqItem = { id: string; question: Bilingual; answer: Bilingual; category: Bilingual };
export const demoFaqs: FaqItem[] = [
  { id: "F-1", question: { en: "What industries do you serve?", ar: "ما القطاعات التي تخدمونها؟" }, answer: { en: "Government, oil & gas, hospitality, healthcare, banking and large enterprises.", ar: "الحكومة والنفط والغاز والضيافة والرعاية الصحية والمصارف والمؤسسات الكبرى." }, category: { en: "General", ar: "عام" } },
  { id: "F-2", question: { en: "Do you provide post-deployment support?", ar: "هل تقدمون دعمًا بعد التنفيذ؟" }, answer: { en: "Yes, we offer 24/7 SLAs with on-site and remote response options.", ar: "نعم، نقدم اتفاقيات دعم على مدار الساعة مع استجابة موقعية وعن بُعد." }, category: { en: "Support", ar: "الدعم" } },
  { id: "F-3", question: { en: "Can you integrate with our existing systems?", ar: "هل يمكنكم التكامل مع أنظمتنا الحالية؟" }, answer: { en: "Absolutely — our integration team specializes in vendor-agnostic interoperability.", ar: "بالتأكيد — فريقنا متخصص في التكامل بين الأنظمة بمختلف الموردين." }, category: { en: "Integration", ar: "التكامل" } },
];

export const demoTerms: Bilingual = {
  en: `# Terms of Service\n\nLast updated: May 2026.\n\nThese terms govern the use of Integrated Technics services. By engaging with us you agree to scope, payment, confidentiality and warranty clauses outlined in your master service agreement.`,
  ar: `# شروط الخدمة\n\nآخر تحديث: مايو 2026.\n\nتحكم هذه الشروط استخدام خدمات Integrated Technics. بتعاملك معنا فإنك توافق على بنود النطاق والدفع والسرية والضمان الموضحة في اتفاقية الخدمة الرئيسية.`,
};

export const demoPrivacy: Bilingual = {
  en: `# Privacy Policy\n\nLast updated: May 2026.\n\nWe collect business contact details strictly for the purpose of responding to inquiries and managing project delivery. We do not sell personal data and comply with applicable regional regulations.`,
  ar: `# سياسة الخصوصية\n\nآخر تحديث: مايو 2026.\n\nنجمع بيانات الاتصال التجارية فقط لغرض الرد على الاستفسارات وإدارة تنفيذ المشاريع. لا نبيع البيانات الشخصية ونلتزم باللوائح الإقليمية المعمول بها.`,
};

export const demoReports = {
  monthlyLeads: [12, 18, 22, 19, 28, 31, 27, 33, 36, 29, 38, 42],
  monthlyRevenue: [120, 180, 240, 220, 310, 340, 290, 360, 410, 380, 460, 510], // in $K
  serviceMix: [
    { label: "Security Systems", value: 28 },
    { label: "Networks", value: 22 },
    { label: "Data Centers", value: 18 },
    { label: "Audio / Video", value: 14 },
    { label: "Integration", value: 12 },
    { label: "Consultation", value: 6 },
  ],
};
