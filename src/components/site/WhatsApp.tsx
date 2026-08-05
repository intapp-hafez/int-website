import { useSettings } from "@/lib/settings-store";
import { useI18n } from "@/lib/i18n";

export function WhatsAppFloat() {
  const { settings } = useSettings();
  const { lang } = useI18n();
  const cfg = settings.sticky.whatsapp;
  if (!cfg.enabled) return null;
  const num = settings.whatsapp.replace(/[^\d]/g, "");
  const side = settings.sticky.side === "start" ? "start-6" : "end-6";
  const mobileHidden = settings.sticky.mobileCollapse ? "hidden lg:flex" : "flex";
  const label = cfg.text[lang] || cfg.text.en || "WhatsApp";
  return (
    <a
      href={`https://wa.me/${num}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${side} bottom-6 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-elegant items-center justify-center hover:scale-110 transition-transform ${mobileHidden}`}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor"><path d="M17.6 6.32A7.85 7.85 0 0012 4a7.94 7.94 0 00-6.78 12L4 20l4.13-1.08A7.93 7.93 0 0012 19.9a7.94 7.94 0 005.6-13.58zM12 18.5a6.55 6.55 0 01-3.34-.92l-.24-.14-2.45.64.65-2.39-.16-.25A6.57 6.57 0 1118.57 12 6.6 6.6 0 0112 18.5zm3.6-4.92c-.2-.1-1.16-.57-1.34-.64s-.31-.1-.44.1-.5.63-.62.76-.23.15-.43.05a5.36 5.36 0 01-1.58-1 6 6 0 01-1.1-1.36c-.11-.2 0-.3.09-.4s.2-.23.3-.34a1.4 1.4 0 00.2-.34.37.37 0 000-.35c0-.1-.44-1.07-.6-1.46s-.32-.34-.44-.34h-.38a.74.74 0 00-.53.25 2.22 2.22 0 00-.7 1.65 3.85 3.85 0 00.81 2.05 8.85 8.85 0 003.39 3 11.4 11.4 0 001.13.42 2.71 2.71 0 001.25.08 2.05 2.05 0 001.34-.95 1.65 1.65 0 00.12-.95c-.05-.08-.18-.13-.38-.23z"/></svg>
    </a>
  );
}
