# ADR-005: Backend and Database

**Status:** Accepted  
**Date:** 2026-04-26  
**Deciders:** Cyrill Knecht

---

## Context

The application needs:

- A relational database to store Flows, DecisionModules, Cards, QuizModules, and Selections
- File storage for photos attached to date cards and sub-options
- Authentication for the creator dashboard (single user)
- A way to generate and validate secret tokens for the selector's shareable link (no login)
- Row-level security so the public selector can only read published flows and write selections

The backend must be free to operate at this scale (one user, low traffic), require minimal operational overhead, and integrate well with Next.js API routes and TypeScript.

### Options Considered

| Option | Notes |
|---|---|
| **Supabase** | Managed PostgreSQL, file storage, auth, row-level security, TypeScript type generation, generous free tier |
| Firebase | NoSQL (less natural for relational flow data), Google ecosystem lock-in, more expensive at scale |
| PlanetScale | MySQL, excellent branching workflow, but no built-in file storage or auth |
| Neon (PostgreSQL) | Serverless PostgreSQL, great DX, but no file storage or auth — would need additional services |
| Railway (self-hosted Postgres) | Full control, but more ops overhead; no built-in storage/auth |

---

## Decision

**Use Supabase for database, file storage, and authentication.**

Supabase replaces three separate services (database, object storage, auth) with a single platform that has first-class TypeScript support. The row-level security (RLS) model is a natural fit for this project's access pattern: the creator can read and write everything; the public selector link can only read published flows and insert a selection row. The Supabase CLI generates TypeScript types directly from the database schema, keeping the type system in sync automatically.

### Data Model (high level)

```
flows
  id, title, intro_message, outro_message, token (unique), status (draft|published), created_at

decision_modules
  id, flow_id, position, prompt_text, allow_multi_select

cards
  id, decision_module_id, title, description, location, price_range, mood_tags[], photo_urls[], position

quiz_modules
  id, flow_id, position, title

quiz_questions
  id, quiz_module_id, position, question_text, options[]

selections
  id, flow_id, created_at, message (optional)

selection_answers
  id, selection_id, module_id, module_type (decision|quiz), chosen_card_ids[], chosen_option_text
```

### File Storage

Photos are uploaded to a Supabase Storage bucket (`date-photos`). The bucket is public-readable for published flows; write access is restricted to authenticated creator sessions. Returned URLs are stored in the `photo_urls` array on the `cards` table.

---

## Consequences

**Positive:**
- Single platform for database, storage, and auth — no service stitching
- Free tier: 500MB database, 1GB storage, 50MB file uploads — sufficient for this project indefinitely
- RLS policies enforce access control at the database level, not just in application code
- `supabase gen types typescript` keeps DB types and app types in sync
- Supabase migrations (`supabase db push`) integrate cleanly with the CI/CD pipeline

**Negative:**
- Supabase free tier projects pause after 1 week of inactivity — acceptable for a personal project, can be upgraded cheaply if needed
- Vendor lock-in to Supabase's Postgres hosting; migrating would require exporting data and adjusting RLS logic
- RLS policies add complexity and must be tested carefully to avoid exposing draft flows

**Neutral:**
- Next.js API routes handle business logic; Supabase is used as a data layer, not as a BFF
- The Supabase JS client (`@supabase/supabase-js`) is used server-side in API routes with the service role key, and client-side with the anon key + RLS
