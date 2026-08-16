import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { useProjects } from "@/lib/projects-store";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/projects/new")({
  head: () => ({ meta: [{ title: "New Project — Admin" }] }),
  component: NewProject,
});

function NewProject() {
  const { add } = useProjects();
  const navigate = useNavigate();
  const { t, isRtl } = useAdminT();
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm"><Link to="/dashboard/admin/projects"><ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {t("back")}</Link></Button>
      <ProjectForm
        title={t("newProject")}
        initial={{ image: "/placeholder.svg", title: { en: "", ar: "" }, industry: "", desc: { en: "", ar: "" }, active: true }}
        onSubmit={async (d) => { const p = await add(d); navigate({ to: "/dashboard/admin/projects/$id", params: { id: String(p?.id ?? "") } }); }}
        onCancel={() => navigate({ to: "/dashboard/admin/projects" })}
      />
    </div>
  );
}