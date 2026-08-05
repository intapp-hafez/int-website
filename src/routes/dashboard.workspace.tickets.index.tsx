import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Paperclip, X, Sparkles, Search } from "lucide-react";
import { demoTickets, type Ticket, type TicketCategory } from "@/data/demo";
import { useClientT, getDemoClientCompany } from "@/lib/client-i18n";

export const Route = createFileRoute("/dashboard/workspace/tickets/")({
  component: ClientTickets,
});

function ClientTickets() {
  const { t, isRtl } = useClientT();
  const navigate = useNavigate();
  const company = getDemoClientCompany();
  const [tickets, setTickets] = useState<Ticket[]>(() => demoTickets.filter((tk) => tk.client === company));
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<TicketCategory | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Ticket["priority"] | "all">("all");
  const [open, setOpen] = useState(false);
  type Category = TicketCategory;
  const [form, setForm] = useState<{ subject: string; priority: Ticket["priority"]; category: Category; message: string }>({ subject: "", priority: "medium", category: "general", message: "" });
  const [files, setFiles] = useState<File[]>([]);

  const categories: { value: Category; key: "catBilling" | "catTechnical" | "catAccount" | "catFeature" | "catGeneral" | "catOther" }[] = [
    { value: "billing", key: "catBilling" },
    { value: "technical", key: "catTechnical" },
    { value: "account", key: "catAccount" },
    { value: "feature", key: "catFeature" },
    { value: "general", key: "catGeneral" },
    { value: "other", key: "catOther" },
  ];

  const quickReplies: { key: "qrInvoice" | "qrLogin" | "qrBug" | "qrFeature" | "qrFollowup"; category: Category }[] = [
    { key: "qrInvoice", category: "billing" },
    { key: "qrLogin", category: "account" },
    { key: "qrBug", category: "technical" },
    { key: "qrFeature", category: "feature" },
    { key: "qrFollowup", category: "general" },
  ];

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    if (list.length) setFiles((prev) => [...prev, ...list]);
    e.target.value = "";
  };
  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const applyQuick = (key: "qrInvoice" | "qrLogin" | "qrBug" | "qrFeature" | "qrFollowup") => {
    setForm((f) => ({ ...f, message: (f.message ? f.message + "\n\n" : "") + t(key as any) }));
  };

  const priorityTone: Record<string, string> = {
    low: "bg-muted text-foreground",
    medium: "bg-blue-500/10 text-blue-700",
    high: "bg-amber-100 text-amber-900",
    urgent: "bg-destructive/10 text-destructive",
  };
  const statusTone: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-900",
    pending: "bg-amber-100 text-amber-900",
    resolved: "bg-blue-500/10 text-blue-700",
    closed: "bg-muted text-foreground",
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    const id = `T-${7100 + tickets.length}`;
    setTickets([{ id, subject: form.subject, client: company, priority: form.priority, status: "open", updated: new Date().toISOString().slice(0, 10), category: form.category }, ...tickets]);
    setForm({ subject: "", priority: "medium", category: "general", message: "" });
    setFiles([]);
    setOpen(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((tk) => {
      const cat = (tk.category ?? "general") as TicketCategory;
      if (filterCategory !== "all" && cat !== filterCategory) return false;
      if (filterPriority !== "all" && tk.priority !== filterPriority) return false;
      if (q && !(tk.subject.toLowerCase().includes(q) || tk.id.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [tickets, query, filterCategory, filterPriority]);
  const filtersActive = filterCategory !== "all" || filterPriority !== "all" || query.trim().length > 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="font-display text-xl">{t("tickets")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{t("ticketsTagline")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 me-1" /> {t("newTicket")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("newTicket")}</DialogTitle></DialogHeader>
            <form onSubmit={onCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="subject">{t("subject")}</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("category")}</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{t(c.key as any)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("priority")}</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Ticket["priority"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["low", "medium", "high", "urgent"] as const).map((p) => (
                        <SelectItem key={p} value={p}>{t(p as any)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> {t("quickReplies")}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {quickReplies.map((q) => (
                    <Button key={q.key} type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => applyQuick(q.key)}>
                      {t(("cat" + q.category.charAt(0).toUpperCase() + q.category.slice(1)) as any)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="msg">{t("message")}</Label>
                <Textarea id="msg" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("attachments")}</Label>
                <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-input px-3 py-3 text-sm text-muted-foreground hover:bg-muted/40 cursor-pointer transition">
                  <Paperclip className="h-4 w-4" />
                  <span>{t("attachFiles")}</span>
                  <input type="file" multiple className="hidden" onChange={onPickFiles} />
                </label>
                {files.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1 text-xs">
                        <span className="truncate" dir={isRtl ? "rtl" : "ltr"}>{f.name} <span className="text-muted-foreground">({Math.round(f.size / 1024)} KB)</span></span>
                        <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive shrink-0" aria-label="remove">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">{t("submitTicket")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {tickets.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-4">
            <div className="relative flex-1 min-w-0">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRtl ? "right-2.5" : "left-2.5"}`} />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchTickets")} className={isRtl ? "pr-8" : "pl-8"} />
            </div>
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as any)}>
              <SelectTrigger className="sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCategories")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{t(c.key as any)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as any)}>
              <SelectTrigger className="sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allPriorities")}</SelectItem>
                {(["low", "medium", "high", "urgent"] as const).map((p) => (
                  <SelectItem key={p} value={p}>{t(p as any)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setQuery(""); setFilterCategory("all"); setFilterPriority("all"); }}>
                <X className="h-4 w-4 me-1" /> {t("clearFilters")}
              </Button>
            )}
          </div>
        )}
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("noTickets")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("noResults")}</p>
        ) : (
          <>
          {/* Mobile card grid */}
          <div className="grid gap-3 sm:hidden">
            {filtered.map((tk) => (
              <button
                key={tk.id}
                onClick={() => navigate({ to: "/dashboard/workspace/tickets/$id", params: { id: tk.id } })}
                className="text-start rounded-xl border bg-card p-4 shadow-sm hover:shadow-md active:scale-[0.99] transition"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{tk.id}</span>
                  <span className="text-[11px] text-muted-foreground">{tk.updated}</span>
                </div>
                <div className="font-medium text-sm mb-2 line-clamp-2">{tk.subject}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className={`${priorityTone[tk.priority]} border-0 capitalize text-[10px]`}>{t(tk.priority as any)}</Badge>
                  <Badge className={`${statusTone[tk.status]} border-0 capitalize text-[10px]`}>{t(tk.status as any)}</Badge>
                </div>
              </button>
            ))}
          </div>

          <Table className="hidden sm:table">
            <TableHeader>
              <TableRow>
                <TableHead>{t("id")}</TableHead>
                <TableHead>{t("subject")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("priority")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-end">{t("updated")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tk) => {
                const cat = (tk.category ?? "general") as TicketCategory;
                const catKey = "cat" + cat.charAt(0).toUpperCase() + cat.slice(1);
                return (
                <TableRow key={tk.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate({ to: "/dashboard/workspace/tickets/$id", params: { id: tk.id } })}>
                  <TableCell className="font-mono text-xs">{tk.id}</TableCell>
                  <TableCell className="text-sm font-medium">{tk.subject}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t(catKey as any)}</TableCell>
                  <TableCell><Badge className={`${priorityTone[tk.priority]} border-0 capitalize`}>{t(tk.priority as any)}</Badge></TableCell>
                  <TableCell><Badge className={`${statusTone[tk.status]} border-0 capitalize`}>{t(tk.status as any)}</Badge></TableCell>
                  <TableCell className="text-end text-sm text-muted-foreground">{tk.updated}</TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
