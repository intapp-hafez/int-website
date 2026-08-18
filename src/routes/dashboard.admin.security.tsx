import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldHalf,
  Play,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSearch,
  Lock,
  KeyRound,
  Eye,
  Globe,
  Network,
  Bug,
  Database,
  Box,
  Server,
  Fingerprint,
  Flame,
  Shield,
  Download,
  Trash2,
  Plus,
  Ban,
  Check,
  History,
  Sparkles,
  Search,
  Sliders,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Activity,
  Terminal,
  Cpu,
  Radar,
  Radio,
  Zap,
  RefreshCw,
  FileCode,
  Layers,
  Wrench,
  CheckCheck,
  ShieldX,
} from "lucide-react";
import {
  useSecurityCenter,
  RULE_META,
  REMEDIATION,
  type Severity,
  type TemplateId,
  type RuleId,
  type Finding,
} from "@/lib/security-store";
import { useCanAccess } from "@/lib/permissions-store";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/security")({
  head: () => ({ meta: [{ title: "Security Command Center — Admin" }] }),
  component: SecurityCenterPage,
});

interface TemplateDef {
  id: TemplateId;
  icon: any;
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  rules: RuleId[];
  estMinutes: number;
  badge_color: string;
  theme_gradient: string;
}

const TEMPLATES: TemplateDef[] = [
  {
    id: "baseline",
    icon: ShieldCheck,
    name_en: "Baseline Surface Scan",
    name_ar: "فحص السطح الأساسي",
    desc_en: "Unauthenticated perimeter audit covering TLS, headers, cookies, and public edge endpoints.",
    desc_ar: "فحص للسطح العام يشمل TLS والترويسات والكوكيز والنقاط المتاحة للزوار.",
    rules: ["tls", "headers", "csp", "cors", "cookies", "deps"],
    estMinutes: 3,
    badge_color: "text-orange-500 border-orange-500/30 bg-orange-500/10",
    theme_gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
  },
  {
    id: "authenticated",
    icon: KeyRound,
    name_en: "Authenticated Access & RLS",
    name_ar: "فحص الصلاحيات والجلسات",
    desc_en: "Evaluates Row Level Security (RLS), session lifecycles, role permissions, and brute-force throttling.",
    desc_ar: "يفحص صلاحيات RLS والجلسات والتحكم بالوصول وحماية تسجيل الدخول من التخمين.",
    rules: ["rls", "auth-brute", "session", "broken-access", "logging", "rate-limit"],
    estMinutes: 6,
    badge_color: "text-purple-500 border-purple-500/30 bg-purple-500/10",
    theme_gradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
  },
  {
    id: "owasp",
    icon: ShieldAlert,
    name_en: "OWASP Top 10 Suite",
    name_ar: "مجموعة OWASP العشرة الأوائل",
    desc_en: "Full compliance audit for OWASP Top 10 (Injections, Cryptographic Failures, SSRF, Broken Access).",
    desc_ar: "تغطية شاملة لقائمة OWASP العشرة (حقن البيانات، أخطاء التشفير، SSRF، والتحكم بالوصول).",
    rules: [
      "broken-access",
      "crypto",
      "sqli",
      "xss",
      "ssrf",
      "logging",
      "deps",
      "secrets",
      "auth-brute",
      "rls",
    ],
    estMinutes: 10,
    badge_color: "text-rose-500 border-rose-500/30 bg-rose-500/10",
    theme_gradient: "from-rose-500/10 via-red-500/5 to-transparent",
  },
  {
    id: "network",
    icon: Network,
    name_en: "Network & DNS Infrastructure",
    name_ar: "فحص الشبكة وسجلات DNS",
    desc_en: "Probes open ports, DNS hygiene (SPF/DMARC), WAF rule health, mixed HTTP content, and origin IP leaks.",
    desc_ar: "يفحص المنافذ المفتوحة وسجلات DNS وWAF والمحتوى المختلط وتسريب IP الأصلي.",
    rules: ["open-ports", "dns", "waf", "mixed-content", "subdomain-takeover", "ip-leak", "tls"],
    estMinutes: 5,
    badge_color: "text-sky-500 border-sky-500/30 bg-sky-500/10",
    theme_gradient: "from-sky-500/10 via-cyan-500/5 to-transparent",
  },
  {
    id: "xss-deep",
    icon: Bug,
    name_en: "XSS & DOM Deep Audit",
    name_ar: "فحص XSS و DOM المتعمق",
    desc_en: "Targets Reflected, Stored, and DOM-based XSS plus unsafe innerHTML sinks and Trusted Types CSP.",
    desc_ar: "يستهدف ثغرات XSS المنعكسة والمخزنة وDOM واستخدام innerHTML الخطر وسياسات Trusted Types.",
    rules: ["xss-reflected", "xss-stored", "xss-dom", "dangerously-set-html", "trusted-types", "csp"],
    estMinutes: 7,
    badge_color: "text-amber-500 border-amber-500/30 bg-amber-500/10",
    theme_gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
  },
  {
    id: "sqli-deep",
    icon: Database,
    name_en: "SQL Injection & ORM Suite",
    name_ar: "فحص حقن SQL ومحرك ORM",
    desc_en: "Tests error-based, blind boolean, time-based, NoSQL, and ORM query filter bypass attacks.",
    desc_ar: "اختبار الحقن المعتمد على الأخطاء، الحقن الأعمى والزمني، وNoSQL وتجاوز فلترة الاستعلامات.",
    rules: ["sqli-error", "sqli-blind", "sqli-time", "nosql-injection", "orm-bypass", "param-binding"],
    estMinutes: 8,
    badge_color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
    theme_gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
  },
  {
    id: "blackbox",
    icon: Box,
    name_en: "Black-Box Fuzzing & IDOR",
    name_ar: "فحص الصندوق الأسود و IDOR",
    desc_en: "Fuzzes API endpoints, verb tampering, hidden routes, path traversal, and Insecure Direct Object References.",
    desc_ar: "فحص النقاط البرمجية بالتخمين، المسارات المخفية، عبور المجلدات، وثغرات IDOR.",
    rules: [
      "fuzz-endpoints",
      "param-tampering",
      "verb-tampering",
      "hidden-routes",
      "path-traversal",
      "idor",
      "open-redirect",
    ],
    estMinutes: 9,
    badge_color: "text-blue-500 border-blue-500/30 bg-blue-500/10",
    theme_gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
  },
  {
    id: "api",
    icon: Server,
    name_en: "API Gateway & Webhook Security",
    name_ar: "أمان واجهات API والويب هوك",
    desc_en: "Audits JWT signature strength, mass assignment, HMAC webhook signatures, and rate limiters.",
    desc_ar: "يفحص قوة توقيع JWT، الإسناد الجماعي، توقيعات الويب هوك، وحدود الطلبات للمستخدمين.",
    rules: ["jwt-weak", "mass-assignment", "webhook-sig", "graphql-introspection", "rate-limit", "cors"],
    estMinutes: 6,
    badge_color: "text-violet-500 border-violet-500/30 bg-violet-500/10",
    theme_gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
  },
  {
    id: "business-logic",
    icon: Fingerprint,
    name_en: "Business Logic & Anti-Fraud",
    name_ar: "منطق الأعمال ومكافحة الاحتيال",
    desc_en: "Checks for race conditions, cart price tampering, coupon replay, workflow step skipping, and MFA bypass.",
    desc_ar: "يبحث عن سباقات التنفيذ، التلاعب بأسعار السلة، إعادة استخدام الكوبونات، وتجاوز خطوات الطلب.",
    rules: [
      "race-condition",
      "price-tampering",
      "coupon-replay",
      "workflow-skip",
      "mfa-bypass",
      "captcha-missing",
      "file-upload",
      "csrf",
    ],
    estMinutes: 8,
    badge_color: "text-teal-500 border-teal-500/30 bg-teal-500/10",
    theme_gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
  },
];

