import type { Condition, ConditionGroup, Operator, Question, Rule, RuleAction, Solution } from "@/lib/recommendation-types";
import { OPERATOR_LABELS } from "@/lib/recommendation-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  rule: Rule;
  questions: Question[];
  solutions: Solution[];
  onChange: (r: Rule) => void;
};

const OPS: Operator[] = ["eq", "neq", "gt", "lt", "gte", "lte", "between", "contains", "in"];

export function RuleBuilder({ rule, questions, solutions, onChange }: Props) {
  const patch = (u: Partial<Rule>) => onChange({ ...rule, ...u });
  const patchGroup = (gi: number, u: Partial<ConditionGroup>) => patch({ groups: rule.groups.map((g, i) => i === gi ? { ...g, ...u } : g) });
  const patchCond = (gi: number, ci: number, u: Partial<Condition>) => patchGroup(gi, { conditions: rule.groups[gi].conditions.map((c, i) => i === ci ? { ...c, ...u } : c) });

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Rule name</Label>
          <Input value={rule.name} onChange={(e) => patch({ name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Group logic</Label>
          <Select value={rule.groupLogic} onValueChange={(v) => patch({ groupLogic: v as "and" | "or" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="and">All groups must match (AND)</SelectItem>
              <SelectItem value="or">Any group matches (OR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {rule.groups.map((g, gi) => (
          <div key={gi} className="border rounded-xl p-3 bg-muted/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Group {gi + 1}</span>
                <Select value={g.logic} onValueChange={(v) => patchGroup(gi, { logic: v as "and" | "or" })}>
                  <SelectTrigger className="h-7 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="and">AND</SelectItem>
                    <SelectItem value="or">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => patch({ groups: rule.groups.filter((_, i) => i !== gi) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {g.conditions.map((c, ci) => (
              <div key={ci} className="grid grid-cols-12 gap-2 items-center">
                <Select value={c.questionKey} onValueChange={(v) => patchCond(gi, ci, { questionKey: v })}>
                  <SelectTrigger className="col-span-5"><SelectValue placeholder="Question" /></SelectTrigger>
                  <SelectContent>
                    {questions.map((q) => <SelectItem key={q.key} value={q.key}>{q.label_en}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={c.operator} onValueChange={(v) => patchCond(gi, ci, { operator: v as Operator })}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPS.map((o) => <SelectItem key={o} value={o}>{OPERATOR_LABELS[o]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input className="col-span-3" value={String(c.value ?? "")} onChange={(e) => patchCond(gi, ci, { value: e.target.value })} placeholder="Value" />
                <Button type="button" variant="ghost" size="sm" className="col-span-1" onClick={() => patchGroup(gi, { conditions: g.conditions.filter((_, i) => i !== ci) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                {c.operator === "between" && (
                  <Input className="col-span-12 md:col-span-3 md:col-start-9" value={String(c.value2 ?? "")} onChange={(e) => patchCond(gi, ci, { value2: e.target.value })} placeholder="… and" />
                )}
              </div>
            ))}

            <Button type="button" size="sm" variant="outline" onClick={() => patchGroup(gi, { conditions: [...g.conditions, { questionKey: questions[0]?.key ?? "", operator: "eq", value: "" }] })}>
              <Plus className="h-3.5 w-3.5 me-1" /> Add condition
            </Button>
          </div>
        ))}

        <Button type="button" size="sm" variant="outline" onClick={() => patch({ groups: [...rule.groups, { logic: "and", conditions: [] }] })}>
          <Plus className="h-3.5 w-3.5 me-1" /> Add group
        </Button>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Then recommend</div>
        {rule.actions.map((a, ai) => (
          <div key={ai} className="grid grid-cols-12 gap-2 items-start bg-card border rounded-xl p-3">
            <Select value={a.solutionKey} onValueChange={(v) => patch({ actions: rule.actions.map((x, i) => i === ai ? { ...x, solutionKey: v } : x) })}>
              <SelectTrigger className="col-span-4"><SelectValue placeholder="Solution" /></SelectTrigger>
              <SelectContent>
                {solutions.map((s) => <SelectItem key={s.key} value={s.key}>{s.name_en}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={a.priority ?? "auto"} onValueChange={(v) => patch({ actions: rule.actions.map((x, i) => i === ai ? { ...x, priority: v === "auto" ? undefined : (v as any) } : x) })}>
              <SelectTrigger className="col-span-2"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Default</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
              </SelectContent>
            </Select>
            <Input className="col-span-3" placeholder="Reason (EN)" value={a.reason_en} onChange={(e) => patch({ actions: rule.actions.map((x, i) => i === ai ? { ...x, reason_en: e.target.value } : x) })} />
            <Input className="col-span-2 font-arabic text-right" dir="rtl" placeholder="السبب" value={a.reason_ar} onChange={(e) => patch({ actions: rule.actions.map((x, i) => i === ai ? { ...x, reason_ar: e.target.value } : x) })} />
            <Button type="button" variant="ghost" size="sm" className="col-span-1" onClick={() => patch({ actions: rule.actions.filter((_, i) => i !== ai) })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => patch({ actions: [...rule.actions, { solutionKey: solutions[0]?.key ?? "", reason_en: "", reason_ar: "" } as RuleAction] })}>
          <Plus className="h-3.5 w-3.5 me-1" /> Add recommendation
        </Button>
      </div>
    </div>
  );
}