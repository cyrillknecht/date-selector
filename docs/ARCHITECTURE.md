# Technical Architecture Document
## Date Night Selector

**Version:** 1.0  
**Date:** 2026-04-26  
**Author:** Cyrill Knecht

---

## 1. Purpose

This document describes the technical architecture of the Date Night Selector — a private, animated web application for curating and presenting romantic date options. It covers system context, component decomposition, data flow, infrastructure, and cross-cutting concerns. It is the authoritative reference for any implementation decisions not covered by a dedicated ADR.

---

## 2. System Context

The system has two types of users and no external integrations beyond email delivery.

```
┌─────────────────────────────────────────────────────────┐
│                    Date Night Selector                  │
│                                                         │
│  ┌──────────────┐          ┌─────────────────────────┐  │
│  │   Creator    │          │  Selector (girlfriend)  │  │
│  │  (Cyrill)    │          │  (link-gated, no login) │  │
│  └──────┬───────┘          └───────────┬─────────────┘  │
│         │ authenticated                │ token in URL    │
│         ▼                              ▼                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Next.js Application                   │ │
│  │         (creator dashboard + selector UI)          │ │
│  └──────────────────────┬──────────────────────────── ┘ │
│                         │                               │
│            ┌────────────┴────────────┐                  │
│            ▼                         ▼                  │
│     ┌─────────────┐         ┌──────────────┐            │
│     │  Supabase   │         │    Resend    │            │
│     │  (DB +      │         │   (email     │            │
│     │   Storage)  │         │  delivery)   │            │
│     └─────────────┘         └──────────────┘            │
└─────────────────────────────────────────────────────────┘
```

**External actors:**
- **Creator** — authenticated via Supabase Auth; manages flows, views selections
- **Selector** — accesses via a unique token URL; no account required

**External systems:**
- **Supabase** — PostgreSQL database, file storage, authentication
- **Resend** — transactional email (selection notification to creator)

---

## 3. Tech Stack Summary

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR + API routes in one, first-class Vercel support |
| Language | TypeScript | Type safety across DB ↔ API ↔ UI boundary |
| Styling | Tailwind CSS v4 + shadcn/ui | Zero-runtime utility CSS + owned UI primitives |
| Animations | Framer Motion + canvas-confetti | Declarative gestures, layout animations, exit transitions |
| Database | Supabase (PostgreSQL) | Managed Postgres with RLS, type generation, migrations |
| File Storage | Supabase Storage | Photo upload and CDN delivery |
| Auth | Supabase Auth | Creator-only authentication; selector uses token URL |
| Email | Resend + React Email | Simple API, HTML templates as React components |
| Hosting | Vercel | Zero-config Next.js hosting, automatic preview deploys |
| CI/CD | GitHub Actions | Lint, typecheck, test, infra apply, migration apply |
| IaC | Terraform + Terraform Cloud | Vercel and Supabase provisioning, remote state |

---

## 4. Application Architecture

### 4.1 Route Structure

```
app/
  creator/                 # Auth-required routes (no route group parens — needed for /creator/* URLs)
    layout.tsx             # Auth guard + dashboard shell; all pages use force-dynamic
    dashboard/
      page.tsx             # Flow list + status overview
    flows/
      [id]/
        page.tsx           # Edit flow (cards, modules, settings)
        preview/page.tsx   # Preview the selector experience
    selections/
      [flowId]/page.tsx    # View all submissions for a flow

  (selector)/              # Route group — public, token-gated; parens collapse URL segment
    [token]/
      page.tsx             # Full selector experience (SelectorFlow client component)

  login/
    page.tsx               # Server component wrapper
    LoginForm.tsx          # 'use client' — wrapped in <Suspense> for useSearchParams

  api/
    upload/route.ts        # Validate session + file, upload to date-photos bucket, return { url }
```

**Key routing decisions:**
- `creator/` has no parentheses — `(creator)/` would strip the segment and break `/creator/dashboard`
- `(selector)/` keeps parens — the token IS the URL segment, no prefix needed
- All `creator/` pages export `const dynamic = 'force-dynamic'` to prevent stale static rendering

**Mutations via Server Actions** (not API routes) for all creator operations — auth is implicit via SSR cookie.

### 4.2 Component Architecture

Components are split by concern, not by route:

```
components/
  creator/
    PhotoUploader.tsx      # Drag-and-drop photo/video upload to /api/upload
    ShareModal.tsx         # Copy share link + QR code

  selector/
    DecisionStep.tsx       # Card grid with per-card MediaCarousel + expand panel
    QuizStep.tsx           # Animated question sequence
    ConfirmedDatePage.tsx  # Shown to selector when creator has confirmed the date
    CountdownTimer.tsx     # Live countdown to the confirmed date (Swiss German labels)
    CalendarLinks.tsx      # Google Calendar link + .ics download
    PolaroidBackground.tsx # Decorative background with polaroid images
    EasterEgg.tsx          # Hidden interaction on the confirmed page
```

