# Commercial Version Roadmap

What it would take to turn this personal app into a product others can pay for.

---

## What already scales

The codebase was built with multi-tenancy in mind from the start:

- `flows.user_id` FK and `creator_own_flows` RLS policy → per-creator data isolation is already enforced at the database level
- No hardcoded user IDs anywhere in the schema
- Supabase Auth supports unlimited users on the Pro plan
- Vercel scales to any traffic volume (cost scales too)
- Storage bucket is shared — fine for multi-tenant use

What is missing is everything around the creator account lifecycle: sign-up, billing, usage limits, and the business infrastructure to support customers.

---

## Architecture changes

### 1. Open sign-up

Currently the creator account is created once manually in the Supabase dashboard. To allow anyone to sign up:

- Add `/signup` page alongside `/login` (same `LoginForm.tsx` pattern, call `supabase.auth.signUp()`)
- No schema changes needed — Supabase Auth already handles multiple users; `flows.user_id` is the isolation boundary
- Remove the "one creator" assumption from the README and dashboard copy

### 2. Usage metering

Track what to bill for. Recommended approach: add a `usage` view or materialized view in Postgres:

```sql
-- What to track per user:
SELECT
  user_id,
  COUNT(DISTINCT f.id)         AS total_flows,
  COUNT(DISTINCT c.id)         AS total_cards,
  SUM(array_length(c.photo_urls, 1)) AS total_media_items,
  SUM(pg_column_size(c.photo_urls))  AS approx_storage_bytes
FROM flows f
JOIN decision_modules dm ON dm.flow_id = f.id
JOIN cards c ON c.decision_module_id = dm.id
GROUP BY f.user_id;
```

Or use Supabase Storage's built-in quota tracking.

### 3. Billing tiers

Recommended tier design (starting simple):

| Tier | Price | Limits | Target |
|---|---|---|---|
| Free | €0 | 1 flow, 5 cards, 50 MB storage | Try it out |
| Lover | €5/month | 10 flows, 50 cards, 2 GB storage | Personal users |
| Pro | €15/month | Unlimited flows + cards, 20 GB storage, custom domain | Power users |

Keep it simple. Don't meter API calls or email sends — those costs are negligible.

### 4. Stripe integration

**Packages:**

```bash
pnpm add stripe @stripe/stripe-js
```

**What to build:**

```
app/
  api/
    stripe/
      webhook/route.ts     ← Stripe sends events here (subscription.created, invoice.paid, etc.)
      checkout/route.ts    ← Create checkout session → redirect to Stripe
  creator/
    billing/page.tsx       ← Plan status, upgrade/downgrade, manage (Stripe billing portal link)
```

**Schema additions:**

```sql
ALTER TABLE auth.users ADD COLUMN stripe_customer_id text;

CREATE TABLE subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  plan                text NOT NULL CHECK (plan IN ('free', 'lover', 'pro')),
  status              text NOT NULL, -- active, past_due, canceled, trialing
  current_period_end  timestamptz NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);
```

**Enforcement:**

Add a `check_plan_limit()` function called from server actions before creating a flow or card. Return an `AppError('PLAN_LIMIT_REACHED', 402)` if over limit. The client shows an upgrade prompt.

**Webhook handler** (`api/stripe/webhook/route.ts`):
- `customer.subscription.created` → insert into `subscriptions`, update `plan`
- `invoice.payment_succeeded` → extend `current_period_end`
- `customer.subscription.deleted` → downgrade to `free`

Always verify the Stripe webhook signature before processing.

---

## Infrastructure upgrades for scale

### Redis (rate limiting + caching)
- Rate limit uploads and submissions per user (not just per IP)
- Cache flow data for the selector experience (reduces DB reads on popular flows)

```bash
# Upstash Redis — serverless, works with Vercel
pnpm add @upstash/redis @upstash/ratelimit
```

### Sentry (error tracking)
Essential before acquiring paying customers. A broken flow that a paying user hits and you don't know about is a churn risk.

```bash
pnpm add @sentry/nextjs
# npx @sentry/wizard -i nextjs
```

Wire into `withErrorHandler` in `lib/errors.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(err)
```

### Custom domain + email
- Point a custom domain at Vercel (e.g. `datepicker.app`)
- Verify that domain in Resend so emails come from `hello@datepicker.app`
- Update `APP_URL` and all OAuth redirect URLs

### Backups
Supabase Pro includes daily backups. For additional protection:
- Enable Point-in-Time Recovery (PITR) on Supabase Pro
- Or schedule a `pg_dump` via a cron job to a separate S3 bucket

---

## Cost Model

All prices in USD/month unless noted. Based on current (2026) public pricing.

The cost model is split into **phases** because the architecture has to change at certain scales — you cannot simply pay more and stay on the same stack. Each phase has a different infrastructure footprint.

---

### Per-user assumptions (monthly, active user)

