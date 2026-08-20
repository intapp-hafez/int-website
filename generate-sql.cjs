const fs = require('fs');
const partners = [
  { id: 'cisco', nameEn: 'Cisco Systems', nameAr: 'سيسكو', indEn: 'IT and Networking', indAr: 'تكنولوجيا المعلومات والشبكات', f1En: 'Routing & Switching', f1Ar: 'التوجيه والتبديل', f2En: 'Cybersecurity', f2Ar: 'الأمن السيبراني', f3En: 'Cloud Computing', f3Ar: 'الحوسبة السحابية' },
  { id: 'dell', nameEn: 'Dell Technologies', nameAr: 'ديل تكنولوجيز', indEn: 'Enterprise IT Infrastructure', indAr: 'البنية التحتية لتقنية المعلومات', f1En: 'Servers & Storage', f1Ar: 'الخوادم وحلول التخزين', f2En: 'Data Protection', f2Ar: 'حماية البيانات', f3En: 'Workstations', f3Ar: 'محطات العمل' },
  { id: 'fortinet', nameEn: 'Fortinet', nameAr: 'فورتينت', indEn: 'Cybersecurity Solutions', indAr: 'حلول الأمن السيبراني', f1En: 'Next-Gen Firewalls', f1Ar: 'جدران الحماية من الجيل التالي', f2En: 'Secure SD-WAN', f2Ar: 'شبكات SD-WAN الآمنة', f3En: 'Endpoint Security', f3Ar: 'أمن نقاط النهاية' },
  { id: 'schneider', nameEn: 'Schneider Electric', nameAr: 'شنايدر إلكتريك', indEn: 'Energy Management', indAr: 'إدارة الطاقة', f1En: 'Data Center Infrastructure', f1Ar: 'البنية التحتية لمراكز البيانات', f2En: 'Power Automation', f2Ar: 'أتمتة الطاقة', f3En: 'Cooling Systems', f3Ar: 'أنظمة التبريد' },
  { id: 'hikvision', nameEn: 'Hikvision', nameAr: 'هيكفيجن', indEn: 'Video Surveillance & IoT', indAr: 'المراقبة بالفيديو وإنترنت الأشياء', f1En: 'AI Cameras', f1Ar: 'كاميرات الذكاء الاصطناعي', f2En: 'Access Control', f2Ar: 'التحكم في الوصول', f3En: 'Thermal Imaging', f3Ar: 'التصوير الحراري' },
  { id: 'dahua', nameEn: 'Dahua Technology', nameAr: 'داهوا تكنولوجي', indEn: 'Smart Video Security', indAr: 'أمن الفيديو الذكي', f1En: 'CCTV Systems', f1Ar: 'أنظمة الدوائر التلفزيونية المغلقة', f2En: 'Smart IoT', f2Ar: 'إنترنت الأشياء الذكي', f3En: 'Perimeter Protection', f3Ar: 'حماية المحيط' },
  { id: 'axis', nameEn: 'Axis Communications', nameAr: 'أكسيس كوميونيكيشنز', indEn: 'Network Video & Audio', indAr: 'حلول الفيديو والصوت الشبكية', f1En: 'IP Cameras', f1Ar: 'كاميرات الشبكة (IP)', f2En: 'Network Audio', f2Ar: 'الصوتيات الشبكية', f3En: 'Video Analytics', f3Ar: 'تحليلات الفيديو' },
  { id: 'bosch', nameEn: 'Bosch Security', nameAr: 'بوش للأنظمة الأمنية', indEn: 'Security & Communications', indAr: 'الأنظمة الأمنية والاتصالات', f1En: 'Public Address Systems', f1Ar: 'أنظمة الإذاعة العامة', f2En: 'Intrusion Detection', f2Ar: 'أنظمة كشف التسلل', f3En: 'Fire Alarms', f3Ar: 'إنذار الحريق' },
  { id: 'honeywell', nameEn: 'Honeywell', nameAr: 'هانيويل', indEn: 'Building Automation', indAr: 'أتمتة المباني', f1En: 'Building Management', f1Ar: 'إدارة المباني', f2En: 'Life Safety', f2Ar: 'السلامة وحماية الأرواح', f3En: 'Industrial Control', f3Ar: 'التحكم الصناعي' },
  { id: 'hpe', nameEn: 'HPE Aruba Networking', nameAr: 'إتش بي إي أروبا', indEn: 'Wireless & Edge Networking', indAr: 'الشبكات اللاسلكية والطرفية', f1En: 'Wi-Fi Solutions', f1Ar: 'حلول الواي فاي', f2En: 'Network Access Control', f2Ar: 'التحكم في الوصول للشبكة', f3En: 'Enterprise Switches', f3Ar: 'محولات الشبكات المؤسسية' },
  { id: 'commscope', nameEn: 'CommScope', nameAr: 'كومسكوب', indEn: 'Network Infrastructure', indAr: 'البنية التحتية للشبكات', f1En: 'Fiber Optics', f1Ar: 'الألياف الضوئية', f2En: 'Structured Cabling', f2Ar: 'الكابلات الهيكلية', f3En: 'Wireless Broadband', f3Ar: 'النطاق العريض اللاسلكي' },
  { id: 'panduit', nameEn: 'Panduit', nameAr: 'باندويت', indEn: 'Physical Infrastructure', indAr: 'البنية التحتية المادية', f1En: 'Data Center Cabling', f1Ar: 'كابلات مراكز البيانات', f2En: 'Cable Management', f2Ar: 'إدارة الكابلات', f3En: 'Industrial Networks', f3Ar: 'الشبكات الصناعية' },
  { id: 'legrand', nameEn: 'Legrand', nameAr: 'ليجراند', indEn: 'Electrical & Digital Infrastructure', indAr: 'البنية التحتية الكهربائية والرقمية', f1En: 'Power Distribution', f1Ar: 'توزيع الطاقة', f2En: 'Wiring Devices', f2Ar: 'أجهزة التوصيل', f3En: 'AV Solutions', f3Ar: 'حلول الصوت والفيديو' },
  { id: 'vmware', nameEn: 'VMware by Broadcom', nameAr: 'في إم وير', indEn: 'Virtualization & Cloud', indAr: 'الأنظمة الافتراضية والسحابة', f1En: 'Server Virtualization', f1Ar: 'المحاكاة الافتراضية للخوادم', f2En: 'Software-Defined Data Center', f2Ar: 'مراكز البيانات المعرفة بالبرمجيات', f3En: 'Digital Workspace', f3Ar: 'مساحات العمل الرقمية' }
];

