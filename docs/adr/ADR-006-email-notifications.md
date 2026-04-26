# ADR-006: Email Notifications

**Status:** Accepted  
**Date:** 2026-04-26  
**Deciders:** Cyrill Knecht

---

## Context

When the selector submits her choices, the creator (Cyrill) must receive an email summarizing all decisions made. The email should be readable and well-formatted — not a raw JSON dump. It must be triggered server-side from a Next.js API route.

Requirements:
- Triggered programmatically from a Next.js API route
- Supports HTML email templates
- Reliable delivery (not landing in spam)
- Free at the usage volume of this project (a handful of emails per month)

### Options Considered

| Option | Notes |
|---|---|
| **Resend** | Modern email API, generous free tier (3,000/month), React Email for templates, excellent DX |
| SendGrid | Industry standard, but free tier is 100/day and the dashboard/setup is more complex |
| Nodemailer + Gmail SMTP | Free, but Gmail has daily sending limits and OAuth setup is cumbersome; likely to land in spam |
| Postmark | Excellent deliverability, but paid-only (no meaningful free tier) |
| AWS SES | Very cheap at scale, but requires AWS account setup, domain verification, and more configuration overhead |

---

## Decision

**Use Resend with React Email for transactional email.**

Resend's API is a single function call from a Next.js API route. React Email lets the notification email be written as a React component — consistent with the rest of the codebase and easy to style. The free tier (3,000 emails/month) is effectively unlimited for this use case. Deliverability is handled by Resend's infrastructure with proper SPF/DKIM alignment.

### Email Content

The notification email sent to the creator will include:
- Which flow was completed and when
- Each decision module: the prompt and the card(s) selected
- Each quiz module: the questions and answers chosen
- Any personal message left by the selector

---

## Consequences

**Positive:**
- Simple API (`resend.emails.send(...)`) — no SMTP configuration
- React Email templates are type-safe and live in the repo alongside the app
- 3,000 emails/month free — covers this project indefinitely
- Proper deliverability out of the box (no spam filter issues)

**Negative:**
- Requires a verified sending domain (or use Resend's shared domain for testing); domain verification is a one-time setup step
- Minor vendor dependency for a non-critical feature; if Resend changes pricing, switching to SendGrid or Postmark is low effort

**Neutral:**
- Email is one-way (notification only); no reply handling needed
- Resend's free tier requires account creation but no credit card
