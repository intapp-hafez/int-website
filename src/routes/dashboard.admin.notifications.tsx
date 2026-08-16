import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  Briefcase,
  Images,
  Info,
  Volume2,
  VolumeX,
  Radio,
  Mail,
  Send,
  Sparkles,
  ShieldCheck,
  LifeBuoy,
  GraduationCap,
  MessageCircle,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Play,
  Trash2,
  CheckCheck,
  Clock,
  Globe,
  Sliders,
  Check,
  Loader2,
} from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import {
  useNotifications,
  type NotificationType,
  type NotificationFrequency,
  type NotificationPriority,
} from "@/lib/notifications-store";
import { playNotificationSound, type SoundTone } from "@/lib/notifications-sound";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/notifications")({
  head: () => ({ meta: [{ title: "Notification Settings — Integrated Technics" }] }),
  component: NotificationsSettingsPage,
});

type TypeMeta = {
  icon: any;
  tone: string;
  en: string;
  ar: string;
  descEn: string;
  descAr: string;
  tagEn: string;
  tagAr: string;
};

const TYPE_META: Record<NotificationType, TypeMeta> = {
  lead: {
    icon: Briefcase,
    tone: "text-accent bg-accent/10 border-accent/20",
    en: "New Leads & Quotations",
    ar: "طلبات عروض الأسعار والعملاء",
    descEn: "Incoming RFQs, project estimations, and consultation requests.",
    descAr: "طلبات عروض الأسعار الجديدة ودراسات المشاريع واستفسارات العملاء.",
    tagEn: "Commercial",
    tagAr: "تجاري",
  },
  ticket: {
    icon: LifeBuoy,
    tone: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    en: "Support Tickets & Maintenance",
    ar: "تذاكر الدعم الفني والصيانة",
    descEn: "Urgent engineering tickets, client SLA alerts, and maintenance logs.",
    descAr: "تذاكر الصيانة الطارئة وتنبيهات اتفاقيات مستوى الخدمة (SLA).",
    tagEn: "Operations",
    tagAr: "تشغيل وصيانة",
  },
  career: {
    icon: GraduationCap,
    tone: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    en: "Careers & Job Applications",
    ar: "طلبات التوظيف والسير الذاتية",
    descEn: "New candidate applications for engineering and management roles.",
    descAr: "طلبات المتقدمين للوظائف الهندسية والإدارية الجديدة.",
    tagEn: "HR",
    tagAr: "الموارد البشرية",
  },
  chat: {
    icon: MessageCircle,
    tone: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    en: "Chatbot & Live Inquiries",
    ar: "المساعد الذكي والمحادثات المباشرة",
    descEn: "Visitor inquiries escalated to live WhatsApp/human support.",
    descAr: "استفسارات الزوار المحولة للدعم البشري أو عبر واتساب.",
    tagEn: "Live Chat",
    tagAr: "محادثة حية",
  },
  security: {
    icon: ShieldCheck,
    tone: "text-red-500 bg-red-500/10 border-red-500/20",
    en: "Security & Access Control",
    ar: "الأمان وإدارة الصلاحيات",
    descEn: "Admin logins, access grant requests, and security audit events.",
    descAr: "تسجيلات دخول المديرين وطلبات منح الصلاحيات وأحداث الأمان.",
    tagEn: "Security",
    tagAr: "الأمان",
  },
  slide: {
    icon: Images,
    tone: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    en: "Homepage Carousel & CMS",
    ar: "شرائح الصفحة الرئيسية والمحتوى",
    descEn: "Hero slides publishing, project catalog, and partner updates.",
    descAr: "نشر شرائح الواجهة الرئيسية وتحديثات المشاريع والشركاء.",
    tagEn: "Content",
    tagAr: "المحتوى",
  },
  system: {
    icon: Info,
    tone: "text-muted-foreground bg-muted border-border",
    en: "System Health & SEO Bot",
    ar: "حالة النظام ومحرك SEO",
    descEn: "SEO autopilot recommendations, database snapshots, and platform health.",
    descAr: "توصيات محرك السيو التلقائي والنسخ الاحتياطي وسلامة المنصة.",
    tagEn: "System",
    tagAr: "النظام",
  },
};

