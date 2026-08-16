import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Sparkles, Users } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminT } from "@/lib/admin-i18n";
import { JOB_TEMPLATES } from "@/lib/career-templates";
import { assertBilingualPairs } from "@/lib/products";
import { mockJobs } from "@/data/careers-mock";

export const Route = createFileRoute("/dashboard/admin/careers/")({
  component: JobsAdmin,
});

type Job = {
  id: string;
  title_en: string; title_ar: string;
  department_en: string; department_ar: string;
  location_en: string; location_ar: string;
  description_en: string; description_ar: string;
  responsibilities_en: string; responsibilities_ar: string;
  requirements_en: string; requirements_ar: string;
  nice_to_have_en: string; nice_to_have_ar: string;
  benefits_en: string; benefits_ar: string;
  employment_type: "full_time" | "part_time" | "contract" | "internship";
  experience_level: "intern" | "junior" | "mid" | "senior" | "lead";
  remote_policy: "onsite" | "hybrid" | "remote";
  min_years_experience: number;
  openings: number;
  deadline: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  skills: string[];
  apply_email: string;
  active: boolean;
  sort_order: number;
};

const empty: Omit<Job, "id"> = {
  title_en: "", title_ar: "", department_en: "", department_ar: "",
  location_en: "", location_ar: "", description_en: "", description_ar: "",
  responsibilities_en: "", responsibilities_ar: "",
  requirements_en: "", requirements_ar: "",
  nice_to_have_en: "", nice_to_have_ar: "",
  benefits_en: "", benefits_ar: "",
  employment_type: "full_time", experience_level: "mid", remote_policy: "onsite",
  min_years_experience: 0, openings: 1, deadline: null,
  salary_min: null, salary_max: null, salary_currency: "USD",
  skills: [], apply_email: "",
  active: true, sort_order: 0,
};

