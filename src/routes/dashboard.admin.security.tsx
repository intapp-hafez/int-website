import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, ShieldHalf, Play, Loader2, CheckCircle2, Clock, AlertTriangle, FileSearch, Lock, KeyRound, Eye, Globe, Network, Bug, Database, Box, Server, Webhook, Fingerprint } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/security")({
  head: () => ({ meta: [{ title: "Security Center — Admin" }] }),
  component: SecurityCenter,
});

type Severity = "critical" | "high" | "medium" | "low" | "info";
type TemplateId =
  | "baseline" | "authenticated" | "owasp"
  | "network" | "xss-deep" | "sqli-deep" | "blackbox" | "api" | "business-logic";

type RuleId =
  | "tls" | "headers" | "csp" | "cors" | "cookies" | "rls" | "auth-brute"
  | "session" | "xss" | "sqli" | "broken-access" | "crypto" | "ssrf"
  | "logging" | "deps" | "secrets" | "rate-limit"
  // network
  | "open-ports" | "dns" | "mixed-content" | "subdomain-takeover" | "ip-leak" | "waf"
  // xss variants
  | "xss-reflected" | "xss-stored" | "xss-dom" | "dangerously-set-html" | "trusted-types"
  // sqli variants
  | "sqli-error" | "sqli-blind" | "sqli-time" | "nosql-injection" | "orm-bypass" | "param-binding"
  // black-box / fuzz
  | "fuzz-endpoints" | "param-tampering" | "hidden-routes" | "verb-tampering" | "path-traversal" | "idor"
  // api & misc logic
  | "mass-assignment" | "graphql-introspection" | "jwt-weak" | "webhook-sig" | "race-condition"
  | "price-tampering" | "coupon-replay" | "workflow-skip" | "mfa-bypass" | "captcha-missing"
  | "file-upload" | "open-redirect" | "csrf";

type Finding = {
  id: string;
  rule: RuleId;
  title_en: string; title_ar: string;
  severity: Severity;
  page: string;
  evidence_en: string; evidence_ar: string;
};

type Template = {
  id: TemplateId;
  name_en: string; name_ar: string;
  desc_en: string; desc_ar: string;
  icon: any;
  rules: RuleId[];
  estMinutes: number;
};

const TEMPLATES: Template[] = [
  {
    id: "baseline", icon: ShieldCheck,
    name_en: "Baseline Scan", name_ar: "فحص أساسي",
    desc_en: "Unauthenticated surface scan covering TLS, headers, cookies, and public endpoints.",
    desc_ar: "فحص للسطح العام يشمل TLS والترويسات والكوكيز والنقاط المتاحة للزوار.",
    rules: ["tls", "headers", "csp", "cors", "cookies", "deps"],
    estMinutes: 3,
  },
  {
    id: "authenticated", icon: KeyRound,
    name_en: "Authenticated Scan", name_ar: "فحص بعد تسجيل الدخول",
    desc_en: "Logs in as a test user to evaluate RLS, session handling, and access controls.",
    desc_ar: "يسجل الدخول كمستخدم اختبار لفحص صلاحيات RLS والجلسات والتحكم بالوصول.",
    rules: ["rls", "auth-brute", "session", "broken-access", "logging", "rate-limit"],
    estMinutes: 6,
  },
  {
    id: "owasp", icon: ShieldAlert,
    name_en: "OWASP Top 10", name_ar: "OWASP العشرة الأوائل",
    desc_en: "Full coverage of the OWASP Top 10 (2021) — injections, crypto, SSRF, and more.",
    desc_ar: "تغطية شاملة لقائمة OWASP العشرة (2021) — حقن البيانات والتشفير وSSRF وغيرها.",
    rules: ["broken-access", "crypto", "sqli", "xss", "ssrf", "logging", "deps", "secrets", "auth-brute", "rls"],
    estMinutes: 10,
  },
  {
    id: "network", icon: Network,
    name_en: "Network Scan", name_ar: "فحص الشبكة",
    desc_en: "Probes open ports, DNS hygiene, WAF rules, mixed content, and subdomain takeovers.",
    desc_ar: "يفحص المنافذ المفتوحة وسجلات DNS وWAF والمحتوى المختلط واستيلاء النطاقات الفرعية.",
    rules: ["open-ports", "dns", "waf", "mixed-content", "subdomain-takeover", "ip-leak", "tls"],
    estMinutes: 5,
  },
  {
    id: "xss-deep", icon: Bug,
    name_en: "XSS Deep Scan", name_ar: "فحص XSS متعمق",
    desc_en: "Targets reflected, stored, and DOM XSS plus risky innerHTML usage and Trusted Types.",
    desc_ar: "يستهدف XSS المنعكس والمخزّن وDOM واستخدام innerHTML الخطر وTrusted Types.",
    rules: ["xss-reflected", "xss-stored", "xss-dom", "dangerously-set-html", "trusted-types", "csp"],
    estMinutes: 7,
  },
  {
    id: "sqli-deep", icon: Database,
    name_en: "SQL Injection Suite", name_ar: "مجموعة فحص حقن SQL",
    desc_en: "Tests error-based, blind, time-based, NoSQL, and ORM-bypass injections.",
    desc_ar: "اختبار الحقن المعتمد على الأخطاء والأعمى والزمني وNoSQL وتجاوز ORM.",
    rules: ["sqli-error", "sqli-blind", "sqli-time", "nosql-injection", "orm-bypass", "param-binding"],
    estMinutes: 8,
  },
  {
    id: "blackbox", icon: Box,
    name_en: "Black-box Fuzz", name_ar: "فحص الصندوق الأسود",
    desc_en: "No prior knowledge — fuzzes endpoints, parameters, verbs, hidden routes, IDOR and path traversal.",
    desc_ar: "بدون معرفة مسبقة — يفحص النقاط والمعاملات والأفعال والمسارات المخفية وIDOR وعبور المسارات.",
    rules: ["fuzz-endpoints", "param-tampering", "verb-tampering", "hidden-routes", "path-traversal", "idor", "open-redirect"],
    estMinutes: 9,
  },
  {
    id: "api", icon: Server,
    name_en: "API Security", name_ar: "أمان واجهات API",
    desc_en: "Checks JWT strength, mass assignment, webhook signatures, GraphQL introspection and rate limits.",
    desc_ar: "يفحص قوة JWT والإسناد الجماعي وتوقيعات الويب هوك وكشف GraphQL وحدود المعدل.",
    rules: ["jwt-weak", "mass-assignment", "webhook-sig", "graphql-introspection", "rate-limit", "cors"],
    estMinutes: 6,
  },
  {
    id: "business-logic", icon: Fingerprint,
    name_en: "Business Logic", name_ar: "منطق الأعمال",
    desc_en: "Looks for race conditions, price tampering, coupon replay, workflow skips and MFA/CAPTCHA bypass.",
    desc_ar: "يبحث عن سباقات التنفيذ والتلاعب بالأسعار وإعادة الكوبونات وتخطي خطوات سير العمل وتجاوز MFA/CAPTCHA.",
    rules: ["race-condition", "price-tampering", "coupon-replay", "workflow-skip", "mfa-bypass", "captcha-missing", "file-upload", "csrf"],
    estMinutes: 8,
  },
];

