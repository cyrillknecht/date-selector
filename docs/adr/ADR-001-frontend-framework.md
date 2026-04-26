# ADR-001: Frontend Framework

**Status:** Accepted  
**Date:** 2026-04-26  
**Deciders:** Cyrill Knecht

---

## Context

The application has two distinct surfaces:

1. A **creator dashboard** (authenticated, used by one person) for building date flows, uploading photos, and viewing selections.
2. A **selector experience** (public, link-gated) for the girlfriend to browse options and submit her choice.

Both surfaces are highly visual and animation-heavy. The selector surface must load fast on mobile without requiring a login. Server-side rendering (SSR) and static generation (SSG) are desirable for the public-facing pages to ensure fast initial load and good performance on low-end mobile devices.

We need a framework that handles routing, API endpoints, server and client rendering, image optimization, and TypeScript natively — ideally without stitching together multiple tools.

### Options Considered

| Option | Notes |
|---|---|
| **Next.js 15 (App Router)** | Full-stack React, SSR/SSG/ISR, API routes, image optimization, file-based routing, active ecosystem |
| Remix | Strong data loading model, good DX, smaller ecosystem, less native image optimization |
| Vite + React SPA | Excellent DX, but no SSR without additional setup; API layer would need a separate service |
| Nuxt (Vue) | Strong framework, but Vue ecosystem is smaller for animation/UI libraries relevant to this project |

---

## Decision

**Use Next.js 15 with the App Router and TypeScript.**

The App Router's server/client component model maps cleanly to the two surfaces: server components for fast initial loads on the public selector page, client components for interactive animation-heavy cards. API routes eliminate the need for a separate backend service. Built-in `next/image` handles photo optimization automatically.

---

## Consequences

**Positive:**
- Single codebase for frontend and API layer
- SSR on the public selector URL means fast first paint on mobile
- File-based routing makes the modular flow structure (flows, steps, results) natural to organize
- Large ecosystem; Framer Motion, shadcn/ui, and Supabase all have first-class Next.js support
- Vercel (our hosting choice) is built by the same team — zero-config deployment

**Negative:**
- App Router has a steeper learning curve than Pages Router for developers new to React Server Components
- Bundle size requires care when mixing heavy animation libraries with server components

**Neutral:**
- Locks us into React; switching frameworks later would require a rewrite
