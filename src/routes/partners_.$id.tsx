import { createFileRoute, Link } from "@tanstack/react-router";
import { usePartners } from "@/lib/partners-store";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { SmartLogo } from "@/components/ui/smart-logo";

export const Route = createFileRoute("/partners_/$id")({
  component: PartnerDetailsPage,
});

function PartnerDetailsPage() {
  const { id } = Route.useParams();
  const { partners, loading } = usePartners();
  const { t, lang, dir } = useI18n();
  const isAr = lang === "ar";

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading...</div>;
  }

  const partner = partners.find((p) => p.id === id);

  if (!partner) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold">Partner not found</h1>
        <Button asChild variant="outline">
          <Link to="/partners">Back to Ecosystem</Link>
        </Button>
      </div>
    );
  }

  const displayName = isAr ? partner.name_ar || partner.name_en : partner.name_en || partner.name_ar;
  const description = isAr ? partner.description_ar : partner.description_en;

  return (
    <div className="min-h-screen bg-background pb-20" dir={dir}>
      {/* Hero Header */}
      <div className="relative gradient-surface border-b">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-20 relative">
          <Link
            to="/partners"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            {isAr ? <ChevronRight className="h-4 w-4 me-1" /> : <ChevronLeft className="h-4 w-4 me-1" />}
            {isAr ? "العودة إلى الشركاء" : "Back to Partners"}
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="h-32 w-32 shrink-0 bg-white rounded-2xl border-4 border-white shadow-xl flex items-center justify-center p-4">
              <SmartLogo src={partner.logo} alt={displayName} name={displayName} />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                {displayName}
              </h1>
              {partner.href && (
                <Button asChild variant="secondary" className="gap-2">
                  <a href={partner.href} target="_blank" rel="noreferrer">
                    {isAr ? "زيارة الموقع" : "Visit Website"}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 lg:px-8 py-12 md:py-16">
        <div className="max-w-4xl bg-card border rounded-3xl p-6 md:p-12 shadow-sm">
          {description ? (
            <div
              className={`rich-text-content ${isAr ? "font-arabic leading-relaxed text-right" : "leading-relaxed text-left"}`}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <div className="text-center text-muted-foreground italic py-10">
              {isAr ? "لا يوجد وصف متاح." : "No description available."}
            </div>
          )}
        </div>
      </div>
      
      {/* Dynamic CSS for Rich Text */}
      <style>{`
        .rich-text-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: hsl(var(--foreground));
          font-family: inherit;
        }
        .rich-text-content h2:first-child {
          margin-top: 0;
        }
        .rich-text-content p {
          font-size: 1.05rem;
          color: hsl(var(--muted-foreground));
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }
        .rich-text-content strong {
          color: hsl(var(--foreground));
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
