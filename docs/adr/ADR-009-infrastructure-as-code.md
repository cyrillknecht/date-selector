# ADR-009: Infrastructure as Code

**Status:** Accepted  
**Date:** 2026-04-26  
**Deciders:** Cyrill Knecht

---

## Context

The project uses two managed cloud platforms (Vercel and Supabase) plus GitHub Actions for CI/CD. Without IaC, the project configuration exists only in platform dashboards — making it impossible to reproduce, review changes, or recover from accidental misconfiguration.

IaC must:
- Version-control all infrastructure alongside the application code
- Support Vercel (project, domain, env vars) and Supabase (project, storage buckets)
- Be reviewable via PR before changes are applied
- Be free or very cheap to operate
- Not require running a dedicated state management server

### Options Considered

**IaC Tools:**

| Option | Notes |
|---|---|
| **Terraform** | Industry standard, provider ecosystem covers Vercel and Supabase, HCL is readable, Terraform Cloud has a free tier for remote state |
| Pulumi | Code-first IaC (TypeScript), more powerful for complex logic, but higher learning curve; Vercel/Supabase provider maturity is lower |
| AWS CDK | AWS-only; not applicable here |
| Manual dashboard config | Not reproducible, not reviewable, not recoverable |

**State Backend:**

| Option | Notes |
|---|---|
| **Terraform Cloud (free tier)** | Remote state, state locking, run history, free for up to 500 resources |
| S3 + DynamoDB | Robust, but requires an AWS account for a non-AWS project |
| Local state file | Simple, but state is not shared or backed up; risky |

---

## Decision

**Use Terraform with Terraform Cloud as the remote state backend.**

Terraform has mature, maintained providers for both Vercel (`vercel/vercel`) and Supabase (`supabase/supabase`). HCL is readable and reviewable in PRs. Terraform Cloud's free tier handles remote state storage and locking without requiring any additional infrastructure.

### Repository Structure

```
/infra/
  main.tf          # Provider configuration and backend
  variables.tf     # Input variables (referenced from env or tfvars)
  vercel.tf        # Vercel project, domain, env var references
  supabase.tf      # Supabase project, storage buckets
  outputs.tf       # Exported values (project URLs, etc.)
```

### What Terraform Manages

**Vercel:**
- Project (linked to GitHub repo, framework = Next.js)
- Environment variables (references to secrets; values stored in Vercel, not in state)
- Custom domain (if applicable)

**Supabase:**
- Project (region, plan)
- Storage bucket (`date-photos`, public read policy)

**What Terraform Does NOT Manage:**
- Database schema (managed by Supabase migrations via `supabase db push`)
- Application secrets (stored in Vercel and GitHub Actions secrets, referenced by name)
- Row-level security policies (managed in Supabase migration files)

---

## Consequences

**Positive:**
- Full infrastructure is reproducible from a fresh clone of the repo
- Infrastructure changes are reviewed in PRs via `terraform plan` output (posted as a comment by CI)
- Terraform Cloud provides state locking, preventing concurrent conflicting applies
- Destroying and recreating the entire project takes one `terraform apply`

**Negative:**
- Terraform Cloud account required (free, but another account to manage)
- Supabase Terraform provider is less mature than the Vercel provider; some Supabase features (RLS policies, database schema) are intentionally out of scope for Terraform and managed via the Supabase CLI instead
- Secret values must never be placed in `.tf` files or Terraform state — requires discipline with how env vars are referenced

**Neutral:**
- A `.terraform.lock.hcl` file is committed to pin provider versions, ensuring consistent applies across local and CI environments
- `terraform.tfvars` is gitignored; environment-specific values are passed via environment variables in CI
