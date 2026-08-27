import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Loader2, Pencil } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AdminRole = "admin" | "manager" | "agent" | "seo" | "technician" | "moderator" | "helpdesk_manager" | "user" | "client";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLogin: string;
};

export const Route = createFileRoute("/dashboard/admin/users/")({
  head: () => ({ meta: [{ title: "Users & Roles - Admin" }] }),
  validateSearch: validateListSearch,
  component: UsersPage,
});

const PAGE_SIZE = 10;
const ACTIVE_OPTS = [
  { value: "active", label: "Activate" },
  { value: "inactive", label: "Deactivate" },
];

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

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<AdminUser>({ id: "", name: "", email: "", role: "agent", active: true, lastLogin: "—" });
  const [draftPassword, setDraftPassword] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t, lang, isRtl } = useAdminT();
  const can = useCanAccess("users");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });

  const loadUsers = async () => {
    try {
      const db = supabase as any;
      const { data: usersData, error } = await db.rpc("get_admin_users");
      if (usersData && usersData.length > 0) {
        const mapped: AdminUser[] = usersData
          .filter((r: any) => r.role !== "client" && r.role !== "client_user")
          .map((r: any) => ({
            id: r.id,
            name: r.name || "Unknown",
            email: r.email || `${r.role || "user"}@integratedtechnics.com`,
            role: String(r.role || "admin"),
            active: r.active !== false,
            lastLogin: r.last_login ? new Date(r.last_login).toLocaleDateString() : "—",
          }));
        const unique = Array.from(new Map(mapped.map(item => [item.id, item])).values());
        setUsers(unique);
      } else {
        setUsers([
          { id: "u-01", name: "System Administrator", email: "admin@web.int", role: "admin", active: true, lastLogin: new Date().toLocaleDateString() },
        ]);
      }
    } catch (err) {
      console.warn("[users] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const setActive = (id: string, v: boolean) => setUsers(users.map((x) => (x.id === id ? { ...x, active: v } : x)));
  const go = (id: string) => navigate({ to: "/dashboard/admin/users/$id", params: { id } });

  const sorted = useMemo(
    () =>
      sortItems(users, sort, dir, {
        name: (u) => u.name,
        email: (u) => u.email,
        role: (u) => u.role,
        lastLogin: (u) => u.lastLogin,
        status: (u) => (u.active ? 1 : 0),
      }),
    [users, sort, dir],
  );

  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((u) => u.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const bulkDelete = () => {
    setUsers((prev) => prev.filter((u) => !selected.includes(u.id)));
    setSelected([]);
    toast.success(t("usersRemoved", "تم حذف المستخدمين"));
  };

  const bulkActive = (v: string) => {
    const active = v === "active";
    setUsers((prev) => prev.map((u) => (selected.includes(u.id) ? { ...u, active } : u)));
    setSelected([]);
    toast.success(t("usersUpdated", "تم تحديث المستخدمين"));
  };

  const addUser = async () => {
    if (!draft.name.trim() || !draft.email.trim() || !draftPassword.trim()) {
      toast.error(t("fillAllFields", "Please fill all fields including password"));
      return;
    }

    setIsInviting(true);
    try {
      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; padding: 40px 20px; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.05);">
            
            <div style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eaeaea;">
              <img src="${window.location.origin}/logo.svg" alt="Integrated Technics" style="max-height: 45px; display: block; margin: 0 auto;" />
            </div>
            
            <div style="padding: 40px; text-align: left;">
              <h2 style="margin-top: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Welcome to the Panel, ${draft.name}!</h2>
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
                We are thrilled to have you on board at Integrated Technics. Your account has been successfully set up and you're ready to get started.
              </p>
              
              <div style="background-color: #fff8f5; border-left: 4px solid #ea580c; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 35px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #1a1a1a;">Your Login Credentials</h3>
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #444;"><strong>Email:</strong> ${draft.email}</p>
                <p style="margin: 0; font-size: 15px; color: #444;"><strong>Password:</strong> ${draftPassword}</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${window.location.origin}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Access Dashboard</a>
              </div>
              
              <p style="font-size: 14px; color: #888; margin-top: 40px; line-height: 1.5; border-top: 1px solid #eaeaea; padding-top: 20px;">
                For security purposes, we strongly recommend changing your password immediately after your first login.
              </p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 25px 40px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #eaeaea;">
              <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} Integrated Technics. All rights reserved.</p>
              <p style="margin: 0;">This is an automated message, please do not reply.</p>
            </div>
            
          </div>
        </div>
      `;

      const session = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("invite-admin-user", {
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`
        },
        body: {
          email: draft.email,
          password: draftPassword,
          name: draft.name,
          role: draft.role
        }
      });

      if (error || !data?.success) {
        let msg = data?.error || error?.message || "Failed to create user";
        if (error && (error as any).context) {
          try {
            const body = await (error as any).context.json();
            if (body?.error) msg = body.error;
          } catch {}
        }
        throw new Error(msg);
      }

      // Update local state with the actual user ID
      const next: AdminUser = { ...draft, id: data.user.id, lastLogin: "—" };
      setUsers([next, ...users]);

      // Also trigger the welcome email if configured
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: draft.email,
            subject: "Welcome to Integrated Technics",
            html: emailHtml
          }
        });
      } catch (emailErr) {
        console.warn("Welcome email could not be sent:", emailErr);
      }

      toast.success(t("userAdded", "تمت إضافة المستخدم بنجاح"));
      setDraft({ id: "", name: "", email: "", role: "agent", active: true, lastLogin: "—" });
      setDraftPassword("");
    } catch (e: any) {
      console.error("Failed to invite user:", e);
      let errMsg = e.message || "Failed to send invitation email";
      if (e.context) {
        try {
          const body = await e.context.json();
          errMsg = body.error || errMsg;
        } catch { }
      }
      toast.error(errMsg);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {can.add && (
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              <span>{t("inviteUser", "دعوة مستخدم جديد")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5">
              <Label>{t("name", "الاسم")}</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("email", "البريد الإلكتروني")}</Label>
              <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="user@domain.com" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("password", "كلمة المرور")}</Label>
              <Input type="password" value={draftPassword} onChange={(e) => setDraftPassword(e.target.value)} placeholder="Password" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("role", "الدور الوظيفي")}</Label>
              <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["admin", "manager", "agent", "seo", "technician", "hr", "assistant"].map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_DISPLAY[r]?.[lang as "en" | "ar"] ?? r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={addUser} disabled={isInviting}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("add", "إضافة")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap pb-4">
          <div>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <span>{t("users", "المستخدمين وفريق العمل")}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {sorted.length} {t("of", "من")} {users.length} {t("total", "الإجمالي")}
            </p>
          </div>
          <ViewToggle value={view} />
        </CardHeader>

        <CardContent className="space-y-4">
          <BulkActionBar
            count={selected.length}
            onClear={() => setSelected([])}
            onDelete={can.delete ? bulkDelete : undefined}
            statusOptions={can.edit ? ACTIVE_OPTS : undefined}
            onStatusChange={can.edit ? bulkActive : undefined}
          />

          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
              <span>{t("Loading staff accounts...", "جاري تحميل حسابات الموظفين...")}</span>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pg.items.map((u) => (
                <div
                  key={u.id}
                  className="rounded-xl border bg-card p-4 flex flex-col gap-3 cursor-pointer hover:border-accent transition-colors"
                  onClick={() => go(u.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{u.email}</div>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors shrink-0"
                      onClick={(e) => { e.stopPropagation(); go(u.id); }}
                      title={lang === "ar" ? "تعديل" : "Edit"}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[10px] ${ROLE_BADGE_STYLE[u.role] ?? "bg-slate-100 text-slate-800 border-slate-200"}`}>
                      {ROLE_DISPLAY[u.role]?.[lang as "en" | "ar"] ?? u.role}
                    </Badge>
                    <Switch checked={u.active} onCheckedChange={(v) => { setActive(u.id, v); }} disabled={!can.edit} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">{u.lastLogin}</div>
                </div>
              ))}
            </div>
          ) : view === "list" ? (
            <div className="flex flex-col divide-y rounded-xl border overflow-hidden">
              {pg.items.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => go(u.id)}
                >
                  <Checkbox
                    checked={selected.includes(u.id)}
                    onCheckedChange={() => toggleOne(u.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{u.name}</span>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${ROLE_BADGE_STYLE[u.role] ?? "bg-slate-100 text-slate-800 border-slate-200"}`}>
                        {ROLE_DISPLAY[u.role]?.[lang as "en" | "ar"] ?? u.role}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono hidden sm:block shrink-0">{u.lastLogin}</div>
                  <Switch checked={u.active} onCheckedChange={(v) => setActive(u.id, v)} disabled={!can.edit} onClick={(e) => e.stopPropagation()} />
                  <button
                    type="button"
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors shrink-0"
                    onClick={(e) => { e.stopPropagation(); go(u.id); }}
                    title={lang === "ar" ? "تعديل" : "Edit"}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} />
                    </TableHead>
                    <SortableHead field="name" sort={sort} dir={dir} onSort={toggleSort}>{t("name", "الاسم")}</SortableHead>
                    <SortableHead field="email" sort={sort} dir={dir} onSort={toggleSort}>{t("email", "البريد الإلكتروني")}</SortableHead>
                    <SortableHead field="role" sort={sort} dir={dir} onSort={toggleSort}>{t("role", "الدور")}</SortableHead>
                    <SortableHead field="lastLogin" sort={sort} dir={dir} onSort={toggleSort}>{t("lastLogin", "آخر تسجيل دخول")}</SortableHead>
                    <TableHead>{t("status", "الحالة")}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pg.items.map((u) => (
                    <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => go(u.id)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(u.id)} onCheckedChange={() => toggleOne(u.id)} />
                      </TableCell>
                      <TableCell className="font-bold text-xs">{u.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${ROLE_BADGE_STYLE[u.role] ?? "bg-slate-100 text-slate-800 border-slate-200"}`}>
                          {ROLE_DISPLAY[u.role]?.[lang as "en" | "ar"] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{u.lastLogin}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Switch checked={u.active} onCheckedChange={(v) => setActive(u.id, v)} disabled={!can.edit} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          onClick={() => go(u.id)}
                          title={lang === "ar" ? "تعديل" : "Edit"}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Paginator page={pg.page} pageCount={pg.pageCount} total={pg.total} start={pg.start} end={pg.end} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
