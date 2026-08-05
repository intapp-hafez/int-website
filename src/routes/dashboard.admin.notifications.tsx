import { createFileRoute } from "@tanstack/react-router";
import { Bell, Briefcase, Images, Info } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { useNotifications, type NotificationType, type NotificationFrequency } from "@/lib/notifications-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/admin/notifications")({
  head: () => ({ meta: [{ title: "Notification settings" }] }),
  component: NotificationsSettingsPage,
});

const TYPE_META: Record<NotificationType, { icon: typeof Bell; en: string; ar: string; descEn: string; descAr: string }> = {
  lead: { icon: Briefcase, en: "Leads", ar: "العملاء المحتملون", descEn: "New inquiries and lead status changes.", descAr: "الاستفسارات الجديدة وتغيرات حالة العملاء." },
  slide: { icon: Images, en: "Slide updates", ar: "تحديثات الشرائح", descEn: "Homepage carousel publishing activity.", descAr: "نشاط نشر شرائح الصفحة الرئيسية." },
  system: { icon: Info, en: "System messages", ar: "رسائل النظام", descEn: "Backups, maintenance, and platform alerts.", descAr: "النسخ الاحتياطي والصيانة وتنبيهات النظام." },
};

const FREQUENCIES: { value: NotificationFrequency; en: string; ar: string; descEn: string; descAr: string }[] = [
  { value: "instant", en: "Instant", ar: "فوري", descEn: "Receive every notification as it happens.", descAr: "استلم كل إشعار فور حدوثه." },
  { value: "hourly", en: "Hourly digest", ar: "ملخص كل ساعة", descEn: "Group notifications and surface them once an hour.", descAr: "تجميع الإشعارات وعرضها كل ساعة." },
  { value: "daily", en: "Daily digest", ar: "ملخص يومي", descEn: "One summary per day.", descAr: "ملخص واحد في اليوم." },
];

function NotificationsSettingsPage() {
  const { lang } = useAdminT();
  const ar = lang === "ar";
  const { settings, updateSettings } = useNotifications();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">{ar ? "إعدادات الإشعارات" : "Notification settings"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ar ? "تحكم في أنواع الإشعارات التي تظهر في الجرس وعدد مرات استلامها." : "Control which notification types appear in the bell and how often you receive them."}
        </p>
      </header>

      <section className="bg-card border rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-1">{ar ? "أنواع الإشعارات" : "Notification types"}</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {ar ? "تعطيل أي نوع يخفيه من قائمة الجرس وعداد غير المقروء." : "Disabling a type hides it from the bell dropdown and unread counter."}
        </p>
        <ul className="divide-y">
          {(Object.keys(TYPE_META) as NotificationType[]).map((key) => {
            const meta = TYPE_META[key];
            const Icon = meta.icon;
            const checked = settings.enabled[key];
            return (
              <li key={key} className="py-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-muted text-foreground/80 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor={`type-${key}`} className="text-sm font-medium cursor-pointer">
                    {ar ? meta.ar : meta.en}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{ar ? meta.descAr : meta.descEn}</p>
                </div>
                <Switch
                  id={`type-${key}`}
                  checked={checked}
                  onCheckedChange={(v) => updateSettings({ enabled: { ...settings.enabled, [key]: v } })}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-card border rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-1">{ar ? "تكرار الإشعارات" : "Notification frequency"}</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {ar ? "اختر عدد المرات التي تظهر فيها الإشعارات." : "Choose how often new notifications surface."}
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {FREQUENCIES.map((f) => {
            const selected = settings.frequency === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => updateSettings({ frequency: f.value })}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  selected ? "border-accent bg-accent/5 ring-1 ring-accent" : "hover:bg-muted/60"
                }`}
              >
                <div className="text-sm font-medium">{ar ? f.ar : f.en}</div>
                <div className="text-xs text-muted-foreground mt-1">{ar ? f.descAr : f.descEn}</div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}