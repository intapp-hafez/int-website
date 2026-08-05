
create table if not exists public.about_content (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  hero_image_url text,
  hero_focal_x numeric not null default 50,
  hero_focal_y numeric not null default 50,
  hero_zoom numeric not null default 1,
  hero_mirror_rtl boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.about_content enable row level security;

drop policy if exists "About content is publicly readable" on public.about_content;
create policy "About content is publicly readable"
  on public.about_content for select
  using (true);

insert into public.about_content (id) values ('main') on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('about-images', 'about-images', true)
on conflict (id) do nothing;

drop policy if exists "About images are publicly readable" on storage.objects;
create policy "About images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'about-images');

drop policy if exists "Anyone can upload about images" on storage.objects;
create policy "Anyone can upload about images"
  on storage.objects for insert
  with check (bucket_id = 'about-images');

drop policy if exists "Anyone can update about images" on storage.objects;
create policy "Anyone can update about images"
  on storage.objects for update
  using (bucket_id = 'about-images');

drop policy if exists "Anyone can delete about images" on storage.objects;
create policy "Anyone can delete about images"
  on storage.objects for delete
  using (bucket_id = 'about-images');
