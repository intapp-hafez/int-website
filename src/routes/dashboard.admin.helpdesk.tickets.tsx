import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/helpdesk/tickets")({
  component: () => <Outlet />,
});