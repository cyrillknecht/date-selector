-- Creates the date-photos bucket directly in SQL so it works without Terraform.
-- ON CONFLICT DO NOTHING makes this idempotent if bucket already exists.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'date-photos',
  'date-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;
