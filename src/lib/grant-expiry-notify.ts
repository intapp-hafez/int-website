import { useEffect, useRef } from "react";
import { useNotifications } from "@/lib/notifications-store";
import { usePermissions, type AccessGrant } from "@/lib/permissions-store";
import { ADMIN_PAGES } from "@/lib/permissions-store";

const SEEN_KEY = "it_grant_expiry_notified_v1";
/** Warn this long before a grant expires. */
export const EXPIRY_WARN_MS = 24 * 60 * 60 * 1000;

type SeenMap = Record<string, { warned?: boolean; expired?: boolean }>;

const readSeen = (): SeenMap => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") as SeenMap;
  } catch {
    return {};
  }
};
const writeSeen = (m: SeenMap) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(m));
  } catch {}
};

export const pageLabel = (key: string, ar: boolean) => {
  const p = ADMIN_PAGES.find((x) => x.key === key);
  return p ? (ar ? p.ar : p.en) : key;
};

/**
 * Watches active time-limited grants and raises admin notifications when one is
 * about to expire (within 24h) and again once it has expired. Each grant fires
 * at most one notification of each kind, tracked in localStorage.
 */
export function useGrantExpiryNotifier(ar: boolean) {
  const { grants } = usePermissions();
  const { add } = useNotifications();
  const known = useRef<Map<string, AccessGrant>>(new Map());

  useEffect(() => {
    for (const g of grants) known.current.set(g.id, g);

    const run = () => {
      const now = Date.now();
      const seen = readSeen();
      let dirty = false;
      const activeIds = new Set(grants.map((g) => g.id));

      // Expiring soon
      for (const g of grants) {
        if (!g.expiresAt) continue;
        const left = new Date(g.expiresAt).getTime() - now;
        if (left > 0 && left <= EXPIRY_WARN_MS && !seen[g.id]?.warned) {
          seen[g.id] = { ...seen[g.id], warned: true };
          dirty = true;
          const hours = Math.max(1, Math.round(left / 3_600_000));
          void add({
            type: "system",
            priority: "important",
            title: ar ? "صلاحية مؤقتة على وشك الانتهاء" : "Temporary access expiring soon",
            message: ar
              ? `صلاحية "${pageLabel(g.pageKey, true)}" للمستخدم ${g.userId} تنتهي خلال ${hours} ساعة.`
              : `Access to "${pageLabel(g.pageKey, false)}" for ${g.userId} expires in ${hours}h.`,
            href: "/dashboard/admin/permissions",
          });
        }
      }

      // Expired: previously known grants no longer active with a past expiry
      for (const [id, g] of known.current) {
        if (activeIds.has(id) || !g.expiresAt) continue;
        if (new Date(g.expiresAt).getTime() > now) continue;
        if (seen[id]?.expired) continue;
        seen[id] = { ...seen[id], expired: true };
        dirty = true;
        void add({
          type: "system",
          priority: "normal",
          title: ar ? "انتهت صلاحية مؤقتة" : "Temporary access expired",
          message: ar
            ? `انتهت صلاحية "${pageLabel(g.pageKey, true)}" للمستخدم ${g.userId} تلقائيًا.`
            : `Access to "${pageLabel(g.pageKey, false)}" for ${g.userId} was revoked automatically.`,
          href: "/dashboard/admin/permissions",
        });
      }

      if (dirty) writeSeen(seen);
    };

    run();
    const t = setInterval(run, 60_000);
    return () => clearInterval(t);
  }, [grants, add, ar]);
}
