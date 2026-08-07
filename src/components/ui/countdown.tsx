import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Countdown({ date, className }: { date: string; className?: string }) {
  const { lang } = useI18n();
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(date).getTime();
    if (isNaN(target)) return;

    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [date]);

  if (!timeLeft) return null;

  return (
    <div className={cn("absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur text-foreground px-4 py-2 rounded-xl shadow-lg border flex gap-3 text-center text-xs font-bold w-max max-w-[90%] z-10", className)}>
      <div className="flex flex-col"><span className="text-lg leading-none">{timeLeft.d}</span><span className="text-[9px] uppercase opacity-70 mt-1">{lang === "ar" ? "يوم" : "Days"}</span></div>
      <div className="w-px bg-border"></div>
      <div className="flex flex-col"><span className="text-lg leading-none">{timeLeft.h.toString().padStart(2, "0")}</span><span className="text-[9px] uppercase opacity-70 mt-1">{lang === "ar" ? "ساعة" : "Hrs"}</span></div>
      <div className="w-px bg-border"></div>
      <div className="flex flex-col"><span className="text-lg leading-none">{timeLeft.m.toString().padStart(2, "0")}</span><span className="text-[9px] uppercase opacity-70 mt-1">{lang === "ar" ? "دقيقة" : "Min"}</span></div>
      <div className="w-px bg-border"></div>
      <div className="flex flex-col"><span className="text-lg leading-none">{timeLeft.s.toString().padStart(2, "0")}</span><span className="text-[9px] uppercase opacity-70 mt-1">{lang === "ar" ? "ثانية" : "Sec"}</span></div>
    </div>
  );
}
