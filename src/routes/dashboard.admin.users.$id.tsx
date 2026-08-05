import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoUsers } from "@/data/demo";
import { ArrowLeft, Mail } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { PermissionsMatrix } from "@/components/admin/PermissionsMatrix";

export const Route = createFileRoute("/dashboard/admin/users/$id")({
  head: () => ({ meta: [{ title: "User — Admin" }] }),
  component: UserDetail,
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

function UserDetail() {
  const { id } = Route.useParams();
  const { t, lang } = useAdminT();
  const u = demoUsers.find((x) => x.id === id);
  if (!u) return <Card><CardContent className="p-6">User not found.</CardContent></Card>;
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm"><Link to="/dashboard/admin/users"><ArrowLeft className="h-4 w-4 me-2" /> {t("back")}</Link></Button>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-xl">{u.name}</CardTitle>
          <Badge variant={u.active ? "default" : "secondary"}>{u.active ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "معطل" : "Disabled")}</Badge>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {u.email}</div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("role")}:</span>
            <Badge variant="outline" className={ROLE_BADGE_STYLE[u.role] ?? ""}>
              {lang === "ar" ? ROLE_DISPLAY[u.role]?.ar ?? u.role : ROLE_DISPLAY[u.role]?.en ?? u.role}
            </Badge>
          </div>
          <div><span className="text-muted-foreground">{lang === "ar" ? "آخر تسجيل دخول" : "Last login"}:</span> {u.lastLogin}</div>
        </CardContent>
      </Card>
      <PermissionsMatrix userId={u.id} isAdmin={u.role === "admin"} />
    </div>
  );
}