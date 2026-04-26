# ADR-008: CI/CD Pipeline

**Status:** Accepted  
**Date:** 2026-04-26  
**Deciders:** Cyrill Knecht

---

## Context

We need automated quality checks on every push and a reliable, repeatable deployment process. The pipeline must:

- Run on every PR: lint, type-check, and tests
- Apply infrastructure changes when Terraform files change
- Apply database migrations when schema files change
- Deploy to production automatically when `main` is updated
- Be free at this project's scale
- Integrate with GitHub (where the repository lives)

### Options Considered

| Option | Notes |
|---|---|
| **GitHub Actions** | Native to GitHub, free for public repos and generous free minutes for private repos, large action marketplace, YAML-based |
| CircleCI | Powerful, but less integrated with GitHub than Actions; free tier is limited |
| GitLab CI | Excellent, but requires moving off GitHub |
| Bitbucket Pipelines | Tied to Bitbucket; not relevant here |

---

## Decision

**Use GitHub Actions for all CI/CD.**

GitHub Actions is the natural choice for a GitHub-hosted repository. The free tier provides 2,000 minutes/month for private repos — more than sufficient for a project with infrequent commits. The marketplace has mature actions for every step needed: Supabase CLI, Terraform, Vercel deployment, and Node.js setup.

### Pipeline Design

#### Pull Request Pipeline (`ci.yml`)
Triggered on every push to a non-`main` branch and every PR.

```
1. Checkout code
2. Setup Node.js + install dependencies (cached)
3. Run ESLint
4. Run TypeScript type-check (tsc --noEmit)
5. Run unit tests (Vitest)
```

Vercel handles preview deployment automatically via its GitHub integration — no explicit deploy step needed in this pipeline.

#### Production Pipeline (`deploy.yml`)
Triggered on push to `main`.

```
1. Checkout code
2. Setup Node.js + install dependencies (cached)
3. Run full CI checks (lint, typecheck, tests)
4. If /infra changed: run terraform plan → terraform apply
5. Run Supabase migrations (supabase db push)
6. Vercel deploys automatically via its GitHub integration
```

#### Terraform Plan on PR (`infra-plan.yml`)
Triggered when any file in `/infra/` changes on a PR.

```
1. Run terraform plan
2. Post plan output as a PR comment for review before merge
```

### Secrets Management

All secrets (Supabase service key, Resend API key, Vercel token, Terraform cloud token) are stored as GitHub Actions secrets and injected as environment variables at runtime. They are never committed to the repository.

---

## Consequences

**Positive:**
- Single platform for version control and CI/CD — no context switching
- Terraform plan output on PRs makes infrastructure changes reviewable before apply
- Database migrations run as part of the deploy pipeline — schema and code are always in sync
- Caching of `node_modules` keeps CI runs fast (under 2 minutes for lint/typecheck/test)
- Free minutes are sufficient for this project's commit frequency

**Negative:**
- YAML-based pipeline configuration can become verbose for complex workflows
- GitHub Actions has occasional platform outages (rare, but worth noting for a production deploy dependency)

**Neutral:**
- Vercel's native GitHub integration handles the actual production deployment trigger; the `deploy.yml` workflow focuses on pre-deploy steps (infra, migrations) that must complete first
- A manual approval step can be added before `terraform apply` if desired, though for a solo project this adds friction without much benefit
