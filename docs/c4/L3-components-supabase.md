# C4 Level 3 — Components: Supabase

Answers: **What are the internal components of the Supabase platform as used by this system?**

---

## Diagram

```mermaid
C4Component
  title Component Diagram — Supabase Platform

  Container_Boundary(supabase, "Supabase Platform") {

    Component(postgres, "PostgreSQL 15", "Database", "Primary data store. Contains all application tables. RLS enabled on all tables.")

    Component(rls, "Row-Level Security Policies", "PostgreSQL RLS", "Enforces data access rules at the database level, independent of application code.")

    Component(gotrue, "GoTrue Auth Server", "Supabase Auth", "Handles creator login, JWT issuance, and token refresh. Manages the auth.users table.")

    Component(storage_api, "Storage API", "Supabase Storage", "Manages the date-photos bucket. Handles signed URL generation and file metadata.")

    Component(storage_cdn, "Storage CDN", "S3-compatible + CDN", "Serves uploaded photos globally. Public-readable for files in the date-photos bucket.")

    Component(type_gen, "TypeScript Type Generator", "Supabase CLI", "Generates TypeScript types from the live database schema. Run as part of the development workflow.")

    Component(migrations, "Migration Runner", "Supabase CLI / supabase db push", "Applies SQL migration files to the database. Run in CI/CD on deploy.")
  }

  Container(nextjs_server, "Next.js Server", "API Routes + Server Components")
  Container(browser, "Browser", "Client Components")

  Rel(nextjs_server, postgres, "Read/write via service role key — bypasses RLS", "PostgREST / HTTPS")
  Rel(browser, postgres, "Read/write via anon key — subject to RLS", "PostgREST / HTTPS")
  Rel(rls, postgres, "Applied to every anon/authenticated query")
  Rel(nextjs_server, gotrue, "Validate and refresh creator JWT", "HTTPS")
  Rel(browser, gotrue, "Creator login / logout", "HTTPS")
  Rel(nextjs_server, storage_api, "Generate signed upload URL", "HTTPS")
  Rel(browser, storage_api, "Direct file upload via signed URL", "HTTPS PUT")
  Rel(browser, storage_cdn, "Fetch photos for display", "HTTPS")
```

---

## RLS Policy Summary

| Table | Anon (selector) | Authenticated (creator) |
|---|---|---|
| `flows` | SELECT where `status = 'published'` and token matches URL param | Full CRUD on own rows |
| `decision_modules` | SELECT via published flow join | Full CRUD |
| `cards` | SELECT via published flow join | Full CRUD |
| `quiz_modules` | SELECT via published flow join | Full CRUD |
| `quiz_questions` | SELECT via published flow join | Full CRUD |
| `selections` | INSERT only (no read-back) | SELECT all |
| `selection_answers` | INSERT only (no read-back) | SELECT all |

---

## Storage Bucket Policy

| Bucket | Read | Write |
|---|---|---|
| `date-photos` | Public (no auth required) | Creator only (validated via signed URL — URL expires in 60 seconds) |

---

## Notes

- The application **never** exposes the service role key to the browser. It is used exclusively in Next.js server-side code (API routes, Server Components).
- The anon key is safe to expose in the browser because RLS policies restrict all access. Without a valid session or flow token, no data is readable.
- TypeScript types are regenerated locally when the schema changes: `supabase gen types typescript --local > types/database.ts`
