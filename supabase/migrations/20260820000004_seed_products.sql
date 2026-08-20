-- Seed dummy products
INSERT INTO public.products (slug, name_en, name_ar, description_en, description_ar, category_en, category_ar, featured, active)
VALUES
  (
    'enterprise-firewall-x1',
    'Enterprise Firewall X1',
    'جدار حماية المؤسسات X1',
    'Next-generation enterprise firewall offering deep packet inspection, intrusion prevention, and advanced malware protection.',
    'جدار حماية من الجيل التالي للمؤسسات يوفر فحصاً عميقاً للحزم، ومنع التسلل، وحماية متقدمة من البرامج الضارة.',
    'Network & Security',
    'الشبكات والأمن',
    true,
    true
  ),
  (
    'modular-datacenter-rack',
    'Modular Data Center Rack',
    'كابينة مركز بيانات معيارية',
    'High-capacity modular rack designed for optimal cooling and cable management in enterprise data centers.',
    'كابينة معيارية عالية السعة مصممة للتبريد الأمثل وإدارة الكابلات في مراكز بيانات المؤسسات.',
    'Data Center Solution',
    'حلول مراكز البيانات',
    true,
    true
  ),
  (
    'ip-pbx-system-pro',
    'IP-PBX System Pro',
    'نظام IP-PBX الاحترافي',
    'Unified communications system supporting up to 500 extensions, video conferencing, and mobile integration.',
    'نظام اتصالات موحد يدعم ما يصل إلى 500 تحويلة، مؤتمرات فيديو، وتكامل مع الأجهزة المحمولة.',
    'Voice & Unified Communication',
    'الصوت والاتصالات الموحدة',
    true,
    true
  ),
  (
    'conference-room-av-kit',
    'Conference Room A/V Kit',
    'مجموعة الصوت والفيديو لقاعات الاجتماعات',
    'Complete A/V kit featuring a 4K PTZ camera, ceiling microphones, and an integrated DSP for crystal clear meetings.',
    'مجموعة كاملة تتميز بكاميرا 4K وميكروفونات سقفية ومعالج صوت رقمي مدمج لاجتماعات واضحة.',
    'Audio/Video',
    'الصوت والفيديو',
    false,
    true
  ),
  (
    'biometric-access-terminal',
    'Biometric Access Terminal',
    'محطة وصول بيومترية',
    'Advanced access control terminal with facial recognition, fingerprint scanning, and RFID support.',
    'محطة متقدمة للتحكم في الوصول مع التعرف على الوجه، مسح البصمات، ودعم بطاقات RFID.',
    'Physical Security & Low Current',
    'الأمن المادي والتيار المنخفض',
    true,
    true
  );
