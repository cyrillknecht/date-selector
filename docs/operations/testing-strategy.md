# Testing Strategy

---

## Philosophy

Test behaviour, not implementation. Tests should give confidence that the app works correctly from a user's perspective. Avoid testing framework internals or mocking so deeply that tests no longer resemble real usage.

---

## Test Pyramid

```
         ┌───────────┐
         │    E2E    │  ← few, slow, high confidence
         ├───────────┤
         │Integration│  ← moderate, test API routes + DB
         ├───────────┤
         │   Unit    │  ← many, fast, pure logic only
         └───────────┘
```

---

## Tools

| Layer | Tool | Rationale |
|---|---|---|
| Unit + Integration | **Vitest** | Fast, native ESM, compatible with Next.js and TypeScript, Jest-compatible API |
| Component testing | **Vitest + React Testing Library** | Tests component behaviour from the user's perspective |
| E2E | **Playwright** | Cross-browser, mobile viewport support (critical for this project), excellent Next.js integration |
| DB (integration) | **Supabase local** (Docker) | Real PostgreSQL with RLS; no mocking the database |

---

## Unit Tests

**What:** Pure functions with no side effects and complex logic.

**Examples:**
- `buildFlowUrl(token: string): string` — URL construction
- `mergeAndSortModules(decisions, quizzes): Module[]` — module ordering logic
- `validateSelectionPayload(body, flow): ValidationResult` — input validation
- `formatPriceRange(range: string): string` — display formatting

**What NOT to unit test:**
- React components (use component tests instead)
- Database queries (use integration tests)
- Third-party SDK wrappers

**Coverage target:** 100% of pure utility functions. Not tracked as a percentage of total codebase.

---

## Component Tests

**What:** React components tested in isolation using React Testing Library. Focus on user interactions, not implementation details.

**Examples:**
- `FlowController` — advancing through steps, going back, state persistence
- `CardTile` — renders title, photo, tags; fires onSelect callback on click
- `QuizStep` — renders questions, records answer, advances on selection
- `DecisionStep` — renders cards, multi-select behaviour, disabled state
- `ConfirmationScreen` — renders outro message, shows selector's choices

**Approach:**
- Mock API calls (`fetch`) at the boundary
- Do not test CSS or animation specifics (Framer Motion animations are suppressed in tests via `prefers-reduced-motion: reduce`)
- Use `userEvent` over `fireEvent` for realistic interaction simulation

**Coverage target:** All interactive components have at least one happy-path test and one error-state test.

---

## Integration Tests

**What:** Next.js API routes tested against a real local Supabase instance (Docker). These tests verify the full request → validation → DB write → response cycle.

**Examples:**
- `POST /api/flows` — creates a flow, returns 201 with correct shape
- `POST /api/flows/:id/publish` — sets status, generates token, rejects if no modules
- `PATCH /api/flows/:id` on a published flow — returns 423 Locked
- `POST /api/selections` — writes selection + answers, validates token, rejects invalid token
- `POST /api/selections` duplicate — returns 409
- RLS: anon client cannot read draft flows
- RLS: anon client cannot read selections

**Setup:**
- Tests run against `supabase start` local instance
- Each test resets relevant tables in `beforeEach` using a test helper
- Creator JWT is mocked with a test user created in the local auth service
- No real email is sent; Resend SDK is mocked

**Coverage target:** Every API route has integration tests for happy path + key error cases.

---

## End-to-End Tests (Playwright)

**What:** Full browser tests against a running local dev server + local Supabase. Cover the two critical user journeys.

**Test Scenarios:**

*Creator flow:*
1. Creator logs in
2. Creates a flow with a decision module and two cards
3. Publishes the flow
4. Copies the share URL

*Selector flow (critical path):*
1. Opens the share URL
2. Reads intro message
3. Browses cards, selects one
4. Submits selection
5. Sees confirmation screen

*Error cases:*
1. Invalid token → 404 page renders correctly
2. Attempting to open an unpublished flow URL → 404
3. Submitting with an expired token (flow unpublished mid-session) → error UI

**Device targets:**
- Desktop (1280×800)
- Mobile (390×844 — iPhone 14 Pro equivalent)

E2E tests run in CI on PRs targeting `main`. They are slow (~60–90s) and are the last check before merge.

---

## What We Don't Test

| Thing | Reason |
|---|---|
| Framer Motion animations | Suppressed in test environment; visual QA is done manually on preview URLs |
| Supabase Auth internals | Third-party; trust the SDK |
| Resend email rendering | Resend SDK is mocked; email HTML is reviewed manually |
| Terraform configuration | Validated by `terraform plan` in CI |

---

## CI Integration

| Pipeline step | Tests run |
|---|---|
| Push to any non-main branch | Lint + typecheck + Vitest (unit + component) |
| Push to `main` (deploy pipeline) | Same as above, then supabase migrations, then `vercel deploy --prod` |
| Playwright E2E | Not in CI — run manually with `TEST_SELECTOR_TOKEN` env var pointing to a seeded flow |

---

## Current Test Coverage

| Layer | Status | Location |
|---|---|---|
| Unit — `lib/utils.ts` (`cn`) | ✅ 6 tests | `__tests__/lib/utils.test.ts` |
| Unit — `lib/errors.ts` (`AppError`, `withErrorHandler`) | ✅ 7 tests | `__tests__/lib/errors.test.ts` |
| Component — `DecisionStep` | ✅ 9 tests | `__tests__/components/selector/DecisionStep.test.tsx` |
| Component — `QuizStep` | ✅ 6 tests | `__tests__/components/selector/QuizStep.test.tsx` |
| Integration (API routes vs real DB) | ❌ Not implemented | — |
| E2E — creator auth redirects | ✅ skeleton | `e2e/creator.spec.ts` |
| E2E — selector happy path | ✅ gated by `TEST_SELECTOR_TOKEN` | `e2e/selector.spec.ts` |

---

## Running Tests Locally

```bash
# Unit + Component (no dependencies)
pnpm test

# Single file
pnpm test __tests__/lib/utils.test.ts

# E2E (requires dev server running + a published flow token)
TEST_SELECTOR_TOKEN=<token> pnpm test:e2e
```
