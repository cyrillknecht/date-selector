# ADR-003: Styling System

**Status:** Accepted  
**Date:** 2026-04-26  
**Deciders:** Cyrill Knecht

---

## Context

The application demands a high-quality, custom visual design: full-bleed photos, warm typography, cinematic card layouts, and a romantic aesthetic. At the same time, we need utility components (modals, dropdowns, form inputs) on the creator dashboard that should not be built from scratch.

The styling solution must:
- Support a fully custom design language without fighting the framework defaults
- Work well alongside Framer Motion animations
- Be mobile-first by default
- Not ship unused CSS to the client

### Options Considered

| Option | Notes |
|---|---|
| **Tailwind CSS v4 + shadcn/ui** | Utility-first, zero runtime, fully customizable, shadcn gives accessible base components as copy-paste code |
| Tailwind CSS alone | Great utility layer, but building accessible form inputs, dialogs, etc. from scratch adds time |
| styled-components / Emotion | Runtime CSS-in-JS; adds bundle weight and complicates SSR |
| CSS Modules | Good isolation but verbose; no utility layer for rapid iteration |
| MUI / Chakra UI | Opinionated design system; hard to achieve a fully custom romantic aesthetic without overriding everything |

---

## Decision

**Use Tailwind CSS v4 for all styling, with shadcn/ui for interactive UI primitives on the creator dashboard.**

shadcn/ui is not a traditional component library — it copies component source code directly into the project. This means full ownership of the markup and styles, no version lock-in, and complete flexibility to adapt components to the project's design language. Tailwind v4's new CSS-first configuration (no `tailwind.config.js` required) simplifies the setup.

---

## Consequences

**Positive:**
- Zero runtime overhead — all CSS is generated at build time
- shadcn/ui components are owned by the project; no fighting a design system
- Tailwind's utility classes compose naturally with Framer Motion's inline style animations
- Mobile-first breakpoints are built into Tailwind's default scale
- Large community; excellent documentation for both tools

**Negative:**
- Tailwind v4 is relatively new; some third-party integrations may still target v3
- shadcn/ui components require manual updates (no `npm update` path)
- Utility class markup can become verbose for complex layouts; discipline required to extract reusable components

**Neutral:**
- Design tokens (colors, typography, spacing) are defined in CSS variables in `globals.css`, not in a config file — this is a Tailwind v4 pattern
