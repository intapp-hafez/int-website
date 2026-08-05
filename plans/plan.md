## Helpdesk Phase 2 — SLA, Registries, Assignment

Building on Phase 1 (tickets, messages, events). Four deliverables in one pass.

### 1. Sidebar navigation
Add a **Helpdesk** group in `src/routes/dashboard.tsx` (admin nav) with:
- Tickets (`/dashboard/admin/helpdesk/tickets`)
- New ticket (`/dashboard/admin/helpdesk/tickets/new`)
- Categories (`/dashboard/admin/helpdesk/categories`)
- SLA Policies (`/dashboard/admin/helpdesk/sla`)
- Branches (`/dashboard/admin/helpdesk/branches`)
- Devices (`/dashboard/admin/helpdesk/devices`)

Uses existing `pageKey: "tickets"` for permission gating.

### 2. Database (one migration)

**New tables (all admin-managed, public read for active rows where it makes sense):**
- `support_categories` — value (slug), name_en, name_ar, sort_order, active, default_sla_id
- `support_branches` — code, name_en, name_ar, address, active
- `support_devices` — serial, name, model, branch_id, client_id, active
- `support_sla_policies` — name_en, name_ar, priority, first_response_minutes, resolve_minutes, business_hours_only, active
- `support_ticket_assignments` — ticket_id, assigned_to, assigned_by, note, created_at (assignment history)

**Extensions to `support_tickets`:**
- `sla_policy_id` uuid (nullable)
- `first_response_due_at`, `resolve_due_at` timestamptz
- `first_response_at` timestamptz (set when first staff message posted)
- `sla_breached_response` boolean, `sla_breached_resolve` boolean (computed via trigger or app-side derived)

**Triggers:**
- On ticket insert: pick SLA by priority (or category default) → set due dates.
- On first staff (non-internal) message: set `first_response_at`.
- On assignment change: insert into `support_ticket_assignments`, write event row, create admin notification "Ticket reassigned".

### 3. Admin CRUD pages
Standard list + dialog editor pattern (matches existing admin pages):
- `dashboard.admin.helpdesk.categories.tsx`
- `dashboard.admin.helpdesk.sla.tsx`
- `dashboard.admin.helpdesk.branches.tsx`
- `dashboard.admin.helpdesk.devices.tsx`

Each: table, add/edit dialog, delete confirm, active toggle, sort.

### 4. SLA on tickets
- **List page**: add SLA badge column (✓ on track / ⚠ at risk <20% time left / ✕ breached) computed from `first_response_due_at` vs `first_response_at` and `resolve_due_at` vs `resolved_at`/now.
- **Detail page**: SLA panel showing both timers with countdown and breach indicator; SLA policy selector to override.

### 5. Assignment
- **Detail page**: Assignee selector (loads users with `helpdesk_manager`/`technician`/`admin` roles via existing user_roles). On change: update ticket, log event, insert assignment row. Trigger handles admin notification.
- Assignment history section showing chronological reassignments.

### Out of scope (Phase 3)
Contracts, parts/inventory, time logs, billing, advanced reports.

Approve to start? I'll run the migration first, then build the UI.
