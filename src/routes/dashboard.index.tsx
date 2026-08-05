import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { user } = useAuth();
  if (!user) return null; // parent handles redirect
  return <Navigate to={user.role === "admin" ? "/dashboard/admin" : "/dashboard/workspace"} replace />;
}
