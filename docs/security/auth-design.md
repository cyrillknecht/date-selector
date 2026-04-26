# Authentication & Authorization Design

---

## Overview

The system has two access models running in parallel:

| Actor | Identity Mechanism | Scope |
|---|---|---|
| Creator | Supabase Auth JWT (email + password or magic link) | Full read/write access to all data |
| Selector | UUID token embedded in the URL | Read published flows + insert selections |

There is no user registration, no invite system, and no role management. The creator account is created once manually via the Supabase dashboard.

---

## Creator Authentication

### Login Flow

```
1. Creator visits /login
2. Submits email + password (or requests magic link)
3. Next.js API calls Supabase Auth → GoTrue
4. GoTrue validates credentials and returns:
   - access_token (JWT, 1 hour TTL)
   - refresh_token (rotation-based, 7 day TTL)
5. @supabase/ssr stores both tokens in httpOnly cookies:
   - sb-access-token
   - sb-refresh-token
6. Creator is redirected to /creator/dashboard
```

### Session Management

- JWT expiry: **1 hour**
- Refresh token expiry: **7 days** (rolling)
- Tokens are stored in **httpOnly, Secure, SameSite=Lax cookies** — not accessible to JavaScript
- Next.js middleware (`middleware.ts`) runs on every `/(creator)/*` request:
  - Reads cookies via `@supabase/ssr`
  - If JWT is valid: passes through
  - If JWT is expired but refresh token is valid: silently refreshes and sets new cookies
  - If both are invalid: redirects to `/login?reason=session_expired`

### JWT Payload (creator)

```json
{
  "sub": "creator-user-uuid",
  "role": "authenticated",
  "email": "cyrill@example.com",
  "exp": 1745678400,
  "iss": "https://project.supabase.co/auth/v1"
}
```

The `role` claim is used by Supabase RLS policies to distinguish the creator from anonymous users.

### Logout

`POST /api/auth/logout` calls `supabase.auth.signOut()` which:
1. Invalidates the refresh token server-side (GoTrue blocklist)
2. Clears both cookies
3. Redirects to `/login`

---

## Selector Access (Token-Based)

The selector has no account and no session. Access is controlled by a secret UUID token in the URL path.

### Token Properties

- Generated using `crypto.randomUUID()` at publish time (server-side only)
- 122 bits of entropy — brute force is computationally infeasible
- Stored in the `flows.token` column (UNIQUE index)
- **Never changes** after publish (re-publish reuses the same token)
- Invalidated only by changing the flow `status` to `unpublished` or `archived`

### Token Validation Flow

```
1. Selector opens /:token
2. Next.js Server Component queries DB:
   SELECT * FROM flows WHERE token = :token AND status = 'published'
3. If not found → render 404 page ("This link is not active")
4. If found → render selector landing page
5. On POST /api/selections, token is validated again server-side
   before any write is performed
```

The token is **validated twice**: on page load (to gate the UI) and on submission (to gate the write). This prevents a scenario where someone bookmarks the page after a flow is unpublished and submits stale data.

---

## Permission Matrix

| Operation | Creator (JWT) | Selector (token) | Anonymous |
|---|---|---|---|
| Read draft flow | ✅ | ❌ | ❌ |
| Read published flow | ✅ | ✅ (matching token only) | ❌ |
| Create/edit flow | ✅ | ❌ | ❌ |
| Publish flow | ✅ | ❌ | ❌ |
| Upload photo | ✅ | ❌ | ❌ |
| Submit selection | ✅ (for testing) | ✅ | ❌ |
| Read selections | ✅ | ❌ | ❌ |

---

## RLS Enforcement

All permissions above are enforced at the **database level** via PostgreSQL Row-Level Security, not only in application code. This means even a compromised API route cannot bypass access controls — the database itself rejects unauthorized queries.

The application uses two Supabase clients:
- **Server-side (service role):** Bypasses RLS. Used only in API routes for mutations where the creator JWT has already been validated at the application layer.
- **Client-side (anon key):** Subject to RLS. Used in browser client components. Safe to expose because RLS enforces all access rules.

---

## Security Headers

Set via `next.config.ts` for all responses:

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforce HTTPS |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' supabase.co data:; ...` | Prevent XSS |
