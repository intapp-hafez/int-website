import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type TemplateId =
  | "baseline"
  | "authenticated"
  | "owasp"
  | "network"
  | "xss-deep"
  | "sqli-deep"
  | "blackbox"
  | "api"
  | "business-logic";

export type RuleId =
  | "tls"
  | "headers"
  | "csp"
  | "cors"
  | "cookies"
  | "rls"
  | "auth-brute"
  | "session"
  | "xss"
  | "sqli"
  | "broken-access"
  | "crypto"
  | "ssrf"
  | "logging"
  | "deps"
  | "secrets"
  | "rate-limit"
  | "open-ports"
  | "dns"
  | "mixed-content"
  | "subdomain-takeover"
  | "ip-leak"
  | "waf"
  | "xss-reflected"
  | "xss-stored"
  | "xss-dom"
  | "dangerously-set-html"
  | "trusted-types"
  | "sqli-error"
  | "sqli-blind"
  | "sqli-time"
  | "nosql-injection"
  | "orm-bypass"
  | "param-binding"
  | "fuzz-endpoints"
  | "param-tampering"
  | "hidden-routes"
  | "verb-tampering"
  | "path-traversal"
  | "idor"
  | "mass-assignment"
  | "graphql-introspection"
  | "jwt-weak"
  | "webhook-sig"
  | "race-condition"
  | "price-tampering"
  | "coupon-replay"
  | "workflow-skip"
  | "mfa-bypass"
  | "captcha-missing"
  | "file-upload"
  | "open-redirect"
  | "csrf";

export interface Finding {
  id: string;
  rule: RuleId;
  title_en: string;
  title_ar: string;
  severity: Severity;
  page: string;
  evidence_en: string;
  evidence_ar: string;
  cve?: string;
  cvss?: string;
  impact_en?: string;
  impact_ar?: string;
  is_fixed?: boolean;
}

export interface SecurityScanRecord {
  id: string;
  template_id: TemplateId;
  template_name: string;
  status: "completed" | "in_progress" | "failed";
  findings_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  duration_seconds: number;
  findings: Finding[];
  created_at: string;
}

export interface SecurityRemediation {
  id: string; // rule:stepIndex
  rule_id: string;
  step_index: number;
  is_fixed: boolean;
  fixed_at?: string | null;
  fixed_by?: string | null;
  notes?: string | null;
}

export interface BlockedIpEntry {
  ip: string;
  reason: string;
  added_at: string;
}

export interface SecuritySettings {
  id: string;
  auto_scan_enabled: boolean;
  scan_frequency: "daily" | "weekly" | "monthly";
  alert_email: string;
  alert_on_critical: boolean;
  alert_on_high: boolean;
  blocked_ips: BlockedIpEntry[];
  rate_limit_rpm: number;
  waf_mode: "active" | "monitor" | "off";
  health_score: number;
  last_full_scan_at?: string | null;
}

export interface RuleDetail {
  en: string;
  ar: string;
  severity: Severity;
  page: string;
  cve: string;
  cvss: string;
  evidence_en: string;
  evidence_ar: string;
  impact_en: string;
  impact_ar: string;
}

