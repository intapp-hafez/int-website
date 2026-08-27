import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type Role, isClientRole } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, ShieldCheck, LogOut, User, Inbox, Settings, ShieldAlert, Images, BarChart3, Users, UserSquare2, FileText, LifeBuoy, HelpCircle, ScrollText, Lock, Briefcase, Info, Bell, MessageCircle, Search, Mail, ChevronDown, Megaphone, Wrench, FileCog, Globe, GraduationCap, ShoppingBag, Newspaper, ShieldHalf, MapPin, Building2, Tag, ArrowRight, ArrowLeft, MessageSquare, Layers } from "lucide-react";
import { useCanAccess, usePermissions, resolveAdminPage } from "@/lib/permissions-store";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Integrated Technics" }] }),
  component: DashboardLayout,
});

type NavItem = { to: string; en: string; ar: string; icon: any; role?: Role; clientOnly?: boolean; pageKey?: string; adminOnly?: boolean };

type NavGroup = { en: string; ar: string; icon: any; items: NavItem[]; adminOnly?: boolean };

const workspaceItems: NavItem[] = [
  { to: "/dashboard/workspace", en: "Overview", ar: "نظرة عامة", icon: LayoutDashboard, clientOnly: true },
  { to: "/dashboard/workspace/assessment", en: "Smart Assessment", ar: "التقييم الذكي", icon: HelpCircle, clientOnly: true },
  { to: "/dashboard/workspace/orders", en: "My Orders", ar: "طلباتي", icon: FileText, clientOnly: true },
  { to: "/dashboard/workspace/tickets", en: "Support Tickets", ar: "تذاكر الدعم", icon: LifeBuoy, clientOnly: true },
  { to: "/dashboard/workspace/profile", en: "Profile", ar: "الملف الشخصي", icon: User, clientOnly: true },
];

const adminTopItem: NavItem = { to: "/dashboard/admin", en: "Admin Overview", ar: "نظرة عامة", icon: LayoutDashboard, role: "admin", pageKey: "overview" };

