# Phase 7: Payments and Subscriptions - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

M-Pesa STK Push payments via Safaricom Daraja API, three subscription plans (Weekly/Monthly/Quarterly), a dedicated billing page, subscription enforcement (blocking playback for expired users), webhook callback processing, and reconciliation cron for lost callbacks. Users pay via M-Pesa only. No card/PayPal.

</domain>

<decisions>
## Implementation Decisions

### Billing Page Experience
- Dedicated /billing route (not a section within /account)
- Three plan cards displayed horizontally, stacking vertically on mobile
- Monthly plan (KES 1,250) highlighted as recommended with a badge
- Current subscription status card at top: plan name, expiry date, days remaining with colored urgency indicator (green/yellow/red), renew button
- M-Pesa phone number pre-filled from user profile with edit button to change for this payment
- Payment history table visible below plan cards: date, amount, plan, M-Pesa receipt, status columns
- First-time users (no subscription): plan cards front and center with value pitch ("Stream unlimited movies, series & documentaries"), no status card
- No plan switching mid-subscription — current plan runs to expiry, user picks new plan when renewing

### M-Pesa Payment Flow
- Payment modal after clicking "Pay with M-Pesa": Step 1 (confirm amount + phone), Step 2 ("Check your phone" with spinner), Step 3 (success or failure result)
- 60-second timeout waiting for M-Pesa callback
- Timeout message: "Payment is still processing. We'll update your subscription automatically when confirmed. Check back shortly."
- On failure: "Try Again" button re-triggers STK Push with same plan and phone number
- Three-layer double-payment protection:
  1. Frontend: disable Pay button immediately on click, re-enable on modal close
  2. Server: check for existing PENDING payment for user before initiating STK Push
  3. Server: idempotency key (crypto.randomUUID()) with unique constraint on Payment model — catches simultaneous requests and network retries
- If existing pending payment found: return existing payment ID, frontend resumes polling that payment's status
- Schema addition: `idempotencyKey String? @unique` on Payment model

### Subscription Enforcement
- Block all video playback for expired users — browsing stays free
- No grace period — access ends immediately at expiry
- No free content — all video playback requires active subscription
- Expired user clicking Play: show modal overlay on current page ("Subscribe to continue watching") with link to /billing
- Subscription guard is middleware-level on stream/playback endpoints

### Payment Reconciliation
- Reconciliation cron runs every 2 minutes
- Checks for PENDING payments older than 2 minutes
- Queries Daraja Transaction Status API to resolve lost callbacks
- 5 retry attempts (at ~2, 4, 6, 8, 10 min after payment) before marking as failed
- On finding successful payment with missed callback: auto-activate subscription AND send confirmation notification/email
- Store full raw Daraja callback JSON payload on Payment record for debugging
- Admin visibility of unresolved payments deferred to Phase 10 admin dashboard — for now, log to console

### Development Strategy
- Local mock M-Pesa service for development (no external dependency, reliable, fast)
- Daraja sandbox for integration testing only (known instability during Kenyan business hours)
- MPESA_CALLBACK_URL as environment variable; use ngrok or similar tunnel for local dev

### Claude's Discretion
- Mock service implementation details
- Exact modal animation and transition styles
- Payment polling mechanism (SSE, WebSocket, or short polling)
- Cron job implementation (node-cron reuse from Phase 2)
- Error message copy for edge cases

</decisions>

<specifics>
## Specific Ideas

- Three-layer double-payment protection pattern with disable button + pending check + idempotency key (user provided detailed implementation approach including schema change)
- Mock service should simulate STK Push initiation, callback delay, and success/failure responses
- Idempotency key nullable on Payment model (existing test records won't have it), unique constraint for DB-level deduplication
- If pending payment found during retry, resume polling that payment instead of creating new one

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-payments-and-subscriptions*
*Context gathered: 2026-03-07*