### 4.3 State Management

No global state library is used. State is managed at the appropriate level:

- **Creator dashboard** — React Server Components fetch data server-side; mutations go through Next.js Server Actions or API routes with `router.refresh()`
- **Selector flow** — `FlowController` holds the in-progress selection state in component state (`useState`). On final submission, the full selection is POSTed to `/api/selections` in one request. Nothing is persisted mid-flow to avoid partial submissions.

---

## 5. Data Architecture

### 5.1 Entity Relationship (simplified)

```
flows ──────────────────────────────────────────────┐
  │ id, title, token, status, intro_msg, outro_msg   │
  │ user_id (FK → auth.users)                        │
  │ confirmed_card_id (FK → cards), confirmed_at     │
  │ meeting_point                                    │
  │                                                  │
  ├──< decision_modules                              │
  │      id, flow_id, position, prompt_text          │
  │         │                                        │
  │         └──< cards                               │
  │                id, decision_module_id, position  │
  │                title, description, location      │
  │                price_range, mood_tags[]          │
  │                photo_urls[], url                 │
  │                                                  │
  └──< quiz_modules                                  │
         id, flow_id, position, title               │
            │                                       │
            └──< quiz_questions                     │
                   id, quiz_module_id, position     │
                   question_text, options[]         │
                                                    │
selections ─────────────────────────────────────────┘
  id, flow_id, submitted_at, message

  └──< selection_answers
         id, selection_id, module_id, module_type
         chosen_card_ids[], chosen_option_text
```

### 5.2 Access Patterns

| Actor | Operation | Mechanism |
|---|---|---|
| Creator | Read/write all data | Supabase Auth session + service role in API routes |
| Selector | Read published flow by token | RLS policy: `status = 'published' AND token = :token` |
| Selector | Insert selection | RLS policy: `INSERT` allowed on `selections` for any anon user with valid flow token |
| Public | Read photos | Supabase Storage bucket is public-readable |

### 5.3 Schema Migrations

Managed via the Supabase CLI migration system:

```
supabase/migrations/
  20260426000001_initial_schema.sql
  20260426000002_rls_policies.sql
  20260426000003_indexes.sql
  20260426000004_storage.sql
  20260426000005_create_storage_bucket.sql   # date-photos bucket, image MIME types
  20260426000006_confirmed_date.sql          # confirmed_card_id, confirmed_at, meeting_point on flows
  20260426000007_card_url.sql               # url column on cards
  20260426000008_security_fixes.sql         # video MIME types + 100 MB limit; user_id on flows + RLS
```

Migrations are applied automatically in the production deploy pipeline via `supabase db push`.

---

## 6. Infrastructure Architecture

### 6.1 Environments

| Environment | Branch | URL Pattern | Database |
|---|---|---|---|
| Production | `main` | `date-selector.vercel.app` (or custom domain) | Supabase prod project |
| Preview | PR branches | `date-selector-{hash}.vercel.app` | Supabase prod project (read-only recommended) |
| Local | local | `localhost:3000` | Supabase local via Docker |

### 6.2 Infrastructure Components (Terraform-managed)

```
infra/
  vercel.tf       →  Vercel project, env var references, domain
  supabase.tf     →  Supabase project, storage bucket
  variables.tf    →  Input variables
  outputs.tf      →  Project URL, Supabase URL
  main.tf         →  Provider versions, Terraform Cloud backend
```

### 6.3 CI/CD Flow

```
Developer pushes branch
         │
         ▼
  GitHub Actions: ci.yml
  ├── ESLint
  ├── tsc --noEmit
  └── Vitest

  If /infra/** changed:
  └── infra-plan.yml → terraform plan → comment on PR

  Vercel: auto-generates preview URL
         │
         ▼ (PR merged to main)

  GitHub Actions: deploy.yml
  ├── supabase link --project-ref $SUPABASE_PROJECT_ID
  ├── supabase db push --password $SUPABASE_DB_PASSWORD --yes
  └── (Vercel auto-deploys on push to main)

Production URL: https://date-selector-selector.vercel.app
Supabase project: htztpctkkjfyobrbhdld
```

---

## 7. Security

