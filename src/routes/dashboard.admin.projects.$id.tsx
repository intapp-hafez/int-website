import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/lib/projects-store";
import { ArrowLeft, Pencil } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/projects/$id")({
  head: () => ({ meta: [{ title: "Project Details — Admin" }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const { get } = useProjects();
  const p = get(Number(id));
  if (!p) return <Card><CardContent className="p-6">Project not found.</CardContent></Card>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm"><Link to="/dashboard/admin/projects"><ArrowLeft className="h-4 w-4 me-2" /> {(useAdminT().t)("back")}</Link></Button>
        <Button asChild size="sm"><Link to="/dashboard/admin/projects/$id/edit" params={{ id }}><Pencil className="h-4 w-4 me-2" /> Edit</Link></Button>
      </div>
      <Card>
        <img src={p.image} alt={p.title.en} className="w-full h-64 object-cover" />
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-display text-2xl">{p.title.en}</CardTitle>
            <Badge variant="secondary">{p.industry}</Badge>
          </div>
          <p className="text-sm text-muted-foreground" dir="rtl">{p.title.ar}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Description (EN)</h3>
            {/<[a-z][\s\S]*>/i.test(p.desc.en || "") ? (
              <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: p.desc.en }} />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{p.desc.en}</p>
            )}
          </div>
          <div dir="rtl">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">الوصف</h3>
            {/<[a-z][\s\S]*>/i.test(p.desc.ar || "") ? (
              <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: p.desc.ar }} />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{p.desc.ar}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}