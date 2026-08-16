import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  useRouter,
  useRouterState,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { SettingsProvider } from "@/lib/settings-store";
import { AboutProvider } from "@/lib/about-store";
import { ProjectsProvider } from "@/lib/projects-store";
import { PermissionsProvider } from "@/lib/permissions-store";
import { AccessRequestsProvider } from "@/lib/access-requests";
import { SlidesProvider } from "@/lib/slides-store";
import { NewsProvider } from "@/lib/news-store";
import { PartnersProvider } from "@/lib/partners-store";
import { RecommendationsProvider } from "@/lib/recommendations-store";
import { NotificationsProvider } from "@/lib/notifications-store";
import { CartProvider } from "@/lib/cart";
import { useSettings, type PageKey } from "@/lib/settings-store";
import { useI18n } from "@/lib/i18n";
import { Section } from "@/components/site/Section";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFloat } from "@/components/site/WhatsApp";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { Chatbot } from "@/components/site/Chatbot";
import { InstallPrompt } from "@/components/site/InstallPrompt";
import { MobileStickyDock } from "@/components/site/MobileStickyDock";
import { MobileStickyCta } from "@/components/site/MobileStickyCta";
import { SeoHead } from "@/components/site/SeoHead";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Integrated Technics — Enterprise Security & ICT Integrator" },
      { name: "description", content: "Turnkey security, ICT, AV and data center integration for enterprises across the region." },
      { name: "author", content: "Integrated Technics" },
      { property: "og:title", content: "Integrated Technics — Enterprise Security & ICT Integrator" },
      { property: "og:description", content: "Turnkey security, ICT, AV and data center integration for enterprises across the region." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@IntegratedTechnics" },
      { name: "theme-color", content: "#0b0f1a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "IT Technics" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icons/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icons/icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

import { IndustriesProvider } from "@/lib/industries-store";
import { ServicesProvider } from "@/lib/services-store";
import { FaqsProvider } from "@/lib/faqs-store";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useHashScroll();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <SettingsProvider>
          <AboutProvider>
          <ProjectsProvider>
          <IndustriesProvider>
          <ServicesProvider>
          <FaqsProvider>
          <PermissionsProvider>
          <AccessRequestsProvider>
          <SlidesProvider>
          <PartnersProvider>
          <RecommendationsProvider>
          <AuthProvider>
          <NotificationsProvider>
          <CartProvider>
          <NewsProvider>
            <Navbar />
            <main className="min-h-screen pt-[104px] md:pt-[100px] pb-20 lg:pb-0">
              <VisibilityGuard>
                <Outlet />
              </VisibilityGuard>
            </main>
            <ConditionalFooter />
            <WhatsAppFloat />
            <MobileBottomNav />
            <Chatbot />
            <InstallPrompt />
            <MobileStickyDock />
            <MobileStickyCta />
            <SeoHead />
            <Toaster />
          </NewsProvider>
          </CartProvider>
          </NotificationsProvider>
          </AuthProvider>
          </RecommendationsProvider>
          </PartnersProvider>
          </SlidesProvider>
          </AccessRequestsProvider>
          </PermissionsProvider>
          </FaqsProvider>
          </ServicesProvider>
          </IndustriesProvider>
          </ProjectsProvider>
          </AboutProvider>
        </SettingsProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

function ConditionalFooter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inDashboard = pathname.startsWith("/dashboard");
  return (
    <div className={inDashboard ? "hidden lg:block" : "hidden lg:block"}>
      <Footer />
    </div>
  );
}

const PATH_PAGE_MAP: { test: (p: string) => boolean; key: PageKey }[] = [
  { test: (p) => p === "/", key: "home" },
  { test: (p) => p === "/about" || p.startsWith("/about/"), key: "about" },
  { test: (p) => p === "/services" || p.startsWith("/services/"), key: "services" },
  { test: (p) => p === "/shop" || p.startsWith("/shop/"), key: "shop" },
  { test: (p) => p === "/projects" || p.startsWith("/projects/"), key: "projects" },
  { test: (p) => p === "/industries" || p.startsWith("/industries/"), key: "industries" },
  { test: (p) => p === "/careers" || p.startsWith("/careers/"), key: "careers" },
  { test: (p) => p === "/news" || p.startsWith("/news/"), key: "news" },
  { test: (p) => p === "/partners" || p.startsWith("/partners/"), key: "partners" },
  { test: (p) => p === "/contact" || p.startsWith("/contact/"), key: "contact" },
];

function VisibilityGuard({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { settings } = useSettings();
  const { lang } = useI18n();
  const router = useRouter();

  const match = PATH_PAGE_MAP.find((m) => m.test(pathname));
  const disabled = !!match && settings.visibility?.[match.key] === false;
  const isHomeDisabled = match?.key === "home" && disabled;

  useEffect(() => {
    if (disabled && !isHomeDisabled) {
      router.navigate({ to: "/", replace: true });
    }
  }, [disabled, isHomeDisabled, router]);

  if (disabled) {
    return (
      <Section className="py-24 text-center">
        <h1 className="text-3xl font-semibold mb-2">
          {lang === "ar" ? "الصفحة غير متاحة" : "Page not available"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "هذه الصفحة معطلة حاليًا من قِبَل المسؤول."
            : "This page is currently disabled by the administrator."}
        </p>
      </Section>
    );
  }

  return <>{children}</>;
}

function useHashScroll() {
  const hash = useRouterState({ select: (s) => s.location.hash });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = hash || window.location.hash.replace(/^#/, "");
    if (!id) return;
    const scroll = () => {
      const el = document.getElementById(id);
      if (!el) return false;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      return true;
    };
    if (scroll()) return;
    let tries = 0;
    const iv = window.setInterval(() => {
      if (scroll() || ++tries > 20) window.clearInterval(iv);
    }, 100);
    return () => window.clearInterval(iv);
  }, [hash]);
}
