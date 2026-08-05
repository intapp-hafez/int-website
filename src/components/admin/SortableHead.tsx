import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortDir } from "./useListSearch";

export function SortableHead({
  field,
  sort,
  dir,
  onSort,
  children,
  className,
  align = "start",
}: {
  field: string;
  sort: string | undefined;
  dir: SortDir;
  onSort: (f: string) => void;
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
}) {
  const active = sort === field;
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={cn(align === "end" && "text-end", className)}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors",
          active ? "text-foreground" : "text-muted-foreground",
          align === "end" && "ms-auto",
        )}
      >
        {children}
        <Icon className={cn("h-3 w-3", !active && "opacity-50")} />
      </button>
    </TableHead>
  );
}