const RULE_META: Record<RuleId, { en: string; ar: string; severity: Severity; page: string }> = {
  tls: { en: "TLS configuration", ar: "إعدادات TLS", severity: "medium", page: "/" },
  headers: { en: "Security headers", ar: "ترويسات الأمان", severity: "medium", page: "/" },
  csp: { en: "Content Security Policy", ar: "سياسة محتوى الموقع (CSP)", severity: "high", page: "/" },
  cors: { en: "CORS policy", ar: "سياسة CORS", severity: "medium", page: "/api/*" },
  cookies: { en: "Cookie flags", ar: "علامات الكوكيز", severity: "low", page: "/auth" },
  rls: { en: "Row Level Security", ar: "أمان مستوى الصف (RLS)", severity: "critical", page: "/dashboard/*" },
  "auth-brute": { en: "Auth brute force protection", ar: "حماية تسجيل الدخول من التخمين", severity: "high", page: "/signin" },
  session: { en: "Session management", ar: "إدارة الجلسات", severity: "high", page: "/dashboard" },
  xss: { en: "Cross-site scripting (XSS)", ar: "ثغرات XSS", severity: "high", page: "/contact" },
  sqli: { en: "SQL injection", ar: "حقن SQL", severity: "critical", page: "/api/*" },
  "broken-access": { en: "Broken access control", ar: "كسر التحكم بالوصول", severity: "critical", page: "/dashboard/admin/*" },
  crypto: { en: "Cryptographic failures", ar: "أخطاء التشفير", severity: "high", page: "global" },
  ssrf: { en: "Server-side request forgery", ar: "تزوير طلبات الخادم (SSRF)", severity: "medium", page: "/api/*" },
  logging: { en: "Security logging & monitoring", ar: "السجلات والمراقبة الأمنية", severity: "low", page: "global" },
  deps: { en: "Vulnerable dependencies", ar: "حزم بثغرات معروفة", severity: "high", page: "package.json" },
  secrets: { en: "Exposed secrets", ar: "تسريب المفاتيح", severity: "critical", page: "repo" },
  "rate-limit": { en: "Rate limiting", ar: "تحديد المعدل", severity: "medium", page: "/api/*" },
  // network
  "open-ports": { en: "Open network ports", ar: "منافذ شبكة مفتوحة", severity: "high", page: "host" },
  dns: { en: "DNS hygiene (SPF/DMARC/CAA)", ar: "صحة DNS (SPF/DMARC/CAA)", severity: "medium", page: "dns" },
  "mixed-content": { en: "Mixed HTTP content", ar: "محتوى مختلط HTTP", severity: "medium", page: "/" },
  "subdomain-takeover": { en: "Subdomain takeover risk", ar: "خطر استيلاء النطاقات الفرعية", severity: "high", page: "*.domain" },
  "ip-leak": { en: "Origin IP leak", ar: "تسريب عنوان IP الأصلي", severity: "medium", page: "edge" },
  waf: { en: "WAF / edge filtering", ar: "جدار حماية التطبيق WAF", severity: "medium", page: "edge" },
  // xss variants
  "xss-reflected": { en: "Reflected XSS", ar: "XSS منعكس", severity: "high", page: "/?q=*" },
  "xss-stored": { en: "Stored XSS", ar: "XSS مخزّن", severity: "critical", page: "/dashboard/admin/reviews" },
  "xss-dom": { en: "DOM-based XSS", ar: "XSS من نوع DOM", severity: "high", page: "client routes" },
  "dangerously-set-html": { en: "Unsafe innerHTML usage", ar: "استخدام innerHTML الخطر", severity: "high", page: "components" },
  "trusted-types": { en: "Trusted Types policy", ar: "سياسة Trusted Types", severity: "low", page: "global" },
  // sqli variants
  "sqli-error": { en: "Error-based SQL injection", ar: "حقن SQL عبر الأخطاء", severity: "critical", page: "/api/*" },
  "sqli-blind": { en: "Blind boolean SQL injection", ar: "حقن SQL أعمى منطقي", severity: "critical", page: "/api/*" },
  "sqli-time": { en: "Time-based SQL injection", ar: "حقن SQL زمني", severity: "high", page: "/api/*" },
  "nosql-injection": { en: "NoSQL injection", ar: "حقن NoSQL", severity: "high", page: "/api/*" },
  "orm-bypass": { en: "ORM filter bypass", ar: "تجاوز فلترة ORM", severity: "high", page: "server fns" },
  "param-binding": { en: "Parameter binding hygiene", ar: "ربط المعاملات بأمان", severity: "medium", page: "server fns" },
  // black-box
  "fuzz-endpoints": { en: "Endpoint fuzzing", ar: "فحص النقاط بالتخمين", severity: "medium", page: "/api/*" },
  "param-tampering": { en: "Parameter tampering", ar: "العبث بالمعاملات", severity: "high", page: "/api/*" },
  "hidden-routes": { en: "Hidden / debug routes exposed", ar: "كشف مسارات مخفية أو تصحيح", severity: "high", page: "/_debug/*" },
  "verb-tampering": { en: "HTTP verb tampering", ar: "العبث بأفعال HTTP", severity: "medium", page: "/api/*" },
  "path-traversal": { en: "Path traversal", ar: "عبور المسارات", severity: "high", page: "/api/files/*" },
  idor: { en: "Insecure direct object reference (IDOR)", ar: "مرجعية كائنات غير آمنة (IDOR)", severity: "critical", page: "/api/*/$id" },
  // api / misc
  "mass-assignment": { en: "Mass assignment", ar: "الإسناد الجماعي", severity: "high", page: "/api/*" },
  "graphql-introspection": { en: "GraphQL introspection enabled", ar: "تفعيل استكشاف GraphQL", severity: "low", page: "/graphql" },
  "jwt-weak": { en: "Weak JWT signing", ar: "توقيع JWT ضعيف", severity: "critical", page: "auth" },
  "webhook-sig": { en: "Unverified webhook signatures", ar: "توقيعات ويب هوك غير مُتحققة", severity: "high", page: "/api/public/webhook" },
  "race-condition": { en: "Race condition", ar: "سباق التنفيذ", severity: "high", page: "checkout" },
  "price-tampering": { en: "Price / total tampering", ar: "التلاعب بالأسعار", severity: "critical", page: "/cart" },
  "coupon-replay": { en: "Coupon / discount replay", ar: "إعادة استخدام الكوبونات", severity: "medium", page: "/cart" },
  "workflow-skip": { en: "Workflow step skipping", ar: "تخطي خطوات سير العمل", severity: "high", page: "checkout" },
  "mfa-bypass": { en: "MFA bypass paths", ar: "مسارات تجاوز MFA", severity: "critical", page: "/signin" },
  "captcha-missing": { en: "Missing CAPTCHA on sensitive forms", ar: "غياب CAPTCHA على نماذج حساسة", severity: "medium", page: "/contact" },
  "file-upload": { en: "File upload validation", ar: "التحقق من رفع الملفات", severity: "high", page: "uploads" },
  "open-redirect": { en: "Open redirect", ar: "إعادة توجيه مفتوحة", severity: "medium", page: "/?redirect=*" },
  csrf: { en: "CSRF protection", ar: "حماية CSRF", severity: "high", page: "forms" },
};

