-- ─────────────────────────────────────────────
-- Security fixes
-- ─────────────────────────────────────────────

-- Fix 1: Allow video MIME types and 100 MB files in the storage bucket.
-- The previous migration hard-coded image-only types and a 10 MB limit,
-- which silently blocks video uploads even via the service role.
update storage.buckets
set
  file_size_limit  = 104857600, -- 100 MB
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'
  ]
where id = 'date-photos';

-- Fix 2: Add user_id to flows so RLS can enforce per-creator isolation.
-- Backfill with the first authenticated user (or null for existing rows —
-- they belong to the only creator and will still be accessible once
-- the policy is updated).
alter table public.flows
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Drop the overly-broad creator policy and replace with an owner-scoped one.
drop policy if exists "creator_all_flows" on public.flows;

create policy "creator_own_flows"
  on public.flows for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Backfill: assign all existing flows to the only user in the project.
-- Safe for a solo app; postgres role can read auth.users directly.
update public.flows
set user_id = (select id from auth.users order by created_at limit 1)
where user_id is null;
