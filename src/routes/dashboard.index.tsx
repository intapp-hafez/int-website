import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, isClientRole } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions-store";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { user } = useAuth();
  const { getUserPerms } = usePermissions();
  if (!user) return null; // parent handles redirect

  const isClient = isClientRole(user.role);
  if (isClient) {
    return <Navigate to="/dashboard/workspace" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  const perms = getUserPerms(user.id);
  if (perms?.overview?.view) {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (user.role === "hr" || perms?.careers?.view) {
    return <Navigate to="/dashboard/admin/careers" replace />;
  }

  return <Navigate to="/dashboard/admin" replace />;
}
