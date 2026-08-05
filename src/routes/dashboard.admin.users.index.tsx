import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoUsers, type AdminUser, type AdminRole } from "@/data/demo";
import { Plus, ShieldCheck } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";

export const Route = createFileRoute("/dashboard/admin/users/")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  validateSearch: validateListSearch,
  component: UsersPage,
});
const PAGE_SIZE = 10;
const ACTIVE_OPTS = [
  { value: "active", label: "Activate" },
  { value: "inactive", label: "Deactivate" },
];

const ROLE_BADGE_STYLE: Record<AdminRole, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  agent: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  seo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  technician: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
};

const ROLE_DISPLAY: Record<AdminRole, { en: string; ar: string }> = {
  admin: { en: "Admin", ar: "مدير" },
  manager: { en: "Manager", ar: "مشرف" },
  agent: { en: "Agent", ar: "موظف" },
  seo: { en: "SEO Specialist", ar: "مسؤول SEO" },
  technician: { en: "Technician", ar: "فني تقني" },
};

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(demoUsers);
  const [draft, setDraft] = useState<AdminUser>({ id: "", name: "", email: "", role: "agent", active: true, lastLogin: "—" });
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t, lang } = useAdminT();
  const can = useCanAccess("users");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });
  const setActive = (id: string, v: boolean) => setUsers(users.map(x => x.id === id ? { ...x, active: v } : x));
  const go = (id: string) => navigate({ to: "/dashboard/admin/users/$id", params: { id } });
  const sorted = useMemo(
    () =>
      sortItems(users, sort, dir, {
        name: (u) => u.name,
        email: (u) => u.email,
        role: (u) => u.role,
        lastLogin: (u) => u.lastLogin,
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
  const bulkDelete = () => { setUsers((prev) => prev.filter((u) => !selected.includes(u.id))); setSelected([]); };
  const bulkActive = (v: string) => {
    const active = v === "active";
    setUsers((prev) => prev.map((u) => (selected.includes(u.id) ? { ...u, active } : u)));
    setSelected([]);
  };

  const add = () => {
    if (!draft.name || !draft.email) return;
    setUsers([{ ...draft, id: `U-${Date.now().toString().slice(-4)}` }, ...users]);
    setDraft({ ...draft, name: "", email: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl md:text-3xl font-bold">{t("users")}</h1>
        <ViewToggle value={view} lang={lang as "en" | "ar"} />
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">{lang === "ar" ? "دعوة مستخدم" : "Invite user"}</CardTitle></CardHeader>
        {can.add && (
        <CardContent className="grid md:grid-cols-4 gap-3">
          <div className="space-y-1.5"><Label>{t("name")}</Label><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{t("email")}</Label><Input type="email" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{t("role")}</Label>
            <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v as AdminRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{lang === "ar" ? "مدير" : "Admin"}</SelectItem>
                <SelectItem value="manager">{lang === "ar" ? "مشرف" : "Manager"}</SelectItem>
                <SelectItem value="agent">{lang === "ar" ? "موظف" : "Agent"}</SelectItem>
                <SelectItem value="seo">{lang === "ar" ? "مسؤول SEO" : "SEO Specialist"}</SelectItem>
                <SelectItem value="technician">{lang === "ar" ? "فني تقني" : "Technician"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end"><Button onClick={add} className="w-full"><Plus className="h-4 w-4 me-2" /> {t("add")}</Button></div>
        </CardContent>
        )}
      </Card>

      <Card>
        <CardContent className={view === "table" ? "overflow-x-auto p-0" : "p-3"}>
        {view === "table" && (
          <div className="p-3 pb-0">
            <BulkActionBar
              count={selected.length}
              onClear={() => setSelected([])}
              onDelete={can.delete ? bulkDelete : undefined}
              statusOptions={can.edit ? ACTIVE_OPTS.map((o) => ({ value: o.value, label: lang === "ar" ? (o.value === "active" ? "تفعيل" : "تعطيل") : o.label })) : undefined}
              onStatusChange={can.edit ? bulkActive : undefined}
            />
          </div>
        )}
        {view === "table" && (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" /></TableHead>
              <SortableHead field="name" sort={sort} dir={dir} onSort={toggleSort}>{lang === "ar" ? "المستخدم" : "User"}</SortableHead>
              <SortableHead field="role" sort={sort} dir={dir} onSort={toggleSort}>{t("role")}</SortableHead>
              <SortableHead field="lastLogin" sort={sort} dir={dir} onSort={toggleSort}>{lang === "ar" ? "آخر دخول" : "Last login"}</SortableHead>
              <TableHead className="text-end">{t("active")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {pg.items.map(u => (
                <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => go(u.id)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.includes(u.id)} onCheckedChange={() => toggleOne(u.id)} aria-label="Select row" />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ROLE_BADGE_STYLE[u.role] ?? ""}>
                      {lang === "ar" ? ROLE_DISPLAY[u.role]?.ar ?? u.role : ROLE_DISPLAY[u.role]?.en ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.lastLogin}</TableCell>
                  <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-2">
                      {can.edit && (
                        <Button asChild size="sm" variant="ghost" title={lang === "ar" ? "الصلاحيات" : "Permissions"}>
                          <a onClick={(e) => { e.preventDefault(); go(u.id); }} href="#"><ShieldCheck className="h-4 w-4" /></a>
                        </Button>
                      )}
                      <Switch checked={u.active} disabled={!can.edit} onCheckedChange={(v) => setActive(u.id, v)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {view === "grid" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pg.items.map(u => (
              <article key={u.id} className="border rounded-lg p-4 cursor-pointer hover:border-accent transition-colors" onClick={() => go(u.id)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${ROLE_BADGE_STYLE[u.role] ?? ""}`}>
                    {lang === "ar" ? ROLE_DISPLAY[u.role]?.ar ?? u.role : ROLE_DISPLAY[u.role]?.en ?? u.role}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">{lang === "ar" ? "آخر دخول" : "Last login"}: {u.lastLogin}</div>
                <div className="mt-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-muted-foreground">{t("active")}</span>
                  <Switch checked={u.active} disabled={!can.edit} onCheckedChange={(v) => setActive(u.id, v)} />
                </div>
              </article>
            ))}
          </div>
        )}
        {view === "list" && (
          <ul className="divide-y">
            {pg.items.map(u => (
              <li key={u.id} className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/40 px-2 -mx-2 rounded" onClick={() => go(u.id)}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
                <Badge variant="secondary" className="capitalize hidden sm:inline-flex">{u.role}</Badge>
                <div className="text-xs text-muted-foreground hidden md:block">{u.lastLogin}</div>
                <div onClick={(e) => e.stopPropagation()}><Switch checked={u.active} disabled={!can.edit} onCheckedChange={(v) => setActive(u.id, v)} /></div>
              </li>
            ))}
          </ul>
        )}
        <div className="p-3"><Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} /></div>
        </CardContent>
      </Card>
    </div>
  );
}