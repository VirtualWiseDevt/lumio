---
phase: "07"
plan: "03"
subsystem: "client-billing"
tags: ["typescript", "tanstack-query", "billing", "subscription", "mpesa", "polling"]
dependency-graph:
  requires: ["07-01"]
  provides: ["billing-types", "billing-api-client", "use-subscription-hook"]
  affects: ["07-05"]
tech-stack:
  added: []
  patterns: ["polling-with-timeout", "urgency-color-thresholds"]
key-files:
  created:
    - "client/src/types/billing.ts"
    - "client/src/api/billing.ts"
    - "client/src/hooks/use-subscription.ts"
  modified: []
decisions:
  - id: "07-03-01"
    description: "SubscriptionInfo type separate from UserSubscription (more fields: id, autoRenew)"
  - id: "07-03-02"
    description: "pollPaymentStatus uses 3s interval / 20 max attempts (60s total timeout)"
  - id: "07-03-03"
    description: "useSubscription urgency thresholds: green (7+), yellow (3-7), red (<3 days)"
metrics:
  duration: "~2 min"
  completed: "2026-03-07"
---

# Phase 7 Plan 3: Client Billing Data Layer Summary

Client-side billing types, API client functions with M-Pesa payment polling, and useSubscription hook with urgency color computation.

## What Was Done

### Task 1: Billing Types and API Client Functions (379857f)

Created `client/src/types/billing.ts` with all billing data structures:
- Plan, Payment, PaymentStatus, PaymentHistoryResponse
- InitiatePaymentResponse, PaymentStatusResponse, SubscriptionInfo

Created `client/src/api/billing.ts` with plain async functions:
- `getPlans()` - GET /api/plans, returns plan array
- `initiatePayment(planId, phone)` - POST /api/payments/initiate
- `getPaymentStatus(paymentId)` - GET /api/payments/:id/status
- `pollPaymentStatus(paymentId, options?)` - polling loop with 3s interval, 20 max attempts, returns success/timeout/data
- `getPaymentHistory(page?, limit?)` - GET /api/payments/history with pagination
- `getSubscription()` - GET /api/user/subscription, returns SubscriptionInfo or null

### Task 2: useSubscription Hook (eeb2972)

Created `client/src/hooks/use-subscription.ts`:
- TanStack Query hook with ["subscription"] query key
- 1-minute stale time (subscription doesn't change rapidly)
- retry: false to prevent infinite retries on auth errors
- Computes `isActive` (client-side date check for instant UI feedback)
- Computes `daysRemaining` (ceiling of days until expiration)
- Computes `urgency` color: green (7+ days), yellow (3-7 days), red (<3 days)
- Returns refetch for post-payment subscription refresh

## Decisions Made

1. **SubscriptionInfo vs UserSubscription**: New SubscriptionInfo type in billing.ts is more detailed (includes id, autoRenew) than the existing UserSubscription in player.ts. The billing page needs these extra fields.
2. **Polling defaults**: 3s interval with 20 max attempts gives 60s total -- matches M-Pesa STK Push typical response time (5-30s).
3. **Urgency thresholds**: green/yellow/red at 7/3/0 days -- matches CONTEXT.md spec for subscription urgency indicator.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes cleanly in client directory
- All types exported: Plan, Payment, PaymentStatus, SubscriptionInfo, InitiatePaymentResponse, PaymentStatusResponse, PaymentHistoryResponse
- All API functions exported: getPlans, initiatePayment, getPaymentStatus, pollPaymentStatus, getPaymentHistory, getSubscription
- useSubscription hook exported with isActive, daysRemaining, urgency, refetch

## Next Phase Readiness

Plan 07-04 (API routes) will create the server-side endpoints these client functions call. Plan 07-05 (billing page UI) will consume these types, API functions, and hook directly.
