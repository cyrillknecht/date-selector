# Implementation Plan

**Stack:** Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Framer Motion · Supabase · Resend · Vercel · Terraform · GitHub Actions

**Production URL:** `https://date-selector-selector.vercel.app`  
**Supabase project:** `htztpctkkjfyobrbhdld`  
**Status:** All phases complete and deployed.

Each phase maps to one feature branch and one worktree. Phases are ordered by dependency — each unlocks the next. Phases 1–3 are sequential (foundational). Phases 4–8 can overlap once Phase 3 is merged.

---

## Phase 1 — `feat/scaffold`
**Goal:** A running Next.js app with all tooling wired up. Nothing works yet, but every tool is installed and configured.

- [ ] `pnpm create next-app` with TypeScript, App Router, Tailwind, ESLint, `src/` off
- [ ] Install core dependencies: `framer-motion`, `canvas-confetti`, `@supabase/supabase-js`, `@supabase/ssr`, `resend`, `react-email`
- [ ] Install dev dependencies: `vitest`, `@testing-library/react`, `playwright`, `supabase` CLI
- [ ] Configure Tailwind v4 (CSS-first config in `globals.css`, design tokens: warm palette, typography)
- [ ] Install and init shadcn/ui
- [ ] Configure ESLint + Prettier
- [ ] Configure `vitest.config.ts` (unit + component), `playwright.config.ts` (desktop + mobile viewports)
- [ ] Set up `next.config.ts` (security headers, image domains for Supabase Storage CDN)
- [ ] Create route group scaffolding: `app/(creator)/`, `app/(selector)/[token]/`, `app/api/`
- [ ] Create `types/database.ts` placeholder (will be replaced by Supabase gen)
- [ ] `pnpm build` passes, `pnpm lint` passes, `pnpm typecheck` passes

**Deliverable:** Green build, empty shell app, all tooling configured.

---

## Phase 2 — `infra/terraform-and-ci`
**Goal:** Infrastructure provisioned, CI/CD running on every push.

- [ ] Create Supabase project (manual, via dashboard — Terraform provider needs an existing project ID)
- [ ] Create Vercel project linked to GitHub repo
- [ ] Create Terraform Cloud workspace, connect to repo
- [ ] Write `/infra/main.tf` — Terraform Cloud backend, provider versions
- [ ] Write `/infra/vercel.tf` — Vercel project, env var references
- [ ] Write `/infra/supabase.tf` — storage bucket `date-photos`
- [ ] Write `/infra/variables.tf`, `/infra/outputs.tf`
- [ ] `terraform init && terraform plan` passes locally
- [ ] Add GitHub Actions secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `VERCEL_TOKEN`, `TF_API_TOKEN`, `RESEND_API_KEY`
- [ ] Write `.github/workflows/ci.yml` — lint, typecheck, test on every PR
- [ ] Write `.github/workflows/deploy.yml` — terraform apply + supabase db push on merge to `main`
- [ ] Write `.github/workflows/infra-plan.yml` — terraform plan on PRs touching `/infra/`

**Deliverable:** CI runs on every push. Infra is code. Vercel auto-deploys on merge to `main`.

---

## Phase 3 — `feat/database-and-auth`
**Goal:** Schema in place, creator can log in, Supabase types generated.

- [ ] `supabase init`, configure local dev
- [ ] Write migration `001_initial_schema.sql`: all tables per data dictionary (flows, decision_modules, cards, quiz_modules, quiz_questions, selections, selection_answers)
- [ ] Write migration `002_rls_policies.sql`: all RLS policies per auth design doc
- [ ] Write migration `003_indexes.sql`: all indexes per data dictionary
- [ ] Write migration `004_storage.sql`: `date-photos` bucket with RLS policy
- [ ] `supabase db push` applies cleanly to local instance
- [ ] `supabase gen types typescript --local > types/database.ts`
- [ ] Create `lib/supabase/server.ts` (service role client for API routes/Server Components)
- [ ] Create `lib/supabase/client.ts` (anon browser client)
- [ ] Create `lib/supabase/middleware.ts` (JWT refresh + route protection)
- [ ] Wire `middleware.ts` to protect all `/(creator)/*` routes
- [ ] Build `/login` page — email + password form, magic link option
- [ ] Build `/creator/dashboard` skeleton — just "You're logged in" for now
- [ ] Create one authenticated creator account via Supabase dashboard
- [ ] End-to-end: login → dashboard → logout works

**Deliverable:** Schema live, auth working, DB types generated. All subsequent phases build on this.

---

## Phase 4 — `feat/creator-flow-builder`
**Goal:** Creator can build a complete flow (decision modules, quiz modules, cards, questions) and save it as a draft.

