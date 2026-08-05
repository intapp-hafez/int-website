import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Mail, Phone, Building2, Package, CheckCircle2, Clock, Inbox, ClipboardCheck, XCircle, Copy, Check } from "lucide-react";
import { trackQuote, type TrackedQuote } from "@/lib/track-quote.functions";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/track-quote")({
  head: () => ({ meta: [{ title: "Track your quote request" }, { name: "description", content: "Track the status of your quote request by 8-character reference number." }] }),
  validateSearch: (s: Record<string, unknown>): { id?: string; email?: string } => ({
    id: typeof s.id === "string" ? s.id : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  component: TrackQuotePage,
});

const STATUS_TONE: Record<string, string> = {
  new: "bg-muted text-foreground",
  qualified: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  won: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  lost: "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-300",
};

function TrackQuotePage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const fn = useServerFn(trackQuote);
  const search = Route.useSearch();
  const [id, setId] = useState(search.id ?? "");
  const [email, setEmail] = useState(search.email ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<TrackedQuote | null>(null);
  const [copied, setCopied] = useState(false);

  const runLookup = async (qid: string, qemail?: string) => {
    if (!qid.trim()) return;
    setLoading(true); setError(null); setQuote(null);
    try {
      const res = await fn({ data: { id: qid.trim(), email: qemail?.trim() } });
      setQuote(res);
    } catch (err: any) {
      setError(err?.message ?? (ar ? "لم يتم العثور على عرض السعر" : "Unable to find that quote"));
    } finally { setLoading(false); }
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); runLookup(id, email || undefined); };

  const copyRef = (refId: string) => {
    const short = refId.slice(0, 8).toUpperCase();
    navigator.clipboard.writeText(short);
    setCopied(true);
    toast.success(ar ? "تم نسخ رقم العرض" : "Quote reference copied");
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-lookup when arriving with ?id= (e.g. from the cart confirmation)
  useEffect(() => {
    if (search.id) runLookup(search.id, search.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: any[] = Array.isArray(quote?.items) ? (quote!.items as any[]) : [];

  // Timeline stages
  type Stage = "new" | "qualified" | "won" | "lost";
  const stageDef: { key: Stage; en: string; ar: string; desc_en: string; desc_ar: string; Icon: any }[] = [
    { key: "new",       en: "Submitted",  ar: "تم الإرسال",   desc_en: "We received your request.",            desc_ar: "تم استلام طلبك.",                           Icon: Inbox },
    { key: "qualified", en: "In review",  ar: "قيد المراجعة", desc_en: "Our team is preparing your quote.",   desc_ar: "فريقنا يعمل على تجهيز عرض السعر.",          Icon: ClipboardCheck },
    { key: "won",       en: "Approved",   ar: "تمت الموافقة", desc_en: "Quote approved — proceeding next.",   desc_ar: "تمت الموافقة على عرض السعر والمتابعة.",     Icon: CheckCircle2 },
  ];
  const order: Stage[] = ["new", "qualified", "won"];
  const current = (quote?.status as Stage) ?? "new";
  const isLost = current === "lost";
  const currentIdx = isLost ? -1 : order.indexOf(current);

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="font-display text-3xl font-bold mb-2">{ar ? "تتبع طلب عرض السعر" : "Track your quote"}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {ar ? "أدخل رقم العرض المكون من أول 8 خانات (مثال: E7F3B1A2). يمكنك إضافة البريد الإلكتروني للتأكد من الملكية." : "Enter your 8-character quote number (e.g. E7F3B1A2). Add your email for extra verification."}
      </p>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="grid sm:grid-cols-[1.2fr_1fr_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="qid">{ar ? "رقم العرض (8 خانات)" : "Quote number (8 chars)"}</Label>
              <Input
                id="qid"
                value={id}
                onChange={(e) => setId(e.target.value.toUpperCase())}
                placeholder={ar ? "مثال: E7F3B1A2" : "e.g. E7F3B1A2"}
                className="font-mono uppercase tracking-wider"
                maxLength={36}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qemail">{ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</Label>
              <Input id="qemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={ar ? "للتحقق الإضافي" : "For extra verification"} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 me-2" />{ar ? "تتبع" : "Track"}</>}
            </Button>
          </form>
          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        </CardContent>
      </Card>

      {quote && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-start justify-between space-y-0 gap-3 border-b pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xl md:text-2xl font-bold tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-lg border border-accent/20">
                  #{quote.id.slice(0, 8).toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => copyRef(quote.id)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-muted/40 hover:bg-muted transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? (ar ? "تم النسخ" : "Copied") : (ar ? "نسخ" : "Copy")}</span>
                </button>
              </div>
              <CardTitle className="font-display text-lg mt-2 truncate">{quote.full_name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {ar ? "تم الإرسال" : "Submitted"} {new Date(quote.created_at).toLocaleString()} · {ar ? "آخر تحديث" : "Updated"} {new Date(quote.updated_at).toLocaleString()}
              </p>
            </div>
            <Badge className={(STATUS_TONE[quote.status] ?? "bg-muted text-foreground") + " border-0 capitalize text-xs px-2.5 py-1"}>
              {quote.status === "won" ? <CheckCircle2 className="h-3.5 w-3.5 me-1 text-emerald-600" /> : <Clock className="h-3.5 w-3.5 me-1 text-amber-600" />}
              {quote.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status timeline */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-muted-foreground">{ar ? "حالة الطلب" : "Status timeline"}</div>
                <div className="text-[11px] text-muted-foreground">
                  {ar ? "آخر تحديث" : "Last update"} · {new Date(quote.updated_at).toLocaleString(ar ? "ar" : "en")}
                </div>
              </div>
              {isLost ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-900 p-4 flex items-start gap-3">
                  <XCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">{ar ? "تم إغلاق الطلب" : "Quote closed"}</div>
                    <div className="text-xs opacity-80 mt-0.5">
                      {ar ? "لم نتمكن من المتابعة في هذا الطلب. تواصل معنا للمساعدة." : "We weren't able to move forward with this request. Contact us if you need help."}
                    </div>
                    <div className="text-[11px] mt-1 opacity-70">{new Date(quote.updated_at).toLocaleString(ar ? "ar" : "en")}</div>
                  </div>
                </div>
              ) : (
                <ol className="relative">
                  {stageDef.map((s, i) => {
                    const done = i < currentIdx;
                    const active = i === currentIdx;
                    const Icon = s.Icon;
                    const last = i === stageDef.length - 1;
                    return (
                      <li key={s.key} className="relative ps-12 pb-5 last:pb-0">
                        {!last && (
                          <span
                            className={"absolute top-9 w-0.5 bottom-0 " + (done ? "bg-primary" : "bg-border")}
                            style={ar ? { right: "1rem" } : { left: "1rem" }}
                          />
                        )}
                        <span
                          className={
                            "absolute top-0 h-8 w-8 rounded-full inline-flex items-center justify-center ring-4 " +
                            (done
                              ? "bg-primary text-primary-foreground ring-primary/15"
                              : active
                                ? "bg-accent text-accent-foreground ring-accent/20 animate-pulse"
                                : "bg-muted text-muted-foreground ring-transparent")
                          }
                          style={ar ? { right: 0 } : { left: 0 }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                          <div className={"text-sm font-medium " + (active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground")}>
                            {ar ? s.ar : s.en}
                          </div>
                          {active && (
                            <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
                              {ar ? "الحالة الحالية" : "Current"}
                            </span>
                          )}
                          {done && (
                            <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                              {ar ? "مكتمل" : "Done"}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {ar ? s.desc_ar : s.desc_en}
                        </div>
                        {active && (
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {ar ? "آخر تحديث" : "Updated"} · {new Date(quote.updated_at).toLocaleString(ar ? "ar" : "en")}
                          </div>
                        )}
                        {i === 0 && (
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {ar ? "تم الإرسال" : "Submitted"} · {new Date(quote.created_at).toLocaleString(ar ? "ar" : "en")}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">{ar ? "معلومات العميل" : "Client info"}</div>
              <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{quote.email}</div>
                {quote.phone && <div className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span dir="ltr">{quote.phone}</span></div>}
                {quote.company && <div className="inline-flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{quote.company}</div>}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">{ar ? "العناصر" : "Items"}</div>
              {items.length === 0 && quote.product_name ? (
                <div className="text-sm inline-flex items-center gap-2"><Package className="h-3.5 w-3.5 text-muted-foreground" />{quote.product_name}</div>
              ) : items.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {items.map((it, i) => (
                    <li key={i} className="inline-flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{it.name ?? it.product_name ?? it.title ?? `Item ${i + 1}`}</span>
                      {it.quantity != null && <span className="text-muted-foreground">× {it.quantity}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">{ar ? "لا توجد عناصر" : "No line items"}</div>
              )}
            </div>

            {quote.message && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">{ar ? "رسالتك" : "Your message"}</div>
                <div className="text-sm bg-muted/50 rounded p-3 whitespace-pre-wrap">{quote.message}</div>
              </div>
            )}

            {quote.notes.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">{ar ? "تحديثات الفريق" : "Updates from our team"}</div>
                <ul className="space-y-2">
                  {quote.notes.map((n) => (
                    <li key={n.id} className="rounded-md border p-3 bg-card">
                      <div className="text-[11px] text-muted-foreground mb-1">{new Date(n.created_at).toLocaleString()}</div>
                      <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}