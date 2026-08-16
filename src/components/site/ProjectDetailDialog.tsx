import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects-store";
import { Building2, Calendar, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ProjectDetailDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { lang } = useI18n();
  const isRtl = lang === "ar";

  if (!project) return null;

  const title = lang === "ar" ? (project.title.ar || project.title.en) : (project.title.en || project.title.ar);
  const desc = lang === "ar" ? (project.desc.ar || project.desc.en) : (project.desc.en || project.desc.ar);
  const isHtml = /<[a-z][\s\S]*>/i.test(desc);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border bg-card">
        {/* Cover Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          <img
            src={project.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-4 start-4">
            <Badge variant="secondary" className="bg-background/85 backdrop-blur font-semibold px-3 py-1 text-xs">
              <Building2 className="h-3.5 w-3.5 me-1.5 text-accent" />
              {project.industry}
            </Badge>
          </div>
        </div>

        {/* Details Content */}
        <div className="p-6 space-y-4">
          <DialogHeader className="text-start space-y-2">
            <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="border-t pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {isRtl ? "تفاصيل ونطاق المشروع" : "Project Scope & Overview"}
            </h4>
            {isHtml ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: desc }}
              />
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {desc}
              </p>
            )}
          </div>

          <div className="border-t pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{isRtl ? "مشروع منفذ ومعتمد" : "Delivered & Commissioned"}</span>
            </div>

            <Button asChild size="sm" variant="default">
              <Link to="/contact" onClick={() => onOpenChange(false)}>
                <FileText className="h-4 w-4 me-1.5" />
                {isRtl ? "طلب استشارة لمشروع مماثل" : "Request Similar Proposal"}
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
