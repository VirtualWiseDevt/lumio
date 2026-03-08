---
phase: 09-notifications-and-scheduled-jobs
plan: 03
subsystem: notifications
tags: [cron, email, subscription-lifecycle, idempotent]
depends_on:
  requires: ["09-01"]
  provides: ["subscription-expiry-notifications"]
  affects: ["09-04"]
tech-stack:
  added: []
  patterns: ["idempotent-notification-tracking", "fire-and-forget-email"]
key-files:
  created:
    - api/src/jobs/subscriptionExpiry.job.ts
  modified:
    - api/src/server.ts
decisions:
  - id: "09-03-01"
    decision: "Cron runs at minute :30 to offset from session cleanup (:00) and reconciliation (*/2)"
  - id: "09-03-02"
    decision: "Notification flag set before email delivery confirmed (prevents retry storms on SMTP failure)"
  - id: "09-03-03"
    decision: "Post-expiry skips renewed users by checking for other active subscriptions"
metrics:
  duration: "~3 min"
  completed: "2026-03-08"
---

# Phase 9 Plan 03: Subscription Expiry Notifications Summary

Hourly cron job sending 2-day and 1-day pre-expiry warnings plus post-expiry renewal prompts, with idempotent tracking fields preventing duplicate sends.

## What Was Built

### Task 1: Subscription expiry cron job
- Created `api/src/jobs/subscriptionExpiry.job.ts` with three notification windows:
  - **2-day pre-expiry**: Active subscriptions expiring within 2 days, tracked by `notifiedPreExpiry2Day`
  - **1-day pre-expiry**: Active subscriptions expiring within 1 day, tracked by `notifiedPreExpiry1Day`
  - **Post-expiry**: Subscriptions expired within last 2 days, tracked by `notifiedPostExpiry`
- Renewed users skipped via `prisma.subscription.findFirst` check for other active subs
- Sequential processing (for-of loop) to avoid SMTP hammering
- Fire-and-forget email sends with `.catch()` error logging
- Quiet runs produce no log output (matches session cleanup pattern)

### Task 2: Server startup wiring
- Added import and call to `startSubscriptionExpiryJob()` in server.ts listen callback
- Now 4 background tasks start on boot: session cleanup, transcode worker, reconciliation, subscription expiry

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 700745a | feat(09-03): add subscription expiry cron job |
| 2 | ace2ac0 | feat(09-03): wire subscription expiry job to server startup |

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Cron offset at :30** -- Avoids collision with session cleanup at :00 and reconciliation at */2
2. **Mark-before-confirm pattern** -- notifiedPreExpiry2Day is set even if email send fails, preventing retry storms. Acceptable because emails are transactional notifications, not critical operations.
3. **Renewal check for post-expiry** -- Queries for any other ACTIVE subscription with future expiresAt before sending post-expiry email

## Next Phase Readiness

- No blockers for 09-04 (scheduled job monitoring/admin)
- All notification tracking fields functional and tested via TypeScript compilation
