---
phase: 09-notifications-and-scheduled-jobs
plan: 01
subsystem: email-infrastructure
tags: [nodemailer, smtp, email-templates, prisma-migration]
depends_on:
  requires: []
  provides: [email-transport-factory, email-service, notification-tracking-fields]
  affects: [09-02, 09-03, 09-04]
tech_stack:
  added: [nodemailer, "@types/nodemailer"]
  patterns: [dual-mode-transport-factory, fire-and-forget-email, inline-html-templates]
key_files:
  created:
    - api/src/config/email.ts
    - api/src/services/email.service.ts
    - api/prisma/migrations/20260308030000_add_notification_tracking_fields/migration.sql
  modified:
    - api/prisma/schema.prisma
    - api/src/config/env.ts
    - api/package.json
    - package-lock.json
decisions:
  - id: 09-01-D1
    description: "Dual-mode transport factory with singleton pattern mirroring mpesa.ts"
  - id: 09-01-D2
    description: "Notification tracking via 3 nullable DateTime fields on Subscription (notifiedPreExpiry2Day, notifiedPreExpiry1Day, notifiedPostExpiry)"
  - id: 09-01-D3
    description: "Shared emailLayout helper for consistent HTML branding across all templates"
metrics:
  duration: ~4 min
  completed: 2026-03-08
---

# Phase 9 Plan 1: Email Infrastructure Summary

Dual-mode email transport factory (console/smtp) with 7 template builders and Subscription notification tracking fields for idempotent cron dispatch.

## What Was Done

### Task 1: Schema migration and env config
- Added 3 nullable DateTime fields to Subscription model: `notifiedPreExpiry2Day`, `notifiedPreExpiry1Day`, `notifiedPostExpiry` for idempotent notification tracking
- Added 6 email env vars to env.ts: `EMAIL_TRANSPORT` (console|smtp), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` -- all with safe defaults
- Created and applied Prisma migration `20260308030000_add_notification_tracking_fields`

### Task 2: Email transport factory and service
- Created `api/src/config/email.ts` with `EmailMessage` and `EmailTransport` interfaces, `SmtpTransport` class (nodemailer), `ConsoleTransport` class (logs to console), and `getEmailTransport()` singleton factory
- Installed `nodemailer` (runtime) and `@types/nodemailer` (dev)
- Created `api/src/services/email.service.ts` with:
  - `sendEmail()` wrapper -- single entry point for all email sending
  - `buildWelcomeEmail()` -- NOTF-01
  - `buildPaymentSuccessEmail()` -- NOTF-02 (full breakdown with coupon/credit deductions)
  - `buildPaymentFailureEmail()` -- NOTF-03
  - `buildPreExpiryEmail()` -- NOTF-04
  - `buildPostExpiryEmail()` -- NOTF-05
  - `buildReferralRewardEmail()` -- NOTF-06
  - `buildPasswordResetEmail()` -- bonus for existing forgotPassword TODO
- All templates use shared `emailLayout()` helper with Lumio branding (#e50914 red), CTA buttons, and transactional footer
- All templates return `{ subject, html, text }` with plain text fallback

## Decisions Made

1. **Singleton transport factory** -- `getEmailTransport()` caches the transport instance, matching the lazy-init pattern used elsewhere in the codebase
2. **Three separate tracking fields** -- `notifiedPreExpiry2Day`, `notifiedPreExpiry1Day`, `notifiedPostExpiry` instead of a single field, enabling the 2-day and 1-day reminder windows to be tracked independently
3. **Shared layout helper** -- `emailLayout()` and `ctaButton()` functions avoid duplication across 7 templates while keeping everything in pure template literals (no template engine)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- [x] `npx tsc --noEmit` passes
- [x] `npx prisma validate` passes
- [x] `npx prisma generate` succeeds
- [x] All 3 notification tracking fields present in schema
- [x] All 6 email env vars present in env.ts
- [x] Transport factory exports `getEmailTransport`
- [x] Service exports `sendEmail` + 7 template builders

## Next Phase Readiness

Plans 09-02, 09-03, and 09-04 can now import from `email.service.ts` and `email.ts` to:
- Wire fire-and-forget emails at trigger points (register, payment callback, referral grant)
- Build the subscription expiry cron job using the notification tracking fields
- Wire the password reset email into the existing forgotPassword flow
