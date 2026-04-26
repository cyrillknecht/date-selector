resource "supabase_storage_bucket" "date_photos" {
  project_ref = var.supabase_project_id
  id          = "date-photos"
  name        = "date-photos"
  public      = true

  # 10MB max file size (enforced here and in the upload API route)
  file_size_limit = 10485760

  allowed_mime_types = ["image/jpeg", "image/png", "image/webp", "image/avif"]
}