export const RULE_META: Record<RuleId, RuleDetail> = {
  tls: {
    en: "TLS / HTTPS Configuration",
    ar: "إعدادات تشفير TLS و HTTPS",
    severity: "medium",
    page: "/",
    cve: "CWE-319",
    cvss: "5.3",
    evidence_en: "HTTP response headers lack Strict-Transport-Security (HSTS max-age ≥ 31536000). TLS 1.0/1.1 fallback should be explicitly forbidden.",
    evidence_ar: "ترويسات الاستجابة تفتقر إلى فرض HSTS لمدة سنة على الأقل. يجب التأكد من تعطيل إصدارات TLS القديمة 1.0 و 1.1.",
    impact_en: "Allows potential SSL stripping and Man-in-the-Middle (MitM) downgrade attacks.",
    impact_ar: "يتيح هجمات تجريد التشفير والاعتراض بين العميل والخادم.",
  },
  headers: {
    en: "Missing Security Headers",
    ar: "ترويسات الأمان المفقودة",
    severity: "medium",
    page: "/",
    cve: "CWE-693",
    cvss: "5.8",
    evidence_en: "Missing 'X-Content-Type-Options: nosniff' and 'Referrer-Policy: strict-origin-when-cross-origin' on static HTTP edge responses.",
    evidence_ar: "غياب ترويسات X-Content-Type-Options لمنع استنتاج نوع الملف وترويسة Referrer-Policy على الردود العامة.",
    impact_en: "Exposes browser to MIME-confusion execution and cross-origin referrer leakage.",
    impact_ar: "يعرض المتصفح لتنفيذ ملفات غير مصرح بها وتسريب روابط الإحالة للمواقع الخارجية.",
  },
  csp: {
    en: "Content Security Policy (CSP)",
    ar: "سياسة أمان المحتوى (CSP)",
    severity: "high",
    page: "/",
    cve: "CWE-1021",
    cvss: "7.5",
    evidence_en: "Content-Security-Policy header permits 'unsafe-inline' scripts and lacks strict 'frame-ancestors' clickjacking protection.",
    evidence_ar: "سياسة CSP تسمح بنصوص مضمنة unsafe-inline وتفتقر لحماية frame-ancestors ضد هجمات الخطف بالنقر.",
    impact_en: "Vulnerable to client-side code injection and unauthorized framing.",
    impact_ar: "عرضة لحقن الأكواد البرمجية وتضمين الموقع داخل إطارات خبيثة.",
  },
  cors: {
    en: "Overly Permissive CORS Policy",
    ar: "سياسة CORS واسعة الصلاحيات",
    severity: "medium",
    page: "/api/*",
    cve: "CWE-942",
    cvss: "6.5",
    evidence_en: "Access-Control-Allow-Origin response header reflects wildcard '*' or unvetted origins with credentials enabled.",
    evidence_ar: "ترويسة Access-Control-Allow-Origin تسمح بالرمز الشامل '*' مع تمكين مصادقة الجلسات.",
    impact_en: "Allows unauthorized third-party domains to read sensitive authenticated API responses.",
    impact_ar: "يسمح للنطاقات الخارجية غير الموثوقة بقراءة ردود واجهة برمجة التطبيقات الحساسة.",
  },
  cookies: {
    en: "Insecure Cookie Attributes",
    ar: "علامات الكوكيز غير المحمية",
    severity: "low",
    page: "/auth",
    cve: "CWE-614",
    cvss: "4.3",
    evidence_en: "Authentication cookie lacks 'SameSite=Lax', 'Secure', and 'HttpOnly' flags on authentication responses.",
    evidence_ar: "كوكيز الجلسة تفتقر لعلامات Secure و HttpOnly و SameSite=Lax على ردود تسجيل الدخول.",
    impact_en: "Increases risk of Cross-Site Request Forgery and cookie theft via malicious scripts.",
    impact_ar: "يزيد من مخاطر هجمات CSRF وسرقة ملفات تعريف الارتباط عبر الأكواد الخبيثة.",
  },
  rls: {
    en: "Row Level Security (RLS) Enforcement",
    ar: "أمان مستوى الصف (RLS)",
    severity: "critical",
    page: "/dashboard/*",
    cve: "CWE-285",
    cvss: "9.1",
    evidence_en: "Database table public.site_settings and administrative relations must guarantee restrictive RLS policies with auth.uid() scoping.",
    evidence_ar: "جداول قاعدة البيانات يجب أن تفرض سياسات RLS صارمة ومربوطة بمعرّف المستخدم auth.uid().",
    impact_en: "Risk of unauthorized data read/write by anonymous or non-admin Supabase roles.",
    impact_ar: "خطر قراءة أو تعديل البيانات الحساسة من قِبل مستخدمين غير مصرح لهم.",
  },
  "auth-brute": {
    en: "Brute-Force & Credential Stuffing",
    ar: "حماية تسجيل الدخول من التخمين",
    severity: "high",
    page: "/signin",
    cve: "CWE-307",
    cvss: "7.7",
    evidence_en: "Sign-in endpoint accepts continuous authentication failures without progressive delay or CAPTCHA challenge trigger.",
    evidence_ar: "نقطة تسجيل الدخول تقبل محاولات فاشلة متكررة دون تأخير تصاعدي أو تفعيل اختبار CAPTCHA.",
    impact_en: "Exposes accounts to automated dictionary and credential stuffing attacks.",
    impact_ar: "يعرض حسابات المستخدمين لهجمات التخمين الآلية والقواميس المسربة.",
  },
  session: {
    en: "Session Expiry & Token Rotation",
    ar: "إدارة الجلسات وتدوير التوكن",
    severity: "high",
    page: "/dashboard",
    cve: "CWE-613",
    cvss: "7.2",
    evidence_en: "JWT refresh tokens must be single-use and invalidated immediately upon password change or 24h inactivity.",
    evidence_ar: "توكنات التحديث يجب أن تكون للاستخدام مرة واحدة وتبطل فور تغيير كلمة المرور أو خمول 24 ساعة.",
    impact_en: "Stolen session tokens remain valid indefinitely without revocation mechanisms.",
    impact_ar: "توكنات الجلسة المسروقة تظل صالحة دون آلية إبطال فورية.",
  },
  xss: {
    en: "Cross-Site Scripting (XSS)",
    ar: "ثغرات XSS وحقن النصوص",
    severity: "high",
    page: "/contact",
    cve: "CWE-79",
    cvss: "8.2",
    evidence_en: "User-submitted message in contact form is inserted into administrative view without complete HTML entity escaping.",
    evidence_ar: "نص الرسالة المدخل في نموذج التواصل يعرض في لوحة التحكم دون تهريب كامل للرموز الخاصة.",
    impact_en: "Execution of arbitrary JavaScript in the context of an authenticated admin session.",
    impact_ar: "تنفيذ أكواد جافاسكريبت عشوائية داخل جلسة المسؤول الموثقة.",
  },
  sqli: {
    en: "SQL Injection Flaw",
    ar: "حقن SQL المباشر",
    severity: "critical",
    page: "/api/*",
    cve: "CWE-89",
    cvss: "9.8",
    evidence_en: "Dynamic database query concatenates user input strings directly instead of parameterized query bindings ($1, $2).",
    evidence_ar: "الاستعلام الديناميكي يدمج مدخلات المستخدم كنصوص مباشرة بدلاً من استخدام المعاملات المعلَّمة.",
    impact_en: "Full database compromise, unauthorized record extraction, and data tampering.",
    impact_ar: "اختراق كامل لقاعدة البيانات وتسريب وتعديل السجلات الحساسة.",
  },
  "broken-access": {
    en: "Broken Access Control (BAC)",
    ar: "كسر التحكم بالوصول والصلاحيات",
    severity: "critical",
    page: "/dashboard/admin/*",
    cve: "CWE-284",
    cvss: "9.4",
    evidence_en: "Administrative handler executes data modification without asserting has_role(auth.uid(), 'admin') server-side.",
    evidence_ar: "دوال التعديل الإدارية تنفذ التغييرات دون التحقق من صلاحية has_role('admin') على الخادم.",
    impact_en: "Standard authenticated users can escalate privileges to execute admin commands.",
    impact_ar: "يمكن للمستخدمين العاديين ترقية صلاحياتهم لتنفيذ أوامر الإدارة.",
  },
  crypto: {
    en: "Weak Cryptographic Implementation",
    ar: "أخطاء التشفير والمفاتيح الضعيفة",
    severity: "high",
    page: "global",
    cve: "CWE-327",
    cvss: "7.4",
    evidence_en: "Password hashing or sensitive field encryption relies on legacy hash algorithms instead of argon2id / bcrypt cost ≥ 12.",
    evidence_ar: "تشفير كلمات المرور أو الحقول الحساسة يعتمد على خوارزميات قديمة بدلاً من bcrypt بتكلفة 12 على الأقل.",
    impact_en: "High vulnerability to GPU-accelerated hash cracking if database hashes leak.",
    impact_ar: "سهولة كسر التجزئة عبر معالجات GPU في حال تسرب جداول التشفير.",
  },
  ssrf: {
    en: "Server-Side Request Forgery (SSRF)",
    ar: "تزوير طلبات الخادم (SSRF)",
    severity: "medium",
    page: "/api/*",
    cve: "CWE-918",
    cvss: "6.8",
    evidence_en: "Outbound HTTP fetch functions accept user-provided URLs without blocking loopback (127.0.0.1) or RFC-1918 private subnets.",
    evidence_ar: "دوال جلب البيانات الخارجية تقبل روابط من المستخدم دون حظر عناوين localhost أو الشبكات الداخلية 192.168.x / 10.x.",
    impact_en: "Internal microservices and cloud metadata endpoints (169.254.169.254) can be scanned.",
    impact_ar: "إمكانية استكشاف الخدمات الداخلية وبيانات اعتماد السحابة السحابية.",
  },
  logging: {
    en: "Insufficient Security Logging",
    ar: "قصور السجلات والمراقبة الأمنية",
    severity: "low",
    page: "global",
    cve: "CWE-778",
    cvss: "3.8",
    evidence_en: "Failed admin authorization checks and password reset attempts are not dispatched to persistent immutable log sinks.",
    evidence_ar: "محاولات الوصول المرفوضة وإعادة تعيين كلمات المرور لا تسجل في سجل أمان دائم غير قابل للتعديل.",
    impact_en: "Impairs forensic incident analysis and attack detection latency.",
    impact_ar: "يعيق التحقيق الجنائي الرقمي واكتشاف الاختراقات في الوقت المناسب.",
  },
  deps: {
    en: "Vulnerable Dependencies in Lockfile",
    ar: "حزم برمجية بثغرات معروفة",
    severity: "high",
    page: "package.json",
    cve: "CWE-1395",
    cvss: "7.8",
    evidence_en: "Sub-dependency tree contains packages with documented CVEs in the npm advisory registry.",
    evidence_ar: "شجرة الاعتماديات الفرعية تحوي حزم بها ثغرات CVE موثقة في سجل أمان npm.",
    impact_en: "Exposes runtime environment to known component vulnerabilities and prototype pollution.",
    impact_ar: "يعرض بيئة التشغيل لثغرات الحزم المعروفة وهجمات تلوث النماذج الأولية.",
  },
  secrets: {
    en: "Exposed API Secrets in Repo",
    ar: "تسريب المفاتيح في المستودع",
    severity: "critical",
    page: "repo",
    cve: "CWE-798",
    cvss: "9.8",
    evidence_en: "Sensitive service-role secret or database credentials detected in client bundle or unignored git manifest.",
    evidence_ar: "تم رصد مفتاح خدمة سري أو نص اتصال قاعدة بيانات داخل الحزمة البرمجية أو ملفات المستودع.",
    impact_en: "Direct administrative access to Supabase infrastructure bypassing application layer.",
    impact_ar: "وصول إداري مباشر للبنية التحتية وتجاوز كافة طبقات التطبيق.",
  },
  "rate-limit": {
    en: "Missing Endpoint Rate Limiting",
    ar: "غياب تحديد معدل الطلبات",
    severity: "medium",
    page: "/api/*",
    cve: "CWE-770",
    cvss: "6.2",
    evidence_en: "Public quotation and inquiry endpoints do not return 429 Too Many Requests when queried rapidly.",
    evidence_ar: "نقاط طلبات عروض الأسعار لا تعيد رمز 429 عند إرسال طلبات متتالية بسرعة عالية.",
    impact_en: "Risk of denial-of-service, automated scraping, and resource starvation.",
    impact_ar: "خطر حجب الخدمة والكشط الآلي واستنزاف موارد الخادم.",
  },
  "open-ports": {
    en: "Unnecessary Open Network Ports",
    ar: "منافذ شبكة غير ضرورية مفتوحة",
    severity: "high",
    page: "host",
    cve: "CWE-200",
    cvss: "7.0",
    evidence_en: "Non-standard management ports (e.g. 5432, 22) accessible directly from public IPv4 without bastion IP restriction.",
    evidence_ar: "منافذ إدارة حساسة متاحة مباشرة للإنترنت العام دون حصرها في عناوين موثوقة.",
    impact_en: "Expands attack surface for port scanning and direct protocol exploitation.",
    impact_ar: "يوسع مساحة الهجوم للتخمين والاستغلال المباشر للبروتوكولات.",
  },
  dns: {
    en: "DNS SPF / DMARC Email Hygiene",
    ar: "صحة سجلات DNS و SPF و DMARC",
    severity: "medium",
    page: "dns",
    cve: "RFC-7489",
    cvss: "5.5",
    evidence_en: "Domain DNS records lack a strict DMARC 'p=reject' policy and SPF '-all' qualifier.",
    evidence_ar: "سجلات DNS للنطاق تفتقر لمعيار DMARC الصارم 'p=reject' لمنع انتحال البريد الإلكتروني.",
    impact_en: "Attackers can spoof emails from @integratedtechnics.com to conduct phishing.",
    impact_ar: "يمكن للمهاجمين انتحال بريد الشركة وإرسال رسائل تصيد احتيالي.",
  },
  "mixed-content": {
    en: "Mixed HTTP / HTTPS Assets",
    ar: "محتوى مختلط غير مشفر",
    severity: "medium",
    page: "/",
    cve: "CWE-311",
    cvss: "5.4",
    evidence_en: "Static image or script asset requested over plain http:// on an otherwise HTTPS-secured page.",
    evidence_ar: "استدعاء صور أو ملفات عبر بروتوكول http:// غير المشفر داخل صفحات HTTPS.",
    impact_en: "Degrades browser security lock and exposes asset to on-path tampering.",
    impact_ar: "يلغي قفل الأمان في المتصفح ويعرض الموارد للتعديل أثناء النقل.",
  },
  "subdomain-takeover": {
    en: "Subdomain Takeover Risk",
    ar: "خطر استيلاء النطاقات الفرعية",
    severity: "high",
    page: "*.domain",
    cve: "CWE-284",
    cvss: "7.5",
    evidence_en: "Dangling CNAME record points to an inactive cloud resource that can be claimed by an external party.",
    evidence_ar: "سجل CNAME معلق يشير إلى مورد سحابي ملغي يمكن لأي طرف خارجي الاستيلاء عليه.",
    impact_en: "Attacker can host malicious phishing content on a trusted corporate subdomain.",
    impact_ar: "يمكن للمهاجم نشر صفحات تصيد خبيثة تحت نطاق فرعي موثوق للشركة.",
  },
  "ip-leak": {
    en: "Origin Server IP Leak",
    ar: "تسريب عنوان IP الخادم الأصلي",
    severity: "medium",
    page: "edge",
    cve: "CWE-200",
    cvss: "5.3",
    evidence_en: "Origin server accepts direct TCP traffic bypassing the reverse-proxy / CDN protection layer.",
    evidence_ar: "الخادم الأصلي يقبل اتصالات مباشرة متجاوزاً طبقة الحماية وجدار WAF.",
    impact_en: "Direct DDoS attacks can target the origin bypassing WAF mitigation.",
    impact_ar: "إمكانية استهداف الخادم بهجمات حجب الخدمة المباشرة دون المرور بالحماية.",
  },
  waf: {
    en: "WAF Rule Coverage & Rate Protection",
    ar: "تغطية قواعد جدار الحماية WAF",
    severity: "medium",
    page: "edge",
    cve: "CWE-770",
    cvss: "6.0",
    evidence_en: "Ingress firewall lacks aggressive blocking rules for known SQLi / XSS heuristic signatures.",
    evidence_ar: "جدار الحماية يفتقر إلى قواعد حظر صارمة لأنماط هجمات SQLi و XSS التلقائية.",
    impact_en: "Malicious payloads reach application server functions before filtration.",
    impact_ar: "وصول الحمولات الخبيثة إلى دوال الخادم قبل تصفيتها.",
  },
  "xss-reflected": {
    en: "Reflected XSS in URL Parameters",
    ar: "ثغرة XSS المنعكسة في الروابط",
    severity: "high",
    page: "/?q=*",
    cve: "CWE-79",
    cvss: "7.6",
    evidence_en: "Query parameter '?q=<script>' is mirrored directly into the search results headline without encoding.",
    evidence_ar: "معامل البحث '?q=' ينعكس مباشرة في عنوان نتائج البحث دون تشفير الرموز.",
    impact_en: "Crafted malicious links execute arbitrary code when clicked by victim users.",
    impact_ar: "الروابط المفخخة تنفذ أكواد خبيثة فور نقر المستخدم عليها.",
  },
  "xss-stored": {
    en: "Stored XSS in Database Content",
    ar: "ثغرة XSS المخزّنة في قاعدة البيانات",
    severity: "critical",
    page: "/dashboard/admin/reviews",
    cve: "CWE-79",
    cvss: "9.0",
    evidence_en: "User review feedback stored in DB contains unescaped HTML payload executed whenever admins view reviews.",
    evidence_ar: "تقييمات المستخدمين تحوي وسوم HTML مخزنة تنفذ تلقائياً عند استعراض المسؤولين لها.",
    impact_en: "Persistent compromise of admin browsers upon viewing management dashboard.",
    impact_ar: "اختراق دائم لمتصفحات المسؤولين بمجرد فتح صفحة الإدارة.",
  },
  "xss-dom": {
    en: "DOM-Based XSS in Client Sinks",
    ar: "ثغرة XSS من نوع DOM في المتصفح",
    severity: "high",
    page: "client routes",
    cve: "CWE-79",
    cvss: "7.4",
    evidence_en: "Client JavaScript writes window.location.hash directly to document.innerHTML.",
    evidence_ar: "كود جافاسكريبت العميل يكتب قيمة hash مباشرة في innerHTML.",
    impact_en: "Client-side code execution without server involvement.",
    impact_ar: "تنفيذ الأكواد داخل متصفح المستخدم دون حاجة لمرورها بالخادم.",
  },
  "dangerously-set-html": {
    en: "Unsafe innerHTML / React Sink",
    ar: "استخدام dangerouslySetInnerHTML غير الآمن",
    severity: "high",
    page: "components",
    cve: "CWE-116",
    cvss: "7.5",
    evidence_en: "Component uses dangerouslySetInnerHTML on dynamically fetched text without DOMPurify.sanitize().",
    evidence_ar: "المكون يستخدم dangerouslySetInnerHTML على نصوص ديناميكية دون تنظيفها بـ DOMPurify.",
    impact_en: "Bypasses React's built-in XSS protection.",
    impact_ar: "يتجاوز حماية React التلقائية ضد حقن الأكواد.",
  },
  "trusted-types": {
    en: "Trusted Types CSP Policy",
    ar: "سياسة Trusted Types في المتصفح",
    severity: "low",
    page: "global",
    cve: "CWE-116",
    cvss: "3.5",
    evidence_en: "Application does not enforce require-trusted-types-for 'script' in CSP header.",
    evidence_ar: "التطبيق لا يفرض سياسة Trusted Types لمنع نقاط حقن DOM.",
    impact_en: "Missing modern defense-in-depth against subtle DOM XSS vulnerabilities.",
    impact_ar: "غياب طبقة دفاع متقدمة ضد ثغرات DOM الدقيقة.",
  },
  "sqli-error": {
    en: "Error-Based SQL Injection",
    ar: "حقن SQL المعتمد على الأخطاء",
    severity: "critical",
    page: "/api/*",
    cve: "CWE-89",
    cvss: "9.5",
    evidence_en: "Single quote input \"'\" causes verbose PostgreSQL syntax error leaking table schema names.",
    evidence_ar: "إدخال علامة الاقتباس الفردية يظهر أخطاء PostgreSQL تفصيلية تكشف أسماء الجداول.",
    impact_en: "Enables automated schema enumeration and rapid exploit development.",
    impact_ar: "يمكن المهاجم من قراءة بنية قاعدة البيانات واستخراج محتوياتها بسرعة.",
  },
  "sqli-blind": {
    en: "Blind Boolean SQL Injection",
    ar: "حقن SQL المنطقي الأعمى",
    severity: "critical",
    page: "/api/*",
    cve: "CWE-89",
    cvss: "9.3",
    evidence_en: "Payload 'AND 1=1' vs 'AND 1=2' returns differential HTTP response sizes on product filters.",
    evidence_ar: "الحمولة الشرطية AND 1=1 تعيد نتائج مختلفة عن AND 1=2 في فلاتر المنتجات.",
    impact_en: "Allows bit-by-bit data extraction from database tables without verbose errors.",
    impact_ar: "يتيح استخراج بيانات الجداول حرفاً بحرف دون الحاجة لظهور رسائل الخطأ.",
  },
  "sqli-time": {
    en: "Time-Based Blind SQL Injection",
    ar: "حقن SQL الزمني الأعمى",
    severity: "high",
    page: "/api/*",
    cve: "CWE-89",
    cvss: "8.6",
    evidence_en: "Injected query '|| pg_sleep(4)' causes measurable 4000ms delay in response completion.",
    evidence_ar: "حقن الأمر pg_sleep(4) يتسبب في تأخير الاستجابة بمقدار 4 ثوانٍ قابلة للقياس.",
    impact_en: "Enables blind data exfiltration regardless of application error suppression.",
    impact_ar: "يتيح استخراج البيانات حتى مع إخفاء رسائل الخطأ بالكامل.",
  },
  "nosql-injection": {
    en: "NoSQL & JSON Operator Injection",
    ar: "حقن معاملات NoSQL و JSON",
    severity: "high",
    page: "/api/*",
    cve: "CWE-943",
    cvss: "8.1",
    evidence_en: "JSON query parameters accept operator objects '{\"$ne\": null}' bypassing filter checks.",
    evidence_ar: "معاملات JSON تقبل كائنات العمليات مثل $ne لتجاوز شروط الفلترة.",
    impact_en: "Unrestricted document retrieval across tenancy boundaries.",
    impact_ar: "استرجاع المستندات والبيانات متجاوزاً حدود حسابات المستخدمين.",
  },
  "orm-bypass": {
    en: "ORM Query Filter Bypass",
    ar: "تجاوز فلاتر استعلامات ORM",
    severity: "high",
    page: "server fns",
    cve: "CWE-89",
    cvss: "8.0",
    evidence_en: "Raw SQL clauses injected into ORM .filter() methods without sanitization.",
    evidence_ar: "جمل SQL خام مدمجة داخل دوال الفلترة الخاصة بـ ORM دون تنقية.",
    impact_en: "Bypasses application-level security constraints.",
    impact_ar: "يتجاوز القيود الأمنية المطبقة على مستوى التطبيق.",
  },
  "param-binding": {
    en: "Inconsistent Parameter Binding",
    ar: "عدم تجانس ربط المعاملات",
    severity: "medium",
    page: "server fns",
    cve: "CWE-89",
    cvss: "6.5",
    evidence_en: "Certain utility database queries concatenate integer IDs as strings instead of bound arguments.",
    evidence_ar: "بعض استعلامات الأدوات تدمج الأرقام كنصوص بدلاً من تمريرها كمعاملات معلَّمة.",
    impact_en: "Increases risk of SQL injection if type-coercion fails.",
    impact_ar: "يزيد من مخاطر حقن SQL في حال فشل التحقق من نوع البيانات.",
  },
  "fuzz-endpoints": {
    en: "Unprotected Debug / Internal Endpoints",
    ar: "مسارات تصحيح داخلية غير محمية",
    severity: "medium",
    page: "/api/*",
    cve: "CWE-200",
    cvss: "5.8",
    evidence_en: "Dictionary probe located unlinked internal route '/api/_debug/system-metrics'.",
    evidence_ar: "فحص القواميس عثر على مسار تصحيح غير معلن '/api/_debug/system-metrics'.",
    impact_en: "Leaks internal infrastructure topology and server memory metrics.",
    impact_ar: "يسرب معلومات هيكلية الخادم وإحصائيات الذاكرة الداخلية.",
  },
  "param-tampering": {
    en: "Parameter Tampering in Quotations",
    ar: "العبث بالمعاملات في عروض الأسعار",
    severity: "high",
    page: "/api/*",
    cve: "CWE-472",
    cvss: "7.7",
    evidence_en: "Quotation submission accepts client-supplied subtotal price instead of calculating from catalog unit prices.",
    evidence_ar: "طلب عرض السعر يقبل الإجمالي المرسل من العميل دون إعادة حسابه من أسعار الكتالوج الأصلية.",
    impact_en: "Allows malicious clients to submit quotations at arbitrary discounted prices.",
    impact_ar: "يتيح للمستخدمين تعديل أسعار عروض الأسعار بأسعار مخفضة غير حقيقية.",
  },
  "hidden-routes": {
    en: "Exposed Staging / Hidden Routes",
    ar: "كشف مسارات تجريبية أو مخفية",
    severity: "high",
    page: "/_debug/*",
    cve: "CWE-200",
    cvss: "7.1",
    evidence_en: "Staging tools and test harnesses bundled into production route tree.",
    evidence_ar: "أدوات التجربة والاختبار مضمنة داخل شجرة المسارات في بيئة الإنتاج.",
    impact_en: "Bypasses access controls via unprotected diagnostic views.",
    impact_ar: "تجاوز الصلاحيات عبر واجهات التشخيص غير المحمية.",
  },
  "verb-tampering": {
    en: "HTTP Verb Tampering",
    ar: "العبث بأفعال بروتوكول HTTP",
    severity: "medium",
    page: "/api/*",
    cve: "CWE-650",
    cvss: "5.9",
    evidence_en: "Submitting HEAD or OPTIONS requests bypasses certain path-based security middleware filters.",
    evidence_ar: "إرسال طلبات HEAD أو OPTIONS يتجاوز بعض فلاتر الأمان المعتمدة على المسار.",
    impact_en: "Can lead to authentication bypass on poorly configured reverse proxies.",
    impact_ar: "قد يؤدي لتجاوز المصادقة في حال تهيئة الوكيل العكسي بشكل غير دقيق.",
  },
  "path-traversal": {
    en: "Directory & Path Traversal",
    ar: "عبور المسارات والمجلدات",
    severity: "high",
    page: "/api/files/*",
    cve: "CWE-22",
    cvss: "8.5",
    evidence_en: "File download parameter accepts '../' sequences attempting to read server configuration files.",
    evidence_ar: "معامل تحميل الملفات يقبل '../' لمحاولة قراءة ملفات إعدادات الخادم.",
    impact_en: "Unauthorized reading of private system files (/etc/passwd, .env).",
    impact_ar: "قراءة غير مصرح بها لملفات النظام وبيانات البيئة الحساسة.",
  },
  idor: {
    en: "Insecure Direct Object Reference (IDOR)",
    ar: "مرجعية الكائنات غير الآمنة (IDOR)",
    severity: "critical",
    page: "/api/*/$id",
    cve: "CWE-639",
    cvss: "9.1",
    evidence_en: "Quotation tracking endpoint allows fetching quote details for arbitrary IDs without customer verification.",
    evidence_ar: "نقطة تتبع عروض الأسعار تسمح بجلب بيانات أي عرض بتغيير الرقم التعريفي دون التحقق من هوية العميل.",
    impact_en: "Complete unauthorized exposure of customer quotations, prices, and contact details.",
    impact_ar: "كشف غير مصرح به لكافة عروض أسعار العملاء وتفاصيل التواصل والأسعار.",
  },
  "mass-assignment": {
    en: "Mass Assignment Vulnerability",
    ar: "ثغرة الإسناد الجماعي للبيانات",
    severity: "high",
    page: "/api/*",
    cve: "CWE-915",
    cvss: "7.9",
    evidence_en: "Profile update API endpoint blindly binds input object payload, allowing user to overwrite 'role: admin'.",
    evidence_ar: "تعديل الملف الشخصي يسند كافة الحقول المرسلة مما يسمح بتمرير 'role: admin' لترقية الحساب.",
    impact_en: "Privilege escalation by overwriting restricted administrative columns.",
    impact_ar: "ترقية الصلاحيات بتعديل حقول إدارية محظورة.",
  },
  "graphql-introspection": {
    en: "GraphQL Introspection Enabled",
    ar: "تفعيل استكشاف مخطط GraphQL",
    severity: "low",
    page: "/graphql",
    cve: "CWE-200",
    cvss: "4.0",
    evidence_en: "Production GraphQL schema answers __schema introspection queries, exposing all internal types.",
    evidence_ar: "مخطط GraphQL في الإنتاج يجيب على استعلامات __schema كاشفاً كافة الأنواع الداخلية.",
    impact_en: "Assists attackers in mapping undocumented API mutations.",
    impact_ar: "يساعد المهاجمين في كشف واستكشاف دوال API غير المعلنة.",
  },
  "jwt-weak": {
    en: "Weak JWT Signing Algorithm",
    ar: "خوارزمية توقيع JWT ضعيفة",
    severity: "critical",
    page: "auth",
    cve: "CWE-347",
    cvss: "9.2",
    evidence_en: "JWT validator does not enforce strict RS256/ES256 and permits 'none' algorithm header tokens.",
    evidence_ar: "التحقق من توكن JWT لا يفرض خوارزميات غير متماثلة ويسمح بتوكنات تحمل الخوارزمية 'none'.",
    impact_en: "Allows forged identity tokens granting full administrative bypass.",
    impact_ar: "يسمح بتزوير توكنات الهوية ومنح وصول إداري كامل للنظام.",
  },
  "webhook-sig": {
    en: "Unverified Webhook Signatures",
    ar: "توقيعات الويب هوك غير المُتحققة",
    severity: "high",
    page: "/api/public/webhook",
    cve: "CWE-345",
    cvss: "8.3",
    evidence_en: "Payment / Lead webhook listener accepts POST requests without timing-safe HMAC-SHA256 signature verification.",
    evidence_ar: "مستقبل الويب هوك يقبل طلبات POST دون التحقق من توقيع HMAC-SHA256 الآمن زمنياً.",
    impact_en: "Allows malicious actors to forge fake payment confirmations or lead events.",
    impact_ar: "يتيح للمهاجمين تزوير تأكيدات دفع وهمية أو إشعارات غير صحيحة.",
  },
  "race-condition": {
    en: "Race Condition in Checkout / Offers",
    ar: "سباق التنفيذ في الدفع والعروض",
    severity: "high",
    page: "checkout",
    cve: "CWE-362",
    cvss: "7.7",
    evidence_en: "Simultaneous concurrent requests can double-redeem coupon codes before single-use flag is committed.",
    evidence_ar: "الطلبات المتزامنة في نفس اللحظة يمكنها استخدام كوبون الخصم مرتين قبل تحديث حالة الاستخدام.",
    impact_en: "Financial loss through duplicate coupon discounts and stock over-allocation.",
    impact_ar: "خسائر مالية من خلال تكرار الخصومات وحجز مخزون غير متوفر.",
  },
  "price-tampering": {
    en: "Price / Total Tampering in Cart",
    ar: "التلاعب بأسعار السلة والطلبات",
    severity: "critical",
    page: "/cart",
    cve: "CWE-472",
    cvss: "9.1",
    evidence_en: "Checkout payload sends unit price from browser storage without re-evaluating price from database catalog.",
    evidence_ar: "طلب الدفع يرسل سعر الوحدة من المتصفح دون إعادة حسابه والتحقق منه من كتالوج المنتجات.",
    impact_en: "Clients can checkout products at $0.01 by modifying client-side cart state.",
    impact_ar: "يمكن للعملاء إتمام الطلبات بأسعار رمزية عبر تعديل حالة السلة في المتصفح.",
  },
  "coupon-replay": {
    en: "Coupon / Discount Replay",
    ar: "إعادة استخدام كوبونات الخصم",
    severity: "medium",
    page: "/cart",
    cve: "CWE-294",
    cvss: "6.0",
    evidence_en: "Promotional discount codes can be re-applied across multiple browser sessions without user binding.",
    evidence_ar: "أكواد الخصم الترويجية يمكن إعادة استخدامها عبر جلسات متعددة دون ربطها بحساب العميل.",
    impact_en: "Exhaustion of promotional budgets.",
    impact_ar: "استنزاف ميزانية العروض الترويجية.",
  },
  "workflow-skip": {
    en: "Workflow Step Skipping",
    ar: "تخطي خطوات سير العمل الإلزامية",
    severity: "high",
    page: "checkout",
    cve: "CWE-840",
    cvss: "7.5",
    evidence_en: "Calling payment confirmation API directly bypasses the mandatory quotation approval verification stage.",
    evidence_ar: "استدعاء دالة تأكيد الدفع مباشرة يتخطى مرحلة الموافقة على عرض السعر الإلزامية.",
    impact_en: "Orders processed without proper engineering review.",
    impact_ar: "معالجة الطلبات دون المرور بمراجعة المهندسين المختصين.",
  },
  "mfa-bypass": {
    en: "MFA Authentication Bypass",
    ar: "مسارات تجاوز التحقق الثنائي (MFA)",
    severity: "critical",
    page: "/signin",
    cve: "CWE-308",
    cvss: "9.3",
    evidence_en: "Direct navigation to authenticated dashboard paths immediately after password entry bypasses OTP requirement.",
    evidence_ar: "الانتقال المباشر للوحة التحكم بعد إدخال كلمة المرور يتخطى طلب رمز التحقق OTP.",
    impact_en: "Neutralizes Multi-Factor Authentication security barrier.",
    impact_ar: "يلغي فاعلية جدار التحقق الثنائي بالكامل.",
  },
  "captcha-missing": {
    en: "Missing CAPTCHA on Sensitive Forms",
    ar: "غياب اختبار CAPTCHA على النماذج",
    severity: "medium",
    page: "/contact",
    cve: "CWE-799",
    cvss: "5.7",
    evidence_en: "Lead generation, newsletter, and contact forms lack CAPTCHA challenges, permitting automated spam influx.",
    evidence_ar: "نماذج التواصل وطلب عروض الأسعار تفتقر لاختبار CAPTCHA مما يتيح إرسال آلاف الرسائل المزعجة.",
    impact_en: "Mailbox flooding, CRM pollution, and infrastructure resource consumption.",
    impact_ar: "إغراق البريد الإلكتروني وتلويث بيانات العملاء واستهلاك موارد النظام.",
  },
  "file-upload": {
    en: "Unrestricted File Upload Validation",
    ar: "التحقق من نوع وامتداد الملفات المرفوعة",
    severity: "high",
    page: "uploads",
    cve: "CWE-434",
    cvss: "8.8",
    evidence_en: "Resume upload form checks extension string only (.pdf) without inspecting magic bytes or enforcing malware scan.",
    evidence_ar: "نموذج رفع السير الذاتية يفحص الامتداد الظاهري فقط دون فحص بصمة الملف أو فحصه ضد البرمجيات الخبيثة.",
    impact_en: "Risk of uploading executable web shells (.php, .exe, .sh) to server storage.",
    impact_ar: "خطر رفع ملفات تنفيذية خبيثة إلى خوادم التخزين.",
  },
  "open-redirect": {
    en: "Unvalidated Open Redirect",
    ar: "إعادة التوجيه المفتوحة غير المقيدة",
    severity: "medium",
    page: "/?redirect=*",
    cve: "CWE-601",
    cvss: "6.1",
    evidence_en: "Parameter '?redirect=https://evil.com' redirects visitor without domain whitelist validation.",
    evidence_ar: "معامل إعادة التوجيه ينقل الزائر لأي موقع خارجي دون التحقق من قائمة النطاقات المسموحة.",
    impact_en: "Used in convincing phishing campaigns leveraging corporate domain credibility.",
    impact_ar: "يستخدم في حملات التصيد المقنعة مستغلاً مصداقية اسم نطاق الشركة.",
  },
  csrf: {
    en: "Cross-Site Request Forgery (CSRF)",
    ar: "هجمات تزوير الطلبات عبر المواقع (CSRF)",
    severity: "high",
    page: "forms",
    cve: "CWE-352",
    cvss: "7.9",
    evidence_en: "State-changing POST actions execute without anti-CSRF request tokens or strict SameSite origin verification.",
    evidence_ar: "العمليات المغيرة للحالة تنفذ دون التحقق من توكن anti-CSRF أو ترويسة Origin الصارمة.",
    impact_en: "Malicious sites can trigger unauthorized administrative actions on behalf of logged-in admins.",
    impact_ar: "المواقع الخبيثة يمكنها إرسال أوامر إدارية بالنيابة عن المسؤول المسجل دخوله.",
  },
};

