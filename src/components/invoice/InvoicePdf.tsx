import { forwardRef } from "react";
import type { ReactNode, CSSProperties } from "react";
import { siteSettings } from "@/config/site-settings";
import logoUrl from "@/assets/logo.png";

/**
 * Arabic-capable webfonts for the invoice.
 * Cairo (Arabic + Latin) covers shaping and diacritics; Noto Naskh Arabic is a
 * shaping-complete fallback for viewers/rasterizers that reject Cairo, and
 * Inter covers the Latin-only layout. `display=block` prevents html2canvas
 * from rasterizing a fallback-font frame while the real face is still loading.
 */
const INVOICE_FONT_HREF =
  "https://fonts.googleapis.com/css2" +
  "?family=Cairo:wght@400;600;700;800" +
  "&family=Noto+Naskh+Arabic:wght@400;600;700" +
  "&family=Inter:wght@400;600;700;800" +
  "&display=block";

/** Arabic sample with diacritics + ligature (لا) to prove shaping is available. */
const ARABIC_SHAPING_SAMPLE = "شكرًا لتعاملكم معنا لا";

export function ensureInvoiceFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById("invoice-pdf-fonts")) return;
  for (const [id, href, cors] of [
    ["invoice-pdf-fonts-pre1", "https://fonts.googleapis.com", false],
    ["invoice-pdf-fonts-pre2", "https://fonts.gstatic.com", true],
  ] as const) {
    if (document.getElementById(id)) continue;
    const pre = document.createElement("link");
    pre.id = id;
    pre.rel = "preconnect";
    pre.href = href;
    if (cors) pre.crossOrigin = "anonymous";
    document.head.appendChild(pre);
  }
  const link = document.createElement("link");
  link.id = "invoice-pdf-fonts";
  link.rel = "stylesheet";
  link.href = INVOICE_FONT_HREF;
  document.head.appendChild(link);
}

/**
 * Resolves only once every weight actually needed by the template is loaded,
 * including the Arabic subsets (which Google ships as separate unicode-range
 * files and only fetches when Arabic text is requested).
 */
