# API Design Principles

Standards and conventions for all API routes in this project.

---

## URL Structure

- All API routes are prefixed with `/api/`
- Resources are plural nouns: `/api/flows`, `/api/selections`
- Nested resources use path params: `/api/flows/:id/modules/:moduleId/cards`
- Actions that don't fit CRUD use a verb suffix: `/api/flows/:id/publish`

## HTTP Methods

| Method | Usage |
|---|---|
| `GET` | Read. Never mutates state. Safe to retry. |
| `POST` | Create a new resource or trigger an action. |
| `PATCH` | Partial update. Only send changed fields. |
| `DELETE` | Archive/soft-delete. Never hard-deletes application data. |
| `PUT` | Not used. PATCH covers all update cases. |

## Status Codes

| Code | Meaning in this API |
|---|---|
| `200` | Success with response body |
| `201` | Resource created; body contains the new resource |
| `204` | Success with no response body (e.g., archive) |
| `400` | Malformed request or missing required field |
| `401` | Missing or expired creator session |
| `403` | Authenticated but not authorized (e.g., accessing another user's resource — not applicable in v1 but reserved) |
| `404` | Resource not found or token invalid |
| `409` | Conflict (e.g., duplicate selection submission) |
| `422` | Request is well-formed but cannot be processed (e.g., publishing a flow with no modules) |
| `423` | Resource is locked (e.g., editing a published flow) |
| `500` | Unhandled server error — always logged |

## Error Response Format

All error responses return a consistent JSON body:

```json
{
  "error": "Human-readable description",
  "code": "MACHINE_READABLE_CODE",
  "field": "fieldName"
}
```

`field` is only present for validation errors (400). `code` is one of:

```
AUTH_REQUIRED
NOT_FOUND
VALIDATION_ERROR
FLOW_LOCKED
DUPLICATE_SUBMISSION
INTERNAL_ERROR
```

## Request / Response Conventions

- **Casing:** JSON keys use `camelCase` (TypeScript-native). Database column names use `snake_case` and are mapped at the API boundary.
- **Dates:** All timestamps are `ISO 8601` strings in UTC (e.g., `2026-04-26T14:00:00.000Z`).
- **Nulls:** Optional fields that are absent are returned as `null`, not omitted.
- **Arrays:** Empty arrays are returned as `[]`, not `null`.
- **IDs:** All resource IDs are `uuid v4` strings.

## Authentication

- Creator routes validate the Supabase JWT from the `sb-access-token` httpOnly cookie via `@supabase/ssr`.
- The JWT is refreshed automatically by the middleware if it has expired but the refresh token is valid.
- API routes never accept auth via query string or `Authorization` header — cookie only.

## Versioning

No versioning scheme in v1. This is a private, single-user API with no external consumers. If breaking changes are needed, they are deployed with the frontend in the same release. A versioning strategy (`/api/v2/...`) will be introduced only if an external consumer (e.g., a mobile app) requires it.

## Idempotency

- `GET`, `PATCH`, and `DELETE` are inherently idempotent.
- `POST /api/selections` checks for a duplicate submission (by `flow_id` + session fingerprint) and returns `409` if already submitted. This prevents double-emailing on network retry.
- `POST /api/flows/:id/publish` is idempotent: calling it on an already-published flow returns `200` with the existing share URL without generating a new token.

## Rate Limiting

Handled at the Vercel edge layer. No custom rate limiting is implemented in the application for v1 — traffic is too low to warrant it. If the selector link is shared publicly by mistake, Vercel's DDoS protection applies.