const genHtml = (p, isEn) => {
  if (isEn) {
    return `<h2>Company Overview</h2>
<p>${p.nameEn} is a distinguished global leader in the field of ${p.indEn}, renowned for delivering cutting-edge innovations that empower businesses worldwide. With decades of industry expertise, they have consistently redefined technological standards, ensuring unmatched reliability, operational excellence, and forward-thinking engineering.</p>
<h2>${p.f1En}</h2>
<p>At the core of ${p.nameEn}'s offerings lies their exceptional proficiency in ${p.f1En}. By leveraging state-of-the-art technologies and rigorous development processes, they provide scalable and resilient solutions tailored to meet the dynamic needs of modern infrastructure.</p>
<h2>${p.f2En}</h2>
<p>Recognizing the growing complexities of the digital era, ${p.nameEn} heavily invests in ${p.f2En}. Their comprehensive portfolio ensures seamless integration, maximum efficiency, and future-proof performance for enterprise-grade environments across diverse sectors.</p>
<h2>${p.f3En}</h2>
<p>Furthermore, their advancements in ${p.f3En} demonstrate a commitment to sustainability and intelligent automation. These breakthrough technologies empower organizations to optimize their resource utilization while maintaining peak operational capabilities.</p>
<h2>Our Strategic Partnership</h2>
<p>As a trusted and certified partner of ${p.nameEn}, we are uniquely positioned to integrate their world-class solutions into our clients' bespoke projects. Our deeply collaborative relationship guarantees that our customers receive specialized local support, accelerated deployment, and access to the latest enterprise technologies.</p>`;
  } else {
    return `<h2>نبذة عن الشركة</h2>
<p>تُعد ${p.nameAr} رائدة عالمية بارزة في مجال ${p.indAr}، حيث تشتهر بتقديم ابتكارات متطورة تمكّن الشركات حول العالم من تحقيق أهدافها. بفضل عقود من الخبرة في الصناعة، نجحت الشركة باستمرار في إعادة تعريف المعايير التكنولوجية، مما يضمن موثوقية لا مثيل لها وتميزاً تشغيلياً وهندسة استشرافية.</p>
<h2>${p.f1Ar}</h2>
<p>تكمن الكفاءة الاستثنائية لشركة ${p.nameAr} في قلب عروضها المتعلقة بـ ${p.f1Ar}. من خلال الاستفادة من أحدث التقنيات وعمليات التطوير الصارمة، توفر الشركة حلولاً قابلة للتطوير ومرنة ومصممة خصيصاً لتلبية الاحتياجات الديناميكية للبنى التحتية الحديثة.</p>
<h2>${p.f2Ar}</h2>
<p>إدراكاً منها للتعقيدات المتزايدة في العصر الرقمي، تستثمر ${p.nameAr} بشكل مكثف في ${p.f2Ar}. تضمن محفظتها الشاملة تكاملاً سلساً وأقصى قدر من الكفاءة وأداءً مستقبلياً لبيئات العمل المؤسسية عبر مختلف القطاعات الحيوية.</p>
<h2>${p.f3Ar}</h2>
<p>علاوة على ذلك، تُظهر تطوراتها المستمرة في ${p.f3Ar} التزاماً راسخاً بالاستدامة والأتمتة الذكية. تمكّن هذه التقنيات المبتكرة المؤسسات من تحسين استخدام مواردها مع الحفاظ على أعلى قدرات التشغيل الممكنة.</p>
<h2>شراكتنا الاستراتيجية</h2>
<p>بصفتنا شريكاً معتمداً وموثوقاً لشركة ${p.nameAr}، فإننا نتمتع بمكانة فريدة لدمج حلولها العالمية المستوى في مشاريع عملائنا المخصصة. تضمن علاقتنا التعاونية العميقة حصول عملائنا على دعم محلي متخصص، ونشر أسرع للمشاريع، وإمكانية الوصول الدائم إلى أحدث تقنيات المؤسسات.</p>`;
  }
};

let sql = 'ALTER TABLE partners ADD COLUMN IF NOT EXISTS description_en TEXT;\nALTER TABLE partners ADD COLUMN IF NOT EXISTS description_ar TEXT;\n\n';

partners.forEach(p => {
  const en = genHtml(p, true);
  const ar = genHtml(p, false);
  const safeEn = en.replace(/'/g, "''");
  const safeAr = ar.replace(/'/g, "''");
  sql += `UPDATE partners SET description_en = '${safeEn}', description_ar = '${safeAr}' WHERE name_en = '${p.nameEn}';\n`;
});

fs.writeFileSync('supabase/migrations/20260820000002_add_descriptions_to_partners.sql', sql, 'utf8');
console.log('SQL generated with UTF-8 encoding');
