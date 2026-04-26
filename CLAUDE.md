# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Status

Pre-implementation. All documentation is in place; the Next.js application has not been scaffolded yet. Update this file with real commands once `pnpm create next-app` is run.

---

## Planned Commands

These are defined in [`docs/operations/testing-strategy.md`](docs/operations/testing-strategy.md) and should be wired up during scaffolding:

```bash
pnpm dev                  # local dev server (localhost:3000)
pnpm build                # production build
pnpm lint                 # ESLint
pnpm typecheck            # tsc --noEmit
pnpm test                 # Vitest (unit + component)
pnpm test:integration     # Vitest against local Supabase (requires supabase start)
pnpm test:e2e             # Playwright (requires supabase start + pnpm dev)
pnpm test:all             # all of the above

supabase start            # spin up local Postgres + Auth + Storage
supabase db push          # apply migrations to local instance
supabase gen types typescript --local > types/database.ts  # regenerate DB types
```

---

## Architecture Overview

Two distinct surfaces in one Next.js App Router codebase:

- **Creator dashboard** — `app/(creator)/` — authenticated via Supabase JWT (httpOnly cookie). Server + Client Components. All mutations go through API routes, never direct DB from the client.
- **Selector experience** — `app/(selector)/[token]/` — no login. Access gated by a UUID token in the URL path. Token is validated on every page load AND on submission (twice, by design).

The full architecture is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). C4 diagrams are in [`docs/c4/`](docs/c4/).

---

## Key Structural Decisions

**Route layout (planned):**
```
app/
  (creator)/layout.tsx        ← auth guard via next/middleware
  (creator)/dashboard/
  (creator)/flows/[id]/
  (selector)/[token]/         ← public, token-gated
  api/flows/                  ← creator-only (JWT required)
  api/upload/                 ← creator-only (JWT required)
  api/selections/             ← public write (token validated server-side)
```

**Two Supabase clients — never mix them:**
- Server-side (API routes, Server Components): service role key, bypasses RLS
- Browser (Client Components): anon key, subject to RLS

**Photo uploads bypass the server:** the browser requests a signed URL from `/api/upload`, then PUTs the file directly to Supabase Storage. The returned `publicUrl` is stored on the card.

**Selection submission is atomic:** the selector's entire flow is held in React state. Nothing is written to the DB during navigation — one POST at the end with the complete payload. This avoids partial submissions.

**Published flows are locked:** `PATCH` on modules/cards returns `423 Locked` if `flow.status = 'published'`. The creator must unpublish first.

---

## Domain Language

Use these terms exactly in code (variables, function names, comments). From [`docs/domain/glossary.md`](docs/domain/glossary.md):

| Term | Meaning |
|---|---|
| `Flow` | The top-level entity — one complete date selection experience |
| `Module` | A single step in a flow (either a Decision Module or Quiz Module) |
| `DecisionModule` | A step presenting the selector with Cards to choose from |
| `QuizModule` | A step presenting the selector with preference Questions |
| `Card` | One option within a Decision Module (a specific restaurant, activity, etc.) |
| `Question` | One preference prompt within a Quiz Module |
| `Selection` | The completed submission from the selector |
| `Answer` | One answer within a Selection (chosen card IDs or chosen option text) |
| `Creator` | The authenticated user who builds flows (Cyrill) |
| `Selector` | The girlfriend — no account, accesses via token URL |
| `Token` | The UUID in the share URL that grants selector access |

---

## Data Model

Full ERD in [`docs/data/ERD.md`](docs/data/ERD.md), column-level reference in [`docs/data/data-dictionary.md`](docs/data/data-dictionary.md).

Core hierarchy: `flows` → `decision_modules` / `quiz_modules` → `cards` / `quiz_questions` → `selections` → `selection_answers`

Modules from both types share a `position` field relative to their parent flow. The `FlowController` merges and sorts them by position to determine step order.

DB types are auto-generated: `supabase gen types typescript --local > types/database.ts`. Never write DB types by hand.

---

## API Conventions

Full spec in [`docs/api/openapi.yaml`](docs/api/openapi.yaml), conventions in [`docs/api/api-design.md`](docs/api/api-design.md).

- JSON keys: `camelCase` in requests/responses, mapped from `snake_case` DB columns at the boundary
- All errors: `{ error: string, code: string, field?: string }` — see `ErrorCode` enum
- All IDs: `uuid v4` strings
- All timestamps: ISO 8601 UTC strings
- Creator routes: validate JWT from cookie via `@supabase/ssr`, never from `Authorization` header

---

## Error Handling Pattern

Documented in [`docs/operations/error-handling.md`](docs/operations/error-handling.md).

All API routes use a shared `withErrorHandler` wrapper. Throw `AppError` for expected failures (404, 409, 422, 423). Unhandled errors are caught by the wrapper, logged, and returned as 500 with a generic message — never expose DB errors or stack traces to the client.

All logs are structured JSON: `console.log(JSON.stringify({ level, event, ...fields }))`. No bare `console.log` in production paths.

---

## Security Constraints

- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never prefix with `NEXT_PUBLIC_`, never pass to client components
- Flow tokens are logged as first 8 chars only
- Selection content (answers, messages) is never logged
- Security headers set in `next.config.ts` — do not remove them

Full threat model: [`docs/security/threat-model.md`](docs/security/threat-model.md)
Auth design: [`docs/security/auth-design.md`](docs/security/auth-design.md)

---

## Branching & Commits

From [`docs/operations/branching-strategy.md`](docs/operations/branching-strategy.md):

Branch naming: `<type>/<kebab-description>` — types: `feat`, `fix`, `chore`, `infra`, `docs`

Commit format (Conventional Commits):
```
feat(selector): add swipe gesture to card navigation
fix(api): return 409 on duplicate selection submission
```

All changes go through a PR. Squash merge only. No direct pushes to `main`.

---

## Infrastructure

Terraform config lives in `/infra/`. Managed resources: Vercel project + env vars, Supabase project + storage bucket. DB schema is managed separately via Supabase migrations in `supabase/migrations/` — not via Terraform.

Terraform is applied automatically in CI when `/infra/**` files change. Never run `terraform apply` locally against production without checking CI state first.
