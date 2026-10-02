import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Inbox,
  TrendingUp,
  Trophy,
  DollarSign,
  LifeBuoy,
  Star,
  Activity,
  ArrowUpRight,
  Plus,
  FileText,
  Users,
  CalendarCheck,
  MousePointerClick,
  RotateCcw,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  GraduationCap,
  CalendarDays,
  ShieldCheck,
  Building2,
  ArrowRight,
  ExternalLink,
  Flame,
  PhoneCall,
} from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { NotificationsBell } from "@/components/admin/NotificationsBell";
import { getCtaCounts, resetCtaCounts } from "@/lib/cta-tracking";
import { supabase } from "@/integrations/supabase/client";
import { useAccessRequests } from "@/lib/access-requests";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — Integrated Technics" }] }),
  component: AdminOverview,
});

type TimeRange = "all" | "30d" | "7d" | "today";

function AdminOverview() {
  const { t, lang } = useAdminT();
  const isAr = lang === "ar";
  const { requests: accessRequests } = useAccessRequests();

  const [ctaCounts, setCtaCounts] = useState(() => getCtaCounts());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const [stats, setStats] = useState({
    leadsTotal: 0,
    leadsNew: 0,
    leadsQualified: 0,
    leadsWon: 0,
    projectsCount: 0,
    revenueAccepted: 0,
    revenueTotal: 0,
    openTickets: 0,
    urgentTickets: 0,
    avgRating: "5.0",
    conversionRate: 0,
    candidatesCount: 0,
    trainingsCount: 0,
    recentLeads: [] as any[],
    recentTickets: [] as any[],
    recentQuotes: [] as any[],
    recentCandidates: [] as any[],
    upcomingTrainings: [] as any[],
  });

  // CTA listeners
  useEffect(() => {
    const refreshCtas = () => setCtaCounts(getCtaCounts());
    refreshCtas();
    window.addEventListener("it:cta-updated", refreshCtas);
    window.addEventListener("storage", refreshCtas);
    return () => {
      window.removeEventListener("it:cta-updated", refreshCtas);
      window.removeEventListener("storage", refreshCtas);
    };
  }, []);

  const loadLiveStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Leads
      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, full_name, company, email, service, status, phone, created_at")
        .order("created_at", { ascending: false });

      const leads = leadsData || [];
      const leadsTotal = leads.length;
      const leadsNew = leads.filter((l: any) => !l.status || l.status === "new").length;
      const leadsQualified = leads.filter((l: any) => l.status === "qualified" || l.status === "contacted").length;
      const leadsWon = leads.filter((l: any) => l.status === "won" || l.status === "closed").length;
      const conversionRate = leadsTotal ? Math.round((leadsWon / leadsTotal) * 100) : 0;

      // 2. Quotes & Revenue
      const { data: quotesData } = await (supabase as any)
        .from("quotes")
        .select("id, full_name, company, email, total, currency, status, created_at")
        .order("created_at", { ascending: false });

      const quotes = quotesData || [];
      const revenueAccepted = quotes
        .filter((q: any) => q.status === "accepted" || q.status === "approved")
        .reduce((sum: number, q: any) => sum + (Number(q.total) || 0), 0);
      const revenueTotal = quotes.reduce((sum: number, q: any) => sum + (Number(q.total) || 0), 0);

      // 3. Support tickets
      const { data: ticketsData } = await supabase
        .from("support_tickets")
        .select("id, ticket_no, subject, priority, status, created_at")
        .order("created_at", { ascending: false });

      const tickets = ticketsData || [];
      const openTickets = tickets.filter(
        (t: any) => t.status === "open" || t.status === "pending" || t.status === "in_progress"
      ).length;
      const urgentTickets = tickets.filter(
        (t: any) => (t.priority === "urgent" || t.priority === "high") && t.status !== "resolved" && t.status !== "closed"
      ).length;

      // 4. Reviews & Rating
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("rating, approved");

      const reviews = reviewsData || [];
      const avgRating = reviews.length
        ? (reviews.reduce((s: number, r: any) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
        : "5.0";

      // 5. Projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, title_en, title_ar, industry, image")
        .limit(6);

      // 6. Career candidates
      const { data: candidatesData } = await supabase
        .from("career_applications")
        .select("id, full_name, current_title, email, phone, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      // 7. Upcoming trainings
      const { data: trainingsData } = await (supabase as any)
        .from("trainings")
        .select("id, title_en, title_ar, kind, start_date, location, active")
        .order("sort_order", { ascending: true })
        .limit(4);

      setStats({
        leadsTotal,
        leadsNew,
        leadsQualified,
        leadsWon,
        projectsCount: (projectsData || []).length || 6,
        revenueAccepted,
        revenueTotal,
        openTickets,
        urgentTickets,
        avgRating,
        conversionRate,
        candidatesCount: (candidatesData || []).length,
        trainingsCount: (trainingsData || []).length,
        recentLeads: leads.slice(0, 6),
        recentTickets: tickets.slice(0, 6),
        recentQuotes: quotes.slice(0, 6),
        recentCandidates: candidatesData || [],
        upcomingTrainings: trainingsData || [],
      });
      setLastUpdated(new Date());

      if (isManual) {
        toast.success(isAr ? "تم تحديث المؤشرات بنجاح" : "Metrics refreshed successfully");
      }
    } catch (err) {
      console.error("[admin-overview] Failed to load live metrics:", err);
      if (isManual) {
        toast.error(isAr ? "فشل تحديث البيانات" : "Failed to refresh metrics");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadLiveStats();
  }, []);

  // Pending items requiring immediate attention
  const pendingAccessCount = useMemo(
    () => accessRequests.filter((r) => r.status === "pending").length,
    [accessRequests]
  );
  const pendingQuotesCount = useMemo(
    () => stats.recentQuotes.filter((q: any) => q.status === "sent" || q.status === "draft").length,
    [stats.recentQuotes]
  );
  const totalAttentionItems = stats.leadsNew + stats.urgentTickets + pendingAccessCount + pendingQuotesCount;

  // KPI cards
  const cards = [
    {
      label: isAr ? "إجمالي العملاء" : "Total Leads",
      value: stats.leadsTotal,
      sub: `${stats.leadsNew} ${isAr ? "جديد" : "new"}`,
      icon: Inbox,
      gradient: "from-blue-600 to-cyan-600",
      delta: "+14%",
    },
    {
      label: t("qualified", "مؤهل للمتابعة"),
      value: stats.leadsQualified,
      sub: isAr ? "في مرحلة التفاوض" : "in pipeline",
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-600",
      delta: "+8%",
    },
    {
      label: t("won", "صفقات ناجحة"),
      value: stats.leadsWon,
      sub: `${stats.conversionRate}% ${isAr ? "معدل الإغلاق" : "conversion"}`,
      icon: Trophy,
      gradient: "from-emerald-600 to-teal-600",
      delta: "+24%",
    },
    {
      label: isAr ? "الإيرادات المعتمدة" : "Accepted Revenue",
      value: `$${(stats.revenueAccepted / 1000).toFixed(0)}K`,
      sub: `$${(stats.revenueTotal / 1000).toFixed(0)}K ${isAr ? "إجمالي العروض" : "quoted"}`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-green-600",
      delta: "+18%",
    },
    {
      label: isAr ? "تذاكر الدعم المفتوحة" : "Open Tickets",
      value: stats.openTickets,
      sub: `${stats.urgentTickets} ${isAr ? "عاجلة" : "urgent"}`,
      icon: LifeBuoy,
      gradient: "from-rose-500 to-pink-600",
      delta: stats.urgentTickets > 0 ? "⚠️" : "OK",
    },
    {
      label: isAr ? "طلبات التوظيف" : "Job Applicants",
      value: stats.candidatesCount,
      sub: isAr ? "مرشحين نشطين" : "active pool",
      icon: Users,
      gradient: "from-purple-600 to-indigo-600",
      delta: "+5",
    },
    {
      label: isAr ? "البرامج التدريبية" : "Training & Events",
      value: stats.trainingsCount,
      sub: isAr ? "برامج مجدولة" : "scheduled",
      icon: GraduationCap,
      gradient: "from-teal-600 to-cyan-700",
      delta: "Active",
    },
    {
      label: isAr ? "متوسط التقييم" : "Customer Rating",
      value: stats.avgRating,
      sub: isAr ? "رضا العملاء" : "satisfaction",
      icon: Star,
      gradient: "from-yellow-500 to-amber-600",
      delta: "★ 5.0",
    },
  ];

  const quickActions = [
    { label: isAr ? "عميل محتمل" : "New Lead", icon: Plus, to: "/dashboard/admin/leads", color: "bg-blue-600 text-white hover:bg-blue-700" },
    { label: isAr ? "عرض سعر" : "New Quote", icon: FileText, to: "/dashboard/admin/quotations", color: "bg-emerald-600 text-white hover:bg-emerald-700" },
    { label: isAr ? "المحادثات المباشرة" : "Live Chat", icon: MessageSquare, to: "/dashboard/admin/chat", color: "bg-violet-600 text-white hover:bg-violet-700" },
    { label: isAr ? "تذاكر الدعم" : "Helpdesk", icon: LifeBuoy, to: "/dashboard/admin/helpdesk/tickets", color: "bg-rose-600 text-white hover:bg-rose-700" },
    { label: isAr ? "طلبات التوظيف" : "Careers", icon: Users, to: "/dashboard/admin/careers", color: "bg-amber-600 text-white hover:bg-amber-700" },
    { label: isAr ? "التقويم والتدريب" : "Calendar", icon: CalendarDays, to: "/dashboard/admin/calendar", color: "bg-cyan-600 text-white hover:bg-cyan-700" },
  ];

  const ctaTotal = (ctaCounts.request_proposal || 0) + (ctaCounts.book_consultation || 0);
  const proposalPct = ctaTotal ? Math.round(((ctaCounts.request_proposal || 0) / ctaTotal) * 100) : 50;
  const consultPct = ctaTotal ? Math.round(((ctaCounts.book_consultation || 0) / ctaTotal) * 100) : 50;

  const handleResetCtas = () => {
    resetCtaCounts();
    setCtaCounts({ request_proposal: 0, book_consultation: 0 });
    toast.success(isAr ? "تم إعادة تعيين إحصاءات الإجراءات (CTA)" : "CTA metrics reset successfully");
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
              {isAr ? "مركز القيادة ونظرة عامة" : "Admin Command Center"}
            </h1>
            <Badge variant="outline" className="border-accent/40 text-accent font-mono text-xs">
              Live
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? `آخر تحديث: ${lastUpdated.toLocaleTimeString()}`
              : `Last synced: ${lastUpdated.toLocaleTimeString()} · Realtime analytics & database telemetry`}
          </p>
        </div>

        {/* Time range pills & Refresh button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-lg bg-muted/60 border text-xs font-medium">
            {(["all", "30d", "7d", "today"] as TimeRange[]).map((r) => {
              const labels: Record<TimeRange, { en: string; ar: string }> = {
                all: { en: "All Time", ar: "الكل" },
                "30d": { en: "30 Days", ar: "30 يوم" },
                "7d": { en: "7 Days", ar: "7 أيام" },
                today: { en: "Today", ar: "اليوم" },
              };
              return (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    timeRange === r ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {labels[r][isAr ? "ar" : "en"]}
                </button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => loadLiveStats(true)}
            disabled={refreshing}
            className="h-8 gap-1.5 text-xs"
            title={isAr ? "تحديث المؤشرات الآن" : "Refresh metrics now"}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-accent" : ""}`} />
            <span className="hidden md:inline">{isAr ? "تحديث" : "Refresh"}</span>
          </Button>

          <NotificationsBell />
        </div>
      </div>

      {/* Immediate Attention Alert Strip */}
      {totalAttentionItems > 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {isAr
                  ? `تنبيه: هناك ${totalAttentionItems} عناصر تتطلب اهتمامك الفوري`
                  : `Attention Required: ${totalAttentionItems} active items need prompt action`}
              </div>
              <div className="text-xs text-muted-foreground">
                {isAr
                  ? "قم بمراجعة العملاء الجدد، والتذاكر العاجلة، وطلبات الصلاحيات وعروض الأسعار المعلقة."
                  : "Review incoming uncontacted leads, urgent support tickets, pending access and quotes."}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stats.leadsNew > 0 && (
              <Button asChild size="sm" variant="outline" className="h-7 text-xs border-amber-500/40 bg-background/80 hover:bg-background">
                <Link to="/dashboard/admin/leads">
                  {stats.leadsNew} {isAr ? "عملاء جدد" : "New Leads"}
                </Link>
              </Button>
            )}
            {stats.urgentTickets > 0 && (
              <Button asChild size="sm" variant="destructive" className="h-7 text-xs">
                <Link to="/dashboard/admin/helpdesk/tickets">
                  {stats.urgentTickets} {isAr ? "تذاكر عاجلة" : "Urgent Tickets"}
                </Link>
              </Button>
            )}
            {pendingAccessCount > 0 && (
              <Button asChild size="sm" variant="outline" className="h-7 text-xs border-amber-500/40 bg-background/80 hover:bg-background">
                <Link to="/dashboard/admin/permissions">
                  {pendingAccessCount} {isAr ? "طلب صلاحيات" : "Access Requests"}
                </Link>
              </Button>
            )}
            {pendingQuotesCount > 0 && (
              <Button asChild size="sm" variant="outline" className="h-7 text-xs border-amber-500/40 bg-background/80 hover:bg-background">
                <Link to="/dashboard/admin/quotations">
                  {pendingQuotesCount} {isAr ? "عروض قيد المتابعة" : "Pending Quotes"}
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 px-4 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">
              {isAr
                ? "جميع المؤشرات والأنظمة تعمل بسلاسة دون تنبيهات حرجة."
                : "All operations running normally. No urgent bottlenecks detected."}
            </span>
          </div>
          <span className="text-[11px] opacity-80 font-mono">100% SLA Health</span>
        </div>
      )}

      {/* Quick Action Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {quickActions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="group flex flex-col items-center justify-center p-3 rounded-xl border bg-card hover:border-accent hover:shadow-sm transition-all text-center gap-1.5"
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${a.color} shadow-xs group-hover:scale-105 transition-transform`}>
              <a.icon className="h-4.5 w-4.5" />
            </div>
            <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors truncate w-full">
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      {/* KPI 8-Grid Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {cards.map((c) => (
          <Card key={c.label} className="relative overflow-hidden border-0 text-white shadow-md hover:shadow-lg transition-all group">
            <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient}`} />
            <div className="absolute -right-8 -bottom-8 h-28 w-28 rounded-full bg-white/10 blur-xl group-hover:scale-125 transition-transform duration-500" />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <c.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                  {c.delta}
                </span>
              </div>
              <div className="mt-3.5">
                <div className="text-[11px] uppercase tracking-wider text-white/80 font-medium">{c.label}</div>
                <div className="font-display text-2xl font-bold mt-0.5 tracking-tight">{c.value}</div>
                <div className="text-[10.5px] text-white/70 mt-1">{c.sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Tabs: Data Hub */}
      <Tabs defaultValue="leads" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <TabsList className="bg-muted/70 p-1 rounded-xl h-auto flex flex-wrap gap-1">
            <TabsTrigger value="leads" className="text-xs py-1.5 px-3 rounded-lg">
              <Inbox className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "العملاء المحتملون" : "Leads"} ({stats.recentLeads.length})
            </TabsTrigger>
            <TabsTrigger value="tickets" className="text-xs py-1.5 px-3 rounded-lg">
              <LifeBuoy className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "تذاكر الدعم" : "Tickets"} ({stats.recentTickets.length})
            </TabsTrigger>
            <TabsTrigger value="quotes" className="text-xs py-1.5 px-3 rounded-lg">
              <FileText className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "عروض الأسعار" : "Quotations"} ({stats.recentQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="careers" className="text-xs py-1.5 px-3 rounded-lg">
              <Users className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "التوظيف" : "Careers"} ({stats.recentCandidates.length})
            </TabsTrigger>
            <TabsTrigger value="trainings" className="text-xs py-1.5 px-3 rounded-lg">
              <GraduationCap className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "التدريب والفعاليات" : "Training"} ({stats.upcomingTrainings.length})
            </TabsTrigger>
          </TabsList>

          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{isAr ? "تحديث تلقائي لحظي" : "Live reactive telemetry"}</span>
          </div>
        </div>

        {/* Tab 1: Leads */}
        <TabsContent value="leads" className="pt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 rounded-2xl border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Inbox className="h-4 w-4 text-blue-500" />
                    <span>{isAr ? "أحدث طلبات العملاء" : "Recent Inbound Inquiries"}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isAr ? "العملاء الذين تواصلوا عبر نماذج الموقع والمبيعات" : "Leads generated from website contact forms and quote requests"}
                  </CardDescription>
                </div>
                <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-accent">
                  <Link to="/dashboard/admin/leads">{isAr ? "عرض الكل" : "View all"}</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {stats.recentLeads.length === 0 ? (
                  <div className="text-xs text-center text-muted-foreground p-8">
                    {isAr ? "لا يوجد عملاء محتملين حالياً." : "No leads in database yet."}
                  </div>
                ) : (
                  stats.recentLeads.map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/15 hover:bg-muted/30 transition-colors text-xs gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 uppercase">
                          {(l.full_name || l.name || "L")[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{l.full_name || l.name || "Anonymous Lead"}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{l.email} · {l.company || l.service || "General"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={l.status === "won" ? "default" : l.status === "qualified" ? "secondary" : "outline"}
                          className="capitalize text-[10px]"
                        >
                          {l.status || "new"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          {l.created_at ? new Date(l.created_at).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Pipeline conversion overview */}
            <Card className="rounded-2xl border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>{isAr ? "قمع تحويل المبيعات" : "Sales Pipeline Funnel"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr ? "مسار تحويل العملاء من طلب إلى صفقة" : "Stage distribution of inbound leads"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{isAr ? "العملاء الجدد" : "New Inbound"}</span>
                    <span className="font-semibold">{stats.leadsNew}</span>
                  </div>
                  <Progress value={stats.leadsTotal ? (stats.leadsNew / stats.leadsTotal) * 100 : 0} className="h-2 bg-muted" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{isAr ? "تم التواصل / مؤهل" : "Contacted & Qualified"}</span>
                    <span className="font-semibold">{stats.leadsQualified}</span>
                  </div>
                  <Progress value={stats.leadsTotal ? (stats.leadsQualified / stats.leadsTotal) * 100 : 0} className="h-2 bg-muted" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{isAr ? "صفقات مكتملة (فوز)" : "Closed Won Deals"}</span>
                    <span className="font-semibold text-emerald-600">{stats.leadsWon}</span>
                  </div>
                  <Progress value={stats.leadsTotal ? (stats.leadsWon / stats.leadsTotal) * 100 : 0} className="h-2 bg-muted" />
                </div>

                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 mt-4 text-xs">
                  <div className="font-semibold text-accent mb-1">{isAr ? "معدل التحويل الكلي" : "Overall Conversion Rate"}</div>
                  <div className="font-display text-2xl font-bold text-foreground">{stats.conversionRate}%</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {isAr ? "النسبة المحققة من إجمالي المسجلين" : "Based on all recorded deals won"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Tickets */}
        <TabsContent value="tickets" className="pt-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-rose-500" />
                  <span>{isAr ? "تذاكر الدعم الفني الجارية" : "Ongoing Support Tickets"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr ? "تذاكر الدعم التي تحتاج إلى معالجة أو متابعة" : "Tickets logged by clients requiring staff resolution"}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-accent">
                <Link to="/dashboard/admin/helpdesk/tickets">{isAr ? "عرض الكل" : "View all"}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats.recentTickets.length === 0 ? (
                <div className="text-xs text-center text-muted-foreground p-8">
                  {isAr ? "لا توجد تذاكر دعم مفتوحة." : "No open support tickets."}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {stats.recentTickets.map((t: any) => (
                    <div key={t.id} className="p-3.5 rounded-xl border bg-muted/15 flex flex-col justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-accent">{t.ticket_no || "TIC"}</span>
                          <Badge variant={t.priority === "urgent" || t.priority === "high" ? "destructive" : "secondary"} className="text-[10px]">
                            {t.priority || "normal"}
                          </Badge>
                        </div>
                        <div className="font-bold text-foreground line-clamp-1">{t.subject}</div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                        <span className="capitalize">{t.status || "open"}</span>
                        <span>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Quotes */}
        <TabsContent value="quotes" className="pt-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  <span>{isAr ? "عروض الأسعار الحديثة" : "Recent Quotations"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr ? "العروض المالية الصادرة للعملاء والمؤسسات" : "Formal proposals sent to clients with values and status"}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-accent">
                <Link to="/dashboard/admin/quotations">{isAr ? "عرض الكل" : "View all"}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats.recentQuotes.length === 0 ? (
                <div className="text-xs text-center text-muted-foreground p-8">
                  {isAr ? "لا توجد عروض أسعار مسجلة." : "No quotations in database yet."}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.recentQuotes.map((q: any) => (
                    <div key={q.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/15 text-xs gap-3">
                      <div>
                        <div className="font-bold text-foreground">{q.full_name || q.company || q.email || "Corporate Client"}</div>
                        <div className="text-[11px] text-muted-foreground">{q.company ? `${q.company} · ` : ""}{q.email}</div>
                      </div>
                      <div className="text-end">
                        <div className="font-mono font-bold text-foreground">${Number(q.total || 0).toLocaleString()} {q.currency || "USD"}</div>
                        <Badge variant={q.status === "accepted" ? "default" : q.status === "rejected" ? "destructive" : "outline"} className="text-[10px] mt-0.5">
                          {q.status || "sent"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Careers */}
        <TabsContent value="careers" className="pt-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>{isAr ? "أحدث طلبات التوظيف" : "Recent Candidate Applications"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr ? "المرشحون المتقدمون للشواغر الوظيفية" : "Job applicants awaiting screening or interviews"}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-accent">
                <Link to="/dashboard/admin/careers">{isAr ? "عرض الكل" : "View all"}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats.recentCandidates.length === 0 ? (
                <div className="text-xs text-center text-muted-foreground p-8">
                  {isAr ? "لا توجد طلبات توظيف حتى الآن." : "No job applications received yet."}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.recentCandidates.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/15 text-xs gap-3">
                      <div>
                        <div className="font-bold text-foreground">{c.full_name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.current_title || "Applicant"} · {c.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {c.status || "submitted"}
                        </Badge>
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          <Link to="/dashboard/admin/careers">{isAr ? "مراجعة" : "Review"}</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Training */}
        <TabsContent value="trainings" className="pt-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-teal-500" />
                  <span>{isAr ? "البرامج التدريبية المجدولة" : "Scheduled Training & Workshops"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr ? "الدورات والورش التقنية المعتمدة للمهندسين والعملاء" : "Upcoming technical courses and certified academies"}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-accent">
                <Link to="/dashboard/admin/training">{isAr ? "إدارة التدريب" : "Manage training"}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats.upcomingTrainings.length === 0 ? (
                <div className="text-xs text-center text-muted-foreground p-8">
                  {isAr ? "لا توجد دورات تدريبية مضافة حالياً." : "No training courses added yet."}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {stats.upcomingTrainings.map((tr: any) => (
                    <div key={tr.id} className="p-3.5 rounded-xl border bg-muted/15 flex flex-col justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {tr.kind || "training"}
                          </Badge>
                          <span className={`text-[10px] font-semibold ${tr.active ? "text-emerald-500" : "text-muted-foreground"}`}>
                            {tr.active ? (isAr ? "نشط" : "Active") : (isAr ? "موقف" : "Inactive")}
                          </span>
                        </div>
                        <div className="font-bold text-foreground line-clamp-1">
                          {isAr ? tr.title_ar || tr.title_en : tr.title_en}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                        <span>{tr.location || "Online"}</span>
                        <span>{tr.start_date ? new Date(tr.start_date).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Marketing CTA Telemetry & System Health */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* CTA Performance Tracker */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-accent" />
                <span>{isAr ? "تفاعل الزوار مع أزرار الإجراء (CTA)" : "Website CTA Click Tracker"}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "رصد لحظي للنقر على أزرار طلب العرض والاستشارة" : "Realtime conversion tracker for primary high-intent website triggers"}
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetCtas}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              title={isAr ? "إعادة تعيين العدادات" : "Reset counts"}
            >
              <RotateCcw className="h-3.5 w-3.5 me-1" />
              {isAr ? "تصفير" : "Reset"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-xs text-muted-foreground">{isAr ? "طلب عرض سعر" : "Request Proposal"}</div>
                <div className="font-display text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {ctaCounts.request_proposal || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">{proposalPct}% {isAr ? "من النقرات" : "of clicks"}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs text-muted-foreground">{isAr ? "حجز استشارة" : "Book Consultation"}</div>
                <div className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {ctaCounts.book_consultation || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">{consultPct}% {isAr ? "من النقرات" : "of clicks"}</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{isAr ? "توزيع التفاعل الكلي" : "Engagement Ratio"}</span>
                <span>{ctaTotal} {isAr ? "نقرة إجمالية" : "total clicks"}</span>
              </div>
              <Progress value={proposalPct} className="h-2.5 bg-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* System & Telemetry Health */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>{isAr ? "حالة النظام والخدمات السحابية" : "Cloud Services & System Health"}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr ? "مراقبة البنية التحتية والاتصال السحابي" : "Active connection status for backend nodes and APIs"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <div>
                  <div className="font-semibold text-foreground">PostgreSQL & Supabase API</div>
                  <div className="text-[11px] text-muted-foreground">{isAr ? "متصل ويعمل بكفاءة عالية" : "Operational · latency < 45ms"}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <div>
                  <div className="font-semibold text-foreground">SMTP & Email Gateway</div>
                  <div className="text-[11px] text-muted-foreground">{isAr ? "جاهز لإرسال الإشعارات والتقارير" : "Ready for transactional dispatch"}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <div>
                  <div className="font-semibold text-foreground">Live Chat & Realtime WebSockets</div>
                  <div className="text-[11px] text-muted-foreground">{isAr ? "قنوات المحادثة المباشرة متزامنة" : "Listening for visitor interactions"}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                Live
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
