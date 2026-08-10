import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { resolveAdminPage, useCanAccess, type PermAction } from "@/lib/permissions-store";

/** Permissions for the admin page matching the current route. */
export function useCurrentPagePerms() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const resolved = resolveAdminPage(pathname);
  return useCanAccess(resolved?.pageKey ?? "__unknown__");
}

/**
 * Renders children only when the signed-in user has `action` on the current
 * admin page. Use around add / edit / delete controls so write affordances
 * disappear for view-only users.
 */
export function Can({
  action,
  children,
  fallback = null,
}: {
  action: PermAction;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const perms = useCurrentPagePerms();
  return <>{perms[action] ? children : fallback}</>;
}