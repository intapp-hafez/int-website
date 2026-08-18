import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export type SubmitLeadInput = {
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  product_id?: string | null;
  product_name?: string;
  product_slug?: string;
  items?: any;
  lang?: string;
  source?: string;
  /** Honeypot: must be empty. Bots typically auto-fill any input. */
  hp?: string;
  /** Client timestamp (ms) when the form was rendered. */
  ts?: number;
};

// Best-effort in-memory rate limiter. Per-worker-instance only; treat as a
// soft cap on top of the other anti-spam heuristics.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateHits = new Map<string, number[]>();
function rateLimit(key: string) {
  const now = Date.now();
  const hits = (rateHits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateHits.set(key, hits);
  return hits.length <= RATE_LIMIT_MAX;
}

function looksSpammy(text: string) {
  if (!text) return false;
  const links = (text.match(/https?:\/\//gi) ?? []).length;
  if (links >= 3) return true;
  if (/\b(viagra|casino|crypto airdrop|forex signals|seo services)\b/i.test(text)) return true;
  // Excessive repeated characters, e.g. "aaaaaaaaaa"
  if (/(.)\1{9,}/.test(text)) return true;
  return false;
}

export const submitCartLead = createServerFn({ method: "POST" })
  .inputValidator((input: SubmitLeadInput) => {
    const full_name = String(input?.full_name ?? "").trim();
    const email = String(input?.email ?? "").trim();
    const hp = String(input?.hp ?? "").trim();
    const ts = Number(input?.ts ?? 0);
    const message = String(input?.message ?? "").trim();
    const company = String(input?.company ?? "").trim();
    const phone = String(input?.phone ?? "").trim();

    // Length caps mirror the client schema and cheaply block payload-flooders.
    if (full_name.length < 2 || full_name.length > 100) throw new Error("Invalid name");
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid email is required");
    if (phone.length > 40) throw new Error("Invalid phone");
    if (company.length > 120) throw new Error("Invalid company");
    if (message.length > 1000) throw new Error("Message is too long");

    // Anti-spam: honeypot must be empty.
    if (hp) throw new Error("Spam detected");

    // Anti-spam: reject submissions faster than a human can complete a form.
    // Only enforced when the client supplies a render timestamp so older
    // callers (e.g. cart checkout) keep working.
    if (ts > 0) {
      const elapsed = Date.now() - ts;
      if (elapsed < 1500) throw new Error("Please take a moment before submitting");
      if (elapsed > 24 * 60 * 60 * 1000) throw new Error("Session expired, please retry");
    }

    // Anti-spam: content heuristics on free-text fields.
    if (looksSpammy(message) || looksSpammy(full_name) || looksSpammy(company)) {
      throw new Error("Submission blocked");
    }

    return {
      full_name,
      email,
      phone,
      company,
      message,
      product_id: input?.product_id ?? null,
      product_name: String(input?.product_name ?? "").trim(),
      product_slug: String(input?.product_slug ?? "").trim(),
      items: input?.items ?? [],
      lang: String(input?.lang ?? "en"),
      source: String(input?.source ?? "cart_checkout"),
    };
  })
  .handler(async ({ data }): Promise<{ id: string }> => {
    // Rate limit per IP (best-effort). Falls back to email when IP is missing.
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const ip =
        getRequestHeader("cf-connecting-ip") ||
        getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
        `email:${data.email.toLowerCase()}`;
      if (!rateLimit(ip)) throw new Error("Too many submissions, please try again later");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Too many")) throw e;
      // Header helpers unavailable: skip IP limit, keep email-scoped cap.
      if (!rateLimit(`email:${data.email.toLowerCase()}`)) {
        throw new Error("Too many submissions, please try again later");
      }
    }

    const { data: row, error } = await supabase
      .from("leads")
      .insert({
        source: data.source,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        message: data.message,
        product_id: data.product_id,
        product_name: data.product_name,
        product_slug: data.product_slug,
        items: data.items as any,
        lang: data.lang,
        status: "new",
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message || "Failed to submit quote");
    return { id: (row as any).id as string };
  });