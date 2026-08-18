import { Mail, Phone, Globe, LogIn, Search, LogOut, User, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-store";
import { MiniCart } from "./MiniCart";
import { trackCta } from "@/lib/cta-tracking";
import { RequestProposalDialog } from "./RequestProposalDialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export function TopHeader() {
  const { lang, setLang, dir, t } = useI18n();
  const [proposalOpen, setProposalOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { settings } = useSettings();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const telHref = `tel:${settings.phone.replace(/\s+/g, "")}`;

  const initials = user
    ? (user.name || user.email).slice(0, 2).toUpperCase()
    : "";

  const handleSignOut = () => {
    setAvatarOpen(false);
    signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="bg-primary text-primary-foreground text-[11px] sm:text-xs">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 min-h-9 py-1.5 flex items-center justify-between gap-x-2 sm:gap-x-3">
        <div className="flex items-center gap-2 sm:gap-5 min-w-0 shrink-0">
          <a href={`mailto:${settings.email}`} className="hidden sm:inline-flex items-center gap-1.5 hover:text-accent transition-colors min-h-[32px]">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[140px] lg:max-w-none">{settings.email}</span>
          </a>
          <a href={telHref} className="inline-flex items-center gap-1.5 hover:text-accent transition-colors min-h-[32px]">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span dir="ltr">{settings.phone}</span>
          </a>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 ms-auto shrink-0">
          {settings.headerIcons?.tracking !== false && (
            <Link to="/track-quote" className="inline-flex items-center gap-1 hover:text-accent transition-colors min-h-[32px] px-1">
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{lang === "ar" ? "تتبع العرض" : "Track Quote"}</span>
            </Link>
          )}
          {settings.headerIcons?.cart !== false && <MiniCart />}
          <div role="group" aria-label="Language switcher" className="inline-flex items-center rounded-md border border-primary-foreground/30 overflow-hidden">
            <Globe className="h-3.5 w-3.5 mx-1 opacity-80 hidden sm:inline" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              aria-label="Switch to English"
              className={cn("px-1.5 sm:px-2 py-0.5 text-[11px] font-semibold transition-colors min-h-[24px]", lang === "en" ? "bg-accent text-accent-foreground" : "hover:bg-primary-foreground/10")}
            >EN</button>
            <button
              type="button"
              onClick={() => setLang("ar")}
              aria-pressed={lang === "ar"}
              aria-label="التبديل إلى العربية"
              className={cn("px-1.5 sm:px-2 py-0.5 text-[11px] font-semibold transition-colors min-h-[24px]", lang === "ar" ? "bg-accent text-accent-foreground" : "hover:bg-primary-foreground/10")}
            >AR</button>
          </div>

          {/* Auth: avatar dropdown when logged in, sign-in link when not */}
          {user ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAvatarOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full focus:outline-none min-h-[32px] px-1"
                aria-label={user.name || user.email}
                aria-expanded={avatarOpen}
              >
                <div className="h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[10px] font-bold shrink-0 ring-2 ring-primary-foreground/30">
                  {initials}
                </div>
                <span className="hidden md:inline max-w-[96px] truncate font-semibold text-[11px]">
                  {user.name || user.email.split("@")[0]}
                </span>
              </button>

              {avatarOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} />
                  <div className="absolute end-0 top-full mt-2 z-50 min-w-[180px] rounded-xl border bg-popover text-popover-foreground shadow-lg py-1.5 animate-fade-in">
                    <div className="px-3 py-2 border-b">
                      <div className="font-semibold text-xs truncate">{user.name || user.email.split("@")[0]}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
                      <div className="text-[10px] text-accent capitalize mt-0.5">{user.role}</div>
                    </div>
                    <Link
                      to={user.role === "client" ? "/dashboard/workspace" : "/dashboard/admin"}
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
                    </Link>
                    <Link
                      to={user.role === "admin" ? "/dashboard/admin/settings" : "/dashboard/workspace/profile"}
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
                    >
                      <User className="h-3.5 w-3.5" />
                      {user.role === "admin"
                        ? (lang === "ar" ? "إعدادات الموقع" : "Site Settings")
                        : (lang === "ar" ? "الملف الشخصي" : "My Profile")}
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/signin" className="hidden sm:inline-flex items-center gap-1 hover:text-accent transition-colors min-h-[32px] px-1">
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("cta.signin")}</span>
            </Link>
          )}
        </div>
      </div>
      <RequestProposalDialog
        open={proposalOpen}
        onOpenChange={setProposalOpen}
        lang={lang}
        dir={dir}
        source="top_header_request_proposal"
      />
    </div>
  );
}
