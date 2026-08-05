import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminT } from "@/lib/admin-i18n";
import { cn } from "@/lib/utils";

export function Paginator({
  page,
  pageCount,
  total,
  start,
  end,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
  onPageChange: (p: number) => void;
  className?: string;
}) {
  const { t, lang, isRtl } = useAdminT();
  if (pageCount <= 1 && total <= end) return null;

  const Prev = isRtl ? ChevronRight : ChevronLeft;
  const Next = isRtl ? ChevronLeft : ChevronRight;

  // Compute window of page numbers (max 5)
  const pages: (number | "…")[] = [];
  const max = 5;
  if (pageCount <= max + 2) {
    for (let i = 1; i <= pageCount; i++) pages.push(i);
  } else {
    const left = Math.max(2, page - 1);
    const right = Math.min(pageCount - 1, page + 1);
    pages.push(1);
    if (left > 2) pages.push("…");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < pageCount - 1) pages.push("…");
    pages.push(pageCount);
  }

  return (
    <div className={cn("flex items-center justify-between gap-3 flex-wrap pt-4", className)}>
      <p className="text-xs text-muted-foreground">
        {lang === "ar"
          ? `${start + 1}–${end} ${t("of")} ${total}`
          : `${t("showing")} ${start + 1}–${end} ${t("of")} ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <Prev className="h-4 w-4" />
          <span className="hidden sm:inline ms-1">{t("previous")}</span>
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-2 text-xs text-muted-foreground">…</span>
          ) : (
            <Button
              key={p}
              size="sm"
              variant={p === page ? "default" : "ghost"}
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          <span className="hidden sm:inline me-1">{t("next")}</span>
          <Next className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}