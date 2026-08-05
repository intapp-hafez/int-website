export type Priority = "critical" | "high" | "medium" | "optional";

export type QuestionType = "number" | "boolean" | "select" | "multi-select" | "text";

export type Operator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "between" | "contains" | "in";

export type BusinessType = {
  id: string;
  key: string;
  name_en: string;
  name_ar: string;
  icon?: string; // lucide icon name
  active: boolean;
  sort_order: number;
};

export type Section = {
  id: string;
  businessTypeId: string; // "*" for all
  title_en: string;
  title_ar: string;
  order: number;
};

export type Question = {
  id: string;
  sectionId: string;
  key: string; // unique per business type — used in rules
  label_en: string;
  label_ar: string;
  type: QuestionType;
  options?: { value: string; label_en: string; label_ar: string }[];
  required?: boolean;
  enabled: boolean;
  order: number;
  min?: number;
  max?: number;
  helper_en?: string;
  helper_ar?: string;
};

export type SolutionCategory = {
  id: string;
  key: string;
  name_en: string;
  name_ar: string;
  order: number;
};

export type Solution = {
  id: string;
  key: string;
  categoryKey: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  defaultPriority: Priority;
  benefits_en: string[];
  benefits_ar: string[];
  nextStep_en: string;
  nextStep_ar: string;
  icon?: string;
};

export type Condition = {
  questionKey: string;
  operator: Operator;
  value: string | number | boolean;
  value2?: string | number; // for "between"
};

export type ConditionGroup = {
  logic: "and" | "or";
  conditions: Condition[];
};

export type RuleAction = {
  solutionKey: string;
  priority?: Priority; // overrides solution default
  reason_en: string;
  reason_ar: string;
};

export type Rule = {
  id: string;
  name: string;
  businessTypeKey?: string; // undefined = applies to all
  enabled: boolean;
  groupLogic: "and" | "or"; // between groups
  groups: ConditionGroup[];
  actions: RuleAction[];
};

export type RecommendedSolution = {
  solutionKey: string;
  priority: Priority;
  reasons_en: string[];
  reasons_ar: string[];
};

export type Assessment = {
  id: string;
  businessTypeKey: string;
  projectName: string;
  clientName: string;
  answers: Record<string, any>;
  results: RecommendedSolution[];
  createdAt: number;
};

export const PRIORITY_RANK: Record<Priority, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  optional: 0,
};

export const OPERATOR_LABELS: Record<Operator, string> = {
  eq: "Equals",
  neq: "Not equals",
  gt: "Greater than",
  lt: "Less than",
  gte: "≥",
  lte: "≤",
  between: "Between",
  contains: "Contains",
  in: "In list",
};