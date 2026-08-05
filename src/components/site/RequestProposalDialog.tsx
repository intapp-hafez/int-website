import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { submitCartLead } from "@/lib/leads.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Cooldown thresholds shared across mobile + desktop CTA entrypoints.
const FAIL_THRESHOLD = 3;
const FAIL_WINDOW_MS = 2 * 60_000;
const COOLDOWN_MS = 60_000;
const STORAGE_KEY = "rp_submit_failures_v1";

type FailState = { failures: number[]; cooldownUntil: number };

function loadFailState(): FailState {
  if (typeof window === "undefined") return { failures: [], cooldownUntil: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { failures: [], cooldownUntil: 0 };
    const parsed = JSON.parse(raw) as FailState;
    const now = Date.now();
    return {
      failures: (parsed.failures ?? []).filter((t) => now - t < FAIL_WINDOW_MS),
      cooldownUntil: parsed.cooldownUntil ?? 0,
    };
  } catch {
    return { failures: [], cooldownUntil: 0 };
  }
}

function saveFailState(state: FailState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

const schema = z.object({
  full_name: z.string().trim().min(2, "min").max(100, "max"),
  email: z.string().trim().email("email").max(255, "max"),
  phone: z.string().trim().max(40, "max").optional().or(z.literal("")),
  company: z.string().trim().max(120, "max").optional().or(z.literal("")),
  message: z.string().trim().max(1000, "max").optional().or(z.literal("")),
});

export function RequestProposalDialog({
  open,
  onOpenChange,
  lang,
  dir,
  source = "sticky_cta_request_proposal",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lang: "en" | "ar";
  dir: "ltr" | "rtl";
  source?: string;
}) {
  const submit = useServerFn(submitCartLead);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", company: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [hp, setHp] = useState("");
  const openedAtRef = useRef<number>(0);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const s = loadFailState();
    saveFailState(s);
    setCooldownUntil(s.cooldownUntil > Date.now() ? s.cooldownUntil : 0);
  }, [open]);

  useEffect(() => {
    if (!cooldownUntil || cooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= cooldownUntil) {
        setCooldownUntil(0);
        window.clearInterval(id);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const cooldownRemaining = Math.max(0, cooldownUntil - now);
  const inCooldown = cooldownRemaining > 0;

  useEffect(() => {
    if (open) openedAtRef.current = Date.now();
  }, [open]);

  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const reset = () => {
    setForm({ full_name: "", email: "", phone: "", company: "", message: "" });
    setErrors({});
    setDone(null);
    setServerError(null);
    setHp("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inCooldown) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) map[String(issue.path[0])] = issue.message;
      setErrors(map);
      return;
    }
    setErrors({});
    setServerError(null);
    setLoading(true);
    try {
      const res = await submit({
        data: {
          ...parsed.data,
          lang,
          source,
          hp,
          ts: openedAtRef.current || Date.now(),
        },
      });
      setDone({ id: res.id });
      saveFailState({ failures: [], cooldownUntil: 0 });
      setCooldownUntil(0);
      toast.success(L("Request submitted", "تم إرسال الطلب"));
    } catch (err: any) {
      const state = loadFailState();
      state.failures.push(Date.now());
      if (state.failures.length >= FAIL_THRESHOLD) {
        state.cooldownUntil = Date.now() + COOLDOWN_MS;
        state.failures = [];
        setCooldownUntil(state.cooldownUntil);
        setNow(Date.now());
      }
      saveFailState(state);
      const msg = err?.message || L("Failed to submit", "فشل الإرسال");
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 250);
      }}
    >
      <DialogContent dir={dir} className="max-w-md">
        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-3" />
            <DialogTitle className="text-xl">
              {L("Thanks — we'll be in touch", "شكرًا — سنتواصل معك قريبًا")}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {L("Your tracking ID", "رقم التتبع الخاص بك")}:{" "}
              <span className="font-mono font-semibold">{done.id.slice(0, 8).toUpperCase()}</span>
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button asChild variant="outline">
                <Link to="/track-quote" search={{ id: done.id.slice(0, 8).toUpperCase() } as any}>
                  {L("Track request", "تتبع الطلب")}
                </Link>
              </Button>
              <Button onClick={() => onOpenChange(false)}>{L("Close", "إغلاق")}</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>{L("Request a proposal", "طلب عرض سعر")}</DialogTitle>
              <DialogDescription>
                {L(
                  "Share a few details and our team will reply within 24 hours.",
                  "شاركنا بعض التفاصيل وسيرد فريقنا خلال 24 ساعة.",
                )}
              </DialogDescription>
            </DialogHeader>
            {inCooldown && (
              <div
                role="alert"
                aria-live="polite"
                className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex gap-2"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    {L("Too many failed attempts", "محاولات فاشلة كثيرة")}
                  </p>
                  <p className="text-xs opacity-90">
                    {L(
                      `Please wait ${Math.ceil(cooldownRemaining / 1000)}s before trying again. Double-check your email and message, or reach us directly at sales@example.com.`,
                      `الرجاء الانتظار ${Math.ceil(cooldownRemaining / 1000)} ثانية قبل المحاولة مجددًا. تأكد من صحة البريد والرسالة أو تواصل معنا مباشرة.`,
                    )}
                  </p>
                </div>
              </div>
            )}
            {serverError && !inCooldown && (
              <p
                role="alert"
                aria-live="assertive"
                className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {serverError}
              </p>
            )}
            <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="rp-website">Website</label>
              <input
                id="rp-website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
              />
            </div>
            <div className="grid gap-3 py-3">
              <Field
                id="rp-name"
                label={L("Full name", "الاسم الكامل")}
                required
                error={errors.full_name && L("Please enter your name (2+ characters)", "الرجاء إدخال الاسم (حرفان على الأقل)")}
              >
                <Input
                  id="rp-name"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </Field>
              <Field
                id="rp-email"
                label={L("Email", "البريد الإلكتروني")}
                required
                error={errors.email && L("Please enter a valid email", "الرجاء إدخال بريد صحيح")}
              >
                <Input
                  id="rp-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  maxLength={255}
                  autoComplete="email"
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="rp-phone" label={L("Phone", "الهاتف")}>
                  <Input
                    id="rp-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    maxLength={40}
                    autoComplete="tel"
                  />
                </Field>
                <Field id="rp-company" label={L("Company", "الشركة")}>
                  <Input
                    id="rp-company"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    maxLength={120}
                    autoComplete="organization"
                  />
                </Field>
              </div>
              <Field
                id="rp-message"
                label={L("How can we help?", "كيف يمكننا مساعدتك؟")}
                error={errors.message && L("Message is too long", "الرسالة طويلة جدًا")}
              >
                <Textarea
                  id="rp-message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  maxLength={1000}
                />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                {L("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={loading || inCooldown}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : inCooldown ? (
                  L(`Wait ${Math.ceil(cooldownRemaining / 1000)}s`, `انتظر ${Math.ceil(cooldownRemaining / 1000)} ث`)
                ) : (
                  L("Send request", "إرسال الطلب")
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string | false | null;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}