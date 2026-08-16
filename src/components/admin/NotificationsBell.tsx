import { useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Briefcase, Images, Info, CheckCheck, Check, Settings, Loader2, LifeBuoy, GraduationCap, MessageCircle, ShieldCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, formatRelativeTime, type NotificationType } from "@/lib/notifications-store";
import { useAdminT } from "@/lib/admin-i18n";
import { cn } from "@/lib/utils";

const typeMeta: Record<NotificationType, { icon: typeof Bell; tone: string; label: { en: string; ar: string } }> = {
  lead: { icon: Briefcase, tone: "text-accent bg-accent/10", label: { en: "Lead", ar: "طلب عرض سعر" } },
  ticket: { icon: LifeBuoy, tone: "text-amber-500 bg-amber-500/10", label: { en: "Ticket", ar: "تذكرة صيانة" } },
  career: { icon: GraduationCap, tone: "text-purple-500 bg-purple-500/10", label: { en: "Career", ar: "طلب توظيف" } },
  chat: { icon: MessageCircle, tone: "text-emerald-500 bg-emerald-500/10", label: { en: "Chatbot", ar: "المحادثة" } },
  security: { icon: ShieldCheck, tone: "text-red-500 bg-red-500/10", label: { en: "Security", ar: "الأمان" } },
  slide: { icon: Images, tone: "text-blue-500 bg-blue-500/10", label: { en: "Slider", ar: "شرائح" } },
  system: { icon: Info, tone: "text-muted-foreground bg-muted", label: { en: "System", ar: "النظام" } },
};

export function NotificationsBell() {
  const { lang } = useAdminT();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loadMore, hasMore, loading } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread" | "lead">("all");

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    if (filter === "lead") return notifications.filter((n) => n.type === "lead");
    return notifications;
  }, [notifications, filter]);

  const leadUnread = useMemo(
    () => notifications.filter((n) => n.type === "lead" && !n.read).length,
    [notifications],
  );

  const handleClick = (id: string, href: string) => {
    void markAsRead(id);
    navigate({ to: href });
  };

  const markLeadsRead = async () => {
    const ids = notifications.filter((n) => n.type === "lead" && !n.read).map((n) => n.id);
    await Promise.all(ids.map((id) => markAsRead(id)));
  };

  const tabs: { key: typeof filter; en: string; ar: string; count?: number }[] = [
    { key: "all", en: "All", ar: "الكل", count: notifications.length },
    { key: "unread", en: "Unread", ar: "غير المقروء", count: unreadCount },
    { key: "lead", en: "Leads", ar: "العملاء", count: leadUnread },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={lang === "ar" ? "الإشعارات" : "Notifications"}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card hover:bg-muted transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-card">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <div className="text-sm font-semibold">{lang === "ar" ? "الإشعارات" : "Notifications"}</div>
            <div className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? lang === "ar" ? `${unreadCount} غير مقروء` : `${unreadCount} unread`
                : lang === "ar" ? "كل شيء محدّث" : "All caught up"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {filter === "lead" && leadUnread > 0 && (
              <button
                onClick={() => void markLeadsRead()}
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {lang === "ar" ? "تعليم العملاء كمقروء" : "Mark leads read"}
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllAsRead()}
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {lang === "ar" ? "تعليم الكل كمقروء" : "Mark all read"}
              </button>
            )}
            <Link
              to="/dashboard/admin/notifications"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              aria-label={lang === "ar" ? "إعدادات الإشعارات" : "Notification settings"}
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-2 border-b bg-muted/30">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "flex-1 text-xs px-2 py-1.5 rounded-md transition-colors inline-flex items-center justify-center gap-1.5",
                filter === t.key ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {lang === "ar" ? t.ar : t.en}
              {typeof t.count === "number" && t.count > 0 && (
                <span className={cn(
                  "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] inline-flex items-center justify-center",
                  filter === t.key ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                )}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <ul className="max-h-[420px] overflow-y-auto divide-y">
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              {filter === "unread"
                ? lang === "ar" ? "لا إشعارات غير مقروءة" : "No unread notifications"
                : filter === "lead"
                ? lang === "ar" ? "لا إشعارات عملاء" : "No lead notifications"
                : lang === "ar" ? "لا توجد إشعارات" : "No notifications"}
            </li>
          )}
          {filtered.map((n) => {
            const meta = typeMeta[n.type];
            const Icon = meta.icon;
            return (
              <li key={n.id} className={cn("relative group", !n.read && "bg-accent/5")}>
                <button
                  onClick={() => handleClick(n.id, n.href)}
                  className="w-full text-left px-4 py-3 flex gap-3 hover:bg-muted/60 transition-colors"
                >
                  <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", meta.tone)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {meta.label[lang === "ar" ? "ar" : "en"]}
                      </span>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </div>
                    <div className="text-sm font-medium truncate">{n.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {formatRelativeTime(n.createdAt, lang === "ar" ? "ar" : "en")}
                    </div>
                  </div>
                </button>
                {!n.read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); void markAsRead(n.id); }}
                    className="absolute top-3 right-3 inline-flex items-center justify-center h-6 w-6 rounded-full bg-card border opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground transition-opacity"
                    aria-label={lang === "ar" ? "تعليم كمقروء" : "Mark as read"}
                    title={lang === "ar" ? "تعليم كمقروء" : "Mark as read"}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="border-t px-4 py-2 flex items-center justify-center">
          {hasMore ? (
            <button
              onClick={() => void loadMore()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline disabled:opacity-60"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              {lang === "ar" ? "تحميل المزيد" : "Load more"}
            </button>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {lang === "ar" ? "لا مزيد من الإشعارات" : "No more notifications"}
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
