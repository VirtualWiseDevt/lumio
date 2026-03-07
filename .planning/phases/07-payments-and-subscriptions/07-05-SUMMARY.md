---
phase: "07"
plan: "05"
subsystem: "client-billing-ui"
tags: ["billing", "mpesa", "payment-modal", "subscription", "tanstack-query"]
depends_on:
  requires: ["07-03"]
  provides: ["/billing page", "plan cards", "payment modal", "payment history"]
  affects: ["07-06"]
tech_stack:
  added: []
  patterns: ["three-step modal flow", "query invalidation on mutation", "urgency indicator"]
key_files:
  created:
    - "client/src/components/billing/PlanCard.tsx"
    - "client/src/components/billing/PlanGrid.tsx"
    - "client/src/components/billing/SubscriptionStatus.tsx"
    - "client/src/components/billing/PaymentHistory.tsx"
    - "client/src/components/billing/PaymentModal.tsx"
    - "client/src/app/billing/page.tsx"
  modified: []
decisions:
  - id: "07-05-01"
    decision: "CSS spinner instead of Motion rotation for waiting step"
    rationale: "Simpler, no extra dependency for a basic animation"
  - id: "07-05-02"
    decision: "PaymentHistory self-fetching with TanStack Query"
    rationale: "Encapsulated component with own pagination state"
metrics:
  duration: "~4 min"
  completed: "2026-03-07"
---

# Phase 7 Plan 5: Billing Page UI Summary

**JWT-guarded billing page with plan selection cards, three-step M-Pesa payment modal, subscription status with urgency indicator, and paginated payment history table.**

## What Was Built

### PlanCard & PlanGrid
- Individual plan cards showing name, price (KES), duration, and price-per-day calculation
- "Best Value" badge on Monthly plan, "Current Plan" badge on active plan
- Selected state with primary ring highlight
- Responsive 3-column grid stacking to single column on mobile

### SubscriptionStatus
- Current plan name, formatted expiry date, days remaining counter
- Color-coded urgency: green (7+ days), yellow (3-7 days), red (<3 days)
- Renew button scrolls to plan selection section

### PaymentModal (Three-Step Flow)
- Step 1 (Confirm): Plan name/price summary, editable phone input pre-filled from user profile, Pay with M-Pesa button
- Step 2 (Waiting): Spinner animation, "Check your phone" message with phone number, amount reminder, polls every 3s for 60s
- Step 3 (Result): Success (green check + receipt), Failed (red X + Try Again), Timeout (amber clock + processing message)
- Double-payment protection: Pay button disabled immediately on click
- AnimatePresence transitions between steps

### PaymentHistory
- Self-contained component with TanStack Query pagination
- Table columns: Date, Amount, Plan, M-Pesa Receipt, Status
- Color-coded status badges: SUCCESS (green), PENDING (yellow), FAILED (red), EXPIRED (gray)
- Skeleton loading rows and empty state

### Billing Page (/billing)
- Conditional SubscriptionStatus card (only for active subscribers)
- Value pitch text for first-time users
- PlanGrid with plan selection state
- Central "Pay with M-Pesa" button (disabled until plan selected)
- PaymentHistory at bottom
- Query invalidation on payment success (subscription + payment-history)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes with zero errors
- `npm run build` succeeds, /billing page renders at 4.86 kB
- Monthly plan gets "Best Value" badge
- Payment modal has three distinct steps with AnimatePresence
- Phone pre-filled from getUserProfile
- Payment history has proper columns with status badges

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | b7dc0c5 | PlanCard, PlanGrid, SubscriptionStatus components |
| 2 | 1406fdf | PaymentHistory table component |
| 3 | b4b2ab1 | PaymentModal and billing page assembly |
