import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { useProjects } from "@/lib/projects-store";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/projects/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Project — Admin" }] }),
  component: EditProject,
});

function EditProject() {
  const { id } = Route.useParams();
  const { get, update } = useProjects();
  const p = get(Number(id));
  const navigate = useNavigate();
  const { t, isRtl, lang } = useAdminT();
  if (!p) return <div>{t("notFound")}</div>;
  const { id: _omit, ...initial } = p;
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm"><Link to="/dashboard/admin/projects/$id" params={{ id }}><ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {t("back")}</Link></Button>
      <ProjectForm
        title={`${t("edit")} "${lang === "ar" ? p.title.ar : p.title.en}"`}
        initial={initial}
        onSubmit={(d) => { update(p.id, d); navigate({ to: "/dashboard/admin/projects/$id", params: { id } }); }}
        onCancel={() => navigate({ to: "/dashboard/admin/projects/$id", params: { id } })}
      />
    </div>
  );
}