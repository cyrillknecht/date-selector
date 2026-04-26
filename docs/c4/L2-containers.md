# C4 Level 2 — Container Diagram

Answers: **What are the deployable/runnable units and how do they communicate?**

---

## Diagram

```mermaid
C4Container
  title Container Diagram — Date Night Selector

  Person(creator, "Creator (Cyrill)", "Authenticated user")
  Person(selector, "Selector (Girlfriend)", "Anonymous, token-gated")

  System_Boundary(app_boundary, "Date Night Selector") {

    Container(nextjs, "Next.js Application", "Next.js 15 / TypeScript", "Serves both the creator dashboard (SSR, authenticated) and the selector experience (SSR, token-gated). Contains all UI and API route logic.")

    Container(supabase_db, "PostgreSQL Database", "Supabase / PostgreSQL 15", "Stores flows, modules, cards, questions, selections, and answers. Row-level security enforces access control.")

    Container(supabase_storage, "File Storage", "Supabase Storage / S3-compatible", "Stores and serves photos uploaded to date cards. Public-readable bucket with creator-only write access.")

    Container(supabase_auth, "Auth Service", "Supabase Auth / GoTrue", "Handles creator authentication (email + password or magic link). Issues JWTs used by the Next.js app.")
  }

  System_Ext(resend, "Resend", "Email delivery API")
  System_Ext(vercel_cdn, "Vercel Edge Network", "CDN and serverless function runtime")

  Rel(creator, nextjs, "Manages flows, uploads photos, views submissions", "HTTPS / Browser")
  Rel(selector, nextjs, "Opens private link, completes flow, submits selection", "HTTPS / Browser")

  Rel(nextjs, supabase_db, "Read/write flows, modules, cards, selections", "HTTPS / Supabase JS SDK (service role server-side, anon client-side with RLS)")
  Rel(nextjs, supabase_storage, "Upload photos (signed URL), serve CDN URLs", "HTTPS / Supabase Storage SDK")
  Rel(nextjs, supabase_auth, "Authenticate creator, validate JWT on protected routes", "HTTPS / Supabase Auth SDK")
  Rel(nextjs, resend, "POST selection notification email", "HTTPS / Resend API")

  Rel(vercel_cdn, nextjs, "Executes serverless functions, caches static assets", "Internal")
```

---

## Container Descriptions

### Next.js Application
The single deployable unit. Handles all concerns:
- Server-side rendering of public selector pages for fast mobile load
- Creator dashboard (authenticated, server + client components)
- API routes for mutations, file upload URL generation, and selection submission
- Deployed as serverless functions on Vercel's edge network

### PostgreSQL Database (Supabase)
All application data. Row-level security policies enforce that:
- The creator can read and write everything they own
- Anonymous users can only read published flows (by token) and insert selections

### File Storage (Supabase Storage)
Photos for date cards. The Next.js API generates a short-lived signed upload URL; the browser uploads directly to Supabase Storage (bypassing the Next.js server). The resulting public CDN URL is stored in the database.

### Auth Service (Supabase Auth / GoTrue)
Creator-only. Issues a JWT on login, refreshed automatically. The Next.js middleware validates the JWT on every request to `/(creator)/*` routes. Selector access is not authenticated — it is controlled by token validation in the API route.

---

## Communication Patterns

| From | To | Protocol | Auth |
|---|---|---|---|
| Browser (creator) | Next.js | HTTPS | Supabase JWT (httpOnly cookie) |
| Browser (selector) | Next.js | HTTPS | Token in URL path |
| Next.js (server) | Supabase DB | HTTPS | Service role key (server-side only) |
| Next.js (client components) | Supabase DB | HTTPS | Anon key + RLS |
| Browser | Supabase Storage | HTTPS | Signed upload URL (time-limited) |
| Next.js (server) | Resend | HTTPS | Resend API key |
