import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck, AlertTriangle, CircleHelp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { runIdentitySecurityChecks, type IdentitySecurityCheck } from "@/lib/identity-security-checks";

export function IdentitySecurityChecks() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [checks, setChecks] = useState<IdentitySecurityCheck[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const run = async () => {
    setRunning(true);
    setError(false);
    try {
      setChecks(await runIdentitySecurityChecks());
      setCheckedAt(new Date().toLocaleString(ar ? "ar-EG" : "en-GB"));
    } catch { setError(true); }
    finally { setRunning(false); }
  };
  return <section className="border-y border-border py-6 space-y-4" aria-labelledby="identity-security-heading">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 id="identity-security-heading" className="flex items-center gap-2 text-lg font-bold"><KeyRound className="size-5 text-accent" />{ar ? "أمان API والجلسات والتوكن" : "API, Session & Token Security"}</h2>
        <p className="text-sm text-muted-foreground">{checkedAt ? `${ar ? "آخر تحقق" : "Last checked"}: ${checkedAt}` : ar ? "لم يتم التحقق بعد" : "Not verified yet"}</p></div>
      <Button variant="outline" disabled={running} onClick={run}><span>{running ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}</span>{ar ? "التحقق من الحماية" : "Verify protection"}</Button>
    </div>
    <div aria-live="polite" className="space-y-0">
      {error && <p className="text-sm text-destructive">{ar ? "تعذر إكمال التحقق. لم يتم تأكيد الحماية." : "Verification could not complete. Protection is not confirmed."}</p>}
      {checks.map((check, i) => <div key={`${check.rule}-${i}`} className="flex items-start gap-3 border-b border-border py-3 last:border-0">
        {check.ok === true ? <ShieldCheck className="size-4 shrink-0 text-accent mt-1" /> : check.ok === false ? <AlertTriangle className="size-4 shrink-0 text-destructive mt-1" /> : <CircleHelp className="size-4 shrink-0 text-muted-foreground mt-1" />}
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{ar ? check.labelAr : check.label}</p><p className="text-xs text-muted-foreground break-words mt-1" dir="ltr">{check.evidence}</p></div>
        <Badge variant={check.ok === false ? "destructive" : "secondary"} className="shrink-0">{check.ok === true ? ar ? "تم التحقق" : "Verified" : check.ok === false ? ar ? "فشل" : "Failed" : ar ? "غير مؤكد" : "Unverified"}</Badge>
      </div>)}
    </div>
  </section>;
}