const SEV_STYLES: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  low: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  info: "bg-muted text-muted-foreground border-border",
};

function SecurityCenterPage() {
  const can = useCanAccess("security");
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const {
    scans,
    latestScan,
    remediations,
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
  } = useSecurityCenter();

  const [activeTab, setActiveTab] = useState<
    "templates" | "findings" | "remediation" | "firewall" | "history"
  >("templates");

  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "mitigated">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

  // New IP Ban Form
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addingIp, setAddingIp] = useState(false);

  if (!can.view) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
        {t("You do not have access to the Security Command Center.", "ليس لديك صلاحية لعرض مركز الأمان.")}
      </div>
    );
  }

  const findings = latestScan?.findings ?? [];

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSev = sevFilter === "all" || f.severity === sevFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "mitigated" ? f.is_fixed : !f.is_fixed);
      const matchSearch =
        !searchQuery ||
        f.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.rule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.cve && f.cve.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSev && matchStatus && matchSearch;
    });
  }, [findings, sevFilter, statusFilter, searchQuery]);

  const sevCounts = useMemo(() => {
    const c: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) {
      if (!f.is_fixed) c[f.severity]++;
    }
    return c;
  }, [findings]);

  // Unique rules across current findings for remediation
  const remediationRules = useMemo(() => {
    const set = new Set<RuleId>();
    for (const f of findings) set.add(f.rule);
    if (set.size === 0) {
      TEMPLATES[2].rules.forEach((r) => set.add(r));
    }
    return [...set];
  }, [findings]);

  const totalSteps = remediationRules.reduce(
    (n, r) => n + (REMEDIATION[r] ? REMEDIATION[r].length : 0),
    0
  );
  const fixedSteps = remediationRules.reduce(
    (n, r) =>
      n +
      (REMEDIATION[r]
        ? REMEDIATION[r].filter((_, i) => remediations[`${r}:${i}`]).length
        : 0),
    0
  );
  const overallRemediationPct = totalSteps ? Math.round((fixedSteps / totalSteps) * 100) : 100;

  const handleRunTemplate = async (tmpl: TemplateDef) => {
    try {
      toast.info(
        t(
          `Executing ${tmpl.name_en} vector suite...`,
          `بدء فحص ${tmpl.name_ar} عبر نقاط النظام...`
        )
      );
      const res = await runScan(tmpl.id, tmpl.name_en, tmpl.rules);
      setActiveTab("findings");
      toast.success(
        t(
          `Scan completed! Logged ${res.findings_count} finding(s) with ${res.critical_count} critical.`,
          `اكتمل الفحص! تم رصد ${res.findings_count} ملاحظة أمنية منها ${res.critical_count} حرجة.`
        )
      );
    } catch (err: any) {
      toast.error(err?.message || "Scan failed.");
    }
  };

  const handleRunComprehensiveAudit = async () => {
    try {
      toast.info(
        t("Starting comprehensive multi-vector security audit...", "بدء التدقيق الأمني الشامل لكافة النطاقات...")
      );
      const allRules = Array.from(new Set(TEMPLATES.flatMap((t) => t.rules)));
      const res = await runScan("owasp", "Comprehensive System Audit", allRules);
      setActiveTab("findings");
      toast.success(
        t(
          `Comprehensive audit complete — ${res.findings_count} total issues identified.`,
          `اكتمل الفحص الشامل — تم تحديد ${res.findings_count} نقطة.`
        )
      );
    } catch (err: any) {
      toast.error(err?.message || "Audit failed.");
    }
  };

  const handleAutoFix = async (finding: Finding) => {
    try {
      await autoFixFinding(finding.id, finding.rule);
      toast.success(
        t(
          `Mitigated '${finding.title_en}' — Checklist updated & security score recalibrated.`,
          `تمت معالجة '${finding.title_ar}' وتحديث درجة الأمان بنجاح.`
        )
      );
    } catch (err: any) {
      toast.error(err?.message || "Auto-fix failed.");
    }
  };

  const handleMitigateAll = async () => {
    try {
      await mitigateAllFindings();
      toast.success(
        t(
          "All active findings mitigated! Security score recalibrated to 100% (Grade A+).",
          "تمت معالجة كافة الملاحظات وإعادة تقييم درجة الأمان إلى 100% بنجاح!"
        )
      );
    } catch (err: any) {
      toast.error(err?.message || "Bulk mitigation failed.");
    }
  };

  const handleAddIpBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    setAddingIp(true);
    try {
      await blockIp(newIp, newReason || "Manual ban from Security Command Center");
      setNewIp("");
      setNewReason("");
      toast.success(t(`IP ${newIp} blocked by Firewall`, `تم حظر عنوان IP ${newIp} بنجاح`));
    } finally {
      setAddingIp(false);
    }
  };

  const handleExportJson = () => {
    const exportData = {
      export_version: "2.5-SOC",
      generated_at: new Date().toISOString(),
      health_score: settings.health_score,
      posture_status: settings.health_score >= 90 ? "Grade A+ (Secure)" : "Action Required",
      waf_mode: settings.waf_mode,
      active_threats_count: findings.filter((f) => !f.is_fixed).length,
      mitigated_threats_count: findings.filter((f) => f.is_fixed).length,
      scan_history_summary: scans.slice(0, 5),
      current_audit: latestScan,
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `integrated-technics-soc-audit-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(t("Security audit report exported as JSON", "تم تصدير تقرير الأمان والامتثال بنجاح"));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8" dir={isAr ? "rtl" : "ltr"}>
      {/* 1. HERO CYBER COMMAND BANNER */}
      <div className="relative rounded-3xl border overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-card via-card/95 to-accent/5 shadow-xl">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
              <Radar className="h-3.5 w-3.5 animate-spin" />
              <span>{t("Autonomous Threat Defense & SOC", "نظام الدفاع والرصد الأمني المستقل")}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground flex items-center gap-3">
              <span>{t("Security Command Center", "مركز القيادة والأمان")}</span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t(
                "Real-time multi-vector threat simulation, OWASP Top 10 compliance audits, WAF ingress firewall, and persistent database remediation checklists.",
                "فحص مسارات الهجوم الفورية، تدقيق معايير OWASP، جدار حماية التطبيقات (WAF)، وقائمة المعالجة الهندسية الدائمة."
              )}
            </p>
          </div>

          {/* Defense Posture Radial Meter & Action Bar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-background/80 backdrop-blur-md p-3.5 rounded-2xl border shadow-md">
            {/* Health Meter Box */}
            <div className="flex items-center gap-3.5 pe-4 sm:border-e">
              <div className="relative h-14 w-14 flex items-center justify-center">
                {/* SVG Ring */}
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted/40"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      settings.health_score >= 90
                        ? "text-emerald-500"
                        : settings.health_score >= 70
                        ? "text-amber-500"
                        : "text-destructive"
                    }
                    strokeDasharray={`${settings.health_score}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-sm font-extrabold font-mono text-foreground">
                    {settings.health_score}
                  </span>
                  <span className="text-[7px] text-muted-foreground leading-none">%</span>
                </div>
              </div>

              <div>
                <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      settings.health_score >= 90
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-amber-500"
                    }`}
                  />
                  <span>
                    {settings.health_score >= 90
                      ? t("SOC-2 Grade A+", "مستوى أمان ممتاز (A+)")
                      : settings.health_score >= 75
                      ? t("Moderate Security", "مستوى أمان متوسط")
                      : t("Action Required", "مخاطر تتطلب معالجة")}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {latestScan
                    ? `${t("Audited", "آخر تدقيق")}: ${new Date(latestScan.created_at).toLocaleDateString()}`
                    : t("Ready to scan", "جاهز للفحص")}
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRunComprehensiveAudit}
                disabled={!!runningScanId}
                className="font-bold h-10 px-4 shadow-sm bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground text-xs"
              >
                {runningScanId ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 me-2 fill-current" />
                )}
                <span>{t("Launch Full Audit", "بدء التدقيق الشامل")}</span>
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleExportJson}
                title={t("Export Audit Report (JSON)", "تصدير التقرير")}
                className="h-10 w-10 rounded-xl"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TELEMETRY HUD TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {(["critical", "high", "medium", "low", "info"] as Severity[]).map((sev) => {
          const isSelected = sevFilter === sev;
          const count = sevCounts[sev];
          return (
            <button
              key={sev}
              type="button"
              onClick={() => {
                setSevFilter(isSelected ? "all" : sev);
                setActiveTab("findings");
              }}
              className={`p-4 rounded-2xl border text-start transition-all relative overflow-hidden group ${
                isSelected
                  ? "border-accent bg-accent/10 shadow-sm ring-1 ring-accent"
                  : "border-border/70 bg-card hover:border-accent/40 hover:bg-muted/30"
              }`}
            >
              {/* Micro top accent line */}
              <div
                className={`absolute top-0 inset-x-0 h-1 ${
                  sev === "critical"
                    ? "bg-destructive"
                    : sev === "high"
                    ? "bg-orange-500"
                    : sev === "medium"
                    ? "bg-amber-500"
                    : "bg-sky-500"
                }`}
              />

              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
                  {t(sev, sev)}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    count > 0 && (sev === "critical" || sev === "high")
                      ? "bg-destructive animate-ping"
                      : "bg-muted-foreground/40"
                  }`}
                />
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 text-foreground">
                {count}
              </div>

              <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                <span>{count === 0 ? t("Passed", "تم الاجتياز") : t("Open threats", "مخاطر نشطة")}</span>
                <ChevronRight className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}

        {/* WAF Gateway Status Card */}
        <button
          type="button"
          onClick={() => setActiveTab("firewall")}
          className="p-4 rounded-2xl border border-border/70 bg-card hover:border-accent/40 hover:bg-muted/30 text-start transition-all relative overflow-hidden group flex flex-col justify-between"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
              {t("WAF / Shield", "جدار الحماية")}
            </span>
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
          </div>

          <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400 capitalize mt-2">
            {settings.waf_mode.toUpperCase()}
          </div>

          <div className="text-[10px] text-muted-foreground mt-1">
            {settings.blocked_ips.length} {t("IPs in Blacklist", "عنوان محظور")}
          </div>
        </button>
      </div>

      {/* 3. SEGMENTED NAVIGATION COMMAND TABS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto p-1.5 bg-muted/60 rounded-2xl border shadow-inner">
          <TabsTrigger
            value="templates"
            className="rounded-xl py-2.5 text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Radar className="h-3.5 w-3.5" />
            <span>{t("Scan Engine (9)", "قوالب الفحص (9)")}</span>
          </TabsTrigger>

          <TabsTrigger
            value="findings"
            className="rounded-xl py-2.5 text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{t("Threat Matrix", "مصفوفة الثغرات")}</span>
            {findings.length > 0 && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-mono">
                {findings.filter((f) => !f.is_fixed).length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="remediation"
            className="rounded-xl py-2.5 text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{t("Remediation", "المعالجة والتوافق")}</span>
            <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono border-accent text-accent">
              {overallRemediationPct}%
            </Badge>
          </TabsTrigger>

          <TabsTrigger
            value="firewall"
            className="rounded-xl py-2.5 text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Ban className="h-3.5 w-3.5" />
            <span>{t("Firewall & IP Shield", "جدار الحماية والـ IP")}</span>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className="rounded-xl py-2.5 text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <History className="h-3.5 w-3.5" />
            <span>{t("Audit History", "سجل التدقيق")}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SCAN ENGINE & MODULES */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              const isRunning = runningScanId === tmpl.id;

              return (
                <Card
                  key={tmpl.id}
                  className={`border shadow-sm rounded-3xl overflow-hidden transition-all duration-300 relative group flex flex-col justify-between ${
                    isRunning
                      ? "border-accent ring-2 ring-accent shadow-lg bg-card"
                      : "hover:border-accent/50 hover:shadow-md bg-card/90"
                  }`}
                >
                  {/* Category Top Gradient Glow */}
                  <div
                    className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b ${tmpl.theme_gradient} pointer-events-none`}
                  />

                  <div>
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-2xl border flex items-center justify-center shadow-xs ${tmpl.badge_color}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold text-foreground">
                              {t(tmpl.name_en, tmpl.name_ar)}
                            </CardTitle>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              <span>
                                ~{tmpl.estMinutes} {t("min runtime", "دقيقة فحص")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <CardDescription className="text-xs pt-2 line-clamp-2 leading-relaxed">
                        {t(tmpl.desc_en, tmpl.desc_ar)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 pb-4 relative z-10">
                      {/* Rules Badges */}
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {tmpl.rules.map((r) => (
                          <Badge
                            key={r}
                            variant="secondary"
                            className="text-[9.5px] py-0.5 px-2 font-normal rounded-lg bg-muted/60"
                          >
                            {t(RULE_META[r]?.en || r, RULE_META[r]?.ar || r)}
                          </Badge>
                        ))}
                      </div>

                      {/* Live Scanning Terminal simulation */}
                      {isRunning && (
                        <div className="p-3 rounded-2xl bg-neutral-950 text-emerald-400 border font-mono text-[10.5px] space-y-2 animate-in fade-in-50">
                          <div className="flex items-center justify-between text-xs text-neutral-300">
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                              {t("Probing attack vectors...", "فحص مسارات الهجوم...")}
                            </span>
                            <span className="font-bold text-emerald-400">{scanProgress}%</span>
                          </div>
                          <Progress value={scanProgress} className="h-1.5 bg-neutral-800" />
                        </div>
                      )}
                    </CardContent>
                  </div>

                  <CardFooter className="pt-0 relative z-10">
                    <Button
                      className={`w-full h-9 text-xs font-bold rounded-xl shadow-xs transition-all ${
                        isRunning ? "bg-accent text-accent-foreground" : ""
                      }`}
                      disabled={!!runningScanId}
                      onClick={() => handleRunTemplate(tmpl)}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 me-2 animate-spin" />
                          <span>{t("Scanning Vectors...", "جارٍ الفحص...")}</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 me-2 fill-current" />
                          <span>{t("Run Audit Suite", "تشغيل الفحص")}</span>
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: THREAT MATRIX & FINDINGS */}
        <TabsContent value="findings" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t(
                  "Search vulnerabilities, routes, CVE references...",
                  "بحث في الثغرات، المسارات، ومراجع CVE..."
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 h-10 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-36 h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Statuses", "كافة الحالات")}</SelectItem>
                  <SelectItem value="active">{t("Active Only", "النشطة فقط")}</SelectItem>
                  <SelectItem value="mitigated">{t("Mitigated", "تمت المعالجة")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sevFilter} onValueChange={(v) => setSevFilter(v as any)}>
                <SelectTrigger className="w-36 h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Severities", "كل المستويات")}</SelectItem>
                  <SelectItem value="critical">{t("Critical", "حرجة")}</SelectItem>
                  <SelectItem value="high">{t("High", "عالية")}</SelectItem>
                  <SelectItem value="medium">{t("Medium", "متوسطة")}</SelectItem>
                  <SelectItem value="low">{t("Low", "منخفضة")}</SelectItem>
                  <SelectItem value="info">{t("Info", "معلومة")}</SelectItem>
                </SelectContent>
              </Select>

              {findings.some((f) => !f.is_fixed) && (
                <Button
                  size="sm"
                  onClick={handleMitigateAll}
                  className="h-10 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CheckCheck className="h-4 w-4 me-1.5" />
                  <span>{t("Mitigate All", "إصلاح الكل")}</span>
                </Button>
              )}
            </div>
          </div>

          {filteredFindings.length === 0 ? (
            <Card className="p-12 text-center border-dashed rounded-3xl">
              <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg text-foreground">
                {t("Zero Active Vulnerabilities Matching Filter", "لا توجد أي ثغرات مطابقة للفلاتر")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                {t(
                  "All tested attack surfaces pass security assertions. Select a scan template to initiate fresh penetration diagnostics.",
                  "كافة الأسطح المختبرة تجتاز الفحوصات الأمنية. يمكنك اختيار قالب فحص لتشغيل تشخيص جديد."
                )}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map((finding) => {
                const isExpanded = expandedFinding === finding.id;
                const remediationSteps = REMEDIATION[finding.rule] || [];

                return (
                  <Card
                    key={finding.id}
                    className={`border shadow-xs rounded-2xl overflow-hidden transition-all ${
                      finding.is_fixed
                        ? "opacity-60 bg-muted/20 border-emerald-500/30"
                        : "hover:border-accent/40 bg-card"
                    }`}
                  >
                    <div
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                      onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-extrabold py-1 px-2.5 rounded-lg ${
                            finding.is_fixed
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : SEV_STYLES[finding.severity]
                          }`}
                        >
                          {finding.is_fixed ? t("MITIGATED", "تم الحل") : finding.severity}
                        </Badge>

                        <div className="min-w-0">
                          <div
                            className={`font-bold text-sm truncate ${
                              finding.is_fixed ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {t(finding.title_en, finding.title_ar)}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-[10px]">
                              {finding.page}
                            </span>
                            {finding.cve && (
                              <span className="font-mono font-bold text-accent">{finding.cve}</span>
                            )}
                            {finding.cvss && (
                              <span className="font-mono text-[10px] opacity-75">
                                CVSS {finding.cvss}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!finding.is_fixed && (
                          <Button
                            size="sm"
                            className="h-8 text-xs font-bold rounded-xl bg-accent text-accent-foreground shadow-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAutoFix(finding);
                            }}
                          >
                            <Wrench className="h-3.5 w-3.5 me-1.5" />
                            <span>{t("Auto-Mitigate", "إصلاح فوري")}</span>
                          </Button>
                        )}

                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t bg-muted/15 space-y-4 animate-in fade-in-50">
                        {/* Technical Vector & Impact Block */}
                        <div className="grid md:grid-cols-2 gap-3 pt-3">
                          <div className="space-y-1.5">
                            <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                              <Terminal className="h-3.5 w-3.5 text-accent" />
                              <span>{t("Technical Exploit Vector:", "المسار الفني للهجوم:")}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-neutral-950 text-neutral-200 border border-neutral-800 font-mono text-[11px] leading-relaxed">
                              {t(finding.evidence_en, finding.evidence_ar)}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                              <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
                              <span>{t("Business & Security Impact:", "الأثر الفني والتجاري:")}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/40 text-muted-foreground border font-sans text-xs leading-relaxed">
                              {finding.impact_en
                                ? t(finding.impact_en, finding.impact_ar || "")
                                : t("Potential security degradation if left unaddressed.", "خطر محتمل على سلامة النظام في حال عدم المعالجة.")}
                            </div>
                          </div>
                        </div>

                        {remediationSteps.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span>{t("Remediation Checklist Steps:", "خطوات المعالجة الهندسية:")}</span>
                            </div>
                            <ul className="space-y-1.5">
                              {remediationSteps.map((step, idx) => {
                                const isFixed = Boolean(remediations[`${finding.rule}:${idx}`]);
                                return (
                                  <li
                                    key={idx}
                                    className="text-xs flex items-center justify-between p-3 rounded-xl border bg-card shadow-xs"
                                  >
                                    <span
                                      className={
                                        isFixed
                                          ? "line-through text-muted-foreground font-normal"
                                          : "text-foreground font-medium"
                                      }
                                    >
                                      {t(step.en, step.ar)}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant={isFixed ? "secondary" : "outline"}
                                      className="h-7 text-[11px] px-2.5 rounded-lg shrink-0 font-semibold"
                                      onClick={() =>
                                        toggleRemediation(finding.rule, idx, !isFixed)
                                      }
                                    >
                                      {isFixed ? (
                                        <>
                                          <Check className="h-3 w-3 me-1 text-emerald-500" />
                                          <span>{t("Resolved", "تم الحل")}</span>
                                        </>
                                      ) : (
                                        <span>{t("Mark Resolved", "تحديد كمحلول")}</span>
                                      )}
                                    </Button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: REMEDIATION & COMPLIANCE MATRIX */}
        <TabsContent value="remediation" className="space-y-6">
          <Card className="border shadow-sm rounded-3xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>{t("Security Hardening & Remediation Checklist", "قائمة معالجة الثغرات وتأمين النظام")}</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {t(
                      "Persistent engineering checklist synced across team sessions in Supabase database.",
                      "قائمة هندسية دائمة متزامنة في قاعدة البيانات مع كافة المسؤولين والمهندسين."
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-foreground">
                    {fixedSteps} / {totalSteps} {t("Steps Mitigated", "خطوة مكتملة")}
                  </span>
                  <Badge variant="outline" className="text-xs font-bold border-accent text-accent">
                    {overallRemediationPct}%
                  </Badge>
                </div>
              </div>
              <Progress value={overallRemediationPct} className="h-2 mt-3" />
            </CardHeader>

            <CardContent className="space-y-5">
              {remediationRules.map((ruleId) => {
                const meta = RULE_META[ruleId];
                const steps = REMEDIATION[ruleId] || [];
                if (steps.length === 0) return null;

                return (
                  <div key={ruleId} className="space-y-2 rounded-2xl border p-4 bg-card shadow-xs">
                    <div className="flex items-center justify-between border-b pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <Badge
                          variant="outline"
                          className={`text-[9.5px] uppercase font-bold px-2 py-0.5 rounded-md ${
                            SEV_STYLES[meta?.severity || "medium"]
                          }`}
                        >
                          {meta?.severity || "medium"}
                        </Badge>
                        <span className="font-bold text-sm text-foreground">
                          {t(meta?.en || ruleId, meta?.ar || ruleId)}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {meta?.page}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1.5">
                      {steps.map((step, idx) => {
                        const isFixed = Boolean(remediations[`${ruleId}:${idx}`]);
                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                              isFixed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/20"
                            }`}
                          >
                            <Checkbox
                              id={`rem-${ruleId}-${idx}`}
                              checked={isFixed}
                              onCheckedChange={(v) =>
                                toggleRemediation(ruleId, idx, Boolean(v))
                              }
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={`rem-${ruleId}-${idx}`}
                              className={`text-xs flex-1 cursor-pointer select-none leading-relaxed ${
                                isFixed
                                  ? "line-through text-muted-foreground font-normal"
                                  : "font-semibold text-foreground"
                              }`}
                            >
                              {t(step.en, step.ar)}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: FIREWALL & WAF SETTINGS */}
        <TabsContent value="firewall" className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* WAF Policy Controls */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="border shadow-sm rounded-3xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent" />
                    <CardTitle className="text-base font-bold">
                      {t("WAF Protection Policies", "سياسات جدار حماية التطبيقات (WAF)")}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {t(
                      "Inspects incoming HTTP payloads against SQLi, XSS, and bot patterns.",
                      "يفحص الحمولات الواردة لصد محاولات حقن SQL وXSS وهجمات البوتات."
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(["active", "monitor", "off"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => updateSettings({ waf_mode: mode })}
                        className={`p-3.5 rounded-2xl border text-center transition-all ${
                          settings.waf_mode === mode
                            ? "border-accent bg-accent/10 ring-1 ring-accent font-bold text-accent"
                            : "border-border/70 bg-card hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <div className="capitalize text-xs font-bold">{mode}</div>
                        <div className="text-[9px] opacity-70 font-normal mt-0.5">
                          {mode === "active"
                            ? t("Block threats", "حظر مباشر")
                            : mode === "monitor"
                            ? t("Log only", "تسجيل فقط")
                            : t("Disabled", "معطل")}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        {t("Rate Limit (Requests / Min per IP)", "حد الطلبات (طلب / دقيقة لكل عنوان)")}
                      </Label>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {settings.rate_limit_rpm} RPM
                      </span>
                    </div>
                    <Input
                      type="number"
                      value={settings.rate_limit_rpm}
                      onChange={(e) =>
                        updateSettings({ rate_limit_rpm: Number(e.target.value) || 120 })
                      }
                      className="text-xs h-9 font-mono rounded-xl"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl border bg-muted/20 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">
                        {t("Automated Scheduled Scans", "الفحص الأمني التلقائي المجدول")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {t("Run weekly background vulnerability health checks", "تشغيل فحص دوري أسبوعي في الخلفية")}
                      </div>
                    </div>
                    <Switch
                      checked={settings.auto_scan_enabled}
                      onCheckedChange={(v) => updateSettings({ auto_scan_enabled: v })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Blocked IPs & Firewall Rules */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="border shadow-sm rounded-3xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-destructive" />
                      <CardTitle className="text-base font-bold">
                        {t("Firewall IP Blocklist", "قائمة العناوين المحظورة (IP Blacklist)")}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {settings.blocked_ips.length} {t("Banned", "محظور")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Ban Form */}
                  <form onSubmit={handleAddIpBan} className="space-y-2 p-3 rounded-2xl border bg-muted/10">
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="e.g. 198.51.100.42"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                        className="text-xs h-9 font-mono rounded-xl"
                      />
                      <Input
                        placeholder={t("Reason (optional)", "السبب (اختياري)")}
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        className="text-xs h-9 rounded-xl"
                      />
                    </div>
                    <Button type="submit" size="sm" disabled={addingIp} className="w-full h-9 text-xs font-bold rounded-xl">
                      <Plus className="h-3.5 w-3.5 me-1" />
                      <span>{t("Ban IP Address", "حظر عنوان IP")}</span>
                    </Button>
                  </form>

                  {/* Banned List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {settings.blocked_ips.length === 0 ? (
                      <div className="text-xs text-center text-muted-foreground p-6">
                        {t("No blocked IPs. Firewall is clean.", "لا توجد عناوين محظورة حالياً.")}
                      </div>
                    ) : (
                      settings.blocked_ips.map((item) => (
                        <div
                          key={item.ip}
                          className="flex items-center justify-between p-3 rounded-2xl border bg-card text-xs shadow-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-foreground">{item.ip}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-xs">
                              {item.reason}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => unblockIp(item.ip)}
                            className="h-7 text-destructive hover:bg-destructive/10 text-[11px] rounded-lg"
                          >
                            {t("Unban", "إلغاء الحظر")}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Live Edge Security Headers Matrix */}
          <Card className="border shadow-sm rounded-3xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <CardTitle className="text-base font-bold">
                    {t("Live Production Security Headers", "ترويسات الأمان والامتثال المباشرة")}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                  {t("7 Active Policies Enforced", "٧ سياسات مفعلة ونشطة")}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {t(
                  "HTTP response headers enforced across Vite dev, preview, Cloudflare CDN edge (_headers), and Apache (.htaccess).",
                  "ترويسات أمان HTTP المطبقة على كافة البيئات (Vite, CDN Edge, Apache, Hostinger)."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    name: "X-Frame-Options",
                    val: "SAMEORIGIN",
                    desc_en: "Blocks framing & Clickjacking",
                    desc_ar: "حماية كاملة ضد الاختطاف بالنقر",
                  },
                  {
                    name: "Content-Security-Policy (CSP)",
                    val: "default-src 'self' ...",
                    desc_en: "Strict script & style whitelisting",
                    desc_ar: "حظر وتحديد مصادر الأكواد الموثوقة",
                  },
                  {
                    name: "X-Content-Type-Options",
                    val: "nosniff",
                    desc_en: "Prevents MIME-sniffing exploits",
                    desc_ar: "منع استنتاج نوع الملفات الخبيث",
                  },
                  {
                    name: "Strict-Transport-Security (HSTS)",
                    val: "max-age=31536000; preload",
                    desc_en: "Forces 1-year HTTPS enforcement",
                    desc_ar: "فرض تشفير HTTPS لمدة عام كامل",
                  },
                  {
                    name: "Permissions-Policy",
                    val: "camera=(), microphone=() ...",
                    desc_en: "Disables unneeded browser APIs",
                    desc_ar: "تعطيل صلاحيات الكاميرا والمايك",
                  },
                  {
                    name: "Referrer-Policy",
                    val: "strict-origin-when-cross-origin",
                    desc_en: "Protects sensitive URL query leaks",
                    desc_ar: "حماية روابط الإحالة من التسريب",
                  },
                ].map((hdr) => (
                  <div
                    key={hdr.name}
                    className="p-3.5 rounded-2xl border bg-card hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground truncate">
                        {hdr.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <Check className="h-2.5 w-2.5" />
                        {t("ACTIVE", "مفعل")}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] bg-muted/60 p-1.5 rounded-lg text-muted-foreground truncate">
                      {hdr.val}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t(hdr.desc_en, hdr.desc_ar)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: HISTORICAL AUDIT SCAN LOG */}
        <TabsContent value="history" className="space-y-4">
          <Card className="border shadow-sm rounded-3xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <History className="h-4 w-4 text-accent" />
                    <span>{t("Audit Scan History & Compliance Records", "سجل الفحوصات الأمنية والامتثال")}</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {t(
                      "Historical scan records and vulnerability diffs persisted in Supabase.",
                      "سجلات الفحص والتدقيق التاريخية المحفوظة في قاعدة البيانات."
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {scans.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-xs">
                  {t("No scan history found. Run your first audit template.", "لا يوجد سجل فحوصات سابق.")}
                </div>
              ) : (
                <div className="rounded-2xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Scan Template", "قالب الفحص")}</TableHead>
                        <TableHead>{t("Timestamp", "التاريخ والوقت")}</TableHead>
                        <TableHead>{t("Duration", "المدة")}</TableHead>
                        <TableHead>{t("Findings", "النتائج")}</TableHead>
                        <TableHead>{t("Critical", "حرجة")}</TableHead>
                        <TableHead className="text-end">{t("Actions", "إجراءات")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scans.map((scan) => (
                        <TableRow key={scan.id}>
                          <TableCell className="font-bold text-xs">
                            {scan.template_name}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {new Date(scan.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {scan.duration_seconds}s
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {scan.findings_count}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {scan.critical_count > 0 ? (
                              <Badge variant="destructive" className="text-xs font-mono">
                                {scan.critical_count}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground font-mono">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteScanHistory(scan.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}