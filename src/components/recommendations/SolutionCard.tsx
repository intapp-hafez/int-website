import type { RecommendedSolution, Solution } from "@/lib/recommendation-types";
import { PriorityBadge } from "./PriorityBadge";
import { Sparkles, ArrowRight } from "lucide-react";

type Props = { rec: RecommendedSolution; solution?: Solution; lang: "en" | "ar" };

export function SolutionCard({ rec, solution, lang }: Props) {
  const isAr = lang === "ar";
  const name = solution ? (isAr ? solution.name_ar : solution.name_en) : rec.solutionKey;
  const desc = solution ? (isAr ? solution.description_ar : solution.description_en) : "";
  const benefits = solution ? (isAr ? solution.benefits_ar : solution.benefits_en) : [];
  const nextStep = solution ? (isAr ? solution.nextStep_ar : solution.nextStep_en) : "";
  const reasons = isAr ? rec.reasons_ar : rec.reasons_en;
  return (
    <div className={`bg-card border rounded-2xl p-5 flex flex-col gap-3 h-full ${isAr ? "font-arabic text-right" : ""}`} dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{solution?.categoryKey.replace(/_/g, " ")}</div>
          <h3 className="font-display font-bold text-lg mt-0.5">{name}</h3>
        </div>
        <PriorityBadge priority={rec.priority} lang={lang} />
      </div>
      {desc && <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>}
      {reasons.length > 0 && (
        <div className="rounded-lg bg-muted/50 border border-border/60 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {isAr ? "لماذا نوصي بذلك" : "Why we recommend this"}
          </div>
          <ul className="text-sm space-y-1">
            {reasons.map((r, i) => <li key={i} className="flex gap-2"><Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" /> <span>{r}</span></li>)}
          </ul>
        </div>
      )}
      {benefits.length > 0 && (
        <div className="text-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {isAr ? "الفوائد" : "Benefits"}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {benefits.map((b) => (
              <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{b}</span>
            ))}
          </div>
        </div>
      )}
      {nextStep && (
        <div className="mt-auto pt-3 border-t flex items-center gap-2 text-sm text-accent font-medium">
          <ArrowRight className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} /> {nextStep}
        </div>
      )}
    </div>
  );
}