const adminGroups: NavGroup[] = [
  {
    en: "Sales & Customers", ar: "المبيعات والعملاء", icon: Inbox,
    items: [
      { to: "/dashboard/admin/leads", en: "Leads", ar: "العملاء المحتملون", icon: Inbox, role: "admin", pageKey: "leads" },
      { to: "/dashboard/admin/leads/quotes", en: "Quote Requests", ar: "طلبات عروض الأسعار", icon: Inbox, role: "admin", pageKey: "quotes" },
      { to: "/dashboard/admin/orders", en: "Orders", ar: "الطلبات", icon: ShoppingBag, role: "admin", pageKey: "orders" },
      { to: "/dashboard/admin/clients", en: "Clients", ar: "العملاء", icon: UserSquare2, role: "admin", pageKey: "clients" },
      { to: "/dashboard/admin/quotations", en: "Quotations", ar: "عروض الأسعار", icon: FileText, role: "admin", pageKey: "quotations" },
    ],
  },
  {
    en: "Helpdesk", ar: "مكتب الدعم", icon: LifeBuoy, adminOnly: true,
    items: [
      { to: "/dashboard/admin/helpdesk/tickets", en: "Tickets", ar: "التذاكر", icon: LifeBuoy, role: "admin", pageKey: "helpdesk_tickets", adminOnly: true },
      { to: "/dashboard/admin/helpdesk/categories", en: "Categories", ar: "فئات التذاكر والمسؤولين", icon: Tag, role: "admin", pageKey: "helpdesk_categories", adminOnly: true },
      { to: "/dashboard/admin/reviews", en: "Reviews", ar: "المراجعات", icon: MessageSquare, role: "admin", pageKey: "reviews", adminOnly: true },
    ],
  },
  {
    en: "Operations", ar: "العمليات", icon: Briefcase,
    items: [
      { to: "/dashboard/admin/projects", en: "Projects", ar: "المشاريع", icon: ShieldCheck, role: "admin", pageKey: "projects" },
      { to: "/dashboard/admin/services", en: "Services", ar: "الخدمات", icon: Briefcase, role: "admin", pageKey: "services" },
      { to: "/dashboard/admin/solutions", en: "Solutions", ar: "الحلول", icon: Layers, role: "admin", pageKey: "solutions" },
      { to: "/dashboard/admin/products", en: "Products", ar: "المنتجات", icon: ShoppingBag, role: "admin", pageKey: "products" },
      { to: "/dashboard/admin/product-categories", en: "Product Categories", ar: "فئات المنتجات", icon: Tag, role: "admin", pageKey: "products" },
      { to: "/dashboard/admin/reports", en: "Reports", ar: "التقارير", icon: BarChart3, role: "admin", pageKey: "reports" },
    ],
  },
  {
    en: "Career", ar: "الوظائف", icon: GraduationCap,
    items: [
      { to: "/dashboard/admin/careers", en: "Careers", ar: "الوظائف", icon: GraduationCap, role: "admin", pageKey: "careers" },
    ],
  },
  {
    en: "Content", ar: "المحتوى", icon: FileCog,
    items: [
      { to: "/dashboard/admin/sliders", en: "Sliders", ar: "العروض المتحركة", icon: Images, role: "admin", pageKey: "sliders" },
      { to: "/dashboard/admin/industries", en: "Industries", ar: "القطاعات", icon: Building2, role: "admin", pageKey: "industries" },
      { to: "/dashboard/admin/partners", en: "Partners", ar: "الشركاء", icon: Users, role: "admin", pageKey: "partners" },
      { to: "/dashboard/admin/recommendations", en: "Recommendations", ar: "التوصيات الذكية", icon: HelpCircle, role: "admin", pageKey: "recommendations" },
      { to: "/dashboard/admin/news", en: "News", ar: "الأخبار", icon: Newspaper, role: "admin", pageKey: "news" },
      { to: "/dashboard/admin/events", en: "Events", ar: "الفعاليات", icon: Newspaper, role: "admin", pageKey: "events" },
      { to: "/dashboard/admin/training", en: "Training", ar: "التدريب", icon: GraduationCap, role: "admin", pageKey: "training" },
      { to: "/dashboard/admin/about", en: "About Page", ar: "صفحة من نحن", icon: Info, role: "admin", pageKey: "about" },
      { to: "/dashboard/admin/faqs", en: "FAQs", ar: "الأسئلة الشائعة", icon: HelpCircle, role: "admin", pageKey: "faqs" },
      { to: "/dashboard/admin/terms", en: "Terms", ar: "الشروط والأحكام", icon: ScrollText, role: "admin", pageKey: "terms" },
      { to: "/dashboard/admin/policies", en: "Privacy Policy", ar: "سياسة الخصوصية", icon: Lock, role: "admin", pageKey: "policies" },
    ],
  },
  {
    en: "Support & Marketing", ar: "الدعم والتسويق", icon: Megaphone,
    items: [
      { to: "/dashboard/admin/chat", en: "Live Chat", ar: "المحادثات المباشرة", icon: MessageSquare, role: "admin", pageKey: "chat" },
      { to: "/dashboard/admin/chatbot", en: "Chatbot (AI & FAQs)", ar: "المساعد الذكي والأسئلة", icon: MessageCircle, role: "admin", pageKey: "chatbot" },
      { to: "/dashboard/admin/seo", en: "SEO", ar: "تحسين محركات البحث", icon: Search, role: "admin", pageKey: "seo" },
      { to: "/dashboard/admin/notifications", en: "Notifications", ar: "الإشعارات", icon: Bell, role: "admin", pageKey: "notifications" },
    ],
  },
  {
    en: "Access", ar: "الصلاحيات", icon: Users,
    items: [
      { to: "/dashboard/admin/users", en: "Users", ar: "المستخدمون", icon: Users, role: "admin", pageKey: "users" },
      { to: "/dashboard/admin/permissions", en: "Permissions", ar: "الصلاحيات", icon: ShieldCheck, role: "admin", pageKey: "permissions" },
    ],
  },
  {
    en: "Lookups", ar: "القوائم", icon: Globe,
    items: [
      { to: "/dashboard/admin/locations", en: "Locations", ar: "المواقع", icon: MapPin, role: "admin", pageKey: "locations" },
      { to: "/dashboard/admin/nationalities", en: "Nationalities", ar: "الجنسيات", icon: Globe, role: "admin", pageKey: "nationalities" },
    ],
  },
  {
    en: "System", ar: "النظام", icon: Wrench,
    items: [
      { to: "/dashboard/admin/settings", en: "Site Settings", ar: "إعدادات الموقع", icon: Settings, role: "admin", pageKey: "settings" },
      { to: "/dashboard/admin/smtp", en: "SMTP", ar: "إعدادات البريد", icon: Mail, role: "admin", pageKey: "smtp" },
      { to: "/dashboard/admin/security", en: "Security Center", ar: "مركز الأمان", icon: ShieldHalf, role: "admin", pageKey: "security" },
    ],
  },
];

