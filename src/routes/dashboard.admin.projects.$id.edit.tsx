import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { useProjects } from "@/lib/projects-store";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/projects/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Project — Admin" }] }),
  component: EditProject,
});

function EditProject() {
  const { id } = Route.useParams();
  const { get, update, loading } = useProjects();
  const p = get(Number(id));
  const navigate = useNavigate();
  const { t, isRtl, lang } = useAdminT();

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/admin/projects">
            <ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {t("back")}
          </Link>
        </Button>
        <div className="p-8 border rounded-lg bg-card text-center text-muted-foreground">{t("notFound")}</div>
      </div>
    );
  }

  const { id: _omit, ...initial } = p;
  const projectTitle = lang === "ar" ? (p.title?.ar || p.title?.en || "مشروع") : (p.title?.en || p.title?.ar || "Project");

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard/admin/projects/$id" params={{ id: String(p.id) }}>
          <ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {t("back")}
        </Link>
      </Button>
      <ProjectForm
        title={`${t("edit")} "${projectTitle}"`}
        initial={initial}
        onSubmit={async (d) => {
          await update(p.id, d);
          navigate({ to: "/dashboard/admin/projects/$id", params: { id: String(p.id) } });
        }}
        onCancel={() => navigate({ to: "/dashboard/admin/projects/$id", params: { id: String(p.id) } })}
      />
    </div>
  );
}