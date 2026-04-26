# Date Night Selector

A private, animated web app for curating romantic date options. The creator builds a flow of decision steps (card picks) and quiz questions; the selector (the girlfriend) opens a token-gated link, makes her choices, and submits — the creator gets an email with everything she picked.

**Production:** https://date-selector-selector.vercel.app

---

## Local Development

Requires Node 20+.

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build
pnpm lint
pnpm typecheck
pnpm test         # Vitest (unit + component)
```

### Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |
| `RESEND_API_KEY` | Resend email API key |
| `APP_URL` | Base URL for share link generation |
| `CREATOR_EMAIL` | Where selection notification emails are sent |

### Supabase local stack

```bash
supabase start
supabase db push --password <pw> --yes
supabase gen types typescript --local > types/database.ts
```

---

## Architecture

Two surfaces in one Next.js 16 App Router codebase:

- **Creator** (`/creator/*`) — authenticated via Supabase Auth. Builds flows, views selections, confirms the date.
- **Selector** (`/[token]`) — no login. Access gated by a UUID token in the URL.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for full details.

---

## Deployment

Merging to `main` triggers the GitHub Actions deploy pipeline:
1. Lint + typecheck + tests
2. `supabase db push` (applies pending migrations)
3. `vercel deploy --prod`

### Manual steps after first deploy

- Enable Google OAuth in the Supabase dashboard: **Authentication → Providers → Google**
  - Set redirect URL to `https://date-selector-selector.vercel.app/auth/callback`
- Set `CREATOR_EMAIL` in Vercel environment variables (defaults to `cykn128@gmail.com` if unset)