export async function waitForInvoiceFonts(ar: boolean) {
  if (typeof document === "undefined") return;
  ensureInvoiceFonts();
  const fonts = (document as any).fonts;
  if (!fonts?.load) return;
  const weights = [400, 600, 700, 800];
  const families = ar ? ["Cairo", "Noto Naskh Arabic", "Inter"] : ["Inter", "Cairo"];
  try {
    await Promise.all(
      families.flatMap((family) =>
        weights.map((w) =>
          fonts
            .load(`${w} 14px "${family}"`, ar ? ARABIC_SHAPING_SAMPLE : "0123456789")
            .catch(() => undefined),
        ),
      ),
    );
    if (fonts.ready) await fonts.ready;
    // Poll briefly until the Arabic face reports ready — some engines resolve
    // `ready` before the unicode-range subset is usable.
    if (ar && fonts.check) {
      for (let i = 0; i < 20; i++) {
        if (fonts.check('700 14px "Cairo"', ARABIC_SHAPING_SAMPLE)) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  } catch {
    /* noop */
  }
}

export type InvoiceWatermarkType = "none" | "draft" | "paid" | "unpaid" | "void" | "copy";

export type InvoiceItem = { description: string; qty: number; unit: number };
export type InvoiceQuotation = {
  id: string;
  client: string;
  service: string;
  date: string;
  currency: string;
  status: string;
  amount: number;
};

export type InvoiceI18n = {
  wmStamp: Record<"draft" | "paid" | "unpaid" | "void" | "copy", string>;
  terms: {
    title: string; net: string; installments: string;
    bank: string; bankName: string; accountName: string;
    iban: string; swift: string; ref: string;
  };
};

export type InvoiceTemplateProps = {
  ar: boolean;
  q: InvoiceQuotation;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  fmt: (n: number) => string;
  watermark: InvoiceWatermarkType;
  i18n: InvoiceI18n;
};

/** A4 at 96dpi. */
const PAGE_W = 794;
const PAGE_H = 1123;
const FIRST_PAGE_ROWS = 9;
const NEXT_PAGE_ROWS = 18;
/** Rows worth of space the totals + terms blocks need on the final page. */
const SUMMARY_ROW_COST = 7;

function paginateItems(items: InvoiceItem[]): InvoiceItem[][] {
  if (items.length === 0) return [[]];
  const pages: InvoiceItem[][] = [];
  let rest = items.slice();
  while (rest.length > 0) {
    const cap = pages.length === 0 ? FIRST_PAGE_ROWS : NEXT_PAGE_ROWS;
    pages.push(rest.slice(0, cap));
    rest = rest.slice(cap);
  }
  const lastCap = pages.length === 1 ? FIRST_PAGE_ROWS : NEXT_PAGE_ROWS;
  if (pages[pages.length - 1].length > lastCap - SUMMARY_ROW_COST) pages.push([]);
  return pages;
}

/* ------------------------------------------------------------------ */
/* Bidirectional text helpers                                          */
/* ------------------------------------------------------------------ */

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseInvoiceDate(raw: string): Date | null {
  if (!raw) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim());
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, days: number) {
  const n = new Date(d.getTime());
  n.setDate(n.getDate() + days);
  return n;
}

/**
 * Renders a date with a localized (Arabic or English) month name while the
 * numeric day / year stay in isolated LTR runs so they never reorder.
 * Falls back to the raw string (still LTR-isolated) when unparseable.
 */
function DateText({ value, ar, bold }: { value: string; ar: boolean; bold?: boolean }) {
  const d = parseInvoiceDate(value);
  if (!d) return <Num bold={bold}>{value}</Num>;
  const month = (ar ? AR_MONTHS : EN_MONTHS)[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  const year = String(d.getFullYear());
  return (
    <span style={{ unicodeBidi: "isolate", fontWeight: bold ? 700 : undefined, whiteSpace: "nowrap" }}>
      <Num bold={bold}>{day}</Num>{" "}
      <span>{month}</span>{" "}
      <Num bold={bold}>{year}</Num>
    </span>
  );
}

const NUM_RUN = /([+\-]?[0-9][0-9,.\-/:]*%?|[A-Z]{2}\d[\w\s-]{4,}|[\w.+-]+@[\w.-]+)/g;

/**
 * Mixed Arabic/English content (addresses, payment references, client names).
 * The whole string uses `plaintext` so word order follows the first strong
 * character, while every numeric / latin-code run is isolated LTR.
 */
const WRAP_STYLE: CSSProperties = {
  unicodeBidi: "plaintext",
  overflowWrap: "break-word",
  wordBreak: "normal",
  lineBreak: "auto",
  hyphens: "none",
};

function Mixed({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  if (typeof children !== "string") {
    return <span style={{ ...WRAP_STYLE, ...style }}>{children}</span>;
  }
  const parts = children.split(NUM_RUN).filter((p) => p !== "" && p !== undefined);
  return (
    <span style={{ ...WRAP_STYLE, ...style }}>
      {parts.map((p, i) =>
        /^[+\-]?[0-9]/.test(p) || p.includes("@") || /^[A-Z]{2}\d/.test(p)
          ? <Num key={i} wrap>{p}</Num>
          : <span key={i}>{p}</span>,
      )}
    </span>
  );
}

export const InvoicePdfTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  function InvoicePdfTemplate({ ar, q, items, subtotal, tax, total, fmt, watermark, i18n }, ref) {
    const fontFamily = ar
      ? "'Cairo', 'Noto Naskh Arabic', 'Segoe UI', Tahoma, sans-serif"
      : "'Inter', 'Cairo', system-ui, -apple-system, Segoe UI, sans-serif";
    const dir = ar ? "rtl" : "ltr";
    const text = ar
      ? {
          invoice: "فاتورة", number: "رقم", issued: "تاريخ الإصدار",
          billTo: "فاتورة إلى", service: "الخدمة", validUntil: "صالحة حتى",
          desc: "البيان", qty: "الكمية", unit: "سعر الوحدة", amount: "الإجمالي",
          subtotal: "المجموع الفرعي", vat: "ضريبة القيمة المضافة (5%)", grand: "الإجمالي المستحق",
          thanks: "شكرًا لتعاملكم معنا.",
          notes: "هذه الفاتورة صالحة لمدة 30 يومًا من تاريخ الإصدار. تخضع جميع الأسعار لشروط وأحكام Integrated Technics.",
          contact: "للاستفسار",
        }
      : {
          invoice: "Invoice", number: "No.", issued: "Issued",
          billTo: "Bill to", service: "Service", validUntil: "Valid until",
          desc: "Description", qty: "Qty", unit: "Unit price", amount: "Amount",
          subtotal: "Subtotal", vat: "VAT 5%", grand: "Grand total",
          thanks: "Thank you for your business.",
          notes: "This invoice is valid for 30 days from the issue date. All prices are subject to Integrated Technics terms.",
          contact: "Contact",
        };
    const issuedDate = parseInvoiceDate(q.date);
    const dueDate = issuedDate ? addDays(issuedDate, 30) : null;
    const dueRaw = dueDate
      ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`
      : "";
    const brand = "Integrated Technics";
    const currency = ar ? "دولار أمريكي" : q.currency;
    const watermarkColors: Record<string, string> = {
      draft: "#9CA3AF", paid: "#16A34A", unpaid: "#DC2626", void: "#DC2626", copy: "#6B7280",
    };
    const wmText = watermark !== "none" ? i18n.wmStamp[watermark] : "";
    const wmColor = watermark !== "none" ? watermarkColors[watermark] : "transparent";
    const terms = i18n.terms;
    const addr = typeof (siteSettings as any).address === "string"
      ? (siteSettings as any).address
      : ((siteSettings as any).address?.[ar ? "ar" : "en"] ?? "");

    const pages = paginateItems(items);
    const pageCount = pages.length;
    const startIndexes = pages.reduce<number[]>((acc, _p, i) => {
      acc.push(i === 0 ? 0 : acc[i - 1] + pages[i - 1].length);
      return acc;
    }, []);
    const pageLabel = (n: number) => (ar ? `صفحة ${n} من ${pageCount}` : `Page ${n} of ${pageCount}`);
    const contLabel = ar ? "تابع — بنود الفاتورة" : "Continued — line items";

    return (
      <div
        ref={ref}
        dir={dir}
        style={{
          fontFamily, color: "#1a1a1a", background: "#ffffff",
          width: PAGE_W, boxSizing: "border-box", textAlign: "start",
          fontSize: 13, lineHeight: ar ? 1.75 : 1.55,
        }}
      >
        {pages.map((pageItems, pageIdx) => {
          const isFirst = pageIdx === 0;
          const isLast = pageIdx === pageCount - 1;
          return (
            <div
              key={pageIdx}
              data-invoice-page=""
              dir={dir}
              style={{
                width: PAGE_W, height: PAGE_H, background: "#ffffff",
                position: "relative", overflow: "hidden", boxSizing: "border-box",
              }}
            >
              {watermark !== "none" && (
                <div aria-hidden style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  pointerEvents: "none", zIndex: 0,
                }}>
                  <div style={{
                    fontFamily, fontSize: 140, fontWeight: 800, color: wmColor,
                    opacity: 0.12, transform: "rotate(-30deg)", whiteSpace: "nowrap",
                    border: `8px solid ${wmColor}`, padding: "12px 40px",
                    borderRadius: 12, letterSpacing: 4,
                  }}>{wmText}</div>
                </div>
              )}

              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Brand banner — repeated on every page */}
                <div style={{
                  background: "linear-gradient(120deg, #14213D 0%, #1E3A5F 55%, #E8722C 160%)",
                  color: "#ffffff", padding: isFirst ? "26px 44px 22px" : "16px 44px 14px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img src={logoUrl} alt={brand} crossOrigin="anonymous" style={{
                      height: isFirst ? 54 : 38, width: "auto", background: "#ffffff",
                      borderRadius: 10, padding: 6, boxSizing: "border-box",
                    }} />
                    <div style={{ textAlign: "start" }}>
                      <div style={{ fontSize: isFirst ? 19 : 15, fontWeight: 700 }}>{brand}</div>
                      {isFirst && (
                        <div style={{ fontSize: 11, opacity: 0.82, marginTop: 2 }}><Mixed>{addr}</Mixed></div>
                      )}
                      <div style={{ fontSize: 11, opacity: 0.82 }} dir="ltr">
                        <Num>{siteSettings.email}</Num> · <Num>{siteSettings.phone}</Num>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "end" }}>
                    <div style={{
                      fontSize: isFirst ? 30 : 20, fontWeight: 700,
                      letterSpacing: ar ? 0 : 2, textTransform: "uppercase",
                    }}>{text.invoice}</div>
                    <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: isFirst ? 6 : 3 }}>
                      {text.number}: <Num bold>{q.id}</Num>
                    </div>
                    <div style={{ fontSize: 11.5, opacity: 0.85 }}>
                      {text.issued}: <DateText value={q.date} ar={ar} bold />
                    </div>
                  </div>
                </div>
                <div style={{ height: 5, background: "#E8722C" }} />

                <div style={{
                  flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
                  padding: isFirst ? "24px 44px 20px" : "20px 44px",
                }}>
                  {isFirst ? (
                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: 16,
                      background: "#FAF7F3", border: "1px solid #EFEAE4", borderRadius: 10,
                    }}>
                      <MetaBlock label={text.billTo} value={q.client} />
                      <MetaBlock label={text.service} value={q.service} />
                      <MetaBlock label={text.validUntil}>
                        {dueRaw ? (
                          <DateText value={dueRaw} ar={ar} />
                        ) : (
                          <Mixed>{ar ? "30 يومًا من تاريخ الإصدار" : "30 days from issue"}</Mixed>
                        )}
                      </MetaBlock>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: 11, textTransform: "uppercase",
                      letterSpacing: ar ? 0 : 1.2, color: "#6B6B6B",
                    }}>{contLabel}</div>
                  )}

                  {pageItems.length > 0 && (
                    <table style={{
                      width: "100%", borderCollapse: "separate", borderSpacing: 0,
                      marginTop: 22, fontSize: 12.5, tableLayout: "fixed",
                      border: "1px solid #EFEAE4", borderRadius: 10, overflow: "hidden",
                    }}>
                      <colgroup>
                        <col />
                        <col style={{ width: 70 }} />
                        <col style={{ width: 118 }} />
                        <col style={{ width: 132 }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: "#F6F1EC" }}>
                          <Th>{text.desc}</Th>
                          <Th align="end">{text.qty}</Th>
                          <Th align="end">{text.unit}</Th>
                          <Th align="end">{text.amount}</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((it, i) => {
                          const n = startIndexes[pageIdx] + i;
                          return (
                            <tr key={n} style={{ background: n % 2 === 1 ? "#FCFAF8" : "#ffffff" }}>
                              <Td>
                                <span style={{ color: "#A0A0A0", fontSize: 11, marginInlineEnd: 8 }}>
                                  <Num>{String(n + 1).padStart(2, "0")}</Num>
                                </span>
                                {it.description}
                              </Td>
                              <Td align="end" numeric>{fmt(it.qty)}</Td>
                              <Td align="end" numeric color="#4a4a4a">${fmt(it.unit)}</Td>
                              <Td align="end" numeric bold>${fmt(it.qty * it.unit)}</Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {isLast && (
                    <>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                        <div style={{
                          minWidth: 330, border: "1px solid #EFEAE4", borderRadius: 10,
                          overflow: "hidden", background: "#ffffff",
                        }}>
                          <SummaryRow label={text.subtotal} value={`$${fmt(subtotal)}`} />
                          <SummaryRow label={text.vat} value={`$${fmt(tax)}`} />
                          <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "baseline",
                            gap: 24, padding: "12px 16px", background: "#14213D", color: "#ffffff",
                          }}>
                            <span style={{ fontWeight: 700, fontSize: 12.5 }}>{text.grand} ({currency})</span>
                            <span style={{ fontWeight: 700, fontSize: 17, color: "#F5A05E" }}>
                              <Num>${fmt(total)}</Num>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        marginTop: 22, padding: 16, border: "1px solid #EFEAE4",
                        borderRadius: 10, fontSize: 12,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#E8722C" }}>{terms.title}</div>
                        <div style={{ marginBottom: 4 }}>• <Mixed>{terms.net}</Mixed></div>
                        <div style={{ marginBottom: 10 }}>• <Mixed>{terms.installments}</Mixed></div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}><Mixed>{terms.bank}</Mixed></div>
                        <div style={{ color: "#4a4a4a" }}><Mixed>{terms.bankName}</Mixed></div>
                        <div style={{ color: "#4a4a4a" }}><Mixed>{terms.accountName}</Mixed></div>
                        <div style={{ color: "#4a4a4a" }}><Mixed>{terms.iban}</Mixed></div>
                        <div style={{ color: "#4a4a4a" }}><Mixed>{terms.swift}</Mixed></div>
                        <div style={{ marginTop: 6, color: "#6B6B6B" }}><Mixed>{terms.ref}</Mixed></div>
                      </div>

                      <div style={{
                        marginTop: 18, padding: 16, background: "#FAF7F3",
                        borderRadius: 10, color: "#4a4a4a", fontSize: 12,
                      }}>
                        <div style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{text.thanks}</div>
                        <div><Mixed>{text.notes}</Mixed></div>
                        <div style={{ marginTop: 6 }}>
                          {text.contact}: <Num>{siteSettings.email}</Num> · <Num>{siteSettings.phone}</Num>
                        </div>
                      </div>

                      <BilingualFooter q={q} fontFamily={fontFamily} />
                    </>
                  )}
                </div>

                {/* Brand footer bar — repeated on every page */}
                <div style={{
                  background: "#14213D", color: "#ffffff", padding: "12px 44px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: 11, gap: 16,
                }}>
                  <span style={{ opacity: 0.85 }}>{brand}</span>
                  <span style={{ opacity: 0.7, unicodeBidi: "plaintext" }}>{pageLabel(pageIdx + 1)}</span>
                  <span style={{ color: "#E8722C", fontWeight: 700 }}><Num>{q.id}</Num></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

function MetaBlock({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div style={{ textAlign: "start" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#6B6B6B" }}>{label}</div>
      <div style={{
        fontWeight: 600, marginTop: 4, ...WRAP_STYLE,
        display: "-webkit-box", WebkitBoxOrient: "vertical" as any,
        WebkitLineClamp: 3, overflow: "hidden",
      }}>
        {children ?? <Mixed>{value ?? ""}</Mixed>}
      </div>
    </div>
  );
}

/**
 * Bilingual legal footer: Arabic terms and their English translation shown
 * side by side, each column with its own direction so word order is preserved,
 * while tax IDs / registration numbers / references stay isolated LTR.
 */
function BilingualFooter({ q, fontFamily }: { q: InvoiceQuotation; fontFamily: string }) {
  const s = siteSettings as any;
  const taxId: string = s.taxId ?? s.vatNumber ?? s.trn ?? "TRN 100-2345-6789-0003";
  const crNumber: string = s.crNumber ?? s.registrationNumber ?? "CR 1010-556-7788";

  const arCol = {
    title: "الشروط والأحكام",
    lines: [
      "تُستحق قيمة هذه الفاتورة خلال 30 يومًا من تاريخ الإصدار.",
      "جميع المبالغ بالدولار الأمريكي وشاملة ضريبة القيمة المضافة بنسبة 5%.",
      "يُرجى ذكر رقم الفاتورة في إشعار التحويل البنكي.",
    ],
    taxLabel: "الرقم الضريبي",
    crLabel: "السجل التجاري",
    refLabel: "مرجع الفاتورة",
  };
  const enCol = {
    title: "Terms & Conditions",
    lines: [
      "This invoice is payable within 30 days of the issue date.",
      "All amounts are in USD and include 5% VAT.",
      "Please quote the invoice number on your bank transfer advice.",
    ],
    taxLabel: "Tax ID",
    crLabel: "Commercial reg.",
    refLabel: "Invoice reference",
  };

  const Column = ({ col, rtl }: { col: typeof arCol; rtl: boolean }) => (
    <div
      dir={rtl ? "rtl" : "ltr"}
      style={{
        flex: 1, minWidth: 0, textAlign: "start",
        fontFamily: rtl ? "'Cairo', 'Noto Naskh Arabic', Tahoma, sans-serif" : "'Inter', system-ui, sans-serif",
        lineHeight: rtl ? 1.8 : 1.55,
        ...WRAP_STYLE,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 12, color: "#14213D", marginBottom: 6 }}>{col.title}</div>
      {col.lines.map((line, i) => (
        <div key={i} style={{ color: "#4a4a4a", marginBottom: 3, ...WRAP_STYLE }}>
          <Mixed>{line}</Mixed>
        </div>
      ))}
      <div style={{ marginTop: 8, color: "#6B6B6B", ...WRAP_STYLE }}>
        {col.taxLabel}: <Num wrap>{taxId}</Num>
      </div>
      <div style={{ color: "#6B6B6B", ...WRAP_STYLE }}>
        {col.crLabel}: <Num wrap>{crNumber}</Num>
      </div>
      <div style={{ color: "#6B6B6B", ...WRAP_STYLE }}>
        {col.refLabel}: <Num>{q.id}</Num>
      </div>
    </div>
  );

  return (
    <div
      dir="ltr"
      style={{
        marginTop: 18, padding: 16, border: "1px solid #EFEAE4", borderRadius: 10,
        display: "flex", gap: 24, fontSize: 11, fontFamily, background: "#ffffff",
      }}
    >
      <Column col={arCol} rtl />
      <div style={{ width: 1, background: "#EFEAE4", flexShrink: 0 }} />
      <Column col={enCol} rtl={false} />
    </div>
  );
}

/**
 * Isolates numbers / latin strings so they stay LTR inside an RTL invoice.
 * Uses <bdi> + explicit direction/unicode-bidi so behaviour is identical in
 * every rasterizer (html2canvas) and browser engine, not just Chromium.
 */
function Num({ children, bold, wrap }: { children: ReactNode; bold?: boolean; wrap?: boolean }) {
  return (
    <bdi
      dir="ltr"
      style={{
        direction: "ltr",
        unicodeBidi: "isolate",
        display: "inline-block",
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum" 1',
        fontWeight: bold ? 700 : undefined,
        // Long codes (IBAN, tax IDs) may wrap at their space separators so they
        // never overflow a column; digit groups themselves never split.
        whiteSpace: wrap ? "pre-wrap" : "nowrap",
        maxWidth: "100%",
      }}
    >
      {children}
    </bdi>
  );
}

function Th({ children, align = "start" }: { children: ReactNode; align?: "start" | "end" }) {
  return (
    <th style={{
      textAlign: align as any, padding: "11px 14px", fontWeight: 700, fontSize: 10.5,
      textTransform: "uppercase", letterSpacing: 0.8, color: "#5A5A5A",
      borderBottom: "1px solid #EFEAE4", whiteSpace: "nowrap",
    }}>{children}</th>
  );
}

function Td({ children, align = "start", bold, color, numeric, style }: {
  children: ReactNode; align?: "start" | "end"; bold?: boolean;
  color?: string; numeric?: boolean; style?: CSSProperties;
}) {
  return (
    <td style={{
      textAlign: align as any, padding: "11px 14px", fontWeight: bold ? 700 : 400, color,
      borderTop: "1px solid #F3EEE9", verticalAlign: "top",
      fontVariantNumeric: numeric ? "tabular-nums" : undefined,
      ...style,
    }}>
      {numeric ? <Num>{children}</Num> : children}
    </td>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      gap: 24, padding: "9px 16px", fontSize: 12.5, borderBottom: "1px solid #F3EEE9",
    }}>
      <span style={{ color: "#6B6B6B" }}>{label}</span>
      <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}><Num>{value}</Num></span>
    </div>
  );
}

export async function renderInvoicePdf(node: HTMLElement, fileName: string) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  // Ensure the logo / banner artwork is decoded before rasterizing.
  await Promise.all(
    Array.from(node.querySelectorAll("img")).map((img) =>
      img.complete ? Promise.resolve() : new Promise<void>((res) => {
        img.addEventListener("load", () => res(), { once: true });
        img.addEventListener("error", () => res(), { once: true });
      }),
    ),
  );
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Preferred path: the template lays itself out as A4-sized pages, each with
  // its own banner header and footer bar.
  const pageNodes = Array.from(node.querySelectorAll<HTMLElement>("[data-invoice-page]"));
  if (pageNodes.length > 0) {
    for (let i = 0; i < pageNodes.length; i++) {
      const c = await html2canvas(pageNodes[i], {
        scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false,
        windowWidth: pageNodes[i].scrollWidth,
      });
      if (i > 0) pdf.addPage();
      pdf.addImage(c.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH);
    }
    pdf.save(fileName);
    return;
  }

  // Fallback: rasterize the whole node and slice it into pages.
  const canvas = await html2canvas(node, {
    scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false,
    windowWidth: node.scrollWidth,
  });
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const imgData = canvas.toDataURL("image/png");
  if (imgH <= pageH) {
    pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
  } else {
    const pageHeightPx = (pageH * canvas.width) / imgW;
    let renderedHeight = 0;
    let pageIndex = 0;
    while (renderedHeight < canvas.height) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceHeight;
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, renderedHeight, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, imgW, (sliceHeight * imgW) / canvas.width);
      renderedHeight += sliceHeight;
      pageIndex += 1;
    }
  }
  pdf.save(fileName);
}