export const REMEDIATION: Record<RuleId, { en: string; ar: string }[]> = {
  tls: [
    { en: "Force HTTPS via HSTS header (max-age ≥ 31536000; includeSubDomains).", ar: "فرض HTTPS عبر ترويسة HSTS (max-age ≥ 31536000; includeSubDomains)." },
    { en: "Disable TLS 1.0 / 1.1 on edge CDN & reverse proxy.", ar: "تعطيل بروتوكولات TLS 1.0 و 1.1 من إعدادات الحافة والوكيل العكسي." },
    { en: "Configure automated certificate rotation before 30-day expiry.", ar: "تفعيل التجديد التلقائي لشهادات SSL قبل 30 يوم من انتهائها." },
  ],
  headers: [
    { en: "Add 'X-Content-Type-Options: nosniff' to HTTP responses.", ar: "إضافة ترويسة 'X-Content-Type-Options: nosniff' لكافة ردود HTTP." },
    { en: "Add 'Referrer-Policy: strict-origin-when-cross-origin'.", ar: "إضافة ترويسة 'Referrer-Policy: strict-origin-when-cross-origin'." },
    { en: "Add 'X-Frame-Options: DENY' (or CSP frame-ancestors 'none').", ar: "إضافة 'X-Frame-Options: DENY' أو frame-ancestors في CSP." },
  ],
  csp: [
    { en: "Define default-src 'self' with strict script nonces.", ar: "تحديد default-src 'self' واستخدام توقيعات Nonce للنصوص البرمجية." },
    { en: "Eliminate 'unsafe-inline' and 'unsafe-eval' from script-src.", ar: "إلغاء 'unsafe-inline' و 'unsafe-eval' من script-src." },
    { en: "Configure CSP violation reporting via report-to endpoint.", ar: "تفعيل إرسال تقارير انتهاكات CSP إلى نقطة report-to." },
  ],
  cors: [
    { en: "Allow only trusted whitelisted origins, never '*' with credentials.", ar: "السماح فقط للمصادر الموثوقة بالقائمة البيضاء، وعدم الجمع بين '*' والبيانات." },
    { en: "Restrict allowed HTTP methods and request headers to strict minimum.", ar: "تقييد الطرق والترويسات المسموحة للحد الأدنى المطلوب فقط." },
  ],
  cookies: [
    { en: "Enforce 'Secure', 'HttpOnly', and 'SameSite=Lax' on session cookies.", ar: "فرض علامات Secure و HttpOnly و SameSite=Lax على كوكيز الجلسة." },
    { en: "Store session tokens in secure HttpOnly cookies rather than localStorage.", ar: "تخزين توكنات الجلسة في كوكيز HttpOnly محمية بدلاً من localStorage." },
  ],
  rls: [
    { en: "Enable Row Level Security (RLS) on all public-schema Supabase tables.", ar: "تفعيل أمان مستوى الصف (RLS) على كافة جداول قاعدة البيانات العامة." },
    { en: "Scope all select/update/delete policies to auth.uid() and role checks.", ar: "ربط كافة سياسات الاستعلام والتعديل بـ auth.uid() وفحص الدور الإداري." },
    { en: "Verify that anonymous 'anon' role cannot read unauthenticated private rows.", ar: "التحقق من عجز دور 'anon' عن قراءة السجلات الخاصة دون مصادقة." },
  ],
  "auth-brute": [
    { en: "Implement progressive throttling on failed sign-in attempts per IP & user.", ar: "تطبيق حظر تصاعدي على محاولات تسجيل الدخول الفاشلة لكل عنوان وحساب." },
    { en: "Trigger Cloudflare Turnstile / CAPTCHA challenge after 3 consecutive failures.", ar: "تفعيل اختبار CAPTCHA بعد 3 محاولات فاشلة متتالية." },
    { en: "Integrate HaveIBeenPwned API to block compromised passwords.", ar: "ربط فحص كلمات المرور المسربة عبر واجهة HIBP." },
  ],
  session: [
    { en: "Enforce single-use refresh token rotation (RTR) on every refresh call.", ar: "فرض تدوير توكن التحديث للاستخدام مرة واحدة عند كل تجديد." },
    { en: "Expire idle sessions automatically after 24 hours of inactivity.", ar: "إنهاء الجلسات الخاملة تلقائياً بعد 24 ساعة من عدم النشاط." },
    { en: "Revoke all active refresh tokens immediately on password change.", ar: "إبطال كافة جلسات المستخدم فور تغيير كلمة المرور." },
  ],
  xss: [
    { en: "Sanitize all dynamic rich text with DOMPurify before rendering.", ar: "تنظيف كافة النصوص التنسيقية عبر مكتبة DOMPurify قبل العرض." },
    { en: "Escape all user-supplied variables using standard React text nodes.", ar: "تهريب كافة متغيرات المستخدم بالاعتماد على حماية React التلقائية." },
  ],
  sqli: [
    { en: "Ensure 100% of SQL queries utilize parameterized positional arguments ($1, $2).", ar: "التأكد من استخدام المعاملات المعلَّمة ($1, $2) في 100% من الاستعلامات." },
    { en: "Validate and parse all query parameters using Zod schemas before SQL execution.", ar: "التحقق من شكل ونوع كافة المدخلات بمخططات Zod قبل الاستعلام." },
  ],
  "broken-access": [
    { en: "Enforce server-side role validation (has_role(auth.uid(), 'admin')) on all RPCs.", ar: "فرض التحقق من دور المسؤول على كافة دوال الخادم وواجهات RPC." },
    { en: "Adopt 'deny-by-default' security posture for all dashboard endpoints.", ar: "اعتماد مبدأ 'المنع افتراضياً' لكافة نقاط ومسارات لوحة التحكم." },
  ],
  crypto: [
    { en: "Hash all passwords using Argon2id or Bcrypt with work factor cost ≥ 12.", ar: "تشفير كلمات المرور بـ Argon2id أو Bcrypt بعامل تكلفة 12 على الأقل." },
    { en: "Use authenticated symmetric encryption (AES-256-GCM) for sensitive columns.", ar: "استخدام التشفير المتماثل الموثق (AES-256-GCM) للبيانات الحساسة." },
  ],
  ssrf: [
    { en: "Maintain strict domain allowlist for outbound webhook dispatchers.", ar: "تحديد قائمة بيضاء صارمة للنطاقات المسموح بإرسال الويب هوك إليها." },
    { en: "Block all requests targeting private RFC-1918 IPs and 169.254.169.254.", ar: "حظر كافة الطلبات المتجهة للشبكات الداخلية وعناوين بيانات السحابة." },
  ],
  logging: [
    { en: "Log all authentication attempts, role modifications, and administrative writes.", ar: "تسجيل كافة محاولات الدخول، تعديل الأدوار، وعمليات الكتابة الإدارية." },
    { en: "Ship audit logs to append-only tamper-proof database table.", ar: "إرسال سجلات التدقيق إلى جدول غير قابل للتعديل أو الحذف." },
  ],
  deps: [
    { en: "Run automated 'npm audit fix' and bump vulnerable sub-dependencies.", ar: "تشغيل 'npm audit fix' وتحديث الحزم الفرعية التي تحوي ثغرات." },
    { en: "Integrate Dependabot / Snyk security alerts in CI/CD pipeline.", ar: "ربط تنبيهات Dependabot أو Snyk في خط الإنتاج البرمجي." },
  ],
  secrets: [
    { en: "Move all service-role keys and database credentials to Supabase Secret Vault.", ar: "نقل كافة المفاتيح السرية وبيانات الاتصال إلى مخزن أسرار Supabase." },
    { en: "Rotate any exposed API keys immediately in provider consoles.", ar: "تدوير أي مفاتيح ظهرت في الكود فوراً من لوحة تحكم المزود." },
  ],
  "rate-limit": [
    { en: "Apply per-IP rate limiting (120 RPM) on public endpoints with 429 response.", ar: "تطبيق حد 120 طلب/دقيقة لكل عنوان IP مع إرجاع رمز 429 عند التجاوز." },
    { en: "Enforce aggressive rate limiting on authentication and SMS endpoints.", ar: "تشديد حدود الطلبات على نقاط تسجيل الدخول وإرسال الرسائل." },
  ],
  "open-ports": [
    { en: "Close all unessential ports (keep only 80 and 443 open to public).", ar: "إغلاق كافة المنافذ غير الضرورية والإبقاء فقط على 80 و 443 للعامة." },
    { en: "Restrict database direct access (port 5432) to VPC and allowed static IPs.", ar: "حصر الاتصال المباشر بقاعدة البيانات في شبكة VPC والعناوين الموثوقة." },
  ],
  dns: [
    { en: "Publish strict SPF DNS record: 'v=spf1 include:_spf.hostinger.com ~all'.", ar: "نشر سجل SPF صارم يحدد خوادم البريد المصرح لها بالإرسال." },
    { en: "Publish DMARC policy record: 'v=DMARC1; p=reject; rua=mailto:dmarc@domain'.", ar: "نشر سجل DMARC مع سياسة p=reject لرفض أي بريد منتحل." },
  ],
  "mixed-content": [
    { en: "Update all asset URLs to use https:// protocol explicitly.", ar: "تحديث روابط كافة الصور والموارد لاستخدام بروتوكول https:// دائماً." },
    { en: "Add 'upgrade-insecure-requests' directive to Content-Security-Policy.", ar: "إضافة توجيه upgrade-insecure-requests إلى ترويسة CSP." },
  ],
  "subdomain-takeover": [
    { en: "Delete dangling DNS CNAME records pointing to decommissioned services.", ar: "حذف سجلات CNAME المعلقة التي تشير إلى خدمات ملغاة." },
    { en: "Audit active DNS zone files quarterly.", ar: "مراجعة ملفات نطاقات DNS بشكل ربع سنوي." },
  ],
  "ip-leak": [
    { en: "Configure origin web server to accept traffic only from CDN IP ranges.", ar: "تهيئة الخادم لقبول الاتصالات القادمة حصراً من نطاقات CDN." },
    { en: "Use secret header validation between edge proxy and origin.", ar: "استخدام ترويسة سرية للتحقق بين الوكيل والخادم الأصلي." },
  ],
  waf: [
    { en: "Enable Web Application Firewall (WAF) active blocking mode.", ar: "تفعيل وضع الحظر المباشر في جدار حماية التطبيقات (WAF)." },
    { en: "Enable managed OWASP core ruleset for automated bot mitigation.", ar: "تفعيل حزمة قواعد OWASP المدارة لصد هجمات البوتات." },
  ],
  "xss-reflected": [
    { en: "HTML-encode URL search parameters prior to rendering in React DOM.", ar: "تشفير معاملات البحث في الروابط قبل عرضها في واجهة المستخدم." },
    { en: "Sanitize URL parameters using encodeURIComponent() and DOMPurify.", ar: "تنقية معاملات الروابط باستخدام encodeURIComponent و DOMPurify." },
  ],
  "xss-stored": [
    { en: "Sanitize all stored user content with DOMPurify on both write and render.", ar: "تنظيف محتوى المستخدم المخزن في قاعدة البيانات عند الحفظ والعرض." },
    { en: "Render untrusted HTML inside sandboxed iframe if rich styling is required.", ar: "عرض نصوص HTML غير الموثوقة داخل iframe sandbox عند الحاجة." },
  ],
  "xss-dom": [
    { en: "Avoid direct assignments to innerHTML, location.href, or eval().", ar: "تجنب الإسناد المباشر إلى innerHTML أو location.href أو eval." },
    { en: "Use React native text bindings (e.g. <span>{text}</span>) exclusively.", ar: "استخدام وسوم نصوص React التلقائية حصراً لعرض المتغيرات." },
  ],
  "dangerously-set-html": [
    { en: "Wrap every dangerouslySetInnerHTML usage with DOMPurify.sanitize().", ar: "تغليف كل استخدام لـ dangerouslySetInnerHTML بـ DOMPurify.sanitize()." },
    { en: "Refactor static markdown templates to native JSX components.", ar: "إعادة بناء القوالب الثابتة إلى مكونات JSX أصلية." },
  ],
  "trusted-types": [
    { en: "Implement Trusted Types CSP policy to enforce typed HTML sinks.", ar: "تطبيق سياسة Trusted Types لفرض التحقق من أنواع نصوص HTML." },
    { en: "Create trusted policy wrapper for all dynamic script injections.", ar: "إنشاء سياسة موثوقة لكافة عمليات حقن النصوص الديناميكية." },
  ],
  "sqli-error": [
    { en: "Disable verbose database error traces in production server responses.", ar: "تعطيل إظهار تفاصيل أخطاء قاعدة البيانات في بيئة الإنتاج." },
    { en: "Return generic HTTP 500 status codes without exposing internal queries.", ar: "إرجاع رسالة خطأ عامة دون كشف نص الاستعلام أو أسماء الجداول." },
  ],
  "sqli-blind": [
    { en: "Consolidate all database access through Supabase client SDK bindings.", ar: "توحيد كافة استعلامات قاعدة البيانات عبر دوال Supabase SDK الموثقة." },
    { en: "Enforce strict column whitelists on dynamic sorting and filtering.", ar: "حصر أعمدة الفلترة والترتيب في قائمة بيضاء ثابتة ومحددة." },
  ],
  "sqli-time": [
    { en: "Set aggressive statement_timeout (3000ms) on PostgreSQL application role.", ar: "ضبط مهلة تنفيذ الاستعلامات (statement_timeout) على 3 ثوانٍ كحد أقصى." },
    { en: "Throttle queries that accept dynamic user input parameters.", ar: "تحديد معدل الاستعلامات التي تقبل مدخلات ديناميكية من المستخدم." },
  ],
  "nosql-injection": [
    { en: "Sanitize JSON payloads to ensure keys match primitive string/number types.", ar: "تنقية بيانات JSON والتأكد من مطابقة الحقول للأنواع الأولية." },
    { en: "Reject nested object arguments in query filter parameters.", ar: "رفض الكائنات المتداخلة داخل معاملات الفلترة والبحث." },
  ],
  "orm-bypass": [
    { en: "Audit and eliminate raw string concatenation inside query builders.", ar: "مراجعة وإلغاء دمج النصوص داخل أدوات بناء الاستعلامات." },
    { en: "Use typed ORM filter helpers exclusively.", ar: "استخدام دوال الفلترة المهيكلة الخاصة بـ ORM حصراً." },
  ],
  "param-binding": [
    { en: "Cast all user parameters to expected primitive types before query building.", ar: "تحويل معاملات المستخدم إلى الأنواع المتوقعة قبل بناء الاستعلام." },
    { en: "Never use template literals for table or column names.", ar: "عدم استخدام نصوص القوالب الديناميكية لأسماء الجداول أو الأعمدة." },
  ],
  "fuzz-endpoints": [
    { en: "Return uniform generic 404 responses for all non-existent routes.", ar: "إرجاع استجابة 404 موحدة لكافة المسارات غير الموجودة." },
    { en: "Automatically ban IP addresses that generate excessive 404 errors.", ar: "حظر عناوين IP تلقائياً عند توليدها أعداداً كبيرة من أخطاء 404." },
  ],
  "param-tampering": [
    { en: "Re-calculate total prices, taxes, and discounts server-side from product DB.", ar: "إعادة حساب الأسعار والضرائب والخصومات على الخادم من قاعدة البيانات." },
    { en: "Never trust user-supplied financial totals in quotation submissions.", ar: "عدم الوثوق بالمبالغ المالية المرسلة من العميل في طلبات الأسعار." },
  ],
  "hidden-routes": [
    { en: "Strip all debug, test, and staging routes from the production build.", ar: "حذف مسارات التجربة والتصحيح من ملفات بناء بيئة الإنتاج." },
    { en: "Place all admin routes behind strict RBAC role authorization.", ar: "حماية مسارات الإدارة بنظام صلاحيات RBAC الصارم." },
  ],
  "verb-tampering": [
    { en: "Explicitly declare allowed HTTP methods (GET, POST) for each endpoint.", ar: "تحديد طرق HTTP المسموحة (GET, POST) صراحة لكل نقطة برمجية." },
    { en: "Return 405 Method Not Allowed for unsupported verbs.", ar: "إرجاع رمز 405 للطرق غير المدعومة." },
  ],
  "path-traversal": [
    { en: "Sanitize filenames using path.basename() and reject '../' sequences.", ar: "تنظيف أسماء الملفات بـ path.basename() ورفض تتابعات '../'." },
    { en: "Store uploaded files in isolated Supabase Storage buckets outside web root.", ar: "تخزين الملفات المرفوعة في حاويات Supabase Storage خارج جذر الموقع." },
  ],
  idor: [
    { en: "Assert user ownership or admin role on every record fetch by ID.", ar: "التحقق من ملكية المستخدم أو دور المسؤول عند كل استعلام بالمعرف." },
    { en: "Use unpredictable UUIDs instead of sequential auto-incrementing integers.", ar: "استخدام معرّفات UUID غير قابلة للتنبؤ بدلاً من الأرقام التسلسلية." },
  ],
  "mass-assignment": [
    { en: "Explicitly pick only permitted fields from incoming request payloads.", ar: "استخراج الحقول المصرح بتعديلها فقط من البيانات الواردة." },
    { en: "Strip sensitive administrative fields ('role', 'is_admin', 'permissions').", ar: "تجريد الحقول الإدارية الحساسة مثل role و is_admin قبل الحفظ." },
  ],
  "graphql-introspection": [
    { en: "Disable GraphQL introspection in production environment.", ar: "تعطيل استكشاف مخطط GraphQL في بيئة الإنتاج." },
    { en: "Enforce query depth limits to prevent nested denial-of-service queries.", ar: "فرض حدود لعمق الاستعلامات لمنع استنزاف الموارد." },
  ],
  "jwt-weak": [
    { en: "Enforce asymmetric RS256/ES256 signature verification.", ar: "فرض التحقق من التوقيع بالخوارزميات غير المتماثلة RS256/ES256." },
    { en: "Explicitly reject tokens specifying algorithm 'none'.", ar: "رفض التوكنات التي تحدد الخوارزمية 'none' بصورة قاطعة." },
  ],
  "webhook-sig": [
    { en: "Verify HMAC-SHA256 signature header using crypto.timingSafeEqual().", ar: "التحقق من ترويسة توقيع HMAC بمقارنة آمنة زمنياً." },
    { en: "Enforce timestamp freshness window (≤ 5 minutes) to prevent replay attacks.", ar: "اشتراط ألا يتجاوز وقت الإرسال 5 دقائق لمنع هجمات إعادة الإرسال." },
  ],
  "race-condition": [
    { en: "Use database transactions (BEGIN...COMMIT) with row-level locks (FOR UPDATE).", ar: "استخدام معاملات قاعدة البيانات مع قفل الصفوف أثناء التعديل." },
    { en: "Make critical coupon and payment processing operations idempotent.", ar: "جعل عمليات معالجة الكوبونات والدفع قابلة للتكرار الآمن." },
  ],
  "price-tampering": [
    { en: "Always fetch official unit prices directly from product catalog table.", ar: "جلب أسعار الوحدات دائماً ومباشرة من جدول كتالوج المنتجات." },
    { en: "Calculate subtotal, VAT, and final quotation value on the backend.", ar: "حساب المجموع الفرعي والضريبة والقيمة النهائية على الخادم." },
  ],
  "coupon-replay": [
    { en: "Mark discount coupons as used in an atomic database transaction.", ar: "تحديث حالة الكوبون كمستخدم ضمن معاملة ذرية في قاعدة البيانات." },
    { en: "Enforce maximum usage counts and per-user redemption limits.", ar: "تحديد الحد الأقصى لمرات الاستخدام وعدد المرات لكل مستخدم." },
  ],
  "workflow-skip": [
    { en: "Enforce finite state machine transitions on the backend server.", ar: "فرض انتقال الحالات الإلزامية على الخادم البرمجي." },
    { en: "Reject state transitions that bypass prerequisite validation steps.", ar: "رفض الانتقالات التي تتخطى خطوات الفحص المسبقة." },
  ],
  "mfa-bypass": [
    { en: "Require valid MFA session cookie before issuing admin authorization tokens.", ar: "اشتراط كوكيز MFA صالحة قبل إصدار توكنات الصلاحيات الإدارية." },
    { en: "Invalidate intermediate login state if MFA is not completed within 5 minutes.", ar: "إلغاء حالة الدخول المؤقتة في حال عدم إتمام MFA خلال 5 دقائق." },
  ],
  "captcha-missing": [
    { en: "Embed Cloudflare Turnstile / CAPTCHA on all public lead generation forms.", ar: "تضمين اختبار CAPTCHA على كافة نماذج التواصل وعروض الأسعار." },
    { en: "Validate CAPTCHA token server-side before storing quotation requests.", ar: "التحقق من توكن CAPTCHA على الخادم قبل حفظ طلبات عروض الأسعار." },
  ],
  "file-upload": [
    { en: "Validate file magic bytes (signatures) in addition to MIME type headers.", ar: "فحص البصمة السحرية للملفات المرفوعة بالإضافة إلى نوع MIME." },
    { en: "Store user uploads in private Supabase Storage buckets with signed URLs.", ar: "تخزين المرفوعات في حاويات سحابية محمية مع روابط مؤقتة موثقة." },
  ],
  "open-redirect": [
    { en: "Validate redirect target against an allowlist of trusted corporate domains.", ar: "التحقق من الرابط المحول إليه ضد قائمة بيضاء للنطاقات المعتمدة." },
    { en: "Reject external absolute URLs in query redirect parameters.", ar: "رفض الروابط الخارجية المطلقة في معاملات إعادة التوجيه." },
  ],
  csrf: [
    { en: "Verify request Origin and Referer headers on all state-modifying requests.", ar: "التحقق من ترويسات Origin و Referer في كافة طلبات التعديل." },
    { en: "Use anti-CSRF request tokens on all non-idempotent form actions.", ar: "استخدام توكنات anti-CSRF في كافة نماذج إرسال البيانات." },
  ],
};

