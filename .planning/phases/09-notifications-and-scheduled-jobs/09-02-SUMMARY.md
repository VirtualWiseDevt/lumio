# Phase 9 Plan 02: Wire Event-Triggered Email Notifications Summary

**One-liner:** Fire-and-forget email notifications wired into registration, password reset, payment callbacks, referral credit grants, and reconciliation job.

## What Was Done

### Task 1: Wire welcome and password reset emails in auth service
- Added imports for `sendEmail`, `buildWelcomeEmail`, `buildPasswordResetEmail` from email.service
- Added `env` import for building password reset URL from CORS_ORIGINS
- Wired welcome email after registration (outside transaction, fire-and-forget)
- Replaced `[DEV] Password reset token` console.log with real password reset email containing reset URL
- Commit: `cbdd134`

### Task 2: Wire payment, referral, and reconciliation notification emails
- **payment.service.ts:** Added payment success email after M-Pesa callback success transaction, payment failure email after callback failure, and payment success email for KES 0 credits-only payments
- **referral.service.ts:** Added referral reward email to referrer after credit grant with referee name, credits earned, and new balance
- **reconciliation.job.ts:** Replaced `RECONCILIATION_NOTIFICATION_PLACEHOLDER` with real payment confirmation email
- All sends use fire-and-forget pattern (no `await`, `.catch` for error logging)
- Commit: `f4974a7`

## Key Files Modified

| File | Changes |
|------|---------|
| `api/src/services/auth.service.ts` | Welcome email on register, password reset email on forgotPassword |
| `api/src/services/payment.service.ts` | Payment success/failure emails on processCallback, success email on KES 0 path |
| `api/src/services/referral.service.ts` | Referral reward email on grantReferralCredit |
| `api/src/jobs/reconciliation.job.ts` | Payment confirmation email on reconciled success |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Reset URL uses `env.CORS_ORIGINS[0]` | First CORS origin is the primary frontend URL |
| Email sends outside Prisma transactions | Side effects must not be inside transactions to avoid blocking |
| Referral email reads within tx context | Reading user data inside tx is fine; the async send runs outside |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compiles without errors (`npx tsc --noEmit`)
- All 4 files contain `sendEmail` imports and calls
- No `await sendEmail` anywhere (fire-and-forget confirmed)
- `RECONCILIATION_NOTIFICATION_PLACEHOLDER` grep returns nothing (placeholder removed)
- DEV console.log for password reset removed

## Duration

~2.5 minutes