**API routes:**
- [ ] `POST /api/flows` — create flow
- [ ] `GET /api/flows` — list flows
- [ ] `GET /api/flows/[id]` — get flow with all modules + cards
- [ ] `PATCH /api/flows/[id]` — update metadata
- [ ] `DELETE /api/flows/[id]` — archive
- [ ] `POST /api/flows/[id]/modules` — add decision or quiz module
- [ ] `PATCH /api/flows/[id]/modules/order` — reorder modules
- [ ] `DELETE /api/flows/[id]/modules/[moduleId]` — remove module
- [ ] `POST /api/flows/[id]/modules/[moduleId]/cards` — add card
- [ ] `PATCH /api/flows/[id]/modules/[moduleId]/cards/[cardId]` — update card
- [ ] `DELETE /api/flows/[id]/modules/[moduleId]/cards/[cardId]` — remove card
- [ ] Add `withErrorHandler` wrapper, `AppError` class, `ErrorCode` enum

**Creator UI:**
- [ ] `/creator/dashboard` — flow list with status badges, "New flow" button
- [ ] `/creator/flows/new` — redirect to `/creator/flows/[id]` after creation
- [ ] `/creator/flows/[id]` — flow editor:
  - Flow metadata (title, intro message, outro message)
  - Module list (drag-to-reorder via Framer Motion drag)
  - "Add Decision Module" / "Add Quiz Module" buttons
  - Decision Module editor: prompt text, allow-multi-select toggle, card list
  - Card editor: title, description, location, price range selector, mood tag input
  - Quiz Module editor: title, question list
  - Question editor: question text, options (min 2)
- [ ] Integration tests for all API routes

**Deliverable:** Creator can build a complete draft flow. No photo upload yet, no publishing.

---

## Phase 5 — `feat/photo-upload`
**Goal:** Creator can attach photos to cards. Photos are stored in Supabase Storage.

