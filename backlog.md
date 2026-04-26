# Backlog

Items are grouped by theme. Effort is rough: **S** = hours, **M** = 1–2 days, **L** = several days, **XL** = week+.

---

## Creator Experience

### Flow Templates *(M)*
Pre-made flow templates the creator can start from instead of building from scratch. Examples: "Romantic Dinner", "Outdoor Adventure", "Cozy Night In". Templates would ship with placeholder cards, a prompt, and sensible defaults. Stored as seed data or a `templates` table. Creator picks one, it clones into a real draft flow they can edit.

### Flow Duplication *(S)*
"Duplicate flow" button in the dashboard. Clones a flow (all modules, cards, questions) into a new draft. Useful for seasonal variants or sending to multiple people.

### Module Reordering *(M)*
Drag-and-drop reordering of modules within a flow. Currently modules are only ordered by their `position` integer; the UI has no drag support. Use `@dnd-kit/core` (already a common Tailwind/shadcn stack choice).

### Multi-Step Date Cards *(L)*
A single "date" card that unfolds into its own sub-flow of decisions (e.g. "Fancy evening" → [pick restaurant] → [pick activity]). This maps to the PRD's "sub-decision support" requirement. Implementation: a card can optionally have `child_flow_id` pointing to a nested flow; after the selector picks that card, the child flow plays out before continuing the parent.

### Flow Expiry *(S)*
Auto-unpublish a flow after a configurable date. Add `expires_at timestamptz` to `flows`; a cron job or Supabase pg_cron check unpublishes expired flows. Prevents stale links from staying active indefinitely.

### Rich Intro/Outro *(S)*
The intro and outro messages are currently plain text. Allow simple markdown (bold, line breaks, emoji). Render with a lightweight markdown parser on the selector side.

---

## Selector Experience

### Link Open Tracking *(S)*
Record when the selector first opens the link (`first_opened_at timestamptz` on `flows`). Show in the creator dashboard so they know if she's seen it yet.

### Selector Reaction to Confirmed Date *(S)*
After seeing the confirmed date page, the selector can tap one of a few emoji reactions (e.g. 😍 🥰 😂). Stored as `confirmed_reaction text` on `flows`; creator sees it in the dashboard. Small but delightful.

### Date Journal / Memory *(XL)*
Post-date: creator and selector can add a short note and photos from the actual date. Stored as a separate `date_memories` table linked to the flow. Turns the app from a planning tool into a keepsake.

### PWA / Add to Home Screen *(M)*
Add a `manifest.json` and service worker so the selector can install the app to her home screen. Especially useful on iOS where the URL bar takes up space. Next.js has first-class support via `next-pwa` or manual `app/manifest.ts`.

---

## Notifications & Sharing

### Real-Time Notification on Submission *(M)*
Currently the creator gets an email. Add a Supabase Realtime subscription on the creator dashboard so the UI updates live when a selection comes in — no page refresh needed. Also consider a browser push notification (Web Push API) as a backup channel.

### WhatsApp / Native Share *(S)*
Replace the copy-link button in the share modal with the Web Share API (`navigator.share()`). Falls back to copy on desktop. Lets the creator share directly to WhatsApp, iMessage, etc. in one tap on mobile.

### Resend / Reminder *(S)*
Button in the creator dashboard to resend the share link email to the selector. Useful if she lost the original message.

---

## Infrastructure & DevOps

### Implement IaC (Terraform) *(L)*
The `infra/` directory has Terraform files for Vercel and Supabase provisioning, but they may not be actively applied in CI. Wire up `infra-plan.yml` and `infra-apply.yml` GitHub Actions workflows so infrastructure changes go through Terraform Cloud. Add a PR check that runs `terraform plan` and posts the diff as a comment.

### Preview Environments with Supabase Branching *(L)*
Use Supabase branching (beta) to spin up an isolated database for each PR. Each preview Vercel deployment would point at its own Supabase branch, enabling true isolation without touching the production database.

### Error Tracking (Sentry) *(M)*
Add `@sentry/nextjs`. Captures unhandled errors and slow requests. The existing `withErrorHandler` in `lib/errors.ts` can forward `AppError`s to Sentry with context. Essential before any scaling.

### Rate Limiting on Upload and Submission *(M)*
The `/api/upload` and `submitSelection` server action have no rate limiting. Add Upstash Redis + `@upstash/ratelimit` (or Vercel's built-in rate limiting) to cap uploads and submissions per IP per hour.

### Client-Side Image/Video Compression *(M)*
Before uploading to `/api/upload`, compress images with `browser-image-compression` and optionally transcode short videos. Reduces storage cost and speeds up page loads on the selector side.

---

## Auth & Multi-Tenancy

### Additional OAuth Providers *(S)*
Supabase Auth supports Apple, GitHub, Twitter, and others with minimal config. Apple Sign In is particularly important for iOS users. Each provider just needs enabling in the Supabase dashboard and a button in `LoginForm.tsx`.

### Selector Account (Token → Auth) *(XL)*
Currently the selector accesses via a token URL with no account. For scaling to multiple users: replace the token with optional Supabase Auth for the selector. She creates an account (email or OAuth), the flow is shared by associating the flow token with her user ID. Enables:
- Her to see her past selections
- Creator to share multiple flows to the same person
- Selection history and comparison

Requires schema changes (`selections.selector_user_id`), a selector login/signup flow, and RLS updates.

### Multi-Creator / Open Platform *(XL)*
Allow anyone to sign up as a creator. The `user_id` column on `flows` and the `creator_own_flows` RLS policy are already the right foundation — multi-tenancy is architecturally ready. What's missing:
- A sign-up page (currently the creator account is created once manually)
- Creator profile / settings page
- Billing if usage is metered (Stripe integration)
- Terms of service and privacy policy

---

## Polish & UX Debt

### Next.js `<Image>` for Card Photos *(M)*
Cards currently use `<img>` (with `eslint-disable` comments) to avoid Next.js Image restrictions on external domains. Configure `remotePatterns` in `next.config.ts` for the Supabase Storage CDN domain and switch to `<Image>` for automatic format conversion (WebP/AVIF) and lazy loading.

### Swipe Gesture on Card Carousel *(M)*
The `MediaCarousel` in `DecisionStep` shows prev/next arrow buttons. On mobile, add swipe-left/swipe-right gesture support via `@use-gesture/react` or a `touchstart`/`touchend` handler. More natural than tapping arrows on a phone.

### Dark Mode *(M)*
The app is light-only. Add a dark mode variant using Tailwind's `dark:` classes. The warm stone palette needs a matching dark counterpart. Respect `prefers-color-scheme` by default with an optional manual toggle stored in `localStorage`.

### Accessibility Audit *(M)*
Run `axe-core` against the selector flow and creator dashboard. Known gaps: the card expand panel has no `aria-expanded` on the chevron button; the quiz step radio buttons may lack proper labeling; focus management when a modal opens.

### E2E Tests (Playwright) *(L)*
Add Playwright tests for the two critical happy paths:
1. Creator creates a flow, publishes it, copies the link
2. Selector opens the link, completes all steps, submits

These are the paths that, if broken, immediately break the product. Currently only Vitest unit/component tests exist.
