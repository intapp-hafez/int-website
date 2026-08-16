import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useLegalContent, DEFAULT_POLICIES } from "@/lib/legal-store";
import { Lock, ShieldCheck, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Privacy Policy & Compliance — Integrated Technics" },
      { name: "description", content: "Data protection, cyber security governance, and regulatory compliance policies at Integrated Technics." },
    ],
  }),
  component: PoliciesPage,
});

function PoliciesPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { content } = useLegalContent("policies_content", DEFAULT_POLICIES);

  const activeText = isAr ? content.ar : content.en;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="gradient-surface relative border-b overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 py-16 sm:py-20 relative max-w-4xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-widest">
              <Lock className="h-3.5 w-3.5" />
              <span>{isAr ? "الخصوصية والأمان" : "Data Privacy & Governance"}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              {isAr ? "سياسة الخصوصية والأمان" : "Privacy Policy & Compliance"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              {isAr
                ? "التزامنا الراسخ بحماية بيانات العملاء وخصوصية المشروعات والامتثال لأعلى المعايير الدولية."
                : "Our commitment to safeguarding enterprise client data, project secrecy, and regulatory compliance."}
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
                <span>{isAr ? "متوافق مع قانون حماية البيانات" : "ISO / Regulatory Compliant"}</span>
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
                  ? "لأي استفسارات بخصوص حماية البيانات ومسؤول الامتثال، تواصل معنا على privacy@integratedtechnics.com"
                  : "For privacy questions, reach our compliance team at privacy@integratedtechnics.com"}
              </span>
              <Button asChild size="sm" variant="outline">
                <Link to="/contact">
                  <span>{isAr ? "تواصل معنا" : "Contact DPO"}</span>
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
