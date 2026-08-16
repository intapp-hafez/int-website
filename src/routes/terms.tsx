import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useLegalContent, DEFAULT_TERMS } from "@/lib/legal-store";
import { ScrollText, ShieldCheck, Clock, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Integrated Technics" },
      { name: "description", content: "Master service agreement, SLA terms, equipment warranties, and legal clauses for Integrated Technics clients." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { content } = useLegalContent("terms_content", DEFAULT_TERMS);

  const activeText = isAr ? content.ar : content.en;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="gradient-surface relative border-b overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 py-16 sm:py-20 relative max-w-4xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-widest">
              <ScrollText className="h-3.5 w-3.5" />
              <span>{isAr ? "الشروط القانونية" : "Legal Framework"}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              {isAr ? "الشروط والأحكام" : "Terms of Service"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              {isAr
                ? "اتفاقية تقديم الخدمات والتوريدات الهندسية والضمانات المعتمدة لشركة إنترجريتد تكنيكس."
                : "Master terms governing project execution, equipment warranties, and enterprise SLA delivery."}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="p-6 sm:p-10 rounded-2xl border bg-card shadow-xs space-y-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent" />
                <span>{isAr ? "ساري المفعول لعام: 2026" : "Effective: 2026"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isAr ? "اتفاقية رسمية معتمدة" : "Official Master Agreement"}</span>
              </div>
            </div>

            <div
              className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm sm:text-base prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-accent"
              dir={isAr ? "rtl" : "ltr"}
              dangerouslySetInnerHTML={{
                __html: activeText.includes("<")
                  ? activeText
                  : activeText.replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>"),
              }}
            />

            <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                {isAr
                  ? "لأي استفسارات قانونية أو مراجعة عقود المشروعات، يرجى مراسلتنا على info@integratedtechnics.com"
                  : "For legal inquiries or master project contract reviews, contact info@integratedtechnics.com"}
              </span>
              <Button asChild size="sm" variant="outline">
                <Link to="/contact">
                  <span>{isAr ? "تواصل معنا" : "Contact Legal Desk"}</span>
                  <ArrowRight className="h-3.5 w-3.5 ms-1.5 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
