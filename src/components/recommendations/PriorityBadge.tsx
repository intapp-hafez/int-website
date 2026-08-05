import type { Priority } from "@/lib/recommendation-types";
import { AlertTriangle, ArrowUp, Minus, Circle } from "lucide-react";

const CFG: Record<Priority, { cls: string; icon: any; en: string; ar: string }> = {
  critical: { cls: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle, en: "Critical", ar: "حرج" },
  high: { cls: "bg-accent/15 text-accent border-accent/30", icon: ArrowUp, en: "High", ar: "مرتفع" },
  medium: { cls: "bg-primary/10 text-primary border-primary/30", icon: Minus, en: "Medium", ar: "متوسط" },
  optional: { cls: "bg-muted text-muted-foreground border-border", icon: Circle, en: "Optional", ar: "اختياري" },
};

export function PriorityBadge({ priority, lang }: { priority: Priority; lang: "en" | "ar" }) {
  const c = CFG[priority];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${c.cls}`}>
      <Icon className="h-3 w-3" /> {lang === "ar" ? c.ar : c.en}
    </span>
  );
}