const REMEDIATION: Record<RuleId, { en: string; ar: string }[]> = {
  tls: [
    { en: "Force HTTPS via HSTS header (max-age ≥ 31536000).", ar: "فرض HTTPS عبر ترويسة HSTS (max-age ≥ 31536000)." },
    { en: "Disable TLS 1.0 / 1.1 on the edge.", ar: "تعطيل TLS 1.0 و 1.1 من إعدادات الحافة." },
    { en: "Rotate certificates before expiry.", ar: "تجديد الشهادات قبل انتهائها." },
  ],
  headers: [
    { en: "Add X-Content-Type-Options: nosniff.", ar: "إضافة X-Content-Type-Options: nosniff." },
    { en: "Add Referrer-Policy: strict-origin-when-cross-origin.", ar: "إضافة Referrer-Policy: strict-origin-when-cross-origin." },
    { en: "Add X-Frame-Options: DENY (or CSP frame-ancestors).", ar: "إضافة X-Frame-Options: DENY أو frame-ancestors في CSP." },
  ],
  csp: [
    { en: "Define default-src 'self'.", ar: "تحديد default-src 'self'." },
    { en: "Eliminate 'unsafe-inline' on script-src.", ar: "إلغاء 'unsafe-inline' من script-src." },
    { en: "Report violations via report-to endpoint.", ar: "تفعيل تقارير CSP عبر report-to." },
  ],
  cors: [
    { en: "Allow only trusted origins, never '*' with credentials.", ar: "السماح فقط للمصادر الموثوقة، وعدم الجمع بين '*' والبيانات." },
    { en: "Restrict allowed methods/headers to what is required.", ar: "تقييد الطرق والترويسات المسموحة لما يلزم فقط." },
  ],
  cookies: [
    { en: "Set Secure, HttpOnly, SameSite=Lax on session cookies.", ar: "ضبط Secure و HttpOnly و SameSite=Lax على كوكيز الجلسة." },
    { en: "Avoid storing tokens in localStorage.", ar: "تجنّب تخزين التوكنات في localStorage." },
  ],
  rls: [
    { en: "Enable RLS on every public-schema table.", ar: "تفعيل RLS على كل الجداول العامة." },
    { en: "Write policies scoped to auth.uid().", ar: "كتابة سياسات مرتبطة بـ auth.uid()." },
    { en: "Test policies with both anon and authenticated roles.", ar: "اختبار السياسات بدور anon و authenticated." },
  ],
  "auth-brute": [
    { en: "Throttle failed sign-in attempts per IP and per account.", ar: "تحديد محاولات تسجيل الدخول الفاشلة لكل عنوان وحساب." },
    { en: "Enable CAPTCHA after N failures.", ar: "تفعيل CAPTCHA بعد عدد محاولات فاشلة." },
    { en: "Enable leaked-password (HIBP) check.", ar: "تفعيل فحص كلمات السر المسربة (HIBP)." },
  ],
  session: [
    { en: "Rotate refresh tokens on use.", ar: "تدوير توكنات التحديث عند الاستخدام." },
    { en: "Expire idle sessions within 24h.", ar: "إنهاء الجلسات الخاملة خلال 24 ساعة." },
    { en: "Invalidate sessions on password change.", ar: "إبطال الجلسات عند تغيير كلمة المرور." },
  ],
  xss: [
    { en: "Escape user content; never use dangerouslySetInnerHTML on input.", ar: "تهريب محتوى المستخدم وعدم استعمال dangerouslySetInnerHTML." },
    { en: "Add a strict CSP as defense in depth.", ar: "إضافة CSP صارمة كطبقة دفاع إضافية." },
  ],
  sqli: [
    { en: "Always use parameterized queries / ORM bindings.", ar: "استخدام استعلامات مع متغيرات معلَّمة دائمًا." },
    { en: "Validate input shape with Zod before queries.", ar: "التحقق من شكل المدخلات بـ Zod قبل الاستعلام." },
  ],
  "broken-access": [
    { en: "Verify role + ownership on every server function.", ar: "التحقق من الدور والملكية في كل دالة خادم." },
    { en: "Deny by default; allow only explicit cases.", ar: "المنع افتراضيًا والسماح بالحالات الصريحة فقط." },
  ],
  crypto: [
    { en: "Use AES-GCM or libsodium for symmetric crypto.", ar: "استخدام AES-GCM أو libsodium للتشفير المتماثل." },
    { en: "Hash passwords with bcrypt/argon2 (cost ≥ 12).", ar: "تشفير كلمات السر بـ bcrypt/argon2 (cost ≥ 12)." },
  ],
  ssrf: [
    { en: "Allowlist outbound URLs from server functions.", ar: "السماح فقط لقائمة محددة من العناوين الخارجية." },
    { en: "Block requests to private IP ranges.", ar: "منع الطلبات إلى نطاقات IP الخاصة." },
  ],
  logging: [
    { en: "Log authentication and admin actions with actor + IP.", ar: "تسجيل المصادقة وأفعال الإدارة مع المستخدم وعنوان IP." },
    { en: "Ship logs to an immutable sink with 90-day retention.", ar: "نقل السجلات إلى مخزن غير قابل للتعديل لمدة 90 يومًا." },
  ],
  deps: [
    { en: "Run dependency audit weekly.", ar: "تشغيل فحص الاعتماديات أسبوعيًا." },
    { en: "Upgrade packages with known CVEs.", ar: "تحديث الحزم التي بها ثغرات معروفة." },
  ],
  secrets: [
    { en: "Move secrets out of code into the secrets manager.", ar: "نقل المفاتيح من الكود إلى مدير الأسرار." },
    { en: "Rotate any secret that ever touched the repo.", ar: "تدوير أي مفتاح ظهر في المستودع." },
  ],
  "rate-limit": [
    { en: "Apply per-IP and per-account limits on sensitive endpoints.", ar: "تطبيق حدود لكل IP وكل حساب على النقاط الحساسة." },
    { en: "Return 429 with Retry-After header.", ar: "إرجاع 429 مع ترويسة Retry-After." },
  ],
  // network
  "open-ports": [
    { en: "Close all non-essential ports at the firewall.", ar: "إغلاق كل المنافذ غير الضرورية من جدار الحماية." },
    { en: "Restrict admin ports (SSH/DB) to bastion IPs.", ar: "تقييد منافذ الإدارة (SSH/DB) لعناوين موثوقة فقط." },
  ],
  dns: [
    { en: "Publish SPF, DKIM, DMARC records.", ar: "نشر سجلات SPF و DKIM و DMARC." },
    { en: "Add CAA records for allowed CAs.", ar: "إضافة سجلات CAA لمراجع التصديق المسموحة." },
  ],
  "mixed-content": [
    { en: "Rewrite all asset URLs to HTTPS.", ar: "تحويل كل عناوين الموارد إلى HTTPS." },
    { en: "Add upgrade-insecure-requests in CSP.", ar: "إضافة upgrade-insecure-requests إلى CSP." },
  ],
  "subdomain-takeover": [
    { en: "Remove dangling DNS records pointing to deprovisioned services.", ar: "حذف سجلات DNS المعلقة لخدمات ملغاة." },
    { en: "Monitor subdomains continuously.", ar: "مراقبة النطاقات الفرعية باستمرار." },
  ],
  "ip-leak": [
    { en: "Hide origin behind CDN / reverse proxy.", ar: "إخفاء الخادم الأصلي خلف CDN أو وكيل عكسي." },
    { en: "Block direct origin access by header secret.", ar: "منع الوصول المباشر للأصل عبر مفتاح في الترويسة." },
  ],
  waf: [
    { en: "Enable managed WAF ruleset.", ar: "تفعيل قواعد WAF المُدارة." },
    { en: "Enable bot mitigation for auth and checkout.", ar: "تفعيل صد البوتات على تسجيل الدخول والدفع." },
  ],
  // xss
  "xss-reflected": [
    { en: "Escape query parameters before rendering.", ar: "تهريب معاملات الاستعلام قبل العرض." },
    { en: "Validate input with strict schemas.", ar: "التحقق من المدخلات بمخططات صارمة." },
  ],
  "xss-stored": [
    { en: "Sanitize stored rich text with DOMPurify.", ar: "تنظيف النصوص المخزّنة عبر DOMPurify." },
    { en: "Render user HTML inside iframe sandbox if needed.", ar: "عرض HTML من المستخدم داخل iframe sandbox عند اللزوم." },
  ],
  "xss-dom": [
    { en: "Avoid writing user input to innerHTML / location / eval.", ar: "تجنّب كتابة مدخلات المستخدم في innerHTML أو location أو eval." },
    { en: "Audit client-side template sinks.", ar: "مراجعة نقاط القوالب على جانب العميل." },
  ],
  "dangerously-set-html": [
    { en: "Remove dangerouslySetInnerHTML where possible.", ar: "إزالة dangerouslySetInnerHTML قدر الإمكان." },
    { en: "Sanitize required HTML before rendering.", ar: "تنظيف HTML المطلوب قبل العرض." },
  ],
  "trusted-types": [
    { en: "Adopt Trusted Types CSP directive.", ar: "اعتماد توجيه Trusted Types في CSP." },
    { en: "Wrap DOM sinks with createPolicy().", ar: "تغليف نقاط DOM بـ createPolicy()." },
  ],
  // sqli
  "sqli-error": [
    { en: "Disable verbose DB errors in production.", ar: "تعطيل رسائل قاعدة البيانات التفصيلية في الإنتاج." },
    { en: "Use parameterized queries exclusively.", ar: "استخدام استعلامات مع متغيرات معلَّمة فقط." },
  ],
  "sqli-blind": [
    { en: "Centralize query building via ORM.", ar: "توحيد بناء الاستعلامات عبر ORM." },
    { en: "Add anomaly detection on long-running queries.", ar: "إضافة كشف للشاذ على الاستعلامات الطويلة." },
  ],
  "sqli-time": [
    { en: "Set query statement_timeout on the DB role.", ar: "ضبط statement_timeout على دور قاعدة البيانات." },
    { en: "Throttle endpoints that touch the DB by parameter.", ar: "تحديد معدل النقاط التي تستعلم بالمعاملات." },
  ],
  "nosql-injection": [
    { en: "Reject object-shaped query parameters.", ar: "رفض المعاملات ذات الشكل ككائنات." },
    { en: "Coerce inputs to expected primitive types.", ar: "تحويل المدخلات إلى الأنواع الأولية المتوقعة." },
  ],
  "orm-bypass": [
    { en: "Never concat raw SQL into ORM helpers.", ar: "لا تدمج SQL خام داخل دوال ORM." },
    { en: "Review .raw() / .unsafe() usages.", ar: "مراجعة استخدامات .raw() و .unsafe()." },
  ],
  "param-binding": [
    { en: "Bind every user value as a parameter, not string.", ar: "ربط كل قيمة مستخدم كمعامل، لا كنص." },
    { en: "Type-check parameters before binding.", ar: "التحقق من نوع المعاملات قبل ربطها." },
  ],
  // black-box
  "fuzz-endpoints": [
    { en: "Return generic 404 for unknown routes.", ar: "إرجاع 404 عامة للمسارات غير المعروفة." },
    { en: "Rate-limit and log fuzz patterns.", ar: "تحديد المعدل وتسجيل أنماط الفحص." },
  ],
  "param-tampering": [
    { en: "Validate every parameter server-side with Zod.", ar: "التحقق من كل معامل على الخادم بـ Zod." },
    { en: "Sign or HMAC critical parameters (order totals).", ar: "توقيع المعاملات الحرجة (إجمالي الطلب) بـ HMAC." },
  ],
  "hidden-routes": [
    { en: "Remove debug / staging routes from prod build.", ar: "إزالة مسارات التصحيح من بناء الإنتاج." },
    { en: "Protect admin routes behind RBAC.", ar: "حماية مسارات الإدارة عبر صلاحيات RBAC." },
  ],
  "verb-tampering": [
    { en: "Whitelist allowed HTTP methods per route.", ar: "تحديد أفعال HTTP المسموحة لكل مسار." },
    { en: "Return 405 for unsupported verbs.", ar: "إرجاع 405 للأفعال غير المدعومة." },
  ],
  "path-traversal": [
    { en: "Resolve and verify file paths stay inside base dir.", ar: "حلّ المسارات والتأكد من بقائها داخل المجلد الأساسي." },
    { en: "Reject filenames containing ../ or null bytes.", ar: "رفض أسماء الملفات التي تحوي ../ أو null bytes." },
  ],
  idor: [
    { en: "Check ownership on every record by id lookup.", ar: "التحقق من الملكية في كل استعلام بالمعرّف." },
    { en: "Use opaque IDs (UUID) instead of sequential ints.", ar: "استخدام معرّفات غير قابلة للتنبؤ (UUID) بدل الأرقام التسلسلية." },
  ],
  // api / misc
  "mass-assignment": [
    { en: "Whitelist updatable fields server-side.", ar: "تحديد قائمة الحقول القابلة للتعديل على الخادم." },
    { en: "Strip unknown keys from incoming payloads.", ar: "تجريد المفاتيح غير المعروفة من البيانات الواردة." },
  ],
  "graphql-introspection": [
    { en: "Disable introspection in production.", ar: "تعطيل الاستكشاف في الإنتاج." },
    { en: "Enforce per-query depth & complexity limits.", ar: "فرض حدود العمق والتعقيد لكل استعلام." },
  ],
  "jwt-weak": [
    { en: "Use asymmetric (RS256/EdDSA) signing.", ar: "استخدام توقيع غير متماثل (RS256/EdDSA)." },
    { en: "Reject 'none' alg and short keys.", ar: "رفض الخوارزمية 'none' والمفاتيح القصيرة." },
    { en: "Rotate signing keys periodically.", ar: "تدوير مفاتيح التوقيع دوريًا." },
  ],
  "webhook-sig": [
    { en: "Verify HMAC signature with timing-safe compare.", ar: "التحقق من HMAC بمقارنة آمنة زمنيًا." },
    { en: "Reject replays with timestamp + nonce window.", ar: "رفض الإعادة بفحص الوقت ورقم العملية." },
  ],
  "race-condition": [
    { en: "Use DB transactions / row locks on critical writes.", ar: "استخدام معاملات DB أو قفل الصفوف للكتابات الحرجة." },
    { en: "Make sensitive operations idempotent.", ar: "جعل العمليات الحساسة قابلة للتكرار الآمن (idempotent)." },
  ],
  "price-tampering": [
    { en: "Recompute totals server-side from product IDs.", ar: "إعادة حساب الإجمالي على الخادم من معرّفات المنتجات." },
    { en: "Never trust price / quantity from the client payload.", ar: "عدم الوثوق بالسعر والكمية من بيانات العميل." },
  ],
  "coupon-replay": [
    { en: "Mark coupons single-use per user / order.", ar: "جعل الكوبونات للاستخدام مرة واحدة لكل مستخدم/طلب." },
    { en: "Enforce expiry and usage cap server-side.", ar: "فرض الصلاحية وعدد الاستخدامات على الخادم." },
  ],
  "workflow-skip": [
    { en: "Enforce state machine on the server, not the client.", ar: "فرض ماكينة الحالات على الخادم لا العميل." },
    { en: "Reject transitions that skip required steps.", ar: "رفض الانتقالات التي تتخطى الخطوات المطلوبة." },
  ],
  "mfa-bypass": [
    { en: "Require MFA challenge before sensitive actions.", ar: "طلب تحدي MFA قبل العمليات الحساسة." },
    { en: "Invalidate MFA cookies after password change.", ar: "إبطال كوكيز MFA عند تغيير كلمة المرور." },
  ],
  "captcha-missing": [
    { en: "Add CAPTCHA on signup, sign-in retry, and contact form.", ar: "إضافة CAPTCHA على التسجيل وإعادة الدخول ونموذج التواصل." },
    { en: "Use invisible CAPTCHA where possible.", ar: "استخدام CAPTCHA غير مرئية حين يمكن." },
  ],
  "file-upload": [
    { en: "Validate MIME type and magic bytes server-side.", ar: "التحقق من نوع MIME والبصمة على الخادم." },
    { en: "Store uploads outside web root; scan for malware.", ar: "تخزين الملفات خارج جذر الموقع وفحصها." },
    { en: "Enforce size limits and per-user quotas.", ar: "فرض حدود الحجم وكوتا المستخدم." },
  ],
  "open-redirect": [
    { en: "Allowlist redirect destinations.", ar: "السماح فقط لقائمة وجهات إعادة توجيه محددة." },
    { en: "Reject absolute URLs in redirect parameters.", ar: "رفض الروابط المطلقة في معاملات إعادة التوجيه." },
  ],
  csrf: [
    { en: "Require SameSite=Lax cookies and CSRF tokens on state-changing forms.", ar: "اشتراط SameSite=Lax وتوكنات CSRF على النماذج المغيّرة للحالة." },
    { en: "Verify Origin / Referer headers on POST.", ar: "التحقق من ترويسة Origin أو Referer على POST." },
  ],
};

