import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Eye, EyeOff, ShieldCheck, Check, X } from "lucide-react";
import { useAuthT } from "@/lib/auth-i18n";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — Integrated Technics" },
      { name: "description", content: "Create your client account to submit requests, place orders and track delivery." },
    ],
  }),
  component: SignUpPage,
});

const PWD_RULES = [
  { key: "len", test: (p: string) => p.length >= 8 },
  { key: "up", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lo", test: (p: string) => /[a-z]/.test(p) },
  { key: "num", test: (p: string) => /\d/.test(p) },
  { key: "sym", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

function SignUpPage() {
  const navigate = useNavigate();
  const { t, dir } = useAuthT();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", company: "", manager: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const phoneDigits = form.phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.length === 11;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const checks = useMemo(() => PWD_RULES.map((r) => ({ ...r, ok: r.test(form.password) })), [form.password]);
  const pwdOk = checks.every((r) => r.ok);
  const confirmOk = form.confirm.length > 0 && form.confirm === form.password;
  const formValid = form.fullName.trim().length >= 2 && phoneOk && emailOk && form.company.trim() && form.manager.trim() && pwdOk && confirmOk;

  const labels: Record<string, string> = {
    len: t("signup.pwd.len"), up: t("signup.pwd.up"), lo: t("signup.pwd.lo"),
    num: t("signup.pwd.num"), sym: t("signup.pwd.sym"),
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!formValid) { setError(t("signup.fix")); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/signin`,
          data: { full_name: form.fullName, phone: phoneDigits, company: form.company, manager: form.manager },
        },
      });
      if (error) throw error;
      setSuccess(t("signup.success"));
      setTimeout(() => navigate({ to: "/signin" }), 1800);
    } catch (err: any) {
      setError(err?.message || "Sign up failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-lg" dir={dir}>
      <div className="bg-card border rounded-2xl shadow-elegant p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">{t("signup.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("signup.sub")}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t("signup.fullName")} htmlFor="fullName">
              <Input id="fullName" autoComplete="name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label={t("signup.phone")} htmlFor="phone" hint={form.phone ? `${phoneDigits.length}/11${phoneOk ? " ✓" : ""}` : ""} hintOk={phoneOk}>
              <Input id="phone" inputMode="tel" autoComplete="tel" required value={form.phone} dir="ltr"
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 16) })}
                aria-invalid={!!form.phone && !phoneOk}
                className={form.phone ? (phoneOk ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""}
                placeholder={t("signup.phonePlaceholder")} />
            </Field>
          </div>

          <Field label={t("signup.email")} htmlFor="email" hintOk={emailOk}>
            <Input id="email" type="email" autoComplete="email" required value={form.email} dir="ltr"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              aria-invalid={!!form.email && !emailOk}
              className={form.email ? (emailOk ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t("signup.company")} htmlFor="company">
              <Input id="company" autoComplete="organization" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </Field>
            <Field label={t("signup.manager")} htmlFor="manager">
              <Input id="manager" required value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} placeholder={t("signup.managerPlaceholder")} />
            </Field>
          </div>

          <Field label={t("signup.password")} htmlFor="password">
            <div className="relative">
              <Input id="password" type={showPwd ? "text" : "password"} autoComplete="new-password" required value={form.password} dir="ltr"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                aria-invalid={!!form.password && !pwdOk}
                className={`pe-10 ${form.password ? (pwdOk ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""}`} />
              <button type="button" tabIndex={-1} onClick={() => setShowPwd((s) => !s)}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-3 text-xs">
              {checks.map((r) => (
                <li key={r.key} className={`flex items-center gap-1.5 ${r.ok ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {r.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-60" />} {labels[r.key]}
                </li>
              ))}
            </ul>
          </Field>

          <Field label={t("signup.confirm")} htmlFor="confirm" hint={form.confirm ? (confirmOk ? t("signup.matches") : t("signup.noMatch")) : ""} hintOk={confirmOk}>
            <div className="relative">
              <Input id="confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" required value={form.confirm} dir="ltr"
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                aria-invalid={!!form.confirm && !confirmOk}
                className={`pe-10 ${form.confirm ? (confirmOk ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""}`} />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirm((s) => !s)}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <Button type="submit" className="w-full" disabled={loading || !formValid}>
            {loading ? t("signup.loading") : t("signup.submit")}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t("signup.have")} <Link to="/signin" className="text-accent hover:underline">{t("signup.signin")}</Link>
          </p>
        </form>

        <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <p>{t("signup.notice")}</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, hint, hintOk, children }: { label: string; htmlFor: string; hint?: string; hintOk?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <span className={`text-xs ${hintOk ? "text-emerald-600" : "text-destructive"}`}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
