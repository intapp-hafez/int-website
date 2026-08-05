import { useEffect, useRef, useState } from "react";
import { Download, X, Share, Plus, MoreVertical, ChevronRight, ChevronLeft, Wifi, Signal, BatteryFull } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings-store";
import logo from "@/assets/logo.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "it-pwa-install-dismissed";
const INSTALLED_KEY = "it-pwa-installed";
export const INSTALL_OPEN_EVENT = "it-pwa-install-open";

export function triggerInstallPrompt() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INSTALL_OPEN_EVENT));
  }
}

function detectPlatform() {
  if (typeof window === "undefined") return "other" as const;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);
  if (isIOS) return "ios" as const;
  if (isAndroid && isFirefox) return "android-firefox" as const;
  if (isSafari) return "desktop-safari" as const;
  return "other" as const;
}

async function trackEvent(eventType: string, platform: string) {
  try {
    await supabase.from("pwa_install_events").insert({
      event_type: eventType,
      platform,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    });
  } catch {
    // analytics best-effort
  }
}

export function InstallPrompt() {
  const { lang, dir } = useI18n();
  const { settings } = useSettings();
  const cfg = settings.sticky.install;
  const isAr = lang === "ar";
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [platform, setPlatform] = useState<ReturnType<typeof detectPlatform>>("other");
  const [iosStep, setIosStep] = useState(0);
  const promptShownRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS only
      window.navigator.standalone === true ||
      localStorage.getItem(INSTALLED_KEY) === "1";

    if (standalone) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const p = detectPlatform();
    setPlatform(p);
    setVisible(true);
    void trackEvent("prompt_shown", p);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      void trackEvent("bip_available", p);
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setVisible(false);
      setDeferred(null);
      void trackEvent("app_installed", p);
    };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    const onExternalOpen = () => {
      const np = detectPlatform();
      setPlatform(np);
      setIosStep(0);
      void trackEvent("cta_external_open", np);
      if (deferred) {
        void onClickInstall();
      } else {
        setShowHelp(true);
      }
    };
    window.addEventListener(INSTALL_OPEN_EVENT, onExternalOpen);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(INSTALL_OPEN_EVENT, onExternalOpen);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferred]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setShowHelp(false);
    void trackEvent("dismissed", platform);
  };

  const onClickInstall = async () => {
    void trackEvent("cta_clicked", platform);
    if (deferred) {
      try {
        promptShownRef.current = true;
        await deferred.prompt();
        const choice = await deferred.userChoice;
        await trackEvent(
          choice.outcome === "accepted" ? "prompt_accepted" : "prompt_dismissed",
          platform,
        );
        if (choice.outcome === "accepted") {
          localStorage.setItem(INSTALLED_KEY, "1");
          setVisible(false);
        }
        setDeferred(null);
      } catch {
        setShowHelp(true);
      }
    } else {
      setIosStep(0);
      setShowHelp(true);
      void trackEvent("help_opened", platform);
    }
  };

  const t = {
    install: cfg.text[lang] || (isAr ? "تثبيت التطبيق" : "Install app"),
    close: isAr ? "إغلاق" : "Close",
    helpTitle: isAr ? "كيفية تثبيت التطبيق" : "How to install the app",
    helpDesc: isAr
      ? "اتبع الخطوات أدناه لإضافة التطبيق إلى جهازك."
      : "Follow the steps below to add the app to your device.",
    next: isAr ? "التالي" : "Next",
    back: isAr ? "السابق" : "Back",
    step: isAr ? "خطوة" : "Step",
    of: isAr ? "من" : "of",
  };

  const iosSteps = isAr
    ? [
        { title: "افتح قائمة المشاركة", desc: "اضغط على أيقونة المشاركة في شريط أدوات Safari بأسفل الشاشة." },
        { title: "اختر «أضف إلى الشاشة الرئيسية»", desc: "مرّر لأسفل في قائمة المشاركة حتى تجد الخيار، ثم اضغط عليه." },
        { title: "اضغط «إضافة» للتأكيد", desc: "ستظهر أيقونة التطبيق على شاشتك الرئيسية كأي تطبيق آخر." },
      ]
    : [
        { title: "Open the Share menu", desc: "Tap the Share icon in Safari's bottom toolbar." },
        { title: "Choose “Add to Home Screen”", desc: "Scroll down in the share sheet until you see the option, then tap it." },
        { title: "Tap “Add” to confirm", desc: "The app icon will appear on your home screen like any other app." },
      ];

  // Pixel-accurate iOS Safari screenshot mockup (LTR look — mirrored UI is unusual on iOS)
  const IosScreenshot = ({ step }: { step: number }) => (
    <div dir="ltr" className="relative mx-auto w-[220px] h-[440px] rounded-[36px] border-[3px] border-zinc-900 bg-white overflow-hidden shadow-elegant select-none">
      {/* Status bar */}
      <div className="absolute inset-x-0 top-0 h-7 px-4 flex items-center justify-between text-[10px] font-semibold text-zinc-900 bg-white">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <Signal className="h-2.5 w-2.5" />
          <Wifi className="h-2.5 w-2.5" />
          <BatteryFull className="h-3 w-3" />
        </div>
      </div>

      {step === 0 && (
        <>
          {/* URL bar */}
          <div className="absolute inset-x-2 top-8 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-[9px] text-zinc-500">
            integrated-technics.com
          </div>
          {/* Page content */}
          <div className="absolute inset-x-3 top-[68px] bottom-[60px] flex flex-col items-center pt-4 gap-2">
            <img src="/icons/icon-192.png" alt="" className="h-10 w-10 rounded-lg" />
            <div className="h-2 w-24 rounded bg-zinc-200" />
            <div className="h-2 w-32 rounded bg-zinc-100" />
            <div className="mt-3 h-12 w-full rounded bg-zinc-100" />
            <div className="mt-2 h-2 w-28 rounded bg-zinc-200" />
            <div className="h-2 w-20 rounded bg-zinc-100" />
          </div>
          {/* Safari toolbar */}
          <div className="absolute inset-x-0 bottom-0 h-[52px] bg-zinc-100/90 backdrop-blur border-t border-zinc-200 flex items-center justify-around px-3">
            <ChevronLeft className="h-4 w-4 text-blue-500" />
            <ChevronRight className="h-4 w-4 text-zinc-400" />
            <div className="relative">
              <span className="absolute -inset-1.5 rounded-full bg-blue-500/30 animate-ping" />
              <span className="absolute -inset-1.5 rounded-full ring-2 ring-blue-500" />
              <Share className="h-4 w-4 text-blue-500 relative" />
            </div>
            <div className="h-3.5 w-3.5 border border-zinc-400 rounded-sm" />
            <div className="flex flex-col gap-0.5">
              <span className="h-0.5 w-3 bg-zinc-500 rounded" />
              <span className="h-0.5 w-3 bg-zinc-500 rounded" />
            </div>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          {/* Dimmed page peek */}
          <div className="absolute inset-x-0 top-7 h-12 bg-zinc-200/60" />
          {/* Share sheet */}
          <div className="absolute inset-x-1.5 top-14 bottom-1.5 rounded-2xl bg-white shadow-lg border border-zinc-200 overflow-hidden flex flex-col">
            <div className="px-3 pt-2.5 pb-2 flex items-center gap-2 border-b border-zinc-100">
              <img src="/icons/icon-192.png" alt="" className="h-7 w-7 rounded-md" />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold text-zinc-900 truncate">Integrated Technics</div>
                <div className="text-[8px] text-zinc-500 truncate">integrated-technics.com</div>
              </div>
            </div>
            {/* App row */}
            <div className="px-2 py-2 flex gap-2 overflow-hidden border-b border-zinc-100">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-0.5 shrink-0 w-10">
                  <div className="h-8 w-8 rounded-lg bg-zinc-200" />
                  <div className="h-1 w-6 rounded bg-zinc-200" />
                </div>
              ))}
            </div>
            {/* Action list */}
            <div className="flex-1 px-2 py-1.5 space-y-0.5 text-[9px] text-zinc-900">
              <div className="flex items-center justify-between px-2 py-1.5 rounded">
                <span>Copy</span>
                <div className="h-3 w-3 rounded-sm border border-zinc-400" />
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded">
                <span>Add to Reading List</span>
                <span className="text-zinc-400">⊞</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded">
                <span>Add Bookmark</span>
                <span className="text-zinc-400">★</span>
              </div>
              <div className="relative flex items-center justify-between px-2 py-1.5 rounded bg-blue-50 ring-2 ring-blue-500">
                <span className="absolute -inset-y-0.5 -inset-x-1 rounded bg-blue-500/10 animate-pulse" />
                <span className="font-semibold relative">Add to Home Screen</span>
                <Plus className="h-3 w-3 text-blue-600 relative" />
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded">
                <span>Markup</span>
                <span className="text-zinc-400">✎</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded">
                <span>Print</span>
                <span className="text-zinc-400">⎙</span>
              </div>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {/* Header */}
          <div className="absolute inset-x-0 top-7 h-9 px-3 flex items-center justify-between border-b border-zinc-100 bg-white">
            <span className="text-[10px] text-blue-500">Cancel</span>
            <span className="text-[10px] font-semibold text-zinc-900">Add to Home Screen</span>
            <div className="relative">
              <span className="absolute -inset-1.5 rounded-full bg-blue-500/30 animate-ping" />
              <span className="absolute -inset-1.5 rounded-full ring-2 ring-blue-500" />
              <span className="text-[10px] font-semibold text-blue-500 relative">Add</span>
            </div>
          </div>
          {/* Preview card */}
          <div className="absolute inset-x-2 top-[60px] rounded-xl bg-white border border-zinc-200 p-2.5 flex items-center gap-2.5">
            <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-[10px] font-semibold text-zinc-900 truncate">
                Integrated Technics
              </div>
              <div className="text-[8px] text-zinc-500 truncate">integrated-technics.com</div>
            </div>
          </div>
          {/* Hint */}
          <div className="absolute inset-x-2 top-[120px] text-[8px] text-zinc-400 text-center px-1">
            An icon will be added to your Home Screen so you can quickly access this website.
          </div>
        </>
      )}
    </div>
  );

  if (!cfg.enabled && !showHelp) return null;
  if (!visible && !showHelp) return null;
  const stickySide = settings.sticky.side === "start" ? "start-3 lg:start-6" : "end-3 lg:end-24";
  const pillVisibility = settings.sticky.mobileCollapse ? "hidden lg:flex" : "flex";

  return (
    <>
      {visible && (
        <div
          dir={dir}
          className={`fixed ${stickySide} bottom-20 lg:bottom-6 z-40 ${pillVisibility} items-center gap-1 bg-card border rounded-full shadow-elegant pe-1 ps-2 py-1`}
        >
          <button
            onClick={onClickInstall}
            className="inline-flex items-center gap-2 text-xs lg:text-sm font-medium text-foreground hover:text-accent transition-colors ps-1 pe-1"
          >
            <img src={logo} alt="" className="h-6 w-6 rounded-md bg-white/95 p-0.5 shrink-0" />
            <Download className="h-4 w-4" />
            {t.install}
          </button>
          <button
            onClick={dismiss}
            aria-label={t.close}
            className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent dir={dir} className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <img src="/icons/icon-192.png" alt="" className="h-10 w-10 rounded-lg" />
              <div>
                <DialogTitle>{t.helpTitle}</DialogTitle>
                <DialogDescription>{t.helpDesc}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            {platform === "ios" && (
              <div className="space-y-3">
                <IosScreenshot step={iosStep} />
                <div className="flex items-center justify-center gap-1.5">
                  {iosSteps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === iosStep ? "w-6 bg-accent" : "w-1.5 bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <div className="rounded-lg border bg-card/50 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t.step} {iosStep + 1} {t.of} {iosSteps.length}
                  </div>
                  <div className="font-semibold mt-0.5 flex items-center gap-2">
                    {iosStep === 0 && <Share className="h-4 w-4 text-accent shrink-0" />}
                    {iosStep === 1 && <Plus className="h-4 w-4 text-accent shrink-0" />}
                    {iosStep === 2 && <Download className="h-4 w-4 text-accent shrink-0" />}
                    <span>{iosSteps[iosStep].title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {iosSteps[iosStep].desc}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIosStep((s) => Math.max(0, s - 1))}
                    disabled={iosStep === 0}
                  >
                    {t.back}
                  </Button>
                  {iosStep < iosSteps.length - 1 ? (
                    <Button size="sm" onClick={() => setIosStep((s) => s + 1)}>
                      {t.next}
                      <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        void trackEvent("ios_walkthrough_completed", platform);
                        setShowHelp(false);
                      }}
                    >
                      {isAr ? "تم" : "Done"}
                    </Button>
                  )}
                </div>
              </div>
            )}
            {platform === "desktop-safari" && (
              <ol className="space-y-2 list-decimal ps-5">
                <li>{isAr ? "افتح قائمة «File»" : "Open the File menu"}</li>
                <li>
                  {isAr
                    ? "اختر «Add to Dock» (Safari 17+)"
                    : "Choose “Add to Dock” (Safari 17+)"}
                </li>
              </ol>
            )}
            {platform === "android-firefox" && (
              <ol className="space-y-2 list-decimal ps-5">
                <li className="flex items-center gap-2">
                  {isAr ? "افتح قائمة المتصفح" : "Open the browser menu"}
                  <MoreVertical className="h-4 w-4 text-accent" />
                </li>
                <li>{isAr ? "اختر «Install» أو «تثبيت»" : "Choose “Install” or “Add to Home screen”"}</li>
              </ol>
            )}
            {platform === "other" && (
              <ol className="space-y-2 list-decimal ps-5">
                <li className="flex items-center gap-2">
                  {isAr ? "افتح قائمة المتصفح" : "Open the browser menu"}
                  <MoreVertical className="h-4 w-4 text-accent" />
                </li>
                <li>
                  {isAr
                    ? "اختر «تثبيت التطبيق» أو «Install app»"
                    : "Choose “Install app” or “Add to Home screen”"}
                </li>
                <li>
                  {isAr
                    ? "أو ابحث عن أيقونة التثبيت في شريط العنوان."
                    : "Or look for the install icon in the address bar."}
                </li>
              </ol>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={dismiss}>
              {isAr ? "عدم الإظهار مجددًا" : "Don't show again"}
            </Button>
            <Button size="sm" onClick={() => setShowHelp(false)}>
              {isAr ? "تم" : "Got it"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
