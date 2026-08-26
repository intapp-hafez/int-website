import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Pencil, Loader2, Upload, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteRegistration,
  deleteTraining,
  emptyTraining,
  saveTraining,
  useRegistrations,
  useTrainings,
  type TrainingRow,
} from "@/lib/trainings";

export const Route = createFileRoute("/dashboard/admin/training")({
  head: () => ({ meta: [{ title: "Events & Training — Admin" }] }),
  component: TrainingAdminPage,
});

const MAX_BYTES = 5 * 1024 * 1024;

async function uploadBanner(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > MAX_BYTES) throw new Error("Image too large. Max 5 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `trainings/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("slide-images").upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("slide-images").getPublicUrl(path).data.publicUrl;
}

type Draft = Omit<TrainingRow, "id"> & { id?: string };

function TrainingAdminPage() {
  const { items, loading, refresh } = useTrainings();
  const [tab, setTab] = useState("list");
  const [draft, setDraft] = useState<Draft>({ ...emptyTraining });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const edit = (row: TrainingRow) => {
    setDraft({ ...row });
    setTab("form");
  };

  const submit = async () => {
    if (!draft.title_en.trim() && !draft.title_ar.trim()) return toast.error("Enter a title (EN or AR)");
    setSaving(true);
    try {
      await saveTraining({ ...draft, sort_order: draft.sort_order || items.length });
      toast.success(draft.id ? "Updated" : "Published");
      setDraft({ ...emptyTraining });
      setTab("list");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteTraining(id);
      toast.success("Deleted");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Events &amp; Training</h1>
        <p className="text-sm text-muted-foreground mt-1">Publish training programs and events, and review learner registrations.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">Published ({items.length})</TabsTrigger>
          <TabsTrigger value="form">{draft.id ? "Edit item" : "Add new"}</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Nothing published yet.
                  <Button variant="link" onClick={() => setTab("form")}><Plus className="h-4 w-4 me-1" />Add the first one</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Trainer</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-end">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {row.banner_url ? <img src={row.banner_url} alt="" className="h-9 w-14 rounded object-cover" /> : null}
                            <div>
                              <div>{row.title_en || row.title_ar}</div>
                              <div className="text-xs text-muted-foreground" dir="rtl">{row.title_ar}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{row.kind}</Badge></TableCell>
                        <TableCell>{row.trainer}</TableCell>
                        <TableCell className="text-xs">{row.start_date ?? "—"}{row.end_date ? ` → ${row.end_date}` : ""}</TableCell>
                        <TableCell>{row.active ? <Badge>Active</Badge> : <Badge variant="outline">Hidden</Badge>}</TableCell>
                        <TableCell className="text-end space-x-1">
                          <Button size="icon" variant="ghost" onClick={() => edit(row)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">{draft.id ? "Edit" : "Publish new training / event"}</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as TrainingRow["kind"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Trainer</Label>
                <Input value={draft.trainer} onChange={(e) => setDraft({ ...draft, trainer: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label>Title (EN)</Label>
                <Input value={draft.title_en} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>العنوان (AR)</Label>
                <Input dir="rtl" className="font-arabic text-right" value={draft.title_ar} onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label>Details (EN)</Label>
                <Textarea rows={5} value={draft.details_en} onChange={(e) => setDraft({ ...draft, details_en: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>التفاصيل (AR)</Label>
                <Textarea rows={5} dir="rtl" className="font-arabic text-right" value={draft.details_ar} onChange={(e) => setDraft({ ...draft, details_ar: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label>Benefits (EN) — one per line</Label>
                <Textarea rows={4} value={draft.benefits_en} onChange={(e) => setDraft({ ...draft, benefits_en: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>المزايا (AR) — سطر لكل ميزة</Label>
                <Textarea rows={4} dir="rtl" className="font-arabic text-right" value={draft.benefits_ar} onChange={(e) => setDraft({ ...draft, benefits_ar: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" value={draft.start_date ?? ""} onChange={(e) => setDraft({ ...draft, start_date: e.target.value || null })} />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input type="date" value={draft.end_date ?? ""} onChange={(e) => setDraft({ ...draft, end_date: e.target.value || null })} />
              </div>

              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })} />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Banner image</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {draft.banner_url ? <img src={draft.banner_url} alt="" className="h-20 w-36 rounded-md object-cover border" /> : null}
                  <label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer hover:bg-muted">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const url = await uploadBanner(file);
                          setDraft((d) => ({ ...d, banner_url: url }));
                          toast.success("Banner uploaded");
                        } catch (err: any) {
                          toast.error(err?.message ?? "Upload failed");
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </label>
                  <Input placeholder="or paste an image URL" value={draft.banner_url} onChange={(e) => setDraft({ ...draft, banner_url: e.target.value })} className="max-w-sm" />
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
                  <span className="text-sm">Visible on the website</span>
                </div>
                <div className="flex gap-2">
                  {draft.id && <Button variant="outline" onClick={() => { setDraft({ ...emptyTraining }); setTab("list"); }}>Cancel</Button>}
                  <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : draft.id ? "Save changes" : "Publish"}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrations" className="mt-0">
          <RegistrationsPanel trainings={items} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RegistrationsPanel({ trainings }: { trainings: TrainingRow[] }) {
  const [filter, setFilter] = useState<string>("all");
  const { items, loading, refresh } = useRegistrations(filter === "all" ? undefined : filter);
  const [q, setQ] = useState("");

  const titleOf = useMemo(() => {
    const map = new Map(trainings.map((t) => [t.id, t.title_en || t.title_ar]));
    return (id: string) => map.get(id) ?? "—";
  }, [trainings]);

  const rows = items.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [r.full_name, r.email, r.phone, r.city, r.district, r.education_field].join(" ").toLowerCase().includes(s);
  });

  const exportCsv = () => {
    const head = ["Program", "Full name", "Gender", "Email", "Phone", "Education field", "City", "District", "Date"];
    const body = rows.map((r) => [titleOf(r.training_id), r.full_name, r.gender, r.email, r.phone, r.education_field, r.city, r.district, r.created_at ?? ""]);
    const csv = [head, ...body].map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "training-registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <CardTitle className="font-display text-lg">Learner registrations ({rows.length})</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-48" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {trainings.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title_en || t.title_ar}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>Export CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No registrations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Education</TableHead>
                  <TableHead>City / District</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell className="text-xs">{titleOf(r.training_id)}</TableCell>
                    <TableCell className="text-xs">{r.gender || "—"}</TableCell>
                    <TableCell className="text-xs" dir="ltr">
                      <div>{r.email}</div>
                      <div className="text-muted-foreground">{r.phone}</div>
                    </TableCell>
                    <TableCell className="text-xs">{r.education_field || "—"}</TableCell>
                    <TableCell className="text-xs">{[r.city, r.district].filter(Boolean).join(" / ") || "—"}</TableCell>
                    <TableCell className="text-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await deleteRegistration(r.id);
                            await refresh();
                            toast.success("Removed");
                          } catch (e: any) {
                            toast.error(e?.message ?? "Delete failed");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
