import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Mail, Phone, Building2, Globe2, Package, Trash2, Send, FilePlus } from "lucide-react";
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
};

type Note = {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
};

const STATUSES = ["new", "qualified", "won", "lost"] as const;

export const Route = createFileRoute("/dashboard/admin/leads/quotes/$id")({
  head: () => ({ meta: [{ title: "Quote Request — Admin" }] }),
  component: QuoteDetailPage,
});

function QuoteDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { t, lang, isRtl } = useAdminT();
  const isAr = lang === "ar";

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [converting, setConverting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: l, error: le }, { data: ns, error: ne }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).maybeSingle(),
      supabase.from("lead_notes" as any).select("*").eq("lead_id", id).order("created_at", { ascending: true }),
    ]);
    if (le) toast.error(le.message);
    if (ne) toast.error(ne.message);
    setLead((l as any) ?? null);
    setNotes((ns as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [id]);

  const setStatus = async (status: string) => {
    if (!lead) return;
    const { error } = await supabase.from("leads").update({ status }).eq("id", lead.id);
    if (error) return toast.error(error.message);
    setLead({ ...lead, status });
    toast.success(isAr ? "تم تحديث الحالة" : "Status updated");
  };

  const convertToQuotation = async () => {
    if (!lead) return;
    setConverting(true);
    try {
      const { data: q, error: qErr } = await (supabase as any)
        .from("quotes")
        .insert({
          full_name: lead.full_name,
          company: lead.company,
          email: lead.email,
          phone: lead.phone,
          service_name: lead.product_name ? `Product Quotation: ${lead.product_name}` : "Product Integration Solution",
          total: 5000,
          currency: "USD",
          status: "draft",
          message: lead.message,
        })
        .select()
        .single();

      if (qErr) throw qErr;

      // Mark lead as won
      await supabase.from("leads").update({ status: "won" }).eq("id", id);
      toast.success(isAr ? "تم إنشاء عرض السعر وتحديث الطلب إلى Won" : "Converted to official quotation!");

      if (q?.id) {
        navigate({ to: "/dashboard/admin/quotations/$id", params: { id: q.id } } as any);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to convert quote request");
    } finally {
      setConverting(false);
    }
  };

  const addNote = async () => {
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("lead_notes" as any).insert({
      lead_id: id,
      body,
      author_id: u?.user?.id ?? null,
    }).select("*").single();
    setPosting(false);
    if (error) return toast.error(error.message);
    setNotes((prev) => [...prev, data as any]);
    setDraft("");
  };

  const removeNote = async (nid: string) => {
    if (!confirm(isAr ? "هل تريد حذف هذه الملاحظة؟" : "Delete this note?")) return;
    const { error } = await supabase.from("lead_notes" as any).delete().eq("id", nid);
    if (error) return toast.error(error.message);
    setNotes((prev) => prev.filter((n) => n.id !== nid));
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;
  }
  if (!lead) {
    return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{isAr ? "الطلب غير موجود." : "Lead not found."}</CardContent></Card>;
  }

  return (
    <div className="space-y-4 max-w-4xl" dir={isRtl ? "rtl" : "ltr"}>
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard/admin/leads/quotes">
          <ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {isAr ? "العودة لطلبات عروض الأسعار" : "Back to quote requests"}
        </Link>
      </Button>

      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex-row items-start justify-between space-y-0 gap-3 flex-wrap border-b pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="font-display text-xl font-bold truncate">{lead.full_name}</CardTitle>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                #{lead.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{new Date(lead.created_at).toLocaleString(isAr ? "ar" : "en")}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">{lead.source.replace(/_/g, " ")}</Badge>
            <Select value={lead.status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button size="sm" onClick={convertToQuotation} disabled={converting} className="rounded-xl">
              {converting ? <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" /> : <FilePlus className="h-3.5 w-3.5 me-1.5" />}
              {isAr ? "تحويل لعرض سعر رسمي" : "Generate Quotation"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a className="hover:text-accent font-medium" href={`mailto:${lead.email}`}>{lead.email}</a>
            </div>
            {lead.phone && (
              <div className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a className="hover:text-accent font-mono" href={`tel:${lead.phone}`} dir="ltr">{lead.phone}</a>
              </div>
            )}
            {lead.company && (
              <div className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{lead.company}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              <span>{lead.lang === "ar" ? "اللغة العربية" : "English"}</span>
            </div>
          </div>
          {lead.product_slug && (
            <div className="inline-flex items-center gap-2 text-sm bg-muted/30 p-2.5 rounded-xl border">
              <Package className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">{isAr ? "المنتج المطلوب:" : "Requested Product:"}</span>
              <Link to="/products/$slug" params={{ slug: lead.product_slug }} className="font-semibold hover:text-accent">
                {lead.product_name}
              </Link>
              <span className="text-xs text-muted-foreground font-mono">/{lead.product_slug}</span>
            </div>
          )}
          {lead.message && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">{isAr ? "رسالة العميل:" : "Customer Requirements:"}</div>
              <div className="text-sm bg-muted/40 rounded-xl p-3.5 whitespace-pre-wrap border leading-relaxed">{lead.message}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border shadow-xs">
        <CardHeader>
          <CardTitle className="font-display text-lg font-bold">
            {isAr ? "الملاحظات الداخلية والمتابعة" : "Internal Notes & Conversation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2">
              {isAr ? "لا توجد ملاحظات داخلية بعد. أضف أول ملاحظة متابعة أدناه." : "No notes yet. Add the first follow-up note below."}
            </div>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl border p-3 bg-card shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span>{new Date(n.created_at).toLocaleString(isAr ? "ar" : "en")}</span>
                    <button onClick={() => removeNote(n.id)} className="hover:text-destructive inline-flex items-center gap-1">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 pt-2 border-t">
            <Textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={isAr ? "اكتب ملاحظة داخلية للمتابعة..." : "Add an internal note…"}
              className="flex-1 rounded-xl text-xs"
            />
            <Button onClick={addNote} disabled={posting || !draft.trim()} className="rounded-xl self-end">
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