const FREQUENCIES: { value: NotificationFrequency; en: string; ar: string; descEn: string; descAr: string }[] = [
  { value: "instant", en: "Instant", ar: "فوري", descEn: "Receive alerts immediately upon event trigger.", descAr: "استلم التنبيه في نفس لحظة حدوثه." },
  { value: "hourly", en: "Hourly Digest", ar: "ملخص كل ساعة", descEn: "Group alerts into an hourly report.", descAr: "تجميع التنبيهات في تقرير دوري كل ساعة." },
  { value: "daily", en: "Daily Summary", ar: "ملخص يومي", descEn: "Single consolidated briefing at start of day.", descAr: "تقرير موحد وشامل بداية كل يوم عمل." },
  { value: "weekly", en: "Weekly Briefing", ar: "تقرير أسبوعي", descEn: "Executive weekly digest of activity.", descAr: "ملخص تنفيذي أسبوعي لجميع الأنشطة." },
];

const SOUND_TONES: { value: SoundTone; en: string; ar: string }[] = [
  { value: "chime", en: "Modern Chime", ar: "رنين عصري (افتراضي)" },
  { value: "bell", en: "Crystal Bell", ar: "جرس بلوري" },
  { value: "ping", en: "Subtle Ping", ar: "تنبيه هادئ (Ping)" },
  { value: "marimba", en: "Marimba Pulse", ar: "إيقاع ماريمبا" },
];

