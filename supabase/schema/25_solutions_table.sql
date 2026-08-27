-- =================================================================
-- Create Solutions Table and Seed Initial Data
-- =================================================================

CREATE TABLE IF NOT EXISTS public.solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  bio_en text DEFAULT '',
  bio_ar text DEFAULT '',
  image text NOT NULL DEFAULT '',
  related_solutions jsonb NOT NULL DEFAULT '[]'::jsonb,
  vendors jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Solutions publicly readable" ON public.solutions;
CREATE POLICY "Solutions publicly readable"
  ON public.solutions FOR SELECT
  USING (true);

-- Authenticated staff/admins can manage
DROP POLICY IF EXISTS "Admins can manage solutions" ON public.solutions;
CREATE POLICY "Admins can manage solutions"
  ON public.solutions FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_solutions_updated_at ON public.solutions;
CREATE TRIGGER trg_solutions_updated_at BEFORE UPDATE ON public.solutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial solutions
INSERT INTO public.solutions (slug, name_en, name_ar, bio_en, bio_ar, image, related_solutions, vendors, sort_order, active)
VALUES
  (
    'enterprise-networking-sdwan',
    'Enterprise Networking & SD-WAN',
    'الحلول الشبكية المتقدمة وشبكات SD-WAN',
    'Resilient, high-bandwidth campus switching, intelligent SD-WAN routing, and Wi-Fi 7 wireless connectivity tailored for zero-downtime enterprise operations.',
    'بنية تحتية شبكية متطورة تشمل محولات الشبكة عالية السرعة، والتوجيه الذكي عبر تقنيات SD-WAN، وتغطية لاسلكية متطورة بمعيار Wi-Fi 7 لضمان استمرارية الأعمال.',
    'https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=1200&q=80',
    '[
      {
        "id": "rel-1",
        "icon": "Network",
        "title_en": "Campus LAN & Core Switching",
        "title_ar": "شبكات LAN والتحويل المركزي",
        "bio_en": "High-density multi-gigabit core and access switches with zero packet loss and wire-speed throughput.",
        "bio_ar": "محولات شبكة عالية الكثافة والسرعة لتوزيع البيانات بدون تأخير وبأعلى مستويات الاعتمادية."
      },
      {
        "id": "rel-2",
        "icon": "Globe",
        "title_en": "Secure SD-WAN Architecture",
        "title_ar": "معمارية SD-WAN الآمنة",
        "bio_en": "Application-aware dynamic routing with integrated threat protection across distributed branch offices.",
        "bio_ar": "توجيه ذكي ومؤمن لحركة البيانات بين الفروع والمقرات الرئيسية مع حماية مدمجة."
      },
      {
        "id": "rel-3",
        "icon": "Wifi",
        "title_en": "Enterprise Wi-Fi 7 Wireless",
        "title_ar": "الشبكات اللاسلكية Wi-Fi 7",
        "bio_en": "AI-optimized RF channel planning, high-concurrency coverage, and seamless roaming for campus users.",
        "bio_ar": "تغطية لاسلكية فائقة السرعة تدعم الكثافة العالية وتضمن الاتصال المستمر أثناء التنقل."
      },
      {
        "id": "rel-4",
        "icon": "Server",
        "title_en": "Data Center Spine-Leaf Fabric",
        "title_ar": "بنية Spine-Leaf لمراكز البيانات",
        "bio_en": "Ultra-low latency 100G/400G spine-leaf networking with automated intent-based network fabric management.",
        "bio_ar": "شبكات فائقة السرعة بزمن استجابة منخفض للغاية تدعم سرعات 100G و 400G مع إدارة آلية متقدمة."
      }
    ]'::jsonb,
    '[
      {
        "id": "ven-1",
        "name": "Cisco",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
        "website_url": "https://www.cisco.com"
      },
      {
        "id": "ven-2",
        "name": "HPE Aruba Networking",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Aruba_Networks_logo.svg",
        "website_url": "https://www.arubanetworks.com"
      },
      {
        "id": "ven-3",
        "name": "Fortinet",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/6/64/Fortinet_logo.svg",
        "website_url": "https://www.fortinet.com"
      },
      {
        "id": "ven-4",
        "name": "Juniper Networks",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/3/31/Juniper_Networks_logo.svg",
        "website_url": "https://www.juniper.net"
      }
    ]'::jsonb,
    0,
    true
  ),
  (
    'cybersecurity-zero-trust',
    'Cybersecurity & Zero Trust',
    'الأمن السيبراني وبنية الثقة المعدومة',
    'Holistic multi-layered cyber defense architecture spanning Next-Gen Firewalls, Zero Trust Network Access (ZTNA), EDR, and centralized SOC analytics.',
    'منظومة دفاعية سيبرانية متكاملة متعددة الطبقات تتضمن جدران الحماية المتقدمة، وبنية الثقة المعدومة ZTNA، وحماية النقاط الطرفية والتحليل الأمني المركزي.',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80',
    '[
      {
        "id": "rel-5",
        "icon": "Shield",
        "title_en": "Next-Gen Firewall (NGFW)",
        "title_ar": "جدران الحماية من الجيل الجديد",
        "bio_en": "Deep packet inspection, unified threat management, and ultra-high throughput encrypted traffic inspection.",
        "bio_ar": "فحص عميق لحزم البيانات وحماية شاملة من التهديدات المتطورة وفك تشفير البيانات المشبوهة."
      },
      {
        "id": "rel-6",
        "icon": "Lock",
        "title_en": "Zero Trust Network Access (ZTNA)",
        "title_ar": "الوصول وفق الثقة المعدومة ZTNA",
        "bio_en": "Strict contextual identity verification and micro-segmentation for hybrid workforce and cloud resources.",
        "bio_ar": "التحقق المشروط من هوية المستخدمين والأجهزة وتطبيق مبدأ الصلاحية الدنيا على كل اتصال."
      },
      {
        "id": "rel-7",
        "icon": "Cpu",
        "title_en": "Endpoint Detection & Response (EDR)",
        "title_ar": "حماية النقاط الطرفية والاستجابة الآلية",
        "bio_en": "Autonomous AI-driven threat mitigation, ransomware rollback, and behavioral anomaly detection.",
        "bio_ar": "كشف التهديدات المستمرة في أجهزة المستخدمين والخوادم والتصدي الفوري لهجمات الفدية."
      },
      {
        "id": "rel-8",
        "icon": "Activity",
        "title_en": "SIEM & SOC Operations Integration",
        "title_ar": "إدارة السجلات والعمليات الأمنية SIEM",
        "bio_en": "Centralized real-time telemetry correlation, automated playbook execution, and compliance auditing.",
        "bio_ar": "جمع وتحليل السجلات الأمنية في الوقت الفعلي والربط الذكي للتنبيهات لسرعة الاستجابة للحوادث."
      }
    ]'::jsonb,
    '[
      {
        "id": "ven-5",
        "name": "Palo Alto Networks",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/7/73/Palo_Alto_Networks_logo.svg",
        "website_url": "https://www.paloaltonetworks.com"
      },
      {
        "id": "ven-6",
        "name": "CrowdStrike",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/9/91/CrowdStrike_logo.svg",
        "website_url": "https://www.crowdstrike.com"
      },
      {
        "id": "ven-7",
        "name": "Fortinet",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/6/64/Fortinet_logo.svg",
        "website_url": "https://www.fortinet.com"
      },
      {
        "id": "ven-8",
        "name": "Microsoft Security",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
        "website_url": "https://www.microsoft.com/security"
      }
    ]'::jsonb,
    1,
    true
  ),
  (
    'smart-surveillance-physical-security',
    'Smart Surveillance & Physical Security',
    'أنظمة المراقبة الذكية والأمن الميداني',
    'Enterprise physical security ecosystems integrating AI optical surveillance, biometric access control, perimeter radar sensors, and centralized PSIM software.',
    'منظومات أمنية متكاملة تشمل المراقبة البصرية بالذكاء الاصطناعي، والتحكم بالدخول عبر البصمة والهوية الرقمية، وحماية الأسوار وغرف التحكم المركزية.',
    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&q=80',
    '[
      {
        "id": "rel-9",
        "icon": "Video",
        "title_en": "AI CCTV & Optical Surveillance",
        "title_ar": "كاميرات المراقبة بالذكاء الاصطناعي",
        "bio_en": "4K ultra-low light IP cameras with on-edge facial recognition, license plate reading, and object detection.",
        "bio_ar": "كاميرات مراقبة فائقة الوضوح مع معالجة ذكية للتعرف على الوجوه ولوحات المركبات وتتبع الحركة."
      },
      {
        "id": "rel-10",
        "icon": "Key",
        "title_en": "Biometric & Mobile Access Control",
        "title_ar": "أنظمة التحكم بالدخول البيومترية",
        "bio_en": "Touchless facial turnstiles, encrypted smart card readers, and mobile NFC credential integration.",
        "bio_ar": "بوابات إلكترونية وقارئات ذكية تدعم التعرف على الوجه، البطاقات المشفرة وتطبيقات الهواتف الذكية."
      },
      {
        "id": "rel-11",
        "icon": "Layers",
        "title_en": "PSIM & Video Management (VMS)",
        "title_ar": "منصة إدارة الفيديو والأمن الموحدة",
        "bio_en": "Single-pane-of-glass integration of video streams, alarms, geospatial maps, and incident dispatching.",
        "bio_ar": "برمجيات متطورة لربط جميع المنظومات الأمنية في شاشة مركزية واحدة مع خرائط تفاعلية."
      },
      {
        "id": "rel-12",
        "icon": "Bell",
        "title_en": "Perimeter Intrusion Detection",
        "title_ar": "كشف التسلل وحماية المحيط",
        "bio_en": "Fiber optic fence sensors, microwave barriers, and ground surveillance radar for perimeter protection.",
        "bio_ar": "ألياف ضوئية وحساسات رادارية متقدمة لرصد أي محاولة اختراق للمحيط الأمني للمنشأة."
      }
    ]'::jsonb,
    '[
      {
        "id": "ven-9",
        "name": "Axis Communications",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/b/b5/Axis_Communications_logo.svg",
        "website_url": "https://www.axis.com"
      },
      {
        "id": "ven-10",
        "name": "Milestone Systems",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Milestone_Systems_Logo.png",
        "website_url": "https://www.milestonesys.com"
      },
      {
        "id": "ven-11",
        "name": "Hanwha Vision",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/3/30/Hanwha_Group_Logo.svg",
        "website_url": "https://www.hanwhavision.com"
      },
      {
        "id": "ven-12",
        "name": "Bosch Security",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/1/16/Bosch-Logo.svg",
        "website_url": "https://www.boschsecurity.com"
      }
    ]'::jsonb,
    2,
    true
  ),
  (
    'data-center-cloud-infrastructure',
    'Data Center & Cloud Infrastructure',
    'مراكز البيانات والبنية السحابية',
    'Scalable, energy-efficient Tier III/IV data center facilities, Hyperconverged Infrastructure (HCI), precision power systems, and certified structured cabling.',
    'بناء وتجهيز مراكز البيانات المتطورة بمستويات مطابقة لمعايير Tier III/IV، والبنية التحتية فائقة التقارب HCI، وأنظمة التبريد والطاقة الدقيقة وشبكات الكوابل المنظمة.',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
    '[
      {
        "id": "rel-13",
        "icon": "Database",
        "title_en": "Hyperconverged Infrastructure (HCI)",
        "title_ar": "البنية التحتية فائقة التقارب HCI",
        "bio_en": "Software-defined compute, virtualized SAN storage, and enterprise private cloud orchestration.",
        "bio_ar": "دمج موارد المعالجة والتخزين والشبكات في منصة برمجية موحدة عالية التوفر والمرونة."
      },
      {
        "id": "rel-14",
        "icon": "Zap",
        "title_en": "Precision Cooling & Modular UPS",
        "title_ar": "أنظمة التبريد الدقيق ومزودات الطاقة UPS",
        "bio_en": "In-row containment cooling, hot/cold aisle setups, and modular N+1 uninterrupted power supplies.",
        "bio_ar": "تبريد دقيق موفر للطاقة وأنظمة طاقة احتياطية تضمن التشغيل المتواصل دون انقطاع."
      },
      {
        "id": "rel-15",
        "icon": "HardDrive",
        "title_en": "Disaster Recovery & Immutable Backup",
        "title_ar": "التعافي من الكوارث والنسخ الاحتياطي",
        "bio_en": "Near-zero RPO/RTO asynchronous site replication and air-gapped immutable storage protection.",
        "bio_ar": "نسخ احتياطي محصن ضد الهجمات واستعادة سريعة للبيانات والأنظمة لضمان استمرارية التشغيل."
      },
      {
        "id": "rel-16",
        "icon": "Cable",
        "title_en": "Structured Cabling & Fiber Plant",
        "title_ar": "أنظمة التمديدات والشبكات المنظمة",
        "bio_en": "High-density MPO fiber trunks, Cat6A / Cat7 copper cabling with 25-year component warranties.",
        "bio_ar": "مسارات وكوابل ألياف ضوئية ونحاسية مصنفة وفق أعلى المعايير الهندسية مع ضمانات طويلة الأمد."
      }
    ]'::jsonb,
    '[
      {
        "id": "ven-13",
        "name": "Dell Technologies",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg",
        "website_url": "https://www.dell.com"
      },
      {
        "id": "ven-14",
        "name": "Schneider Electric",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/9/95/Schneider_Electric_2007.svg",
        "website_url": "https://www.se.com"
      },
      {
        "id": "ven-15",
        "name": "Veeam",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/d/da/Veeam_logo.svg",
        "website_url": "https://www.veeam.com"
      },
      {
        "id": "ven-16",
        "name": "CommScope",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/9/91/CommScope_Logo.svg",
        "website_url": "https://www.commscope.com"
      }
    ]'::jsonb,
    3,
    true
  )
ON CONFLICT (slug) DO NOTHING;
