-- Add optional URL field to cards (restaurant website, Google Maps link, etc.)
alter table public.cards add column url text;
