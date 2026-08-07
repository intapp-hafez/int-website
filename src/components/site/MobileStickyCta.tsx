import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { FileText, CalendarClock, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trackCta } from "@/lib/cta-tracking";
import { useSettings } from "@/lib/settings-store";
import { RequestProposalDialog } from "./RequestProposalDialog";

/**
 * Desktop-only sticky CTA bar with Request Proposal + Book Consultation.
 * Positioned next to the WhatsApp/sticky icons.
 */
export function MobileStickyCta() {
  const { lang, dir } = useI18n();
  const { settings } = useSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) {
      const timer = setTimeout(() => {
        setDismissed(false);
      }, 120000); // 2 minutes
      return () => clearTimeout(timer);
    }
  }, [dismissed]);

  if (pathname.startsWith("/dashboard")) return null;
  if (pathname === "/contact" || pathname.startsWith("/contact/")) return null;

  const side = settings.sticky.side === "start" ? "start-4 lg:start-6" : "end-4 lg:end-6";
  const align = settings.sticky.side === "start" ? "items-start" : "items-end";

  return (
    <>
    {!dismissed && (
      <div className={`hidden lg:flex flex-col gap-3 ${align} fixed ${side} bottom-40 lg:bottom-[168px] z-30 transition-all duration-300`}>
        <button
          onClick={() => setDismissed(true)}
          aria-label={lang === "ar" ? "إخفاء" : "Dismiss"}
          className="h-6 w-6 rounded-full bg-card shadow-elegant border flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div
          role="region"
          aria-label={lang === "ar" ? "إجراءات سريعة" : "Quick actions"}
          className="flex flex-col gap-3"
        >
          <button
            type="button"
            onClick={() => {
              trackCta("request_proposal");
              setOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent text-accent-foreground px-5 h-12 text-sm font-semibold shadow-elegant hover:brightness-110 transition"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>{lang === "ar" ? "طلب عرض" : "Request Proposal"}</span>
          </button>
          <Link
            to="/contact"
            onClick={() => trackCta("book_consultation")}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border bg-card/95 backdrop-blur px-5 h-12 text-sm font-semibold shadow-elegant hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            <span>{lang === "ar" ? "حجز استشارة" : "Book Consultation"}</span>
          </Link>
        </div>
      </div>
    )}
    <RequestProposalDialog open={open} onOpenChange={setOpen} lang={lang} dir={dir} />
    </>
  );
}