function JobsAdmin() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [editing, setEditing] = useState<Job | (Omit<Job, "id"> & { id?: string }) | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");

  const filteredJobs = jobs.filter((j) => {
    if (filter === "active") return j.active;
    if (filter === "closed") return !j.active;
    return true;
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("career_jobs")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setJobs(data as any[]);
        setIsDemo(false);
      } else {
        setJobs(mockJobs as any[]);
        setIsDemo(true);
      }
    } catch {
      setJobs(mockJobs as any[]);
      setIsDemo(true);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const seedMockCareers = async () => {
    setSeeding(true);
    try {
      const payload = mockJobs.map(({ id, ...rest }) => rest);
      const { error } = await supabase.from("career_jobs").insert(payload as any);
      if (error) {
        toast.error("Database insert failed: " + error.message);
      } else {
        toast.success("Successfully added 5 mockup career opportunities!");
        await load();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to seed mockup careers");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    setSkillsInput(editing?.skills?.join(", ") ?? "");
  }, [editing?.id]);

  const save = async () => {
    if (!editing) return;
    try {
      assertBilingualPairs([
        { en: editing.title_en, ar: editing.title_ar, label: "Title" },
        { en: editing.department_en, ar: editing.department_ar, label: "Department" },
        { en: editing.description_en, ar: editing.description_ar, label: "Description" },
        { en: editing.responsibilities_en, ar: editing.responsibilities_ar, label: "Responsibilities" },
        { en: editing.requirements_en, ar: editing.requirements_ar, label: "Requirements" },
      ]);
    } catch (e: any) {
      toast.error(e.message);
      return;
    }
    if (!editing.experience_level) { toast.error("Experience level is required"); return; }
    if (editing.openings < 1) { toast.error("Openings must be at least 1"); return; }
    if (!editing.deadline) { toast.error("Application deadline is required"); return; }
    if (editing.salary_min !== null && editing.salary_max !== null && editing.salary_min > editing.salary_max) {
      toast.error("Salary min cannot exceed salary max"); return;
    }
    setSaving(true);
    const payload = {
      ...editing,
      skills: skillsInput.split(",").map(s => s.trim()).filter(Boolean),
      deadline: editing.deadline || null,
    };
    let error;
    if ("id" in editing && editing.id && !editing.id.startsWith("mock-")) {
      const { id, ...rest } = payload as Job;
      ({ error } = await supabase.from("career_jobs").update(rest).eq("id", id));
    } else {
      const { id: _, ...rest } = payload as any;
      ({ error } = await supabase.from("career_jobs").insert(rest));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this job posting?")) return;
    if (id.startsWith("mock-")) {
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success("Removed");
      return;
    }
    const { error } = await supabase.from("career_jobs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleActive = async (j: Job) => {
    if (j.id.startsWith("mock-")) {
      setJobs(prev => prev.map(item => item.id === j.id ? { ...item, active: !item.active } : item));
      return;
    }
    const { error } = await supabase.from("career_jobs").update({ active: !j.active }).eq("id", j.id);
    if (error) return toast.error(error.message);
    load();
  };

  const e = editing;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="text-xs text-muted-foreground">
          {isDemo ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
              <Sparkles className="h-3 w-3" /> Demo Mode ({jobs.length} mockup careers)
            </span>
          ) : (
            <span>Total jobs: <strong>{jobs.length}</strong></span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={seedMockCareers} disabled={seeding} className="gap-1.5 border-accent/30 text-accent hover:bg-accent/10">
            {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Populate Mock Careers</span>
          </Button>
          <Select onValueChange={(key) => {
            const t = JOB_TEMPLATES.find(x => x.key === key);
            if (t) setEditing({ ...empty, ...t.data });
          }}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="✨ Start from a template…" /></SelectTrigger>
            <SelectContent className="max-h-[60vh]">
              {JOB_TEMPLATES.map(t => (
                <SelectItem key={t.key} value={t.key}>
                  <div className="flex flex-col"><span>{t.label_en}</span><span className="text-[10px] text-muted-foreground" dir="rtl">{t.label_ar}</span></div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4 me-2" /> New job</Button>
        </div>
      </div>

      {isDemo && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-accent shrink-0" />
            <span>Currently previewing <strong>5 rich mockup career opportunities</strong>. You can click &quot;Populate Mock Careers&quot; to persist them into your database.</span>
          </div>
          <Button size="sm" onClick={seedMockCareers} disabled={seeding} className="gap-1.5">
            {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Save to Database
          </Button>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div> :
        jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">No job postings yet.</p>
              <Button onClick={seedMockCareers} disabled={seeding} className="gap-2">
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Populate Mockup Careers
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
              <TabsList className="grid w-full max-w-sm grid-cols-3">
                <TabsTrigger value="all">
                  <span className="flex items-center gap-1">
                    <span>All</span>
                    <span className="text-[10px] text-muted-foreground" dir="rtl">الكل</span>
                  </span>
                  <span className="ms-1">({jobs.length})</span>
                </TabsTrigger>
                <TabsTrigger value="active">
                  <span className="flex items-center gap-1">
                    <span>Active</span>
                    <span className="text-[10px] text-muted-foreground" dir="rtl">نشط</span>
                  </span>
                  <span className="ms-1">({jobs.filter(j => j.active).length})</span>
                </TabsTrigger>
                <TabsTrigger value="closed">
                  <span className="flex items-center gap-1">
                    <span>Closed</span>
                    <span className="text-[10px] text-muted-foreground" dir="rtl">مغلق</span>
                  </span>
                  <span className="ms-1">({jobs.filter(j => !j.active).length})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {filteredJobs.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No {filter} jobs found.</CardContent></Card> :
              <div className="grid gap-3">
                {filteredJobs.map(j => (
                  <Card key={j.id}>
                    <CardContent className="p-4 flex flex-wrap items-center gap-4">
                      <div className="flex-1 min-w-[240px]">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{j.title_en}</h3>
                          {!j.active && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Hidden</span>}
                          <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent capitalize">{j.experience_level}</span>
                          {j.id.startsWith("mock-") && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">Mockup</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {[j.department_en, j.location_en, j.employment_type.replace("_", " "), j.remote_policy, `${j.openings} opening${j.openings > 1 ? "s" : ""}`].filter(Boolean).join(" • ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to="/dashboard/admin/careers/applications"
                          search={{ job: j.id }}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border bg-background hover:bg-accent/10 hover:text-accent transition-colors"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>View applications</span>
                        </Link>
                        <Switch checked={j.active} onCheckedChange={() => toggleActive(j)} />
                        <Button size="sm" variant="outline" onClick={() => setEditing(j)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" onClick={() => remove(j.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
          </>
        )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{e && "id" in e && e.id ? "Edit job" : "New job"}</DialogTitle></DialogHeader>
          {e && (
            <div className="grid gap-4">
              <div className="rounded-md border bg-muted/30 p-3 flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground me-2">Prefill from template:</span>
                <Select onValueChange={(key) => {
                  const t = JOB_TEMPLATES.find(x => x.key === key);
                  if (t) setEditing({ ...e, ...t.data });
                }}>
                  <SelectTrigger className="h-8 w-[280px]"><SelectValue placeholder="Pick a template…" /></SelectTrigger>
                  <SelectContent className="max-h-[60vh]">
                    {JOB_TEMPLATES.map(t => (
                      <SelectItem key={t.key} value={t.key}>{t.label_en} <span className="text-muted-foreground">— {t.label_ar}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Title (EN) *</Label><Input value={e.title_en} onChange={ev => setEditing({ ...e, title_en: ev.target.value })} /></div>
                <div><Label>Title (AR) *</Label><Input dir="rtl" value={e.title_ar} onChange={ev => setEditing({ ...e, title_ar: ev.target.value })} /></div>
                <div><Label>Department (EN) *</Label><Input value={e.department_en} onChange={ev => setEditing({ ...e, department_en: ev.target.value })} /></div>
                <div><Label>Department (AR) *</Label><Input dir="rtl" value={e.department_ar} onChange={ev => setEditing({ ...e, department_ar: ev.target.value })} /></div>
                <div><Label>Location (EN)</Label><Input value={e.location_en} onChange={ev => setEditing({ ...e, location_en: ev.target.value })} /></div>
                <div><Label>Location (AR)</Label><Input dir="rtl" value={e.location_ar} onChange={ev => setEditing({ ...e, location_ar: ev.target.value })} /></div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label>Employment type</Label>
                  <Select value={e.employment_type} onValueChange={(v: any) => setEditing({ ...e, employment_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Experience level *</Label>
                  <Select value={e.experience_level} onValueChange={(v: any) => setEditing({ ...e, experience_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead / Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Work mode</Label>
                  <Select value={e.remote_policy} onValueChange={(v: any) => setEditing({ ...e, remote_policy: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Min. years experience</Label><Input type="number" min={0} value={e.min_years_experience} onChange={ev => setEditing({ ...e, min_years_experience: Number(ev.target.value) || 0 })} /></div>
                <div><Label>Openings *</Label><Input type="number" min={1} value={e.openings} onChange={ev => setEditing({ ...e, openings: Number(ev.target.value) || 1 })} /></div>
                <div><Label>Application deadline *</Label><Input type="date" value={e.deadline ?? ""} onChange={ev => setEditing({ ...e, deadline: ev.target.value || null })} /></div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div><Label>Salary min</Label><Input type="number" min={0} value={e.salary_min ?? ""} onChange={ev => setEditing({ ...e, salary_min: ev.target.value ? Number(ev.target.value) : null })} /></div>
                <div><Label>Salary max</Label><Input type="number" min={0} value={e.salary_max ?? ""} onChange={ev => setEditing({ ...e, salary_max: ev.target.value ? Number(ev.target.value) : null })} /></div>
                <div><Label>Currency</Label><Input maxLength={4} value={e.salary_currency} onChange={ev => setEditing({ ...e, salary_currency: ev.target.value.toUpperCase() })} /></div>
              </div>

              <div><Label>Skills (comma-separated)</Label><Input placeholder="React, TypeScript, SQL" value={skillsInput} onChange={ev => setSkillsInput(ev.target.value)} /></div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Job Description (EN) *</Label>
                  <span className="text-xs text-muted-foreground">Rich Text (LTR)</span>
                </div>
                <RichTextEditor
                  dir="ltr"
                  value={e.description_en}
                  onChange={(val) => setEditing({ ...e, description_en: val })}
                  placeholder="Comprehensive job role description in English..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>الوصف الوظيفي (AR) *</Label>
                  <span className="text-xs text-muted-foreground">محرر نصوص منسقة (RTL)</span>
                </div>
                <RichTextEditor
                  dir="rtl"
                  value={e.description_ar}
                  onChange={(val) => setEditing({ ...e, description_ar: val })}
                  placeholder="الوصف التفصيلي للدور الوظيفي بالعربية..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Responsibilities (EN) *</Label><Textarea rows={5} placeholder="One per line" value={e.responsibilities_en} onChange={ev => setEditing({ ...e, responsibilities_en: ev.target.value })} /></div>
                <div><Label>Responsibilities (AR) *</Label><Textarea dir="rtl" rows={5} value={e.responsibilities_ar} onChange={ev => setEditing({ ...e, responsibilities_ar: ev.target.value })} /></div>
                <div><Label>Requirements (EN) *</Label><Textarea rows={5} placeholder="One per line" value={e.requirements_en} onChange={ev => setEditing({ ...e, requirements_en: ev.target.value })} /></div>
                <div><Label>Requirements (AR) *</Label><Textarea dir="rtl" rows={5} value={e.requirements_ar} onChange={ev => setEditing({ ...e, requirements_ar: ev.target.value })} /></div>
                <div><Label>Nice to have (EN)</Label><Textarea rows={4} value={e.nice_to_have_en} onChange={ev => setEditing({ ...e, nice_to_have_en: ev.target.value })} /></div>
                <div><Label>Nice to have (AR)</Label><Textarea dir="rtl" rows={4} value={e.nice_to_have_ar} onChange={ev => setEditing({ ...e, nice_to_have_ar: ev.target.value })} /></div>
                <div><Label>Benefits (EN)</Label><Textarea rows={4} value={e.benefits_en} onChange={ev => setEditing({ ...e, benefits_en: ev.target.value })} /></div>
                <div><Label>Benefits (AR)</Label><Textarea dir="rtl" rows={4} value={e.benefits_ar} onChange={ev => setEditing({ ...e, benefits_ar: ev.target.value })} /></div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Apply email (optional)</Label><Input dir="ltr" type="email" placeholder="careers@company.com" value={e.apply_email} onChange={ev => setEditing({ ...e, apply_email: ev.target.value })} /></div>
                <div><Label>Sort order</Label><Input type="number" value={e.sort_order} onChange={ev => setEditing({ ...e, sort_order: Number(ev.target.value) || 0 })} /></div>
              </div>

              <div className="flex items-center gap-2"><Switch checked={e.active} onCheckedChange={(v) => setEditing({ ...e, active: v })} /><Label>Visible publicly</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
