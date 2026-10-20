-- =================================================================
-- Seed Real Reference Projects from Integrated Technics Production Site
-- Source: https://integratedtechnics.com/clientele-projects-references-gallery/
-- =================================================================

-- 1. Ensure columns exist
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 2. Clear out old placeholder projects or upsert real reference projects
DELETE FROM public.projects WHERE id BETWEEN 1 AND 15;

-- 3. Insert all 15 authentic reference projects
INSERT INTO public.projects (
  id,
  image,
  title_en,
  title_ar,
  industry,
  desc_en,
  desc_ar,
  active,
  meta_title_en,
  meta_title_ar,
  meta_description_en,
  meta_description_ar
)
OVERRIDING SYSTEM VALUE
VALUES
  (
    1,
    '/projects/alamein.jpg',
    'New Alamein City',
    'مدينة العلمين الجديدة',
    'Smart Cities',
    'The largest outdoor video wall screening in MEA • Infrastructure cabling system • Information network devices • All light current systems • Automatic fire alarm • Closed Circuit TV System (CCTV) • Security system screening and inspection through (X-Ray) • Parking guidance system • Car parking management system • Automatic access control systems • Building management systems (BMS) • Internet Protocol Television System (IPTV) • Digital signage system • Music paging system • Hotel Electronic Card Key System (HOKCS) • Room Management System (RMS)',
    'توريد و تركيب أكبر شاشات عرض خارجية فى الشرق الأوسط • نظام كابلات شبكات المعلومات • أجهزة شبكة المعلومات • جميع أنظمة التيار الخفيف • الإنذار الآلي ضد الحريق • كاميرات مراقبة • جهاز ماسح بالأشعة السينية للأفراد • نظام إرشادي لمواقف السيارات • نظام التحكم بمواقف السيارات • أنظمة التحكم بالدخول والخروج أوتوماتيكياً • أنظمة إدارة المباني • نظام الدش التلفزيوني المركزي • نظام اللافتات الرقمية • نظام النداء الآلي الموسيقي • نظام البطاقات الإلكترونية والمفاتيح للفنادق • نظام إدارة الغرف الفندقية',
    true,
    'New Alamein City Mega Project — Integrated Technics',
    'مشروع مدينة العلمين الجديدة — شركة التقنيات المتكاملة',
    'Comprehensive smart city infrastructure and mega video wall screening deployed in New Alamein.',
    'بنية تحتية متكاملة للمدن الذكية وأكبر شاشات عرض خارجية في الشرق الأوسط بمدينة العلمين الجديدة.'
  ),
  (
    2,
    '/projects/new-capital.jpg',
    'New Administrative Capital',
    'العاصمة الإدارية الجديدة',
    'Government',
    'Governmental district - Access Control system and Security gates • Gate Barriers and Bollards system • Parking management and parking guidance systems • Supply and installation of surveillance system and radars • Car Scanners • Body scanners • Baggage scanners • Closed Circuit TV System (CCTV)',
    'أنظمة التحكم الإلكترونية بالدخول والخروج والبوابات بمبنى سيادي • توريد وتركيب بوابات أمنية • نظام محاسبي ونظام إرشادي للتحكم في دخول ومواقف السيارات • توريد وتركيب منظومة المراقبة والرادارات • نظام التفتيش الذاتي للسيارات بالأشعة السينية • نظام التفتيش الذاتي للأفراد بالأشعة السينية • نظام التفتيش وفحص الحقائب بالأشعة السينية • تركيب أنظمة المراقبة التلفزيونية بالكاميرات',
    true,
    'New Administrative Capital Sovereign District — Integrated Technics',
    'مشروع العاصمة الإدارية الجديدة — شركة التقنيات المتكاملة',
    'Advanced electronic access control, bollards, radars and X-Ray screening at sovereign governmental district.',
    'أنظمة أمنية وسيادية متقدمة، بوابات إلكترونية ورادارات وتفتيش بالأشعة السينية بالحي الحكومي.'
  ),
  (
    3,
    '/projects/bdc.png',
    'Banque du Caire (BDC)',
    'بنك القاهرة',
    'Banking',
    'Closed Circuit TV System (CCTV) • Access control system • Fire alarm system • Intrusion system • Management & integrated software • Complete network for light current systems',
    'تركيب أنظمة المراقبة التلفزيونية بالكاميرات • أنظمة التحكم الإلكترونية بالدخول والخروج • نظام الإنذار الآلي ضد الحريق • نظام كشف الاختراقات والاقتحام • نظام إدارة وبرمجة متكامل بين الأنظمة • تركيب شبكة متكاملة لجميع أنظمة التيار الخفيف',
    true,
    'Banque du Caire Security & ICT Rollout — Integrated Technics',
    'مشروع بنك القاهرة للحلول الأمنية وشبكات التيار الخفيف',
    'Bank-wide CCTV, biometric access control, fire alarm and network integration for Banque du Caire.',
    'منظومة مراقبة تلفزيونية وتحكم بالدخول وإنذار حريق وشبكة متكاملة لفروع بنك القاهرة.'
  ),
  (
    4,
    '/projects/cbe.jpg',
    'Central Bank of Egypt (CBE)',
    'البنك المركزى المصري',
    'Banking',
    'Wedge barriers • Gate barriers • Bollard blockers • Under Vehicle Scanning System (UVSS) • ANPR System',
    'حواجز وتدية مانعة للاقتحام • بوابات تنظيم مرور السيارات • حواجز أسطوانية مانعة للاقتحام • نظام فحص وتصوير أسفل السيارات (UVSS) • النظام الرقمي للتعرف على لوحات السيارات (ANPR)',
    true,
    'Central Bank of Egypt High-Security Perimeter — Integrated Technics',
    'تأمين البنك المركزي المصري — شركة التقنيات المتكاملة',
    'Anti-ram crash-rated wedge barriers, UVSS vehicle scanners and ANPR recognition for CBE.',
    'حواجز هيدروليكية وتدية مانعة للاقتحام، فحص أسفل المركبات ونظام قراءة لوحات السيارات للبنك المركزي.'
  ),
  (
    5,
    '/projects/tawila.jpg',
    'Gouna Hotel – Tawila Island – Red Sea Governorate',
    'فندق الجونة – جزيرة الطويلة – محافظة البحر الأحمر',
    'Hospitality',
    'Fire Alarm Systems • Access Control System • Closed Circuit TV System (CCTV) • Car Parking Management System • Data Communication Network System • Audio/video system • Building Management System (BMS) • Internet Protocol television (IPTV)',
    'أنظمة إنذار الحريق • نظام التحكم الإلكتروني في الدخول والخروج • نظام المراقبة التلفزيونية بالكاميرات • نظام مواقف السيارات • نظام شبكة اتصالات البيانات • نظام الصوت / الفيديو • نظام إدارة المباني • نظام البث التلفزيوني',
    true,
    'Tawila Island Luxury Resort Infrastructure — Integrated Technics',
    'مشروع فندق جزيرة الطويلة بالجونة — شركة التقنيات المتكاملة',
    'Turnkey resort integration including BMS, IPTV, data network, CCTV and fire systems.',
    'تنفيذ متكامل لمنظومة الاتصالات والتيار الخفيف وإدارة المباني والبث الفندقي بجزيرة الطويلة.'
  ),
  (
    6,
    '/projects/rafah.png',
    'Rafah Border Project',
    'مشروع معبر رفح',
    'Government',
    'DTP Screening Solution "Car & Truck scanner" • Gate Barriers system • ANPR system',
    'نظام الكشف بالأشعة السينية على المركبات والشاحنات • نظام تأمين البوابات • نظام المراقبة الرقمي للكشف عن السيارات',
    true,
    'Rafah Border Cargo & Vehicle Screening — Integrated Technics',
    'مشروع معبر رفح — شركة التقنيات المتكاملة',
    'High-energy drive-through X-ray screening and automated license plate recognition at border crossings.',
    'أنظمة المسح والتفتيش الإشعاعي المتطورة للشاحنات والمركبات وأنظمة تنظيم البوابات بمعبر رفح.'
  ),
  (
    7,
    '/projects/sharm.jpg',
    'Sharm El-Sheikh – South Sinai Governorate',
    'مدينة شرم الشيخ – محافظة جنوب سيناء',
    'Smart Cities',
    'Closed Circuit TV System (CCTV) • Car Scanners • Truck scanners • Baggage scanners',
    'تركيب أنظمة المراقبة التلفزيونية بالكاميرات • نظام التفتيش الذاتي للسيارات بالأشعة السينية • نظام التفتيش الذاتي للشاحنات بالأشعة السينية • نظام التفتيش وفحص الحقائب بالأشعة السينية',
    true,
    'Sharm El-Sheikh Security Modernization — Integrated Technics',
    'تأمين مدينة شرم الشيخ — شركة التقنيات المتكاملة',
    'City-scale surveillance network, vehicle X-ray inspection and checkpoint security across Sharm El-Sheikh.',
    'تأمين مداخل ومحيط مدينة شرم الشيخ بأنظمة الكاميرات الذكية ومحطات فحص السيارات والشاحنات.'
  ),
  (
    8,
    '/projects/october-city.png',
    'Sixth of October City',
    'مدينة السادس من أكتوبر',
    'Smart Cities',
    'Supplying and installing a full video surveillance system with cameras to secure the perimeter of the City (CCTV)',
    'توريد وتركيب نظام المراقبة التليفزيونية بالكاميرات لتأمين محيط المدينة',
    true,
    '6th of October City Perimeter Surveillance — Integrated Technics',
    'مشروع مدينة السادس من أكتوبر — شركة التقنيات المتكاملة',
    'Metropolitan perimeter video surveillance infrastructure securing 6th of October City.',
    'توريد وتركيب منظومة المراقبة التلفزيونية بالكاميرات الرقمية لتأمين محيط مدينة 6 أكتوبر.'
  ),
  (
    9,
    '/projects/airport.jpg',
    'Cairo International Airport',
    'مطار القاهرة الدولي',
    'Aviation & Transport',
    'Parking management system • Closed Circuit TV System (CCTV) • Baggage Scanner • Internet Protocol Television (IPTV) • Fire alarm system (FAS) • Access Control System (ACS) • Public Address System (PAS)',
    'نظام التحكم بمواقف السيارات • نظام المراقبة التلفزيونية بالكاميرات • نظام التفتيش وفحص الحقائب بالأشعة السينية • نظام البث التلفزيوني • أنظمة إنذار الحريق • نظام التحكم الإلكتروني في الدخول والخروج • أنظمة الصوتيات والمرئيات',
    true,
    'Cairo International Airport Terminal Systems — Integrated Technics',
    'مشروع مطار القاهرة الدولي — شركة التقنيات المتكاملة',
    'Comprehensive airport terminal integration: X-Ray baggage scanners, parking guidance, PAS and access control.',
    'حلول متكاملة لصالات مطار القاهرة الدولي تشمل فحص الحقائب، إدارة المواقف، والإذاعة الداخلية.'
  ),
  (
    10,
    '/projects/transport-planning.png',
    'General Authority For Transportation Projects Planning',
    'الهيئة العامة لتخطيط مشروعات النقل',
    'Aviation & Transport',
    'Closed Circuit TV System (CCTV) • Fire alarm and Firefighting system • Integration software between all systems',
    'تركيب أنظمة المراقبة التلفزيونية بالكاميرات • نظام الإنذار الآلي ونظام مكافحة الحريق • برنامج متكامل يربط جميع الأنظمة',
    true,
    'Transport Projects Planning Authority — Integrated Technics',
    'مشروع الهيئة العامة لتخطيط مشروعات النقل — شركة التقنيات المتكاملة',
    'Integrated surveillance, automated firefighting and centralized software platform.',
    'أنظمة كاميرات المراقبة، الإنذار ومكافحة الحريق مع منصة برمجية مركزية للربط والتحكم.'
  ),
  (
    11,
    '/projects/seaview.jpg',
    'Sea View Compound – North Coast',
    'كومباوند السى فيو بالساحل الشمالى',
    'Residential',
    'Automatic access control systems • Car parking and guidance control systems',
    'أنظمة التحكم بالدخول والخروج أوتوماتيكياً • نظام محاسبي ونظام إرشادي للتحكم في دخول ومواقف السيارات',
    true,
    'Sea View Compound North Coast — Integrated Technics',
    'مشروع كومباوند السى فيو بالساحل الشمالى — شركة التقنيات المتكاملة',
    'Smart gated community access automation and smart parking guidance systems.',
    'أنظمة البوابات الذكية وإدارة وتنظيم مواقف السيارات لكومباوند السى فيو بالساحل الشمالي.'
  ),
  (
    12,
    '/projects/dyar-5th.png',
    'Residential Compounds in 5th Settlement (Dyar)',
    'مجمعات سكنية بالتجمع الخامس (ديار)',
    'Residential',
    'Closed Circuit TV System (CCTV) • Mobile application for visitor management system',
    'تركيب أنظمة المراقبة التلفزيونية بالكاميرات • تطبيق الهاتف المحمول لنظام إدارة الزوار',
    true,
    '5th Settlement Residential Compounds — Integrated Technics',
    'مشروعات المجمعات السكنية بالتجمع الخامس — شركة التقنيات المتكاملة',
    'Gated community CCTV coverage and mobile app integration for residential visitor approvals.',
    'منظومة المراقبة بالكاميرات وتطبيق الهواتف الذكية لإدارة وتصريح دخول زوار المجمعات السكنية.'
  ),
  (
    13,
    '/projects/gov-offices.png',
    'Governmental Offices & Ministries',
    'مكاتب ومجمعات حكومية',
    'Government',
    'Closed Circuit TV System (CCTV) • Access control system • Fire alarm system • Intrusion system',
    'نظام المراقبة التلفزيونية بالكاميرات • نظام التحكم الإلكتروني في الدخول والخروج • أنظمة إنذار الحريق • نظام كشف الاختراقات والاقتحام',
    true,
    'Governmental Ministries & Administrative Offices — Integrated Technics',
    'المكاتب والوزارات الحكومية — شركة التقنيات المتكاملة',
    'Turnkey electronic perimeter defense, access badges, fire protection and intrusion detection.',
    'تجهيز وتأمين المكاتب والوزارات الحكومية بالدخول الإلكتروني، المراقبة وكشف محاولات الاقتحام.'
  ),
  (
    14,
    '/projects/sohag.png',
    'Sohag Governorate General Office',
    'مبنى ديوان عام محافظة سوهاج',
    'Government',
    'Closed Circuit TV System (CCTV) perimeter surveillance and access security',
    'أنظمة المراقبة التلفزيونية بالكاميرات وتأمين محيط المبنى',
    true,
    'Sohag Governorate General Headquarters — Integrated Technics',
    'مبنى ديوان عام محافظة سوهاج — شركة التقنيات المتكاملة',
    'High-resolution IP surveillance cameras and centralized video management for governorate HQ.',
    'أنظمة مراقبة تلفزيونية رقمية عالية الدقة لتأمين ديوان عام محافظة سوهاج.'
  ),
  (
    15,
    '/projects/metallurgical.png',
    'Metallurgical Development Research Center',
    'مركز بحوث وتطوير الفلزات',
    'Research & Education',
    'Closed Circuit TV System (CCTV) campus monitoring and security infrastructure',
    'أنظمة المراقبة التلفزيونية بالكاميرات وتأمين المقر والمختبرات البحثية',
    true,
    'Metallurgical Research Center Security — Integrated Technics',
    'مركز بحوث وتطوير الفلزات — شركة التقنيات المتكاملة',
    'Comprehensive surveillance infrastructure protecting specialized research laboratories.',
    'منظومة متقدمة من كاميرات المراقبة لتأمين المعامل والمختبرات البحثية التخصصية.'
  );

-- Update the primary sequence counter so next added project gets id 16
SELECT setval('projects_id_seq', 15, true);
