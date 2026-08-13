import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ShieldCheck, Save, ShieldOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { demoUsers } from "@/data/demo";
import { useAdminT } from "@/lib/admin-i18n";
import { PermissionsMatrix } from "@/components/admin/PermissionsMatrix";
import { PermissionPresets } from "@/components/admin/PermissionPresets";
import { ADMIN_PAGES, PERM_ACTIONS, usePermissions } from "@/lib/permissions-store";
import { AccessRequestQueue } from "@/components/admin/AccessRequestQueue";

export const Route = createFileRoute("/dashboard/admin/permissions")({
  head: () => ({ meta: [{ title: "Permissions — Admin" }] }),
  component: PermissionsPage,
});

const ROLE_BADGE_STYLE: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  agent: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  seo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  technician: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
};

const ROLE_DISPLAY: Record<string, { en: string; ar: string }> = {
  admin: { en: "Admin", ar: "مدير" },
  manager: { en: "Manager", ar: "مشرف" },
  agent: { en: "Agent", ar: "موظف" },
  seo: { en: "SEO Specialist", ar: "مسؤول SEO" },
  technician: { en: "Technician", ar: "فني تقني" },
};

function PermissionsPage() {
  const { lang } = useAdminT();
  const { getUserPerms, setAllForUser, resetUser } = usePermissions();
  const nonAdminUsers = demoUsers.filter((u) => u.role !== "admin");
  const [selectedId, setSelectedId] = useState<string>(nonAdminUsers[0]?.id ?? demoUsers[0]?.id ?? "");
  const user = demoUsers.find((u) => u.id === selectedId);
  const isAdmin = user?.role === "admin";

  const grantedCount = user
    ? ADMIN_PAGES.reduce(
        (sum, p) => sum + PERM_ACTIONS.filter((a) => getUserPerms(user.id)[p.key]?.[a]).length,
        0,
      )
    : 0;
  const total = ADMIN_PAGES.length * PERM_ACTIONS.length;

  const onSave = () => {
    toast.success(lang === "ar" ? "تم حفظ الصلاحيات" : "Permissions saved", {
      description:
        lang === "ar"
          ? "تُطبَّق التغييرات فورًا على جلسات المستخدم."
          : "Changes apply to the user's sessions immediately.",
    });
  };

  const onRevoke = () => {
    if (!user) return;
    setAllForUser(user.id, false);
    toast.success(lang === "ar" ? "تم سحب جميع الصلاحيات" : "All permissions revoked");
  };

  const onReset = () => {
    if (!user) return;
    resetUser(user.id);
    toast.success(lang === "ar" ? "تمت إعادة الضبط" : "Permissions reset to defaults");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-accent" />
            {lang === "ar" ? "إدارة الصلاحيات" : "Permissions Management"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {lang === "ar"
              ? "اختر مستخدمًا لتحديد الصفحات المسموح له بزيارتها وما يمكنه فعله (عرض، إضافة، تعديل، حذف)."
              : "Pick a user to control which admin pages they can access and which actions (view, add, edit, delete) they can perform."}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="font-display text-base">
              {lang === "ar" ? "المستخدم" : "User"}
            </CardTitle>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder={lang === "ar" ? "اختر مستخدمًا" : "Select a user"} />
              </SelectTrigger>
              <SelectContent>
                {demoUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <span className="font-medium">{u.name}</span>
                    <span className="text-muted-foreground"> · {u.email}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user && (
              <Badge variant="outline" className={ROLE_BADGE_STYLE[user.role] ?? ""}>
                {lang === "ar" ? ROLE_DISPLAY[user.role]?.ar ?? user.role : ROLE_DISPLAY[user.role]?.en ?? user.role}
              </Badge>
            )}
            {!isAdmin && user && (
              <Badge variant="outline">
                {grantedCount}/{total} {lang === "ar" ? "ممنوحة" : "granted"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onReset} disabled={!user || isAdmin}>
              <RotateCcw className="h-4 w-4 me-1" />
              {lang === "ar" ? "إعادة الضبط" : "Reset"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={!user || isAdmin}>
                  <ShieldOff className="h-4 w-4 me-1" />
                  {lang === "ar" ? "سحب الكل" : "Revoke all"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {lang === "ar" ? "سحب جميع الصلاحيات؟" : "Revoke all permissions?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {lang === "ar"
                      ? `سيتم منع ${user?.name ?? "هذا المستخدم"} من الوصول إلى جميع صفحات الإدارة حتى يتم منحه صلاحيات جديدة.`
                      : `${user?.name ?? "This user"} will lose access to every admin page until new permissions are granted.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{lang === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                  <AlertDialogAction onClick={onRevoke}>
                    {lang === "ar" ? "سحب الكل" : "Revoke all"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" onClick={onSave} disabled={!user}>
              <Save className="h-4 w-4 me-1" />
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </CardHeader>
        {user && (
          <CardContent className="text-xs text-muted-foreground">
            {lang === "ar"
              ? "ملاحظة: تُحفظ التغييرات تلقائيًا لحظة تعديلها. زر «حفظ» للتأكيد فقط."
              : "Note: changes save automatically as you edit. The Save button is just a confirmation."}
          </CardContent>
        )}
      </Card>

      <PermissionPresets activeUserId={user && !isAdmin ? user.id : undefined} />

      <AccessRequestQueue />

      {user ? (
        <PermissionsMatrix userId={user.id} isAdmin={isAdmin} />
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {lang === "ar" ? "اختر مستخدمًا للبدء." : "Select a user to begin."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}