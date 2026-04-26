# State Diagram — Flow Lifecycle

The `flows` table has a `status` column that drives access control, UI presentation, and allowed operations.

---

## Diagram

```mermaid
stateDiagram-v2
  [*] --> Draft : Creator creates a new flow

  Draft --> Draft : Creator edits modules, cards, questions
  Draft --> Published : Creator clicks "Publish"\n(token generated, link becomes active)
  Draft --> Archived : Creator deletes draft

  Published --> Published : Selector submits selection\n(selections accumulate)
  Published --> Unpublished : Creator deactivates link\n(link stops working for selector)
  Published --> Archived : Creator archives flow

  Unpublished --> Published : Creator reactivates link
  Unpublished --> Archived : Creator archives

  Archived --> [*]

  note right of Draft
    - Invisible to selector (RLS)
    - Editable in full
    - No token exists yet
  end note

  note right of Published
    - Selector link is active
    - Token is valid
    - Modules/cards locked (read-only in UI)
    - Selections accumulate
  end note

  note right of Unpublished
    - Token still exists in DB
    - Selector link returns 404
    - No new selections possible
    - Creator can view existing selections
  end note

  note right of Archived
    - Soft-deleted
    - Hidden from creator dashboard by default
    - Data retained for history
    - Not recoverable via UI (manual DB only)
  end note
```

---

## Transition Rules

| Transition | Trigger | Side Effects |
|---|---|---|
| Draft → Published | `POST /api/flows/:id/publish` | Generates UUID token, sets `published_at` timestamp |
| Published → Unpublished | `PATCH /api/flows/:id { status: 'unpublished' }` | Token preserved; selector link returns 404 |
| Unpublished → Published | `PATCH /api/flows/:id { status: 'published' }` | Same token reused; link becomes active again |
| Any → Archived | `DELETE /api/flows/:id` | Sets `status = 'archived'`, sets `archived_at`; data not deleted |

---

## Why Editing is Locked on Published Flows

Once a flow is published, the selector may open the link at any time. Editing modules or cards mid-session would cause the selector to see an inconsistent state (e.g., a card they already selected disappears). If the creator needs changes, they should unpublish, edit, and republish — which generates a new share URL.

This is enforced in the API: `PATCH /api/flows/:id/modules/*` returns `423 Locked` if `flow.status = 'published'`.