const SEV_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
const SEV_STYLES: Record<Severity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-yellow-400 text-foreground",
  info: "bg-muted text-muted-foreground",
};

const STORAGE_KEY = "it_security_center_v1";

type State = {
  lastScan?: { at: string; templateId: TemplateId; findings: Finding[] };
  fixed: Record<string, boolean>; // rule:stepIndex => fixed
};

function loadState(): State {
  if (typeof window === "undefined") return { fixed: {} };
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "") as State; } catch { return { fixed: {} }; }
}
function saveState(s: State) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function simulateScan(template: Template): Finding[] {
  // Deterministic-ish demo findings: each rule yields one finding 70% of the time.
  const out: Finding[] = [];
  template.rules.forEach((rule, i) => {
    const seed = (rule.length + template.id.length + i) % 10;
    if (seed < 7) {
      const meta = RULE_META[rule];
      out.push({
        id: `${template.id}-${rule}-${i}`,
        rule,
        title_en: meta.en,
        title_ar: meta.ar,
        severity: meta.severity,
        page: meta.page,
        evidence_en: `Detected on ${meta.page} during ${template.name_en}.`,
        evidence_ar: `تم اكتشافه على ${meta.page} خلال ${template.name_ar}.`,
      });
    }
  });
  return out.sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity]);
}

