import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Loader2,
  Mail,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  AlertCircle,
  Server,
  KeyRound,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Terminal,
  Zap,
  Lock,
} from "lucide-react";
import { useCanAccess } from "@/lib/permissions-store";
import {
  useSmtp,
  SMTP_PRESETS,
  type SmtpProvider,
  type EncryptionType,
} from "@/lib/smtp-store";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/smtp")({
  head: () => ({ meta: [{ title: "SMTP Settings — Admin Dashboard" }] }),
  component: SmtpAdminPage,
});

function SmtpAdminPage() {
  const can = useCanAccess("smtp");
  const { lang } = useI18n();
  const isAr = lang === "ar";

  const { settings, loading, saving, testing, save, applyPreset, testConnection, reset } =
    useSmtp();

  const [formData, setFormData] = useState(settings);
  const [showPw, setShowPw] = useState(false);
  const [testEmail, setTestEmail] = useState(
    settings.test_recipient || settings.from_email || "info@integratedtechnics.com"
  );
  const [activePreset, setActivePreset] = useState<SmtpProvider>(settings.provider || "hostinger");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    log: string;
  } | null>(
    settings.last_test_log
      ? {
          success: settings.last_test_status === "success",
          log: settings.last_test_log,
        }
      : null
  );

  useEffect(() => {
    setFormData(settings);
    setActivePreset(settings.provider || "hostinger");
    if (settings.test_recipient) {
      setTestEmail(settings.test_recipient);
    }
  }, [settings]);

  if (!can.view) {
    return (
      <div className="p-8 text-muted-foreground text-center">
        {isAr ? "ليس لديك صلاحية لعرض إعدادات الخادم." : "You do not have permission to view SMTP settings."}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span className="text-sm font-medium">{isAr ? "جاري تحميل إعدادات البريد..." : "Loading SMTP settings..."}</span>
      </div>
    );
  }

  const handleSelectPreset = (presetId: SmtpProvider) => {
    setActivePreset(presetId);
    applyPreset(presetId);
    const p = SMTP_PRESETS.find((item) => item.id === presetId);
    if (p) {
      setFormData((prev) => ({
        ...prev,
        provider: p.id,
        host: p.host || prev.host,
        port: p.port,
        secure: p.secure,
        encryption_type: p.encryption_type,
      }));
      toast.success(
        isAr ? `تم تطبيق إعدادات ${p.nameAr}` : `Applied ${p.nameEn} configuration preset`
      );
    }
  };

  const handleSaveAll = async () => {
    try {
      await save(formData);
      toast.success(
        isAr ? "تم حفظ إعدادات خادم البريد SMTP بنجاح" : "SMTP settings successfully saved and synced"
      );
    } catch (err: any) {
      toast.error(err?.message || (isAr ? "فشل حفظ الإعدادات" : "Failed to save settings"));
    }
  };

  const handleRunTest = async () => {
    if (!testEmail || !/^\S+@\S+\.\S+$/.test(testEmail)) {
      toast.error(isAr ? "يرجى إدخال بريد إلكتروني صحيح للاختبار" : "Please enter a valid test recipient email");
      return;
    }

    try {
      // Save current form state before testing
      await save({ ...formData, test_recipient: testEmail });
      const res = await testConnection(testEmail);
      setTestResult(res);
      if (res.success) {
        toast.success(
          isAr
            ? "تم اختبار الاتصال وإرسال رسالة الاختبار بنجاح!"
            : "Connection verified! Test email dispatched successfully."
        );
      } else {
        toast.error(
          isAr
            ? "فشل اختبار الاتصال بالخادم. يرجى مراجعة سجل الأخطاء."
            : "SMTP connection test failed. Please review diagnostic log."
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Test dispatch failed.");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center shadow-xs">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
                {isAr ? "إعدادات خادم البريد (SMTP)" : "Dynamic SMTP Settings"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isAr
                  ? "تهيئة خادم البريد الصادر، التوثيق الأمني، وهوية المرسل لإشعارات الموقع وعروض الأسعار."
                  : "Manage outgoing mail transport, SSL/TLS encryption, and automatic proposal notifications."}
              </p>
            </div>
          </div>
        </div>

        {/* Global Master Status Pill & Quick Save */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 ${
              formData.enabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                formData.enabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>
              {formData.enabled
                ? isAr
                  ? "البريد مفعّل"
                  : "SMTP Active"
                : isAr
                ? "البريد معطّل"
                : "SMTP Disabled"}
            </span>
          </div>

          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="shadow-sm font-semibold h-9 px-4"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 me-2" />
            )}
            <span>{isAr ? "حفظ التغييرات" : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {/* 1. PROVIDER PRESETS SELECTOR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <span>{isAr ? "اختر مزود الخدمة المسبق" : "Select Mail Provider Preset"}</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {isAr ? "يضبط المنفذ ونوع التشفير تلقائياً" : "Auto-configures host, port & encryption"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SMTP_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3.5 rounded-2xl border text-start transition-all relative overflow-hidden flex flex-col justify-between h-24 ${
                  isSelected
                    ? "border-accent bg-accent/10 shadow-sm ring-1 ring-accent"
                    : "border-border/70 bg-card hover:border-accent/40 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Badge
                    variant="outline"
                    className={`text-[9px] py-0 px-1.5 font-normal ${
                      isSelected ? "border-accent text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {preset.badge}
                  </Badge>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-accent" />}
                </div>

                <div>
                  <div className="font-bold text-xs text-foreground truncate">
                    {isAr ? preset.nameAr : preset.nameEn}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">
                    Port {preset.port} • {preset.encryption_type.toUpperCase()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Server, Credentials & Sender Config */}
        <div className="lg:col-span-7 space-y-6">
          {/* 2. SERVER CONNECTION CARD */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-accent" />
                  <CardTitle className="text-base font-bold">
                    {isAr ? "إعدادات اتصال الخادم" : "Server Connection"}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="smtp_enabled" className="text-xs cursor-pointer">
                    {isAr ? "تفعيل الإرسال" : "Enable Gateway"}
                  </Label>
                  <Switch
                    id="smtp_enabled"
                    checked={formData.enabled}
                    onCheckedChange={(v) => setFormData((prev) => ({ ...prev, enabled: v }))}
                  />
                </div>
              </div>
              <CardDescription className="text-xs">
                {isAr
                  ? "حدد عنوان المضيف ومنفذ الاتصال وبروتوكول الحماية المشفر."
                  : "Configure hostname, port, and SSL/TLS transport protocol."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">{isAr ? "عنوان خادم SMTP" : "SMTP Hostname"}</Label>
                  <Input
                    value={formData.host}
                    onChange={(e) => setFormData((prev) => ({ ...prev, host: e.target.value }))}
                    placeholder="smtp.hostinger.com"
                    className="font-mono text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isAr ? "المنفذ (Port)" : "Port"}</Label>
                  <Input
                    type="number"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, port: Number(e.target.value) || 0 }))
                    }
                    placeholder="465"
                    className="font-mono text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-foreground">
                      {isAr ? "استخدام تشفير SSL/TLS" : "Enforce SSL/TLS"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {isAr ? "موصى به للمنفذ 465" : "Recommended for port 465"}
                    </div>
                  </div>
                  <Switch
                    checked={formData.secure}
                    onCheckedChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        secure: v,
                        encryption_type: v ? "ssl" : "tls",
                      }))
                    }
                  />
                </div>

                <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-foreground">
                      {isAr ? "نوع التشفير" : "Encryption Protocol"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formData.secure ? "Direct SSL/TLS (Implicit)" : "STARTTLS (Explicit)"}
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                    {formData.encryption_type}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. AUTHENTICATION & CREDENTIALS */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-accent" />
                <CardTitle className="text-base font-bold">
                  {isAr ? "بيانات الاعتماد والتوثيق" : "Authentication & Security"}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {isAr
                  ? "اسم المستخدم (البريد الإلكتروني الكامل) وكلمة المرور الخاصة بالصندوق."
                  : "Mailbox username and authentication password."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {isAr ? "اسم المستخدم (البريد الكامل)" : "Username (Full Mailbox Email)"}
                  </Label>
                  <Input
                    type="email"
                    autoComplete="off"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="info@integratedtechnics.com"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isAr ? "كلمة المرور" : "Password / App Key"}</Label>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••••••"
                      className="text-xs h-9 pe-9 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Provider Advice Alert */}
              <div className="p-3 rounded-xl border bg-accent/5 border-accent/15 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  {isAr
                    ? SMTP_PRESETS.find((p) => p.id === activePreset)?.authHintAr ||
                      "تأكد من إدخال كلمة المرور الصحيحة لحساب البريد الإلكتروني."
                    : SMTP_PRESETS.find((p) => p.id === activePreset)?.authHintEn ||
                      "Ensure your mailbox credentials allow authenticated SMTP access."}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. SENDER IDENTITY & BRAND PROFILE */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-accent" />
                <CardTitle className="text-base font-bold">
                  {isAr ? "هوية المرسل وعناوين الرد" : "Sender Identity & Reply-To"}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {isAr
                  ? "الاسم وعناوين البريد التي ستظهر للعملاء في صندوق الوارد."
                  : "Public sender information and customer reply-to address."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isAr ? "اسم المرسل" : "From Display Name"}</Label>
                  <Input
                    value={formData.from_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, from_name: e.target.value }))}
                    placeholder="Integrated Technics"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isAr ? "بريد المرسل" : "From Email Address"}</Label>
                  <Input
                    type="email"
                    value={formData.from_email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, from_email: e.target.value }))}
                    placeholder="info@integratedtechnics.com"
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold">
                  {isAr ? "عنوان الرد المباشر (Reply-To)" : "Reply-To Email Address (Optional)"}
                </Label>
                <Input
                  type="email"
                  value={formData.reply_to}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reply_to: e.target.value }))}
                  placeholder="sales@integratedtechnics.com"
                  className="text-xs h-9"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Testing Engine & Interactive Diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          {/* 5. LIVE TEST EMAIL DISPATCHER */}
          <Card className="border shadow-xs border-accent/20 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-accent" />
                <CardTitle className="text-base font-bold">
                  {isAr ? "اختبار الاتصال والإرسال الحي" : "Test SMTP Connection"}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {isAr
                  ? "أرسل رسالة اختبار فورية للتحقق من صحة الإعدادات والمصادقة."
                  : "Dispatch a real-time test email to verify host handshake and credentials."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {isAr ? "البريد المستلم للاختبار" : "Test Recipient Email"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="text-xs h-9"
                  />
                  <Button
                    type="button"
                    onClick={handleRunTest}
                    disabled={testing || saving}
                    className="h-9 px-4 shrink-0 font-semibold shadow-xs"
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                    ) : (
                      <Send className="h-3.5 w-3.5 me-1.5" />
                    )}
                    <span>{isAr ? "اختبار" : "Send Test"}</span>
                  </Button>
                </div>
              </div>

              {/* Diagnostic Terminal Output Box */}
              {testResult && (
                <div className="space-y-2 pt-2 animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Terminal className="h-3.5 w-3.5 text-accent" />
                      <span>{isAr ? "سجل التشخيص الفني" : "Diagnostic Output"}</span>
                    </div>
                    <Badge
                      variant={testResult.success ? "default" : "destructive"}
                      className="text-[10px] py-0 px-2 font-mono"
                    >
                      {testResult.success
                        ? isAr
                          ? "تم التحقق 250 OK"
                          : "250 OK Verified"
                        : isAr
                        ? "فشل الاتصال"
                        : "Handshake Error"}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/60 border font-mono text-[11px] text-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {testResult.log}
                  </div>
                </div>
              )}

              {/* Last Verification Timestamp */}
              {settings.last_tested_at && (
                <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/50">
                  <span>{isAr ? "آخر اختبار تم تنفيذه:" : "Last verified:"}</span>
                  <span className="font-mono text-foreground">
                    {new Date(settings.last_tested_at).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 6. OUTGOING BRAND EMAIL TEMPLATE PREVIEW */}
          <Card className="border shadow-xs bg-muted/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <CardTitle className="text-sm font-bold">
                  {isAr ? "معاينة ترويسة الرسائل الصادرة" : "Outgoing Notification Preview"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="font-bold text-foreground">
                    {formData.from_name || "Integrated Technics"}
                  </div>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {formData.from_email || "info@integratedtechnics.com"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">
                    {isAr ? "تأكيد استلام طلب عرض السعر #IT-9402" : "Proposal Request Received #IT-9402"}
                  </div>
                  <div className="text-muted-foreground text-[11px] leading-relaxed">
                    {isAr
                      ? "شكراً لتواصلكم مع إنترجريتد تكنيكس. تم تحويل طلبكم لكبار مهندسينا لإعداد العرض الفني."
                      : "Thank you for engaging Integrated Technics. Your turnkey infrastructure inquiry has been assigned to our senior solutions architects."}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 border-t flex items-center justify-between">
                  <span>Reply-To: {formData.reply_to || formData.from_email}</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={reset}
              >
                <RotateCcw className="h-3.5 w-3.5 me-1" />
                <span>{isAr ? "إعادة للوضع الافتراضي" : "Reset Defaults"}</span>
              </Button>

              <Button size="sm" onClick={handleSaveAll} disabled={saving} className="text-xs font-semibold">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin me-1" /> : <Save className="h-3.5 w-3.5 me-1" />}
                <span>{isAr ? "حفظ" : "Save"}</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}