- [ ] `POST /api/upload` — validate JWT, generate signed URL + public URL
- [ ] `PhotoUploader` component — drag-and-drop or click-to-select, shows upload progress
- [ ] Direct PUT to Supabase Storage from browser using signed URL
- [ ] Store `publicUrl` on card via `PATCH /api/flows/.../cards/[id]`
- [ ] `PhotoGallery` component — swipeable multi-photo viewer (used in card editor preview)
- [ ] `next/image` configured for Supabase Storage CDN domain
- [ ] Error handling: signed URL failure, upload failure, file size/type validation (max 10MB, image/* only)

**Deliverable:** Cards can have photos. Upload is direct browser → storage (no server proxy).

---

## Phase 6 — `feat/publish-and-share`
**Goal:** Creator can publish a flow, generate a share URL, and share it.

- [ ] `POST /api/flows/[id]/publish` — validate at least one module with content, generate UUID token, set `published_at`
- [ ] Lock mutation endpoints when flow is published (return 423 with `FLOW_LOCKED`)
- [ ] `PATCH /api/flows/[id]` with `status: 'unpublished'` — deactivate link
- [ ] Flow editor: "Publish" button with validation feedback, "Unpublish" button on published flows
- [ ] Share modal — displays full share URL, copy-to-clipboard button, QR code (`qrcode.react`)
- [ ] Flow status badge on dashboard list
- [ ] Flow lifecycle state machine enforced in UI (edit controls hidden when published)
- [ ] `/creator/flows/[id]/preview` — creator can preview the selector experience before publishing (bypasses published check for creator session)

**Deliverable:** Creator can share a working link.

---

## Phase 7 — `feat/selector-experience`
**Goal:** The selector can open the link and complete the full flow. This is the most animation-heavy phase.

**API routes:**
- [ ] `GET /api/flows/[token]` — public, returns published flow with all modules + cards (validate token + status)

**Selector UI — all Framer Motion:**
- [ ] `app/(selector)/[token]/page.tsx` — Server Component fetches flow, passes to client controller
- [ ] Landing page — full-bleed intro, creator's name, "Let's go" button with entrance animation
- [ ] `FlowController` — state machine managing current step, answer accumulation, back navigation
- [ ] `DecisionStep` — card stack with:
  - Staggered card entrance animation
  - Swipe left/right gesture (mobile) + click (desktop) to select
  - Selected state animation (card lifts, highlight)
  - Multi-select mode (cards toggle, "Confirm" button appears)
- [ ] `CardTile` — full photo background, title overlay, mood tags, price range, location
- [ ] `QuizStep` — question sequence with:
  - Slide-in transition per question
  - Binary/multi option buttons with press animation
  - Auto-advance on single-select, "Next" on multi-select
- [ ] Progress indicator — subtle step counter
- [ ] Message field on final step — optional personal message input
- [ ] "Send my choice" button with loading state
- [ ] `ConfirmationScreen` — confetti (`canvas-confetti`), outro message, summary of choices

**Error pages:**
- [ ] `app/(selector)/[token]/not-found.tsx` — "This link is not active" (token invalid or unpublished)
- [ ] Expired-mid-session error UI — "This link has been closed"

**Deliverable:** The full selector experience works end-to-end. This is the centrepiece of the app.

---

## Phase 8 — `feat/selection-submission-and-email`
**Goal:** Selection is saved to the DB and creator receives an email notification.

**API routes:**
- [ ] `POST /api/selections` — validate token server-side, validate payload against flow structure, write `selection` + `selection_answers`, trigger email, handle duplicate (409)
- [ ] `GET /api/selections/[flowId]` — creator-only, returns all selections with resolved card/question data

**Email:**
- [ ] React Email template: `SelectionNotificationEmail` — selection summary with card titles, quiz answers, selector's message, timestamp
- [ ] Resend integration in `lib/email.ts` — `sendSelectionNotification(selection, flow)`
- [ ] Email failure is caught and logged; does not block the 201 response

**Creator UI:**
- [ ] `/creator/selections/[flowId]` — list of all submissions for a flow, with full answer detail
- [ ] Selection count badge on flow dashboard list
- [ ] Real-time selection count update via Supabase Realtime subscription (optional enhancement)

**Deliverable:** Creator gets notified. Complete end-to-end user journey works.

---

## Phase 9 — `feat/polish-and-tests`
**Goal:** Animations refined, edge cases handled, test suite complete.

- [x] Framer Motion `AnimatePresence` slide transitions between all selector steps (`SelectorFlow`)
- [x] `prefers-reduced-motion` respected — `useReducedMotion()` toggles to fade-only in `SelectorFlow` and disables `whileTap` in `DecisionStep`
- [x] Mobile QA on Vercel preview URL (iPhone 14 Pro viewport in Playwright config)
- [x] Complete Vitest unit tests — `lib/utils.ts` (`cn`), `lib/errors.ts` (`AppError`, `withErrorHandler`) — 28 tests, 4 files, all passing
- [x] Vitest component tests — `DecisionStep` (9 tests), `QuizStep` (6 tests)
- [x] Playwright E2E specs — `e2e/creator.spec.ts` (auth redirects, login form), `e2e/selector.spec.ts` (invalid token, gated happy path via `TEST_SELECTOR_TOKEN`)
- [x] CI: `.github/workflows/ci.yml` runs lint + typecheck + Vitest on all non-main branches
- [x] CLAUDE.md updated with real commands, production URL, deployment info

**Notes:**
- Drag reordering in flow builder and keyboard nav on dashboard were scoped out — not yet implemented
- Playwright E2E full happy path (create flow → publish → select) requires a seeded DB; gated by `TEST_SELECTOR_TOKEN` env var

**Deliverable:** Production-ready. Deployed at `https://date-selector-selector.vercel.app`.

---

## Dependency Graph

```
Phase 1 (scaffold)
  └── Phase 2 (infra + CI)
        └── Phase 3 (database + auth)
              ├── Phase 4 (flow builder)    ─┐
              │     └── Phase 5 (photos)    ─┤─ can overlap
              │     └── Phase 6 (publish)   ─┤
              └── Phase 7 (selector UX)     ─┤
              └── Phase 8 (submission+email)─┘
                    └── Phase 9 (polish + tests)
```

Phases 4–8 all depend on Phase 3 being merged. Within that group, Phase 5 depends on Phase 4 (needs cards to exist), and Phase 6 depends on Phase 4 (needs modules to publish). Phase 7 and 8 can be developed in parallel with 4–6.

---

## Worktree Setup (once GitHub remote is added)

```bash
# After Phase 1 is merged to main:
git worktree add ../date-selector-infra infra/terraform-and-ci
git worktree add ../date-selector-db feat/database-and-auth

# After Phase 3 is merged:
git worktree add ../date-selector-builder feat/creator-flow-builder
git worktree add ../date-selector-selector feat/selector-experience
```

Each worktree has its own `.env.local` pointing to the same local Supabase instance.

---

## Environment Variables

Must be set before any phase after Phase 3 works locally:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321          # local
NEXT_PUBLIC_SUPABASE_ANON_KEY=...                        # from supabase start output
SUPABASE_SERVICE_ROLE_KEY=...                            # server-only, never NEXT_PUBLIC_
RESEND_API_KEY=...                                       # from Resend dashboard
```

Production equivalents are set in Vercel (managed by Terraform references, values set manually).