function DashboardLayout() {
  const { user, ready, signOut } = useAuth();
  const { getUserPerms } = usePermissions();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Permission gate hooks must run on every render (no conditional hooks).
  const adminPage = resolveAdminPage(pathname);
  const pageKey = adminPage?.pageKey ?? "overview";
  const action = adminPage?.action ?? "view";
  const perms = useCanAccess(pageKey);

  // Hard redirect if not signed in
  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/signin", search: { redirect: pathname } as any, replace: true });
    }
  }, [ready, user, navigate, pathname]);

  const isClient = isClientRole(user?.role);

  // Role gate for /dashboard/admin/* vs /dashboard/workspace/*
  const isAdminPath = pathname.startsWith("/dashboard/admin");
  const isWorkspacePath = pathname.startsWith("/dashboard/workspace");

  const denied = isAdminPath && isClient;
  const workspaceDenied = isWorkspacePath && !isClient;

  // Auto redirect non-clients away from workspace
  useEffect(() => {
    if (ready && user && isWorkspacePath && !isClient) {
      navigate({ to: "/dashboard/admin", replace: true });
    }
  }, [ready, user, isWorkspacePath, isClient, navigate]);

  // If a non-admin staff member lands on /dashboard/admin and has no overview permission (e.g. HR), redirect to their accessible section
  useEffect(() => {
    if (ready && user && !isClient && (pathname === "/dashboard/admin" || pathname === "/dashboard/admin/")) {
      const userPerms = getUserPerms(user.id);
      if (user.role !== "admin" && !userPerms?.overview?.view) {
        if (user.role === "hr" || userPerms?.careers?.view) {
          navigate({ to: "/dashboard/admin/careers", replace: true });
        }
      }
    }
  }, [ready, user, isClient, pathname, getUserPerms, navigate]);

  // Extra hard gate: helpdesk is admin-only regardless of granted page permissions.
  const isHelpdeskPath = pathname.startsWith("/dashboard/admin/helpdesk");
  const helpdeskDenied = isHelpdeskPath && user?.role !== "admin";

  const permDenied = isAdminPath && !denied && user?.role !== "admin" && adminPage !== null && !perms[action];

  if (!ready || !user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{ready ? (lang === "ar" ? "جارٍ التحويل إلى تسجيل الدخول…" : "Redirecting to sign in…") : (lang === "ar" ? "جارٍ التحميل…" : "Loading…")}</p>
      </div>
    );
  }

  const roleLabel = lang === "ar"
    ? (user.role === "admin" ? "مدير" : user.role === "manager" ? "مشرف" : user.role === "agent" ? "موظف" : user.role === "seo" ? "مسؤول SEO" : user.role === "technician" ? "فني تقني" : user.role === "hr" ? "الموارد البشرية" : user.role === "assistant" ? "مساعد" : "عميل")
    : (user.role === "seo" ? "SEO Specialist" : user.role === "hr" ? "HR" : user.role === "assistant" ? "Assistant" : isClient ? "Client" : user.role);

  return (
    <div className={`${isAdminPath ? "w-full px-6" : "container mx-auto px-4"} py-8 grid lg:grid-cols-[260px_1fr] gap-6 overflow-x-clip ${isClient ? "pb-28 lg:pb-8" : ""}`}>
      <aside className={`bg-card border rounded-xl p-4 h-fit lg:sticky lg:top-28 ${isClient ? "block" : ""}`}>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b">
          <div className="h-9 w-9 rounded-md bg-accent/10 text-accent flex items-center justify-center">
            {user.role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user.name || user.email}</div>
            <div className="text-xs text-muted-foreground capitalize">{roleLabel}</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {isClient ? (
            workspaceItems.map((l) => (
              <NavLinkItem key={l.to} item={l} lang={lang} />
            ))
          ) : (
            <>
              <NavLinkItem item={adminTopItem} lang={lang} />
              {adminGroups.map((g) => (
                <NavGroupSection key={g.en} group={g} lang={lang} pathname={pathname} />
              ))}
            </>
          )}
        </nav>
        <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => { signOut(); navigate({ to: "/signin", search: { redirect: undefined } }); }}>
          <LogOut className="h-4 w-4 me-2" /> {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
        </Button>
      </aside>
      <section className="min-w-0">
        {denied || workspaceDenied || helpdeskDenied || permDenied ? (
          <WelcomeGreeting reason={workspaceDenied ? "workspace" : permDenied ? "perm" : "role"} isClient={isClient} />
        ) : (
          <Outlet />
        )}
      </section>
    </div>
  );
}