| Metric | Estimate | Basis |
|---|---|---|
| Storage added | ~7 MB | 2–3 flows/year × 5 cards × 2 photos at ~2 MB each |
| Emails sent | ~3 | ~1 selection notification per published flow |
| DB connections (peak) | 1–2 concurrent | Serverless function per request |
| Outbound bandwidth | ~20 MB | Selector page loads with photos/video thumbnails |

---

### Phase 1 — Launch (0–1,000 users)
**Current architecture. No changes needed.**

| Service | Cost |
|---|---|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Resend (≤50k emails) | $20 |
| Upstash Redis (rate limiting) | $10 |
| Sentry Team | $26 |
| Domain | $1 |
| **Total** | **~$102/mo** |

**What to do now:**
- Upgrade Supabase to Pro immediately (free tier pauses after 7 days inactivity — fatal for paying customers)
- Enable Supabase's built-in **connection pooler (Supavisor)** in transaction mode from day one — Vercel serverless functions each open a new DB connection on every invocation; the default 60-connection limit on Pro will blow up under modest traffic without pooling

---

### Phase 2 — Early growth (1,000–10,000 users)
**Current architecture still holds. Add caching and async email.**

New problems that emerge:
- **DB connection churn**: With hundreds of concurrent Vercel function invocations, each opening a connection, Supavisor in transaction mode is now mandatory (not optional). It multiplexes thousands of app connections into a small pool of real DB connections.
- **Email latency**: Sending email synchronously inside `submitSelection` adds 200–500ms to the selector's submission response. A failed Resend API call silently loses the notification.
- **No caching**: Every selector page load hits Supabase for the flow data. A popular flow (e.g. someone shares it to a group) causes a read spike.

**What to add:**

| Addition | Why | Cost |
|---|---|---|
| Supavisor connection pooler | Prevents connection exhaustion | Included in Supabase Pro |
| Inngest or Trigger.dev | Move email sending to background job queue; retries on failure | $0–25 |
| Upstash Redis (flow cache) | Cache published flow data with 60s TTL; reduces DB reads ~80% | Already paying |

| Service | Cost |
|---|---|
| Phase 1 baseline | $102 |
| Inngest (background jobs) | $25 |
| Resend (10k–50k emails) | $20–50 |
| **Total** | **~$127–177/mo** |

---

### Phase 3 — Scale (10,000–50,000 users)
**Architecture changes required. Current Supabase Pro instance hits limits.**

New problems:
- **Supabase shared compute**: On Pro, your database runs on a shared server alongside other customers' projects. At 10k+ active users generating concurrent queries, you'll see query latency spikes and may hit rate limits from Supabase's shared infrastructure.
- **Media delivery**: Supabase Storage CDN works, but at 50k users streaming video and loading photos, egress costs accumulate and latency to certain regions degrades. Supabase Storage charges $0.09/GB egress above the included allowance.
- **Vercel function cold starts**: High-traffic pages (popular flow tokens) hit cold-start latency. Consider Next.js `export const runtime = 'edge'` for the selector page route, which eliminates cold starts at the cost of losing Node.js APIs.

**What to change:**

| Change | Why | Cost delta |
|---|---|---|
| Supabase Pro → **Dedicated instance** ($200–400/mo) | Dedicated compute, configurable connection limits, read replicas available | +$175–375 |
| Supabase Storage → **Cloudflare R2 + CDN** | Zero egress fees, global edge, cheaper at scale. Only `app/api/upload/route.ts` changes. | ~$20–50 (storage only; egress free) |
| Add **Cloudflare** in front of Vercel | Edge caching for static assets, DDoS protection, hides Vercel cold starts for cached pages | $20 (Pro plan) |
| Resend volume tier | 150k emails/mo | $150 |

| Service | Cost |
|---|---|
| Vercel Pro | $20 |
| Supabase Dedicated | $300 |
| Cloudflare Pro + R2 | $40 |
| Resend 150k | $150 |
| Upstash Redis | $50 |
| Inngest | $50 |
| Sentry Business | $80 |
| Domain | $1 |
| **Total** | **~$691/mo** |

This is a real jump from Phase 2. The Supabase Dedicated instance is the main driver.

---

### Phase 4 — High scale (50,000–200,000 users)
**Possible re-platform. Cost efficiency requires owning more of the stack.**

At this point Vercel's per-function pricing and Supabase's managed overhead start to look expensive relative to what you're paying. Options:

**Option A — Stay managed, scale up**
- Supabase Dedicated with read replica (+$100–200/mo)
- Vercel Team or Enterprise for higher limits
- Total: ~$900–1,200/mo
- Pros: no ops burden
- Cons: less control, higher cost per unit

