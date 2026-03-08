---
phase: 08-referral-system-and-invite-model
plan: 02
subsystem: payment-integration-and-routes
tags: [payment, referral-credits, coupons, routes, auth]
depends_on:
  requires: [08-01]
  provides: [referral-routes, coupon-routes, credit-payment-flow, admin-invite-auth]
  affects: [08-03, 08-04, 08-05, 08-06]
tech-stack:
  added: []
  patterns: [kes-0-payment-path, coupon-first-credit-second-stacking, first-payment-referral-grant]
key-files:
  created:
    - api/src/routes/referral.routes.ts
    - api/src/routes/coupon.routes.ts
  modified:
    - api/src/services/payment.service.ts
    - api/src/services/auth.service.ts
    - api/src/validators/payment.validators.ts
    - api/src/routes/payment.routes.ts
    - api/src/routes/index.ts
decisions:
  - credit-deduction-on-callback: "Referral credits and coupon redemption deferred to callback success (not initiation) to prevent credit loss on failed M-Pesa payments"
  - kes-0-atomic: "KES 0 path executes all operations (payment, credits, coupon, subscription) in single atomic transaction"
  - first-payment-grant: "grantReferralCreditIfFirst checks SUCCESS payment count === 1 to trigger referrer credit only on referee's first payment"
  - admin-invite-in-auth: "Registration checks User.referralCode first, falls back to AdminInviteCode (no Referral record created for admin codes)"
metrics:
  duration: ~4 min
  completed: 2026-03-08
---

# Phase 8 Plan 2: Payment Integration & API Routes Summary

Modified payment flow for coupon/credit deduction, created referral and coupon API routes, updated auth for admin invite codes.

## What Was Done

### Task 1: Payment Service Integration
- `initiatePayment` accepts optional `couponCode` param with stacking order: coupon discount first, then referral credits
- KES 0 path: when fully covered, creates SUCCESS payment with method "CREDITS" and activates subscription atomically
- Normal M-Pesa path: stores couponId/couponDiscount/referralCreditsUsed on PENDING payment, defers actual deduction to callback
- `processCallback` success path: deducts credits, redeems coupon, grants referral credit to referrer (first payment only), then activates subscription
- Auth service checks both User.referralCode and AdminInviteCode tables during registration

### Task 2: API Routes
- `referral.routes.ts`: GET /validate/:code (public, checks both user codes and admin invite codes), GET /stats (auth), GET /my-code (auth)
- `coupon.routes.ts`: POST /validate (auth, returns discountPercentage or error)
- `payment.routes.ts`: passes couponCode to initiatePayment
- `routes/index.ts`: registers /api/referrals and /api/coupons

## Verification

- `npx tsc --noEmit` passes
- Routes registered: /api/referrals (3 endpoints), /api/coupons (1 endpoint)
- Payment flow handles coupon + credit stacking correctly
