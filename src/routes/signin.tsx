import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth, isClientRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthT } from "@/lib/auth-i18n";
import { TurnstileWidget } from "@/components/site/TurnstileWidget";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign In — Integrated Technics" },
      { name: "description", content: "Sign in to the client or admin dashboard." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" && search.redirect ? search.redirect : undefined,
  }),
  component: SignInPage,
});

function SignInPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { t, dir } = useAuthT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const u = await signIn(email, password);
      const isClient = isClientRole(u.role);
      const dest = redirect || (isClient ? "/dashboard/workspace" : "/dashboard/admin");
      navigate({ to: dest });
    } catch (err: any) {
      setError(err?.message || "Sign in failed");
    } finally { setLoading(false); }
  };

  if (user) {
    const isClient = isClientRole(user.role);
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center" dir={dir}>
        <p className="mb-4">Signed in as <strong>{user.email}</strong></p>
        <Button asChild><Link to={isClient ? "/dashboard/workspace" : "/dashboard/admin"}>{t("signin.submit")}</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-md" dir={dir}>
      <div className="bg-card border rounded-2xl shadow-elegant p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">{t("signin.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("signin.sub")}</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("signin.email")}</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">{t("signin.password")}</Label>
              <Link to="/forgot-password" className="text-xs text-accent hover:underline">{t("signin.forgot")}</Link>
            </div>
            <div className="relative">
              <Input id="password" type={showPwd ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pe-10" dir="ltr" />
              <button type="button" onClick={() => setShowPwd((s) => !s)}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label={showPwd ? t("signin.hide") : t("signin.show")} tabIndex={-1}>
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">{t("signin.remember")}</Label>
          </div>

          {/* Cloudflare Turnstile Bot Defense */}
          <div className="pt-1 flex justify-center">
            <TurnstileWidget
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              theme="auto"
              size="flexible"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("signin.loading") : t("signin.submit")}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {t("signin.new")} <Link to="/signup" className="text-accent hover:underline">{t("signin.create")}</Link>
          </p>
        </form>
        <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <p>{t("signin.notice")}</p>
        </div>
      </div>
    </div>
  );
}
