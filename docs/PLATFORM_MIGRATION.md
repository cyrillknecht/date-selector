# Platform Migration Guide

How to move each service layer to an alternative provider. Each section covers why you might migrate, the closest alternative, and what changes in the codebase.

---

## Hosting: Vercel → alternatives

**Current:** Vercel (serverless, auto-deploys from GitHub, edge network)

### Why migrate
- Cost at scale (Vercel Pro/Enterprise pricing)
- Need persistent server processes (WebSockets, background jobs)
- Vendor lock-in concern

### Option A: Railway
Closest drop-in. Supports Next.js natively, Dockerfile-based, persistent containers (good for WebSockets later).

```bash
# What changes:
# 1. Add a Dockerfile (or Railway auto-detects Next.js)
# 2. Replace vercel deploy in deploy.yml:
railway up --service date-selector

# 3. Update infra/vercel.tf → infra/railway.tf
# 4. Update APP_URL env var to Railway URL
```

Code changes: none. Railway runs Next.js identically.

### Option B: Fly.io
Good for Europe-hosted deployments (low latency for Swiss users). Docker-based.

```bash
fly launch --name date-selector
fly deploy
# Secrets: fly secrets set KEY=value
```

Code changes: none. Add `fly.toml` to repo.

### Option C: Self-hosted VPS (Hetzner, DigitalOcean)
Maximum control, lowest cost at scale. Requires managing Nginx + Node process + SSL certs.

```bash
# Roughly:
docker build -t date-selector .
docker run -p 3000:3000 --env-file .env date-selector
# Nginx reverse proxy + Let's Encrypt cert
```

Code changes: add `Dockerfile`, `next.config.ts` already uses standalone output if `output: 'standalone'` is added.

---

## Database: Supabase → alternatives

**Current:** Supabase (managed PostgreSQL + RLS + migrations via CLI)

The codebase uses raw SQL migrations and the Supabase JS client (`@supabase/supabase-js`). Auth and Storage are tightly coupled to Supabase — migrating the database alone while keeping Auth/Storage is cleanest.

### Option A: Neon
Serverless PostgreSQL, branching (great for preview environments), Supabase-compatible.

```bash
# What changes:
# 1. Replace Supabase client with a postgres driver (postgres.js or Drizzle ORM)
# 2. Migrations: apply with psql or a migration tool (Drizzle Kit, Flyway)
# 3. Connection string in env vars instead of Supabase URL + anon key
# 4. RLS policies work identically — Neon is standard PostgreSQL
```

Effort: **M** — mostly replacing `@supabase/supabase-js` calls with direct SQL queries or an ORM.

### Option B: PlanetScale (MySQL)
Only if MySQL is acceptable. RLS doesn't exist in MySQL — access control moves entirely to the application layer. Not recommended for this codebase given how heavily it uses RLS.

### Option C: Self-hosted PostgreSQL
Identical to Neon from a code perspective. Add a Postgres container to a Docker Compose setup.

---

## Auth: Supabase Auth → alternatives

**Current:** Supabase Auth (JWT in httpOnly cookies, Google OAuth, session via `@supabase/ssr`)

Auth is the most coupled part of the stack. `createSessionClient()` and `createServerClient()` both go through Supabase. Migrating auth requires replacing these clients.

### Option A: Clerk
Best DX, drop-in for Next.js App Router. Handles email/password, Google OAuth, magic links, MFA out of the box.

```bash
pnpm add @clerk/nextjs

# What changes:
# 1. Replace lib/supabase/session.ts with Clerk middleware
# 2. Replace requireAuth() calls with Clerk's auth() helper
# 3. Replace LoginForm.tsx with Clerk's <SignIn> component or custom UI
# 4. app/auth/callback/route.ts → removed (Clerk handles OAuth internally)
# 5. middleware.ts → replace with Clerk's clerkMiddleware()
# 6. RLS: replace auth.uid() with Clerk user ID passed as a claim
```

Effort: **L** — significant refactor of auth layer but no database schema changes needed (user_id stays UUID).

### Option B: Auth.js (NextAuth v5)
Open source, no vendor. More setup, fewer managed features.

```bash
pnpm add next-auth@beta
# Configure providers in auth.ts
# Session stored in DB (add sessions table to migrations)
```

Effort: **L** — similar to Clerk but more manual configuration.

### Option C: Better Auth
Modern TypeScript-first alternative to NextAuth. Good Supabase integration.

---

## Storage: Supabase Storage → alternatives

**Current:** Supabase Storage (S3-compatible bucket, served via CDN URL, 100 MB video / 10 MB image limits enforced at bucket level)

The upload route at `app/api/upload/route.ts` uses the Supabase Storage client. Swapping it out is self-contained.

### Option A: Cloudflare R2
S3-compatible, zero egress fees, global CDN. Best price/performance for media.

```typescript
// Replace in app/api/upload/route.ts:
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
})

await r2.send(new PutObjectCommand({
  Bucket: 'date-photos',
  Key: fileName,
  Body: buffer,
  ContentType: file.type,
}))
const url = `https://pub-xxx.r2.dev/${fileName}`
```

Effort: **S** — only `app/api/upload/route.ts` changes. All downstream code uses the URL string.

### Option B: AWS S3 + CloudFront
More complex, more expensive egress, but familiar if already using AWS.

### Option C: Bunny.net
Cheap CDN-native storage. Good for Europe. Similar S3-like API.

---

## Email: Resend → alternatives

**Current:** Resend with React Email templates

The email call is isolated to `lib/actions/submit.ts`. The React Email template in `emails/SelectionEmail.tsx` renders to HTML — this is reusable across providers.

### Any SMTP provider
```typescript
// Replace in lib/actions/submit.ts:
import { Render } from '@react-email/render'
import nodemailer from 'nodemailer'

const html = await render(SelectionEmail({ ... }))
await transporter.sendMail({ from, to, subject, html })
```

Good alternatives: **Postmark** (best deliverability), **SendGrid**, **AWS SES** (cheapest at scale).

Effort: **S** — swap the send call, keep the React Email template.

---

## Migration Playbook (full stack swap)

If moving everything at once (e.g. to a fully self-hosted setup):

1. **Provision new infrastructure** — new Postgres, new S3-compatible storage, new SMTP account
2. **Migrate data** — `pg_dump` from Supabase, restore to new Postgres; copy storage objects via `rclone`
3. **Update auth** — swap Supabase Auth for chosen alternative; update `user_id` foreign key if UUIDs change format
4. **Update env vars** — new connection strings, API keys, storage URLs
5. **Update `app/api/upload/route.ts`** — point at new storage
6. **Update `lib/actions/submit.ts`** — point at new email provider
7. **Replace Supabase clients** — `lib/supabase/server.ts` and `lib/supabase/session.ts`
8. **Update RLS** — rewrite policies if moving to a DB that doesn't support RLS, or if auth user ID format changes
9. **Update Terraform** — new provider configs for new platforms
10. **Deploy and smoke test** — run the selector happy path end-to-end
