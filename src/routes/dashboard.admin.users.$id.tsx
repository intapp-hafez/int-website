import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Loader2, User, Shield, Clock } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { PermissionsMatrix } from "@/components/admin/PermissionsMatrix";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/users/$id")({
  head: () => ({ meta: [{ title: "User - Admin" }] }),
  component: UserDetail,
});

const ROLE_BADGE_STYLE: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  agent: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  seo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  technician: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  hr: "bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  assistant: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  moderator: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  helpdesk_manager: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800",
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
};

const ALL_ROLES = ["admin", "manager", "agent", "seo", "technician", "hr", "assistant"];

type UserRow = {
  id: string;         // user_id (UUID)
  rowId: string;      // user_roles.id
  role: string;
  created_at: string;
  display_name: string;
  active: boolean;
};

function UserDetail() {
  const { id } = Route.useParams();
  const { t, lang } = useAdminT();
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Standalone name field — not tied to editingName
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let { data, error } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: true });
        if ((!data || data.length === 0) && !error) {
          ({ data, error } = await supabase
            .from("user_roles")
            .select("*")
            .eq("id", id)
            .order("created_at", { ascending: true }));
        }
        if (error) throw error;
        if (data && data.length > 0) {
          const row = data[0] as any;
          const displayName = row.display_name || "";
          setUser({
            id: row.user_id || row.id,
            rowId: row.id,
            role: String(row.role || "user"),
            created_at: row.created_at || "",
            display_name: displayName,
            active: true,
          });
          setNameValue(displayName);
        }
      } catch (e: any) {
        toast.error(e?.message || (lang === "ar" ? "تعذر تحميل المستخدم" : "Could not load user"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const saveName = async () => {
    if (!user) return;
    const trimmed = nameValue.trim();
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ display_name: trimmed } as any)
        .eq("id", user.rowId);
      if (error) throw error;
      setUser({ ...user, display_name: trimmed });
      toast.success(lang === "ar" ? "تم تحديث الاسم" : "Name updated");
    } catch (e: any) {
      toast.error(e?.message || (lang === "ar" ? "تعذر تحديث الاسم" : "Could not update name"));
    } finally {
      setSavingName(false);
    }
  };

  const updateRole = async (newRole: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as any })
        .eq("id", user.rowId);
      if (error) throw error;
      setUser({ ...user, role: newRole });
      toast.success(lang === "ar" ? "تم تحديث الدور" : "Role updated");
    } catch (e: any) {
      toast.error(e?.message || (lang === "ar" ? "تعذر تحديث الدور" : "Could not update role"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/admin/users">
            <ArrowLeft className="h-4 w-4 me-2" />
            {t("back", "رجوع")}
          </Link>
        </Button>
        <Card>
          <CardContent className="p-6 text-muted-foreground text-sm">
            {lang === "ar" ? "المستخدم غير موجود." : "User not found."}
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard/admin/users">
          <ArrowLeft className="h-4 w-4 me-2" />
          {t("back", "رجوع")}
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-xl truncate">
                {nameValue || (lang === "ar" ? "عضو الفريق" : "Staff Member")}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  {ROLE_DISPLAY[user.role]?.[lang as "en" | "ar"] ?? user.role} · {lang === "ar" ? "عضو فريق" : "staff"}
                </span>
              </div>
            </div>
          </div>
          <Badge variant={user.active ? "default" : "secondary"}>
            {user.active ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "معطل" : "Disabled")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Display Name field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {lang === "ar" ? "الاسم المعروض" : "Display Name"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
                  placeholder={lang === "ar" ? "أدخل الاسم..." : "Enter name..."}
                  className="h-9"
                  disabled={savingName}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveName}
                  disabled={savingName || nameValue.trim() === (user.display_name || "")}
                  className="shrink-0"
                >
                  {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (lang === "ar" ? "حفظ" : "Save")}
                </Button>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <Shield className="h-3.5 w-3.5" />
                {lang === "ar" ? "الدور الوظيفي" : "Role"}
              </Label>
              <div className="flex items-center gap-2">
                <Select value={user.role} onValueChange={updateRole} disabled={saving}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        <span className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${ROLE_BADGE_STYLE[r]?.split(" ")[0]}`} />
                          {ROLE_DISPLAY[r]?.[lang as "en" | "ar"] ?? r}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${ROLE_BADGE_STYLE[user.role] ?? "bg-slate-100 text-slate-800 border-slate-200"}`}>
                  {ROLE_DISPLAY[user.role]?.[lang as "en" | "ar"] ?? user.role}
                </Badge>
              </div>
            </div>

            {/* Joined */}
            {user.created_at && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Clock className="h-3.5 w-3.5" />
                  {lang === "ar" ? "تاريخ الانضمام" : "Joined"}
                </Label>
                <div className="text-sm h-9 flex items-center">{new Date(user.created_at).toLocaleDateString()}</div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 pt-1 border-t">
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "الحالة:" : "Status:"}</span>
            <Switch checked={user.active} disabled />
            <span className="text-sm">{user.active ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "معطل" : "Disabled")}</span>
          </div>
        </CardContent>
      </Card>

      {user.role === "client" || user.role === "client_user" ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-6 text-center space-y-2">
            <Shield className="h-8 w-8 mx-auto text-sky-500 opacity-80" />
            <h3 className="font-semibold text-sm">
              {lang === "ar" ? "حساب عميل (بوابة العملاء)" : "Client Portal Account"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {lang === "ar"
                ? "يستخدم هذا العميل بوابة العملاء الخاصة (لوحة التحكم / مساحة العمل) لمتابعة الطلبات وتذاكر الدعم والتقييمات. صلاحيات لوحة الإدارة الداخلية لا تنطبق على حسابات العملاء."
                : "This user accesses the dedicated Client Portal (/dashboard/workspace) for managing orders, support tickets, and quotes. Granular admin panel permissions do not apply to client accounts."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <PermissionsMatrix userId={user.id} isAdmin={user.role === "admin"} />
      )}
    </div>
  );
}
