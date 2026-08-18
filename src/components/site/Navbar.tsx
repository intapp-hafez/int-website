import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, ChevronDown, Globe, FileText, CalendarClock, Search, LogIn, LogOut, LayoutDashboard, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { services } from "@/data/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TopHeader } from "./TopHeader";
import { useSettings } from "@/lib/settings-store";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

const allLinks: { to: string; key: any; page: string }[] = [
  { to: "/", key: "nav.home", page: "home" },
  { to: "/about", key: "nav.about", page: "about" },
  { to: "/shop", key: "nav.shop", page: "shop" },
  { to: "/projects", key: "nav.projects", page: "projects" },
];

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { settings } = useSettings();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const vis = settings.visibility;
  const links = allLinks.filter((l) => vis[l.page as keyof typeof vis] !== false);
  const servicesVisible = vis.services !== false;
  const contactVisible = vis.contact !== false;

  const handleSignOut = () => {
    setOpen(false);
    signOut();
    navigate({ to: "/", replace: true });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled ? "bg-background/90 backdrop-blur-lg border-b shadow-sm" : "bg-background/70 backdrop-blur"
      )}
    >
      <TopHeader />
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 font-display font-bold min-w-0">
          <img src={logo} alt="Integrated Technics" className="h-8 md:h-9 w-auto shrink-0" />
          <span className="text-sm md:text-base truncate">Integrated<span className="text-accent">Technics</span></span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.slice(0, 2).map(l => (
            <Link key={l.to} to={l.to} className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors" activeProps={{ className: "text-accent" }} activeOptions={{ exact: true }}>
              {t(l.key)}
            </Link>
          ))}
          {servicesVisible && (
          <div className="relative" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
            <Link to="/services" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors inline-flex items-center gap-1" activeProps={{ className: "text-accent" }}>
              {t("nav.services")} <ChevronDown className="h-3.5 w-3.5" />
            </Link>
            {mega && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[640px] animate-fade-in">
                <div className="bg-popover border rounded-xl shadow-elegant p-4 grid grid-cols-2 gap-2">
                  {services.map(s => {
                    const Icon = s.icon;
                    return (
                      <Link key={s.slug} to="/services/$slug" params={{ slug: s.slug }} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <div className="h-9 w-9 rounded-md gradient-hero flex items-center justify-center text-primary-foreground shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{s.title[lang]}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{s.desc[lang]}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}
          {links.slice(2).map(l => (
            <Link key={l.to} to={l.to} className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors" activeProps={{ className: "text-accent" }}>
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {contactVisible && <Button asChild variant="default" size="sm" className="hidden md:inline-flex">
            <Link to="/contact">{t("cta.contact")}</Link>
          </Button>}
          <button className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted" onClick={() => setOpen(o => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-background border-t animate-fade-in max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <Button asChild size="lg" className="h-12 text-sm font-semibold" onClick={() => setOpen(false)}>
                <Link to="/contact"><FileText className="h-4 w-4 me-1.5" />{lang === "ar" ? "طلب عرض" : "Request Proposal"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 text-sm font-semibold" onClick={() => setOpen(false)}>
                <Link to="/contact"><CalendarClock className="h-4 w-4 me-1.5" />{lang === "ar" ? "حجز استشارة" : "Book Consultation"}</Link>
              </Button>
            </div>

            <div>
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {lang === "ar" ? "التنقل" : "Navigate"}
              </div>
              <div className="flex flex-col">
                {[
                  ...links.slice(0, 2),
                  ...(servicesVisible ? [{ to: "/services", key: "nav.services" }] : []),
                  ...links.slice(2),
                  ...(contactVisible ? [{ to: "/contact", key: "nav.contact" }] : []),
                ].map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-3 rounded-md hover:bg-muted text-base font-medium min-h-[48px] flex items-center border-b border-border/50 last:border-0" activeProps={{ className: "bg-muted text-accent" }}>
                    {t(l.key as any)}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {lang === "ar" ? "الحساب" : "Account"}
              </div>
              {settings.headerIcons?.tracking !== false && (
                <Link to="/track-quote" onClick={() => setOpen(false)} className="px-3 py-3 rounded-md hover:bg-muted text-sm font-medium min-h-[48px] flex items-center gap-2">
                  <Search className="h-4 w-4" /> {lang === "ar" ? "تتبع العرض" : "Track Quote"}
                </Link>
              )}
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-3 border-b border-border/50">
                    <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0">
                      {(user.name || user.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{user.name || user.email.split("@")[0]}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                    </div>
                  </div>
                  <Link to={user.role === "client" ? "/dashboard/workspace" : "/dashboard/admin"} onClick={() => setOpen(false)} className="px-3 py-3 rounded-md hover:bg-muted text-sm font-medium min-h-[48px] flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
                  </Link>
                  <Link to={user.role === "admin" ? "/dashboard/admin/settings" : "/dashboard/workspace/profile"} onClick={() => setOpen(false)} className="px-3 py-3 rounded-md hover:bg-muted text-sm font-medium min-h-[48px] flex items-center gap-2">
                    <User className="h-4 w-4" /> {user.role === "admin" ? (lang === "ar" ? "إعدادات الموقع" : "Site Settings") : (lang === "ar" ? "الملف الشخصي" : "My Profile")}
                  </Link>
                  <button onClick={handleSignOut} className="w-full text-start px-3 py-3 rounded-md hover:bg-destructive/10 text-destructive text-sm font-medium min-h-[48px] flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
                  </button>
                </>
              ) : (
                <Link to="/signin" onClick={() => setOpen(false)} className="px-3 py-3 rounded-md hover:bg-muted text-sm font-medium min-h-[48px] flex items-center gap-2">
                  <LogIn className="h-4 w-4" /> {t("cta.signin")}
                </Link>
              )}
              <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="text-start px-3 py-3 rounded-md hover:bg-muted text-sm font-medium inline-flex items-center gap-2 min-h-[48px] w-full">
                <Globe className="h-4 w-4" /> {lang === "en" ? "العربية" : "English"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
