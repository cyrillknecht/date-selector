# Product Requirements Document: Date Night Selector

## Overview

A private, beautifully animated web app that lets you curate romantic date options and present them to your girlfriend in a delightful, interactive way. She selects her preference, and you get notified.

---

## Problem Statement

Planning dates is hard when you want to surprise someone but still respect their preferences. This app bridges the gap: you do the work of finding options, she gets the joy of choosing without knowing the full picture.

---

## Target Users

- **You (Creator):** Enters and manages date options, receives selections.
- **Her (Selector):** Views and selects from curated options, optionally answers preference questions.

---

## Core Modes

### Mode 1 — Curated Date Picker
You create specific date proposals (e.g., "Dinner at Restaurant X + Walk along the river"). She browses them as cards with photos, descriptions, and mood tags, then selects her favorite. You get notified of her choice.

### Mode 2 — Hidden Preference Selector
She answers a series of aesthetic, binary-style questions ("Cozy or Adventurous?", "City or Nature?", "Fancy or Casual?") without knowing the specific dates. Her answers are sent to you so you can pick accordingly. The fun is that she doesn't see the actual options — just the vibe.

Both modes can run independently or together.

---

## Feature Requirements

### Creator Side (You)

| Feature | Description |
|---|---|
| Date card creation | Title, description, location, time estimate, price range, photos (multiple), mood tags |
| Sub-decision support | Each date card can have nested decisions (e.g., "Where to eat?" with 2–3 restaurant options, each with photo + description) |
| Preference question builder | Create custom binary or multi-choice questions for Mode 2 |
| Shareable link | Generate a unique URL to send to her — no login required on her side |
| Notification | Receive her selection via email or a simple dashboard |
| Draft / publish | Cards can be saved as drafts before sharing |

### Selector Side (Her)

| Feature | Description |
|---|---|
| Curated date browsing | Full-screen card view with photos, description, mood tags — swipe or click to navigate |
| Date selection | Pick a favorite; optionally rank or heart multiple options |
| Sub-decision flow | After picking a date, walk through nested decisions (e.g., restaurant choice) |
| Preference quiz | Answer aesthetic questions in a visually engaging quiz format |
| Confirmation screen | A warm "Your choice has been sent!" moment with a personal message from you |
| No account required | Access via link only |

---

## Modularity Requirements

The system must be architected around reusable decision modules so any selection flow can be assembled from composable pieces:

- **Card Module** — any item with photo, title, description, tags
- **Decision Module** — a prompt with N card options; supports single or multi-select
- **Quiz Module** — a sequence of binary/multi-choice preference questions
- **Flow** — an ordered chain of Decision or Quiz modules

This means a "date night" is just a flow: [Pick date] → [Pick restaurant] → [Pick activity level]. Flows can be as short or deep as needed.

---

## UX & Design Principles

- **Mobile-first** — she's likely opening this on her phone
- **Cinematic feel** — full-bleed photos, soft transitions, gentle parallax
- **Romantic but not cliché** — tasteful typography, warm color palette, no cheesy stock hearts
- **Delightful micro-interactions** — card flips, fade-ins, confetti on selection
- **Personal touch** — you can add a custom intro message and sign-off displayed to her before she starts

---

## Notifications

- Email to you when she submits a selection (summary of all choices made)
- Optional: a custom message field she can leave for you alongside her selection

---

## Out of Scope (v1)

- Real-time chat or back-and-forth
- Calendar integration or booking
- Public sharing or social features
- Multiple users / accounts
- Payment or reservation handling

---

## Success Criteria

- She can open the link and complete a selection in under 3 minutes
- You receive her selection with full context (which date, which sub-options, any message)
- The experience feels like a gift, not a form
