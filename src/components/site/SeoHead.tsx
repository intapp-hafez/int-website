import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Global = {
  site_name_en: string; site_name_ar: string;
  default_title_en: string; default_title_ar: string;
  default_description_en: string; default_description_ar: string;
  default_keywords_en: string; default_keywords_ar: string;
  og_image_url: string | null;
  gtm_id: string | null;
  ga4_id: string | null;
  fb_pixel_id: string | null;
  google_verification: string | null;
  bing_verification: string | null;
  semrush_verification: string | null;
  hreflang_enabled: boolean;
};

type Page = {
  id: string;
  path: string;
  title_en: string; title_ar: string;
  description_en: string; description_ar: string;
  keywords_en: string; keywords_ar: string;
  og_image_url: string | null;
  noindex: boolean;
};

function setMeta(attr: "name" | "property", key: string, content: string | null | undefined) {
  if (typeof document === "undefined") return;
  const sel = `meta[${attr}="${key}"][data-seo="1"]`;
  let el = document.head.querySelector<HTMLMetaElement>(sel);
  if (!content) { el?.remove(); return; }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute("data-seo", "1");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string, hreflang?: string) {
  if (typeof document === "undefined") return;
  const sel = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"][data-seo="1"]`
    : `link[rel="${rel}"][data-seo="1"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute("data-seo", "1");
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function clearHreflang() {
  if (typeof document === "undefined") return;
  document.head
    .querySelectorAll('link[rel="alternate"][data-seo="1"]')
    .forEach((n) => n.remove());
}

function injectScriptOnce(id: string, html: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.innerHTML = html;
  document.head.appendChild(s);
}

function injectGtmNoscriptOnce(gtmId: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById("gtm-noscript")) return;
  const ns = document.createElement("noscript");
  ns.id = "gtm-noscript";
  ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.prepend(ns);
}

export function SeoHead() {
  const { lang } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [global, setGlobal] = useState<Global | null>(null);
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [g, p] = await Promise.all([
        supabase.from("seo_global").select("*").eq("id", "main").maybeSingle(),
        supabase.from("seo_pages").select("*"),
      ]);
      if (!mounted) return;
      if (g.data) setGlobal(g.data as Global);
      if (p.data) setPages(p.data as Page[]);
    })();
    return () => { mounted = false; };
  }, []);

  // Inject analytics + verification once when global loads
  useEffect(() => {
    if (!global) return;
    if (global.gtm_id) {
      injectScriptOnce(
        "gtm-script",
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${global.gtm_id}');`
      );
      injectGtmNoscriptOnce(global.gtm_id);
    }
    if (global.ga4_id) {
      if (!document.getElementById("ga4-loader")) {
        const s = document.createElement("script");
        s.id = "ga4-loader";
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${global.ga4_id}`;
        document.head.appendChild(s);
      }
      injectScriptOnce(
        "ga4-init",
        `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${global.ga4_id}');`
      );
    }
    if (global.fb_pixel_id) {
      injectScriptOnce(
        "fb-pixel",
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${global.fb_pixel_id}');fbq('track','PageView');`
      );
    }
    setMeta("name", "google-site-verification", global.google_verification);
    setMeta("name", "msvalidate.01", global.bing_verification);
    setMeta("name", "semrush-verification", global.semrush_verification);
  }, [global]);

  // Per-route head update
  useEffect(() => {
    if (!global) return;
    const isAr = lang === "ar";
    const page = pages.find((p) => p.path === pathname);

    const title = page
      ? (isAr ? page.title_ar : page.title_en) || page.title_en || global.default_title_en
      : (isAr ? global.default_title_ar : global.default_title_en);
    const description = page
      ? (isAr ? page.description_ar : page.description_en) || page.description_en || global.default_description_en
      : (isAr ? global.default_description_ar : global.default_description_en);
    const keywords = page
      ? (isAr ? page.keywords_ar : page.keywords_en) || page.keywords_en
      : (isAr ? global.default_keywords_ar : global.default_keywords_en);
    const ogImage = page?.og_image_url || global.og_image_url || null;
    const siteName = isAr ? global.site_name_ar : global.site_name_en;

    if (title) document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "keywords", keywords);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:site_name", siteName);
    setMeta("property", "og:url", pathname);
    setMeta("property", "og:image", ogImage);
    setMeta("name", "twitter:card", ogImage ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    if (ogImage) setMeta("name", "twitter:image", ogImage);

    if (page?.noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      setMeta("name", "robots", "index, follow");
    }

    // canonical (without lang query)
    const canonicalPath = pathname;
    setLink("canonical", canonicalPath);

    // hreflang
    clearHreflang();
    if (global.hreflang_enabled) {
      const base = pathname;
      const sep = base.includes("?") ? "&" : "?";
      setLink("alternate", `${base}${sep}lang=en`, "en");
      setLink("alternate", `${base}${sep}lang=ar`, "ar");
      setLink("alternate", base, "x-default");
    }
  }, [global, pages, pathname, lang]);

  return null;
}