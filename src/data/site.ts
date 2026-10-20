import { Shield, Network, MonitorPlay, Server, Layers, Lightbulb, ClipboardList } from "lucide-react";
import datacenterImg from "@/assets/project-datacenter.jpg";
import securityImg from "@/assets/project-security.jpg";
import networkImg from "@/assets/project-network.jpg";

export const services = [
  { slug: "security", icon: Shield, image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80", title: { en: "Security Systems", ar: "أنظمة الأمن" }, desc: { en: "CCTV, access control, intrusion detection, command & control rooms.", ar: "كاميرات المراقبة، التحكم بالوصول، الإنذار، غرف التحكم." } },
  { slug: "network", icon: Network, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", title: { en: "Network Infrastructure", ar: "البنية التحتية للشبكات" }, desc: { en: "Structured cabling, LAN/WAN, wireless, SDN and security.", ar: "التمديدات المهيكلة، الشبكات السلكية واللاسلكية والأمن." } },
  { slug: "audio-video", icon: MonitorPlay, image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80", title: { en: "Audio / Video Systems", ar: "الأنظمة الصوتية والمرئية" }, desc: { en: "Boardrooms, video walls, digital signage, conferencing.", ar: "قاعات الاجتماعات، شاشات الفيديو والمؤتمرات." } },
  { slug: "data-centers", icon: Server, image: "https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?w=800&q=80", title: { en: "Data Centers", ar: "مراكز البيانات" }, desc: { en: "Tier-rated facilities, power, cooling, racks and cabling.", ar: "مرافق مصنفة، طاقة، تبريد، رفوف وتمديدات." } },
  { slug: "integration", icon: Layers, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80", title: { en: "Integration & Customization", ar: "التكامل والتخصيص" }, desc: { en: "Unify multi-vendor systems into a single operational layer.", ar: "توحيد الأنظمة متعددة المصنّعين في طبقة تشغيلية واحدة." } },
  { slug: "consultation", icon: Lightbulb, image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80", title: { en: "Consultation", ar: "الاستشارات" }, desc: { en: "Strategy, technology selection, BOQ and architecture.", ar: "الاستراتيجية، اختيار التقنيات، التصميم والمواصفات." } },
  { slug: "project-management", icon: ClipboardList, image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80", title: { en: "Project Management", ar: "إدارة المشاريع" }, desc: { en: "PMP-led delivery, risk control, handover and lifecycle.", ar: "إدارة معتمدة، إدارة المخاطر، التسليم ودورة الحياة." } },
];

export const industries = [
  { slug: "telecom", image: "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=800&q=80", title: { en: "Telecom", ar: "الاتصالات" } },
  { slug: "oil-gas", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80", title: { en: "Oil & Gas", ar: "النفط والغاز" } },
  { slug: "real-estate", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80", title: { en: "Real Estate", ar: "العقارات" } },
  { slug: "hospitality", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", title: { en: "Hospitality", ar: "الضيافة" } },
  { slug: "manufacturing", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80", title: { en: "Manufacturing", ar: "التصنيع" } },
  { slug: "government", image: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?w=800&q=80", title: { en: "Government", ar: "القطاع الحكومي" } },
  { slug: "healthcare", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80", title: { en: "Healthcare", ar: "الرعاية الصحية" } },
  { slug: "education", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80", title: { en: "Education", ar: "التعليم" } },
  { slug: "finance", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80", title: { en: "Financial Services", ar: "الخدمات المالية" } },
  { slug: "retail", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", title: { en: "Retail", ar: "التجزئة" } },
  { slug: "transportation", image: "https://images.unsplash.com/photo-1494412519320-aa613dfb7738?w=800&q=80", title: { en: "Transportation", ar: "النقل" } },
  { slug: "aviation", image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80", title: { en: "Aviation", ar: "الطيران" } },
  { slug: "energy", image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80", title: { en: "Energy & Utilities", ar: "الطاقة والمرافق" } },
];

export const projects = [
  {
    id: 1,
    image: "/projects/alamein.jpg",
    title: { en: "New Alamein City", ar: "مدينة العلمين الجديدة" },
    industry: "Smart Cities",
    desc: {
      en: "The largest outdoor video wall screening in MEA • Infrastructure cabling system • Information network devices • All light current systems • Automatic fire alarm • Closed Circuit TV System (CCTV) • Security system screening and inspection through (X-Ray) • Parking guidance system • Car parking management system • Automatic access control systems • Building management systems (BMS) • Internet Protocol Television System (IPTV) • Digital signage system • Music paging system • Hotel Electronic Card Key System (HOKCS) • Room Management System (RMS)",
      ar: "توريد و تركيب أكبر شاشات عرض خارجية فى الشرق الأوسط • نظام كابلات شبكات المعلومات • أجهزة شبكة المعلومات • جميع أنظمة التيار الخفيف • الإنذار الآلي ضد الحريق • كاميرات مراقبة • جهاز ماسح بالأشعة السينية للأفراد • نظام إرشادي لمواقف السيارات • نظام التحكم بمواقف السيارات • أنظمة التحكم بالدخول والخروج أوتوماتيكياً • أنظمة إدارة المباني • نظام الدش التلفزيوني المركزي • نظام اللافتات الرقمية • نظام النداء الآلي الموسيقي • نظام البطاقات الإلكترونية والمفاتيح للفنادق • نظام إدارة الغرف الفندقية"
    }
  },
  {
    id: 2,
    image: "/projects/new-capital.jpg",
    title: { en: "New Administrative Capital", ar: "العاصمة الإدارية الجديدة" },
    industry: "Government",
    desc: {
      en: "Governmental district - Access Control system and Security gates • Gate Barriers and Bollards system • Parking management and parking guidance systems • Supply and installation of surveillance system and radars • Car Scanners • Body scanners • Baggage scanners • Closed Circuit TV System (CCTV)",
      ar: "أنظمة التحكم الإلكترونية بالدخول والخروج والبوابات بمبنى سيادي • توريد وتركيب بوابات أمنية • نظام محاسبي ونظام إرشادي للتحكم في دخول ومواقف السيارات • توريد وتركيب منظومة المراقبة والرادارات • نظام التفتيش الذاتي للسيارات بالأشعة السينية • نظام التفتيش الذاتي للأفراد بالأشعة السينية • نظام التفتيش وفحص الحقائب بالأشعة السينية • تركيب أنظمة المراقبة التلفزيونية بالكاميرات"
    }
  },
  {
    id: 3,
    image: "/projects/bdc.png",
    title: { en: "Banque du Caire (BDC)", ar: "بنك القاهرة" },
    industry: "Banking",
    desc: {
      en: "Closed Circuit TV System (CCTV) • Access control system • Fire alarm system • Intrusion system • Management & integrated software • Complete network for light current systems",
      ar: "تركيب أنظمة المراقبة التلفزيونية بالكاميرات • أنظمة التحكم الإلكترونية بالدخول والخروج • نظام الإنذار الآلي ضد الحريق • نظام كشف الاختراقات والاقتحام • نظام إدارة وبرمجة متكامل بين الأنظمة • تركيب شبكة متكاملة لجميع أنظمة التيار الخفيف"
    }
  },
  {
    id: 4,
    image: "/projects/cbe.jpg",
    title: { en: "Central Bank of Egypt (CBE)", ar: "البنك المركزى المصري" },
    industry: "Banking",
    desc: {
      en: "Wedge barriers • Gate barriers • Bollard blockers • Under Vehicle Scanning System (UVSS) • ANPR System",
      ar: "حواجز وتدية مانعة للاقتحام • بوابات تنظيم مرور السيارات • حواجز أسطوانية مانعة للاقتحام • نظام فحص وتصوير أسفل السيارات (UVSS) • النظام الرقمي للتعرف على لوحات السيارات (ANPR)"
    }
  },
  {
    id: 5,
    image: "/projects/tawila.jpg",
    title: { en: "Gouna Hotel – Tawila Island – Red Sea Governorate", ar: "فندق الجونة – جزيرة الطويلة – محافظة البحر الأحمر" },
    industry: "Hospitality",
    desc: {
      en: "Fire Alarm Systems • Access Control System • Closed Circuit TV System (CCTV) • Car Parking Management System • Data Communication Network System • Audio/video system • Building Management System (BMS) • Internet Protocol television (IPTV)",
      ar: "أنظمة إنذار الحريق • نظام التحكم الإلكتروني في الدخول والخروج • نظام المراقبة التلفزيونية بالكاميرات • نظام مواقف السيارات • نظام شبكة اتصالات البيانات • نظام الصوت / الفيديو • نظام إدارة المباني • نظام البث التلفزيوني"
    }
  },
  {
    id: 6,
    image: "/projects/rafah.png",
    title: { en: "Rafah Border Project", ar: "مشروع معبر رفح" },
    industry: "Government",
    desc: {
      en: "DTP Screening Solution \"Car & Truck scanner\" • Gate Barriers system • ANPR system",
      ar: "نظام الكشف بالأشعة السينية على المركبات والشاحنات • نظام تأمين البوابات • نظام المراقبة الرقمي للكشف عن السيارات"
    }
  },
  {
    id: 7,
    image: "/projects/sharm.jpg",
    title: { en: "Sharm El-Sheikh – South Sinai Governorate", ar: "مدينة شرم الشيخ – محافظة جنوب سيناء" },
    industry: "Smart Cities",
    desc: {
      en: "Closed Circuit TV System (CCTV) • Car Scanners • Truck scanners • Baggage scanners",
      ar: "تركيب أنظمة المراقبة التلفزيونية بالكاميرات • نظام التفتيش الذاتي للسيارات بالأشعة السينية • نظام التفتيش الذاتي للشاحنات بالأشعة السينية • نظام التفتيش وفحص الحقائب بالأشعة السينية"
    }
  },
  {
    id: 8,
    image: "/projects/october-city.png",
    title: { en: "Sixth of October City", ar: "مدينة السادس من أكتوبر" },
    industry: "Smart Cities",
    desc: {
      en: "Supplying and installing a full video surveillance system with cameras to secure the perimeter of the City (CCTV)",
      ar: "توريد وتركيب نظام المراقبة التليفزيونية بالكاميرات لتأمين محيط المدينة"
    }
  },
  {
    id: 9,
    image: "/projects/airport.jpg",
    title: { en: "Cairo International Airport", ar: "مطار القاهرة الدولي" },
    industry: "Aviation & Transport",
    desc: {
      en: "Parking management system • Closed Circuit TV System (CCTV) • Baggage Scanner • Internet Protocol Television (IPTV) • Fire alarm system (FAS) • Access Control System (ACS) • Public Address System (PAS)",
      ar: "نظام التحكم بمواقف السيارات • نظام المراقبة التلفزيونية بالكاميرات • نظام التفتيش وفحص الحقائب بالأشعة السينية • نظام البث التلفزيوني • أنظمة إنذار الحريق • نظام التحكم الإلكتروني في الدخول والخروج • أنظمة الصوتيات والمرئيات"
    }
  },
  {
    id: 10,
    image: "/projects/transport-planning.png",
    title: { en: "General Authority For Transportation Projects Planning", ar: "الهيئة العامة لتخطيط مشروعات النقل" },
    industry: "Aviation & Transport",
    desc: {
      en: "Closed Circuit TV System (CCTV) • Fire alarm and Firefighting system • Integration software between all systems",
      ar: "تركيب أنظمة المراقبة التلفزيونية بالكاميرات • نظام الإنذار الآلي ونظام مكافحة الحريق • برنامج متكامل يربط جميع الأنظمة"
    }
  },
  {
    id: 11,
    image: "/projects/seaview.jpg",
    title: { en: "Sea View Compound – North Coast", ar: "كومباوند السى فيو بالساحل الشمالى" },
    industry: "Residential",
    desc: {
      en: "Automatic access control systems • Car parking and guidance control systems",
      ar: "أنظمة التحكم بالدخول والخروج أوتوماتيكياً • نظام محاسبي ونظام إرشادي للتحكم في دخول ومواقف السيارات"
    }
  },
  {
    id: 12,
    image: "/projects/dyar-5th.png",
    title: { en: "Residential Compounds in 5th Settlement (Dyar)", ar: "مجمعات سكنية بالتجمع الخامس (ديار)" },
    industry: "Residential",
    desc: {
      en: "Closed Circuit TV System (CCTV) • Mobile application for visitor management system",
      ar: "تركيب أنظمة المراقبة التلفزيونية بالكاميرات • تطبيق الهاتف المحمول لنظام إدارة الزوار"
    }
  },
  {
    id: 13,
    image: "/projects/gov-offices.png",
    title: { en: "Governmental Offices & Ministries", ar: "مكاتب ومجمعات حكومية" },
    industry: "Government",
    desc: {
      en: "Closed Circuit TV System (CCTV) • Access control system • Fire alarm system • Intrusion system",
      ar: "نظام المراقبة التلفزيونية بالكاميرات • نظام التحكم الإلكتروني في الدخول والخروج • أنظمة إنذار الحريق • نظام كشف الاختراقات والاقتحام"
    }
  },
  {
    id: 14,
    image: "/projects/sohag.png",
    title: { en: "Sohag Governorate General Office", ar: "مبنى ديوان عام محافظة سوهاج" },
    industry: "Government",
    desc: {
      en: "Closed Circuit TV System (CCTV) perimeter surveillance and access security",
      ar: "أنظمة المراقبة التلفزيونية بالكاميرات وتأمين محيط المبنى"
    }
  },
  {
    id: 15,
    image: "/projects/metallurgical.png",
    title: { en: "Metallurgical Development Research Center", ar: "مركز بحوث وتطوير الفلزات" },
    industry: "Research & Education",
    desc: {
      en: "Closed Circuit TV System (CCTV) campus monitoring and security infrastructure",
      ar: "أنظمة المراقبة التلفزيونية بالكاميرات وتأمين المقر والمختبرات البحثية"
    }
  }
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
