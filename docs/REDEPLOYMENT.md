# Redeployment Guide

How to spin up a fully working instance of this app from scratch — for example after a domain change, account migration, or disaster recovery.

---

## What is already automated

Once GitHub secrets are set, every push to `main` runs:

```
lint → typecheck → tests
  → terraform apply (if infra/ changed)
  → supabase db push (all pending migrations)
  → vercel deploy --prod
```

There is no manual deploy step under normal operation.

---

## Full From-Scratch Setup

### 1. Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Local dev and CI |
| pnpm | 10 | Package manager |
| Supabase CLI | latest | Migration management |
| Terraform | ≥ 1.6 | Infrastructure provisioning |
| Vercel CLI | latest | Manual deploys if needed |
| GitHub CLI (`gh`) | latest | Secrets management |

---

### 2. Create accounts

| Service | Free tier sufficient? | Notes |
|---|---|---|
| Supabase | Yes (for personal use) | Create a new project; note the project ref, DB password, service role key, anon key, URL |
| Vercel | Yes | Connect GitHub repo during signup |
| Resend | Yes | Create an API key; verify your sending domain |
| Terraform Cloud | Yes | Create org `date-selector`, workspace `date-selector-prod`, set execution mode to **Remote** |

---

### 3. Configure Terraform Cloud

In Terraform Cloud workspace → Variables, add as **sensitive environment variables**:

```
TF_VAR_vercel_api_token
TF_VAR_supabase_access_token
TF_VAR_supabase_project_id
TF_VAR_supabase_db_password
TF_VAR_resend_api_key
TF_VAR_next_public_supabase_url
TF_VAR_next_public_supabase_anon_key
TF_VAR_supabase_service_role_key
```

Then run once locally or via CI to provision the Vercel project and env vars:

```bash
cd infra
terraform init
terraform apply
```

This creates the Vercel project, wires up all environment variables, and creates the Supabase storage bucket.

---

### 4. Set GitHub Actions secrets

```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL       --body "https://xxx.supabase.co"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY  --body "eyJ..."
gh secret set SUPABASE_SERVICE_ROLE_KEY      --body "eyJ..."
gh secret set SUPABASE_ACCESS_TOKEN          --body "sbp_..."
gh secret set SUPABASE_PROJECT_ID            --body "htztpctkkjfyobrbhdld"
gh secret set SUPABASE_DB_PASSWORD           --body "..."
gh secret set RESEND_API_KEY                 --body "re_..."
gh secret set VERCEL_API_TOKEN               --body "..."
gh secret set VERCEL_ORG_ID                  --body "team_..."
gh secret set VERCEL_PROJECT_ID              --body "prj_..."
gh secret set APP_URL                        --body "https://your-vercel-url.vercel.app"
gh secret set TF_API_TOKEN                   --body "..."   # Terraform Cloud API token
```

---

### 5. Manual steps (cannot be automated)

These require dashboard clicks — no API or Terraform provider covers them fully:

**a) Enable Google OAuth in Supabase**
- Supabase dashboard → Authentication → Providers → Google
- Set **Client ID** and **Client Secret** (from Google Cloud Console)
- Set redirect URL: `{APP_URL}/auth/callback`

**b) Set CREATOR_EMAIL in Vercel**
- Vercel dashboard → Project → Settings → Environment Variables
- Add `CREATOR_EMAIL` = your email address
- Or add it to `infra/vercel.tf` as a `vercel_project_environment_variable` resource (then it's automated on next Terraform apply)

**c) Verify sending domain in Resend**
- Resend dashboard → Domains → Add Domain
- Add the DNS records Resend provides to your domain registrar
- Without this, email sends from `onboarding@resend.dev` (works, but shows Resend branding)

---

### 6. Push to main

The first push triggers the full deploy pipeline. Migrations are applied automatically. Done.

---

## Ongoing Operations

| Task | How |
|---|---|
| Deploy new code | Merge to `main` — CI deploys automatically |
| Add a migration | Create file in `supabase/migrations/`, merge to `main` — applied automatically |
| Roll back a deployment | Vercel dashboard → Deployments → Promote a previous deployment |
| Roll back a migration | Write a new migration that reverses the change (no `supabase db rollback` in production) |
| Rotate secrets | Update in GitHub Actions secrets + Terraform Cloud variables; re-run Terraform apply |
| Change domain | Update `APP_URL` secret + Vercel domain settings; re-run Terraform apply |

---

## One-Click Deploy (future)

A Vercel "Deploy" button could automate most of step 4 by encoding the required environment variables into a deploy URL. This is blocked on Supabase not yet having a managed provisioning API that can be wired into the Vercel deploy flow. Until then, the manual steps above are the fastest path.
