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
  moderator: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  helpdesk_manager: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  user: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  client: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800",
};

const ROLE_DISPLAY: Record<string, { en: string; ar: string }> = {
  admin: { en: "Admin", ar: "مدير" },
  manager: { en: "Manager", ar: "مشرف" },
  agent: { en: "Agent", ar: "موظف" },
  seo: { en: "SEO Specialist", ar: "مسؤول SEO" },
  technician: { en: "Technician", ar: "فني تقني" },
  moderator: { en: "Moderator", ar: "مشرف" },
  helpdesk_manager: { en: "Helpdesk Manager", ar: "مدير الدعم الفني" },
  user: { en: "User", ar: "مستخدم" },
  client: { en: "Client", ar: "عميل" },
};

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<AdminUser>({ id: "", name: "", email: "", role: "agent", active: true, lastLogin: "—" });
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t, lang, isRtl } = useAdminT();
  const can = useCanAccess("users");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });

  const loadUsers = async () => {
    try {
      const { data: rolesData } = await supabase.from("user_roles").select("*");
      if (rolesData && rolesData.length > 0) {
        const mapped: AdminUser[] = rolesData.map((r: any, idx: number) => ({
          id: r.user_id || r.id,
          name: r.display_name?.trim() || `Staff Member #${idx + 1}`,
          email: `${r.role || "user"}@integratedtechnics.com`,
          role: String(r.role || "admin"),
          active: true,
          lastLogin: new Date(r.created_at || Date.now()).toLocaleDateString(),
        }));
        setUsers(mapped);
      } else {
        setUsers([
          { id: "u-01", name: "System Administrator", email: "admin@web.int", role: "admin", active: true, lastLogin: new Date().toLocaleDateString() },
          { id: "u-02", name: "Operations Manager", email: "operations@web.int", role: "manager", active: true, lastLogin: new Date().toLocaleDateString() },
          { id: "u-03", name: "Lead Security Engineer", email: "security.tech@web.int", role: "technician", active: true, lastLogin: new Date().toLocaleDateString() },
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
    if (!draft.name.trim() || !draft.email.trim()) return;
    const next: AdminUser = { ...draft, id: `U-${Date.now().toString(36)}`, lastLogin: "—" };
    setUsers([next, ...users]);
    setDraft({ id: "", name: "", email: "", role: "agent", active: true, lastLogin: "—" });
    toast.success(t("userAdded", "تمت إضافة المستخدم بنجاح"));
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
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5">
              <Label>{t("name", "الاسم")}</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("email", "البريد الإلكتروني")}</Label>
              <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="user@domain.com" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("role", "الدور الوظيفي")}</Label>
              <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["admin", "manager", "agent", "seo", "technician"].map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_DISPLAY[r]?.[lang as "en" | "ar"] ?? r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addUser} className="rounded-xl">
              <Plus className={`h-4 w-4 ${isRtl ? "ms-1" : "me-1"}`} /> {t("add", "إضافة")}
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
