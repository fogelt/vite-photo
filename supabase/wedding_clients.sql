-- ============================================================
--  Bröllopsplanering / Wedding planning helper
--  Run this in Supabase Dashboard -> SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

-- Keeps updated_at fresh on every edit
create or replace function public.set_wedding_clients_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.wedding_clients (
  id                    uuid primary key default gen_random_uuid(),

  -- Couple / contact
  couple_names          text not null,
  contact_person        text,
  email                 text,
  phone                 text,

  -- Wedding details
  wedding_date          date,
  wedding_time          time,
  venue                 text,
  package               text,

  -- Pipeline: visual status badges in the admin UI
  status                text not null default 'lead'
                        check (status in ('lead', 'contacted', 'meeting', 'booked', 'completed', 'declined')),

  -- Free-form notes from the conversation
  notes                 text,

  -- Photo of the couple (Cloudinary secure_url + public_id for cleanup)
  couple_photo_url      text,
  couple_photo_public_id text,

  -- Optional reminder shown in the sidebar / calendar
  follow_up_date        date,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists wedding_clients_wedding_date_idx
  on public.wedding_clients (wedding_date);

create index if not exists wedding_clients_follow_up_date_idx
  on public.wedding_clients (follow_up_date);

create index if not exists wedding_clients_status_idx
  on public.wedding_clients (status);

drop trigger if exists wedding_clients_set_updated_at on public.wedding_clients;
create trigger wedding_clients_set_updated_at
  before update on public.wedding_clients
  for each row execute function public.set_wedding_clients_updated_at();

-- ============================================================
--  Row Level Security
--  Only signed-in admin (Clerk -> Supabase "authenticated") can
--  read or write. Public visitors cannot see client notes.
-- ============================================================

alter table public.wedding_clients enable row level security;

drop policy if exists "wedding_clients_select_authenticated" on public.wedding_clients;
create policy "wedding_clients_select_authenticated"
  on public.wedding_clients for select
  to authenticated
  using (true);

drop policy if exists "wedding_clients_insert_authenticated" on public.wedding_clients;
create policy "wedding_clients_insert_authenticated"
  on public.wedding_clients for insert
  to authenticated
  with check (true);

drop policy if exists "wedding_clients_update_authenticated" on public.wedding_clients;
create policy "wedding_clients_update_authenticated"
  on public.wedding_clients for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "wedding_clients_delete_authenticated" on public.wedding_clients;
create policy "wedding_clients_delete_authenticated"
  on public.wedding_clients for delete
  to authenticated
  using (true);

-- ============================================================
--  Optional: lock it down to Myelie's Clerk user only.
--  Uncomment and replace the id if you want stricter access.
-- ============================================================
-- drop policy "wedding_clients_select_authenticated" on public.wedding_clients;
-- create policy "wedding_clients_select_admin_only"
--   on public.wedding_clients for select
--   to authenticated
--   using ((auth.jwt() ->> 'sub') = 'user_XXXXXXXXXXXX');
