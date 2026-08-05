import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSettings, type PageKey } from "@/lib/settings-store";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";

type Props = {
  pageKey: PageKey;
  children: ReactNode;
  /** When true, redirect to home instead of rendering a 404. Default: true */
  redirect?: boolean;
};

/**
 * Client-side visibility guard. Pages toggled off in Admin → Settings →
 * Page Visibility are hidden from the site: visiting them either redirects
 * to the home page or renders a 404-style message.
 */
export function PageGate({ pageKey, children, redirect = true }: Props) {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const enabled = settings.visibility?.[pageKey] !== false;

  useEffect(() => {
    if (!enabled && redirect) {
      navigate({ to: "/", replace: true });
    }
  }, [enabled, redirect, navigate]);

  if (!enabled) {
    return (
      <Section className="py-24 text-center">
        <h1 className="text-3xl font-semibold mb-2">
          {lang === "ar" ? "الصفحة غير متاحة" : "Page not available"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "هذه الصفحة معطلة حاليًا. يتم تحويلك إلى الصفحة الرئيسية…"
            : "This page is currently disabled. Redirecting you home…"}
        </p>
      </Section>
    );
  }

  return <>{children}</>;
}