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
        scrolled
          ? "bg-[#18181b]/95 backdrop-blur-lg border-b border-white/10 shadow-xl shadow-black/25"
          : "bg-[#1c1c1f]/95 backdrop-blur-md border-b border-white/5"
      )}
    >
      <TopHeader />
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 font-display font-bold min-w-0 group">
          <img src={logo} alt="Integrated Technics" className="h-8 md:h-9 w-auto shrink-0 brightness-110 drop-shadow" />
          <span className="text-sm md:text-base truncate text-white">
            Integrated<span className="text-accent font-extrabold">Technics</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {links.slice(0, 2).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3.5 py-1.5 text-sm font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-all duration-200"
              activeProps={{ className: "bg-accent text-white font-semibold shadow-md shadow-accent/25 hover:bg-accent" }}
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
                className="px-3.5 py-1.5 text-sm font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-all duration-200 inline-flex items-center gap-1"
                activeProps={{ className: "bg-accent text-white font-semibold shadow-md shadow-accent/25 hover:bg-accent" }}
              >
                {t("nav.services")} <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </Link>
              {servicesMega && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[640px] animate-fade-in z-50">
                  <div className="bg-[#1c1c1f] border border-white/10 rounded-2xl shadow-2xl p-4 grid grid-cols-2 gap-2 text-white">
                    {services.map((s) => {
                      const Icon = s.icon;
                      return (
                        <Link
                          key={s.slug}
                          to="/services/$slug"
                          params={{ slug: s.slug }}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                        >
                          <div className="h-9 w-9 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0 group-hover:scale-105 group-hover:bg-accent group-hover:text-white transition-all">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-zinc-100 group-hover:text-accent transition-colors">{s.title[lang]}</div>
                            <div className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{stripHtml(s.desc[lang])}</div>
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
                className="px-3.5 py-1.5 text-sm font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-all duration-200 inline-flex items-center gap-1"
                activeProps={{ className: "bg-accent text-white font-semibold shadow-md shadow-accent/25 hover:bg-accent" }}
              >
                {t("nav.solutions")} <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </Link>
              {solutionsMega && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[680px] animate-fade-in z-50">
                  <div className="bg-[#1c1c1f] border border-white/10 rounded-2xl shadow-2xl p-4 space-y-3 text-white">
                    <div className="grid grid-cols-2 gap-2">
                      {activeSolutions.map((s) => {
                        const firstIcon = s.related_solutions?.[0]?.icon || "Layers";
                        const Icon = getSolutionIcon(firstIcon);
                        return (
                          <Link
                            key={s.slug}
                            to="/solutions/$slug"
                            params={{ slug: s.slug }}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                          >
                            <div className="h-9 w-9 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0 group-hover:scale-105 group-hover:bg-accent group-hover:text-white transition-all">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate text-zinc-100 group-hover:text-accent transition-colors">
                                {lang === "ar" ? s.name_ar || s.name_en : s.name_en}
                              </div>
                              <div className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                                {stripHtml(lang === "ar" ? s.bio_ar || s.bio_en : s.bio_en)}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs px-1">
                      <span className="text-zinc-400">
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
              className="px-3.5 py-1.5 text-sm font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-all duration-200"
              activeProps={{ className: "bg-accent text-white font-semibold shadow-md shadow-accent/25 hover:bg-accent" }}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        {/* CTA & Mobile Hamburger */}
        <div className="flex items-center gap-1 sm:gap-2">
          {contactVisible && (
            <Button asChild variant="default" size="sm" className="hidden md:inline-flex bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/20 font-semibold">
              <Link to="/contact">{t("cta.contact")}</Link>
            </Button>
          )}
          <button
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
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
        <div className="lg:hidden bg-[#18181b] text-white border-t border-white/10 animate-fade-in max-h-[calc(100vh-100px)] overflow-y-auto shadow-2xl">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <Button asChild size="lg" className="h-12 text-sm font-semibold bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/25" onClick={() => setOpen(false)}>
                <Link to="/contact">
                  <FileText className="h-4 w-4 me-1.5" />
                  {lang === "ar" ? "طلب عرض" : "Request Proposal"}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 text-sm font-semibold border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <Link to="/contact">
                  <CalendarClock className="h-4 w-4 me-1.5" />
                  {lang === "ar" ? "حجز استشارة" : "Book Consultation"}
                </Link>
              </Button>
            </div>

            <div>
              <div className="px-3 pb-2 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                {lang === "ar" ? "التنقل" : "Navigate"}
              </div>
              <div className="flex flex-col gap-1">
                {/* Home */}
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="px-3.5 py-3 rounded-lg text-zinc-200 hover:text-white hover:bg-white/5 text-base font-medium min-h-[48px] flex items-center transition-colors"
                  activeProps={{ className: "bg-accent text-white font-semibold shadow-sm hover:bg-accent" }}
                >
                  {t("nav.home")}
                </Link>

                {/* About */}
                <Link
                  to="/about"
                  onClick={() => setOpen(false)}
                  className="px-3.5 py-3 rounded-lg text-zinc-200 hover:text-white hover:bg-white/5 text-base font-medium min-h-[48px] flex items-center transition-colors"
                  activeProps={{ className: "bg-accent text-white font-semibold shadow-sm hover:bg-accent" }}
                >
                  {t("nav.about")}
                </Link>

                {/* Services with Mobile Accordion */}
                {servicesVisible && (
                  <div className="rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between min-h-[48px] hover:bg-white/5 rounded-lg px-3.5">
                      <Link
                        to="/services"
                        onClick={() => setOpen(false)}
                        className="text-base font-medium flex-1 py-3 text-zinc-200 hover:text-white"
                        activeProps={{ className: "text-accent font-semibold" }}
                      >
                        {t("nav.services")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setMobileServicesOpen((o) => !o)}
                        className="p-2 text-zinc-400 hover:text-white"
                        aria-label="Toggle services list"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", mobileServicesOpen && "rotate-180")} />
                      </button>
                    </div>
                    {mobileServicesOpen && (
                      <div className="ps-4 pb-2 space-y-1 bg-[#222226] border border-white/5 rounded-lg mb-2 p-2">
                        {services.map((s) => (
                          <Link
                            key={s.slug}
                            to="/services/$slug"
                            params={{ slug: s.slug }}
                            onClick={() => setOpen(false)}
                            className="px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-md flex items-center gap-2"
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
                  <div className="rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between min-h-[48px] hover:bg-white/5 rounded-lg px-3.5">
                      <Link
                        to="/solutions"
                        onClick={() => setOpen(false)}
                        className="text-base font-medium flex-1 py-3 text-zinc-200 hover:text-white"
                        activeProps={{ className: "text-accent font-semibold" }}
                      >
                        {t("nav.solutions")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setMobileSolutionsOpen((o) => !o)}
                        className="p-2 text-zinc-400 hover:text-white"
                        aria-label="Toggle solutions list"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", mobileSolutionsOpen && "rotate-180")} />
                      </button>
                    </div>
                    {mobileSolutionsOpen && (
                      <div className="ps-4 pb-2 space-y-1 bg-[#222226] border border-white/5 rounded-lg mb-2 p-2">
                        {activeSolutions.map((s) => (
                          <Link
                            key={s.slug}
                            to="/solutions/$slug"
                            params={{ slug: s.slug }}
                            onClick={() => setOpen(false)}
                            className="px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-md flex items-center gap-2"
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
                    className="px-3.5 py-3 rounded-lg text-zinc-200 hover:text-white hover:bg-white/5 text-base font-medium min-h-[48px] flex items-center transition-colors"
                    activeProps={{ className: "bg-accent text-white font-semibold shadow-sm hover:bg-accent" }}
                  >
                    {t("nav.products")}
                  </Link>
                )}

                {/* Projects */}
                {(vis as any).projects !== false && (
                  <Link
                    to="/projects"
                    onClick={() => setOpen(false)}
                    className="px-3.5 py-3 rounded-lg text-zinc-200 hover:text-white hover:bg-white/5 text-base font-medium min-h-[48px] flex items-center transition-colors"
                    activeProps={{ className: "bg-accent text-white font-semibold shadow-sm hover:bg-accent" }}
                  >
                    {t("nav.projects")}
                  </Link>
                )}

                {/* Contact */}
                {contactVisible && (
                  <Link
                    to="/contact"
                    onClick={() => setOpen(false)}
                    className="px-3.5 py-3 rounded-lg text-zinc-200 hover:text-white hover:bg-white/5 text-base font-medium min-h-[48px] flex items-center transition-colors"
                    activeProps={{ className: "bg-accent text-white font-semibold shadow-sm hover:bg-accent" }}
                  >
                    {t("nav.contact")}
                  </Link>
                )}
              </div>
            </div>

            {/* Account / Actions */}
            <div className="pt-2 border-t border-white/10">
              <div className="px-3 pb-2 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                {lang === "ar" ? "الحساب" : "Account"}
              </div>
              <div className="flex flex-col gap-1">
                {settings.headerIcons?.tracking !== false && (
                  <Link
                    to="/track-quote"
                    onClick={() => setOpen(false)}
                    className="px-3.5 py-3 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white text-sm font-medium min-h-[48px] flex items-center gap-2"
                  >
                    <Search className="h-4 w-4 text-accent" /> {lang === "ar" ? "تتبع العرض" : "Track Quote"}
                  </Link>
                )}
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3.5 py-3 bg-[#222226] border border-white/5 rounded-xl">
                      <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {(user.name || user.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate text-white">{user.name || user.email.split("@")[0]}</div>
                        <div className="text-xs text-zinc-400 capitalize">{user.role}</div>
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
                      className="px-3.5 py-3 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white text-sm font-medium min-h-[48px] flex items-center gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4 text-accent" /> {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
                    </Link>
                    {isClientRole(user.role) && (
                      <Link
                        to="/dashboard/workspace/profile"
                        onClick={() => setOpen(false)}
                        className="px-3.5 py-3 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white text-sm font-medium min-h-[48px] flex items-center gap-2"
                      >
                        <User className="h-4 w-4 text-accent" /> {lang === "ar" ? "الملف الشخصي" : "My Profile"}
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link
                        to="/dashboard/admin/settings"
                        onClick={() => setOpen(false)}
                        className="px-3.5 py-3 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white text-sm font-medium min-h-[48px] flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4 text-accent" /> {lang === "ar" ? "إعدادات الموقع" : "Site Settings"}
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-start px-3.5 py-3 rounded-lg hover:bg-red-500/10 text-red-400 text-sm font-medium min-h-[48px] flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
                    </button>
                  </>
                ) : (
                  <Link
                    to="/signin"
                    onClick={() => setOpen(false)}
                    className="px-3.5 py-3 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white text-sm font-medium min-h-[48px] flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4 text-accent" /> {t("cta.signin")}
                  </Link>
                )}
                <button
                  onClick={() => setLang(lang === "en" ? "ar" : "en")}
                  className="text-start px-3.5 py-3 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white text-sm font-medium inline-flex items-center gap-2 min-h-[48px] w-full"
                >
                  <Globe className="h-4 w-4 text-accent" /> {lang === "en" ? "العربية" : "English"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
