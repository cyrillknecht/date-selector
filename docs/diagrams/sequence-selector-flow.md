# Sequence Diagram — Selector Completing a Flow

This is the primary user journey: the girlfriend opens the private link and completes her selection.

---

## Happy Path

```mermaid
sequenceDiagram
  actor S as Selector (Girlfriend)
  participant B as Browser
  participant N as Next.js Server
  participant DB as Supabase DB
  participant ST as Supabase Storage

  S->>B: Opens private link (/:token)

  B->>N: GET /:token
  N->>DB: SELECT flow WHERE token = :token AND status = 'published'
  DB-->>N: Flow + all modules + cards + questions
  alt Flow not found or not published
    N-->>B: 404 — "This link is not active"
  else Flow found
    N-->>B: Rendered selector landing page (intro message, creator's name)
  end

  S->>B: Taps "Let's go"
  Note over B: FlowController initialises<br/>in-memory selection state

  loop For each module in flow (in order)
    alt Decision Module
      B->>ST: Fetch card photos (CDN, public)
      ST-->>B: Photos
      Note over B: Animated card stack renders
      S->>B: Swipes / taps to select a card
      Note over B: Selection stored in local state<br/>(not yet sent to server)
      alt Module has sub-decisions
        Note over B: Sub-decision step renders
        S->>B: Selects sub-option
      end
    else Quiz Module
      Note over B: Animated question sequence renders
      S->>B: Answers each question
      Note over B: Answers stored in local state
    end
  end

  S->>B: (Optional) Types personal message
  S->>B: Taps "Send my choice"

  B->>N: POST /api/selections { flowId, token, answers[], message }
  N->>DB: SELECT flow WHERE token = :token (validate token server-side)
  DB-->>N: Flow confirmed

  N->>DB: INSERT into selections { flow_id, message, submitted_at }
  DB-->>N: selection.id

  N->>DB: INSERT into selection_answers (one row per module answer)
  DB-->>N: OK

  N->>N: Compose notification email (React Email template)
  N->>Resend: POST /emails { to: creator, subject, html }
  Resend-->>N: 200 OK
  Note over N: Email failure is caught and logged<br/>Selection is already saved — non-blocking

  N-->>B: 201 { success: true }
  Note over B: Confetti animation + confirmation screen<br/>with creator's outro message
```

---

## Error Cases

| Scenario | Behaviour |
|---|---|
| Token invalid or flow unpublished | Server returns 404; browser shows "This link is not active" page |
| Network drops mid-flow | Selection state is in memory; user can retry submission without re-doing the flow (state is preserved in React) |
| Submission POST fails (5xx) | Error UI shown; retry button; selection state preserved |
| Resend API fails | Email silently fails; selection is saved; creator can view in dashboard |
| Duplicate submission (same token, same session) | Server returns 409; browser shows "You've already submitted your choice" screen |
