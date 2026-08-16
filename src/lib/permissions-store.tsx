import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { demoUsers } from "@/data/demo";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type PermAction = "view" | "add" | "edit" | "delete";
export type PagePerms = Record<PermAction, boolean>;
export type UserPerms = Record<string, PagePerms>;
export type PermsMap = Record<string, UserPerms>;

export type AdminPage = { key: string; en: string; ar: string };

export const ADMIN_PAGES: AdminPage[] = [
  { key: "overview", en: "Admin Overview", ar: "نظرة عامة" },
  { key: "leads", en: "Leads", ar: "العملاء المحتملون" },
  { key: "projects", en: "Projects", ar: "المشاريع" },
  { key: "services", en: "Services", ar: "الخدمات" },
  { key: "clients", en: "Clients", ar: "العملاء" },
  { key: "quotations", en: "Quotations", ar: "عروض الأسعار" },
  { key: "tickets", en: "Support Tickets", ar: "تذاكر الدعم" },
  { key: "reviews", en: "Reviews", ar: "المراجعات" },
  { key: "sliders", en: "Sliders", ar: "العروض المتحركة" },
  { key: "reports", en: "Reports", ar: "التقارير" },
  { key: "users", en: "Users", ar: "المستخدمون" },
  { key: "permissions", en: "Permissions", ar: "الصلاحيات" },
  { key: "faqs", en: "FAQs", ar: "الأسئلة الشائعة" },
  { key: "about", en: "About Page", ar: "صفحة من نحن" },
  { key: "terms", en: "Terms", ar: "الشروط والأحكام" },
  { key: "policies", en: "Privacy Policy", ar: "سياسة الخصوصية" },
  { key: "settings", en: "Site Settings", ar: "إعدادات الموقع" },
  { key: "chatbot", en: "Chatbot", ar: "المساعد الذكي" },
  { key: "seo", en: "SEO", ar: "تحسين محركات البحث" },
  { key: "smtp", en: "SMTP", ar: "إعدادات البريد" },
  { key: "careers", en: "Careers", ar: "الوظائف" },
  { key: "careers_applications", en: "Career Applicants", ar: "طلبات التوظيف" },
  { key: "careers_analytics", en: "Careers Analytics", ar: "تحليلات التوظيف" },
  { key: "products", en: "Products", ar: "المنتجات" },
  { key: "news", en: "News", ar: "الأخبار" },
  { key: "partners", en: "Partners", ar: "الشركاء" },
  { key: "orders", en: "Orders", ar: "الطلبات" },
  { key: "quotes", en: "Quote Requests", ar: "طلبات التسعير" },
  { key: "recommendations", en: "Recommendation Engine", ar: "محرك التوصيات" },
  { key: "helpdesk", en: "Helpdesk Overview", ar: "نظرة عامة على الدعم" },
  { key: "helpdesk_tickets", en: "Helpdesk Tickets", ar: "تذاكر الدعم الفني" },
  { key: "helpdesk_categories", en: "Helpdesk Categories", ar: "تصنيفات الدعم" },
  { key: "helpdesk_branches", en: "Helpdesk Branches", ar: "فروع الدعم" },
  { key: "helpdesk_devices", en: "Helpdesk Devices", ar: "أجهزة الدعم" },
  { key: "helpdesk_sla", en: "Helpdesk SLA", ar: "اتفاقية مستوى الخدمة" },
  { key: "helpdesk_performance", en: "Helpdesk Performance", ar: "أداء الدعم" },
  { key: "helpdesk_invoice_recipients", en: "Invoice Recipients", ar: "مستلمو الفواتير" },
  { key: "notifications", en: "Notification Settings", ar: "إعدادات الإشعارات" },
  { key: "security", en: "Security Center", ar: "مركز الأمان" },
  { key: "locations", en: "Locations", ar: "المواقع" },
  { key: "nationalities", en: "Nationalities", ar: "الجنسيات" },
];

