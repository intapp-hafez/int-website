import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { MessageCircle, Download, Plus, X } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { useI18n } from "@/lib/i18n";
import { triggerInstallPrompt } from "@/components/site/InstallPrompt";

/**
 * Single expandable FAB shown only on mobile, sitting above the bottom nav
 * (bottom-24) so it never overlaps primary CTAs. Groups WhatsApp + Install
 * behind one trigger. Desktop keeps the individual pills untouched.
 */
export function MobileStickyDock() {
  const { settings } = useSettings();
  const { lang, dir } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);

  // When opening, move focus to the first item; when closing via keyboard, return to trigger.
  useEffect(() => {
    if (open) {
      itemsRef.current[0]?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus trap: keep Tab / Shift+Tab cycling inside the open menu.
  const handleItemTab = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== "Tab") return;
    const focusables = itemsRef.current.filter(Boolean) as HTMLButtonElement[];
    if (focusables.length === 0) return;
    if (e.shiftKey && idx === 0) {
      e.preventDefault();
      focusables[focusables.length - 1].focus();
    } else if (!e.shiftKey && idx === focusables.length - 1) {
      e.preventDefault();
      focusables[0].focus();
    }
  };

  if (pathname.startsWith("/dashboard")) return null;
  const cfg = settings.sticky;
  if (!cfg.mobileCollapse) return null;

  const items = [
    cfg.whatsapp.enabled && {
      key: "wa",
      label: cfg.whatsapp.text[lang] || cfg.whatsapp.text.en,
      icon: <MessageCircle className="h-4 w-4" />,
      onClick: () => {
        const num = settings.whatsapp.replace(/[^\d]/g, "");
        window.open(`https://wa.me/${num}`, "_blank", "noopener,noreferrer");
        setOpen(false);
      },
      cls: "bg-[#25D366] text-white",
    },
    cfg.install.enabled && {
      key: "install",
      label: cfg.install.text[lang] || cfg.install.text.en,
      icon: <Download className="h-4 w-4" />,
      onClick: () => {
        triggerInstallPrompt();
        setOpen(false);
      },
      cls: "bg-card text-foreground border",
    },
  ].filter(Boolean) as { key: string; label: string; icon: ReactNode; onClick: () => void; cls: string }[];

  if (items.length === 0) return null;

  const moveFocus = (from: number, delta: number) => {
    const next = (from + delta + items.length) % items.length;
    itemsRef.current[next]?.focus();
  };

  // On mobile, force the dock to the START side so it never overlaps the
  // chat button (always END) or the primary CTA area. Sit clearly above the
  // bottom nav (~64px + safe-area) with generous clearance.
  return (
    <div
      dir={dir}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}
      className="lg:hidden fixed start-4 z-40 flex flex-col items-start gap-2"
    >
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={lang === "ar" ? "خيارات التواصل" : "Contact options"}
          className="flex flex-col items-start gap-2"
        >
          {items.map((it, idx) => (
            <button
              key={it.key}
              ref={(el) => {
                itemsRef.current[idx] = el;
              }}
              role="menuitem"
              onClick={it.onClick}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  e.preventDefault();
                  moveFocus(idx, 1);
                } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  moveFocus(idx, -1);
                } else if (e.key === "Home") {
                  e.preventDefault();
                  itemsRef.current[0]?.focus();
                } else if (e.key === "End") {
                  e.preventDefault();
                  itemsRef.current[items.length - 1]?.focus();
                } else if (e.key === "Tab") {
                  handleItemTab(e, idx);
                }
              }}
              aria-label={it.label}
              className={`inline-flex items-center gap-2 rounded-full ${it.cls} shadow-elegant px-3 h-10 text-xs font-medium animate-fade-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
            >
              {it.icon}
              <span className="whitespace-nowrap">{it.label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? (lang === "ar" ? "إغلاق قائمة التواصل" : "Close contact menu") : lang === "ar" ? "فتح قائمة التواصل" : "Open contact menu"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-elegant flex items-center justify-center hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  );
}