# C4 Level 3 — Components: Next.js Application

Answers: **What are the major internal components of the Next.js application and how do they interact?**

---

## Diagram

```mermaid
C4Component
  title Component Diagram — Next.js Application

  Person(creator, "Creator", "Authenticated")
  Person(selector, "Selector", "Token-gated")

  Container_Boundary(nextjs, "Next.js Application") {

    Component(middleware, "Auth Middleware", "next/middleware", "Validates Supabase JWT on all /(creator)/* routes. Redirects unauthenticated requests to /login.")

    Component(creator_ui, "Creator Dashboard", "React Server + Client Components", "Flow builder, card editor, quiz builder, share modal, selection viewer. All mutations go through API routes.")

    Component(selector_ui, "Selector Experience", "React Client Components", "Animated flow controller, decision steps, quiz steps, confirmation screen. Reads flow data server-side on page load.")

    Component(api_flows, "Flows API", "Next.js Route Handler", "CRUD for flows and their modules. Creator-only (validates JWT). Publishes flows and generates tokens.")

    Component(api_upload, "Upload API", "Next.js Route Handler", "Generates short-lived Supabase Storage signed upload URLs. Creator-only.")

    Component(api_selections, "Selections API", "Next.js Route Handler", "Accepts POST from selector with complete selection payload. Validates flow token. Writes to DB. Triggers email.")

    Component(supabase_client, "Supabase Client (Server)", "supabase-js / @supabase/ssr", "Server-side DB client using service role key. Used by API routes and server components.")

    Component(supabase_browser, "Supabase Client (Browser)", "supabase-js / @supabase/ssr", "Browser-side DB client using anon key + RLS. Used by client components for real-time reads.")

    Component(email_service, "Email Service", "Resend SDK + React Email", "Composes and sends selection notification email to creator. Called from Selections API.")

    Component(image_optimizer, "Image Optimizer", "next/image", "Optimizes and serves photos from Supabase Storage CDN URLs. Handles responsive sizing and format conversion.")
  }

  System_Ext(supabase, "Supabase (DB + Storage + Auth)")
  System_Ext(resend, "Resend")

  Rel(creator, middleware, "All /creator/* requests")
  Rel(middleware, creator_ui, "Passes authenticated request")
  Rel(selector, selector_ui, "Opens /:token URL")

  Rel(creator_ui, api_flows, "Create/update/publish flows", "fetch()")
  Rel(creator_ui, api_upload, "Request signed upload URL", "fetch()")
  Rel(selector_ui, api_selections, "POST final selection", "fetch()")

  Rel(api_flows, supabase_client, "Read/write flows, modules, cards")
  Rel(api_upload, supabase_client, "Generate signed storage URL")
  Rel(api_selections, supabase_client, "Write selection + answers")
  Rel(api_selections, email_service, "Trigger notification")

  Rel(selector_ui, supabase_browser, "Read published flow data (RLS)")
  Rel(creator_ui, supabase_browser, "Real-time selection count")

  Rel(supabase_client, supabase, "HTTPS / service role")
  Rel(supabase_browser, supabase, "HTTPS / anon key + RLS")
  Rel(email_service, resend, "HTTPS / API")
  Rel(image_optimizer, supabase, "CDN URL passthrough")
```

---

## Component Responsibilities

### Auth Middleware
- Runs on every request to `/(creator)/*`
- Reads the Supabase session from the httpOnly cookie
- Refreshes expired JWT tokens transparently
- Redirects to `/login` on missing or invalid session

### Creator Dashboard
- Server Components fetch initial data (flow list, card data) server-side for fast render
- Client Components handle interactive state: drag-to-reorder modules, photo preview, live preview of the selector experience
- All writes are `fetch()` calls to the API routes — no direct DB access from the client

### Selector Experience
- Page component is a Server Component that fetches the full published flow by token on load
- Passes data down to `FlowController` (Client Component) which owns the multi-step progression state
- Nothing is written to the DB during flow progression; the full selection is POSTed in one request on final submission

### Flows API
- `GET /api/flows` — list all flows (creator only)
- `POST /api/flows` — create flow
- `PATCH /api/flows/[id]` — update flow metadata or module ordering
- `POST /api/flows/[id]/publish` — set status to published, generate UUID token
- `DELETE /api/flows/[id]` — soft-delete (sets status to archived)

### Upload API
- `POST /api/upload` — validates creator session, returns `{ signedUrl, publicUrl }` from Supabase Storage
- Browser uploads directly to Supabase using the signed URL (no file data passes through Next.js)

### Selections API
- `POST /api/selections` — validates flow token, validates payload structure, writes `selection` + `selection_answers` rows, calls email service
- Idempotency: checks for duplicate submission from same session to prevent double-send

### Email Service
- Composes a React Email template with full selection summary
- Called synchronously from the Selections API (acceptable — Resend API is fast and failure is non-critical)
- On Resend failure: logs error, does not block the selection from being saved
