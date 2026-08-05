import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Briefcase, Layers, Phone, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-store";

export function MobileBottomNav() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/dashboard")) return null;

  const vis = settings.visibility;
  const tabs = [
    { to: "/", label: t("nav.home"), icon: Home, exact: true },
    { to: "/services", label: t("nav.services"), icon: Briefcase, page: "services" as const },
    { to: "/industries", label: t("nav.industries"), icon: Layers, page: "industries" as const },
    { to: "/about", label: t("nav.about"), icon: Info, page: "about" as const },
    { to: "/contact", label: t("nav.contact"), icon: Phone, page: "contact" as const },
  ].filter((tab: any) => !tab.page || vis[tab.page as keyof typeof vis] !== false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to || pathname === to + "/" : pathname.startsWith(to);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.to, tab.exact);
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors ${
                  active ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`h-8 w-8 rounded-2xl flex items-center justify-center transition-all ${active ? "bg-accent/15 scale-110" : ""}`}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="font-medium truncate max-w-[64px]">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}