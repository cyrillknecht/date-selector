# Monitoring & Observability Strategy

---

## Guiding Principle

This is a personal project with a single creator. The goal is to know when something breaks — not to build a full observability platform. Everything here uses the free tiers of existing tools.

---

## Logging

### What is logged

| Event | Level | Location | Fields |
|---|---|---|---|
| Selection submitted | `INFO` | Vercel function logs | `flowId`, `selectionId`, `submittedAt` |
| Email sent | `INFO` | Vercel function logs | `selectionId`, `resendMessageId` |
| Email failed | `WARN` | Vercel function logs | `selectionId`, `error.message` |
| Flow published | `INFO` | Vercel function logs | `flowId`, `token` (first 8 chars only) |
| Auth failure (invalid JWT) | `WARN` | Vercel function logs | `path`, `reason` |
| Invalid token on selector load | `WARN` | Vercel function logs | `token` (first 8 chars only), `path` |
| Unhandled API error | `ERROR` | Vercel function logs | `path`, `method`, `error.message`, `stack` |
| DB query error | `ERROR` | Vercel function logs | `operation`, `error.message` |

### What is NOT logged

- Full flow tokens (logged as first 8 chars only for debugging)
- Selection content or answers (private between creator and selector)
- User input from form fields
- Full stack traces in production client responses (only in server logs)

### Log format

All logs are structured JSON via `console.log(JSON.stringify({ level, event, ...fields }))` — Vercel captures and indexes these automatically.

```json
{
  "level": "INFO",
  "event": "selection.submitted",
  "flowId": "uuid",
  "selectionId": "uuid",
  "submittedAt": "2026-04-26T14:00:00.000Z"
}
```

---

## Error Tracking

**Tool:** Vercel's built-in error tracking (free, no additional setup).

- Runtime errors in serverless functions are captured automatically.
- The Vercel dashboard shows error rate, affected deployments, and stack traces.
- No additional SDK (Sentry, Datadog) is added in v1 — traffic volume does not justify it.

---

## Alerting

**Tool:** Vercel email alerts (free).

| Alert | Trigger | Channel |
|---|---|---|
| Function error spike | >5 errors in 5 minutes | Email to cykn128@gmail.com |
| Deployment failed | Build or deploy failure on `main` | Email to cykn128@gmail.com |

Configured in Vercel project settings → Notifications.

No PagerDuty, no on-call rotation. A failed deployment or runtime error surfaces within minutes via email.

---

## Service Level Objectives (SLOs)

These are informal targets, not contractual SLAs. Reviewed only if the app becomes unreliable.

| SLO | Target | Measurement |
|---|---|---|
| Selector page load (p95) | < 2 seconds | Vercel Analytics (free) |
| Selection submission success rate | > 99% | Vercel function error rate |
| Email delivery success rate | > 95% | Resend dashboard delivery stats |
| Uptime (selector URL responds) | > 99% | Vercel uptime (inherent from platform) |

**Note on Supabase free tier pause:** If the Supabase project pauses from inactivity, the selector URL will fail with a DB connection error. This is not tracked as an SLO breach — it is expected free tier behaviour. The creator will notice when they try to use the app.

---

## Dashboards

| Dashboard | Tool | What it shows |
|---|---|---|
| Function performance + errors | Vercel Dashboard | Request count, error rate, function duration |
| Deployment history | Vercel Dashboard | All deploys, rollback controls |
| Email delivery | Resend Dashboard | Sent, delivered, bounced, failed |
| DB performance | Supabase Dashboard | Query times, connection count, storage used |

No custom dashboards are built in v1. The above platform dashboards are sufficient.

---

## Incident Response (abbreviated)

1. **Alert received** (Vercel email or manual discovery)
2. Check Vercel function logs for the error
3. If DB related: check Supabase dashboard for connection or query issues
4. If email related: check Resend dashboard — selections are still saved even if email fails
5. Rollback via Vercel dashboard if the issue was introduced in the last deployment
6. Fix in a branch, merge to `main`, auto-deploys within 60 seconds

Full runbook is in [`operations/runbook.md`](runbook.md) (to be created pre-launch).
