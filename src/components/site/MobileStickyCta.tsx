import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { FileText, CalendarClock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trackCta } from "@/lib/cta-tracking";
import { RequestProposalDialog } from "./RequestProposalDialog";

/**
 * Mobile-only sticky CTA bar with Request Proposal + Book Consultation.
 * Appears after the user scrolls past ~40% of the viewport, hides near the
 * bottom of the page so it never covers the footer, and stays clear of the
 * bottom nav via safe-area + 4rem offset.
 */
export function MobileStickyCta() {
  const { lang, dir } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const pastTrigger = y > vh * 0.4;
      const nearBottom = y + vh >= docH - 120; // leave room for footer/bottom nav
      setVisible(pastTrigger && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  if (pathname.startsWith("/dashboard")) return null;
  if (pathname === "/contact" || pathname.startsWith("/contact/")) return null;

  return (
    <>
    <div
      aria-hidden={!visible}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4rem)" }}
      className={`lg:hidden fixed inset-x-0 z-30 px-3 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div
        role="region"
        aria-label={lang === "ar" ? "إجراءات سريعة" : "Quick actions"}
        className="mx-auto max-w-md rounded-2xl border bg-card/95 backdrop-blur shadow-elegant p-2 grid grid-cols-2 gap-2"
      >
        <button
          type="button"
          onClick={() => {
            trackCta("request_proposal");
            setOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground px-3 h-11 text-sm font-semibold hover:brightness-110 transition"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span>{lang === "ar" ? "طلب عرض" : "Request Proposal"}</span>
        </button>
        <Link
          to="/contact"
          onClick={() => trackCta("book_consultation")}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border bg-background px-3 h-11 text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
          <span>{lang === "ar" ? "حجز استشارة" : "Book Consultation"}</span>
        </Link>
      </div>
    </div>
    <RequestProposalDialog open={open} onOpenChange={setOpen} lang={lang} dir={dir} />
    </>
  );
}
