# Deployment Diagram

Shows where each component runs, network boundaries, and how traffic flows in production.

---

## Diagram

```mermaid
graph TB
  subgraph Internet["Internet"]
    C[Creator Browser]
    S[Selector Browser]
  end

  subgraph Vercel["Vercel Edge Network (Global CDN)"]
    direction TB
    EDGE[Edge Middleware\nJWT validation]
    SF1[Serverless Function\nCreator Dashboard Pages]
    SF2[Serverless Function\nSelector Pages]
    SF3[Serverless Function\nAPI Routes]
    STATIC[Static Assets\nJS bundles, fonts, icons]
  end

  subgraph Supabase["Supabase Platform (eu-central-1)"]
    direction TB
    PG[(PostgreSQL 15\nApplication DB)]
    AUTH[GoTrue Auth Server]
    STORE[Storage API]
    CDN_S[Storage CDN\nPhoto delivery]
  end

  subgraph Resend["Resend"]
    EMAIL[Email Delivery]
  end

  subgraph GitHub["GitHub"]
    REPO[Repository\nmain branch]
    ACTIONS[GitHub Actions\nCI/CD Runners]
  end

  subgraph TFC["Terraform Cloud"]
    STATE[Remote State\n+ State Locking]
  end

  C -- HTTPS --> EDGE
  S -- HTTPS --> EDGE
  EDGE --> SF1
  EDGE --> SF2
  EDGE --> SF3
  C -- HTTPS --> STATIC
  S -- HTTPS --> STATIC

  SF1 -- HTTPS, service role --> PG
  SF2 -- HTTPS, service role --> PG
  SF3 -- HTTPS, service role --> PG
  SF1 -- HTTPS --> AUTH
  SF3 -- HTTPS --> STORE
  SF3 -- HTTPS --> EMAIL

  C -- HTTPS --> CDN_S
  S -- HTTPS --> CDN_S
  C -- HTTPS, signed URL --> STORE

  REPO -- push to main --> ACTIONS
  ACTIONS -- deploy trigger --> Vercel
  ACTIONS -- supabase db push --> PG
  ACTIONS -- terraform apply --> TFC
  TFC -- Vercel API --> Vercel
  TFC -- Supabase Mgmt API --> Supabase
```

---

## Environments

| Environment | Vercel Project | Supabase Project | Branch |
|---|---|---|---|
| Production | `date-selector` (prod) | `date-selector-prod` | `main` |
| Preview | Auto per PR | `date-selector-prod` (read-heavy; no destructive ops) | any PR branch |
| Local dev | `localhost:3000` | Supabase local (Docker) | any feature branch |

---

## Network Trust Boundaries

| Boundary | Description |
|---|---|
| Internet → Vercel Edge | All public traffic. TLS enforced. Rate limiting via Vercel |
| Vercel → Supabase | Internal HTTPS. Service role key never leaves the Vercel serverless environment |
| Browser → Supabase Storage CDN | Direct photo fetch. Public read, no auth required |
| Browser → Supabase Storage API | Direct upload via short-lived signed URL only. No raw credentials in browser |
| GitHub Actions → External APIs | Secrets injected as env vars at runtime; never logged |

---

## Region Strategy

| Service | Region | Rationale |
|---|---|---|
| Vercel | Global edge | Static assets and middleware served from nearest PoP |
| Supabase | eu-central-1 (Frankfurt) | Closest to primary users (Switzerland) |
| Resend | Managed | No region choice; SLA is sufficient for non-critical email |

---

## Key Constraints

- Vercel free tier: serverless functions time out at **10 seconds**. All API routes complete well within this (DB queries < 100ms, Resend API < 500ms).
- Supabase free tier: projects **pause after 7 days of inactivity**. Acceptable for a personal project; can be upgraded to Pro ($25/mo) if uptime guarantee is needed.
- No persistent server processes — the entire application is serverless. Cold starts are mitigated by Vercel's keep-warm behavior on frequently accessed routes.
