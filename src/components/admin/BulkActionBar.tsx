import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, X } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";

export function BulkActionBar({
  count,
  onClear,
  onDelete,
  statusOptions,
  onStatusChange,
}: {
  count: number;
  onClear: () => void;
  onDelete?: () => void;
  statusOptions?: { value: string; label: string }[];
  onStatusChange?: (value: string) => void;
}) {
  const { t, lang } = useAdminT();
  const [statusVal, setStatusVal] = useState<string>("");
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap rounded-md border bg-muted/40 px-3 py-2 mb-3">
      <div className="flex items-center gap-2 text-sm">
        <Checkbox checked aria-label="Selected" onCheckedChange={() => onClear()} />
        <span className="font-medium">
          {count} {lang === "ar" ? "عنصر مُحدد" : count === 1 ? "selected" : "selected"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {statusOptions && onStatusChange && (
          <Select
            value={statusVal}
            onValueChange={(v) => {
              setStatusVal("");
              onStatusChange(v);
            }}
          >
            <SelectTrigger className="h-8 w-44">
              <SelectValue placeholder={lang === "ar" ? "تغيير الحالة" : "Change status"} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} className="capitalize">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4 me-1" /> {t("delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("confirm")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {lang === "ar"
                    ? `سيتم حذف ${count} عنصر. لا يمكن التراجع عن هذا الإجراء.`
                    : `${count} item${count === 1 ? "" : "s"} will be deleted. This cannot be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>{t("delete")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}