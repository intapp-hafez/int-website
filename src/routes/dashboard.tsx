import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type Role } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ShieldCheck, LogOut, User, Inbox, Settings, ShieldAlert, Images, BarChart3, Users, UserSquare2, FileText, Star, LifeBuoy, HelpCircle, ScrollText, Lock, Briefcase, Info, Bell, MessageCircle, Search, Mail, ChevronDown, Megaphone, Wrench, FileCog, Globe, GraduationCap, ShoppingBag, Newspaper, ShieldHalf, MapPin, Building2, Tag } from "lucide-react";
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
      { to: "/dashboard/admin/reviews", en: "Reviews", ar: "المراجعات", icon: Star, role: "admin", pageKey: "reviews", adminOnly: true },
    ],
  },
  {
    en: "Operations", ar: "العمليات", icon: Briefcase,
    items: [
      { to: "/dashboard/admin/projects", en: "Projects", ar: "المشاريع", icon: ShieldCheck, role: "admin", pageKey: "projects" },
      { to: "/dashboard/admin/services", en: "Services", ar: "الخدمات", icon: Briefcase, role: "admin", pageKey: "services" },
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
      { to: "/dashboard/admin/about", en: "About Page", ar: "صفحة من نحن", icon: Info, role: "admin", pageKey: "about" },
      { to: "/dashboard/admin/faqs", en: "FAQs", ar: "الأسئلة الشائعة", icon: HelpCircle, role: "admin", pageKey: "faqs" },
      { to: "/dashboard/admin/terms", en: "Terms", ar: "الشروط والأحكام", icon: ScrollText, role: "admin", pageKey: "terms" },
      { to: "/dashboard/admin/policies", en: "Privacy Policy", ar: "سياسة الخصوصية", icon: Lock, role: "admin", pageKey: "policies" },
    ],
  },
  {
    en: "Marketing & SEO", ar: "التسويق والـSEO", icon: Megaphone,
    items: [
      { to: "/dashboard/admin/seo", en: "SEO", ar: "تحسين محركات البحث", icon: Search, role: "admin", pageKey: "seo" },
      { to: "/dashboard/admin/chatbot", en: "Chatbot", ar: "المساعد الذكي", icon: MessageCircle, role: "admin", pageKey: "chatbot" },
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

const isClientRole = (role?: string) => !role || ["client", "client_user", "user"].includes(role.toLowerCase());

function DashboardLayout() {
  const { user, ready, signOut } = useAuth();
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

  if (!ready || !user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{ready ? (lang === "ar" ? "جارٍ التحويل إلى تسجيل الدخول…" : "Redirecting to sign in…") : (lang === "ar" ? "جارٍ التحميل…" : "Loading…")}</p>
      </div>
    );
  }

  const isClient = isClientRole(user.role);

  // Role gate for /dashboard/admin/*
  const isAdminPath = pathname.startsWith("/dashboard/admin");
  const denied = isAdminPath && isClient;

  // Extra hard gate: helpdesk is admin-only regardless of granted page permissions.
  const isHelpdeskPath = pathname.startsWith("/dashboard/admin/helpdesk");
  const helpdeskDenied = isHelpdeskPath && user.role !== "admin";

  const permDenied = isAdminPath && !denied && user.role !== "admin" && adminPage !== null && !perms[action];

  const roleLabel = lang === "ar"
    ? (user.role === "admin" ? "مدير" : user.role === "manager" ? "مشرف" : user.role === "agent" ? "موظف" : user.role === "seo" ? "مسؤول SEO" : user.role === "technician" ? "فني تقني" : "عميل")
    : (user.role === "seo" ? "SEO Specialist" : isClient ? "Client" : user.role);

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
        {denied || helpdeskDenied || permDenied ? <Unauthorized reason={permDenied ? "perm" : "role"} /> : <Outlet />}
      </section>
    </div>
  );
}

function Unauthorized({ reason = "role" }: { reason?: "role" | "perm" }) {
  return (
    <div className="bg-card border rounded-2xl p-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h2 className="font-display text-xl font-bold mb-2">Access restricted</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        {reason === "perm"
          ? "You don't have permission to access this page. Contact an administrator to request access."
          : "This area is reserved for administrators. Sign in with an admin account to continue, or return to your workspace."}
      </p>
      <div className="flex gap-2 justify-center">
        <Button asChild><Link to="/dashboard/workspace">Go to my workspace</Link></Button>
        <Button asChild variant="outline"><Link to="/">Back to website</Link></Button>
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
