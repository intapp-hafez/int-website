// Simple client-side CTA click tracking (localStorage-based).
// Enough for demo/admin visibility without a backend round-trip.

export type CtaKey = "request_proposal" | "book_consultation";

const KEY = "it_cta_counts_v1";

type Counts = Partial<Record<CtaKey, number>>;

function read(): Counts {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Counts) : {};
  } catch {
    return {};
  }
}

export function trackCta(key: CtaKey) {
  if (typeof window === "undefined") return;
  const counts = read();
  counts[key] = (counts[key] ?? 0) + 1;
  try {
    localStorage.setItem(KEY, JSON.stringify(counts));
    window.dispatchEvent(new CustomEvent("it:cta-updated"));
  } catch {}
}

export function getCtaCounts(): Required<Record<CtaKey, number>> {
  const c = read();
  return {
    request_proposal: c.request_proposal ?? 0,
    book_consultation: c.book_consultation ?? 0,
  };
}

export function resetCtaCounts() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("it:cta-updated"));
  } catch {}
}