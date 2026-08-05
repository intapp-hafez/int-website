import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Mail, Phone, Building2, Globe2, Package, Trash2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

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
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const setStatus = async (status: string) => {
    if (!lead) return;
    const { error } = await supabase.from("leads").update({ status }).eq("id", lead.id);
    if (error) return toast.error(error.message);
    setLead({ ...lead, status });
    toast.success("Status updated");
  };

  const addNote = async () => {
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("lead_notes" as any).insert({
      lead_id: id, body, author_id: u?.user?.id ?? null,
    }).select("*").single();
    setPosting(false);
    if (error) return toast.error(error.message);
    setNotes(prev => [...prev, data as any]);
    setDraft("");
  };

  const removeNote = async (nid: string) => {
    if (!confirm("Delete this note?")) return;
    const { error } = await supabase.from("lead_notes" as any).delete().eq("id", nid);
    if (error) return toast.error(error.message);
    setNotes(prev => prev.filter(n => n.id !== nid));
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;
  }
  if (!lead) {
    return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Lead not found.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard/admin/leads/quotes"><ArrowLeft className="h-4 w-4 me-2" /> Back to quote requests</Link>
      </Button>

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="font-display text-xl truncate">{lead.full_name}</CardTitle>
              <span className="font-mono text-sm font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                #{lead.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{new Date(lead.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{lead.source.replace(/_/g, " ")}</Badge>
            <Select value={lead.status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><a className="hover:text-accent" href={`mailto:${lead.email}`}>{lead.email}</a></div>
            {lead.phone && <div className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><a className="hover:text-accent" href={`tel:${lead.phone}`} dir="ltr">{lead.phone}</a></div>}
            {lead.company && <div className="inline-flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{lead.company}</div>}
            <div className="inline-flex items-center gap-2"><Globe2 className="h-3.5 w-3.5 text-muted-foreground" />{lead.lang === "ar" ? "Arabic" : "English"}</div>
          </div>
          {lead.product_slug && (
            <div className="inline-flex items-center gap-2 text-sm">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <Link to="/shop/$slug" params={{ slug: lead.product_slug }} className="font-medium hover:text-accent">{lead.product_name}</Link>
              <span className="text-xs text-muted-foreground">/{lead.product_slug}</span>
            </div>
          )}
          {lead.message && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Customer message</div>
              <div className="text-sm bg-muted/50 rounded p-3 whitespace-pre-wrap">{lead.message}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Internal notes & conversation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-sm text-muted-foreground">No notes yet. Add the first follow-up note below.</div>
          ) : (
            <ul className="space-y-2">
              {notes.map(n => (
                <li key={n.id} className="rounded-md border p-3 bg-card">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    <button onClick={() => removeNote(n.id)} className="hover:text-destructive inline-flex items-center gap-1" aria-label="Delete note">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 pt-2 border-t">
            <Textarea rows={2} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add an internal note…" className="flex-1" />
            <Button onClick={addNote} disabled={posting || !draft.trim()} aria-label="Add note">
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}