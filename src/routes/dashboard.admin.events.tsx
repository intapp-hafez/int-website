import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Pencil, Loader2, Upload, Plus, Calendar, MapPin, Users, Presentation } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  deleteEventRegistration,
  deleteEvent,
  emptyEvent,
  saveEvent,
  useEventRegistrations,
  useEvents,
  type EventRow,
  type EventPartner,
  type EventSpeaker,
  type EventAgendaItem,
} from "@/lib/events";

export const Route = createFileRoute("/dashboard/admin/events")({
  head: () => ({ meta: [{ title: "Events — Admin" }] }),
  component: EventsAdminPage,
});

const MAX_BYTES = 5 * 1024 * 1024;

async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > MAX_BYTES) throw new Error("Image too large. Max 5 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("slide-images").upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("slide-images").getPublicUrl(path).data.publicUrl;
}

type Draft = Omit<EventRow, "id"> & { id?: string };

function EventsAdminPage() {
  const { items, loading, refresh } = useEvents();
  const [tab, setTab] = useState("list");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({ ...emptyEvent });

  const edit = (row: EventRow) => {
    setDraft({ ...row });
    setModalOpen(true);
  };

  const createNew = () => {
    setDraft({ ...emptyEvent });
    setModalOpen(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(id);
      toast.success("Deleted");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Publish events and review registrations.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">Events ({items.length})</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">Published Events</CardTitle>
              <Button onClick={createNew} size="sm"><Plus className="h-4 w-4 me-1" /> Create New Event</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Nothing published yet.
                  <Button variant="link" onClick={createNew}><Plus className="h-4 w-4 me-1" />Add the first one</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Title</TableHead>
                      <TableHead>Category</TableHead>
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
                            <span>{row.title}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{row.category}</Badge></TableCell>
                        <TableCell className="text-xs">{row.start_date ?? "—"}{row.end_date && row.end_date !== row.start_date ? ` → ${row.end_date}` : ""}</TableCell>
                        <TableCell>{row.active ? <Badge>{row.status}</Badge> : <Badge variant="outline">Hidden</Badge>}</TableCell>
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

        <TabsContent value="registrations" className="mt-0">
          <RegistrationsPanel events={items} />
        </TabsContent>
      </Tabs>

      {modalOpen && (
        <EventFormModal 
          draft={draft} 
          onClose={() => setModalOpen(false)} 
          onSaved={async () => {
            setModalOpen(false);
            await refresh();
          }} 
        />
      )}
    </div>
  );
}

function EventFormModal({ draft: initial, onClose, onSaved }: { draft: Draft, onClose: () => void, onSaved: () => void }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const submit = async () => {
    if (!draft.title.trim()) return toast.error("Event Title is required");
    setSaving(true);
    try {
      await saveEvent(draft);
      toast.success(draft.id ? "Updated" : "Published");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-xl">Create New {draft.category || "Summit / Event"}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Set up title, rich summary, location map, partner logos, and agenda</p>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <div className="border-b px-6">
            <TabsList className="bg-transparent border-b-0 h-auto p-0 flex space-x-6">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent">1. Overview & Capacity</TabsTrigger>
              <TabsTrigger value="date" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent">2. Date, Venue & Map</TabsTrigger>
              <TabsTrigger value="banner" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent">3. Banner Image</TabsTrigger>
              <TabsTrigger value="partners" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent">4. Partners & Logos ({draft.partners.length})</TabsTrigger>
              <TabsTrigger value="agenda" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent">5. Speakers & Agenda</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <TabsContent value="overview" className="mt-0 space-y-5">
              <div className="space-y-1.5">
                <Label>Event Title <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. INT Security Technology Summit 2026" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Event Category</Label>
                  <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Summit">Summit</SelectItem>
                      <SelectItem value="Conference">Conference</SelectItem>
                      <SelectItem value="Webinar">Webinar</SelectItem>
                      <SelectItem value="Workshop">Workshop</SelectItem>
                      <SelectItem value="Exhibition">Exhibition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Registration Open">Registration Open</SelectItem>
                      <SelectItem value="Registration Closed">Registration Closed</SelectItem>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Total Capacity Seats <span className="text-red-500">*</span></Label>
                  <Input type="number" placeholder="250" value={draft.capacity || ""} onChange={(e) => setDraft({ ...draft, capacity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Current Registered</Label>
                  <Input readOnly disabled value="0" className="bg-muted" />
                </div>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Summary & Objectives (Rich Text Editor)</Label>
                  <span className="text-xs text-muted-foreground">Supports bold, headings, bullet lists, blockquotes & hyperlinks</span>
                </div>
                <div className="border rounded-md bg-white">
                  <RichTextEditor value={draft.summary} onChange={(v) => setDraft({ ...draft, summary: v })} minHeight="200px" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="date" className="mt-0 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Event Start Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={draft.start_date || ""} onChange={(e) => setDraft({ ...draft, start_date: e.target.value || null })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Event End Date</Label>
                  <Input type="date" value={draft.end_date || ""} onChange={(e) => setDraft({ ...draft, end_date: e.target.value || null })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input placeholder="09:00 AM" value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input placeholder="05:00 PM" value={draft.end_time} onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>City & Country</Label>
                  <Input placeholder="Cairo, Egypt" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Venue Name & Hall</Label>
                  <Input placeholder="INT Headquarters, Grand Hall" value={draft.venue} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5 bg-white p-4 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-1.5 text-orange-600"><MapPin className="h-4 w-4" /> Venue Location Map URL (Google Maps)</Label>
                  {draft.map_url && <a href={draft.map_url} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:underline flex items-center gap-1">Preview Map Link <Plus className="h-3 w-3 rotate-45" /></a>}
                </div>
                <Input placeholder="https://maps.google.com/?q=Cairo,Egypt" value={draft.map_url} onChange={(e) => setDraft({ ...draft, map_url: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1.5">Attendees will be able to click this link directly from their digital passes and event details.</p>
              </div>
            </TabsContent>

            <TabsContent value="banner" className="mt-0 space-y-4">
              <div className="space-y-3">
                <Label>Event Hero Banner Image</Label>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Upload image file:</span>
                    <label className="border-2 border-dashed border-orange-200 bg-orange-50/30 rounded-lg p-10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-orange-50 transition-colors text-center h-40">
                      <Upload className="h-6 w-6 text-orange-500" />
                      <div>
                        <div className="font-medium text-sm text-foreground">Choose Banner Image</div>
                        <div className="text-xs text-muted-foreground">PNG, JPG or WebP</div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadImage(file, "trainings");
                            setDraft((d) => ({ ...d, banner_url: url }));
                            toast.success("Uploaded successfully");
                          } catch (err: any) {
                            toast.error(err?.message ?? "Upload failed");
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Or paste image URL:</span>
                    <Input placeholder="https://images.unsplash.com/..." value={draft.banner_url} onChange={(e) => setDraft({ ...draft, banner_url: e.target.value })} className="mb-4" />
                    {draft.banner_url && (
                      <div className="border rounded-md overflow-hidden h-24 bg-black/5 relative">
                        <img src={draft.banner_url} alt="Banner Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="partners" className="mt-0 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-sm uppercase tracking-wide">Participating Partners & Exhibitor Logos</h3>
                    <p className="text-xs text-muted-foreground">Upload logos and define tiers for each sponsoring company.</p>
                  </div>
                  <Button variant="secondary" size="sm" className="bg-orange-100 text-orange-700 hover:bg-orange-200" onClick={() => setDraft(d => ({ ...d, partners: [...d.partners, { id: crypto.randomUUID(), name: "", tier: "", logo_url: "" }] }))}>
                    <Plus className="h-4 w-4 me-1" /> Add Partner
                  </Button>
                </div>

                <div className="space-y-4">
                  {draft.partners.length === 0 && (
                    <div className="text-center py-8 border rounded-md border-dashed bg-white">
                      <p className="text-sm text-muted-foreground">No partners added yet.</p>
                    </div>
                  )}
                  {draft.partners.map((p, i) => (
                    <div key={p.id} className="border rounded-md bg-white p-4 relative">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">Partner #{i + 1}</h4>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => setDraft(d => ({ ...d, partners: d.partners.filter(x => x.id !== p.id) }))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Company Name</Label>
                          <Input value={p.name} onChange={(e) => {
                            const newArr = [...draft.partners];
                            newArr[i].name = e.target.value;
                            setDraft({ ...draft, partners: newArr });
                          }} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Category / Sponsor Tier</Label>
                          <Input placeholder="Unified Security Partner" value={p.tier} onChange={(e) => {
                            const newArr = [...draft.partners];
                            newArr[i].tier = e.target.value;
                            setDraft({ ...draft, partners: newArr });
                          }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 bg-slate-50 border rounded flex items-center justify-center shrink-0 overflow-hidden">
                          {p.logo_url ? <img src={p.logo_url} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] text-muted-foreground">No Logo</span>}
                        </div>
                        <label className="border px-3 py-1.5 rounded text-sm text-orange-600 flex items-center gap-2 cursor-pointer hover:bg-orange-50 transition-colors">
                          <Upload className="h-3 w-3" /> Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await uploadImage(file, "trainings");
                              const newArr = [...draft.partners];
                              newArr[i].logo_url = url;
                              setDraft({ ...draft, partners: newArr });
                              toast.success("Logo uploaded");
                            } catch (err: any) {
                              toast.error(err?.message ?? "Upload failed");
                            }
                          }} />
                        </label>
                        <Input placeholder="or paste logo URL" className="flex-1" value={p.logo_url} onChange={(e) => {
                            const newArr = [...draft.partners];
                            newArr[i].logo_url = e.target.value;
                            setDraft({ ...draft, partners: newArr });
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="agenda" className="mt-0 space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-sm uppercase tracking-wide">Keynote Speakers ({draft.speakers.length})</h3>
                  <Button variant="secondary" size="sm" className="bg-orange-100 text-orange-700 hover:bg-orange-200" onClick={() => setDraft(d => ({ ...d, speakers: [...d.speakers, { id: crypto.randomUUID(), name: "", role: "", company: "" }] }))}>
                    <Plus className="h-4 w-4 me-1" /> Add Speaker
                  </Button>
                </div>
                <div className="space-y-3">
                  {draft.speakers.map((s, i) => (
                    <div key={s.id} className="flex flex-col sm:flex-row items-center gap-2 bg-white border rounded p-2">
                      <Input placeholder="Speaker Name" value={s.name} className="flex-1" onChange={(e) => {
                          const newArr = [...draft.speakers];
                          newArr[i].name = e.target.value;
                          setDraft({ ...draft, speakers: newArr });
                        }} />
                      <Input placeholder="Role / Title" value={s.role} className="flex-1" onChange={(e) => {
                          const newArr = [...draft.speakers];
                          newArr[i].role = e.target.value;
                          setDraft({ ...draft, speakers: newArr });
                        }} />
                      <Input placeholder="Company" value={s.company} className="flex-1" onChange={(e) => {
                          const newArr = [...draft.speakers];
                          newArr[i].company = e.target.value;
                          setDraft({ ...draft, speakers: newArr });
                        }} />
                      <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:bg-destructive/10" onClick={() => setDraft(d => ({ ...d, speakers: d.speakers.filter(x => x.id !== s.id) }))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {draft.speakers.length === 0 && <p className="text-sm text-muted-foreground">No speakers added.</p>}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-sm uppercase tracking-wide">Agenda Timeline ({draft.agenda.length})</h3>
                  <Button variant="secondary" size="sm" className="bg-orange-100 text-orange-700 hover:bg-orange-200" onClick={() => setDraft(d => ({ ...d, agenda: [...d.agenda, { id: crypto.randomUUID(), time: "", description: "" }] }))}>
                    <Plus className="h-4 w-4 me-1" /> Add Timeline Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {draft.agenda.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-2 bg-white border rounded p-2">
                      <Input placeholder="09:00 AM" value={a.time} className="w-32 shrink-0" onChange={(e) => {
                          const newArr = [...draft.agenda];
                          newArr[i].time = e.target.value;
                          setDraft({ ...draft, agenda: newArr });
                        }} />
                      <Input placeholder="Timeline Description" value={a.description} className="flex-1" onChange={(e) => {
                          const newArr = [...draft.agenda];
                          newArr[i].description = e.target.value;
                          setDraft({ ...draft, agenda: newArr });
                        }} />
                      <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:bg-destructive/10" onClick={() => setDraft(d => ({ ...d, agenda: d.agenda.filter(x => x.id !== a.id) }))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {draft.agenda.length === 0 && <p className="text-sm text-muted-foreground">No agenda items added.</p>}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="px-6 py-4 border-t flex items-center justify-between bg-white">
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={draft.active} onCheckedChange={(v: boolean) => setDraft({ ...draft, active: v })} />
              <span className="text-sm text-muted-foreground">Published</span>
            </div>
            <Button onClick={submit} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6">
              {saving ? "Saving…" : draft.id ? "Save Changes" : "Create & Publish Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RegistrationsPanel({ events }: { events: EventRow[] }) {
  const [filter, setFilter] = useState<string>("all");
  const { items, loading, refresh } = useEventRegistrations(filter === "all" ? undefined : filter);
  const [q, setQ] = useState("");

  const titleOf = useMemo(() => {
    const map = new Map(events.map((t) => [t.id, t.title]));
    return (id: string) => map.get(id) ?? "—";
  }, [events]);

  const rows = items.filter((r) => {
    if (filter === "all" && !events.some(e => e.id === r.event_id)) return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [r.full_name, r.email, r.phone, r.organization, r.job_title, r.city].join(" ").toLowerCase().includes(s);
  });

  const exportCsv = () => {
    const head = ["Event", "Full name", "Gender", "Email", "Phone", "Organization", "Job Title", "Representatives", "Dates", "Sector", "Travel", "Transportation", "Check-in", "Check-out", "Special Requests", "City", "Date"];
    const body = rows.map((r) => [titleOf(r.event_id), r.full_name, r.gender, r.email, r.phone, r.organization, r.job_title, r.number_of_representatives, r.dates_to_attend, r.sector, r.willing_to_travel, r.transportation_requirement, r.check_in_details, r.check_out_details, r.special_requests, r.city, r.created_at ?? ""]);
    const csv = [head, ...body].map((line) => line.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "event-registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <CardTitle className="font-display text-lg">Registrations ({rows.length})</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-48" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {events.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
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
                  <TableHead>Event</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tickets & Dates</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Logistics</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell className="text-xs">{titleOf(r.event_id)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-slate-800">{r.organization || "—"}</div>
                      <div className="text-muted-foreground">{r.job_title}</div>
                    </TableCell>
                    <TableCell className="text-xs" dir="ltr">
                      <div>{r.email}</div>
                      <div className="text-muted-foreground">{r.phone}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{r.number_of_representatives}</Badge>
                        <span className="text-muted-foreground">{r.dates_to_attend}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{r.sector || "—"}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={`Travel: ${r.willing_to_travel} | Transport: ${r.transportation_requirement} | Check-in: ${r.check_in_details} | Check-out: ${r.check_out_details} | Notes: ${r.special_requests}`}>
                      <div className="font-medium">{r.transportation_requirement !== "None" ? r.transportation_requirement : "Self-arranged"}</div>
                      {(r.check_in_details || r.special_requests) && <div className="text-muted-foreground truncate">Has notes</div>}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await deleteEventRegistration(r.id);
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
