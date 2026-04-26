-- ─────────────────────────────────────────────
-- Storage: date-photos bucket policies
-- The bucket itself is created by Terraform.
-- These policies control who can read/write objects.
-- ─────────────────────────────────────────────

-- Public read: anyone can fetch photos via CDN URL
create policy "public_read_photos"
  on storage.objects for select
  to public
  using (bucket_id = 'date-photos');

-- Creator write: only authenticated users can upload
create policy "creator_upload_photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'date-photos');

-- Creator delete: only authenticated users can remove photos
create policy "creator_delete_photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'date-photos');
