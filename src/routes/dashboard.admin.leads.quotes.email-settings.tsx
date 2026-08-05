import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Save, Eye, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/leads/quotes/email-settings")({
  head: () => ({ meta: [{ title: "Quote Email Notifications — Admin" }] }),
  component: QuoteEmailSettingsPage,
});

const STORAGE_KEY = "admin.quote_email_settings.v1";

type Settings = {
  enabled: boolean;
  recipients: string;
  cc: string;
  replyTo: string;
  subjectEn: string;
  subjectAr: string;
  bodyEn: string;
  bodyAr: string;
  includeMessage: boolean;
  includeProductLink: boolean;
};

const DEFAULTS: Settings = {
  enabled: true,
  recipients: "sales@integratedtechnics.com",
  cc: "",
  replyTo: "",
  subjectEn: "New quote request — {{product_name}}",
  subjectAr: "طلب عرض سعر جديد — {{product_name}}",
  bodyEn:
    "Hello Sales Team,\n\nA new quote request has just been submitted from the website.\n\nProduct: {{product_name}} ({{product_slug}})\nLanguage: {{lang}}\n\nFrom: {{full_name}} <{{email}}>\nPhone: {{phone}}\nCompany: {{company}}\n\nMessage:\n{{message}}\n\nOpen lead: {{lead_link}}",
  bodyAr:
    "مرحبًا فريق المبيعات،\n\nتم استلام طلب عرض سعر جديد من الموقع.\n\nالمنتج: {{product_name}} ({{product_slug}})\nاللغة: {{lang}}\n\nمن: {{full_name}} <{{email}}>\nالهاتف: {{phone}}\nالشركة: {{company}}\n\nالرسالة:\n{{message}}\n\nفتح الطلب: {{lead_link}}",
  includeMessage: true,
  includeProductLink: true,
};

const SAMPLE = {
  product_name: "Hikvision 8MP Bullet Camera",
  product_slug: "hikvision-8mp-bullet",
  full_name: "Ahmed Ali",
  email: "ahmed@example.com",
  phone: "+20 100 123 4567",
  company: "Example Co.",
  message: "Please send pricing for 20 units with installation in Cairo.",
  lang: "EN",
  lead_link: "https://integratedtechnics.com/dashboard/admin/leads/quotes/abc123",
};

const render = (tpl: string, data: Record<string, string>) =>
  tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => data[k] ?? `{{${k}}}`);

function load(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return DEFAULTS; }
}

function QuoteEmailSettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  useEffect(() => { setS(load()); }, []);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => setS(p => ({ ...p, [k]: v }));

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      toast.success("Email notification settings saved");
    } catch { toast.error("Could not save settings"); }
  };

  const reset = () => { setS(DEFAULTS); toast.message("Reverted to defaults"); };

  const previewEn = useMemo(() => ({
    subject: render(s.subjectEn, SAMPLE),
    body: render(s.bodyEn, SAMPLE),
  }), [s.subjectEn, s.bodyEn]);
  const previewAr = useMemo(() => ({
    subject: render(s.subjectAr, { ...SAMPLE, lang: "AR" }),
    body: render(s.bodyAr, { ...SAMPLE, lang: "AR" }),
  }), [s.subjectAr, s.bodyAr]);

  const recipientList = s.recipients.split(/[,\s]+/).filter(Boolean);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to="/dashboard/admin/leads/quotes"><ArrowLeft className="h-4 w-4 mr-1" /> Back to quote requests</Link>
          </Button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" /> Quote Request Email Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure who gets notified by email when a new bilingual quote request is submitted.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={reset}>Reset</Button>
          <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Save</Button>
        </div>
      </div>

      <div className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex gap-2 items-start">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          This is the UI/UX configuration only — settings are saved locally for now. Email delivery will be wired up once
          the sender domain and provider are connected.
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Delivery</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="font-medium">Send email on new quote request</Label>
              <p className="text-xs text-muted-foreground">When off, in-app notifications still appear in the bell menu.</p>
            </div>
            <Switch checked={s.enabled} onCheckedChange={(v) => update("enabled", v)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sales inbox (To)</Label>
              <Input
                value={s.recipients}
                onChange={(e) => update("recipients", e.target.value)}
                placeholder="sales@yourcompany.com, manager@yourcompany.com"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {recipientList.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>CC (optional)</Label>
              <Input value={s.cc} onChange={(e) => update("cc", e.target.value)} placeholder="cc@yourcompany.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Reply-To (optional)</Label>
              <Input value={s.replyTo} onChange={(e) => update("replyTo", e.target.value)} placeholder="leads@yourcompany.com" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <Label className="font-normal text-sm">Include requester message</Label>
              <Switch checked={s.includeMessage} onCheckedChange={(v) => update("includeMessage", v)} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <Label className="font-normal text-sm">Include product link (slug)</Label>
              <Switch checked={s.includeProductLink} onCheckedChange={(v) => update("includeProductLink", v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bilingual templates</CardTitle>
          <p className="text-xs text-muted-foreground">
            Available variables: <code>{"{{product_name}}"}</code>, <code>{"{{product_slug}}"}</code>,{" "}
            <code>{"{{full_name}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{phone}}"}</code>,{" "}
            <code>{"{{company}}"}</code>, <code>{"{{message}}"}</code>, <code>{"{{lang}}"}</code>,{" "}
            <code>{"{{lead_link}}"}</code>.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="en">
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="ar">العربية</TabsTrigger>
            </TabsList>

            <TabsContent value="en" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label>Subject (EN)</Label>
                <Input value={s.subjectEn} onChange={(e) => update("subjectEn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Body (EN)</Label>
                <Textarea rows={10} value={s.bodyEn} onChange={(e) => update("bodyEn", e.target.value)} />
              </div>
              <PreviewBox dir="ltr" subject={previewEn.subject} body={previewEn.body} />
            </TabsContent>

            <TabsContent value="ar" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label>الموضوع (AR)</Label>
                <Input dir="rtl" value={s.subjectAr} onChange={(e) => update("subjectAr", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>المحتوى (AR)</Label>
                <Textarea dir="rtl" rows={10} value={s.bodyAr} onChange={(e) => update("bodyAr", e.target.value)} />
              </div>
              <PreviewBox dir="rtl" subject={previewAr.subject} body={previewAr.body} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewBox({ dir, subject, body }: { dir: "ltr" | "rtl"; subject: string; body: string }) {
  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center gap-2 px-3 py-2 border-b text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" /> Preview
      </div>
      <div className="p-4 space-y-2" dir={dir}>
        <div className="text-sm"><span className="text-muted-foreground">Subject:</span> <span className="font-medium">{subject}</span></div>
        <pre className="whitespace-pre-wrap text-sm font-sans bg-muted/40 rounded p-3">{body}</pre>
      </div>
    </div>
  );
}