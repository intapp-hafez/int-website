import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { getTurnstileConfig } from "@/lib/turnstile.functions";

export function TurnstileSettingsCard() {
  const [cfg, setCfg] = useState<{ siteKey: string | null; secretConfigured: boolean } | null>(null);
  useEffect(() => {
    getTurnstileConfig().then(setCfg).catch(() => setCfg({ siteKey: null, secretConfigured: false }));
  }, []);

  const Row = ({ ok, label, value }: { ok: boolean; label: string; value: string }) => (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <span className="text-sm font-medium">{label}</span>
      <span className={`flex items-center gap-1.5 text-xs ${ok ? "text-accent" : "text-destructive"}`}>
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {value}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" /> Bot protection (Cloudflare Turnstile)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row ok={!!cfg?.siteKey} label="Site key (public)" value={cfg ? (cfg.siteKey ? "Set" : "Using test key") : "Checking…"} />
        <Row ok={!!cfg?.secretConfigured} label="Secret key (private)" value={cfg ? (cfg.secretConfigured ? "Stored securely" : "Not set") : "Checking…"} />
        <p className="text-xs text-muted-foreground">
          The secret key is kept only in the server's secure secret store (TURNSTILE_SECRET_KEY) and is never sent to the browser.
          When it is set, every sign-in is verified with Cloudflare on the server. To add or change keys, ask the assistant to update
          TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY, or edit them in Project Settings → Secrets.
        </p>
      </CardContent>
    </Card>
  );
}
