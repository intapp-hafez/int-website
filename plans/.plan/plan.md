
# Smart Solution Recommendation Engine

Rule-based assessment wizard in the client workspace that recommends Integrated Technics services, plus admin pages to manage business types, questions, solutions and rules. Bilingual (EN/AR), matches existing patterns (localStorage stores like `partners-store`, admin layout under `dashboard.admin.*`, workspace under `dashboard.workspace.*`).

## Scope (Version 1 — no AI)

Client Portal (`/dashboard/workspace/assessment`)
- Step 1: pick Business Type (grid of cards)
- Step 2: dynamic assessment form (sections + questions from admin config)
- Step 3: Results page — business summary, recommended solutions (cards with priority badges, reason, benefits, next step), business benefits list
- Actions: Save Assessment, Download PDF, Request Consultation (creates a lead), Create Inquiry

Admin Panel (`/dashboard/admin/recommendations/*`)
- Business Types: CRUD + EN/AR names + icon + active
- Questionnaires: per-business-type sections & questions (types: number, boolean, select, multi-select, text), required flag, order, enable/disable
- Solution Catalog: categories + solutions (name EN/AR, icon, description, default priority)
- Rule Manager: visual IF/THEN builder — conditions (question, operator, value) combined with AND/OR groups → actions (recommend solution with priority + reason)

## Data model (client-side, localStorage stores)

Following the `partners-store` pattern to stay consistent with the project's current stack (no new DB tables). All under `src/lib/`:

- `recommendation-types.ts` — shared TS types
- `business-types-store.tsx` — BusinessType[]
- `assessment-schema-store.tsx` — Sections + Questions keyed by businessTypeId
- `solutions-store.tsx` — SolutionCategory[] + Solution[]
- `rules-store.tsx` — Rule[] with condition groups (AND/OR) and actions
- `assessments-store.tsx` — saved client assessments + generated results

Rule engine: `src/lib/recommendation-engine.ts` — pure function `evaluate(answers, rules, solutions) → RecommendedSolution[]` supporting operators: `eq, neq, gt, lt, gte, lte, between, contains, in`, group logic AND/OR, dedupes solutions, keeps highest priority + collects reasons.

Seed data: reasonable defaults for ~6 business types (Hospital, Hotel, Mall, Office Building, Warehouse, Residential Compound) with the sections/questions from the spec and ~15 starter rules covering the examples (CCTV, Parking Mgmt, Visitor Mgmt, SOC, Fire Alarm, BMS…).

## Files to create

Stores & engine
- `src/lib/recommendation-types.ts`
- `src/lib/business-types-store.tsx`
- `src/lib/assessment-schema-store.tsx`
- `src/lib/solutions-store.tsx`
- `src/lib/rules-store.tsx`
- `src/lib/assessments-store.tsx`
- `src/lib/recommendation-engine.ts`
- `src/data/recommendation-seed.ts`

Client workspace
- `src/routes/dashboard.workspace.assessment.tsx` (layout + Outlet)
- `src/routes/dashboard.workspace.assessment.index.tsx` (business type picker)
- `src/routes/dashboard.workspace.assessment.$id.tsx` (form wizard + results)
- `src/routes/dashboard.workspace.assessment.history.tsx` (saved assessments)

Admin
- `src/routes/dashboard.admin.recommendations.tsx` (tabs layout)
- `src/routes/dashboard.admin.recommendations.business-types.tsx`
- `src/routes/dashboard.admin.recommendations.questions.tsx`
- `src/routes/dashboard.admin.recommendations.solutions.tsx`
- `src/routes/dashboard.admin.recommendations.rules.tsx`

Shared UI
- `src/components/recommendations/PriorityBadge.tsx`
- `src/components/recommendations/SolutionCard.tsx`
- `src/components/recommendations/RuleBuilder.tsx`
- `src/components/recommendations/QuestionField.tsx`

Wiring
- register all new stores' providers in `src/routes/__root.tsx`
- add nav entries in `src/routes/dashboard.tsx` (admin: "Recommendations"; workspace: "Assessment")
- add EN/AR strings in `src/data/translations.ts` for the new UI

## Technical notes

- Persistence: `localStorage` (consistent with `partners-store`, `slides-store`, `about-store`). No new Supabase tables — the plan's DB schema is deferred until Lovable Cloud is enabled.
- RTL: reuse `useI18n().dir` pattern from `partners.tsx`; Arabic fields get `dir="rtl"` `font-arabic`.
- PDF: use `src/components/invoice/InvoicePdf.tsx` stack (already in project) for the Download Assessment PDF.
- "Request Consultation" pipes into existing leads flow (`src/lib/leads.functions.ts`).
- Priority badge colors: Critical=destructive, High=accent, Medium=default, Optional=secondary — no hard-coded hex; uses existing semantic tokens.
- Rule builder: nested groups (max 2 levels) with add/remove condition, operator select, value input adapted to question type.

## Out of scope (per spec)

AI recommendations, budget/BOQ, proposal generation, CAD/BIM, ROI, energy simulation, predictive analytics. Stores/engine kept modular so a future Cloud-backed version can swap `localStorage` for Supabase without changing components.
