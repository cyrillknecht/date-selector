# Threat Model — STRIDE

Analysis of security threats using the STRIDE framework (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).

---

## Assets

| Asset | Sensitivity | Why it matters |
|---|---|---|
| Flow content (dates, photos, descriptions) | Medium | Personal/romantic; creator wouldn't want these exposed publicly |
| Selections (girlfriend's choices + message) | High | Private communication between two people |
| Creator credentials | High | Full control over the application |
| Photo files in storage | Medium | Personal photos |
| Flow token | Medium | Grants selector access to a specific flow |

---

## Trust Boundaries

1. **Internet → Vercel Edge** — untrusted public traffic
2. **Browser (Selector) → Next.js API** — authenticated by flow token only
3. **Browser (Creator) → Next.js API** — authenticated by Supabase JWT
4. **Next.js Server → Supabase** — internal, service role key

---

## Threat Analysis

### S — Spoofing

| ID | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| S1 | Attacker guesses a flow token and accesses someone's flow | Flow token | Very Low | Medium | Tokens are UUIDs (122 bits of entropy). Brute force is computationally infeasible. |
| S2 | Attacker replays an expired creator JWT | Creator session | Low | High | Supabase Auth enforces JWT expiry. Refresh tokens are rotated on use and revocable. |
| S3 | Attacker forges a Supabase JWT to access creator routes | Creator session | Very Low | High | JWTs are signed with Supabase's private key. Verification uses the public key server-side. |

### T — Tampering

| ID | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| T1 | Selector modifies the POST body to submit false answers | Selection data | Low | Low | Answers are validated server-side against the flow's actual module structure. Invalid module IDs are rejected. |
| T2 | Attacker modifies a card or flow via the API | Flow data | Very Low | Medium | All write endpoints require a valid creator JWT. RLS prevents anon writes. |
| T3 | Attacker uploads malicious files to photo storage | Storage bucket | Low | Medium | Signed URLs are generated server-side per request, are short-lived (60s), and are scoped to a specific path. Content-Type is validated. |

### R — Repudiation

| ID | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | Creator denies having published a flow | Flow status | N/A | Low | `published_at` timestamp is set server-side and not editable. Audit trail via Vercel logs. |
| R2 | Selector denies having submitted a selection | Selection | N/A | Low | `submitted_at` timestamp is set server-side. Not a meaningful threat for a personal app. |

### I — Information Disclosure

| ID | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| I1 | Draft flow content exposed to selector | Flow data | Very Low | Medium | RLS policy enforces `status = 'published'` check. Draft flows are invisible to anon key queries. |
| I2 | Service role key exposed to browser | DB access | Very Low | Critical | Service role key is only used in server-side Next.js code. Never passed to client. Environment variable is server-only (`SUPABASE_SERVICE_ROLE_KEY`, not prefixed with `NEXT_PUBLIC_`). |
| I3 | Selections visible to selector (read-back) | Selection data | Low | Low | RLS: `selections` table has no SELECT policy for anon role. Selector cannot read any selection data back. |
| I4 | One selector reads another selector's submission | Selection data | Low | Medium | Not applicable in v1 — flows are designed for a single selector. Token is shared only with one person. If multi-selector is added later, RLS must be revisited. |
| I5 | API keys leaked in client bundle | Credentials | Low | High | Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed. Anon key is safe with RLS. Resend and service role keys are server-only env vars. |

### D — Denial of Service

| ID | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| D1 | Attacker floods `/api/selections` with fake submissions | Selections table, email inbox | Low | Medium | Vercel edge rate limiting. Email failure is non-blocking. DB impact is low (small row size). |
| D2 | Attacker abuses photo upload endpoint | Supabase Storage | Low | Medium | Upload endpoint requires creator JWT — anon users cannot generate signed URLs. |
| D3 | Supabase free tier pauses from inactivity | Availability | Medium | Low | Expected behaviour on free tier. Creator can prevent by upgrading or visiting the dashboard periodically. |

### E — Elevation of Privilege

| ID | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| E1 | Selector accesses creator dashboard | Creator routes | Very Low | High | Middleware validates JWT on every `/(creator)/*` request. No JWT = immediate redirect to login. |
| E2 | Selector modifies or deletes flow data via API | Flow data | Very Low | High | All write API routes validate creator JWT server-side. RLS provides a second layer. |
| E3 | SQL injection via user input | Database | Very Low | High | All DB access uses the Supabase JS SDK with parameterised queries. No raw SQL concatenation. |

---

## Residual Risk Summary

| Risk | Residual Likelihood | Residual Impact | Accepted? |
|---|---|---|---|
| Flow token brute force (S1) | Negligible | Medium | Yes — UUID entropy makes this infeasible |
| Service role key leaked (I2) | Very Low | Critical | Yes — mitigated by server-only env vars; requires developer error |
| Selector flood (D1) | Low | Medium | Yes — Vercel edge protection is sufficient |
| Supabase free tier pause (D3) | Medium | Low | Yes — acceptable for a personal project |

---

## Out of Scope Threats

- Physical access to developer machine
- Supabase platform compromise
- Vercel infrastructure compromise
- Social engineering of the creator
