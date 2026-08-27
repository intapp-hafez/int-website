import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";
import type { VendorItem } from "@/lib/products";
import { useI18n } from "@/lib/i18n";

interface VendorBadgesOverlayProps {
  vendors?: VendorItem[];
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function VendorBadgesOverlay({ vendors, max = 8, size = "md" }: VendorBadgesOverlayProps) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const valid = (vendors || []).filter((v) => v && (v.logo || v.name));

  if (valid.length === 0) return null;

  const displayed = valid.slice(0, max);
  const remaining = valid.length - max;

  const sizeClasses = {
    sm: "h-7 w-7 sm:h-8 sm:w-8",
    md: "h-8 w-8 sm:h-9 sm:w-9",
    lg: "h-9 w-9 sm:h-10 sm:w-10",
  }[size];

  return (
    <TooltipProvider delayDuration={100}>
      <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center px-2 z-20">
        <div className="flex items-center justify-center flex-wrap gap-1.5 max-w-[95%]">
          {displayed.map((v) => (
            <Tooltip key={v.id || v.name}>
              <TooltipTrigger asChild>
                <div
                  role="button"
                  tabIndex={0}
                  className={`relative group/vendor ${sizeClasses} rounded-full bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800 p-1 flex items-center justify-center shadow-md overflow-hidden shrink-0 transition-all duration-300 hover:scale-125 hover:z-30 hover:shadow-xl hover:border-accent cursor-pointer`}
                  onClick={(e) => {
                    if (v.website_url) {
                      e.stopPropagation();
                      e.preventDefault();
                      window.open(v.website_url, "_blank", "noopener,noreferrer");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && v.website_url) {
                      e.stopPropagation();
                      e.preventDefault();
                      window.open(v.website_url, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  {v.logo ? (
                    <img
                      src={v.logo}
                      alt={v.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-2xs transition-transform duration-300 group-hover/vendor:scale-110"
                    />
                  ) : (
                    <span className="text-[9px] font-bold uppercase text-foreground">{v.name.slice(0, 2)}</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
                className="z-50 p-2.5 px-3 rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-2xl text-card-foreground text-center space-y-0.5 animate-in zoom-in-90 fade-in duration-150"
              >
                <div className="font-bold text-xs text-foreground flex items-center justify-center gap-1.5">
                  <span>{v.name}</span>
                  {v.website_url && <ExternalLink className="h-3 w-3 text-accent" />}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {isAr ? "شريك ومصنّع معتمد" : "Authorized OEM Partner"}
                </div>
                {v.website_url && (
                  <div className="text-[9px] text-accent pt-0.5 font-medium">
                    {isAr ? "انقر لزيارة الموقع الرسمي ↗" : "Click to visit site ↗"}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          ))}

          {remaining > 0 && (
            <div className={`h-8 sm:h-9 px-2 rounded-full bg-white/95 dark:bg-slate-900/95 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-foreground shadow-md shrink-0`}>
              +{remaining} {isAr ? "المزيد" : "more"}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
