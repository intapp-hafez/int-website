
create table if not exists public.seo_bot_settings (
  id text primary key default 'main',
  daily_enabled boolean not null default true,
  schedule_cron text not null default '0 3 * * *',
  ai_model text not null default 'google/gemini-3-flash-preview',
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.seo_bot_settings to authenticated;
grant all on public.seo_bot_settings to service_role;
alter table public.seo_bot_settings enable row level security;
create policy "seo_bot_settings readable" on public.seo_bot_settings for select using (true);
create policy "seo_bot_settings admin write" on public.seo_bot_settings for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
insert into public.seo_bot_settings (id) values ('main') on conflict (id) do nothing;

create table if not exists public.seo_bot_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null default 'manual',
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  findings_count integer not null default 0,
  suggestions_count integer not null default 0,
  health_score integer,
  summary jsonb,
  error text
);
create index if not exists seo_bot_runs_started_at_idx on public.seo_bot_runs (started_at desc);
grant select on public.seo_bot_runs to authenticated;
grant all on public.seo_bot_runs to service_role;
alter table public.seo_bot_runs enable row level security;
create policy "seo_bot_runs admin read" on public.seo_bot_runs for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create table if not exists public.seo_bot_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.seo_bot_runs(id) on delete cascade,
  page_id text,
  category text not null,
  severity text not null default 'info',
  title text not null,
  detail text,
  suggestion jsonb,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists seo_bot_findings_run_idx on public.seo_bot_findings (run_id);
create index if not exists seo_bot_findings_page_idx on public.seo_bot_findings (page_id);
grant select, update on public.seo_bot_findings to authenticated;
grant all on public.seo_bot_findings to service_role;
alter table public.seo_bot_findings enable row level security;
create policy "seo_bot_findings admin read" on public.seo_bot_findings for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "seo_bot_findings admin update" on public.seo_bot_findings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('seo-bot-daily');
exception when others then null;
end $$;

select cron.schedule(
  'seo-bot-daily',
  '0 3 * * *',
  $cron$
  select net.http_post(
    url := 'https://project--fd28236a-0353-48b0-a792-27aff7a2361c-dev.lovable.app/api/public/hooks/seo-bot-daily',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwb25mYmt5cXFhZ214YXhmbWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDY3NDMsImV4cCI6MjA5MzkyMjc0M30.SUnn8fzK_RIOWQ3VVsJG80bG3nv-vpiBmgUL1AOCXzg"}'::jsonb,
    body := '{"trigger":"cron"}'::jsonb
  );
  $cron$
);
