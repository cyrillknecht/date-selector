variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "supabase_access_token" {
  description = "Supabase personal access token"
  type        = string
  sensitive   = true
}

variable "supabase_project_id" {
  description = "Supabase project reference ID"
  type        = string
}

variable "supabase_db_password" {
  description = "Supabase database password"
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend API key for transactional email"
  type        = string
  sensitive   = true
}

variable "next_public_supabase_url" {
  description = "Supabase project URL (safe for browser)"
  type        = string
}

variable "next_public_supabase_anon_key" {
  description = "Supabase anon key (safe for browser, RLS enforced)"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key (server-side only, bypasses RLS)"
  type        = string
  sensitive   = true
}
