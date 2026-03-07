---
phase: 07-payments-and-subscriptions
plan: 04
subsystem: api-routes
tags: [express, routes, mpesa, cron, reconciliation, subscription-guard]
depends_on:
  requires: ["07-02"]
  provides: ["payment-api-endpoints", "mpesa-callback-webhook", "plans-endpoint", "reconciliation-cron", "stream-subscription-guard"]
  affects: ["07-05", "07-06", "09"]
tech_stack:
  added: []
  patterns: ["public-endpoint", "webhook-always-200", "cron-reconciliation", "middleware-chaining"]
key_files:
  created:
    - api/src/routes/plan.routes.ts
    - api/src/routes/payment.routes.ts
    - api/src/routes/mpesa-callback.routes.ts
    - api/src/jobs/reconciliation.job.ts
  modified:
    - api/src/routes/index.ts
    - api/src/routes/stream.routes.ts
    - api/src/server.ts
decisions:
  - id: "07-04-01"
    decision: "Plans endpoint is public (no auth) for SEO and billing page pre-auth loading"
    rationale: "Marketing pages and billing page need plan data before user authenticates"
  - id: "07-04-02"
    decision: "M-Pesa callback always returns 200 with ResultCode 0 regardless of processing outcome"
    rationale: "Safaricom retries on non-200 responses which causes duplicate processing"
  - id: "07-04-03"
    decision: "Reconciliation success path uses console.log placeholder for Phase 9 notification"
    rationale: "CONTEXT.md requires confirmation notification but infrastructure not yet built"
metrics:
  duration: "~3 min"
  completed: "2026-03-07"
---

# Phase 07 Plan 04: Payment Routes, Callback Webhook, and Reconciliation Cron Summary

**One-liner:** Express routes for payment initiation/status/history, public plans listing, M-Pesa webhook (always-200), subscription guard on streams, and 2-minute reconciliation cron with Phase 9 notification placeholder.

## What Was Done

### Task 1: Payment routes, plans route, and M-Pesa callback route
- Created `plan.routes.ts`: GET /api/plans -- public endpoint returning active plans ordered by price
- Created `payment.routes.ts`: POST /initiate, GET /history (paginated), GET /:id/status -- all auth-required
- Created `mpesa-callback.routes.ts`: POST / -- no auth, always returns 200 with `{ ResultCode: 0, ResultDesc: "Accepted" }`
- Updated `index.ts`: registered all three routers at /api/plans, /api/payments, /api/mpesa/callback
- Commit: `64693ba`

### Task 2: Subscription guard, reconciliation cron, server wiring
- Updated `stream.routes.ts`: added `requireSubscription` after `requireAuth` in middleware chain
- Created `reconciliation.job.ts`: runs every 2 minutes, queries Safaricom for PENDING payments older than 2 minutes
  - Max 5 reconciliation attempts before marking as FAILED with "Reconciliation timeout"
  - Success (ResultCode 0): atomic $transaction to update payment + activate subscription
  - Terminal failures (1, 1032, 1037, 9999): mark as FAILED
  - Non-terminal (1001 system busy): leave for next cron run
  - Includes RECONCILIATION_NOTIFICATION_PLACEHOLDER for Phase 9 grep discovery
- Updated `server.ts`: imports and starts reconciliation job after transcode worker
- Commit: `8cb037d`

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Plans endpoint public** -- no auth required so billing page loads plans before auth resolves
2. **Callback always 200** -- Safaricom expects success response; validation failures logged but accepted
3. **Notification placeholder** -- structured console.log with grep anchor for Phase 9 integration

## Verification Results

- `npx tsc --noEmit` passes with zero errors
- All routes registered in index.ts (plans, payments, mpesa/callback)
- Stream routes use requireAuth + requireSubscription middleware chain
- Reconciliation job contains RECONCILIATION_NOTIFICATION_PLACEHOLDER grep anchor
- Server.ts starts reconciliation job on boot

## Next Phase Readiness

- Payment endpoints ready for client billing page integration (07-05/07-06)
- Phase 9 can grep RECONCILIATION_NOTIFICATION_PLACEHOLDER to find notification integration point
- Stream access now gated behind active subscription