function SecurityCenter() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const [state, setState] = useState<State>({ fixed: {} });
  useEffect(() => { setState(loadState()); }, []);
  useEffect(() => { saveState(state); }, [state]);

  const [running, setRunning] = useState<TemplateId | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"templates" | "findings" | "remediation">("templates");
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");

  const findings = state.lastScan?.findings ?? [];
  const filteredFindings = useMemo(
    () => sevFilter === "all" ? findings : findings.filter((f) => f.severity === sevFilter),
    [findings, sevFilter],
  );

  const sevCounts = useMemo(() => {
    const c: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) c[f.severity]++;
    return c;
  }, [findings]);

  function runScan(template: Template) {
    setRunning(template.id);
    setProgress(0);
    const total = template.estMinutes * 8;
    let i = 0;
    const tick = setInterval(() => {
      i++;
      setProgress(Math.min(100, Math.round((i / total) * 100)));
      if (i >= total) {
        clearInterval(tick);
        const result = simulateScan(template);
        setState((s) => ({
          ...s,
          lastScan: { at: new Date().toISOString(), templateId: template.id, findings: result },
        }));
        setRunning(null);
        setProgress(0);
        setActiveTab("findings");
        toast.success(t(`Scan complete — ${result.length} finding(s)`, `اكتمل الفحص — ${result.length} نتيجة`));
      }
    }, 35);
  }

  function runFullRescan() {
    const merged: Finding[] = [];
    TEMPLATES.forEach((tmpl) => merged.push(...simulateScan(tmpl)));
    // de-dup by rule
    const byRule = new Map<RuleId, Finding>();
    for (const f of merged) if (!byRule.has(f.rule)) byRule.set(f.rule, f);
    const result = [...byRule.values()].sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity]);
    setState((s) => ({
      ...s,
      lastScan: { at: new Date().toISOString(), templateId: "owasp", findings: result },
    }));
    setActiveTab("findings");
    toast.success(t(`Full rescan complete — ${result.length} finding(s)`, `اكتمل الفحص الشامل — ${result.length} نتيجة`));
  }

  function toggleStep(key: string, val: boolean) {
    setState((s) => ({ ...s, fixed: { ...s.fixed, [key]: val } }));
  }

  // Rules to remediate = union of all rules from active findings
  const remediationRules = useMemo(() => {
    const set = new Set<RuleId>();
    for (const f of findings) set.add(f.rule);
    return [...set];
  }, [findings]);

  const totalSteps = remediationRules.reduce((n, r) => n + REMEDIATION[r].length, 0);
  const fixedSteps = remediationRules.reduce(
    (n, r) => n + REMEDIATION[r].filter((_, i) => state.fixed[`${r}:${i}`]).length,
    0,
  );
  const overallPct = totalSteps ? Math.round((fixedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <ShieldHalf className="h-6 w-6 text-accent" />
            {t("Security Center", "مركز الأمان")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {t(
              "Protect your system with scan templates, prioritized findings, and a guided remediation checklist.",
              "احمِ نظامك عبر قوالب الفحص ونتائج مرتبة حسب الأولوية وقائمة معالجة مرشدة.",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runFullRescan} disabled={!!running}>
            <Play className="h-4 w-4 me-2" /> {t("Run full rescan", "تشغيل فحص شامل")}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["critical", "high", "medium", "low", "info"] as Severity[]).map((sev) => (
          <Card key={sev} className="cursor-pointer hover:border-accent transition" onClick={() => { setSevFilter(sev); setActiveTab("findings"); }}>
            <CardContent className="p-4">
              <div className="text-xs uppercase text-muted-foreground">{t(sev, sev)}</div>
              <div className="text-2xl font-bold mt-1">{sevCounts[sev]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="templates">{t("Scan templates", "قوالب الفحص")}</TabsTrigger>
          <TabsTrigger value="findings">
            {t("Findings", "النتائج")} {findings.length > 0 && <Badge variant="secondary" className="ms-2">{findings.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="remediation">{t("Remediation", "المعالجة")}</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              const isRunning = running === tmpl.id;
              return (
                <Card key={tmpl.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-5 w-5 text-accent" />
                      {t(tmpl.name_en, tmpl.name_ar)}
                    </CardTitle>
                    <CardDescription>{t(tmpl.desc_en, tmpl.desc_ar)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {tmpl.rules.map((r) => (
                        <Badge key={r} variant="outline" className="text-xs">{t(RULE_META[r].en, RULE_META[r].ar)}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> ~{tmpl.estMinutes} {t("min", "د")}</span>
                      <span>{tmpl.rules.length} {t("rules", "قاعدة")}</span>
                    </div>
                    {isRunning && <Progress value={progress} />}
                    <Button className="w-full" disabled={!!running} onClick={() => runScan(tmpl)}>
                      {isRunning ? <><Loader2 className="h-4 w-4 me-2 animate-spin" /> {t("Scanning…", "جارٍ الفحص…")}</> : <><Play className="h-4 w-4 me-2" /> {t("Run scan", "تشغيل الفحص")}</>}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {state.lastScan ? (
                <span className="inline-flex items-center gap-2">
                  <FileSearch className="h-4 w-4" />
                  {t("Last scan", "آخر فحص")}: {new Date(state.lastScan.at).toLocaleString(isAr ? "ar" : "en")} ·{" "}
                  {t(TEMPLATES.find((x) => x.id === state.lastScan!.templateId)?.name_en ?? "", TEMPLATES.find((x) => x.id === state.lastScan!.templateId)?.name_ar ?? "")}
                </span>
              ) : t("No scan yet — run a template to view findings.", "لم يتم تشغيل أي فحص بعد.")}
            </div>
            <Select value={sevFilter} onValueChange={(v) => setSevFilter(v as any)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All severities", "كل المستويات")}</SelectItem>
                <SelectItem value="critical">{t("Critical", "حرجة")}</SelectItem>
                <SelectItem value="high">{t("High", "عالية")}</SelectItem>
                <SelectItem value="medium">{t("Medium", "متوسطة")}</SelectItem>
                <SelectItem value="low">{t("Low", "منخفضة")}</SelectItem>
                <SelectItem value="info">{t("Info", "معلومة")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Severity", "الخطورة")}</TableHead>
                    <TableHead>{t("Rule", "القاعدة")}</TableHead>
                    <TableHead>{t("Affected page", "الصفحة المتأثرة")}</TableHead>
                    <TableHead>{t("Evidence", "الدليل")}</TableHead>
                    <TableHead className="text-end">{t("Status", "الحالة")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFindings.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      {findings.length === 0 ? t("Run a scan to populate findings.", "شغّل فحصًا لعرض النتائج.") : t("No findings match the filter.", "لا توجد نتائج مطابقة للفلتر.")}
                    </TableCell></TableRow>
                  )}
                  {filteredFindings.map((f) => {
                    const steps = REMEDIATION[f.rule];
                    const done = steps.every((_, i) => state.fixed[`${f.rule}:${i}`]);
                    return (
                      <TableRow key={f.id}>
                        <TableCell><Badge className={SEV_STYLES[f.severity]}>{t(f.severity, f.severity)}</Badge></TableCell>
                        <TableCell className="font-medium">{t(f.title_en, f.title_ar)}</TableCell>
                        <TableCell><code className="text-xs">{f.page}</code></TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">{t(f.evidence_en, f.evidence_ar)}</TableCell>
                        <TableCell className="text-end">
                          {done
                            ? <Badge variant="outline" className="border-green-500 text-green-600"><CheckCircle2 className="h-3 w-3 me-1" /> {t("Fixed", "تم الإصلاح")}</Badge>
                            : <Badge variant="outline"><AlertTriangle className="h-3 w-3 me-1" /> {t("Pending", "قيد المعالجة")}</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remediation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Overall progress", "التقدم الكلي")}</CardTitle>
              <CardDescription>{fixedSteps} / {totalSteps} {t("steps fixed", "خطوة منجزة")} — {overallPct}%</CardDescription>
            </CardHeader>
            <CardContent><Progress value={overallPct} /></CardContent>
          </Card>

          {remediationRules.length === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("Run a scan to generate a remediation checklist.", "شغّل فحصًا لإنشاء قائمة المعالجة.")}
            </CardContent></Card>
          )}

          {remediationRules.map((rule) => {
            const meta = RULE_META[rule];
            const steps = REMEDIATION[rule];
            const doneCount = steps.filter((_, i) => state.fixed[`${rule}:${i}`]).length;
            const allDone = doneCount === steps.length;
            return (
              <Card key={rule}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lock className="h-4 w-4 text-accent" />
                      {t(meta.en, meta.ar)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={SEV_STYLES[meta.severity]}>{t(meta.severity, meta.severity)}</Badge>
                      {allDone
                        ? <Badge variant="outline" className="border-green-500 text-green-600">{t("Fixed", "تم الإصلاح")}</Badge>
                        : <Badge variant="outline">{doneCount}/{steps.length}</Badge>}
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-xs"><Globe className="h-3 w-3" /> {meta.page}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {steps.map((step, i) => {
                    const key = `${rule}:${i}`;
                    const checked = !!state.fixed[key];
                    return (
                      <label key={key} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={(v) => toggleStep(key, !!v)} className="mt-0.5" />
                        <span className={`text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>
                          {t(step.en, step.ar)}
                        </span>
                      </label>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}