-- Add confirmed date fields to flows
-- confirmed_card_id: the card the creator picks as the confirmed date activity
-- confirmed_at: the exact date/time the creator sets
-- meeting_point: optional text for where to meet

alter table public.flows
  add column confirmed_card_id uuid references public.cards(id) on delete set null,
  add column confirmed_at      timestamptz,
  add column meeting_point     text check (char_length(meeting_point) <= 300);

-- Backfill: set confirmed_at to 2026-05-03 10:00 UTC+2 for all existing flows
-- (first date, so we default it for backwards compatibility)
-- We leave confirmed_card_id and meeting_point null so the confirm UI prompts the creator.
