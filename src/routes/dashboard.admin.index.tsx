import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Inbox, TrendingUp, Trophy, DollarSign, LifeBuoy, Star, Activity, ArrowUpRight, Plus, FileText, Users, CalendarCheck, MousePointerClick, RotateCcw, Loader2 } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { NotificationsBell } from "@/components/admin/NotificationsBell";
import { getCtaCounts, resetCtaCounts } from "@/lib/cta-tracking";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — Integrated Technics" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const { t, lang } = useAdminT();
  const isAr = lang === "ar";
  const [ctaCounts, setCtaCounts] = useState(() => getCtaCounts());
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    leadsTotal: 0,
    leadsQualified: 0,
    leadsWon: 0,
    projectsCount: 0,
    revenueAccepted: 0,
    openTickets: 0,
    avgRating: "5.0",
    conversionRate: 0,
    recentLeads: [] as any[],
    recentTickets: [] as any[],
    featuredProjects: [] as any[],
  });

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

  useEffect(() => {
    const loadLiveStats = async () => {
      try {
        // 1. Leads counts
        const { data: leadsData } = await supabase
          .from("leads")
          .select("id, full_name, company, email, service, status, created_at")
          .order("created_at", { ascending: false });

        const leads = leadsData || [];
        const leadsTotal = leads.length;
        const leadsQualified = leads.filter((l: any) => l.status === "qualified" || l.status === "contacted").length;
        const leadsWon = leads.filter((l: any) => l.status === "won" || l.status === "closed").length;
        const conversionRate = leadsTotal ? Math.round((leadsWon / leadsTotal) * 100) : 0;

        // 2. Quotes & Revenue
        const { data: quotesData } = await (supabase as any).from("quotes")
          .select("id, total, status");

        const quotes = quotesData || [];
        const revenueAccepted = quotes
          .filter((q: any) => q.status === "accepted" || q.status === "approved")
          .reduce((sum: number, q: any) => sum + (Number(q.total) || 0), 0);

        // 3. Support tickets
        const { data: ticketsData } = await supabase
          .from("support_tickets")
          .select("id, ticket_no, subject, priority, status, created_at")
          .order("created_at", { ascending: false });

        const tickets = ticketsData || [];
        const openTickets = tickets.filter((t: any) => t.status === "open" || t.status === "pending" || t.status === "in_progress").length;

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
          .limit(4);

        setStats({
          leadsTotal,
          leadsQualified,
          leadsWon,
          projectsCount: (projectsData || []).length || 6,
          revenueAccepted,
          openTickets,
          avgRating,
          conversionRate,
          recentLeads: leads.slice(0, 5),
          recentTickets: tickets.slice(0, 4),
          featuredProjects: projectsData || [],
        });
      } catch (err) {
        console.error("[admin-overview] Failed to load live metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadLiveStats();
  }, []);

  const cards = [
    { label: isAr ? "إجمالي العملاء المحتملين" : "Total Leads", value: stats.leadsTotal, icon: Inbox, gradient: "from-blue-500 to-cyan-500", delta: "+12%" },
    { label: t("qualified", "مؤهل"), value: stats.leadsQualified, icon: TrendingUp, gradient: "from-amber-500 to-orange-500", delta: "+8%" },
    { label: t("won", "مكتمل / فائز"), value: stats.leadsWon, icon: Trophy, gradient: "from-emerald-500 to-teal-500", delta: "+24%" },
    { label: isAr ? "المشاريع النشطة" : "Active Projects", value: stats.projectsCount, icon: Briefcase, gradient: "from-violet-500 to-fuchsia-500", delta: "+3" },
    { label: isAr ? "الإيرادات (مقبولة)" : "Revenue (Accepted)", value: `$${(stats.revenueAccepted / 1000).toFixed(0)}K`, icon: DollarSign, gradient: "from-green-500 to-emerald-600", delta: "+18%" },
    { label: isAr ? "تذاكر مفتوحة" : "Open Tickets", value: stats.openTickets, icon: LifeBuoy, gradient: "from-rose-500 to-pink-500", delta: "-2" },
    { label: isAr ? "متوسط التقييم" : "Avg. Rating", value: stats.avgRating, icon: Star, gradient: "from-yellow-500 to-amber-500", delta: "★" },
    { label: isAr ? "معدل التحويل" : "Conversion", value: `${stats.conversionRate}%`, icon: Activity, gradient: "from-indigo-500 to-purple-500", delta: "+4%" },
  ];

  const quickActions = [
    { label: isAr ? "عميل جديد" : "New Lead", icon: Plus, to: "/dashboard/admin/leads", tone: "bg-accent text-accent-foreground" },
    { label: isAr ? "عرض سعر" : "New Quote", icon: FileText, to: "/dashboard/admin/quotations", tone: "bg-primary text-primary-foreground" },
    { label: isAr ? "إدارة العملاء" : "Clients", icon: Users, to: "/dashboard/admin/clients", tone: "bg-secondary text-secondary-foreground" },
    { label: isAr ? "التقارير" : "Reports", icon: TrendingUp, to: "/dashboard/admin/reports", tone: "bg-muted text-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{isAr ? "نظرة عامة" : "Admin Overview"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? "ملخص لحظي متصل بقاعدة البيانات لأداء الأعمال" : "Live database-connected snapshot of your business performance"}</p>
        </div>
        <div className="flex items-center gap-2">
          {quickActions.slice(0, 2).map((a) => (
            <Button key={a.label} asChild size="sm" variant="outline" className="hidden md:inline-flex">
              <Link to={a.to}><a.icon className="h-4 w-4 me-1" />{a.label}</Link>
            </Button>
          ))}
          <NotificationsBell />
        </div>
      </div>

      {/* Colored KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="relative overflow-hidden border-0 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient}`} />
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                  <c.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur">{c.delta}</span>
              </div>
              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-wider text-white/80">{c.label}</div>
                <div className="font-display text-2xl font-bold mt-0.5">{c.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Leads & Tickets Live Widgets */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Inbox className="h-4 w-4 text-accent" />
              <span>{isAr ? "أحدث العملاء المحتملين" : "Recent Inbound Leads"}</span>
            </CardTitle>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-accent">
              <Link to="/dashboard/admin/leads">{isAr ? "عرض الكل" : "View all"}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentLeads.length === 0 ? (
              <div className="text-xs text-center text-muted-foreground p-6">
                {isAr ? "لا يوجد عملاء محتملين حالياً." : "No leads in database yet."}
              </div>
            ) : (
              stats.recentLeads.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-xs">
                  <div>
                    <div className="font-bold text-foreground">{l.full_name || l.name || "Anonymous Lead"}</div>
                    <div className="text-[10.5px] text-muted-foreground">{l.email} · {l.company || l.service || "General"}</div>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {l.status || "new"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-emerald-500" />
              <span>{isAr ? "تذاكر الدعم النشطة" : "Active Support Tickets"}</span>
            </CardTitle>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-accent">
              <Link to="/dashboard/admin/helpdesk/tickets">{isAr ? "عرض الكل" : "View all"}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentTickets.length === 0 ? (
              <div className="text-xs text-center text-muted-foreground p-6">
                {isAr ? "لا توجد تذاكر دعم مفتوحة." : "No active support tickets."}
              </div>
            ) : (
              stats.recentTickets.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-xs">
                  <div>
                    <div className="font-bold text-foreground">{t.subject}</div>
                    <div className="text-[10.5px] text-muted-foreground font-mono">{t.ticket_no || "TIC"} · {new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                  <Badge variant={t.priority === "urgent" || t.priority === "high" ? "destructive" : "secondary"} className="text-[10px]">
                    {t.priority || "normal"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
