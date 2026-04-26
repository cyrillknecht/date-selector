# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

Requires **Node 20+** (use `nvm use 20`).

```bash
pnpm dev                  # local dev server (localhost:3000)
pnpm build                # production build
pnpm lint                 # ESLint
pnpm typecheck            # tsc --noEmit
pnpm test                 # Vitest unit + component tests (jsdom, passWithNoTests)
pnpm test:e2e             # Playwright E2E (spins up pnpm dev automatically)

# Single test file
pnpm test __tests__/lib/utils.test.ts

# Supabase local stack
supabase start            # spin up local Postgres + Auth + Storage
supabase db push --password <pw> --yes  # apply migrations to local
supabase gen types typescript --local 2>/dev/null > types/database.ts
```

---

## Architecture

Two distinct surfaces in one Next.js 16 App Router codebase (TypeScript, Tailwind CSS v4, shadcn/ui):

- **Creator dashboard** — `app/creator/` — authenticated via Supabase JWT (httpOnly cookie). All mutations use Server Actions. `export const dynamic = 'force-dynamic'` on every page to prevent stale static pre-rendering.
- **Selector experience** — `app/(selector)/[token]/` — no login. Access gated by a UUID token in the URL. Token validated on page load and again on submission.

### Route layout
```
app/
  creator/layout.tsx          ← auth guard (middleware.ts redirects to /login)
  creator/dashboard/
  creator/flows/[id]/
  (selector)/[token]/         ← public, token-gated; (selector) is a route group, no URL segment
  login/                      ← LoginForm wrapped in <Suspense> for useSearchParams
  api/upload/                 ← multipart upload to Supabase Storage, returns { url }
```

`(creator)` was renamed to `creator` (no parens) because route groups with `()` add no URL segment — `/creator/dashboard` requires the literal `creator/` in the path.

### Two Supabase clients — never mix them
- `createServerClient()` — service role key, bypasses RLS; use in Server Components, Server Actions, API routes
- `createSessionClient()` — cookie-aware SSR client; use for auth checks only

### Key patterns
- **Photo uploads**: browser POSTs to `/api/upload` → validates session + file → uploads to `date-photos` Supabase Storage bucket → returns `{ url }`. `PhotoUploader` bridges client state to server action via a hidden `<input type="hidden" name="..." value={urls.join('\n')} />`.
- **Selection submission is atomic**: entire flow held in React state; one server action call at the end.
- **`NEXT_PUBLIC_*` vars are compile-time constants**: use `APP_URL` (no prefix) for server-runtime env vars like share link generation.
- **Animations**: Framer Motion `AnimatePresence` for slide transitions; `useReducedMotion()` toggles to fade-only variants when `prefers-reduced-motion` is set.
- **i18n**: All selector-facing UI strings live in `i18n/selector.ts` — edit there, components import from `t`.
- **Polaroid background**: `components/selector/PolaroidBackground.tsx` — images served from `public/backgrounds/`, positions defined in `PLACEMENTS` array.
- **Published flows are locked**: server actions reject mutations on published flows with a `FLOW_LOCKED` `AppError`.

### Error handling
All API routes use `withErrorHandler` from `lib/errors.ts`. Throw `AppError` for expected failures. Unknown errors return 500 with no internal details exposed. Logs are structured JSON via `console.log(JSON.stringify({ level, event, ... }))`.

---

## Deployment

- **Production URL**: `https://date-selector-selector.vercel.app`
- **Vercel project**: `date-selector-selector` (`prj_nnA2v8ersWQnDJ651F7k0WOl3Qzx`)
- **Supabase project**: `htztpctkkjfyobrbhdld`
- **CI**: `.github/workflows/ci.yml` — lint + typecheck + Vitest on all non-main branches
- **Deploy**: `.github/workflows/deploy.yml` — lint + typecheck + test → supabase migrations → `vercel deploy --prod` on every push to main

### GitHub Actions secrets required
| Secret | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Build-time Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build-time Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase client |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI auth |
| `SUPABASE_PROJECT_ID` | Supabase project ref |
| `SUPABASE_DB_PASSWORD` | Migration pushes |
| `RESEND_API_KEY` | Email notifications |
| `VERCEL_API_TOKEN` | Vercel deployment |
| `VERCEL_ORG_ID` | Vercel team (`team_pUAlfzrb4wJsyPZ5zQspR899`) |
| `VERCEL_PROJECT_ID` | Vercel project (`prj_nnA2v8ersWQnDJ651F7k0WOl3Qzx`) |
| `APP_URL` | Server-side share link generation |
| `CREATOR_EMAIL` | Notification email destination (falls back to `cykn128@gmail.com`) |

---

## Domain Language

| Term | Meaning |
|---|---|
| `Flow` | Top-level entity — one complete date selection experience |
| `Module` | A single step (Decision or Quiz) |
| `Card` | One option within a Decision Module |
| `Selection` | Completed submission from the selector |
| `Token` | UUID in the share URL that grants selector access |
| `Creator` | Authenticated user who builds flows |
| `Selector` | The girlfriend — no account, accesses via token URL |

---

## Security

- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never pass to client components
- Flow tokens logged as first 8 chars only
- Selection content (answers, messages) never logged
- Security headers set in `next.config.ts` — do not remove
