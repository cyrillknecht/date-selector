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
