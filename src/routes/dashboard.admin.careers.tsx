import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCanAccess } from "@/lib/permissions-store";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/careers")({
  head: () => ({ meta: [{ title: "Careers — Admin" }] }),
  component: CareersLayout,
});

export function AccessDenied({ what }: { what?: string }) {
  const { lang } = useAdminT();
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-2">
        <ShieldAlert className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-sm font-medium">
          {lang === "ar" ? "لا تملك صلاحية الوصول" : "You don't have access"}
        </p>
        <p className="text-xs text-muted-foreground">
          {lang === "ar"
            ? `اطلب من المدير منحك صلاحية ${what ?? "هذه الصفحة"}.`
            : `Ask an administrator to grant you access to ${what ?? "this page"}.`}
        </p>
      </CardContent>
    </Card>
  );
}

function CareersLayout() {
  const path = useRouterState({ select: s => s.location.pathname });
  const jobs = useCanAccess("careers");
  const apps = useCanAccess("careers_applications");
  const analytics = useCanAccess("careers_analytics");
  const isApps = path.includes("/applications");
  const isAnalytics = path.includes("/analytics");
  const isJobs = !isApps && !isAnalytics;

  const tab = (active: boolean) =>
    `px-3 py-1.5 rounded-md ${active ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Careers</h1>
          <p className="text-sm text-muted-foreground">Manage job postings and the full application workflow.</p>
        </div>
        <div className="inline-flex rounded-lg border bg-card p-1 text-sm">
          {jobs.view && <Link to="/dashboard/admin/careers" className={tab(isJobs)}>Job postings</Link>}
          {apps.view && <Link to="/dashboard/admin/careers/applications" className={tab(isApps)}>Applications</Link>}
          {analytics.view && <Link to="/dashboard/admin/careers/analytics" className={tab(isAnalytics)}>Analytics</Link>}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
