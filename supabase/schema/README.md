# Database bootstrap

The connected Supabase project (`hdbzvoitzyvehyeqygmq`) currently has **no tables** —
every table the app queries (`leads`, `career_*`, `support_*`, `seo_*`, `news_posts`,
`products`, `user_roles`, `sys_*`, …) is missing, which is why admin pages fall back to
mock data and public forms fail.

Run these three scripts **in order** in the Supabase SQL editor:

1. `01_types.sql` — enum types (`app_role`, ticket/career/notification enums). Must run
   on its own first: Postgres refuses to use a newly added enum value inside the same
   transaction that added it.
2. `02_schema.sql` — all tables, helper functions (`has_role`, `can_manage_tickets`,
   ticket/ref number generators), triggers, indexes, RLS policies and storage buckets.
   Consolidated from `supabase/migrations/*` and made re-runnable.
3. `03_lookups_and_grants.sql` — the two lookup tables that were never migrated
   (`sys_locations`, `sys_nationalities`) with their RLS policies, the `career-resumes`
   storage bucket, and the PostgREST `GRANT`s for `anon` / `authenticated` /
   `service_role` on every public table.

Access model:

- `anon` → SELECT on public content (about, slides, news, products, jobs, chatbot Q&A,
  SEO rows, support categories/branches/SLA, locations, nationalities) and INSERT only on
  `leads`, `career_applications`, `pwa_install_events` (public forms).
- `authenticated` → full CRUD privileges, narrowed by RLS: admins via `has_role()`,
  helpdesk staff via `can_manage_tickets()`, clients scoped to their own rows.
- `service_role` → everything (used by the server functions in `src/lib/*.functions.ts`).

After running them, grant yourself the admin role:

```sql
insert into public.user_roles (user_id, role)
values ('<your-auth-user-id>', 'admin')
on conflict do nothing;
```