export const PERM_ACTIONS: PermAction[] = ["view", "add", "edit", "delete"];

const KEY = "it_user_perms_v1";
const PRESETS_KEY = "it_perm_presets_v1";
const GRANTS_KEY = "it_temp_grants_v1";
const STORAGE_VERSION = 1;

export const noPerms = (): PagePerms => ({ view: false, add: false, edit: false, delete: false });
export const allPerms = (): PagePerms => ({ view: true, add: true, edit: true, delete: true });
export const viewOnly = (): PagePerms => ({ view: true, add: false, edit: false, delete: false });

/** Default permissions assigned to a brand-new user. Admins implicitly get everything. */
export const defaultUserPerms = (): UserPerms => {
  const m: UserPerms = {};
  for (const p of ADMIN_PAGES) m[p.key] = noPerms();
  return m;
};

/** Build a UserPerms map from a flat per-page action setter. */
const buildPerms = (fn: (pageKey: string) => Partial<PagePerms>): UserPerms => {
  const m: UserPerms = {};
  for (const p of ADMIN_PAGES) m[p.key] = { ...noPerms(), ...fn(p.key) };
  return m;
};

export type PermPreset = {
  id: string;
  name: { en: string; ar: string };
  description?: { en: string; ar: string };
  builtin?: boolean;
  perms: UserPerms;
};

/**
 * Time-limited permission grant. `expiresAt === null` means permanent.
 * Expired grants are ignored when resolving permissions and are pruned from
 * storage, so access revokes itself without any manual step.
 */
export type AccessGrant = {
  id: string;
  userId: string;
  pageKey: string;
  actions: PermAction[];
  expiresAt: string | null;
  grantedBy: string;
  note?: string;
  requestId?: string;
  createdAt: string;
};

export const isGrantActive = (g: AccessGrant, now = Date.now()) =>
  g.expiresAt === null || new Date(g.expiresAt).getTime() > now;

const AGENT_PAGES = new Set(["overview", "leads", "tickets", "clients", "quotations", "quotes", "orders", "helpdesk_tickets"]);
const MANAGER_RESTRICTED = new Set(["users", "permissions", "settings", "reports", "security"]);
const SEO_PAGES = new Set(["overview", "seo", "news", "products", "services", "sliders", "faqs", "settings", "about", "partners"]);
const TECHNICIAN_PAGES = new Set([
  "overview",
  "tickets",
  "services",
  "projects",
  "clients",
  "products",
  "faqs",
  "helpdesk",
  "helpdesk_tickets",
  "helpdesk_devices",
  "helpdesk_categories",
  "helpdesk_branches",
  "helpdesk_sla",
]);

