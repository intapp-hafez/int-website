import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  Assessment,
  BusinessType,
  Priority,
  Question,
  Rule,
  Section,
  Solution,
  SolutionCategory,
} from "./recommendation-types";
import {
  seedBusinessTypes,
  seedCategories,
  seedQuestions,
  seedRules,
  seedSections,
  seedSolutions,
} from "@/data/recommendation-seed";

const KEYS = {
  bt: "it_reco_business_types_v1",
  sec: "it_reco_sections_v1",
  q: "it_reco_questions_v1",
  cat: "it_reco_categories_v1",
  sol: "it_reco_solutions_v1",
  rule: "it_reco_rules_v1",
  a: "it_reco_assessments_v1",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as unknown as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, val: T) {
  try { window.localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function uid(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID().slice(0, 8)}`
    : `${prefix}-${Date.now().toString(36)}`;
}

type Ctx = {
  loading: boolean;
  businessTypes: BusinessType[];
  sections: Section[];
  questions: Question[];
  categories: SolutionCategory[];
  solutions: Solution[];
  rules: Rule[];
  assessments: Assessment[];
  // Business Types
  upsertBusinessType: (b: Partial<BusinessType> & { id?: string }) => BusinessType;
  removeBusinessType: (id: string) => void;
  // Sections
  upsertSection: (s: Partial<Section> & { id?: string }) => Section;
  removeSection: (id: string) => void;
  // Questions
  upsertQuestion: (q: Partial<Question> & { id?: string }) => Question;
  removeQuestion: (id: string) => void;
  // Categories
  upsertCategory: (c: Partial<SolutionCategory> & { id?: string }) => SolutionCategory;
  removeCategory: (id: string) => void;
  // Solutions
  upsertSolution: (s: Partial<Solution> & { id?: string }) => Solution;
  removeSolution: (id: string) => void;
  // Rules
  upsertRule: (r: Partial<Rule> & { id?: string }) => Rule;
  removeRule: (id: string) => void;
  // Assessments
  saveAssessment: (a: Omit<Assessment, "id" | "createdAt">) => Assessment;
  removeAssessment: (id: string) => void;
  priorityForSolution: (solutionKey: string) => Priority;
  resetSeed: () => void;
};

const RecoCtx = createContext<Ctx | null>(null);

export function RecommendationsProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [businessTypes, setBT] = useState<BusinessType[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<SolutionCategory[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    setBT(load(KEYS.bt, seedBusinessTypes));
    setSections(load(KEYS.sec, seedSections));
    setQuestions(load(KEYS.q, seedQuestions));
    setCategories(load(KEYS.cat, seedCategories));
    setSolutions(load(KEYS.sol, seedSolutions));
    setRules(load(KEYS.rule, seedRules));
    setAssessments(load(KEYS.a, [] as Assessment[]));
    setLoading(false);
  }, []);

  // ---------- helpers ----------
  function persist<T>(key: string, next: T, setter: (v: T) => void) {
    setter(next);
    save(key, next);
  }

  const upsertBusinessType: Ctx["upsertBusinessType"] = (b) => {
    const id = b.id ?? uid("bt");
    const cur = businessTypes.find((x) => x.id === id);
    const row: BusinessType = {
      id, key: b.key ?? cur?.key ?? id,
      name_en: b.name_en ?? cur?.name_en ?? "",
      name_ar: b.name_ar ?? cur?.name_ar ?? "",
      icon: b.icon ?? cur?.icon,
      active: b.active ?? cur?.active ?? true,
      sort_order: b.sort_order ?? cur?.sort_order ?? businessTypes.length,
    };
    const next = cur ? businessTypes.map((x) => x.id === id ? row : x) : [...businessTypes, row];
    persist(KEYS.bt, next, setBT);
    return row;
  };
  const removeBusinessType: Ctx["removeBusinessType"] = (id) =>
    persist(KEYS.bt, businessTypes.filter((x) => x.id !== id), setBT);

  const upsertSection: Ctx["upsertSection"] = (s) => {
    const id = s.id ?? uid("sec");
    const cur = sections.find((x) => x.id === id);
    const row: Section = {
      id,
      businessTypeId: s.businessTypeId ?? cur?.businessTypeId ?? "*",
      title_en: s.title_en ?? cur?.title_en ?? "",
      title_ar: s.title_ar ?? cur?.title_ar ?? "",
      order: s.order ?? cur?.order ?? sections.length,
    };
    const next = cur ? sections.map((x) => x.id === id ? row : x) : [...sections, row];
    persist(KEYS.sec, next, setSections);
    return row;
  };
  const removeSection: Ctx["removeSection"] = (id) =>
    persist(KEYS.sec, sections.filter((x) => x.id !== id), setSections);

  const upsertQuestion: Ctx["upsertQuestion"] = (q) => {
    const id = q.id ?? uid("q");
    const cur = questions.find((x) => x.id === id);
    const row: Question = {
      id,
      sectionId: q.sectionId ?? cur?.sectionId ?? "",
      key: q.key ?? cur?.key ?? id,
      label_en: q.label_en ?? cur?.label_en ?? "",
      label_ar: q.label_ar ?? cur?.label_ar ?? "",
      type: q.type ?? cur?.type ?? "text",
      options: q.options ?? cur?.options,
      required: q.required ?? cur?.required,
      enabled: q.enabled ?? cur?.enabled ?? true,
      order: q.order ?? cur?.order ?? questions.length,
      min: q.min ?? cur?.min,
      max: q.max ?? cur?.max,
      helper_en: q.helper_en ?? cur?.helper_en,
      helper_ar: q.helper_ar ?? cur?.helper_ar,
    };
    const next = cur ? questions.map((x) => x.id === id ? row : x) : [...questions, row];
    persist(KEYS.q, next, setQuestions);
    return row;
  };
  const removeQuestion: Ctx["removeQuestion"] = (id) =>
    persist(KEYS.q, questions.filter((x) => x.id !== id), setQuestions);

  const upsertCategory: Ctx["upsertCategory"] = (c) => {
    const id = c.id ?? uid("cat");
    const cur = categories.find((x) => x.id === id);
    const row: SolutionCategory = {
      id, key: c.key ?? cur?.key ?? id,
      name_en: c.name_en ?? cur?.name_en ?? "",
      name_ar: c.name_ar ?? cur?.name_ar ?? "",
      order: c.order ?? cur?.order ?? categories.length,
    };
    const next = cur ? categories.map((x) => x.id === id ? row : x) : [...categories, row];
    persist(KEYS.cat, next, setCategories);
    return row;
  };
  const removeCategory: Ctx["removeCategory"] = (id) =>
    persist(KEYS.cat, categories.filter((x) => x.id !== id), setCategories);

  const upsertSolution: Ctx["upsertSolution"] = (s) => {
    const id = s.id ?? uid("sol");
    const cur = solutions.find((x) => x.id === id);
    const row: Solution = {
      id, key: s.key ?? cur?.key ?? id,
      categoryKey: s.categoryKey ?? cur?.categoryKey ?? "",
      name_en: s.name_en ?? cur?.name_en ?? "",
      name_ar: s.name_ar ?? cur?.name_ar ?? "",
      description_en: s.description_en ?? cur?.description_en ?? "",
      description_ar: s.description_ar ?? cur?.description_ar ?? "",
      defaultPriority: s.defaultPriority ?? cur?.defaultPriority ?? "medium",
      benefits_en: s.benefits_en ?? cur?.benefits_en ?? [],
      benefits_ar: s.benefits_ar ?? cur?.benefits_ar ?? [],
      nextStep_en: s.nextStep_en ?? cur?.nextStep_en ?? "",
      nextStep_ar: s.nextStep_ar ?? cur?.nextStep_ar ?? "",
      icon: s.icon ?? cur?.icon,
    };
    const next = cur ? solutions.map((x) => x.id === id ? row : x) : [...solutions, row];
    persist(KEYS.sol, next, setSolutions);
    return row;
  };
  const removeSolution: Ctx["removeSolution"] = (id) =>
    persist(KEYS.sol, solutions.filter((x) => x.id !== id), setSolutions);

  const upsertRule: Ctx["upsertRule"] = (r) => {
    const id = r.id ?? uid("rule");
    const cur = rules.find((x) => x.id === id);
    const row: Rule = {
      id,
      name: r.name ?? cur?.name ?? "New rule",
      businessTypeKey: r.businessTypeKey ?? cur?.businessTypeKey,
      enabled: r.enabled ?? cur?.enabled ?? true,
      groupLogic: r.groupLogic ?? cur?.groupLogic ?? "and",
      groups: r.groups ?? cur?.groups ?? [{ logic: "and", conditions: [] }],
      actions: r.actions ?? cur?.actions ?? [],
    };
    const next = cur ? rules.map((x) => x.id === id ? row : x) : [...rules, row];
    persist(KEYS.rule, next, setRules);
    return row;
  };
  const removeRule: Ctx["removeRule"] = (id) =>
    persist(KEYS.rule, rules.filter((x) => x.id !== id), setRules);

  const saveAssessment: Ctx["saveAssessment"] = (a) => {
    const row: Assessment = { ...a, id: uid("a"), createdAt: Date.now() };
    persist(KEYS.a, [row, ...assessments], setAssessments);
    return row;
  };
  const removeAssessment: Ctx["removeAssessment"] = (id) =>
    persist(KEYS.a, assessments.filter((x) => x.id !== id), setAssessments);

  const priorityForSolution: Ctx["priorityForSolution"] = (solutionKey) =>
    solutions.find((s) => s.key === solutionKey)?.defaultPriority ?? "medium";

  const resetSeed = () => {
    persist(KEYS.bt, seedBusinessTypes, setBT);
    persist(KEYS.sec, seedSections, setSections);
    persist(KEYS.q, seedQuestions, setQuestions);
    persist(KEYS.cat, seedCategories, setCategories);
    persist(KEYS.sol, seedSolutions, setSolutions);
    persist(KEYS.rule, seedRules, setRules);
  };

  return (
    <RecoCtx.Provider value={{
      loading, businessTypes, sections, questions, categories, solutions, rules, assessments,
      upsertBusinessType, removeBusinessType,
      upsertSection, removeSection,
      upsertQuestion, removeQuestion,
      upsertCategory, removeCategory,
      upsertSolution, removeSolution,
      upsertRule, removeRule,
      saveAssessment, removeAssessment,
      priorityForSolution, resetSeed,
    }}>{children}</RecoCtx.Provider>
  );
}

export function useRecommendations() {
  const ctx = useContext(RecoCtx);
  if (!ctx) throw new Error("useRecommendations must be inside RecommendationsProvider");
  return ctx;
}