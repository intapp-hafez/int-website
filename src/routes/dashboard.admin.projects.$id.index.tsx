import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/lib/projects-store";
import { ArrowLeft, Pencil } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/projects/$id/")({
  head: () => ({ meta: [{ title: "Project Details — Admin" }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const { get } = useProjects();
  const p = get(Number(id));
  const navigate = useNavigate();
  const { t, isRtl, lang } = useAdminT();

  if (!p) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/admin/projects">
            <ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {t("back")}
          </Link>
        </Button>
        <Card><CardContent className="p-6 text-center text-muted-foreground">{t("notFound")}</CardContent></Card>
      </div>
    );
  }

  const title = lang === "ar" ? (p.title?.ar || p.title?.en || "مشروع") : (p.title?.en || p.title?.ar || "Project");
  const descEn = p.desc?.en || "";
  const descAr = p.desc?.ar || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/admin/projects">
            <ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {t("back")}
          </Link>
        </Button>
        <Button
          size="sm"
          onClick={() => navigate({ to: "/dashboard/admin/projects/$id/edit", params: { id: String(p.id) } })}
        >
          <Pencil className="h-4 w-4 me-2" /> {t("edit")}
        </Button>
      </div>
      <Card>
        <div className="relative aspect-[21/9] max-h-72 overflow-hidden bg-muted">
          <img src={p.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"} alt={title} className="w-full h-full object-cover" />
          <div className="absolute top-3 end-3">
            <Badge variant={p.active ? "default" : "secondary"}>
              {p.active ? (lang === "ar" ? "منشور نشط" : "Live Active") : (lang === "ar" ? "معطل مخفي" : "Hidden Draft")}
            </Badge>
          </div>
        </div>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-display text-2xl">{title}</CardTitle>
            <Badge variant="outline">{p.industry}</Badge>
          </div>
          {lang === "en" && p.title?.ar && (
            <p className="text-sm text-muted-foreground" dir="rtl">{p.title.ar}</p>
          )}
          {lang === "ar" && p.title?.en && (
            <p className="text-sm text-muted-foreground" dir="ltr">{p.title.en}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Description (EN)</h3>
            {/<[a-z][\s\S]*>/i.test(descEn) ? (
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: descEn }} />
            ) : (
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{descEn || "No English description provided."}</p>
            )}
          </div>
          <div dir="rtl">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">الوصف (عربي)</h3>
            {/<[a-z][\s\S]*>/i.test(descAr) ? (
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: descAr }} />
            ) : (
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{descAr || "لا يوجد وصف بالعربية."}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