export const BUILTIN_PRESETS: PermPreset[] = [
  {
    id: "preset-admin",
    builtin: true,
    name: { en: "Administrator", ar: "مدير" },
    description: { en: "Full access to every admin page.", ar: "وصول كامل إلى جميع صفحات الإدارة." },
    perms: buildPerms(() => allPerms()),
  },
  {
    id: "preset-manager",
    builtin: true,
    name: { en: "Manager", ar: "مشرف / مدير قسم" },
    description: {
      en: "View / add / edit on operations, no destructive or settings access.",
      ar: "عرض وإضافة وتعديل على العمليات، بدون حذف أو وصول للإعدادات الحساسة.",
    },
    perms: buildPerms((k) =>
      MANAGER_RESTRICTED.has(k)
        ? noPerms()
        : { view: true, add: true, edit: true, delete: false },
    ),
  },
  {
    id: "preset-agent",
    builtin: true,
    name: { en: "Agent", ar: "موظف" },
    description: {
      en: "Day-to-day operations: leads, tickets, clients, quotations.",
      ar: "العمليات اليومية: العملاء المحتملون، التذاكر، العملاء، عروض الأسعار.",
    },
    perms: buildPerms((k) =>
      AGENT_PAGES.has(k) ? { view: true, add: true, edit: true, delete: false } : noPerms(),
    ),
  },
  {
    id: "preset-seo",
    builtin: true,
    name: { en: "SEO Specialist", ar: "مسؤول SEO" },
    description: {
      en: "Full SEO control, meta tags, articles, news, sliders, and marketing pages.",
      ar: "إدارة شاملة لـ SEO والكلمات المفتاحية والمقالات والأخبار وسلايدرات الموقع.",
    },
    perms: buildPerms((k) =>
      SEO_PAGES.has(k) ? { view: true, add: true, edit: true, delete: false } : noPerms(),
    ),
  },
  {
    id: "preset-technician",
    builtin: true,
    name: { en: "Technician", ar: "فني تقني" },
    description: {
      en: "Field services, technical support tickets, projects, and hardware maintenance.",
      ar: "الخدمات الميدانية، تذاكر الدعم الفني، متابعة المشاريع وصيانة الأجهزة.",
    },
    perms: buildPerms((k) =>
      TECHNICIAN_PAGES.has(k) ? { view: true, add: true, edit: true, delete: false } : noPerms(),
    ),
  },
  {
    id: "preset-viewer",
    builtin: true,
    name: { en: "Viewer (read-only)", ar: "مشاهد (للقراءة فقط)" },
    description: { en: "View every admin page, no changes allowed.", ar: "عرض كل الصفحات بدون تعديلات." },
    perms: buildPerms(() => viewOnly()),
  },
  {
    id: "preset-none",
    builtin: true,
    name: { en: "No access", ar: "بدون صلاحيات" },
    description: { en: "Revoke everything.", ar: "إزالة جميع الصلاحيات." },
    perms: buildPerms(() => noPerms()),
  },
];

export const defaultPermsForRole = (role?: string): UserPerms => {
  if (role === "admin") return buildPerms(() => allPerms());
  if (role === "manager") return buildPerms((k) => (MANAGER_RESTRICTED.has(k) ? noPerms() : { view: true, add: true, edit: true, delete: false }));
  if (role === "seo") return buildPerms((k) => (SEO_PAGES.has(k) ? { view: true, add: true, edit: true, delete: false } : noPerms()));
  if (role === "technician") return buildPerms((k) => (TECHNICIAN_PAGES.has(k) ? { view: true, add: true, edit: true, delete: false } : noPerms()));
  if (role === "agent") return buildPerms((k) => (AGENT_PAGES.has(k) ? { view: true, add: true, edit: true, delete: false } : noPerms()));
  return defaultUserPerms();
};

type Ctx = {
  perms: PermsMap;
  getUserPerms: (userId: string) => UserPerms;
  setPagePerms: (userId: string, pageKey: string, patch: Partial<PagePerms>) => void;
  setAllForUser: (userId: string, value: boolean) => void;
  setActionForUser: (userId: string, action: PermAction, value: boolean) => void;
  setAllForPage: (userId: string, pageKey: string, value: boolean) => void;
  resetUser: (userId: string) => void;
  presets: PermPreset[];
  applyPreset: (presetId: string, userIds: string[]) => number;
  saveCustomPreset: (name: { en: string; ar: string }, fromUserId: string) => PermPreset | null;
  updateCustomPreset: (presetId: string, patch: { name?: { en: string; ar: string }; perms?: UserPerms }) => boolean;
  duplicatePreset: (presetId: string, name: { en: string; ar: string }, perms?: UserPerms) => PermPreset | null;
  deleteCustomPreset: (presetId: string) => void;
  /** Active (non-expired) temporary grants, newest first. */
  grants: AccessGrant[];
  grantAccess: (input: {
    userId: string;
    pageKey: string;
    actions: PermAction[];
    days: number | null;
    grantedBy: string;
    note?: string;
    requestId?: string;
  }) => Promise<AccessGrant | null>;
  revokeGrant: (grantId: string) => Promise<void>;
  grantsForUser: (userId: string) => AccessGrant[];
  refreshGrants: () => Promise<void>;
};

