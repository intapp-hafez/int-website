import { useState, useMemo, useEffect } from "react";
import { useFaqs } from "@/lib/faqs-store";
import { useI18n } from "@/lib/i18n";
import {
  ChevronDown,
  HelpCircle,
  Sparkles,
  MessageCircleQuestion,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function FaqSection({
  className = "",
  pageSize = 15,
}: {
  className?: string;
  pageSize?: number;
}) {
  const { faqs, loading } = useFaqs();
  const { lang } = useI18n();
  const isAr = lang === "ar";

  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const activeFaqs = useMemo(() => {
    return faqs.filter((f) => f.active);
  }, [faqs]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    activeFaqs.forEach((f) => {
      const cat = isAr ? f.category_ar || f.category_en : f.category_en;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [activeFaqs, isAr]);

  const displayedFaqs = useMemo(() => {
    if (selectedCat === "all") return activeFaqs;
    return activeFaqs.filter((f) => {
      const cat = isAr ? f.category_ar || f.category_en : f.category_en;
      return cat === selectedCat;
    });
  }, [activeFaqs, selectedCat, isAr]);

  // Reset page to 1 on category change
  useEffect(() => {
    setCurrentPage(1);
    setOpenId(null);
  }, [selectedCat]);

  // Pagination calculation
  const totalPages = Math.ceil(displayedFaqs.length / pageSize);
  const paginatedFaqs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedFaqs.slice(start, start + pageSize);
  }, [displayedFaqs, currentPage, pageSize]);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setOpenId(null);
  };

  if (!loading && activeFaqs.length === 0) return null;

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-widest">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{isAr ? "الأسئلة الشائعة" : "Knowledge Base"}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            {isAr ? "إجابات على أكثر الأسئلة استفساراً" : "Frequently Asked Questions"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "تعرف على حلولنا الهندسية، معايير التنفيذ، عقود الصيانة، وكيفية بدء مشروعك معنا."
              : "Learn about our turnkey delivery, engineering certifications, SLAs, and project engagement models."}
          </p>
        </div>

        {/* Category Filter Tabs */}
        {categories.length > 1 && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            <button
              type="button"
              onClick={() => setSelectedCat("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCat === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {isAr ? "الكل" : "All Topics"} ({activeFaqs.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCat === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {paginatedFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            const question = isAr ? faq.question_ar || faq.question_en : faq.question_en;
            const answer = isAr ? faq.answer_ar || faq.answer_en : faq.answer_en;
            const category = isAr ? faq.category_ar || faq.category_en : faq.category_en;

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? "border-accent/40 bg-card shadow-sm"
                    : "border-border/60 bg-card/60 hover:border-border hover:bg-card"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full py-4 px-5 sm:px-6 flex items-center justify-between gap-4 text-start group cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      <MessageCircleQuestion className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-foreground group-hover:text-accent transition-colors leading-snug">
                      {question}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {category && (
                      <Badge variant="outline" className="hidden sm:inline-flex text-[10px] py-0 font-normal">
                        {category}
                      </Badge>
                    )}
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center transition-transform duration-200 ${
                        isOpen ? "rotate-180 bg-accent/10 text-accent" : "text-muted-foreground"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-border/40 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in-50 duration-200">
                    <p className="whitespace-pre-line">{answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 15-Item Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground font-medium">
              {isAr ? (
                <>
                  عرض{" "}
                  <span className="text-foreground font-semibold">
                    {(currentPage - 1) * pageSize + 1} -{" "}
                    {Math.min(currentPage * pageSize, displayedFaqs.length)}
                  </span>{" "}
                  من إجمالي{" "}
                  <span className="text-foreground font-semibold">{displayedFaqs.length}</span> سؤال
                </>
              ) : (
                <>
                  Showing{" "}
                  <span className="text-foreground font-semibold">
                    {(currentPage - 1) * pageSize + 1} -{" "}
                    {Math.min(currentPage * pageSize, displayedFaqs.length)}
                  </span>{" "}
                  of{" "}
                  <span className="text-foreground font-semibold">{displayedFaqs.length}</span> FAQs
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180 me-1" />
                <span>{isAr ? "السابق" : "Prev"}</span>
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0 text-xs font-mono"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <span>{isAr ? "التالي" : "Next"}</span>
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180 ms-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Footer Prompt */}
        <div className="mt-10 p-6 rounded-2xl border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-foreground">
              {isAr ? "هل لديك سؤال فني آخر غير مذكور هنا؟" : "Have a question not listed here?"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "مهندسونا متاحون على مدار الساعة للإجابة على استفساراتك وتقديم دراسات الجدوى."
                : "Our engineering architects are available 24/7 to provide technical assessments."}
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0 shadow-xs">
            <Link to="/contact">
              <span>{isAr ? "تواصل مع مهندسينا" : "Talk to an Engineer"}</span>
              <ArrowRight className="h-3.5 w-3.5 ms-1.5 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