const MODULE_DESCRIPTIONS: Record<string, { en: string; ar: string }> = {
  leads: { en: "Customer leads & inquiries", ar: "طلبات العملاء والفرص" },
  quotes: { en: "Price quote submissions", ar: "طلبات عروض الأسعار" },
  orders: { en: "Order fulfillment & delivery", ar: "إدارة الطلبات والتنفيذ" },
  clients: { en: "Client accounts directory", ar: "سجل وبيانات العملاء" },
  quotations: { en: "Formal price proposals", ar: "عروض الأسعار المعتمدة" },
  helpdesk_tickets: { en: "Technical support tickets", ar: "تذاكر الدعم الفني" },
  helpdesk_categories: { en: "Categories & routing", ar: "تصنيفات الدعم الفني" },
  reviews: { en: "Customer testimonials", ar: "تقييمات وآراء العملاء" },
  projects: { en: "Portfolio case studies", ar: "المشاريع والأعمال المنجزة" },
  services: { en: "Technical service offerings", ar: "الخدمات والحلول التقنية" },
  products: { en: "Product catalog items", ar: "كتالوج المنتجات والأجهزة" },
  reports: { en: "Performance analytics", ar: "التقارير والإحصاءات" },
  careers: { en: "Recruitment & job openings", ar: "الوظائف وإدارة التوظيف" },
  careers_applications: { en: "Review candidate profiles", ar: "مراجعة طلبات التوظيف" },
  careers_analytics: { en: "Hiring metrics & pipeline", ar: "تحليلات وإحصاءات التوظيف" },
  sliders: { en: "Homepage banners & slides", ar: "عروض وبنرات الصفحة الرئيسية" },
  industries: { en: "Target industry sectors", ar: "القطاعات المستهدفة" },
  partners: { en: "Partner network & vendors", ar: "شبكة الشركاء والموردين" },
  recommendations: { en: "Smart recommendation engine", ar: "محرك التوصيات الذكية" },
  news: { en: "Articles, blogs & news", ar: "الأخبار والمقالات والمدونة" },
  events: { en: "Conferences & exhibitions", ar: "الفعاليات والمؤتمرات" },
  training: { en: "Training programs", ar: "البرامج والدورات التدريبية" },
  about: { en: "Company profile page", ar: "صفحة من نحن وبيانات الشركة" },
  faqs: { en: "Frequently asked questions", ar: "الأسئلة الشائعة والإجابات" },
  terms: { en: "Terms & conditions", ar: "الشروط والأحكام القانونية" },
  policies: { en: "Privacy policy content", ar: "سياسة الخصوصية والامتثال" },
  seo: { en: "Search engine optimization", ar: "تحسين محركات البحث" },
  chat: { en: "Live Chat with visitors & leads", ar: "المحادثات المباشرة مع الزوار والعملاء" },
  chatbot: { en: "AI assistant settings", ar: "المساعد الذكي وإعدادات الدردشة" },
  notifications: { en: "System alerts & notices", ar: "إعدادات وتنبيهات النظام" },
  users: { en: "Team members & staff", ar: "إدارة المستخدمين والحسابات" },
  permissions: { en: "Role permissions & access", ar: "الصلاحيات والأدوار الوظيفية" },
  locations: { en: "Branch locations", ar: "المواقع الجغرافية والفروع" },
  nationalities: { en: "Nationalities lookup", ar: "قائمة الجنسيات المعتمدة" },
  settings: { en: "System preferences", ar: "إعدادات النظام العامة" },
  smtp: { en: "Email server settings", ar: "إعدادات خادم البريد" },
  security: { en: "Security & audit center", ar: "مركز الأمان والمراجعة" },
};

