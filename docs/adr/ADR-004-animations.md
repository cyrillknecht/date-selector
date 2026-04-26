# ADR-004: Animation Library

**Status:** Accepted  
**Date:** 2026-04-26  
**Deciders:** Cyrill Knecht

---

## Context

Animation is a first-class requirement of this project. The selector experience must feel cinematic and tactile — not a standard web form. Key animation needs include:

- Full-page transitions between flow steps
- Card enter/exit animations (swipe, fade, scale)
- Card flip revealing selection confirmation
- Swipe gesture support on mobile
- Confetti or particle effect on final submission
- Micro-interactions on buttons, hearts, selection highlights
- Staggered list animations for the quiz mode

The animation library must integrate cleanly with React and Next.js's App Router (client components), support gesture recognition natively, and be performant on mid-range mobile hardware.

### Options Considered

| Option | Notes |
|---|---|
| **Framer Motion** | Declarative, React-native, gesture support built-in, layout animations, exit animations via `AnimatePresence`, active maintenance |
| React Spring | Physics-based, excellent for natural motion, but gesture support is weaker and API is more complex |
| GSAP | Extremely powerful, imperative API, better for complex timelines; free tier has license restrictions for SaaS but fine for personal use |
| CSS transitions only | Sufficient for simple hover states, not adequate for gesture-driven card flows or exit animations |
| Auto-animate | Zero-config layout animations only; too limited for the full scope of this project |

---

## Decision

**Use Framer Motion as the sole animation library.**

Framer Motion's `motion` components, `AnimatePresence`, `useMotionValue`, and `useDragControls` cover every animation requirement in this project without reaching for a second library. Its declarative API keeps animation logic colocated with component markup, which is easier to maintain. The `layoutId` prop enables seamless shared-element transitions between the card list and the detail view — a key UX moment in the selector experience.

---

## Consequences

**Positive:**
- Single library covers transitions, gestures, layout animations, and exit animations
- `AnimatePresence` handles the unmount animation problem that CSS transitions cannot
- `layoutId` enables shared-element card expansion with minimal code
- Framer Motion is optimized to run animations on the compositor thread, minimizing jank on mobile
- Large community; well-documented patterns for card stacks, swipe-to-select, and page transitions

**Negative:**
- Adds ~40KB gzipped to the client bundle; must be used only in `"use client"` components
- For extremely complex timeline-based animations, GSAP would be more expressive — but no such animations are required here

**Neutral:**
- Confetti effect will use a lightweight standalone library (`canvas-confetti`) rather than Framer Motion, which is not designed for particle systems
