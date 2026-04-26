# Domain Glossary — Ubiquitous Language

Shared vocabulary used consistently across code, documentation, and conversation.
When in doubt, use these terms exactly — not synonyms.

---

## Core Entities

### Flow
The top-level entity. A complete date selection experience that the creator builds and shares with the selector. A flow contains an ordered list of modules and has a lifecycle (draft → published → archived). In the UI, a flow is what the selector experiences from landing page to confirmation.

**Not called:** "date", "session", "questionnaire", "form"

---

### Module
A single step within a flow. Modules are ordered by `position`. There are two types: Decision Module and Quiz Module. The selector progresses through modules one at a time.

**Not called:** "step", "section", "page", "question"

---

### Decision Module
A module that presents the selector with a set of Cards to choose from. Has a prompt text (e.g., "Where would you like to eat?") and a setting for single vs. multi-select.

**Not called:** "choice step", "card section", "date picker"

---

### Quiz Module
A module that presents the selector with a sequence of Questions. Used for the "hidden preference" mode where the selector expresses vibes rather than choosing specific options.

**Not called:** "preference section", "vibe check", "survey"

---

### Card
An individual option within a Decision Module. Represents one specific date idea or sub-option (e.g., a specific restaurant, a specific activity). A card has a title, description, location, price range, mood tags, and photos.

**Not called:** "option", "item", "choice", "date card" (just "card" in code)

---

### Question
A single preference prompt within a Quiz Module. Has question text and an array of options (the selector picks one). Example: "Fancy or casual?" with options ["Fancy", "Casual"].

**Not called:** "quiz item", "prompt", "preference"

---

### Selection
The completed submission from the selector. A selection belongs to one flow and contains one Answer per module. A selection is immutable once submitted.

**Not called:** "response", "submission", "result", "vote"

---

### Answer
An individual answer within a Selection. For a Decision Module answer, it contains the IDs of the chosen Card(s). For a Quiz Module answer, it contains the text of the chosen option.

**Not called:** "response", "choice", "pick"

---

## People

### Creator
The person who builds and manages flows. In this project, always Cyrill. Authenticated via Supabase Auth. Has full read/write access to all data.

**Not called:** "admin", "user", "owner"

---

### Selector
The person who receives the flow link and makes selections. In this project, always the girlfriend. Has no account. Access is gated by the flow token. Cannot read back their own submission.

**Not called:** "recipient", "user", "voter", "responder"

---

## Key Concepts

### Token
A cryptographically random UUID generated when a flow is published. Embedded in the share URL. Grants the selector access to a specific published flow. Not the same as an auth token — it has no expiry and is not tied to a user session.

**Not called:** "link", "code", "invite", "key"

---

### Share URL
The full URL containing the token that the creator sends to the selector. Format: `https://app.com/:token`. This is what makes the flow accessible without a login.

**Not called:** "invite link", "magic link", "selector link"

---

### Flow Status
The lifecycle state of a flow. One of: `draft`, `published`, `unpublished`, `archived`. Drives both UI behaviour (editability) and data access (RLS).

---

### Publish
The action of making a flow accessible to the selector. Generates the token, sets `status = 'published'`, and locks the flow from editing.

---

### Position
The integer field that determines display order for modules within a flow, cards within a decision module, and questions within a quiz module. Zero-indexed. Gaps in position values are acceptable (re-ordering doesn't require renumbering).

---

### Mood Tags
Free-text labels on a card that convey the vibe of the option. Examples: `['cozy', 'romantic', 'outdoor', 'active']`. Used for visual display only — not used in any filtering or matching logic.

---

## What a "Date Night" Looks Like in the Domain Model

A typical flow for a date night:

```
Flow: "Our weekend surprise"
  intro_message: "Pick what sounds right to you..."

  Decision Module [position: 0]
    prompt_text: "Where would you like to go?"
    Cards:
      - Card: "Dinner at Kronenhalle" (fancy, indoor, €€€)
      - Card: "Fondue in the old town" (cozy, romantic, €€)
      - Card: "Street food night" (casual, outdoor, €)

  Decision Module [position: 1]
    prompt_text: "After dinner?"
    Cards:
      - Card: "Cocktails at the rooftop bar"
      - Card: "Walk along the lake"
      - Card: "Cinema"

  Quiz Module [position: 2]
    title: "Just a couple of quick ones..."
    Questions:
      - "Early or late evening?" → ["Early (6pm)", "Late (8pm)"]
      - "Dress up or keep it easy?" → ["Dress up", "Casual"]

  outro_message: "Perfect. I'll take it from here. ❤️"
```
