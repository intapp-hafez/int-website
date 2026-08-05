import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

type Severity = "info" | "warn" | "fail";
type Finding = {
  page_id: string | null;
  category: string;
  severity: Severity;
  title: string;
  detail?: string;
  suggestion?: Record<string, unknown> | null;
};

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;
const MIN_KEYWORDS = 5;

function lengthSeverity(len: number, min: number, max: number): Severity | null {
  if (len === 0) return "fail";
  if (len < min) return "warn";
  if (len > max) return "warn";
  return null;
}

/** Bilingual issue with a step-by-step fix guide stored in `suggestion`. */
function issue(
  f: Omit<Finding, "suggestion"> & {
    title_ar: string;
    detail_ar?: string;
    guide_en: string;
    guide_ar: string;
  },
): Finding {
  const { title_ar, detail_ar, guide_en, guide_ar, ...rest } = f;
  return {
    ...rest,
    suggestion: {
      title_ar,
      ...(detail_ar ? { detail_ar } : {}),
      guide_en,
      guide_ar,
      __guide_only: true,
    },
  };
}

function kwCount(s: string) {
  return s.split(",").map((x) => x.trim()).filter(Boolean).length;
}

export async function runSeoBot(
  trigger: "manual" | "cron" | "hook" = "manual",
  opts: { full?: boolean } = {},
) {
  const started = Date.now();
  const full = !!opts.full;

  const { data: run, error: runErr } = await supabaseAdmin
    .from("seo_bot_runs")
    .insert({ trigger, status: "running" })
    .select("*")
    .single();
  if (runErr || !run) throw new Error(runErr?.message || "failed to create run");

  try {
    const [{ data: g }, { data: pages }] = await Promise.all([
      supabaseAdmin.from("seo_global").select("*").eq("id", "main").maybeSingle(),
      supabaseAdmin.from("seo_pages").select("*").order("sort_order", { ascending: true }),
    ]);
    if (!g) throw new Error("seo_global not configured");

    const findings: Finding[] = [];

    // ----- Global checks -----
    if (!g.hreflang_enabled) {
      findings.push(issue({
        page_id: null, category: "hreflang", severity: "warn",
        title: "Hreflang disabled site-wide",
        title_ar: "وسوم hreflang معطّلة على مستوى الموقع",
        detail: "Search engines cannot tell the EN and AR versions apart.",
        detail_ar: "لا تستطيع محركات البحث التمييز بين النسختين العربية والإنجليزية.",
        guide_en: "Open SEO Control → Global Defaults and turn on “Emit hreflang tags (en / ar / x-default)”, then save.",
        guide_ar: "افتح تحكم SEO ← الإعدادات الافتراضية وفعّل «إصدار وسوم hreflang (en / ar / x-default)» ثم احفظ.",
      }));
    }
    if (!g.og_image_url) {
      findings.push(issue({
        page_id: null, category: "open-graph", severity: "warn",
        title: "Default Open Graph image is missing",
        title_ar: "صورة Open Graph الافتراضية غير موجودة",
        detail: "Shared links will show no preview image, lowering click-through.",
        detail_ar: "لن تظهر صورة معاينة عند مشاركة الروابط ممّا يقلّل نسبة النقر.",
        guide_en: "Upload a 1200×630 branded image, then paste its URL in Global Defaults → Default Open Graph image URL.",
        guide_ar: "ارفع صورة 1200×630 تحمل هوية الشركة وضع رابطها في الإعدادات الافتراضية ← رابط صورة Open Graph.",
      }));
    }
    if (!g.google_verification && !g.bing_verification) {
      findings.push(issue({
        page_id: null, category: "verification", severity: "info",
        title: "No search engine verification configured",
        title_ar: "لم يتم إعداد توثيق محركات البحث",
        detail: "You cannot monitor indexing or crawl errors.",
        detail_ar: "لا يمكنك متابعة الفهرسة أو أخطاء الزحف.",
        guide_en: "Create properties in Google Search Console and Bing Webmaster Tools, copy the meta content values into SEO Control → Verifications.",
        guide_ar: "أنشئ الموقع في Google Search Console و Bing Webmaster وانسخ قيم التوثيق إلى تحكم SEO ← التوثيقات.",
      }));
    }
    if (!g.ga4_id && !g.gtm_id) {
      findings.push(issue({
        page_id: null, category: "analytics", severity: "info",
        title: "No analytics tracker configured",
        title_ar: "لا يوجد نظام تحليلات مُفعّل",
        detail: "Organic traffic cannot be measured.",
        detail_ar: "لا يمكن قياس الزيارات القادمة من البحث.",
        guide_en: "Add your GA4 (G-XXXX) or GTM (GTM-XXXX) ID under SEO Control → Analytics and save.",
        guide_ar: "أضف معرّف GA4 أو GTM في تحكم SEO ← التحليلات ثم احفظ.",
      }));
    }
    if (!g.default_keywords_en.trim() || !g.default_keywords_ar.trim()) {
      findings.push(issue({
        page_id: null, category: "keywords", severity: "warn",
        title: "Default keywords missing in one or both languages",
        title_ar: "الكلمات المفتاحية الافتراضية ناقصة بإحدى اللغتين",
        detail: "Pages without their own keywords fall back to empty values.",
        detail_ar: "الصفحات التي لا تملك كلمات خاصة سترجع إلى قيم فارغة.",
        guide_en: "Fill both “Default keywords (EN)” and “(AR)” with 8–12 comma-separated core terms.",
        guide_ar: "املأ «الكلمات الافتراضية (EN)» و«(AR)» بـ 8–12 كلمة مفصولة بفواصل.",
      }));
    }

    // ----- Per-page checks -----
    const pageList = (pages ?? []) as Array<{
      id: string; path: string;
      title_en: string; title_ar: string;
      description_en: string; description_ar: string;
      keywords_en: string; keywords_ar: string;
      og_image_url: string | null; noindex: boolean;
    }>;

    for (const p of pageList) {
      const checks: Array<[Severity | null, string, string, string, string]> = [
        [lengthSeverity(p.title_en.length, TITLE_MIN, TITLE_MAX),
          `EN title length ${p.title_en.length} chars`,
          `طول العنوان الإنجليزي ${p.title_en.length} حرفًا`,
          `Rewrite the EN title to ${TITLE_MIN}–${TITLE_MAX} characters, front-loading the main keyword and ending with the brand.`,
          `أعد صياغة العنوان الإنجليزي ليصبح ${TITLE_MIN}–${TITLE_MAX} حرفًا مع وضع الكلمة الرئيسية في البداية واسم العلامة في النهاية.`],
        [lengthSeverity(p.title_ar.length, TITLE_MIN, TITLE_MAX),
          `AR title length ${p.title_ar.length} chars`,
          `طول العنوان العربي ${p.title_ar.length} حرفًا`,
          `Rewrite the AR title to ${TITLE_MIN}–${TITLE_MAX} characters — translate meaning, not words.`,
          `أعد صياغة العنوان العربي ليصبح ${TITLE_MIN}–${TITLE_MAX} حرفًا مع ترجمة المعنى لا الكلمات.`],
        [lengthSeverity(p.description_en.length, DESC_MIN, DESC_MAX),
          `EN description length ${p.description_en.length} chars`,
          `طول الوصف الإنجليزي ${p.description_en.length} حرفًا`,
          `Write ${DESC_MIN}–${DESC_MAX} characters describing the page benefit plus a call to action.`,
          `اكتب وصفًا من ${DESC_MIN}–${DESC_MAX} حرفًا يوضّح فائدة الصفحة مع دعوة لاتخاذ إجراء.`],
        [lengthSeverity(p.description_ar.length, DESC_MIN, DESC_MAX),
          `AR description length ${p.description_ar.length} chars`,
          `طول الوصف العربي ${p.description_ar.length} حرفًا`,
          `Write ${DESC_MIN}–${DESC_MAX} Arabic characters — natural phrasing, no machine translation.`,
          `اكتب وصفًا عربيًا من ${DESC_MIN}–${DESC_MAX} حرفًا بصياغة طبيعية دون ترجمة آلية.`],
      ];
      for (const [sev, t, tAr, gEn, gAr] of checks) {
        if (!sev) continue;
        findings.push(issue({
          page_id: p.id, category: t.includes("title") ? "title" : "description", severity: sev,
          title: t, title_ar: tAr, guide_en: gEn, guide_ar: gAr,
        }));
      }

      if (kwCount(p.keywords_en) < MIN_KEYWORDS || kwCount(p.keywords_ar) < MIN_KEYWORDS) {
        findings.push(issue({
          page_id: p.id, category: "keywords", severity: "warn",
          title: `Fewer than ${MIN_KEYWORDS} keywords (EN ${kwCount(p.keywords_en)} / AR ${kwCount(p.keywords_ar)})`,
          title_ar: `أقل من ${MIN_KEYWORDS} كلمات مفتاحية (إنجليزي ${kwCount(p.keywords_en)} / عربي ${kwCount(p.keywords_ar)})`,
          guide_en: "Open the Pages tab, add 8–12 comma-separated keywords per language mixing generic and long-tail terms, or apply the AI suggestion for this page.",
          guide_ar: "افتح تبويب الصفحات وأضف 8–12 كلمة مفتاحية لكل لغة تجمع بين العام والطويل، أو طبّق اقتراح الذكاء الاصطناعي لهذه الصفحة.",
        }));
      }
      if (!p.og_image_url && !g.og_image_url) {
        findings.push(issue({
          page_id: p.id, category: "open-graph", severity: "warn",
          title: "No Open Graph image",
          title_ar: "لا توجد صورة Open Graph",
          guide_en: "Set a page-level OG image URL in the Pages tab, or configure a site-wide default.",
          guide_ar: "أضف رابط صورة OG للصفحة من تبويب الصفحات أو اضبط صورة افتراضية للموقع.",
        }));
      }
      if (p.noindex) {
        findings.push(issue({
          page_id: p.id, category: "indexing", severity: "info",
          title: "Page is set to noindex",
          title_ar: "الصفحة مضبوطة على noindex",
          guide_en: "If this page should rank, turn off “Hide from search engines (noindex)” in the Pages tab.",
          guide_ar: "إذا كنت تريد ظهور الصفحة في البحث فأوقف «إخفاء من محركات البحث (noindex)» في تبويب الصفحات.",
        }));
      }
    }

    // ----- Full (deep) scan: cross-page & structural checks -----
    if (full) {
      const seen = new Map<string, string[]>();
      for (const p of pageList) {
        const key = p.title_en.trim().toLowerCase();
        if (!key) continue;
        seen.set(key, [...(seen.get(key) ?? []), p.id]);
      }
      for (const [, ids] of seen) {
        if (ids.length > 1) {
          findings.push(issue({
            page_id: ids[0], category: "duplicate", severity: "fail",
            title: `Duplicate EN title shared by ${ids.join(", ")}`,
            title_ar: `عنوان إنجليزي مكرر بين ${ids.join("، ")}`,
            guide_en: "Give each page a unique title. Duplicates make Google pick one page and ignore the rest.",
            guide_ar: "امنح كل صفحة عنوانًا فريدًا، فالتكرار يجعل جوجل يختار صفحة واحدة ويتجاهل الباقي.",
          }));
        }
      }

      const seenDesc = new Map<string, string[]>();
      for (const p of pageList) {
        const key = p.description_en.trim().toLowerCase();
        if (!key) continue;
        seenDesc.set(key, [...(seenDesc.get(key) ?? []), p.id]);
      }
      for (const [, ids] of seenDesc) {
        if (ids.length > 1) {
          findings.push(issue({
            page_id: ids[0], category: "duplicate", severity: "warn",
            title: `Duplicate EN description shared by ${ids.join(", ")}`,
            title_ar: `وصف إنجليزي مكرر بين ${ids.join("، ")}`,
            guide_en: "Write a distinct description per page describing that page's specific offer.",
            guide_ar: "اكتب وصفًا مميزًا لكل صفحة يعبّر عن محتواها تحديدًا.",
          }));
        }
      }

      for (const p of pageList) {
        if (!p.path.startsWith("/")) {
          findings.push(issue({
            page_id: p.id, category: "url", severity: "fail",
            title: `Invalid path “${p.path}”`,
            title_ar: `مسار غير صالح «${p.path}»`,
            guide_en: "Paths must start with “/” so canonical and sitemap URLs resolve correctly.",
            guide_ar: "يجب أن يبدأ المسار بـ «/» حتى تعمل روابط canonical وخريطة الموقع بشكل صحيح.",
          }));
        }
        if (p.path.length > 60) {
          findings.push(issue({
            page_id: p.id, category: "url", severity: "info",
            title: `Long URL path (${p.path.length} chars)`,
            title_ar: `مسار طويل (${p.path.length} حرفًا)`,
            guide_en: "Shorten the slug to 3–5 descriptive words.",
            guide_ar: "اختصر الرابط إلى 3–5 كلمات وصفية.",
          }));
        }
        const arHasLatinOnly = !!p.title_ar && !/[\u0600-\u06FF]/.test(p.title_ar);
        if (arHasLatinOnly) {
          findings.push(issue({
            page_id: p.id, category: "i18n", severity: "warn",
            title: "AR title contains no Arabic characters",
            title_ar: "العنوان العربي لا يحتوي على حروف عربية",
            guide_en: "Replace the placeholder with a real Arabic title so AR visitors and Arabic search results match.",
            guide_ar: "استبدل النص المؤقت بعنوان عربي حقيقي ليتوافق مع الزوار ونتائج البحث العربية.",
          }));
        }
      }

      if (pageList.length < 5) {
        findings.push(issue({
          page_id: null, category: "coverage", severity: "warn",
          title: `Only ${pageList.length} pages are SEO-managed`,
          title_ar: `عدد الصفحات المُدارة للسيو ${pageList.length} فقط`,
          guide_en: "Add an entry for every public route (services, industries, projects, partners, about, careers, news, contact) so none inherits generic metadata.",
          guide_ar: "أضف مدخلًا لكل صفحة عامة (الخدمات، القطاعات، المشاريع، الشركاء، من نحن، الوظائف، الأخبار، اتصل بنا) حتى لا ترث بيانات عامة.",
        }));
      }
    }

    // ----- AI keyword & meta suggestions (bilingual) -----
    let suggestionsCount = 0;
    const apiKey = process.env.LOVABLE_API_KEY;
    const aiModel = "google/gemini-3-flash-preview";

    if (apiKey && pageList.length) {
      try {
        const gateway = createLovableAiGatewayProvider(apiKey);
        const compactPages = pageList.slice(0, full ? 40 : 20).map((p) => ({
          id: p.id,
          path: p.path,
          title_en: p.title_en,
          title_ar: p.title_ar,
          description_en: p.description_en,
          description_ar: p.description_ar,
          keywords_en: p.keywords_en,
          keywords_ar: p.keywords_ar,
        }));
        const { output } = await generateText({
          model: gateway(aiModel),
          experimental_output: Output.object({
            schema: z.object({
              suggestions: z.array(z.object({
                page_id: z.string(),
                keywords_en: z.string().describe("8-12 comma-separated EN keywords"),
                keywords_ar: z.string().describe("8-12 comma-separated Arabic keywords"),
                title_en: z.string().describe("Improved EN title, 40-60 chars"),
                title_ar: z.string().describe("Improved Arabic title, 40-60 chars, native Arabic"),
                description_en: z.string().describe("Improved EN description, 110-155 chars"),
                description_ar: z.string().describe("Improved Arabic description, 110-155 chars, native Arabic"),
                rationale: z.string().describe("One short sentence in English on why"),
                rationale_ar: z.string().describe("نفس السبب بجملة عربية قصيرة"),
              })),
            }),
          }),
          prompt: `You are a bilingual (English/Arabic) SEO strategist for an enterprise security & ICT integrator (brand: ${g.site_name_en} / ${g.site_name_ar}). For each page below, produce improved metadata in BOTH languages. Arabic must be natural, native marketing Arabic — never machine-translated word-for-word. Respect the length targets. Return exactly one entry per page id.\n\nPages:\n${JSON.stringify(compactPages, null, 2)}`,
        });
        const suggestions = output?.suggestions ?? [];
        for (const s of suggestions) {
          findings.push({
            page_id: s.page_id,
            category: "ai-suggestion",
            severity: "info",
            title: `AI keyword & meta refresh for ${s.page_id}`,
            detail: s.rationale,
            suggestion: {
              keywords_en: s.keywords_en,
              keywords_ar: s.keywords_ar,
              title_en: s.title_en,
              title_ar: s.title_ar,
              description_en: s.description_en,
              description_ar: s.description_ar,
              rationale_ar: s.rationale_ar,
            },
          });
          suggestionsCount++;
        }
      } catch (e) {
        findings.push(issue({
          page_id: null, category: "ai", severity: "warn",
          title: "AI suggestions unavailable",
          title_ar: "اقتراحات الذكاء الاصطناعي غير متاحة",
          detail: (e as Error).message,
          guide_en: "Check that the AI gateway key is configured, then run the scan again.",
          guide_ar: "تأكد من إعداد مفتاح بوابة الذكاء الاصطناعي ثم أعد تشغيل الفحص.",
        }));
      }
    }

    if (findings.length) {
      await supabaseAdmin.from("seo_bot_findings").insert(
        findings.map((f) => ({
          run_id: run.id,
          page_id: f.page_id,
          category: f.category,
          severity: f.severity,
          title: f.title,
          detail: f.detail ?? null,
          suggestion: (f.suggestion ?? null) as never,
        }))
      );
    }

    const fails = findings.filter((f) => f.severity === "fail").length;
    const warns = findings.filter((f) => f.severity === "warn").length;
    const total = Math.max(pageList.length * 4 + 4, 1);
    const health = Math.max(0, Math.min(100, Math.round(100 - ((fails * 4 + warns * 2) / total) * 100)));

    const finished = Date.now();
    const nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin.from("seo_bot_runs").update({
      status: "completed",
      finished_at: new Date(finished).toISOString(),
      duration_ms: finished - started,
      findings_count: findings.length,
      suggestions_count: suggestionsCount,
      health_score: health,
      summary: {
        mode: full ? "full" : "standard",
        pages_scanned: pageList.length,
        fails, warns,
        info: findings.filter((f) => f.severity === "info").length,
      },
    }).eq("id", run.id);

    await supabaseAdmin.from("seo_bot_settings").update({
      last_run_at: new Date(finished).toISOString(),
      next_run_at: nextRun,
    }).eq("id", "main");

    return { run_id: run.id, findings_count: findings.length, health_score: health, mode: full ? "full" : "standard" };
  } catch (e) {
    await supabaseAdmin.from("seo_bot_runs").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error: (e as Error).message,
    }).eq("id", run.id);
    throw e;
  }
}