const PermsContext = createContext<Ctx | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [perms, setPerms] = useState<PermsMap>({});
  const [customPresets, setCustomPresets] = useState<PermPreset[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [, setTick] = useState(0);

  const refreshGrants = async () => {
    const { data, error } = await db
      .from("access_grants")
      .select("*")
      .is("revoked_at", null);
      
    if (error) {
      console.error("[permissions] failed to load grants", error);
      return;
    }
    
    const mapped: AccessGrant[] = data.map((g: any) => ({
      id: g.id,
      userId: g.user_id,
      pageKey: g.page_key,
      actions: g.actions as PermAction[],
      expiresAt: g.expires_at,
      grantedBy: g.granted_by,
      note: g.note,
      requestId: g.request_id,
      createdAt: g.created_at,
    }));
    setGrants(mapped);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v === STORAGE_VERSION && parsed.data) setPerms(parsed.data);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(PRESETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v === STORAGE_VERSION && Array.isArray(parsed.data)) {
          setCustomPresets(parsed.data);
        }
      }
    } catch {}
    
    void refreshGrants();
    
    const channel = supabase
      .channel("access_grants_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "access_grants" }, () => {
        void refreshGrants();
      })
      .subscribe();
      
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Re-evaluate expiry on a timer so access disappears without a reload.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const activeGrants = useMemo(() => grants.filter((g) => isGrantActive(g)), [grants]);



  const persist = (next: PermsMap) => {
    setPerms(next);
    try { localStorage.setItem(KEY, JSON.stringify({ v: STORAGE_VERSION, data: next })); } catch {}
  };

  const persistPresets = (next: PermPreset[]) => {
    setCustomPresets(next);
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify({ v: STORAGE_VERSION, data: next })); } catch {}
  };

  const getUserPerms: Ctx["getUserPerms"] = (userId) => {
    const existing = perms[userId];
    let base: UserPerms;
    if (existing) {
      // Backfill any missing pages
      base = { ...defaultUserPerms(), ...existing };
    } else {
      const matchedUser = demoUsers.find((u) => u.id === userId);
      base = defaultPermsForRole(matchedUser?.role);
    }
    // Layer active time-limited grants on top; expired ones simply vanish.
    const now = Date.now();
    const mine = grants.filter((g) => g.userId === userId && isGrantActive(g, now));
    if (mine.length === 0) return base;
    const merged: UserPerms = { ...base };
    for (const g of mine) {
      const page = { ...(merged[g.pageKey] ?? noPerms()) };
      for (const a of g.actions) page[a] = true;
      merged[g.pageKey] = page;
    }
    return merged;
  };

  const setPagePerms: Ctx["setPagePerms"] = (userId, pageKey, patch) => {
    const current = getUserPerms(userId);
    const next: PermsMap = {
      ...perms,
      [userId]: { ...current, [pageKey]: { ...current[pageKey], ...patch } },
    };
    persist(next);
  };

  const setAllForUser: Ctx["setAllForUser"] = (userId, value) => {
    const next: PermsMap = { ...perms, [userId]: {} };
    for (const p of ADMIN_PAGES) {
      next[userId][p.key] = value ? allPerms() : noPerms();
    }
    persist(next);
  };

  const setActionForUser: Ctx["setActionForUser"] = (userId, action, value) => {
    const current = getUserPerms(userId);
    const updated: UserPerms = {};
    for (const p of ADMIN_PAGES) updated[p.key] = { ...current[p.key], [action]: value };
    persist({ ...perms, [userId]: updated });
  };

  const setAllForPage: Ctx["setAllForPage"] = (userId, pageKey, value) => {
    setPagePerms(userId, pageKey, value ? allPerms() : noPerms());
  };

  const resetUser: Ctx["resetUser"] = (userId) => {
    const next = { ...perms };
    delete next[userId];
    persist(next);
  };

  const presets = useMemo<PermPreset[]>(() => [...BUILTIN_PRESETS, ...customPresets], [customPresets]);

  const applyPreset: Ctx["applyPreset"] = (presetId, userIds) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset || userIds.length === 0) return 0;
    const next: PermsMap = { ...perms };
    for (const uid of userIds) {
      // Deep clone so each user has an independent copy.
      const cloned: UserPerms = {};
      for (const p of ADMIN_PAGES) cloned[p.key] = { ...(preset.perms[p.key] ?? noPerms()) };
      next[uid] = cloned;
    }
    persist(next);
    return userIds.length;
  };

  const saveCustomPreset: Ctx["saveCustomPreset"] = (name, fromUserId) => {
    const trimmed = name.en.trim();
    if (!trimmed) return null;
    const snapshot = getUserPerms(fromUserId);
    const cloned: UserPerms = {};
    for (const p of ADMIN_PAGES) cloned[p.key] = { ...(snapshot[p.key] ?? noPerms()) };
    const preset: PermPreset = {
      id: `preset-${Date.now()}`,
      name: { en: trimmed, ar: name.ar.trim() || trimmed },
      perms: cloned,
    };
    persistPresets([...customPresets, preset]);
    return preset;
  };

  const deleteCustomPreset: Ctx["deleteCustomPreset"] = (presetId) => {
    persistPresets(customPresets.filter((p) => p.id !== presetId));
  };

  const clonePerms = (source: UserPerms): UserPerms => {
    const cloned: UserPerms = {};
    for (const p of ADMIN_PAGES) cloned[p.key] = { ...(source[p.key] ?? noPerms()) };
    return cloned;
  };

  const updateCustomPreset: Ctx["updateCustomPreset"] = (presetId, patch) => {
    const idx = customPresets.findIndex((p) => p.id === presetId);
    if (idx === -1) return false;
    const current = customPresets[idx];
    const name = patch.name
      ? { en: patch.name.en.trim() || current.name.en, ar: patch.name.ar.trim() || patch.name.en.trim() || current.name.ar }
      : current.name;
    const next = [...customPresets];
    next[idx] = { ...current, name, perms: patch.perms ? clonePerms(patch.perms) : current.perms };
    persistPresets(next);
    return true;
  };

  const duplicatePreset: Ctx["duplicatePreset"] = (presetId, name, perms) => {
    const source = [...BUILTIN_PRESETS, ...customPresets].find((p) => p.id === presetId);
    if (!source) return null;
    const trimmed = name.en.trim();
    if (!trimmed) return null;
    const preset: PermPreset = {
      id: `preset-${Date.now()}`,
      name: { en: trimmed, ar: name.ar.trim() || trimmed },
      description: source.description,
      perms: clonePerms(perms ?? source.perms),
    };
    persistPresets([...customPresets, preset]);
    return preset;
  };

  const grantAccess: Ctx["grantAccess"] = async ({ userId, pageKey, actions, days, grantedBy, note, requestId }) => {
    const expiresAt = days && days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
    
    const { data, error } = await db
      .from("access_grants")
      .insert({
        user_id: userId,
        page_key: pageKey,
        actions: actions.length ? actions : ["view"],
        expires_at: expiresAt,
        granted_by: grantedBy,
        note,
        request_id: requestId,
      })
      .select()
      .single();
      
    if (error) {
      console.error("[permissions] failed to grant access", error);
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      pageKey: data.page_key,
      actions: data.actions as PermAction[],
      expiresAt: data.expires_at,
      grantedBy: data.granted_by,
      note: data.note,
      requestId: data.request_id,
      createdAt: data.created_at,
    };
  };

  const revokeGrant: Ctx["revokeGrant"] = async (grantId) => {
    const { error } = await db
      .from("access_grants")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", grantId);
      
    if (error) {
      console.error("[permissions] failed to revoke access", error);
    }
  };

  const grantsForUser: Ctx["grantsForUser"] = (userId) =>
    activeGrants.filter((g) => g.userId === userId);

  const value = useMemo<Ctx>(
    () => ({
      perms,
      getUserPerms,
      setPagePerms,
      setAllForUser,
      setActionForUser,
      setAllForPage,
      resetUser,
      presets,
      applyPreset,
      saveCustomPreset,
      updateCustomPreset,
      duplicatePreset,
      deleteCustomPreset,
      grants: activeGrants,
      grantAccess,
      revokeGrant,
      grantsForUser,
      refreshGrants,
    }),
    [perms, presets, grants, activeGrants],
  );

  return <PermsContext.Provider value={value}>{children}</PermsContext.Provider>;
}

