# ADR-007: Hosting and Deployment

**Status:** Accepted  
**Date:** 2026-04-26  
**Deciders:** Cyrill Knecht

---

## Context

The application is a Next.js 15 project with API routes, server components, and image optimization. Hosting must support:

- Next.js server-side rendering and API routes (not just static file hosting)
- Automatic preview deployments per branch/PR
- Environment variable management (Supabase keys, Resend API key)
- Custom domain support
- Zero operational overhead (no managing servers or containers)
- Free at this project's scale

### Options Considered

| Option | Notes |
|---|---|
| **Vercel** | Built by the Next.js team, zero-config, automatic previews, edge network, generous free tier |
| Netlify | Supports Next.js via adapter, good DX, but not first-party Next.js support |
| Cloudflare Pages | Excellent edge performance, Next.js support via adapter is incomplete for some App Router features |
| Railway | Good for full-stack apps, more control but more setup; no automatic preview URLs |
| Fly.io | Container-based, excellent for stateful apps, overkill for a Next.js app; steeper learning curve |
| AWS Amplify | Next.js support, but heavy AWS ecosystem overhead for a project of this size |

---

## Decision

**Use Vercel as the hosting platform.**

Vercel is the canonical hosting target for Next.js. All App Router features (Server Components, Server Actions, streaming, image optimization) work without any adapter or configuration. Every push to a branch gets an automatic preview URL — useful for checking animations on a real mobile device before merging. Environment variables are managed per environment (development, preview, production) via the Vercel dashboard and are injected at build time and runtime.

### Environment Strategy

| Environment | Branch | Purpose |
|---|---|---|
| Production | `main` | Live app — the URL sent to the girlfriend |
| Preview | any PR branch | Testing before merge; not shared externally |
| Development | local | Local dev with `.env.local` |

---

## Consequences

**Positive:**
- Zero-config deployment for Next.js — push to `main`, it's live
- Automatic preview URLs per PR for visual QA on real devices
- Edge network for fast global delivery (relevant for mobile load times)
- Free tier: 100GB bandwidth, unlimited deployments — sufficient indefinitely
- Vercel Terraform provider allows full IaC management of projects, domains, and env vars

**Negative:**
- Free tier limits serverless function duration to 10 seconds — sufficient for this app, but worth noting
- Vendor coupling to Vercel's platform; switching would require adapting to another Next.js hosting setup
- Environment variables containing secrets must be added manually via the Vercel dashboard or Terraform (not committed to the repo)

**Neutral:**
- The Vercel Terraform provider (`vercel/vercel`) is used to provision the project and manage env var references; actual secret values are stored in Vercel's encrypted env var store, not in Terraform state
