import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
  ShieldCheck,
  Save,
  ShieldOff,
  RotateCcw,
  Loader2,
  Search,
  Check,
  ChevronsUpDown,
  AlertCircle,
  User as UserIcon,
  X,
} from "lucide-react";
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
  const ar = lang === "ar";
  const { getBaseUserPerms, saveUserPerms, setAllForUser, resetUser } = usePermissions();

  const [users, setUsers] = useState<LiveUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [staffSearchOpen, setStaffSearchOpen] = useState(false);
  const [staffQuery, setStaffQuery] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [savingAction, setSavingAction] = useState<"save" | "reset" | "revoke" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load real users from user_roles
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("id, user_id, role, display_name")
          .order("created_at", { ascending: true });
        if (error) throw error;
        // Filter out client roles — clients use client workspace and have separate auth
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

  const filteredUsers = useMemo(() => {
    const q = staffQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const roleText = ROLE_DISPLAY[u.role]?.[ar ? "ar" : "en"] || u.role;
      return u.name.toLowerCase().includes(q) || roleText.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    });
  }, [users, staffQuery, ar]);

  const user = users.find((u) => u.id === selectedId);
  const isAdmin = user?.role === "admin";

  const grantedCount = user
    ? ADMIN_PAGES.reduce(
        (sum, p) => sum + PERM_ACTIONS.filter((a) => getBaseUserPerms(user.id)[p.key]?.[a]).length,
        0,
      )
    : 0;
  const total = ADMIN_PAGES.length * PERM_ACTIONS.length;

  const onSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSavingAction("save");
    setActionError(null);
    try {
      const res = await saveUserPerms(user.id);
      if (res.success) {
        toast.success(ar ? "تم حفظ الصلاحيات بنجاح" : "Permissions saved successfully", {
          description: ar
            ? "تم التأكيد وحفظ الصلاحيات في قاعدة البيانات وتطبيقها فورًا."
            : "Permissions confirmed and persisted to the database.",
        });
      } else {
        const msg = res.error || (ar ? "فشل حفظ الصلاحيات" : "Failed to save permissions");
        setActionError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || (ar ? "خطأ غير متوقع أثناء الحفظ" : "Unexpected error saving permissions");
      setActionError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
      setSavingAction(null);
    }
  };

  const onRevoke = async () => {
    if (!user) return;
    setIsSaving(true);
    setSavingAction("revoke");
    setActionError(null);
    try {
      const res = await setAllForUser(user.id, false);
      if (res.success) {
        toast.success(ar ? "تم سحب جميع الصلاحيات" : "All permissions revoked");
      } else {
        const msg = res.error || (ar ? "فشل سحب الصلاحيات" : "Failed to revoke permissions");
        setActionError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || (ar ? "خطأ غير متوقع أثناء سحب الصلاحيات" : "Unexpected error revoking permissions");
      setActionError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
      setSavingAction(null);
    }
  };

  const onReset = async () => {
    if (!user) return;
    setIsSaving(true);
    setSavingAction("reset");
    setActionError(null);
    try {
      const res = await resetUser(user.id);
      if (res.success) {
        toast.success(ar ? "تمت إعادة الضبط للوضع الافتراضي" : "Permissions reset to defaults");
      } else {
        const msg = res.error || (ar ? "فشل إعادة الضبط" : "Failed to reset permissions");
        setActionError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || (ar ? "خطأ غير متوقع أثناء إعادة الضبط" : "Unexpected error resetting permissions");
      setActionError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
      setSavingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-accent" />
            {ar ? "إدارة الصلاحيات" : "Permissions Management"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {ar
              ? "اختر موظفًا لتحديد صفحات الإدارة المسموح له بزيارتها والإجراءات (عرض، إضافة، تعديل، حذف) مع حفظ دقيق وموثوق."
              : "Select a staff member to control admin section access and actions (view, add, edit, delete) with verified database persistence."}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="font-display text-base">
              {ar ? "الموظف" : "Staff Member"}
            </CardTitle>

            {loadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {ar ? "جاري التحميل..." : "Loading..."}
              </div>
            ) : (
              /* Searchable Staff Selector Popover */
              <Popover open={staffSearchOpen} onOpenChange={setStaffSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={staffSearchOpen}
                    className="w-[280px] sm:w-[320px] justify-between text-start font-normal h-9"
                  >
                    <span className="truncate flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      {user ? (
                        <>
                          <span className="font-medium text-foreground">{user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            · {ROLE_DISPLAY[user.role]?.[ar ? "ar" : "en"] ?? user.role}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          {ar ? "ابحث أو اختر موظفًا..." : "Search or pick staff..."}
                        </span>
                      )}
                    </span>
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-2" align="start">
                  <div className="relative mb-2">
                    <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={ar ? "ابحث بالاسم أو الدور..." : "Search staff name or role..."}
                      value={staffQuery}
                      onChange={(e) => setStaffQuery(e.target.value)}
                      className="ps-8 pe-8 h-9 text-sm"
                      autoFocus
                    />
                    {staffQuery && (
                      <button
                        type="button"
                        onClick={() => setStaffQuery("")}
                        className="absolute end-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-[240px] overflow-y-auto space-y-1">
                    {filteredUsers.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        {ar ? "لا يوجد موظف مطابق للبحث." : "No matching staff found."}
                      </div>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelected = u.id === selectedId;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(u.id);
                              setStaffSearchOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-md text-sm text-start transition-colors hover:bg-muted ${
                              isSelected ? "bg-muted/80 font-medium" : ""
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{u.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 ${ROLE_BADGE_STYLE[u.role] ?? ""}`}>
                                  {ROLE_DISPLAY[u.role]?.[ar ? "ar" : "en"] ?? u.role}
                                </Badge>
                              </div>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-accent shrink-0 ms-2" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {user && (
              <Badge variant="outline" className={ROLE_BADGE_STYLE[user.role] ?? ""}>
                {ROLE_DISPLAY[user.role]?.[ar ? "ar" : "en"] ?? user.role}
              </Badge>
            )}
            {!isAdmin && user && (
              <Badge variant="outline">
                {grantedCount}/{total} {ar ? "دائمة" : "granted"}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onReset}
              disabled={!user || isAdmin || isSaving}
            >
              {savingAction === "reset" ? (
                <Loader2 className="h-4 w-4 animate-spin me-1" />
              ) : (
                <RotateCcw className="h-4 w-4 me-1" />
              )}
              {ar ? "إعادة الضبط" : "Reset"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!user || isAdmin || isSaving}
                >
                  {savingAction === "revoke" ? (
                    <Loader2 className="h-4 w-4 animate-spin me-1" />
                  ) : (
                    <ShieldOff className="h-4 w-4 me-1" />
                  )}
                  {ar ? "سحب الكل" : "Revoke all"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {ar ? "سحب جميع الصلاحيات؟" : "Revoke all permissions?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {ar
                      ? `سيتم منع ${user?.name ?? "هذا المستخدم"} من الوصول إلى جميع صفحات الإدارة حتى يتم منحه صلاحيات جديدة.`
                      : `${user?.name ?? "This user"} will lose access to every admin page until new permissions are granted.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                  <AlertDialogAction onClick={onRevoke}>
                    {ar ? "سحب الكل" : "Revoke all"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="sm"
              onClick={onSave}
              disabled={!user || isSaving}
              className="min-w-[80px]"
            >
              {savingAction === "save" ? (
                <Loader2 className="h-4 w-4 animate-spin me-1" />
              ) : (
                <Save className="h-4 w-4 me-1" />
              )}
              {ar ? "حفظ" : "Save"}
            </Button>
          </div>
        </CardHeader>

        {actionError && (
          <CardContent className="pt-0">
            <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setActionError(null)}
              >
                {ar ? "إغلاق" : "Dismiss"}
              </Button>
            </div>
          </CardContent>
        )}

        {user && !actionError && (
          <CardContent className="text-xs text-muted-foreground pt-0">
            {ar
              ? "ملاحظة: يتم حفظ وتطبيق الصلاحيات بدقة فورية في قاعدة البيانات. انقر فوق «حفظ» لتأكيد المزامنة."
              : "Note: Permissions are stored and verified directly against the database repository."}
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
            {ar ? "اختر موظفًا للبدء." : "Select a staff member to begin."}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