| Concern | Approach |
|---|---|
| Creator auth | Supabase Auth — email/password or Google OAuth; JWT stored in httpOnly cookie via `@supabase/ssr` |
| Google OAuth | Redirect to `/auth/callback` which exchanges the code for a session via `createSessionClient` |
| Per-creator isolation | `flows.user_id` FK to `auth.users`; RLS policy `user_id = auth.uid()` enforces owner-only access |
| Selector access | Cryptographically random UUID token in the URL; validated against the `flows` table on every request |
| Media uploads | Creator-only write; `/api/upload` validates session before proxying to Supabase Storage; bucket enforces 10 MB image / 100 MB video limits and allowed MIME types |
| API secrets | Stored in GitHub Actions secrets and Vercel env vars; never committed to the repo |
| RLS | All database tables have RLS enabled; service role bypasses RLS — all creator Server Actions call `requireAuth()` first |
| Draft flows | `status = 'draft'` flows are invisible to anon/selector RLS policies; only the owner can read them |
| Submission guard | `submitSelection` explicitly checks `status = 'published'` before inserting — service role bypasses RLS so this is enforced at the application layer |

---

## 8. Key Design Decisions

All significant technology choices are documented in the `/docs/adr/` directory:

| ADR | Decision |
|---|---|
| [ADR-001](adr/ADR-001-frontend-framework.md) | Next.js 15 as the frontend framework |
| [ADR-002](adr/ADR-002-language.md) | TypeScript as the project language |
| [ADR-003](adr/ADR-003-styling.md) | Tailwind CSS v4 + shadcn/ui for styling |
| [ADR-004](adr/ADR-004-animations.md) | Framer Motion as the animation library |
| [ADR-005](adr/ADR-005-backend-database.md) | Supabase for backend, database, and storage |
| [ADR-006](adr/ADR-006-email-notifications.md) | Resend for transactional email |
| [ADR-007](adr/ADR-007-hosting.md) | Vercel for hosting |
| [ADR-008](adr/ADR-008-cicd.md) | GitHub Actions for CI/CD |
| [ADR-009](adr/ADR-009-infrastructure-as-code.md) | Terraform + Terraform Cloud for IaC |

---

## 9. Operational Guides

| Document | Description |
|---|---|
| [Redeployment Guide](REDEPLOYMENT.md) | Step-by-step: spin up a fresh instance from scratch |
| [Platform Migration](PLATFORM_MIGRATION.md) | How to swap Vercel, Supabase, Auth, Storage, or Email for alternatives |
| [Commercial Roadmap](COMMERCIAL_ROADMAP.md) | Stripe billing, open sign-up, and what it takes to go commercial |

---

## 10. Full Documentation Index

### C4 Diagrams
| Document | Description |
|---|---|
| [L1 — System Context](c4/L1-system-context.md) | System and external actors |
| [L2 — Containers](c4/L2-containers.md) | Deployable units and communication |
| [L3 — Next.js Components](c4/L3-components-nextjs.md) | Internal Next.js application structure |
| [L3 — Supabase Components](c4/L3-components-supabase.md) | Internal Supabase platform structure |

### Diagrams
| Document | Description |
|---|---|
| [Sequence: Selector Flow](diagrams/sequence-selector-flow.md) | Girlfriend completing a selection |
| [Sequence: Creator Publish](diagrams/sequence-creator-publish.md) | Creator building and publishing a flow |
| [State: Flow Lifecycle](diagrams/state-flow-lifecycle.md) | Flow entity state machine |
| [Deployment Diagram](diagrams/deployment.md) | Infrastructure and traffic routing |

### Data Architecture
| Document | Description |
|---|---|
| [ERD](data/ERD.md) | Entity relationship diagram |
| [Data Dictionary](data/data-dictionary.md) | All tables, columns, types, constraints |

### API
| Document | Description |
|---|---|
| [OpenAPI Spec](api/openapi.yaml) | Full API specification |
| [API Design Principles](api/api-design.md) | Conventions and standards |

### Security
| Document | Description |
|---|---|
| [Threat Model](security/threat-model.md) | STRIDE analysis |
| [Auth & Authorization Design](security/auth-design.md) | Session model, token design, permission matrix |

### Operations
| Document | Description |
|---|---|
| [Observability Strategy](operations/observability.md) | Logging, alerting, SLOs |
| [Branching Strategy](operations/branching-strategy.md) | Git workflow and commit conventions |
| [Testing Strategy](operations/testing-strategy.md) | Test pyramid, tools, coverage targets |
| [Error Handling Strategy](operations/error-handling.md) | Error boundaries, logging standards |

### Domain
| Document | Description |
|---|---|
| [Glossary](domain/glossary.md) | Ubiquitous language — canonical terms for all entities and concepts |

---

## 10. Out of Scope (v1)

See [PRD.md](../PRD.md) for the full list. From an architecture perspective, the following are explicitly not modeled:

- Multi-tenancy or user accounts beyond the single creator
- Real-time updates (WebSockets / Supabase Realtime)
- Mobile native apps
- Offline support
