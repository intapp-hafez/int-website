import { LayoutGrid, List, Table as TableIcon } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "grid" | "list";

const ICONS = {
  table: TableIcon,
  grid: LayoutGrid,
  list: List,
} as const;

const LABELS_EN: Record<ViewMode, string> = { table: "Table", grid: "Grid", list: "List" };
const LABELS_AR: Record<ViewMode, string> = { table: "جدول", grid: "شبكة", list: "قائمة" };

/** Read the current `view` URL search param (loose, untyped). */
export function useViewMode(defaultMode: ViewMode = "table"): ViewMode {
  const search = useSearch({ strict: false }) as { view?: string };
  const v = search?.view;
  return v === "grid" || v === "list" || v === "table" ? v : defaultMode;
}

export function ViewToggle({
  value,
  className,
  lang = "en",
  options = ["table", "grid", "list"],
}: {
  value: ViewMode;
  className?: string;
  lang?: "en" | "ar";
  options?: ViewMode[];
}) {
  const navigate = useNavigate();
  const labels = lang === "ar" ? LABELS_AR : LABELS_EN;

  return (
    <div
      role="tablist"
      aria-label={lang === "ar" ? "طريقة العرض" : "View mode"}
      className={cn("inline-flex items-center rounded-md border bg-card p-0.5 shrink-0", className)}
    >
      {options.map((m) => {
        const Icon = ICONS[m];
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            title={labels[m]}
            onClick={() =>
              navigate({
                to: ".",
                search: (prev: Record<string, unknown>) => ({ ...prev, view: m }),
                replace: true,
              } as any)
            }
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 h-8 rounded text-xs font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{labels[m]}</span>
          </button>
        );
      })}
    </div>
  );
}