function NotificationsSettingsPage() {
  const { lang } = useAdminT();
  const ar = lang === "ar";
  const {
    settings,
    updateSettings,
    saveSettings,
    savingSettings,
    desktopPermission,
    requestDesktopPermission,
    sendTestNotification,
    notifications,
    unreadCount,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const [testing, setTesting] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [activeTab, setActiveTab] = useState<"channels" | "events" | "rules" | "history">("channels");

  const handleSavePreferences = async () => {
    const ok = await saveSettings();
    if (ok) {
      toast.success(ar ? "تم حفظ إعدادات الإشعارات ومزامنتها في قاعدة البيانات بنجاح!" : "Notification settings saved and synced to database!");
    } else {
      toast.info(ar ? "تم الحفظ محلياً وجاري المزامنة مع قاعدة البيانات" : "Saved locally and syncing with database");
    }
  };

  const handleSendTest = async () => {
    setTesting(true);
    try {
      await sendTestNotification();
      toast.success(
        ar ? "تم إرسال إشعار تجريبي فوري عبر القنوات المفعلة!" : "Test notification dispatched to active channels!",
      );
    } catch {
      toast.error(ar ? "فشل إرسال الإشعار التجريبي" : "Failed to dispatch test notification");
    } finally {
      setTesting(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!settings.webhookUrl.trim()) {
      toast.error(ar ? "يرجى كتابة رابط Webhook أولاً" : "Please enter a webhook URL first");
      return;
    }
    setTestingWebhook(true);
    const testPayload = {
      event: "admin_notification.test",
      timestamp: new Date().toISOString(),
      text: "🔔 [TEST] Integrated Technics Notification Webhook is connected and verified!",
      content: "🔔 [TEST] Integrated Technics Notification Webhook is connected and verified!",
      notification: {
        id: "test-ping",
        type: "lead",
        title: "Test Lead Notification",
        message: "PetroTech Group requested a turnkey CCTV quotation for Cairo HQ.",
        href: "/dashboard/admin/notifications",
        created_at: new Date().toISOString(),
      },
    };

    try {
      await fetch(settings.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
        mode: "no-cors",
      });
      toast.success(
        ar
          ? `تم إرسال حمولة الويب هوك بنجاح إلى: ${settings.webhookUrl.slice(0, 32)}...`
          : `Test webhook payload dispatched successfully!`,
      );
    } catch (err: any) {
      toast.error(ar ? `فشل إرسال الويب هوك: ${err?.message}` : `Webhook failed: ${err?.message}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleRequestPush = async () => {
    const granted = await requestDesktopPermission();
    if (granted) {
      toast.success(ar ? "تم تفعيل إشعارات المتصفح بنجاح!" : "Browser desktop notifications enabled!");
      new Notification(ar ? "إشعارات Integrated Technics" : "Integrated Technics Notifications", {
        body: ar ? "تم تفعيل التنبيهات على سطح المكتب بنجاح." : "Desktop alerts are now active.",
      });
    } else {
      toast.error(ar ? "تم رفض الإذن أو لم يتم منحه من المتصفح" : "Permission was not granted by browser");
    }
  };

  const enabledCount = Object.values(settings.enabled).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {ar ? "مركز التحكم في الإشعارات" : "Notification Settings & Center"}
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {enabledCount}/7 {ar ? "قنوات مفعلة" : "Active"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {ar
              ? "تحكم في التنبيهات الصوتية، إشعارات المتصفح الفورية، البريد الإلكتروني، وتكاملات واتساب والويب هوك."
              : "Configure real-time audio chimes, browser desktop push, email digests, WhatsApp, and webhook alerts."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSendTest}
            disabled={testing}
            className="shadow-xs"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 me-1.5 text-accent" />
            )}
            {ar ? "إرسال إشعار تجريبي" : "Send Test Notification"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSavePreferences}
            disabled={savingSettings}
            className="shadow-xs"
          >
            {savingSettings ? <Loader2 className="h-4 w-4 me-1.5 animate-spin" /> : <Check className="h-4 w-4 me-1.5" />}
            {ar ? "حفظ الإعدادات" : "Save Preferences"}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-1 transition-colors flex items-center gap-2 ${
            activeTab === "channels"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Radio className="h-4 w-4" />
          {ar ? "قنوات التنبيه (صوت، متصفح، بريد)" : "Delivery Channels"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-1 transition-colors flex items-center gap-2 ${
            activeTab === "events"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="h-4 w-4" />
          {ar ? "أنواع وتصنيفات الأحداث" : "Event Categories"}
          <Badge variant="outline" className="text-[10px] py-0 h-4">
            {enabledCount}
          </Badge>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-1 transition-colors flex items-center gap-2 ${
            activeTab === "rules"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Moon className="h-4 w-4" />
          {ar ? "ساعات الهدوء والأولويات" : "Quiet Hours & Rules"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-1 transition-colors flex items-center gap-2 ${
            activeTab === "history"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-4 w-4" />
          {ar ? "سجل التنبيهات المباشر" : "Notification Feed"}
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-[10px] py-0 h-4">
              {unreadCount}
            </Badge>
          )}
        </button>
      </div>

      {/* TAB 1: DELIVERY CHANNELS */}
      {activeTab === "channels" && (
        <div className="space-y-6">
          {/* Sound Chimes */}
          <section className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  {settings.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <h2 className="text-base font-semibold">{ar ? "التنبيهات الصوتية الحية (Audio Chimes)" : "Live Audio Sound Chimes"}</h2>
                  <p className="text-xs text-muted-foreground">
                    {ar
                      ? "تشغيل نغمة صوتية فورية وعالية الوضوح عند وصول طلب عرض سعر جديد أو تذكرة صيانة."
                      : "Play a crisp synthesized chime when high-priority leads, tickets, or access requests arrive."}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(v) => updateSettings({ soundEnabled: v })}
              />
            </div>

            {settings.soundEnabled && (
              <div className="pt-3 border-t grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">{ar ? "اختر نغمة التنبيه" : "Notification Sound Tone"}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SOUND_TONES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          updateSettings({ soundTone: t.value });
                          playNotificationSound(t.value, settings.soundVolume);
                        }}
                        className={`px-3 py-2 text-xs rounded-xl border flex items-center justify-between transition-all ${
                          settings.soundTone === t.value
                            ? "border-accent bg-accent/10 text-accent font-semibold ring-1 ring-accent"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span>{ar ? t.ar : t.en}</span>
                        <Play className="h-3 w-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{ar ? "مستوى الصوت" : "Volume Level"}</span>
                    <span className="font-mono text-muted-foreground">{Math.round(settings.soundVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[settings.soundVolume * 100]}
                    max={100}
                    step={5}
                    onValueChange={(vals) => updateSettings({ soundVolume: (vals[0] ?? 80) / 100 })}
                    className="py-2"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => playNotificationSound(settings.soundTone, settings.soundVolume)}
                  >
                    <Play className="h-3.5 w-3.5 me-1.5" />
                    {ar ? "تجربة الصوت الحالي" : "Play Sound Sample"}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Browser Desktop Push */}
          <section className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{ar ? "إشعارات المتصفح وسطح المكتب" : "Browser Desktop Push Notifications"}</h2>
                    <Badge
                      variant={
                        desktopPermission === "granted"
                          ? "default"
                          : desktopPermission === "denied"
                          ? "destructive"
                          : "outline"
                      }
                      className="text-[10px] py-0"
                    >
                      {desktopPermission === "granted"
                        ? ar ? "مفعلة بالمتصفح" : "Browser Allowed"
                        : desktopPermission === "denied"
                        ? ar ? "محظورة بالمتصفح" : "Blocked"
                        : ar ? "تحتاج إذن" : "Permission Needed"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ar
                      ? "استلام تنبيهات حقيقية على سطح المكتب حتى عند تصغير المتصفح أو تصفح علامة تبويب أخرى."
                      : "Receive OS desktop alerts with title, description, and 1-click navigation even when tab is backgrounded."}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.desktopEnabled && desktopPermission === "granted"}
                onCheckedChange={(v) => {
                  if (v && desktopPermission !== "granted") {
                    handleRequestPush();
                  } else {
                    updateSettings({ desktopEnabled: v });
                  }
                }}
              />
            </div>

            {desktopPermission !== "granted" && (
              <div className="pt-2 border-t flex items-center justify-between gap-4 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {ar
                    ? "يتطلب المتصفح موافقتك الصريحة لإرسال تنبيهات سطح المكتب."
                    : "Your browser requires explicit permission to display desktop push banners."}
                </p>
                <Button size="sm" variant="outline" onClick={handleRequestPush}>
                  <Radio className="h-3.5 w-3.5 me-1.5 text-blue-500" />
                  {ar ? "منح إذن الإشعارات الآن" : "Grant Browser Permission"}
                </Button>
              </div>
            )}
          </section>

          {/* Email Notifications */}
          <section className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{ar ? "إشعارات البريد الإلكتروني" : "Email Notification Alerts"}</h2>
                  <p className="text-xs text-muted-foreground">
                    {ar
                      ? "إرسال ملخصات وتقارير دورية عبر البريد الإلكتروني للمسؤولين."
                      : "Forward instant leads and periodic executive briefings directly to team inboxes."}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(v) => updateSettings({ emailEnabled: v })}
              />
            </div>

            {settings.emailEnabled && (
              <div className="pt-3 border-t grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{ar ? "عناوين البريد المستلمة (مفصولة بفاصلة)" : "Recipient Email Addresses"}</Label>
                  <Input
                    value={settings.emailRecipients}
                    onChange={(e) => updateSettings({ emailRecipients: e.target.value })}
                    placeholder="admin@integratedtechnics.com, sales@integratedtechnics.com"
                    className="text-xs h-9 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {ar ? "يمكنك كتابة أكثر من بريد مفصولين بفاصلة (,)." : "Separate multiple addresses with commas."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{ar ? "تكرار إرسال البريد" : "Digest Frequency"}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FREQUENCIES.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => updateSettings({ emailFrequency: f.value })}
                        className={`px-3 py-2 text-xs rounded-xl border text-start transition-all ${
                          settings.emailFrequency === f.value
                            ? "border-purple-500 bg-purple-500/10 text-purple-600 font-semibold ring-1 ring-purple-500"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div>{ar ? f.ar : f.en}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Webhook & WhatsApp Integrations */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* WhatsApp Alerts */}
            <section className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{ar ? "تنبيهات واتساب المباشرة" : "WhatsApp Instant Alerts"}</h3>
                    <p className="text-xs text-muted-foreground">{ar ? "إشعار فوري للطلبات العاجلة" : "Instant VIP lead alerts"}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.whatsappEnabled}
                  onCheckedChange={(v) => updateSettings({ whatsappEnabled: v })}
                />
              </div>

              {settings.whatsappEnabled && (
                <div className="space-y-1.5 pt-2 border-t">
                  <Label className="text-xs font-semibold">{ar ? "رقم هاتف المسؤول (مع كود الدولة)" : "Admin Phone Number (with country code)"}</Label>
                  <Input
                    value={settings.whatsappPhone}
                    onChange={(e) => updateSettings({ whatsappPhone: e.target.value })}
                    placeholder="+20 100 741 9344"
                    className="text-xs h-9 font-mono"
                  />
                </div>
              )}
            </section>

            {/* Webhook URL */}
            <section className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{ar ? "تكامل Webhook (Slack / Discord)" : "Webhook Integration"}</h3>
                    <p className="text-xs text-muted-foreground">{ar ? "إرسال البيانات لخدماتك الخارجية" : "Post payloads to custom endpoint"}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.webhookEnabled}
                  onCheckedChange={(v) => updateSettings({ webhookEnabled: v })}
                />
              </div>

              {settings.webhookEnabled && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">{ar ? "رابط الويب هوك (URL)" : "Webhook Endpoint URL"}</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">Slack / Discord / Zapier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={settings.webhookUrl}
                      onChange={(e) => updateSettings({ webhookUrl: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="text-xs h-9 font-mono flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook}
                      className="text-xs shrink-0"
                      title={ar ? "إرسال اختبار" : "Send Test Ping"}
                    >
                      {testingWebhook ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {ar
                      ? "يتم إرسال الويب هوك فورًا وبشكل غير متزامن من قاعدة بيانات Supabase (عبر pg_net) عند أي إشعار جديد."
                      : "Dispatched asynchronously from Supabase database (via pg_net) upon every new notification insert."}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: EVENT CATEGORIES */}
      {activeTab === "events" && (
        <section className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-semibold">{ar ? "أنواع وتصنيفات الأحداث" : "Notification Event Types"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ar
                ? "تفعيل أو تعطيل التنبيهات لكل نوع من الأنشطة داخل الموقع والمنصة."
                : "Toggle alerts on or off per business workflow and platform module."}
            </p>
          </div>

          <div className="divide-y">
            {(Object.keys(TYPE_META) as NotificationType[]).map((key) => {
              const meta = TYPE_META[key];
              const Icon = meta.icon;
              const checked = settings.enabled[key];
              const categoryEmail = settings.categoryEmails?.[key] ?? "";

              return (
                <div key={key} className="py-4 space-y-3 hover:bg-muted/20 px-3 rounded-2xl transition-colors border border-transparent hover:border-border">
                  <div className="flex items-start gap-4">
                    <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${meta.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`type-${key}`} className="text-sm font-semibold cursor-pointer">
                          {ar ? meta.ar : meta.en}
                        </Label>
                        <Badge variant="outline" className="text-[10px] py-0">
                          {ar ? meta.tagAr : meta.tagEn}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {ar ? meta.descAr : meta.descEn}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`type-${key}`}
                        checked={checked}
                        onCheckedChange={(v) => updateSettings({ enabled: { ...settings.enabled, [key]: v } })}
                      />
                    </div>
                  </div>

                  {/* Recipient Emails for this specific event type */}
                  <div className="ms-0 md:ms-15 pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center gap-2 bg-muted/40 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0 min-w-[150px]">
                      <Mail className="h-3.5 w-3.5 text-accent" />
                      <span>{ar ? "البريد المستلم لهذا الإشعار:" : "Send notifications to:"}</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={categoryEmail}
                        onChange={(e) => {
                          updateSettings({
                            categoryEmails: {
                              ...settings.categoryEmails,
                              [key]: e.target.value,
                            },
                          });
                        }}
                        placeholder={
                          key === "lead"
                            ? "sales@integratedtechnics.com, commercial@integratedtechnics.com"
                            : key === "ticket"
                            ? "support@integratedtechnics.com, helpdesk@integratedtechnics.com"
                            : key === "career"
                            ? "hr@integratedtechnics.com, careers@integratedtechnics.com"
                            : key === "chat"
                            ? "livechat@integratedtechnics.com, support@integratedtechnics.com"
                            : key === "security"
                            ? "security@integratedtechnics.com, it-admin@integratedtechnics.com"
                            : "admin@integratedtechnics.com"
                        }
                        className="text-xs h-8 font-mono bg-card"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: QUIET HOURS & RULES */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          {/* Quiet Hours / DND */}
          <section className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{ar ? "وضع عدم الإزعاج (Quiet Hours / DND)" : "Quiet Hours / Do Not Disturb (DND)"}</h2>
                  <p className="text-xs text-muted-foreground">
                    {ar
                      ? "كتم الأصوات وتنبيهات سطح المكتب أثناء ساعات النوم أو الراحة مع استمرار التوثيق في الجرس."
                      : "Mute sound chimes and desktop popups during off-hours while silently logging in the bell."}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.dndEnabled}
                onCheckedChange={(v) => updateSettings({ dndEnabled: v })}
              />
            </div>

            {settings.dndEnabled && (
              <div className="pt-3 border-t grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{ar ? "بداية وقت الهدوء" : "Start Time (Silence begins)"}</Label>
                  <Input
                    type="time"
                    value={settings.dndStart}
                    onChange={(e) => updateSettings({ dndStart: e.target.value })}
                    className="text-xs h-9 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{ar ? "نهاية وقت الهدوء" : "End Time (Resume alerts)"}</Label>
                  <Input
                    type="time"
                    value={settings.dndEnd}
                    onChange={(e) => updateSettings({ dndEnd: e.target.value })}
                    className="text-xs h-9 font-mono"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Priority Threshold */}
          <section className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-semibold">{ar ? "تصفية مستوى الأهمية" : "Priority Alert Threshold"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ar
                  ? "تحديد الحد الأدنى لأهمية التنبيهات التي تظهر في شارة الجرس."
                  : "Filter alerts displayed in your notification tray by minimum priority."}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { value: "all", en: "All Notifications", ar: "كل الإشعارات", descEn: "Show every alert without filtering", descAr: "عرض جميع الأنشطة والتنبيهات" },
                { value: "important", en: "Important & Critical", ar: "الهام والطارئ فقط", descEn: "Leads, urgent tickets, and security", descAr: "عروض الأسعار والتذاكر والأمان" },
                { value: "critical", en: "Critical Emergencies", ar: "الحالات الحرجة فقط", descEn: "Only security alarms & severe SLA issues", descAr: "تنبيهات الأمان القصوى فقط" },
              ].map((p) => {
                const selected = settings.priorityFilter === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => updateSettings({ priorityFilter: p.value as any })}
                    className={`p-4 rounded-xl border text-start transition-all ${
                      selected
                        ? "border-accent bg-accent/5 ring-1 ring-accent font-semibold"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="text-sm font-semibold">{ar ? p.ar : p.en}</div>
                    <div className="text-xs text-muted-foreground mt-1">{ar ? p.descAr : p.descEn}</div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: REAL-TIME FEED */}
      {activeTab === "history" && (
        <section className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b">
            <div>
              <h2 className="text-base font-semibold">{ar ? "سجل التنبيهات المباشر" : "Live Notification History"}</h2>
              <p className="text-xs text-muted-foreground">{notifications.length} {ar ? "إشعار مسجل" : "notifications on record"}</p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button size="sm" variant="outline" onClick={() => void markAllAsRead()}>
                  <CheckCheck className="h-3.5 w-3.5 me-1.5 text-accent" />
                  {ar ? "تعليم الكل كمقروء" : "Mark All Read"}
                </Button>
              )}
              {notifications.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => void clearAll()} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5 me-1.5" />
                  {ar ? "مسح السجل" : "Clear All"}
                </Button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <CheckCircle2 className="h-10 w-10 text-accent/60 mx-auto" />
              <p className="text-sm font-medium">{ar ? "لا توجد إشعارات مسجلة حاليًا" : "No notifications on record"}</p>
              <p className="text-xs text-muted-foreground">{ar ? "استخدم زر 'إرسال إشعار تجريبي' لاختبار النظام." : "Click 'Send Test Notification' above to test the system."}</p>
            </div>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {notifications.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.system;
                const Icon = meta.icon;
                return (
                  <div key={n.id} className={`py-3 px-2 flex items-start gap-3 rounded-lg transition-colors ${!n.read ? "bg-accent/5 font-medium" : ""}`}>
                    <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${meta.tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{new Date(n.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}