export function usePermissions() {
  const ctx = useContext(PermsContext);
  if (!ctx) throw new Error("usePermissions must be used within PermissionsProvider");
  return ctx;
}

/** Convenience: check a single permission. Returns true for `role==="admin"`. */
export function useCan(userId: string | undefined, role: string | undefined, pageKey: string, action: PermAction = "view") {
  const { getUserPerms } = usePermissions();
  if (!userId) return false;
  if (role === "admin") return true;
  return !!getUserPerms(userId)[pageKey]?.[action];
}

/**
 * Resolve the currently signed-in user's permissions for a given admin page.
 * - `admin` role → full access (true everywhere).
 * - Other roles → looked up from the permissions store, keyed by demoUsers.id (matched by email).
 * - Unknown / unauthenticated → all false.
 */
export function useCanAccess(pageKey: string) {
  const { user } = useAuth();
  const { getUserPerms } = usePermissions();
  return useMemo(() => {
    if (!user) return { view: false, add: false, edit: false, delete: false } as PagePerms;
    if (user.role === "admin") return allPerms();
    const matched = demoUsers.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (!matched) return noPerms();
    return getUserPerms(matched.id)[pageKey] ?? noPerms();
  }, [user, pageKey, getUserPerms]);
}

/** Nested admin paths that map to a dedicated permission key. */
export const NESTED_PAGE_KEYS: Array<{ prefix: string; pageKey: string }> = [
  { prefix: "leads/quotes", pageKey: "quotes" },
  { prefix: "careers/applications", pageKey: "careers_applications" },
  { prefix: "careers/analytics", pageKey: "careers_analytics" },
  { prefix: "helpdesk/tickets", pageKey: "helpdesk_tickets" },
  { prefix: "helpdesk/categories", pageKey: "helpdesk_categories" },
  { prefix: "helpdesk/branches", pageKey: "helpdesk_branches" },
  { prefix: "helpdesk/devices", pageKey: "helpdesk_devices" },
  { prefix: "helpdesk/sla", pageKey: "helpdesk_sla" },
  { prefix: "helpdesk/performance", pageKey: "helpdesk_performance" },
  { prefix: "helpdesk/invoice-recipients", pageKey: "helpdesk_invoice_recipients" },
];

/**
 * Map an admin pathname to an ADMIN_PAGES key + the action being attempted.
 * Unrecognised admin sub-paths resolve to `__unknown__`, which nobody can be
 * granted — unknown routes are denied by default instead of bypassing the gate.
 */
export function resolveAdminPage(
  pathname: string,
): { pageKey: string; action: "view" | "add" | "edit" } | null {
  if (!pathname.startsWith("/dashboard/admin")) return null;
  const rest = pathname.replace(/^\/dashboard\/admin\/?/, "").replace(/\/$/, "");
  const action: "view" | "add" | "edit" = rest.endsWith("/new")
    ? "add"
    : rest.endsWith("/edit")
      ? "edit"
      : "view";
  if (!rest) return { pageKey: "overview", action };
  const nested = NESTED_PAGE_KEYS.find((n) => rest === n.prefix || rest.startsWith(n.prefix + "/"));
  if (nested) return { pageKey: nested.pageKey, action };
  const seg = rest.split("/")[0];
  const known = ADMIN_PAGES.find((p) => p.key === seg);
  return { pageKey: known?.key ?? "__unknown__", action };
}