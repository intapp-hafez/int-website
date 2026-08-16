import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { playNotificationSound, type SoundTone } from "@/lib/notifications-sound";

export type NotificationType = "lead" | "ticket" | "career" | "chat" | "security" | "slide" | "system";

export type NotificationPriority = "normal" | "important" | "critical";

export type AdminNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
  priority?: NotificationPriority;
};

export type NotificationFrequency = "instant" | "hourly" | "daily" | "weekly";

export type NotificationSettings = {
  enabled: Record<NotificationType, boolean>;
  categoryEmails: Record<NotificationType, string>;
  frequency: NotificationFrequency;
  // Sound Alerts
  soundEnabled: boolean;
  soundTone: SoundTone;
  soundVolume: number; // 0..1
  // Desktop Web Push
  desktopEnabled: boolean;
  // Email Notifications
  emailEnabled: boolean;
  emailRecipients: string;
  emailFrequency: NotificationFrequency;
  // WhatsApp Alerts
  whatsappEnabled: boolean;
  whatsappPhone: string;
  // Webhook Integration
  webhookEnabled: boolean;
  webhookUrl: string;
  // Quiet Hours (DND)
  dndEnabled: boolean;
  dndStart: string; // e.g. "22:00"
  dndEnd: string; // e.g. "08:00"
  // Priority Filter
  priorityFilter: "all" | "important" | "critical";
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: {
    lead: true,
    ticket: true,
    career: true,
    chat: true,
    security: true,
    slide: true,
    system: true,
  },
  categoryEmails: {
    lead: "sales@integratedtechnics.com, commercial@integratedtechnics.com",
    ticket: "support@integratedtechnics.com, helpdesk@integratedtechnics.com",
    career: "hr@integratedtechnics.com, careers@integratedtechnics.com",
    chat: "livechat@integratedtechnics.com, sales@integratedtechnics.com",
    security: "security@integratedtechnics.com, it-admin@integratedtechnics.com",
    slide: "marketing@integratedtechnics.com",
    system: "devops@integratedtechnics.com, admin@integratedtechnics.com",
  },
  frequency: "instant",
  soundEnabled: true,
  soundTone: "chime",
  soundVolume: 0.8,
  desktopEnabled: false,
  emailEnabled: true,
  emailRecipients: "admin@integratedtechnics.com",
  emailFrequency: "instant",
  whatsappEnabled: false,
  whatsappPhone: "+201007419344",
  webhookEnabled: false,
  webhookUrl: "",
  dndEnabled: false,
  dndStart: "22:00",
  dndEnd: "08:00",
  priorityFilter: "all",
};

const SETTINGS_KEY = "admin.notifications.settings.v3";

