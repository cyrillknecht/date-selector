resource "vercel_project" "date_selector" {
  name      = "date-selector"
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = "cyrillknecht/date-selector"
    production_branch = "main"
  }
}

# Environment variables — values are sensitive and passed via TF vars.
# Vercel stores them encrypted; they are never in Terraform state in plain text.

resource "vercel_project_environment_variable" "next_public_supabase_url" {
  project_id = vercel_project.date_selector.id
  key        = "NEXT_PUBLIC_SUPABASE_URL"
  value      = var.next_public_supabase_url
  targets    = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "next_public_supabase_anon_key" {
  project_id = vercel_project.date_selector.id
  key        = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  value      = var.next_public_supabase_anon_key
  targets    = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "supabase_service_role_key" {
  project_id = vercel_project.date_selector.id
  key        = "SUPABASE_SERVICE_ROLE_KEY"
  value      = var.supabase_service_role_key
  targets    = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "resend_api_key" {
  project_id = vercel_project.date_selector.id
  key        = "RESEND_API_KEY"
  value      = var.resend_api_key
  targets    = ["production", "preview", "development"]
}
