import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/careers")({
  head: () => ({ meta: [{ title: "Careers — Admin" }] }),
  component: CareersLayout,
});

function CareersLayout() {
  const path = useRouterState({ select: s => s.location.pathname });
  const isJobs = path.endsWith("/jobs") || path.endsWith("/careers");
  const isApps = path.includes("/applications");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Careers</h1>
          <p className="text-sm text-muted-foreground">Manage job postings and the full application workflow.</p>
        </div>
        <div className="inline-flex rounded-lg border bg-card p-1 text-sm">
          <Link to="/dashboard/admin/careers" className={`px-3 py-1.5 rounded-md ${isJobs ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground hover:text-foreground"}`}>Job postings</Link>
          <Link to="/dashboard/admin/careers/applications" className={`px-3 py-1.5 rounded-md ${isApps ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground hover:text-foreground"}`}>Applications</Link>
        </div>
      </div>
      <Outlet />
    </div>
  );
}