# Branching Strategy

---

## Model: Trunk-Based Development (simplified)

Single long-lived branch (`main`) with short-lived feature branches. No develop, release, or hotfix branches. Appropriate for a solo developer with a fast deploy pipeline.

---

## Branch Structure

```
main                          ← production; always deployable
  └── feat/flow-builder       ← feature branch (merged via PR)
  └── fix/card-photo-upload   ← bug fix branch (merged via PR)
  └── chore/update-deps       ← maintenance (merged via PR)
  └── infra/add-custom-domain ← infrastructure change (merged via PR)
```

---

## Branch Naming

```
<type>/<short-description-in-kebab-case>
```

| Type | When to use |
|---|---|
| `feat/` | New feature or significant addition |
| `fix/` | Bug fix |
| `chore/` | Dependency updates, config changes, non-functional changes |
| `infra/` | Terraform or CI/CD changes |
| `docs/` | Documentation only |

Examples:
- `feat/selector-quiz-mode`
- `fix/token-validation-on-resubmit`
- `infra/add-vercel-custom-domain`
- `chore/upgrade-framer-motion`

---

## Workflow

```
1. Create branch from main
   git checkout -b feat/my-feature

2. Develop locally
   - Commits are frequent and small
   - No force-push to shared branches

3. Push branch and open PR
   - PR title follows: <type>: <description>
   - PR description: what changed, how to test, screenshots for UI changes

4. CI runs automatically (lint, typecheck, tests)
   Vercel creates a preview deployment with a unique URL

5. Self-review on the preview URL (especially for UI/animation changes)

6. Merge to main (squash merge preferred for clean history)
   - deploy.yml runs: lint → typecheck → test → supabase migrations → vercel deploy --prod
   - If /infra changed: terraform apply also runs
   - Production live within ~2 minutes of merge

7. Delete branch after merge
```

---

## Commit Message Format

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

| Type | When |
|---|---|
| `feat` | New functionality |
| `fix` | Bug fix |
| `chore` | Tooling, dependencies, config |
| `docs` | Documentation only |
| `refactor` | Code change with no behaviour change |
| `test` | Adding or updating tests |
| `infra` | Terraform or CI changes |

Examples:
```
feat(selector): add swipe gesture to card navigation
fix(api): return 409 on duplicate selection submission
infra(terraform): add custom domain to Vercel project
docs(adr): add ADR-010 for error handling strategy
```

---

## Rules

- **`main` is always deployable.** Never push broken code directly to `main`.
- **All changes go through a PR**, even solo work. PRs enforce CI checks and create a review record.
- **No long-lived feature branches.** If a feature takes more than a few days, break it into smaller PRs with feature flags if needed.
- **No merge commits on `main`.** Use squash merge to keep history linear and readable.
- **Database migrations are never rolled back manually.** Write a new forward migration instead.

---

## Protection Rules (GitHub Settings)

| Rule | Setting |
|---|---|
| Require PR before merging to `main` | ✅ |
| Require CI checks to pass | ✅ (lint, typecheck, test) |
| Dismiss stale reviews | N/A (solo project) |
| Prevent force-push to `main` | ✅ |
| Allow squash merge | ✅ |
| Allow merge commit | ❌ |
| Allow rebase merge | ❌ |
