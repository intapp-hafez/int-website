import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRecommendations } from "@/lib/recommendations-store";
import { RuleBuilder } from "@/components/recommendations/RuleBuilder";
import { Plus, Trash2, RefreshCcw, Sparkles } from "lucide-react";
import type { Priority, QuestionType } from "@/lib/recommendation-types";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/recommendations")({
  head: () => ({ meta: [{ title: "Smart Recommendations — Admin" }] }),
  component: AdminRecoPage,
});

function AdminRecoPage() {
  const _perms = useCurrentPagePerms();
  const r = useRecommendations();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-accent" /> Smart Recommendations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage business types, questions, solutions and rules used by the client assessment.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { if (confirm("Reset to seed data?")) { r.resetSeed(); toast.success("Reset to defaults"); } }}>
          <RefreshCcw className="h-4 w-4 me-2" /> Reset seed
        </Button>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="types">Business Types</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="mt-4"><BusinessTypesTab /></TabsContent>
        <TabsContent value="questions" className="mt-4"><QuestionsTab /></TabsContent>
        <TabsContent value="solutions" className="mt-4"><SolutionsTab /></TabsContent>
        <TabsContent value="rules" className="mt-4"><RulesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function BusinessTypesTab() {
  const _perms = useCurrentPagePerms();
  const { businessTypes, upsertBusinessType, removeBusinessType } = useRecommendations();
  const [d, setD] = useState({ key: "", name_en: "", name_ar: "" });
  const list = [...businessTypes].sort((a, b) => a.sort_order - b.sort_order);
  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 grid md:grid-cols-4 gap-2 items-end">
        <div><Label>Key</Label><Input value={d.key} onChange={(e) => setD({ ...d, key: e.target.value })} placeholder="hospital" /></div>
        <div><Label>Name (EN)</Label><Input value={d.name_en} onChange={(e) => setD({ ...d, name_en: e.target.value })} /></div>
        <div dir="rtl"><Label className="text-right block font-arabic">الاسم (AR)</Label><Input dir="rtl" className="text-right font-arabic" value={d.name_ar} onChange={(e) => setD({ ...d, name_ar: e.target.value })} /></div>
        <Button disabled={!_perms.edit} onClick={() => { if (!d.key) return toast.error("Key required"); upsertBusinessType(d as any); setD({ key: "", name_en: "", name_ar: "" }); toast.success("Added"); }}><Plus className="h-4 w-4 me-2" /> Add</Button>
      </CardContent></Card>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((b) => (
          <Card key={b.id}><CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs px-2 py-0.5 rounded bg-muted">{b.key}</code>
              <div className="flex items-center gap-2">
                <Switch checked={b.active} onCheckedChange={(v) => upsertBusinessType({ ...b, active: v })} />
                <Button disabled={!_perms.delete} variant="ghost" size="sm" onClick={() => removeBusinessType(b.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <Input value={b.name_en} onChange={(e) => upsertBusinessType({ ...b, name_en: e.target.value })} />
            <Input dir="rtl" className="text-right font-arabic" value={b.name_ar} onChange={(e) => upsertBusinessType({ ...b, name_ar: e.target.value })} />
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

function QuestionsTab() {
  const _perms = useCurrentPagePerms();
  const { sections, questions, upsertSection, removeSection, upsertQuestion, removeQuestion } = useRecommendations();
  const [newSec, setNewSec] = useState({ title_en: "", title_ar: "" });
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-6">
      <Card><CardContent className="p-4 grid md:grid-cols-4 gap-2 items-end">
        <div className="md:col-span-2"><Label>New section (EN)</Label><Input value={newSec.title_en} onChange={(e) => setNewSec({ ...newSec, title_en: e.target.value })} /></div>
        <div dir="rtl"><Label className="text-right block font-arabic">قسم جديد (AR)</Label><Input dir="rtl" className="text-right font-arabic" value={newSec.title_ar} onChange={(e) => setNewSec({ ...newSec, title_ar: e.target.value })} /></div>
        <Button disabled={!_perms.edit} onClick={() => { if (!newSec.title_en) return; upsertSection(newSec as any); setNewSec({ title_en: "", title_ar: "" }); }}><Plus className="h-4 w-4 me-2" /> Add section</Button>
      </CardContent></Card>

      {sorted.map((sec) => {
        const qs = questions.filter((q) => q.sectionId === sec.id).sort((a, b) => a.order - b.order);
        return (
          <Card key={sec.id}><CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Input value={sec.title_en} onChange={(e) => upsertSection({ ...sec, title_en: e.target.value })} className="flex-1" />
              <Input dir="rtl" className="flex-1 text-right font-arabic" value={sec.title_ar} onChange={(e) => upsertSection({ ...sec, title_ar: e.target.value })} />
              <Button disabled={!_perms.delete} variant="ghost" size="sm" onClick={() => removeSection(sec.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {qs.map((q) => (
                <div key={q.id} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-2 bg-muted/30">
                  <Input className="col-span-2" value={q.key} onChange={(e) => upsertQuestion({ ...q, key: e.target.value })} placeholder="key" />
                  <Input className="col-span-3" value={q.label_en} onChange={(e) => upsertQuestion({ ...q, label_en: e.target.value })} placeholder="Label EN" />
                  <Input className="col-span-3 text-right font-arabic" dir="rtl" value={q.label_ar} onChange={(e) => upsertQuestion({ ...q, label_ar: e.target.value })} placeholder="التسمية" />
                  <Select value={q.type} onValueChange={(v) => upsertQuestion({ ...q, type: v as QuestionType })}>
                    <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="multi-select">Multi-select</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="col-span-1 flex items-center gap-1"><Switch checked={q.enabled} onCheckedChange={(v) => upsertQuestion({ ...q, enabled: v })} /></div>
                  <Button disabled={!_perms.delete} variant="ghost" size="sm" className="col-span-1" onClick={() => removeQuestion(q.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button disabled={!_perms.add} size="sm" variant="outline" onClick={() => upsertQuestion({ sectionId: sec.id, key: `q_${Date.now().toString(36)}`, label_en: "New question", label_ar: "سؤال جديد", type: "text", enabled: true, order: qs.length })}>
                <Plus className="h-3.5 w-3.5 me-1" /> Add question
              </Button>
            </div>
          </CardContent></Card>
        );
      })}
    </div>
  );
}

function SolutionsTab() {
  const _perms = useCurrentPagePerms();
  const { categories, solutions, upsertCategory, removeCategory, upsertSolution, removeSolution } = useRecommendations();
  const [nc, setNc] = useState({ key: "", name_en: "", name_ar: "" });
  return (
    <div className="space-y-6">
      <Card><CardContent className="p-4 space-y-3">
        <div className="text-sm font-semibold">Categories</div>
        <div className="grid md:grid-cols-4 gap-2 items-end">
          <div><Label>Key</Label><Input value={nc.key} onChange={(e) => setNc({ ...nc, key: e.target.value })} /></div>
          <div><Label>Name EN</Label><Input value={nc.name_en} onChange={(e) => setNc({ ...nc, name_en: e.target.value })} /></div>
          <div dir="rtl"><Label className="text-right block font-arabic">الاسم AR</Label><Input dir="rtl" className="text-right font-arabic" value={nc.name_ar} onChange={(e) => setNc({ ...nc, name_ar: e.target.value })} /></div>
          <Button disabled={!_perms.edit} onClick={() => { if (!nc.key) return; upsertCategory(nc as any); setNc({ key: "", name_en: "", name_ar: "" }); }}><Plus className="h-4 w-4 me-2" />Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-2 bg-muted rounded-full px-3 py-1 text-xs">
              {c.name_en} <code className="opacity-60">{c.key}</code>
              <button onClick={() => removeCategory(c.id)}><Trash2 className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      </CardContent></Card>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Solutions ({solutions.length})</div>
        <Button disabled={!_perms.add} size="sm" variant="outline" onClick={() => upsertSolution({ key: `sol_${Date.now().toString(36)}`, categoryKey: categories[0]?.key ?? "", name_en: "New solution", name_ar: "حل جديد", description_en: "", description_ar: "", defaultPriority: "medium", benefits_en: [], benefits_ar: [], nextStep_en: "", nextStep_ar: "" })}>
          <Plus className="h-4 w-4 me-2" /> Add solution
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {solutions.map((s) => (
          <Card key={s.id}><CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <code className="text-xs px-2 py-0.5 rounded bg-muted">{s.key}</code>
              <Button disabled={!_perms.delete} variant="ghost" size="sm" onClick={() => removeSolution(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input value={s.name_en} onChange={(e) => upsertSolution({ ...s, name_en: e.target.value })} placeholder="Name EN" />
              <Input dir="rtl" className="text-right font-arabic" value={s.name_ar} onChange={(e) => upsertSolution({ ...s, name_ar: e.target.value })} placeholder="الاسم" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={s.categoryKey} onValueChange={(v) => upsertSolution({ ...s, categoryKey: v })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.key} value={c.key}>{c.name_en}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={s.defaultPriority} onValueChange={(v) => upsertSolution({ ...s, defaultPriority: v as Priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea rows={2} value={s.description_en} onChange={(e) => upsertSolution({ ...s, description_en: e.target.value })} placeholder="Description EN" />
            <Textarea rows={2} dir="rtl" className="text-right font-arabic" value={s.description_ar} onChange={(e) => upsertSolution({ ...s, description_ar: e.target.value })} placeholder="الوصف" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={s.nextStep_en} onChange={(e) => upsertSolution({ ...s, nextStep_en: e.target.value })} placeholder="Next step EN" />
              <Input dir="rtl" className="text-right font-arabic" value={s.nextStep_ar} onChange={(e) => upsertSolution({ ...s, nextStep_ar: e.target.value })} placeholder="الخطوة التالية" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input value={s.benefits_en.join(", ")} onChange={(e) => upsertSolution({ ...s, benefits_en: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} placeholder="Benefits EN (comma sep)" />
              <Input dir="rtl" className="text-right font-arabic" value={s.benefits_ar.join("، ")} onChange={(e) => upsertSolution({ ...s, benefits_ar: e.target.value.split(/[,،]/).map((x) => x.trim()).filter(Boolean) })} placeholder="الفوائد (بفواصل)" />
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

function RulesTab() {
  const _perms = useCurrentPagePerms();
  const { rules, questions, solutions, businessTypes, upsertRule, removeRule } = useRecommendations();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button disabled={!_perms.add} size="sm" onClick={() => upsertRule({ name: "New rule", groupLogic: "and", groups: [{ logic: "and", conditions: [] }], actions: [], enabled: true })}>
          <Plus className="h-4 w-4 me-2" /> New rule
        </Button>
      </div>
      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id}><CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Badge variant={rule.enabled ? "default" : "secondary"}>{rule.enabled ? "Enabled" : "Disabled"}</Badge>
              <div className="flex items-center gap-3">
                <Select value={rule.businessTypeKey ?? "*"} onValueChange={(v) => upsertRule({ ...rule, businessTypeKey: v === "*" ? undefined : v })}>
                  <SelectTrigger className="h-8 w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">All business types</SelectItem>
                    {businessTypes.map((b) => <SelectItem key={b.key} value={b.key}>{b.name_en}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Switch checked={rule.enabled} onCheckedChange={(v) => upsertRule({ ...rule, enabled: v })} />
                <Button disabled={!_perms.delete} variant="ghost" size="sm" onClick={() => removeRule(rule.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <RuleBuilder rule={rule} questions={questions} solutions={solutions} onChange={(r) => upsertRule(r)} />
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}