function loadSettings(): NotificationSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      enabled: { ...DEFAULT_SETTINGS.enabled, ...(parsed?.enabled ?? {}) },
      categoryEmails: { ...DEFAULT_SETTINGS.categoryEmails, ...(parsed?.categoryEmails ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function isQuietHours(settings: NotificationSettings): boolean {
  if (!settings.dndEnabled) return false;
  try {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = settings.dndStart.split(":").map(Number);
    const [eH, eM] = settings.dndEnd.split(":").map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    if (startMins <= endMins) {
      return currentMins >= startMins && currentMins < endMins;
    } else {
      // Overnight (e.g. 22:00 to 08:00)
      return currentMins >= startMins || currentMins < endMins;
    }
  } catch {
    return false;
  }
}

type DbRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  read: boolean;
  created_at: string;
};

const fromRow = (r: DbRow): AdminNotification => {
  const validTypes: NotificationType[] = ["lead", "ticket", "career", "chat", "security", "slide", "system"];
  const type = validTypes.includes(r.type as any) ? (r.type as NotificationType) : "system";
  return {
    id: r.id,
    type,
    title: r.title || "Notification",
    message: r.message || "",
    href: r.href || "/dashboard/admin",
    createdAt: r.created_at,
    read: r.read,
    priority: r.type === "lead" || r.type === "security" ? "important" : "normal",
  };
};

const PAGE_SIZE = 15;

type Ctx = {
  notifications: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  desktopPermission: NotificationPermission | "unsupported";
  requestDesktopPermission: () => Promise<boolean>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  add: (n: { type: NotificationType; title: string; message: string; href: string; priority?: NotificationPriority }) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  settings: NotificationSettings;
  updateSettings: (patch: Partial<NotificationSettings>) => void;
  saveSettings: (customSettings?: NotificationSettings) => Promise<boolean>;
  savingSettings: boolean;
};

const NotificationsContext = createContext<Ctx | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>(() => loadSettings());
  const [savingSettings, setSavingSettings] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const offsetRef = useRef(0);
  const settingsRef = useRef(settings);
  const pendingRef = useRef<AdminNotification[]>([]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Initial Load from Supabase Database (site_settings table)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("site_settings")
          .select("value")
          .eq("id", "notification_settings")
          .maybeSingle();

        if (mounted && data?.value) {
          const remote = data.value as Partial<NotificationSettings>;
          setSettings((prev) => {
            const merged: NotificationSettings = {
              ...prev,
              ...remote,
              enabled: { ...prev.enabled, ...(remote?.enabled ?? {}) },
              categoryEmails: { ...(prev.categoryEmails || DEFAULT_SETTINGS.categoryEmails), ...(remote?.categoryEmails ?? {}) },
            };
            try {
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (err) {
        console.warn("[notification_settings] remote fetch note:", err);
      }
    })();

    // Real-time synchronization from database across all admin tabs
    const channel = supabase
      .channel("site_settings_notifications_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "id=eq.notification_settings" },
        (payload: any) => {
          if (payload.new?.value) {
            const remote = payload.new.value as Partial<NotificationSettings>;
            setSettings((prev) => ({
              ...prev,
              ...remote,
              enabled: { ...prev.enabled, ...(remote?.enabled ?? {}) },
              categoryEmails: { ...(prev.categoryEmails || DEFAULT_SETTINGS.categoryEmails), ...(remote?.categoryEmails ?? {}) },
            }));
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const saveSettings = useCallback(async (customSettings?: NotificationSettings): Promise<boolean> => {
    const target = customSettings || settingsRef.current;
    setSavingSettings(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(target));
      const { error } = await (supabase as any).from("site_settings").upsert({
        id: "notification_settings",
        value: target,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn("[notification_settings] DB save error:", error);
      }
      return !error;
    } catch (err) {
      console.warn("[notification_settings] DB save exception:", err);
      return false;
    } finally {
      setSavingSettings(false);
    }
  }, []);

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next: NotificationSettings = {
        ...prev,
        ...patch,
        enabled: { ...prev.enabled, ...(patch.enabled ?? {}) },
        categoryEmails: { ...(prev.categoryEmails || DEFAULT_SETTINGS.categoryEmails), ...(patch.categoryEmails ?? {}) },
      };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {}

      // Auto sync to database in background
      (async () => {
        try {
          await (supabase as any).from("site_settings").upsert({
            id: "notification_settings",
            value: next,
            updated_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("[notification_settings] auto-upsert note:", err);
        }
      })();

      return next;
    });
  }, []);

  const requestDesktopPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setDesktopPermission("unsupported");
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      setDesktopPermission(perm);
      if (perm === "granted") {
        updateSettings({ desktopEnabled: true });
        return true;
      } else {
        updateSettings({ desktopEnabled: false });
        return false;
      }
    } catch {
      return false;
    }
  }, [updateSettings]);

  // Play sound and desktop notification when a new alert is received
  const notifyUserLocally = useCallback((notif: AdminNotification) => {
    const s = settingsRef.current;
    const quiet = isQuietHours(s);

    if (!quiet && s.soundEnabled) {
      playNotificationSound(s.soundTone, s.soundVolume);
    }

    if (!quiet && s.desktopEnabled && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const n = new Notification(notif.title, {
          body: notif.message,
          icon: "/favicon.ico",
        });
        n.onclick = () => {
          window.focus();
          if (notif.href) window.location.href = notif.href;
          n.close();
        };
      } catch {}
    }
  }, []);

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

  // Initial load + Real-time subscription for notifications table
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
      try {
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
      } catch {}
      setLoading(false);
    })();

    const channel = supabase
      .channel("admin_notifications_realtime_v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const row = fromRow(payload.new as DbRow);
          const { enabled } = settingsRef.current;
          if (!enabled[row.type]) return;

          // Notify user with audio & desktop
          notifyUserLocally(row);

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
  }, [isAdmin, notifyUserLocally]);

  const loadMore = useCallback(async () => {
    if (!isAdmin || loading || !hasMore) return;
    setLoading(true);
    const start = offsetRef.current;
    try {
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
    } catch {}
    setLoading(false);
  }, [isAdmin, loading, hasMore]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
    } catch {}
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      await supabase.from("admin_notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    } catch {}
  }, []);

  const add: Ctx["add"] = useCallback(async (n) => {
    const item: AdminNotification = {
      id: crypto.randomUUID(),
      type: n.type,
      title: n.title,
      message: n.message,
      href: n.href,
      createdAt: new Date().toISOString(),
      read: false,
      priority: n.priority || "normal",
    };

    // Trigger local audio / desktop push
    notifyUserLocally(item);

    // Optimistic insert
    setNotifications((prev) => [item, ...prev]);

    try {
      await supabase.from("admin_notifications").insert({
        type: n.type === "ticket" || n.type === "career" || n.type === "chat" || n.type === "security" ? "system" : n.type,
        title: n.title,
        message: n.message,
        href: n.href,
      });
    } catch {}
  }, [notifyUserLocally]);

  const sendTestNotification = useCallback(async () => {
    const sampleTypes: NotificationType[] = ["lead", "ticket", "security", "chat"];
    const pickedType = sampleTypes[Math.floor(Math.random() * sampleTypes.length)];
    const titles: Record<NotificationType, string> = {
      lead: "New Enterprise RFP Received",
      ticket: "High Priority Support Ticket #4109",
      career: "New Senior Security Engineer Application",
      chat: "Visitor Requested Live WhatsApp Engineer",
      security: "New Admin Workspace Login from Cairo, EG",
      slide: "Homepage Hero Slide Updated",
      system: "Automated Database Snapshot Completed",
    };
    const messages: Record<NotificationType, string> = {
      lead: "PetroTech Group requested a turnkey CCTV and Access Control quotation for Cairo HQ.",
      ticket: "Client reported network latency in Zone B server racks. SLA response: 2 hours.",
      career: "Eng. Ahmed Tarek submitted CV for Lead Network Solutions Architect.",
      chat: "Visitor on /services/datacenter requested direct technical proposal on WhatsApp.",
      security: "Administrator signed in with verified 2FA credentials.",
      slide: "Slider item 'Mega Infrastructure Solutions' is now published live.",
      system: "Daily automated backup of database tables and media storage finished successfully.",
    };

    await add({
      type: pickedType,
      title: titles[pickedType] || "Test Notification",
      message: messages[pickedType] || "This is a real-time test notification verifying all active channels.",
      href: "/dashboard/admin/notifications",
      priority: "important",
    });
  }, [add]);

  // Filter visible notifications based on enabled categories and priority
  const visible = useMemo(() => {
    return notifications.filter((n) => {
      if (!settings.enabled[n.type]) return false;
      if (settings.priorityFilter === "important") {
        return n.priority === "important" || n.priority === "critical" || n.type === "lead" || n.type === "security";
      }
      if (settings.priorityFilter === "critical") {
        return n.priority === "critical" || n.type === "security";
      }
      return true;
    });
  }, [notifications, settings.enabled, settings.priorityFilter]);

  const unreadCount = useMemo(() => visible.filter((n) => !n.read).length, [visible]);

  const value = useMemo<Ctx>(
    () => ({
      notifications: visible,
      unreadCount,
      loading,
      hasMore,
      desktopPermission,
      requestDesktopPermission,
      loadMore,
      markAsRead,
      markAllAsRead,
      clearAll,
      add,
      sendTestNotification,
      settings,
      updateSettings,
      saveSettings,
      savingSettings,
    }),
    [
      visible,
      unreadCount,
      loading,
      hasMore,
      desktopPermission,
      requestDesktopPermission,
      loadMore,
      markAsRead,
      markAllAsRead,
      clearAll,
      add,
      sendTestNotification,
      settings,
      updateSettings,
      saveSettings,
      savingSettings,
    ],
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
