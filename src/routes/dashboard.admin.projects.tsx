import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/projects")({
  component: () => <Outlet />,
});