function WelcomeGreeting({ reason = "role", isClient = false }: { reason?: "role" | "perm" | "workspace"; isClient?: boolean }) {
  const { user } = useAuth();
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const { getUserPerms } = usePermissions();

  const roleName = isAr
    ? (user?.role === "admin" ? "مدير النظام" : user?.role === "manager" ? "مشرف" : user?.role === "agent" ? "موظف" : user?.role === "seo" ? "مسؤول SEO" : user?.role === "technician" ? "فني تقني" : user?.role === "hr" ? "الموارد البشرية" : user?.role === "assistant" ? "مساعد" : "عميل")
    : (user?.role === "seo" ? "SEO Specialist" : user?.role === "hr" ? "HR" : user?.role === "assistant" ? "Assistant" : user?.role === "admin" ? "Administrator" : isClient ? "Client" : user?.role || "Staff");

  const displayName = user?.name || user?.email?.split("@")[0] || (isAr ? "مستخدم" : "User");

  // Get ONLY the modules that are actually allowed and rendered in the user's sidebar
  const userPerms = user ? getUserPerms(user.id) : null;
  const quickLinks: NavItem[] = isClient
    ? workspaceItems
    : adminGroups
        .filter((g) => !(g.adminOnly && user?.role !== "admin"))
        .flatMap((g) => g.items)
        .filter((it) => {
          if (it.adminOnly && user?.role !== "admin") return false;
          if (it.clientOnly && !isClient) return false;
          if (user?.role === "admin") return true;
          if (!it.pageKey) return false;
          return !!userPerms?.[it.pageKey]?.view;
        });

  const hasQuickLinks = !isClient && quickLinks.length > 0;

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs relative overflow-hidden w-full" dir={dir}>
      {/* Subtle background glow */}
      <div className="absolute -top-28 -left-28 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className={`grid grid-cols-1 ${hasQuickLinks ? "lg:grid-cols-12 gap-8 lg:gap-10" : "max-w-2xl mx-auto text-center"} items-start`}>
        {/* Left Side: Welcome Info */}
        <div className={`${hasQuickLinks ? "lg:col-span-5 text-start" : "text-center"} flex flex-col`}>
          {/* Top Status Indicator */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/80 border border-border/80 text-muted-foreground text-xs font-medium mb-5 w-fit ${hasQuickLinks ? "" : "mx-auto"}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>{isAr ? "لوحة الإدارة المركزية — إنتجريتد تكنيكس" : "Integrated Technics Management Portal"}</span>
          </div>

          {/* Welcome Title */}
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
            {isAr ? `أهلاً بك، ${displayName}` : `Welcome to the Panel, ${displayName}!`}
          </h1>

          {/* Role Pill */}
          <div className={`flex mb-4 ${hasQuickLinks ? "justify-start" : "justify-center"}`}>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/25 capitalize shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {roleName}
            </span>
          </div>

          {/* Welcoming Subtitle */}
          <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed font-normal">
            {isAr
              ? "تم إعداد مساحة العمل وتفعيل الصلاحيات المخصصة لحسابك. يمكنك التنقل بين الأقسام المسندة إليك من القائمة الجانبية أو من خلال بطاقات الوصول السريع."
              : "We are thrilled to have you on board. Your dashboard and permissions are tailored to your role. You can navigate through your assigned modules via the sidebar or jump straight in using the quick links."}
          </p>

          {/* Action Buttons */}
          <div className={`flex flex-wrap items-center gap-3 pt-2 ${hasQuickLinks ? "justify-start" : "justify-center"}`}>
            {isClient ? (
              <Button asChild className="rounded-xl px-6 h-10 font-semibold shadow-xs">
                <Link to="/dashboard/workspace">{isAr ? "الذهاب لمساحة العمل" : "Go to my workspace"}</Link>
              </Button>
            ) : (
              quickLinks[0] && (
                <Button asChild className="rounded-xl px-6 h-10 font-semibold shadow-xs">
                  <Link to={quickLinks[0].to}>
                    {isAr ? `فتح ${quickLinks[0].ar}` : `Open ${quickLinks[0].en}`}
                  </Link>
                </Button>
              )
            )}
            <Button asChild variant="outline" className="rounded-xl px-6 h-10 font-medium">
              <Link to="/">{isAr ? "العودة للموقع" : "Back to website"}</Link>
            </Button>
          </div>
        </div>

        {/* Right Side: Quick Access Modules (2 per row) */}
        {hasQuickLinks && (
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground/80 font-bold mb-4">
              {isAr ? "أقسام الوصول السريع" : "YOUR QUICK ACCESS MODULES"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-start">
              {quickLinks.map((it) => {
                const Icon = it.icon;
                const desc = MODULE_DESCRIPTIONS[it.pageKey || ""]?.[isAr ? "ar" : "en"] || (isAr ? "استعراض وإدارة القسم" : "Manage and view module");
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className="group relative flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-background/50 hover:bg-card hover:border-accent/40 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                          {isAr ? it.ar : it.en}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate font-normal">
                          {desc}
                        </div>
                      </div>
                    </div>
                    {isAr ? (
                      <ArrowLeft className="h-4 w-4 text-muted-foreground/60 group-hover:text-accent group-hover:-translate-x-1 transition-all shrink-0 ms-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0 ms-2" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavLinkItem({ item, lang }: { item: NavItem; lang: "en" | "ar" | string }) {
  const { user } = useAuth();
  const isClient = isClientRole(user?.role);
  if (item.clientOnly && !isClient) return null;
  if (item.adminOnly && user?.role !== "admin") return null;
  if (!isClient && item.pageKey) {
    const perms = useCanAccess(item.pageKey ?? "overview");
    if (!perms.view) return null;
  }
  const Icon = item.icon;
  const label = lang === "ar" ? item.ar : item.en;
  return (
    <Link
      to={item.to}
      className="px-3 py-2 rounded-md text-sm hover:bg-muted inline-flex items-center gap-2"
      activeProps={{ className: "bg-muted text-accent font-medium" }}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function NavGroupSection({ group, lang, pathname }: { group: NavGroup; lang: string; pathname: string }) {
  const { user } = useAuth();
  const { getUserPerms } = usePermissions();
  if (group.adminOnly && user?.role !== "admin") return null;
  const canView = (pageKey: string) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return !!getUserPerms(user.id)[pageKey]?.view;
  };
  const visible = group.items.filter((it) => canView(it.pageKey ?? "overview"));
  const containsActive = visible.some((it) => pathname === it.to || pathname.startsWith(it.to + "/"));
  const [open, setOpen] = useState(containsActive);
  useEffect(() => { if (containsActive) setOpen(true); }, [containsActive]);
  if (visible.length === 0) return null;
  const Icon = group.icon;
  const label = lang === "ar" ? group.ar : group.en;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
      <CollapsibleTrigger className="w-full px-3 py-2 rounded-md text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted/60 flex items-center justify-between">
        <span className="inline-flex items-center gap-2"><Icon className="h-3.5 w-3.5" /> {label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-0.5 ps-2 mt-0.5 border-s ms-3">
        {visible.map((it) => <NavLinkItem key={it.to} item={it} lang={lang} />)}
      </CollapsibleContent>
    </Collapsible>
  );
}
