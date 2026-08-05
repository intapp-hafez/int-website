import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useAuthT } from "@/lib/auth-i18n";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Integrated Technics" },
      { name: "description", content: "Reset your account password securely." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t, dir } = useAuthT();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Could not send reset email.");
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
            <h1 className="font-display text-xl font-bold">{t("forgot.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("forgot.sub")}</p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-600">{t("forgot.sent", { email })}</p>
            <Button asChild variant="outline" className="w-full"><Link to="/signin">{t("forgot.back")}</Link></Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("signin.email")}</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" dir="ltr" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? t("forgot.loading") : t("forgot.submit")}</Button>
            <p className="text-xs text-muted-foreground text-center">
              {t("forgot.remembered")} <Link to="/signin" className="text-accent hover:underline">{t("signup.signin")}</Link>
            </p>
          </form>
        )}

        <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <p>{t("forgot.notice")}</p>
        </div>
      </div>
    </div>
  );
}
