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

---

### Assumptions per active user/month
| Metric | Estimate | Basis |
|---|---|---|
| Storage added | ~7 MB | 2–3 flows/year × 5 cards × 2 photos avg at 2 MB each |
| Emails sent | ~3 | ~1 selection per published flow |
| DB compute | negligible | Serverless; covered by Supabase plan |
| Bandwidth | ~20 MB | Selector page loads (photos served from Storage CDN) |

---

### Fixed infrastructure baseline

These costs are constant regardless of user count once you move off free tiers:

| Service | Free tier | Paid tier | Trigger to upgrade |
|---|---|---|---|
| Vercel | 100 GB bandwidth | Pro $20/mo (1 TB, no function limits) | Custom domain, >100 GB/mo bandwidth, or SLA needed |
| Supabase | 500 MB DB, 1 GB storage, pauses after 1 week inactivity | Pro $25/mo (8 GB DB, 100 GB storage, no pause, daily backups) | Any paying customer (free tier pausing will cause outages) |
| Resend | 3,000 emails/mo | Scale $20/mo (50k emails) | ~1,000 active users/mo |
| Upstash Redis | 10k commands/day | Pay-as-you-go ~$10/mo | When rate limiting is added |
| Sentry | 5k errors/mo | Team $26/mo | First paying customer |
| Domain | — | ~$1.25/mo ($15/yr) | Always |
| Terraform Cloud | Free ≤500 resources | — | Never at this scale |
| GitHub Actions | 2,000 min/mo (private) | — | Never at this scale |

**Minimum viable paid infrastructure: ~$82/month**
(Vercel Pro + Supabase Pro + Resend Scale + Upstash + Sentry + domain)

---

### Cost at scale

| Users | Storage total | Emails/mo | Infra cost | Cost per user |
|---|---|---|---|---|
| 10 | 70 MB | 30 | $82 (fixed baseline) | $8.20 |
| 100 | 700 MB | 300 | $82 | $0.82 |
| 500 | 3.5 GB | 1,500 | $82 | $0.16 |
| 1,000 | 7 GB | 3,000 | $102 (+Resend Scale) | $0.10 |
| 5,000 | 35 GB | 15,000 | $112 | $0.022 |
| 10,000 | 70 GB | 30,000 | $127 (+Resend 30k tier $35) | $0.013 |
| 50,000 | 350 GB | 150,000 | $368 (+storage overage $53, +Resend 200k $150, +Upstash $50) | $0.007 |
| 100,000 | 700 GB | 300,000 | ~$640 | $0.006 |

Storage overage on Supabase Pro: $0.021/GB above 100 GB. Kicks in around 15,000 users.

**The main cost cliff is the fixed baseline (~$82/mo), not per-user marginal cost. At 100+ users the business easily covers infrastructure.**

---

### Revenue vs cost

Assumed conversion: 20% free / 70% Lover (€5/mo) / 10% Pro (€15/mo) of paying users. Free users are ~40% of total signups.

Stripe fees (EU): 1.5% + €0.25 per transaction.

| Total users | Paying users | Monthly revenue | Infra cost | Gross margin |
|---|---|---|---|---|
| 50 | 30 | €210 | $82 | ~61% |
| 250 | 150 | €1,050 | $82 | ~92% |
| 1,000 | 600 | €4,200 | $102 | ~97.6% |
| 5,000 | 3,000 | €21,000 | $112 | ~99.5% |
| 10,000 | 6,000 | €42,000 | $127 | ~99.7% |
| 50,000 | 30,000 | €210,000 | $368 | ~99.8% |

Stripe takes an additional ~1.7% off revenue (factored into the margin above as a rough estimate).

**This is a ~99% gross margin SaaS at meaningful scale. The constraint is customer acquisition cost, not infrastructure.**

---

### Cost cliff points to watch

1. **Supabase free → Pro ($25/mo):** Do this on day one of any paying customer. Free tier pauses cause outages.
2. **Resend free → Scale ($20/mo):** Hits around 1,000 active users/mo (3k emails/mo limit).
3. **Supabase 100 GB storage → overage ($0.021/GB):** Around 15,000 users. Still cheap.
4. **Supabase Pro connection limit (60 direct connections):** Enable Supabase's built-in connection pooler (PgBouncer) before you hit this. Relevant around 5,000+ concurrent users.
5. **Supabase Team ($599/mo):** Only needed for SSO, priority support, and 99.9% SLA. Not a cost concern until enterprise sales.

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
