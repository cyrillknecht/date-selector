# Error Handling Strategy

---

## Principles

1. **Errors are caught at boundaries.** Server errors are caught in API routes. Client errors are caught in React error boundaries. Neither propagates silently.
2. **User-facing messages are never technical.** Stack traces and DB errors never reach the UI.
3. **Non-critical failures degrade gracefully.** A failed email does not fail the selection submission.
4. **Errors are logged with enough context to diagnose.** No swallowing errors with empty `catch {}` blocks.

---

## API Route Error Handling

All API routes are wrapped in a shared `withErrorHandler` higher-order function:

```
request received
  → validation (400 if invalid)
  → auth check (401 if missing/expired)
  → business logic
    → expected errors (404, 409, 422, 423) thrown as typed AppError
    → unexpected errors caught by wrapper → logged → 500 returned
  → response
```

**AppError class:**
```typescript
class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    public readonly field?: string
  ) {}
}
```

**Error response format (consistent for all errors):**
```json
{
  "error": "Human-readable description",
  "code": "MACHINE_READABLE_CODE",
  "field": "fieldName (validation errors only)"
}
```

**Unhandled errors (500):**
- Full error and stack are logged server-side (Vercel logs)
- Client receives only: `{ "error": "Something went wrong", "code": "INTERNAL_ERROR" }`
- Never expose stack traces, DB error messages, or internal state to the client

---

## Client-Side Error Handling

### API call failures

All `fetch()` calls to API routes use a shared `apiFetch` wrapper that:
- Parses the error response body
- Returns a typed `{ data, error }` result (no thrown exceptions in UI code)
- Triggers the appropriate UI state (inline error, toast, or full error page)

### React Error Boundaries

Two error boundaries are in place:

| Boundary | Scope | Fallback UI |
|---|---|---|
| Root (`app/layout.tsx`) | Entire application | "Something went wrong. Please refresh." with a refresh button |
| Selector flow (`FlowController`) | The multi-step selection experience | "Something went wrong. Your progress has not been lost — please refresh to try again." |

The selector flow boundary preserves the in-memory selection state via `sessionStorage` before triggering the boundary, so the user does not lose their progress on refresh.

---

## Specific Error Scenarios

### Email delivery failure
- Email is sent after the selection is saved
- Resend API call is wrapped in `try/catch`
- On failure: `WARN` logged with `selectionId` and error message
- Selection is **not rolled back** — it is saved regardless
- Creator can still view the selection in the dashboard
- No retry mechanism in v1 (low frequency, manual recovery via dashboard)

### Photo upload failure
- Signed URL generation failure: inline error shown on the card editor — "Could not prepare upload. Try again."
- Direct-to-storage PUT failure: inline error — "Upload failed. Check your connection and try again."
- The card is not saved until at least one photo is successfully uploaded (photos are optional but the UX guides toward uploading at least one)

### Supabase connection error (e.g., project paused)
- API routes will receive a connection error from the Supabase client
- Error is caught by `withErrorHandler`, logged, and returned as 500
- UI shows: "We're having trouble connecting. Please try again in a moment."
- No silent failure

### Invalid flow token
- Server returns 404
- UI renders a dedicated "This link is not active" page — not a generic error
- The page has a friendly message and does not expose any information about the flow or why the token is invalid

### Submission after flow unpublished (mid-session)
- Selector fills in the flow, then creator unpublishes it before submission
- `POST /api/selections` validates the token server-side at submission time
- Returns 404 — "This link is no longer active"
- UI shows a specific "This link has been closed" screen — not a generic error

---

## Logging Standards

```typescript
// Good: structured, includes context
console.log(JSON.stringify({
  level: 'ERROR',
  event: 'selection.submit.failed',
  flowId,
  error: error.message,
}))

// Bad: unstructured, no context
console.log('Error:', error)

// Bad: swallowed
try { ... } catch (_) {}
```

All `ERROR` level logs include `event`, `error.message`, and relevant IDs. No `console.log` in production paths — only structured `INFO`, `WARN`, or `ERROR`.
