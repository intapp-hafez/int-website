import type {
  Condition,
  ConditionGroup,
  Priority,
  RecommendedSolution,
  Rule,
} from "./recommendation-types";
import { PRIORITY_RANK } from "./recommendation-types";

function toNum(v: any): number {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? NaN : n;
}

function evalCondition(c: Condition, answers: Record<string, any>): boolean {
  const raw = answers[c.questionKey];
  if (raw === undefined || raw === null || raw === "") return false;
  const op = c.operator;
  const val = c.value;

  const numericOps: Record<string, boolean> = { gt: 1, lt: 1, gte: 1, lte: 1, between: 1 } as any;
  if (numericOps[op]) {
    const a = toNum(raw);
    const b = toNum(val);
    if (isNaN(a) || isNaN(b)) return false;
    if (op === "gt") return a > b;
    if (op === "lt") return a < b;
    if (op === "gte") return a >= b;
    if (op === "lte") return a <= b;
    if (op === "between") {
      const b2 = toNum(c.value2);
      if (isNaN(b2)) return false;
      const lo = Math.min(b, b2), hi = Math.max(b, b2);
      return a >= lo && a <= hi;
    }
  }

  if (op === "eq") {
    if (typeof raw === "boolean") return raw === (val === true || val === "true" || val === "yes");
    return String(raw).toLowerCase() === String(val).toLowerCase();
  }
  if (op === "neq") return String(raw).toLowerCase() !== String(val).toLowerCase();
  if (op === "contains") {
    if (Array.isArray(raw)) return raw.map((x) => String(x).toLowerCase()).includes(String(val).toLowerCase());
    return String(raw).toLowerCase().includes(String(val).toLowerCase());
  }
  if (op === "in") {
    const list = String(val).split(",").map((s) => s.trim().toLowerCase());
    if (Array.isArray(raw)) return raw.some((x) => list.includes(String(x).toLowerCase()));
    return list.includes(String(raw).toLowerCase());
  }
  return false;
}

function evalGroup(g: ConditionGroup, answers: Record<string, any>): boolean {
  if (!g.conditions.length) return false;
  return g.logic === "and"
    ? g.conditions.every((c) => evalCondition(c, answers))
    : g.conditions.some((c) => evalCondition(c, answers));
}

export function evaluateRules(
  rules: Rule[],
  answers: Record<string, any>,
  businessTypeKey: string,
  solutionDefaultPriority: (solutionKey: string) => Priority,
): RecommendedSolution[] {
  const byKey = new Map<string, RecommendedSolution>();
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.businessTypeKey && rule.businessTypeKey !== businessTypeKey) continue;
    if (!rule.groups.length) continue;
    const groupResults = rule.groups.map((g) => evalGroup(g, answers));
    const matched = rule.groupLogic === "and" ? groupResults.every(Boolean) : groupResults.some(Boolean);
    if (!matched) continue;
    for (const a of rule.actions) {
      const prio = a.priority ?? solutionDefaultPriority(a.solutionKey);
      const existing = byKey.get(a.solutionKey);
      if (existing) {
        if (PRIORITY_RANK[prio] > PRIORITY_RANK[existing.priority]) existing.priority = prio;
        if (a.reason_en && !existing.reasons_en.includes(a.reason_en)) existing.reasons_en.push(a.reason_en);
        if (a.reason_ar && !existing.reasons_ar.includes(a.reason_ar)) existing.reasons_ar.push(a.reason_ar);
      } else {
        byKey.set(a.solutionKey, {
          solutionKey: a.solutionKey,
          priority: prio,
          reasons_en: a.reason_en ? [a.reason_en] : [],
          reasons_ar: a.reason_ar ? [a.reason_ar] : [],
        });
      }
    }
  }
  return [...byKey.values()].sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
}