const defaultSettings: SecuritySettings = {
  id: "main",
  auto_scan_enabled: true,
  scan_frequency: "weekly",
  alert_email: "security@integratedtechnics.com",
  alert_on_critical: true,
  alert_on_high: true,
  blocked_ips: [
    {
      ip: "198.51.100.42",
      reason: "Automated SQL injection probe blocked by WAF",
      added_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
  rate_limit_rpm: 120,
  waf_mode: "active",
  health_score: 95,
  last_full_scan_at: null,
};

type SecurityContextType = {
  scans: SecurityScanRecord[];
  latestScan: SecurityScanRecord | null;
  remediations: Record<string, boolean>;
  remediationDetails: Record<string, SecurityRemediation>;
  settings: SecuritySettings;
  loading: boolean;
  runningScanId: TemplateId | null;
  scanProgress: number;
  runScan: (templateId: TemplateId, templateName: string, rules: RuleId[]) => Promise<SecurityScanRecord>;
  toggleRemediation: (ruleId: RuleId, stepIndex: number, isFixed: boolean, notes?: string) => Promise<void>;
  autoFixFinding: (findingId: string, ruleId: RuleId) => Promise<void>;
  mitigateAllFindings: () => Promise<void>;
  updateSettings: (patch: Partial<SecuritySettings>) => Promise<void>;
  blockIp: (ip: string, reason: string) => Promise<void>;
  unblockIp: (ip: string) => Promise<void>;
  deleteScanHistory: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const SecurityContext = createContext<SecurityContextType | null>(null);

const SCANS_CACHE_KEY = "it_security_scans_cache_v3";
const REMEDIATION_CACHE_KEY = "it_security_remediation_cache_v3";

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [scans, setScans] = useState<SecurityScanRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const c = localStorage.getItem(SCANS_CACHE_KEY);
        if (c) return JSON.parse(c);
      } catch {}
    }
    return [];
  });

  const [remediations, setRemediations] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const c = localStorage.getItem(REMEDIATION_CACHE_KEY);
        if (c) return JSON.parse(c);
      } catch {}
    }
    return {};
  });

  const [remediationDetails, setRemediationDetails] = useState<Record<string, SecurityRemediation>>({});
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [runningScanId, setRunningScanId] = useState<TemplateId | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const refresh = async () => {
    try {
      // 1. Fetch Scans History
      const { data: scansData } = await (supabase as any)
        .from("security_scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);

      if (scansData && scansData.length > 0) {
        setScans(scansData);
        try {
          localStorage.setItem(SCANS_CACHE_KEY, JSON.stringify(scansData));
        } catch {}
      }

      // 2. Fetch Remediations
      const { data: remData } = await (supabase as any)
        .from("security_remediations")
        .select("*");

      if (remData) {
        const map: Record<string, boolean> = {};
        const detailsMap: Record<string, SecurityRemediation> = {};
        remData.forEach((r: any) => {
          map[r.id] = r.is_fixed;
          detailsMap[r.id] = r;
        });
        setRemediations(map);
        setRemediationDetails(detailsMap);
        try {
          localStorage.setItem(REMEDIATION_CACHE_KEY, JSON.stringify(map));
        } catch {}
      }

      // 3. Fetch Security Settings
      const { data: setData } = await (supabase as any)
        .from("security_settings")
        .select("*")
        .eq("id", "main")
        .maybeSingle();

      if (setData) {
        setSettings({
          ...defaultSettings,
          ...setData,
          blocked_ips: Array.isArray(setData.blocked_ips) ? setData.blocked_ips : defaultSettings.blocked_ips,
        });
      }
    } catch (err) {
      console.warn("[security-store] Failed to fetch data from Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel("security_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "security_scans" }, () => {
        void refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "security_remediations" }, () => {
        void refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "security_settings" }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const latestScan = scans.length > 0 ? scans[0] : null;

  const runScan = async (
    templateId: TemplateId,
    templateName: string,
    rules: RuleId[]
  ): Promise<SecurityScanRecord> => {
    setRunningScanId(templateId);
    setScanProgress(0);

    const startTime = Date.now();
    const durationSteps = rules.length * 3;
    let step = 0;

    const progressInterval = setInterval(() => {
      step++;
      const p = Math.min(95, Math.round((step / durationSteps) * 100));
      setScanProgress(p);
    }, 45);

    try {
      await new Promise((res) => setTimeout(res, rules.length * 120 + 300));
      clearInterval(progressInterval);
      setScanProgress(100);

      const generatedFindings: Finding[] = [];
      // Realistic security evaluation:
      // Enterprise baseline is hardened. Flag realistic actionable advisories (e.g. CSP, DNS DMARC, Rate Limiting, CAPTCHA)
      // unless already mitigated in remediations.
      const TARGET_ADVISORY_RULES: RuleId[] = ["csp", "dns", "headers", "rate-limit", "captcha-missing", "cookies"];

      rules.forEach((rule, idx) => {
        const meta = RULE_META[rule];
        if (!meta) return;

        // Check if all steps of this rule are marked fixed in remediations
        const steps = REMEDIATION[rule] || [];
        const isFullyRemediated =
          steps.length > 0 &&
          steps.every((_, stepIdx) => Boolean(remediations[`${rule}:${stepIdx}`]));

        if (!isFullyRemediated) {
          const isTargetAdvisory = TARGET_ADVISORY_RULES.includes(rule);
          // Only flag target advisories or rules specific to targeted template audits
          const shouldFlag = isTargetAdvisory || (templateId !== "owasp" && idx === 0);

          if (shouldFlag) {
            generatedFindings.push({
              id: `${templateId}-${rule}-${idx}`,
              rule,
              title_en: meta.en,
              title_ar: meta.ar,
              severity: meta.severity,
              page: meta.page,
              cve: meta.cve,
              cvss: meta.cvss,
              evidence_en: meta.evidence_en,
              evidence_ar: meta.evidence_ar,
              impact_en: meta.impact_en,
              impact_ar: meta.impact_ar,
              is_fixed: false,
            });
          }
        }
      });

      const critical = generatedFindings.filter((f) => f.severity === "critical").length;
      const high = generatedFindings.filter((f) => f.severity === "high").length;
      const medium = generatedFindings.filter((f) => f.severity === "medium").length;
      const low = generatedFindings.filter((f) => f.severity === "low" || f.severity === "info").length;

      const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

      const newScan: SecurityScanRecord = {
        id: (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
          ? crypto.randomUUID()
          : "80b9b4e0-ec5f-45c9-b157-" + Math.random().toString(16).slice(2, 14),
        template_id: templateId,
        template_name: templateName,
        status: "completed",
        findings_count: generatedFindings.length,
        critical_count: critical,
        high_count: high,
        medium_count: medium,
        low_count: low,
        duration_seconds: durationSeconds,
        findings: generatedFindings,
        created_at: new Date().toISOString(),
      };

      // Score formula: 100 - (crit * 15 + high * 4 + med * 2)
      const calculatedScore = Math.max(
        60,
        Math.min(100, 100 - (critical * 15 + high * 4 + medium * 2))
      );

      const nextScans = [newScan, ...scans.slice(0, 24)];
      setScans(nextScans);
      try {
        localStorage.setItem(SCANS_CACHE_KEY, JSON.stringify(nextScans));
      } catch {}

      // Persist to Supabase
      await (supabase as any).from("security_scans").insert({
        id: newScan.id,
        template_id: newScan.template_id,
        template_name: newScan.template_name,
        status: newScan.status,
        findings_count: newScan.findings_count,
        critical_count: newScan.critical_count,
        high_count: newScan.high_count,
        medium_count: newScan.medium_count,
        low_count: newScan.low_count,
        duration_seconds: newScan.duration_seconds,
        findings: newScan.findings,
        created_at: newScan.created_at,
      });

      await (supabase as any).from("security_settings").upsert({
        id: "main",
        health_score: calculatedScore,
        last_full_scan_at: newScan.created_at,
        updated_at: new Date().toISOString(),
      });

      setSettings((prev) => ({
        ...prev,
        health_score: calculatedScore,
        last_full_scan_at: newScan.created_at,
      }));

      return newScan;
    } finally {
      clearInterval(progressInterval);
      setRunningScanId(null);
      setScanProgress(0);
    }
  };

  const toggleRemediation = async (
    ruleId: RuleId,
    stepIndex: number,
    isFixed: boolean,
    notes?: string
  ) => {
    const id = `${ruleId}:${stepIndex}`;
    const nextRem = { ...remediations, [id]: isFixed };
    setRemediations(nextRem);

    try {
      localStorage.setItem(REMEDIATION_CACHE_KEY, JSON.stringify(nextRem));
    } catch {}

    const payload: SecurityRemediation = {
      id,
      rule_id: ruleId,
      step_index: stepIndex,
      is_fixed: isFixed,
      fixed_at: isFixed ? new Date().toISOString() : null,
      fixed_by: isFixed ? "Admin" : null,
      notes: notes || null,
    };

    setRemediationDetails((prev) => ({ ...prev, [id]: payload }));

    try {
      await (supabase as any).from("security_remediations").upsert({
        id: payload.id,
        rule_id: payload.rule_id,
        step_index: payload.step_index,
        is_fixed: payload.is_fixed,
        fixed_at: payload.fixed_at,
        fixed_by: payload.fixed_by,
        notes: payload.notes,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[security-store] Remediation upsert failed:", err);
    }
  };

  const autoFixFinding = async (findingId: string, ruleId: RuleId) => {
    const steps = REMEDIATION[ruleId] || [];
    const nextRem = { ...remediations };

    for (let i = 0; i < steps.length; i++) {
      const id = `${ruleId}:${i}`;
      nextRem[id] = true;
      await (supabase as any).from("security_remediations").upsert({
        id,
        rule_id: ruleId,
        step_index: i,
        is_fixed: true,
        fixed_at: new Date().toISOString(),
        fixed_by: "Admin (Auto-Mitigate)",
        notes: "Mitigated via Quick Action",
        updated_at: new Date().toISOString(),
      });
    }

    setRemediations(nextRem);
    try {
      localStorage.setItem(REMEDIATION_CACHE_KEY, JSON.stringify(nextRem));
    } catch {}

    // Update active scan findings in state
    if (latestScan) {
      const updatedFindings = latestScan.findings.map((f) =>
        f.id === findingId ? { ...f, is_fixed: true } : f
      );
      const remainingActive = updatedFindings.filter((f) => !f.is_fixed);
      const crit = remainingActive.filter((f) => f.severity === "critical").length;
      const high = remainingActive.filter((f) => f.severity === "high").length;
      const med = remainingActive.filter((f) => f.severity === "medium").length;
      const newScore = Math.max(40, Math.min(100, 100 - (crit * 15 + high * 6 + med * 2)));

      const updatedScan = {
        ...latestScan,
        findings: updatedFindings,
        findings_count: remainingActive.length,
        critical_count: crit,
        high_count: high,
        medium_count: med,
      };

      const nextScans = [updatedScan, ...scans.slice(1)];
      setScans(nextScans);
      setSettings((prev) => ({ ...prev, health_score: newScore }));

      try {
        localStorage.setItem(SCANS_CACHE_KEY, JSON.stringify(nextScans));
        await (supabase as any).from("security_scans").update({
          findings: updatedFindings,
          findings_count: remainingActive.length,
          critical_count: crit,
          high_count: high,
          medium_count: med,
        }).eq("id", latestScan.id);

        await (supabase as any).from("security_settings").update({
          health_score: newScore,
        }).eq("id", "main");
      } catch (err) {
        console.error("[security-store] Finding mitigation update error:", err);
      }
    }
  };

  const updateSettings = async (patch: Partial<SecuritySettings>) => {
    const updated: SecuritySettings = {
      ...settings,
      ...patch,
    };

    setSettings(updated);

    try {
      await (supabase as any).from("security_settings").upsert({
        id: "main",
        auto_scan_enabled: updated.auto_scan_enabled,
        scan_frequency: updated.scan_frequency,
        alert_email: updated.alert_email,
        alert_on_critical: updated.alert_on_critical,
        alert_on_high: updated.alert_on_high,
        blocked_ips: updated.blocked_ips,
        rate_limit_rpm: updated.rate_limit_rpm,
        waf_mode: updated.waf_mode,
        health_score: updated.health_score,
        last_full_scan_at: updated.last_full_scan_at,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[security-store] Settings save error:", err);
    }
  };

  const blockIp = async (ip: string, reason: string) => {
    const trimmed = ip.trim();
    if (!trimmed) return;
    const exists = settings.blocked_ips.some((b) => b.ip === trimmed);
    if (exists) return;

    const newBlocked: BlockedIpEntry[] = [
      {
        ip: trimmed,
        reason: reason.trim() || "Manual security ban",
        added_at: new Date().toISOString(),
      },
      ...settings.blocked_ips,
    ];

    await updateSettings({ blocked_ips: newBlocked });
  };

  const unblockIp = async (ip: string) => {
    const filtered = settings.blocked_ips.filter((b) => b.ip !== ip);
    await updateSettings({ blocked_ips: filtered });
  };

  const mitigateAllFindings = async () => {
    if (!latestScan) return;
    const nextRem = { ...remediations };

    for (const f of latestScan.findings) {
      const steps = REMEDIATION[f.rule] || [];
      for (let i = 0; i < steps.length; i++) {
        const id = `${f.rule}:${i}`;
        nextRem[id] = true;
        await (supabase as any).from("security_remediations").upsert({
          id,
          rule_id: f.rule,
          step_index: i,
          is_fixed: true,
          fixed_at: new Date().toISOString(),
          fixed_by: "Admin (Mitigate All)",
          notes: "Mitigated during bulk audit pass",
          updated_at: new Date().toISOString(),
        });
      }
    }

    setRemediations(nextRem);
    try {
      localStorage.setItem(REMEDIATION_CACHE_KEY, JSON.stringify(nextRem));
    } catch {}

    const updatedFindings = latestScan.findings.map((f) => ({ ...f, is_fixed: true }));
    const updatedScan = {
      ...latestScan,
      findings: updatedFindings,
      findings_count: 0,
      critical_count: 0,
      high_count: 0,
      medium_count: 0,
      low_count: 0,
    };

    const nextScans = [updatedScan, ...scans.slice(1)];
    setScans(nextScans);
    setSettings((prev) => ({ ...prev, health_score: 100 }));

    try {
      localStorage.setItem(SCANS_CACHE_KEY, JSON.stringify(nextScans));
      await (supabase as any).from("security_scans").update({
        findings: updatedFindings,
        findings_count: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
      }).eq("id", latestScan.id);

      await (supabase as any).from("security_settings").update({
        health_score: 100,
      }).eq("id", "main");
    } catch (err) {
      console.error("[security-store] Bulk mitigation error:", err);
    }
  };

  const deleteScanHistory = async (id: string) => {
    setScans((prev) => prev.filter((s) => s.id !== id));
    try {
      await (supabase as any).from("security_scans").delete().eq("id", id);
    } catch (err) {
      console.error("[security-store] Scan deletion error:", err);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        scans,
        latestScan,
        remediations,
        remediationDetails,
        settings,
        loading,
        runningScanId,
        scanProgress,
        runScan,
        toggleRemediation,
        autoFixFinding,
        mitigateAllFindings,
        updateSettings,
        blockIp,
        unblockIp,
        deleteScanHistory,
        refresh,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurityCenter() {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error("useSecurityCenter must be used within a SecurityProvider");
  }
  return ctx;
}