**Option B — Partially self-host**
- Move to **Neon** (serverless Postgres) or **self-managed Postgres on Hetzner** (~$50–100/mo for dedicated hardware)
- Keep Vercel for the Next.js app (edge network is hard to replicate)
- Keep Cloudflare R2 for storage
- Replace Supabase Auth with **Clerk** or self-hosted **GoTrue** (Supabase's auth engine)
- Total: ~$400–600/mo
- Pros: ~50% cost reduction
- Cons: significant migration effort, you own DB ops

**Option C — Full containerisation**
- Move Next.js app to **Fly.io** or **Railway** (persistent containers, no cold starts, cheaper at volume)
- Self-managed Postgres cluster with streaming replication
- Total: ~$300–500/mo
- Pros: lowest cost, full control
- Cons: substantial ops burden — backup strategy, failover, patching all become your problem

---

### Revenue vs cost by phase

Assumed conversion: 40% free signups, of paying users: 70% Lover (€5/mo) / 30% Pro (€15/mo).
Stripe EU fees: 1.5% + €0.25/transaction.

| Total users | Paying | Revenue | Infra (phase) | Gross margin |
|---|---|---|---|---|
| 100 | 60 | €450 | $102 (P1) | ~78% |
| 500 | 300 | €2,250 | $102 (P1) | ~95% |
| 1,000 | 600 | €4,500 | $177 (P2) | ~96% |
| 5,000 | 3,000 | €22,500 | $177 (P2) | ~99% |
| 10,000 | 6,000 | €45,000 | $691 (P3) | ~98.5% |
| 50,000 | 30,000 | €225,000 | $691 (P3) | ~99.7% |
| 100,000 | 60,000 | €450,000 | $1,100 (P4-A) | ~99.8% |

Stripe fees reduce revenue by ~1.7% (included in margin estimates above).

**The gross margin stays high across all phases because infrastructure costs grow much slower than revenue. The real cost of scale is engineering time, not servers — each phase transition requires 1–2 weeks of migration work.**

---

### What actually breaks and when

| Scale | What breaks | Fix |
|---|---|---|
| First paying customer | Supabase free tier pauses the DB | Upgrade to Pro immediately |
| ~500 concurrent users | DB connection limit (60 direct) | Enable Supavisor pooler (transaction mode) |
| ~1,000 users | Email sending fails silently under load | Move to background job queue |
| ~5,000 users | Selector page DB reads spike on popular flows | Redis cache for published flow data |
| ~15,000 users | Supabase Storage egress costs accumulate | Migrate media to Cloudflare R2 |
| ~20,000 users | Shared Supabase compute causes query latency | Upgrade to Dedicated instance |
| ~50,000 users | Vercel cost/function pricing adds up | Evaluate partial self-hosting |
| ~100,000 users | Managed stack overhead exceeds self-hosting cost | Re-platform decision point |

---

## Legal and compliance

Required before taking payments:

| Document | What it covers |
|---|---|
| Terms of Service | Acceptable use, payment terms, refund policy, account termination |
| Privacy Policy | What data you collect, how it's stored, GDPR rights (right to deletion, data export) |
| Cookie notice | If you add analytics cookies (Vercel Analytics uses no cookies by default) |
| GDPR / data deletion | Add a "Delete my account" flow that deletes the user from `auth.users` (cascade deletes flows, selections via FK) |

**GDPR data deletion** is mostly already handled by the `ON DELETE CASCADE` FK chain:

```
auth.users → flows → decision_modules → cards
                   → quiz_modules → quiz_questions
                   → selections → selection_answers
```

Deleting a user from `auth.users` cascades to all their data. The only gap: Supabase Storage objects (photos) need a separate cleanup job.

---

## Go-to-market sketch

This is a narrow niche — romantic date planning — which is actually a strength for marketing:

1. **Product Hunt launch** — "Plan the perfect date, let her choose" as the tagline
2. **Reddit** — r/datenight, r/relationship_advice, r/malelifestyle — genuine use cases, not spam
3. **Gift angle** — Valentine's Day, anniversaries, birthdays are natural hooks for paid promotion
4. **Creator angle** — Instagram/TikTok creators in the "date ideas" niche could embed or promote it
5. **Referral** — the share URL the selector receives is inherently viral; add "Made with [app name]" branding (removable on Pro) as a free distribution channel

---

## Phased plan

**Phase 1 — Open sign-up** (1 week)
- Add `/signup` page
- Remove hardcoded creator assumptions
- Add basic plan enforcement (free tier: 1 flow)

**Phase 2 — Stripe billing** (1–2 weeks)
- Stripe Checkout + webhook handler
- `subscriptions` table
- Billing page with Stripe Customer Portal link

**Phase 3 — Production hardening** (1 week)
- Sentry
- Rate limiting (Upstash)
- Custom domain + verified email domain
- GDPR deletion flow

**Phase 4 — Growth** (ongoing)
- Referral / "Made with" branding on free tier
- Analytics dashboard
- Yearly Wrapped feature (now a retention mechanism, not just a fun extra)
