import { Shield, Network, MonitorPlay, Server, Layers, Lightbulb, ClipboardList } from "lucide-react";
import datacenterImg from "@/assets/project-datacenter.jpg";
import securityImg from "@/assets/project-security.jpg";
import networkImg from "@/assets/project-network.jpg";

export const services = [
  { slug: "security", icon: Shield, title: { en: "Security Systems", ar: "أنظمة الأمن" }, desc: { en: "CCTV, access control, intrusion detection, command & control rooms.", ar: "كاميرات المراقبة، التحكم بالوصول، الإنذار، غرف التحكم." } },
  { slug: "network", icon: Network, title: { en: "Network Infrastructure", ar: "البنية التحتية للشبكات" }, desc: { en: "Structured cabling, LAN/WAN, wireless, SDN and security.", ar: "التمديدات المهيكلة، الشبكات السلكية واللاسلكية والأمن." } },
  { slug: "audio-video", icon: MonitorPlay, title: { en: "Audio / Video Systems", ar: "الأنظمة الصوتية والمرئية" }, desc: { en: "Boardrooms, video walls, digital signage, conferencing.", ar: "قاعات الاجتماعات، شاشات الفيديو والمؤتمرات." } },
  { slug: "data-centers", icon: Server, title: { en: "Data Centers", ar: "مراكز البيانات" }, desc: { en: "Tier-rated facilities, power, cooling, racks and cabling.", ar: "مرافق مصنفة، طاقة، تبريد، رفوف وتمديدات." } },
  { slug: "integration", icon: Layers, title: { en: "Integration & Customization", ar: "التكامل والتخصيص" }, desc: { en: "Unify multi-vendor systems into a single operational layer.", ar: "توحيد الأنظمة متعددة المصنّعين في طبقة تشغيلية واحدة." } },
  { slug: "consultation", icon: Lightbulb, title: { en: "Consultation", ar: "الاستشارات" }, desc: { en: "Strategy, technology selection, BOQ and architecture.", ar: "الاستراتيجية، اختيار التقنيات، التصميم والمواصفات." } },
  { slug: "project-management", icon: ClipboardList, title: { en: "Project Management", ar: "إدارة المشاريع" }, desc: { en: "PMP-led delivery, risk control, handover and lifecycle.", ar: "إدارة معتمدة، إدارة المخاطر، التسليم ودورة الحياة." } },
];

export const industries = [
  { slug: "telecom", title: { en: "Telecom", ar: "الاتصالات" } },
  { slug: "oil-gas", title: { en: "Oil & Gas", ar: "النفط والغاز" } },
  { slug: "real-estate", title: { en: "Real Estate", ar: "العقارات" } },
  { slug: "hospitality", title: { en: "Hospitality", ar: "الضيافة" } },
  { slug: "manufacturing", title: { en: "Manufacturing", ar: "التصنيع" } },
  { slug: "government", title: { en: "Government", ar: "القطاع الحكومي" } },
];

export const projects = [
  { id: 1, image: datacenterImg, title: { en: "Tier-III Data Center Build-out", ar: "بناء مركز بيانات من الفئة الثالثة" }, industry: "Telecom", desc: { en: "1,200 m² Tier-III facility for a regional carrier.", ar: "مرفق 1200 م² من الفئة الثالثة لشركة اتصالات إقليمية." } },
  { id: 2, image: securityImg, title: { en: "Smart City Surveillance", ar: "مراقبة المدن الذكية" }, industry: "Government", desc: { en: "2,500-camera command & control deployment.", ar: "نشر منظومة تحكم بـ 2,500 كاميرا." } },
  { id: 3, image: networkImg, title: { en: "Enterprise Network Refresh", ar: "تحديث شبكة مؤسسية" }, industry: "Oil & Gas", desc: { en: "Multi-site SDN backbone with zero downtime cutover.", ar: "شبكة موحدة متعددة المواقع بدون انقطاع." } },
  { id: 4, image: datacenterImg, title: { en: "Hyperscale Edge Node", ar: "عقدة حافة عالية الأداء" }, industry: "Telecom", desc: { en: "Edge compute infrastructure for low-latency services.", ar: "بنية حوسبة طرفية للخدمات منخفضة الاستجابة." } },
  { id: 5, image: securityImg, title: { en: "Hospitality Group Roll-out", ar: "تنفيذ لمجموعة فندقية" }, industry: "Hospitality", desc: { en: "Integrated AV, IPTV and security across 14 properties.", ar: "أنظمة متكاملة لـ 14 عقارًا فندقيًا." } },
  { id: 6, image: networkImg, title: { en: "Manufacturing OT/IT Convergence", ar: "دمج OT/IT في التصنيع" }, industry: "Manufacturing", desc: { en: "Segmented OT network with industrial firewalls.", ar: "شبكة تشغيل مقسمة بجدران حماية صناعية." } },
];

export const partners: { name: string; logo: string }[] = [
  { name: "Cisco", logo: "https://logo.clearbit.com/cisco.com" },
  { name: "Dell Technologies", logo: "https://logo.clearbit.com/delltechnologies.com" },
  { name: "Fortinet", logo: "https://logo.clearbit.com/fortinet.com" },
  { name: "Hikvision", logo: "https://logo.clearbit.com/hikvision.com" },
  { name: "Axis", logo: "https://logo.clearbit.com/axis.com" },
  { name: "HPE", logo: "https://logo.clearbit.com/hpe.com" },
  { name: "Genetec", logo: "https://logo.clearbit.com/genetec.com" },
  { name: "Crestron", logo: "https://logo.clearbit.com/crestron.com" },
  { name: "Avigilon", logo: "https://logo.clearbit.com/avigilon.com" },
  { name: "Honeywell", logo: "https://logo.clearbit.com/honeywell.com" },
  { name: "Lenel", logo: "https://logo.clearbit.com/lenel.com" },
  { name: "Bosch", logo: "https://logo.clearbit.com/bosch.com" },
];

export const stats = [
  { value: 150, suffix: "+", labelKey: "stats.clients" as const },
  { value: 350, suffix: "+", labelKey: "stats.projects" as const },
  { value: 20, suffix: "+", labelKey: "stats.years" as const },
  { value: 80, suffix: "+", labelKey: "stats.engineers" as const },
];

export const news = [
  { id: 1, date: "2026-04-12", title: { en: "Integrated Technics expands data center practice", ar: "توسعة قسم مراكز البيانات" }, excerpt: { en: "New regional design hub launched in Cairo.", ar: "مركز تصميم إقليمي جديد في القاهرة." } },
  { id: 2, date: "2026-03-02", title: { en: "Strategic alliance with leading SDN vendor", ar: "تحالف استراتيجي مع مزوّد SDN رائد" }, excerpt: { en: "Joint go-to-market for enterprise networking.", ar: "إطلاق مشترك لخدمات الشبكات المؤسسية." } },
  { id: 3, date: "2026-01-18", title: { en: "Award: System Integrator of the Year", ar: "جائزة مكامل الأنظمة لهذا العام" }, excerpt: { en: "Recognized for excellence in enterprise delivery.", ar: "تقديرًا للتميّز في التنفيذ المؤسسي." } },
];
