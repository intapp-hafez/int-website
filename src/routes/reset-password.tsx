import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Eye, EyeOff, KeyRound, Check, X, Loader2 } from "lucide-react";
import { useAuthT } from "@/lib/auth-i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — Integrated Technics" },
      { name: "description", content: "Set a new password for your account." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

const PWD_RULES = [
  { key: "len", test: (p: string) => p.length >= 8 },
  { key: "up", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lo", test: (p: string) => /[a-z]/.test(p) },
  { key: "num", test: (p: string) => /\d/.test(p) },
  { key: "sym", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

type LinkState = "checking" | "valid" | "invalid" | "used";

function parseHashError(): { code?: string; description?: string } {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  const search = new URLSearchParams(window.location.search);
  return {
    code: params.get("error_code") || search.get("error_code") || params.get("error") || search.get("error") || undefined,
    description: params.get("error_description") || search.get("error_description") || undefined,
  };
}

function ResetPasswordPage() {
  const { t, dir } = useAuthT();
  const navigate = useNavigate();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recoveryAcked, setRecoveryAcked] = useState(false);

  // Validate the recovery link. The Supabase JS SDK parses the URL hash
  // (#access_token=…&type=recovery) automatically and emits PASSWORD_RECOVERY.
  // Single-use + expiry are enforced server-side by GoTrue; on failure the
  // SDK redirects with #error_code in the URL.
  useEffect(() => {
    let mounted = true;

    // 1. Surface explicit errors from the URL (expired / used / invalid)
    const { code } = parseHashError();
    if (code) {
      const used = code === "otp_expired" || code === "access_denied" || code === "flow_state_expired";
      setLinkState(used ? "used" : "invalid");
      // Strip sensitive query/hash so the URL doesn't leak tokens or errors
      try { window.history.replaceState({}, "", "/reset-password"); } catch {}
      return;
    }

    // 2. Listen for the recovery event the SDK emits after parsing the hash
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryAcked(true);
        setLinkState("valid");
      }
    });

    // 3. Fallback: if a session is already established via the hash, allow
    // the form to render. We still scrub the URL to remove tokens.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setLinkState((s) => (s === "checking" ? "valid" : s));
      try {
        if (window.location.hash.includes("access_token") || window.location.hash.includes("error")) {
          window.history.replaceState({}, "", "/reset-password");
        }
      } catch {}
      // If nothing happened within a short window, treat as invalid.
      setTimeout(() => {
        if (!mounted) return;
        setLinkState((s) => (s === "checking" ? "invalid" : s));
      }, 1500);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const checks = useMemo(() => PWD_RULES.map((r) => ({ ...r, ok: r.test(password) })), [password]);
  const pwdOk = checks.every((r) => r.ok);
  const confirmOk = confirm.length > 0 && confirm === password;
  const formValid = pwdOk && confirmOk;

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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        // Generic, non-leaking messaging. Map only well-known cases.
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("weak") || msg.includes("password") && msg.includes("short")) {
          setError(t("reset.weak"));
        } else if (msg.includes("expired") || msg.includes("invalid") || msg.includes("not found")) {
          setLinkState("used");
        } else {
          setError(t("reset.generic"));
        }
        return;
      }
      setSuccess(t("reset.success"));
      // Invalidate the recovery session and any other sessions for safety.
      await supabase.auth.signOut({ scope: "global" });
      setTimeout(() => navigate({ to: "/signin" }), 1500);
    } catch {
      setError(t("reset.generic"));
    } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-md" dir={dir}>
      <div className="bg-card border rounded-2xl shadow-elegant p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">{t("reset.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("reset.sub")}</p>
          </div>
        </div>

        {linkState === "checking" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("reset.checking")}
          </div>
        )}

        {(linkState === "invalid" || linkState === "used") && (
          <div className="space-y-4">
            <p className="text-sm text-destructive">
              {linkState === "used" ? t("reset.used") : t("reset.invalid")}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/forgot-password">{t("reset.requestNew")}</Link>
            </Button>
          </div>
        )}

        {linkState === "valid" && (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("reset.new")}</Label>
              <div className="relative">
                <Input id="password" type={showPwd ? "text" : "password"} autoComplete="new-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr"
                  className={`pe-10 ${password ? (pwdOk ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""}`} />
                <button type="button" tabIndex={-1} onClick={() => setShowPwd((s) => !s)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label={showPwd ? t("signin.hide") : t("signin.show")}>
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
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="confirm">{t("reset.confirm")}</Label>
                {confirm && (
                  <span className={`text-xs ${confirmOk ? "text-emerald-600" : "text-destructive"}`}>
                    {confirmOk ? t("signup.matches") : t("signup.noMatch")}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input id="confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" required
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} dir="ltr"
                  className={`pe-10 ${confirm ? (confirmOk ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""}`} />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm((s) => !s)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label={showConfirm ? t("signin.hide") : t("signin.show")}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}

            <Button type="submit" className="w-full" disabled={loading || !formValid}>
              {loading ? t("reset.loading") : t("reset.submit")}
            </Button>
          </form>
        )}

        <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <p>{t("reset.notice")}</p>
        </div>

        {/* Mark recovery handshake silently for screen-reader users */}
        {recoveryAcked && <span className="sr-only" aria-live="polite">ok</span>}
      </div>
    </div>
  );
}
