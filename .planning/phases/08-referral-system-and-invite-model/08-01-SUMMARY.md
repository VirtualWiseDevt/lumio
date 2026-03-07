---
phase: 08-referral-system-and-invite-model
plan: 01
subsystem: referral-and-coupon-foundation
tags: [prisma, schema, referral, coupon, service-layer]
depends_on:
  requires: [phase-07]
  provides: [referral-service, coupon-service, referral-schema, coupon-redemption-model, admin-invite-code-model]
  affects: [08-02, 08-03, 08-04, 08-05, 08-06]
tech-stack:
  added: []
  patterns: [referral-credit-cap, per-user-coupon-tracking, txclient-transaction-pattern]
key-files:
  created:
    - api/prisma/migrations/20260307185649_add_referral_credits_and_coupons/migration.sql
    - api/src/services/referral.service.ts
    - api/src/services/coupon.service.ts
    - api/src/validators/referral.validators.ts
    - api/src/validators/coupon.validators.ts
  modified:
    - api/prisma/schema.prisma
decisions:
  - referral-credit-100pct-cap: "Balance capped at referrer's plan price; additional referrals beyond cap still marked redeemed but grant 0 credit"
  - coupon-percentage-only: "Only PERCENTAGE coupon type validated in Phase 8 per user decision; enum kept for future flexibility"
  - per-user-coupon-unique-constraint: "@@unique([couponId, userId]) enforces one redemption per coupon per user"
metrics:
  duration: ~3 min
  completed: 2026-03-07
---

# Phase 8 Plan 1: Schema & Services Foundation Summary

Schema migration adding referralCreditBalance on User, CouponRedemption model, AdminInviteCode model, and Payment discount fields, plus referral.service.ts and coupon.service.ts with credit cap enforcement and per-user coupon tracking.

## What Was Done

### Task 1: Schema Migration
- Added `referralCreditBalance Int @default(0)` to User model
- Added `couponId`, `couponDiscount`, `referralCreditsUsed` to Payment model with Coupon relation
- Added `perUserLimit` to Coupon model with CouponRedemption and Payment relations
- Created `CouponRedemption` model with `@@unique([couponId, userId])` constraint
- Created `AdminInviteCode` model for bootstrapping invite-only registration
- Migration applied and Prisma client regenerated

### Task 2: Referral and Coupon Services
- `referral.service.ts`: validateReferralCode (returns "FirstName L." format), getReferralStats (friendsJoined, creditsEarned, currentBalance), grantReferralCredit (10% of referrer plan price, 100% cap enforced)
- `coupon.service.ts`: validateCoupon (checks active, not expired, PERCENTAGE type, usage limits, per-user redemption), redeemCoupon (creates redemption record, increments usage count)
- Both services use TxClient pattern for transaction safety
- Zod validators for referral code params and coupon validation

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **100% credit cap enforcement**: When referrer's balance already equals or exceeds their plan price, grantReferralCredit marks the referral as redeemed with creditAmount=0 (no silent failures, referral still tracked)
2. **CouponRedemption paymentId is @unique**: One-to-one relation with Payment ensures a payment can only have one coupon redemption

## Verification

- `npx prisma validate` passes
- `npx prisma migrate status` shows all 8 migrations applied
- `npx tsc --noEmit` compiles cleanly
- Generated client includes CouponRedemption, AdminInviteCode, referralCreditBalance

## Next Phase Readiness

All subsequent plans (08-02 through 08-06) can proceed. The schema and services provide the foundation for:
- 08-02: Referral and coupon API routes
- 08-03: Payment flow integration (credit/coupon deduction)
- 08-04: Registration modification for admin invite codes
- 08-05: Invite Friends client page
- 08-06: Coupon UI on billing page
