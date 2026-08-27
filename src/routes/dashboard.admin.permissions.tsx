import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { ShieldCheck, Save, ShieldOff, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminT } from "@/lib/admin-i18n";
import { PermissionsMatrix } from "@/components/admin/PermissionsMatrix";
import { PermissionPresets } from "@/components/admin/PermissionPresets";
import { ADMIN_PAGES, PERM_ACTIONS, usePermissions } from "@/lib/permissions-store";
import { AccessRequestQueue } from "@/components/admin/AccessRequestQueue";
import { supabase } from "@/integrations/supabase/client";

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
  moderator: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  helpdesk_manager: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  client_user: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800",
};

const ROLE_DISPLAY: Record<string, { en: string; ar: string }> = {
  admin: { en: "Admin", ar: "مدير" },
  manager: { en: "Manager", ar: "مشرف" },
  agent: { en: "Agent", ar: "موظف" },
  seo: { en: "SEO Specialist", ar: "مسؤول SEO" },
  technician: { en: "Technician", ar: "فني تقني" },
  hr: { en: "HR", ar: "الموارد البشرية" },
  assistant: { en: "Assistant", ar: "مساعد" },
  moderator: { en: "Moderator", ar: "مشرف" },
  helpdesk_manager: { en: "Helpdesk Manager", ar: "مدير الدعم الفني" },
  client_user: { en: "Client User", ar: "مستخدم عميل" },
};

type LiveUser = {
  id: string;        // user_id from user_roles
  rowId: string;     // user_roles.id (row pk)
  name: string;
  role: string;
};

function PermissionsPage() {
  const { lang } = useAdminT();
  const { getUserPerms, setAllForUser, resetUser } = usePermissions();

  const [users, setUsers] = useState<LiveUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  // Load real users from user_roles
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("id, user_id, role, display_name")
          .order("created_at", { ascending: true });
        if (error) throw error;
        // Filter out client roles — clients use the client workspace portal and do not have admin panel permissions
        const staffRoles = (data ?? []).filter((r: any) => r.role !== "client" && r.role !== "client_user");
        const mapped: LiveUser[] = staffRoles.map((r: any, idx: number) => ({
          id: r.user_id,
          rowId: r.id,
          name: r.display_name?.trim() || `Staff Member #${idx + 1}`,
          role: String(r.role || "user"),
        }));
        setUsers(mapped);
        // Auto-select first non-admin, or first overall
        const first = mapped.find((u) => u.role !== "admin") ?? mapped[0];
        if (first) setSelectedId(first.id);
      } catch (e: any) {
        toast.error(e?.message || "Could not load users");
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const user = users.find((u) => u.id === selectedId);
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

            {loadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {lang === "ar" ? "جاري التحميل..." : "Loading..."}
              </div>
            ) : (
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder={lang === "ar" ? "اختر مستخدمًا" : "Select a user"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="font-medium">{u.name}</span>
                      <span className="text-muted-foreground ms-1">
                        · {ROLE_DISPLAY[u.role]?.[lang as "en" | "ar"] ?? u.role}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {user && (
              <Badge variant="outline" className={ROLE_BADGE_STYLE[user.role] ?? ""}>
                {ROLE_DISPLAY[user.role]?.[lang as "en" | "ar"] ?? user.role}
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
      ) : !loadingUsers ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {lang === "ar" ? "اختر مستخدمًا للبدء." : "Select a user to begin."}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}