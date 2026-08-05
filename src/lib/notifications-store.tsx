import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type NotificationType = "lead" | "slide" | "system";

export type AdminNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
};

export type NotificationFrequency = "instant" | "hourly" | "daily";

export type NotificationSettings = {
  enabled: Record<NotificationType, boolean>;
  frequency: NotificationFrequency;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: { lead: true, slide: true, system: true },
  frequency: "instant",
};

const SETTINGS_KEY = "admin.notifications.settings.v1";

function loadSettings(): NotificationSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: { ...DEFAULT_SETTINGS.enabled, ...(parsed?.enabled ?? {}) },
      frequency: (parsed?.frequency as NotificationFrequency) ?? "instant",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

type DbRow = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  read: boolean;
  created_at: string;
};

const fromRow = (r: DbRow): AdminNotification => ({
  id: r.id,
  type: r.type,
  title: r.title,
  message: r.message,
  href: r.href,
  createdAt: r.created_at,
  read: r.read,
});

const PAGE_SIZE = 10;

type Ctx = {
  notifications: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  add: (n: { type: NotificationType; title: string; message: string; href: string }) => Promise<void>;
  settings: NotificationSettings;
  updateSettings: (patch: Partial<NotificationSettings>) => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>(() => loadSettings());
  const offsetRef = useRef(0);
  const settingsRef = useRef(settings);
  const pendingRef = useRef<AdminNotification[]>([]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const flushPending = useCallback(() => {
    if (pendingRef.current.length === 0) return;
    const enabled = settingsRef.current.enabled;
    const toAdd = pendingRef.current.filter((n) => enabled[n.type]);
    pendingRef.current = pendingRef.current.filter((n) => !enabled[n.type]);
    if (toAdd.length === 0) return;
    setNotifications((prev) => {
      const seen = new Set(prev.map((n) => n.id));
      const fresh = toAdd.filter((n) => !seen.has(n.id));
      offsetRef.current += fresh.length;
      return [...fresh, ...prev];
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next: NotificationSettings = {
        enabled: { ...prev.enabled, ...(patch.enabled ?? {}) },
        frequency: patch.frequency ?? prev.frequency,
      };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  // When the user re-enables a type or switches to instant, flush queued items.
  useEffect(() => {
    if (settings.frequency === "instant") flushPending();
  }, [settings, flushPending]);

  // Periodic flush for digest modes.
  useEffect(() => {
    if (settings.frequency === "instant") return;
    const intervalMs = settings.frequency === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const id = window.setInterval(flushPending, intervalMs);
    return () => window.clearInterval(id);
  }, [settings.frequency, flushPending]);

  // Initial load + realtime subscription
  useEffect(() => {
    if (!isAdmin) {
      setNotifications([]);
      setHasMore(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    offsetRef.current = 0;

    (async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);
      if (cancelled) return;
      if (!error && data) {
        setNotifications((data as DbRow[]).map(fromRow));
        offsetRef.current = data.length;
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel("admin_notifications_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const row = fromRow(payload.new as DbRow);
          const { enabled } = settingsRef.current;
          // Drop disabled types entirely — don't receive or count them.
          if (!enabled[row.type]) return;
          // Digest modes queue until the next flush.
          if (settingsRef.current.frequency !== "instant") {
            if (!pendingRef.current.some((n) => n.id === row.id)) {
              pendingRef.current.push(row);
            }
            return;
          }
          setNotifications((prev) => {
            if (prev.some((n) => n.id === row.id)) return prev;
            offsetRef.current += 1;
            return [row, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "admin_notifications" },
        (payload) => {
          const row = fromRow(payload.new as DbRow);
          const { enabled } = settingsRef.current;
          if (!enabled[row.type]) {
            // Keep store consistent if a disabled type sneaks in: drop it.
            setNotifications((prev) => prev.filter((n) => n.id !== row.id));
            pendingRef.current = pendingRef.current.filter((n) => n.id !== row.id);
            return;
          }
          setNotifications((prev) => prev.map((n) => (n.id === row.id ? row : n)));
          pendingRef.current = pendingRef.current.map((n) => (n.id === row.id ? row : n));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "admin_notifications" },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          pendingRef.current = pendingRef.current.filter((n) => n.id !== id);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const loadMore = useCallback(async () => {
    if (!isAdmin || loading || !hasMore) return;
    setLoading(true);
    const start = offsetRef.current;
    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, start + PAGE_SIZE - 1);
    if (!error && data) {
      const rows = (data as DbRow[]).map(fromRow);
      setNotifications((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...rows.filter((r) => !seen.has(r.id))];
      });
      offsetRef.current = start + data.length;
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [isAdmin, loading, hasMore]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
  }, []);

  const add: Ctx["add"] = useCallback(async (n) => {
    await supabase.from("admin_notifications").insert({
      type: n.type, title: n.title, message: n.message, href: n.href,
    });
  }, []);

  // Filter by enabled types for visible list and unread badge
  const visible = useMemo(
    () => notifications.filter((n) => settings.enabled[n.type]),
    [notifications, settings.enabled],
  );
  const unreadCount = useMemo(() => visible.filter((n) => !n.read).length, [visible]);

  const value = useMemo<Ctx>(
    () => ({
      notifications: visible,
      unreadCount,
      loading,
      hasMore,
      loadMore,
      markAsRead,
      markAllAsRead,
      add,
      settings,
      updateSettings,
    }),
    [visible, unreadCount, loading, hasMore, loadMore, markAsRead, markAllAsRead, add, settings, updateSettings],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}

export function formatRelativeTime(iso: string, lang: "en" | "ar" = "en"): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(1, Math.floor(diffMs / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (lang === "ar") {
    if (day >= 1) return `منذ ${day} يوم`;
    if (hr >= 1) return `منذ ${hr} ساعة`;
    if (min >= 1) return `منذ ${min} دقيقة`;
    return `الآن`;
  }
  if (day >= 1) return `${day}d ago`;
  if (hr >= 1) return `${hr}h ago`;
  if (min >= 1) return `${min}m ago`;
  return `just now`;
}
