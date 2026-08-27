import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { Briefcase, FileText, LifeBuoy, LayoutDashboard, User, Bell, LogOut, PlusCircle, Search } from "lucide-react";
import { useClientT } from "@/lib/client-i18n";
import { useAuth, isClientRole } from "@/lib/auth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/workspace")({
  head: () => ({ meta: [{ title: "My Workspace — Integrated Technics" }] }),
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { t } = useClientT();
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && user && !isClientRole(user.role)) {
      navigate({ to: "/dashboard/admin", replace: true });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) return null;
  if (!isClientRole(user.role)) return null;

  const tabs = [
    { to: "/dashboard/workspace", label: t("overview"), icon: LayoutDashboard, exact: true },
    { to: "/dashboard/workspace/new", label: t("newRequest"), icon: PlusCircle },
    { to: "/dashboard/workspace/track", label: t("track"), icon: Search },
    { to: "/dashboard/workspace/orders", label: t("orders"), icon: FileText },
    { to: "/dashboard/workspace/tickets", label: t("tickets"), icon: LifeBuoy },
    { to: "/dashboard/workspace/profile", label: t("profile"), icon: User },
  ];
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to || pathname === to + "/" : pathname.startsWith(to);

  return (
    <div className="space-y-6">
      {/* Mobile app-style header */}
      <div className="lg:hidden px-4 py-4 bg-gradient-to-br from-accent to-accent/70 text-accent-foreground rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs opacity-80">{t("workspace")}</div>
              <div className="font-display text-lg font-bold truncate">{user?.name || user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center" aria-label="notifications">
              <Bell className="h-4 w-4" />
            </button>
            <button onClick={() => { signOut(); navigate({ to: "/signin" }); }} className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center" aria-label="sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop title */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{t("workspace")}</h1>
          <p className="text-sm text-muted-foreground">{t("workspaceTagline")}</p>
        </div>
      </div>

      {/* Desktop tabs - hidden because workspace uses the dashboard sidebar */}
      <div className="hidden border-b gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.to, tab.exact);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`px-4 py-2.5 text-sm inline-flex items-center gap-2 border-b-2 -mb-px transition-colors ${
                active ? "border-accent text-accent font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </Link>
          );
        })}
      </div>

      <Outlet />

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.to, tab.exact);
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors ${
                    active ? "text-accent" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`h-9 w-9 rounded-2xl flex items-center justify-center transition-all ${active ? "bg-accent/15 scale-110" : ""}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-medium">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
