import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { demoUsers } from "@/data/demo";

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
  { key: "security", en: "Security Center", ar: "مركز الأمان" },
  { key: "locations", en: "Locations", ar: "المواقع" },
  { key: "nationalities", en: "Nationalities", ar: "الجنسيات" },
];

export const PERM_ACTIONS: PermAction[] = ["view", "add", "edit", "delete"];

const KEY = "it_user_perms_v1";
const PRESETS_KEY = "it_perm_presets_v1";
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

const AGENT_PAGES = new Set(["overview", "leads", "tickets", "clients", "quotations"]);
const MANAGER_RESTRICTED = new Set(["users", "permissions", "settings", "reports"]);
const SEO_PAGES = new Set(["overview", "seo", "news", "products", "services", "sliders", "faqs", "settings", "about"]);
const TECHNICIAN_PAGES = new Set(["overview", "tickets", "services", "projects", "clients", "products", "faqs"]);

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
  deleteCustomPreset: (presetId: string) => void;
};

const PermsContext = createContext<Ctx | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [perms, setPerms] = useState<PermsMap>({});
  const [customPresets, setCustomPresets] = useState<PermPreset[]>([]);

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
  }, []);

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
    if (existing) {
      // Backfill any missing pages
      const merged: UserPerms = { ...defaultUserPerms(), ...existing };
      return merged;
    }
    const matchedUser = demoUsers.find((u) => u.id === userId);
    return defaultPermsForRole(matchedUser?.role);
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
      deleteCustomPreset,
    }),
    [perms, presets],
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