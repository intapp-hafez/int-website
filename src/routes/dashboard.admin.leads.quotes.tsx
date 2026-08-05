import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Mail, Phone, Building2, Globe2, Package, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminT } from "@/lib/admin-i18n";

type Lead = {
  id: string;
  source: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  product_id: string | null;
  product_name: string;
  product_slug: string;
  lang: string;
  status: string;
  created_at: string;
  category?: string | null;
  priority?: string | null;
};

const STATUSES = ["new", "qualified", "won", "lost"] as const;

export const Route = createFileRoute("/dashboard/admin/leads/quotes")({
  head: () => ({ meta: [{ title: "Quote Requests — Admin" }] }),
  component: QuoteLeadsPage,
});

function QuoteLeadsPage() {
  const { t, isRtl, lang } = useAdminT();
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setItems(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };
  const remove = async (id: string) => {
    if (!confirm(t("deleteLeadConfirm"))) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("quoteRequests")}</h1>
          <p className="text-sm text-muted-foreground">{t("quoteRequestsSub")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/admin/leads/quotes/email-settings"><Bell className="h-3.5 w-3.5 me-1" /> {t("emailNotifications")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm"><Link to="/dashboard/admin/leads">{t("allLeads")}</Link></Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{t("noQuoteRequests")}</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map(l => (
            <Card key={l.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to="/dashboard/admin/leads/quotes/$id" params={{ id: l.id }} className="font-semibold hover:text-accent">
                        {l.full_name}
                      </Link>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                        #{l.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{new Date(l.created_at).toLocaleString(lang === "ar" ? "ar" : "en")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{l.source.replace(/_/g, " ")}</Badge>
                    {l.category && l.category !== "general" && (
                      <Badge variant="secondary" className="capitalize">{l.category}</Badge>
                    )}
                    {l.priority && l.priority !== "normal" && (
                      <Badge className="capitalize" variant={l.priority === "urgent" ? "destructive" : "outline"}>{l.priority}</Badge>
                    )}
                    <Select value={l.status} onValueChange={v => setStatus(l.id, v)}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{(t as any)(s) ?? s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/dashboard/admin/leads/quotes/$id" params={{ id: l.id }}>{t("open_")}</Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><a className="hover:text-accent" href={`mailto:${l.email}`}>{l.email}</a></div>
                  {l.phone && <div className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><a className="hover:text-accent" href={`tel:${l.phone}`} dir="ltr">{l.phone}</a></div>}
                  {l.company && <div className="inline-flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{l.company}</div>}
                  <div className="inline-flex items-center gap-2"><Globe2 className="h-3.5 w-3.5 text-muted-foreground" />{l.lang === "ar" ? t("langArabic") : t("langEnglish")}</div>
                </div>
                {l.product_slug && (
                  <div className="inline-flex items-center gap-2 text-sm">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <Link to="/shop/$slug" params={{ slug: l.product_slug }} className="font-medium hover:text-accent">{l.product_name}</Link>
                    <span className="text-xs text-muted-foreground">/{l.product_slug}</span>
                  </div>
                )}
                {l.message && <div className="text-sm bg-muted/50 rounded p-3 whitespace-pre-wrap">{l.message}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
