import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoLeads, kpis, demoQuotations, demoTickets, demoReports, demoReviews } from "@/data/demo";
import { projects } from "@/data/site";
import { Briefcase, Inbox, TrendingUp, Trophy, DollarSign, LifeBuoy, Star, Activity, ArrowUpRight, Plus, FileText, Users, CalendarCheck, MousePointerClick, RotateCcw } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { NotificationsBell } from "@/components/admin/NotificationsBell";
import { getCtaCounts, resetCtaCounts } from "@/lib/cta-tracking";

export const Route = createFileRoute("/dashboard/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — Integrated Technics" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const { t, lang } = useAdminT();
  const isAr = lang === "ar";
  const [ctaCounts, setCtaCounts] = useState(() => getCtaCounts());
  useEffect(() => {
    const refresh = () => setCtaCounts(getCtaCounts());
    refresh();
    window.addEventListener("it:cta-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("it:cta-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const revenue = demoQuotations.filter(q => q.status === "accepted").reduce((s, q) => s + q.amount, 0);
  const openTickets = demoTickets.filter(t => t.status === "open" || t.status === "pending").length;
  const avgRating = (demoReviews.reduce((s, r) => s + r.rating, 0) / Math.max(demoReviews.length, 1)).toFixed(1);

  const cards = [
    { label: isAr ? "إجمالي العملاء المحتملين" : "Total Leads", value: kpis.leadsTotal, icon: Inbox, gradient: "from-blue-500 to-cyan-500", delta: "+12%" },
    { label: t("qualified"), value: kpis.leadsQualified, icon: TrendingUp, gradient: "from-amber-500 to-orange-500", delta: "+8%" },
    { label: t("won"), value: kpis.leadsWon, icon: Trophy, gradient: "from-emerald-500 to-teal-500", delta: "+24%" },
    { label: isAr ? "المشاريع النشطة" : "Active Projects", value: kpis.projects, icon: Briefcase, gradient: "from-violet-500 to-fuchsia-500", delta: "+3" },
    { label: isAr ? "الإيرادات (مقبولة)" : "Revenue (Accepted)", value: `$${(revenue / 1000).toFixed(0)}K`, icon: DollarSign, gradient: "from-green-500 to-emerald-600", delta: "+18%" },
    { label: isAr ? "تذاكر مفتوحة" : "Open Tickets", value: openTickets, icon: LifeBuoy, gradient: "from-rose-500 to-pink-500", delta: "-2" },
    { label: isAr ? "متوسط التقييم" : "Avg. Rating", value: avgRating, icon: Star, gradient: "from-yellow-500 to-amber-500", delta: "★" },
    { label: isAr ? "معدل التحويل" : "Conversion", value: `${kpis.conversionRate}%`, icon: Activity, gradient: "from-indigo-500 to-purple-500", delta: "+4%" },
  ];

  const maxLead = Math.max(...demoReports.monthlyLeads);
  const maxRev = Math.max(...demoReports.monthlyRevenue);
  const months = isAr
    ? ["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"]
    : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const quickActions = [
    { label: isAr ? "عميل جديد" : "New Lead", icon: Plus, to: "/dashboard/admin/leads", tone: "bg-accent text-accent-foreground" },
    { label: isAr ? "عرض سعر" : "New Quote", icon: FileText, to: "/dashboard/admin/quotations", tone: "bg-primary text-primary-foreground" },
    { label: isAr ? "إدارة العملاء" : "Clients", icon: Users, to: "/dashboard/admin/clients", tone: "bg-secondary text-secondary-foreground" },
    { label: isAr ? "التقارير" : "Reports", icon: TrendingUp, to: "/dashboard/admin/reports", tone: "bg-muted text-foreground" },
  ];

  const recentLeads = demoLeads.slice(0, 5);
  const featured = projects.slice(0, 4);
  const topTickets = demoTickets.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{isAr ? "نظرة عامة" : "Admin Overview"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? "ملخص لحظي لأداء عملك" : "Real-time snapshot of your business performance"}</p>
        </div>
        <div className="flex items-center gap-2">
          {quickActions.slice(0, 2).map(a => (
            <Button key={a.label} asChild size="sm" variant="outline" className="hidden md:inline-flex">
              <Link to={a.to}><a.icon className="h-4 w-4 me-1" />{a.label}</Link>
            </Button>
          ))}
          <NotificationsBell />
        </div>
      </div>

      {/* Colored KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(c => (
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(a => (
          <Link key={a.label} to={a.to} className="group">
            <Card className="hover:border-accent transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${a.tone}`}>
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.label}</div>
                  <div className="text-xs text-muted-foreground">{isAr ? "فتح" : "Open"}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* About page CTA click tracking */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display text-lg inline-flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-accent" />
              {isAr ? "نقرات دعوات الإجراء (صفحة من نحن)" : "About Page CTA Clicks"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "يتم التتبع محليًا من صفحة (من نحن)." : "Tracked locally from the About page."}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { resetCtaCounts(); setCtaCounts(getCtaCounts()); }}>
            <RotateCcw className="h-3.5 w-3.5 me-1" />
            {isAr ? "إعادة تعيين" : "Reset"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{isAr ? "طلب عرض سعر" : "Request Proposal"}</div>
                <div className="font-display text-2xl font-bold">{ctaCounts.request_proposal}</div>
              </div>
            </div>
            <div className="rounded-lg border p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{isAr ? "احجز استشارة" : "Book Consultation"}</div>
                <div className="font-display text-2xl font-bold">{ctaCounts.book_consultation}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-display text-lg">{isAr ? "العملاء المحتملون شهريًا" : "Monthly Leads"}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{isAr ? "آخر 12 شهرًا" : "Last 12 months"}</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-900 border-0">+14%</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-40">
              {demoReports.monthlyLeads.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-accent to-accent/40 hover:from-accent hover:to-accent transition-all" style={{ height: `${(v / maxLead) * 100}%` }} title={`${v}`} />
                  <span className="text-[10px] text-muted-foreground">{months[i]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-display text-lg">{isAr ? "الإيرادات الشهرية" : "Monthly Revenue"}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{isAr ? "بالألف دولار" : "In $K"}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-900 border-0">+22%</Badge>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 300 140" className="w-full h-40">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const pts = demoReports.monthlyRevenue.map((v, i) => `${(i / 11) * 290 + 5},${130 - (v / maxRev) * 115}`);
                const line = pts.join(" ");
                const area = `5,130 ${line} 295,130`;
                return (<>
                  <polygon points={area} fill="url(#revGrad)" />
                  <polyline points={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  {pts.map((p, i) => {
                    const [x, y] = p.split(",");
                    return <circle key={i} cx={x} cy={y} r="2.5" fill="hsl(var(--primary))" />;
                  })}
                </>);
              })()}
            </svg>
            <div className="flex justify-between mt-2">
              {months.map(m => <span key={m} className="text-[10px] text-muted-foreground">{m}</span>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service mix */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">{isAr ? "توزيع الخدمات" : "Service Mix"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {demoReports.serviceMix.map((s, i) => {
              const colors = ["bg-blue-500","bg-emerald-500","bg-amber-500","bg-violet-500","bg-rose-500","bg-cyan-500"];
              const max = Math.max(...demoReports.serviceMix.map(x => x.value));
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">{s.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all`} style={{ width: `${(s.value / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-lg">{isAr ? "أحدث العملاء المحتملين" : "Recent Leads"}</CardTitle>
            <Link to="/dashboard/admin/leads" className="text-xs text-accent hover:underline">{isAr ? "عرض الكل ←" : "View all →"}</Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recentLeads.map(l => (
                <li key={l.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{l.name} <span className="text-muted-foreground font-normal">— {l.company}</span></div>
                    <div className="text-xs text-muted-foreground truncate">{l.service} · {l.createdAt}</div>
                  </div>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-lg">{isAr ? "تذاكر الدعم النشطة" : "Active Support Tickets"}</CardTitle>
            <Link to="/dashboard/admin/tickets" className="text-xs text-accent hover:underline">{isAr ? "عرض الكل ←" : "View all →"}</Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {topTickets.map(tk => (
                <li key={tk.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{tk.subject}</div>
                    <div className="text-xs text-muted-foreground truncate">{tk.client} · {tk.updated}</div>
                  </div>
                  <PriorityBadge priority={tk.priority} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Featured case studies */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-lg">{isAr ? "مشاريع مختارة" : "Featured Case Studies"}</CardTitle>
          <Link to="/dashboard/admin/projects" className="text-xs text-accent hover:underline">{isAr ? "عرض الكل ←" : "View all →"}</Link>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {featured.map(p => (
              <li key={p.id} className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative overflow-hidden">
                  <img src={p.image} alt="" className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wider text-white/90 font-semibold">{p.industry}</span>
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium line-clamp-1">{isAr ? p.title.ar : p.title.en}</div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: "new" | "qualified" | "won" | "lost" }) {
  const map = {
    new: "bg-muted text-foreground",
    qualified: "bg-amber-100 text-amber-900",
    won: "bg-emerald-100 text-emerald-900",
    lost: "bg-destructive/10 text-destructive",
  } as const;
  return <Badge className={`${map[status]} border-0 capitalize`}>{status}</Badge>;
}

function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" | "urgent" }) {
  const map = {
    low: "bg-muted text-foreground",
    medium: "bg-blue-100 text-blue-900",
    high: "bg-amber-100 text-amber-900",
    urgent: "bg-destructive/10 text-destructive",
  } as const;
  return <Badge className={`${map[priority]} border-0 capitalize`}>{priority}</Badge>;
}
