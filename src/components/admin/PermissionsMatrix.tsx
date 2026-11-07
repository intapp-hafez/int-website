import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ADMIN_PAGES,
  PERM_ACTIONS,
  usePermissions,
  type PermAction,
} from "@/lib/permissions-store";
import { useAdminT } from "@/lib/admin-i18n";
import { ShieldCheck, RotateCcw, Clock, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ACTION_LABEL: Record<PermAction, { en: string; ar: string }> = {
  view: { en: "View", ar: "عرض" },
  add: { en: "Add", ar: "إضافة" },
  edit: { en: "Edit", ar: "تعديل" },
  delete: { en: "Delete", ar: "حذف" },
};

export function PermissionsMatrix({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin?: boolean;
}) {
  const { lang } = useAdminT();
  const ar = lang === "ar";
  const {
    getBaseUserPerms,
    getUserPerms,
    setPagePerms,
    setAllForUser,
    setActionForUser,
    setAllForPage,
    resetUser,
    grantsForUser,
  } = usePermissions();

  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const basePerms = getBaseUserPerms(userId);
  const effectivePerms = getUserPerms(userId);
  const userGrants = grantsForUser(userId);

  const grantedCount = ADMIN_PAGES.reduce(
    (sum, p) => sum + PERM_ACTIONS.filter((a) => basePerms[p.key]?.[a]).length,
    0,
  );
  const total = ADMIN_PAGES.length * PERM_ACTIONS.length;

  const handleActionToggle = async (key: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setSavingAction(key);
    setErrorMsg(null);
    try {
      const res = await fn();
      if (!res.success) {
        const msg = res.error || (ar ? "فشل حفظ التعديل" : "Failed to save change");
        setErrorMsg(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || (ar ? "خطأ غير متوقع" : "Unexpected error");
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSavingAction(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 flex-wrap">
        <div>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            {ar ? "الصلاحيات الدائمة للمستخدم" : "Permanent User Permissions"}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {ar
              ? "تحكم بالصلاحيات الدائمة. الصلاحيات المؤقتة مُشار إليها بأيقونة ساعة ولا يتم دمجها كصلاحيات دائمة."
              : "Manage permanent permissions. Temporary grants are flagged with a clock icon and will not be baked into permanent storage."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savingAction && (
            <Badge variant="outline" className="flex items-center gap-1.5 text-xs text-accent animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              {ar ? "جاري الحفظ..." : "Saving..."}
            </Badge>
          )}
          {isAdmin ? (
            <Badge className="bg-emerald-100 text-emerald-900 border-0">
              {ar ? "مدير: كل الصلاحيات" : "Admin: full access"}
            </Badge>
          ) : (
            <Badge variant="secondary">
              {grantedCount}/{total} {ar ? "دائمة" : "permanent"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {errorMsg && (
          <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => setErrorMsg(null)}>
              ✕
            </Button>
          </div>
        )}

        {!isAdmin && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Button
              size="sm"
              variant="outline"
              disabled={!!savingAction}
              onClick={() => handleActionToggle("all-true", () => setAllForUser(userId, true))}
            >
              {ar ? "تحديد الكل" : "Grant all"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!!savingAction}
              onClick={() => handleActionToggle("all-false", () => setAllForUser(userId, false))}
            >
              {ar ? "إزالة الكل" : "Revoke all"}
            </Button>
            {PERM_ACTIONS.map((a) => (
              <Button
                key={`grant-${a}`}
                size="sm"
                variant="ghost"
                disabled={!!savingAction}
                onClick={() => handleActionToggle(`action-${a}`, () => setActionForUser(userId, a, true))}
              >
                + {ar ? ACTION_LABEL[a].ar : ACTION_LABEL[a].en}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              disabled={!!savingAction}
              className="ms-auto text-muted-foreground"
              onClick={() => handleActionToggle("reset", () => resetUser(userId))}
            >
              <RotateCcw className="h-3.5 w-3.5 me-1" />
              {ar ? "إعادة الضبط" : "Reset"}
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-start">
                <th className="p-2 text-start font-medium">
                  {ar ? "الصفحة" : "Page"}
                </th>
                {PERM_ACTIONS.map((a) => (
                  <th key={a} className="p-2 text-center font-medium w-24">
                    {ar ? ACTION_LABEL[a].ar : ACTION_LABEL[a].en}
                  </th>
                ))}
                <th className="p-2 text-center w-20 text-muted-foreground font-medium">
                  {ar ? "الكل" : "All"}
                </th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_PAGES.map((p) => {
                const baseRow = basePerms[p.key] ?? { view: false, add: false, edit: false, delete: false };
                const effectiveRow = effectivePerms[p.key] ?? { view: false, add: false, edit: false, delete: false };
                const allOn = PERM_ACTIONS.every((a) => baseRow[a]);

                return (
                  <tr key={p.key} className="border-t">
                    <td className="p-2 font-medium">
                      <div>{ar ? p.ar : p.en}</div>
                      <code className="text-[10px] text-muted-foreground">{p.key}</code>
                    </td>
                    {PERM_ACTIONS.map((a) => {
                      const isPermanent = !!baseRow[a];
                      const isTemporary = !isPermanent && !!effectiveRow[a];
                      const grant = isTemporary
                        ? userGrants.find((g) => g.pageKey === p.key && g.actions.includes(a))
                        : null;

                      return (
                        <td key={a} className="p-2 text-center">
                          <div className="inline-flex flex-col items-center justify-center gap-1">
                            <Checkbox
                              disabled={isAdmin || !!savingAction}
                              checked={isAdmin ? true : isPermanent}
                              onCheckedChange={(v) =>
                                handleActionToggle(`${p.key}-${a}`, () =>
                                  setPagePerms(userId, p.key, { [a]: !!v }),
                                )
                              }
                              aria-label={`${p.en} ${a}`}
                            />
                            {isTemporary && (
                              <span
                                className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium cursor-help"
                                title={
                                  grant?.expiresAt
                                    ? ar
                                      ? `صلاحية مؤقتة تنتهي في ${new Date(grant.expiresAt).toLocaleDateString("ar-EG")}`
                                      : `Temporary grant expires on ${new Date(grant.expiresAt).toLocaleDateString("en-GB")}`
                                    : ar
                                      ? "صلاحية مؤقتة نشطة"
                                      : "Active temporary grant"
                                }
                              >
                                <Clock className="h-2.5 w-2.5" />
                                {ar ? "مؤقت" : "Temp"}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center">
                      <Checkbox
                        disabled={isAdmin || !!savingAction}
                        checked={isAdmin ? true : allOn}
                        onCheckedChange={(v) =>
                          handleActionToggle(`${p.key}-all`, () =>
                            setAllForPage(userId, p.key, !!v),
                          )
                        }
                        aria-label={`${p.en} all`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isAdmin && (
          <p className="text-xs text-muted-foreground">
            {ar
              ? "المستخدمون بدور «مدير» لديهم وصول كامل تلقائيًا ولا يمكن تقييدهم من هنا."
              : "Users with the “admin” role automatically have full access and cannot be restricted here."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
