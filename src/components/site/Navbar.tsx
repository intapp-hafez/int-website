import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Globe,
  FileText,
  CalendarClock,
  Search,
  LogIn,
  LogOut,
  LayoutDashboard,
  User,
  Settings,
  Layers,
  Briefcase,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { services } from "@/data/site";
import { useSolutions, getSolutionIcon, stripHtml } from "@/lib/solutions-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TopHeader } from "./TopHeader";
import { useSettings } from "@/lib/settings-store";
import { useAuth, isClientRole } from "@/lib/auth";
import logo from "@/assets/logo.png";

const allLinks: { to: string; key: any; page: string }[] = [
  { to: "/", key: "nav.home", page: "home" },
  { to: "/about", key: "nav.about", page: "about" },
  { to: "/products", key: "nav.products", page: "products" },
  { to: "/projects", key: "nav.projects", page: "projects" },
];

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { settings } = useSettings();
  const { user, signOut } = useAuth();
  const { solutions } = useSolutions();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesMega, setServicesMega] = useState(false);
  const [solutionsMega, setSolutionsMega] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);

  const vis = settings.visibility;
  const links = allLinks.filter((l) => (vis as any)[l.page] !== false);
  const servicesVisible = vis.services !== false;
  const solutionsVisible = (vis as any).solutions !== false;
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

  const activeSolutions = solutions.filter((s) => s.active !== false);

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
          <span className="text-sm md:text-base truncate">
            Integrated<span className="text-accent">Technics</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.slice(0, 2).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
              activeProps={{ className: "text-accent" }}
              activeOptions={{ exact: true }}
            >
              {t(l.key)}
            </Link>
          ))}

          {/* Services Dropdown */}
          {servicesVisible && (
            <div
              className="relative"
              onMouseEnter={() => setServicesMega(true)}
              onMouseLeave={() => setServicesMega(false)}
            >
              <Link
                to="/services"
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors inline-flex items-center gap-1"
                activeProps={{ className: "text-accent" }}
              >
                {t("nav.services")} <ChevronDown className="h-3.5 w-3.5" />
              </Link>
              {servicesMega && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[640px] animate-fade-in z-50">
                  <div className="bg-popover border rounded-xl shadow-elegant p-4 grid grid-cols-2 gap-2">
                    {services.map((s) => {
                      const Icon = s.icon;
                      return (
                        <Link
                          key={s.slug}
                          to="/services/$slug"
                          params={{ slug: s.slug }}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                        >
                          <div className="h-9 w-9 rounded-md gradient-hero flex items-center justify-center text-primary-foreground shrink-0 group-hover:scale-105 transition-transform">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-sm group-hover:text-accent transition-colors">{s.title[lang]}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{stripHtml(s.desc[lang])}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Solutions Dropdown Menu */}
          {solutionsVisible && (
            <div
              className="relative"
              onMouseEnter={() => setSolutionsMega(true)}
              onMouseLeave={() => setSolutionsMega(false)}
            >
              <Link
                to="/solutions"
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors inline-flex items-center gap-1"
                activeProps={{ className: "text-accent" }}
              >
                {t("nav.solutions")} <ChevronDown className="h-3.5 w-3.5" />
              </Link>
              {solutionsMega && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[680px] animate-fade-in z-50">
                  <div className="bg-popover border rounded-xl shadow-elegant p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {activeSolutions.map((s) => {
                        const firstIcon = s.related_solutions?.[0]?.icon || "Layers";
                        const Icon = getSolutionIcon(firstIcon);
                        return (
                          <Link
                            key={s.slug}
                            to="/solutions/$slug"
                            params={{ slug: s.slug }}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                          >
                            <div className="h-9 w-9 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate group-hover:text-accent transition-colors">
                                {lang === "ar" ? s.name_ar || s.name_en : s.name_en}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {stripHtml(lang === "ar" ? s.bio_ar || s.bio_en : s.bio_en)}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="pt-2.5 border-t flex items-center justify-between text-xs px-1">
                      <span className="text-muted-foreground">
                        {lang === "ar" ? "منظومات وتقنيات متكاملة للمؤسسات" : "Engineered systems & architectures"}
                      </span>
                      <Link to="/solutions" className="text-accent font-semibold hover:underline flex items-center gap-1">
                        <span>{lang === "ar" ? "عرض جميع الحلول ←" : "View all solutions →"}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {links.slice(2).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
              activeProps={{ className: "text-accent" }}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        {/* CTA & Mobile Hamburger */}
        <div className="flex items-center gap-1 sm:gap-2">
          {contactVisible && (
            <Button asChild variant="default" size="sm" className="hidden md:inline-flex">
              <Link to="/contact">{t("cta.contact")}</Link>
            </Button>
          )}
          <button
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {open && (
        <div className="lg:hidden bg-background border-t animate-fade-in max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <Button asChild size="lg" className="h-12 text-sm font-semibold" onClick={() => setOpen(false)}>
                <Link to="/contact">
                  <FileText className="h-4 w-4 me-1.5" />
                  {lang === "ar" ? "طلب عرض" : "Request Proposal"}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 text-sm font-semibold"
                onClick={() => setOpen(false)}
              >
                <Link to="/contact">
                  <CalendarClock className="h-4 w-4 me-1.5" />
                  {lang === "ar" ? "حجز استشارة" : "Book Consultation"}
                </Link>
              </Button>
            </div>

            <div>
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {lang === "ar" ? "التنقل" : "Navigate"}
              </div>
              <div className="flex flex-col">
                {/* Home */}
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-md hover:bg-muted text-base font-medium min-h-[48px] flex items-center border-b border-border/50"
                  activeProps={{ className: "bg-muted text-accent" }}
                >
                  {t("nav.home")}
                </Link>

                {/* About */}
                <Link
                  to="/about"
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-md hover:bg-muted text-base font-medium min-h-[48px] flex items-center border-b border-border/50"
                  activeProps={{ className: "bg-muted text-accent" }}
                >
                  {t("nav.about")}
                </Link>

                {/* Services with Mobile Accordion */}
                {servicesVisible && (
                  <div className="border-b border-border/50">
                    <div className="flex items-center justify-between min-h-[48px] hover:bg-muted rounded-md px-3">
                      <Link
                        to="/services"
                        onClick={() => setOpen(false)}
                        className="text-base font-medium flex-1 py-3"
                      >
                        {t("nav.services")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setMobileServicesOpen((o) => !o)}
                        className="p-2 text-muted-foreground hover:text-foreground"
                        aria-label="Toggle services list"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", mobileServicesOpen && "rotate-180")} />
                      </button>
                    </div>
                    {mobileServicesOpen && (
                      <div className="ps-4 pb-2 space-y-1 bg-muted/30 rounded-lg mb-2">
                        {services.map((s) => (
                          <Link
                            key={s.slug}
                            to="/services/$slug"
                            params={{ slug: s.slug }}
                            onClick={() => setOpen(false)}
                            className="px-3 py-2 text-sm text-muted-foreground hover:text-accent flex items-center gap-2"
                          >
                            <ChevronRight className="h-3 w-3 rtl:rotate-180 text-accent" />
                            <span>{s.title[lang]}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Solutions with Mobile Accordion */}
                {solutionsVisible && (
                  <div className="border-b border-border/50">
                    <div className="flex items-center justify-between min-h-[48px] hover:bg-muted rounded-md px-3">
                      <Link
                        to="/solutions"
                        onClick={() => setOpen(false)}
                        className="text-base font-medium flex-1 py-3"
                      >
                        {t("nav.solutions")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setMobileSolutionsOpen((o) => !o)}
                        className="p-2 text-muted-foreground hover:text-foreground"
                        aria-label="Toggle solutions list"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", mobileSolutionsOpen && "rotate-180")} />
                      </button>
                    </div>
                    {mobileSolutionsOpen && (
                      <div className="ps-4 pb-2 space-y-1 bg-muted/30 rounded-lg mb-2">
                        {activeSolutions.map((s) => (
                          <Link
                            key={s.slug}
                            to="/solutions/$slug"
                            params={{ slug: s.slug }}
                            onClick={() => setOpen(false)}
                            className="px-3 py-2 text-sm text-muted-foreground hover:text-accent flex items-center gap-2"
                          >
                            <ChevronRight className="h-3 w-3 rtl:rotate-180 text-accent" />
                            <span>{lang === "ar" ? s.name_ar || s.name_en : s.name_en}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Products */}
                {(vis as any).products !== false && (
                  <Link
                    to="/products"
                    onClick={() => setOpen(false)}
                    className="px-3 py-3 rounded-md hover:bg-muted text-base font-medium min-h-[48px] flex items-center border-b border-border/50"
                    activeProps={{ className: "bg-muted text-accent" }}
                  >
                    {t("nav.products")}
                  </Link>
                )}

                {/* Projects */}
                {(vis as any).projects !== false && (
                  <Link
                    to="/projects"
                    onClick={() => setOpen(false)}
                    className="px-3 py-3 rounded-md hover:bg-muted text-base font-medium min-h-[48px] flex items-center border-b border-border/50"
                    activeProps={{ className: "bg-muted text-accent" }}
                  >
                    {t("nav.projects")}
                  </Link>
                )}

                {/* Contact */}
                {contactVisible && (
                  <Link
                    to="/contact"
                    onClick={() => setOpen(false)}
                    className="px-3 py-3 rounded-md hover:bg-muted text-base font-medium min-h-[48px] flex items-center"
                    activeProps={{ className: "bg-muted text-accent" }}
                  >
                    {t("nav.contact")}
                  </Link>
                )}
              </div>
            </div>

            {/* Account / Actions */}
            <div>
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {lang === "ar" ? "الحساب" : "Account"}
              </div>
              {settings.headerIcons?.tracking !== false && (
                <Link
                  to="/track-quote"
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-md hover:bg-muted text-sm font-medium min-h-[48px] flex items-center gap-2"
                >
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
                  <Link
                    to={
                      isClientRole(user.role)
                        ? "/dashboard/workspace"
                        : user.role === "hr"
                        ? "/dashboard/admin/careers"
                        : "/dashboard/admin"
                    }
                    onClick={() => setOpen(false)}
                    className="px-3 py-3 rounded-md hover:bg-muted text-sm font-medium min-h-[48px] flex items-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" /> {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
                  </Link>
                  {isClientRole(user.role) && (
                    <Link
                      to="/dashboard/workspace/profile"
                      onClick={() => setOpen(false)}
                      className="px-3 py-3 rounded-md hover:bg-muted text-sm font-medium min-h-[48px] flex items-center gap-2"
                    >
                      <User className="h-4 w-4" /> {lang === "ar" ? "الملف الشخصي" : "My Profile"}
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link
                      to="/dashboard/admin/settings"
                      onClick={() => setOpen(false)}
                      className="px-3 py-3 rounded-md hover:bg-muted text-sm font-medium min-h-[48px] flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" /> {lang === "ar" ? "إعدادات الموقع" : "Site Settings"}
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-start px-3 py-3 rounded-md hover:bg-destructive/10 text-destructive text-sm font-medium min-h-[48px] flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
                  </button>
                </>
              ) : (
                <Link
                  to="/signin"
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-md hover:bg-muted text-sm font-medium min-h-[48px] flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" /> {t("cta.signin")}
                </Link>
              )}
              <button
                onClick={() => setLang(lang === "en" ? "ar" : "en")}
                className="text-start px-3 py-3 rounded-md hover:bg-muted text-sm font-medium inline-flex items-center gap-2 min-h-[48px] w-full"
              >
                <Globe className="h-4 w-4" /> {lang === "en" ? "العربية" : "English"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
