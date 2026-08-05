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
import { ShieldCheck, RotateCcw } from "lucide-react";

const ACTION_LABEL: Record<PermAction, { en: string; ar: string }> = {
  view: { en: "View", ar: "عرض" },
  add: { en: "Add", ar: "إضافة" },
  edit: { en: "Edit", ar: "تعديل" },
  delete: { en: "Delete", ar: "حذف" },
};

export function PermissionsMatrix({ userId, isAdmin }: { userId: string; isAdmin?: boolean }) {
  const { lang } = useAdminT();
  const { getUserPerms, setPagePerms, setAllForUser, setActionForUser, setAllForPage, resetUser } =
    usePermissions();
  const userPerms = getUserPerms(userId);

  const grantedCount = ADMIN_PAGES.reduce(
    (sum, p) => sum + PERM_ACTIONS.filter((a) => userPerms[p.key]?.[a]).length,
    0,
  );
  const total = ADMIN_PAGES.length * PERM_ACTIONS.length;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 flex-wrap">
        <div>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            {lang === "ar" ? "الصلاحيات" : "Permissions"}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "ar"
              ? "تحكم بالصفحات المسموح بها وإجراءات (عرض، إضافة، تعديل، حذف) لكل صفحة."
              : "Control which admin pages this user can access and which actions they may perform."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Badge className="bg-emerald-100 text-emerald-900 border-0">
              {lang === "ar" ? "مدير: كل الصلاحيات" : "Admin: full access"}
            </Badge>
          ) : (
            <Badge variant="secondary">
              {grantedCount}/{total}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isAdmin && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Button size="sm" variant="outline" onClick={() => setAllForUser(userId, true)}>
              {lang === "ar" ? "تحديد الكل" : "Grant all"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAllForUser(userId, false)}>
              {lang === "ar" ? "إزالة الكل" : "Revoke all"}
            </Button>
            {PERM_ACTIONS.map((a) => (
              <Button key={`grant-${a}`} size="sm" variant="ghost" onClick={() => setActionForUser(userId, a, true)}>
                + {lang === "ar" ? ACTION_LABEL[a].ar : ACTION_LABEL[a].en}
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="ms-auto text-muted-foreground" onClick={() => resetUser(userId)}>
              <RotateCcw className="h-3.5 w-3.5 me-1" />
              {lang === "ar" ? "إعادة الضبط" : "Reset"}
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-start">
                <th className="p-2 text-start font-medium">
                  {lang === "ar" ? "الصفحة" : "Page"}
                </th>
                {PERM_ACTIONS.map((a) => (
                  <th key={a} className="p-2 text-center font-medium w-20">
                    {lang === "ar" ? ACTION_LABEL[a].ar : ACTION_LABEL[a].en}
                  </th>
                ))}
                <th className="p-2 text-center w-20 text-muted-foreground font-medium">
                  {lang === "ar" ? "الكل" : "All"}
                </th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_PAGES.map((p) => {
                const row = userPerms[p.key] ?? { view: false, add: false, edit: false, delete: false };
                const allOn = PERM_ACTIONS.every((a) => row[a]);
                return (
                  <tr key={p.key} className="border-t">
                    <td className="p-2 font-medium">
                      <div>{lang === "ar" ? p.ar : p.en}</div>
                      <code className="text-[10px] text-muted-foreground">{p.key}</code>
                    </td>
                    {PERM_ACTIONS.map((a) => (
                      <td key={a} className="p-2 text-center">
                        <Checkbox
                          disabled={isAdmin}
                          checked={isAdmin ? true : !!row[a]}
                          onCheckedChange={(v) => setPagePerms(userId, p.key, { [a]: !!v })}
                          aria-label={`${p.en} ${a}`}
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      <Checkbox
                        disabled={isAdmin}
                        checked={isAdmin ? true : allOn}
                        onCheckedChange={(v) => setAllForPage(userId, p.key, !!v)}
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
            {lang === "ar"
              ? "المستخدمون بدور «مدير» لديهم وصول كامل تلقائيًا ولا يمكن تقييدهم من هنا."
              : "Users with the “admin” role automatically have full access and cannot be restricted here."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}