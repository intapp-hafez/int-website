import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCanAccess } from "@/lib/permissions-store";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/smtp")({
  head: () => ({ meta: [{ title: "SMTP — Admin" }] }),
  component: SmtpAdminPage,
});

type Smtp = {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  reply_to: string;
  enabled: boolean;
};

const HOSTINGER_PRESET = {
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
};

function SmtpAdminPage() {
  const can = useCanAccess("smtp");
  const [data, setData] = useState<Smtp | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("smtp_settings").select("*").eq("id", "main").maybeSingle();
    if (error) {
      // RLS may block non-admin Supabase sessions; fall back to local defaults so UI is usable.
      console.warn("smtp_settings load error:", error.message);
    }
    setData(
      (data as Smtp) ?? {
        id: "main",
        host: HOSTINGER_PRESET.host,
        port: HOSTINGER_PRESET.port,
        secure: HOSTINGER_PRESET.secure,
        username: "",
        password: "",
        from_email: "",
        from_name: "",
        reply_to: "",
        enabled: false,
      },
    );
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (!can.view) return <div className="p-8 text-muted-foreground">No access</div>;
  if (loading) return <div className="p-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  if (!data) return <div className="p-8 text-muted-foreground">Unable to load SMTP settings.</div>;

  const update = (patch: Partial<Smtp>) => setData((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    setSaving(true);
    const { id, ...rest } = data;
    const { error } = await supabase.from("smtp_settings").upsert({ id, ...rest });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("SMTP settings saved");
  };

  const applyHostinger = () => {
    update(HOSTINGER_PRESET);
    toast.success("Hostinger defaults applied — review & save");
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Mail className="h-6 w-6" /> SMTP Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Outgoing email server credentials. Pre-configured with Hostinger defaults.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Server</CardTitle>
          <CardDescription>For Hostinger, use SSL on port 465 with your full mailbox address as the username.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Button type="button" variant="outline" size="sm" onClick={applyHostinger}>Apply Hostinger defaults</Button>
          </div>
          <div><Label>Host</Label><Input value={data.host} onChange={(e) => update({ host: e.target.value })} placeholder="smtp.hostinger.com" /></div>
          <div><Label>Port</Label><Input type="number" value={data.port} onChange={(e) => update({ port: Number(e.target.value) || 0 })} /></div>
          <div className="flex items-center gap-3"><Switch checked={data.secure} onCheckedChange={(v) => update({ secure: v })} /><Label>Use SSL/TLS (recommended for port 465)</Label></div>
          <div className="flex items-center gap-3"><Switch checked={data.enabled} onCheckedChange={(v) => update({ enabled: v })} /><Label>Enable outgoing email</Label></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Authentication</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>Username (full email)</Label><Input type="email" autoComplete="off" value={data.username} onChange={(e) => update({ username: e.target.value })} placeholder="noreply@yourdomain.com" /></div>
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} autoComplete="new-password" value={data.password} onChange={(e) => update({ password: e.target.value })} />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle visibility">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sender identity</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>From name</Label><Input value={data.from_name} onChange={(e) => update({ from_name: e.target.value })} /></div>
          <div><Label>From email</Label><Input type="email" value={data.from_email} onChange={(e) => update({ from_email: e.target.value })} placeholder="noreply@yourdomain.com" /></div>
          <div className="md:col-span-2"><Label>Reply-to (optional)</Label><Input type="email" value={data.reply_to} onChange={(e) => update({ reply_to: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />} Save SMTP settings</Button>
    </div>
  );
}