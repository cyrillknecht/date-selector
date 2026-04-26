output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.date_selector.id
}

output "vercel_project_url" {
  description = "Production deployment URL"
  value       = "https://${vercel_project.date_selector.name}.vercel.app"
}

output "storage_bucket_id" {
  description = "Supabase Storage bucket ID for date photos"
  value       = supabase_storage_bucket.date_photos.id
}
