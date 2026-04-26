# ADR-002: Programming Language

**Status:** Accepted  
**Date:** 2026-04-26  
**Deciders:** Cyrill Knecht

---

## Context

The project spans frontend UI, API routes, database schema types, and infrastructure configuration. A consistent language across the full stack reduces context switching and enables shared type definitions (e.g., a `DateCard` type used in the database layer, API response, and UI component).

### Options Considered

| Option | Notes |
|---|---|
| **TypeScript** | Superset of JavaScript, static typing, excellent tooling, industry standard for Next.js projects |
| JavaScript (plain) | No compilation step, but no type safety; errors surface at runtime |

---

## Decision

**Use TypeScript throughout — frontend, API routes, and shared types.**

Given the modular data model (Flows, DecisionModules, Cards, QuizModules), strong typing is essential. Supabase generates TypeScript types from the database schema automatically, which means the database schema and the application types stay in sync with zero manual work.

---

## Consequences

**Positive:**
- Compile-time errors catch data model mismatches early
- Supabase CLI generates types from the DB schema; no manual type maintenance
- Shared `types/` directory can be imported by both UI components and API routes
- IDE autocomplete significantly speeds up development

**Negative:**
- Requires a compilation step (handled transparently by Next.js)
- Slightly more verbose than plain JavaScript for simple scripts
