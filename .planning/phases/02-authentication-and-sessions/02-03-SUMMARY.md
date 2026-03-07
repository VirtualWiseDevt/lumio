---
phase: 02-authentication-and-sessions
plan: 03
subsystem: auth
tags: [routes, express, cron, node-cron, session-cleanup, api-endpoints]

# Dependency graph
requires:
  - phase: 02-01
    provides: Zod validators, phone normalizer, Prisma schema with auth models
  - phase: 02-02
    provides: Auth service (register/login/logout/changePassword/forgotPassword/resetPassword), session service (CRUD/cleanup), auth middleware (requireAuth), token service (signToken), AuthError class
provides:
  - Auth routes (7 endpoints at /api/auth)
  - Session routes (2 endpoints at /api/sessions)
  - Session cleanup cron job (hourly)
  - Full route registration in Express app
affects: [admin-api, content-api, payments, client-auth-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route-level try/catch with AuthError for structured HTTP error responses"
    - "Zod validate helper function for request body validation in routes"
    - "node-cron hourly job for stale session cleanup"
    - "Force login endpoint for device limit escape hatch"

# File tracking
key-files:
  created:
    - api/src/routes/auth.routes.ts
    - api/src/routes/session.routes.ts
    - api/src/jobs/sessionCleanup.job.ts
  modified:
    - api/src/routes/index.ts
    - api/src/server.ts

# Decisions
decisions:
  - id: "02-03-01"
    decision: "Inline try/catch in each route handler rather than centralized error middleware for AuthError"
    reason: "Prevents double-sending responses and gives precise control over status codes per endpoint"
  - id: "02-03-02"
    decision: "Force login endpoint (/login/force) verifies credentials independently rather than reusing login service"
    reason: "Needs to delete a session before creating a new one, which differs from normal login flow"
  - id: "02-03-03"
    decision: "Session cleanup job only logs when sessions are actually removed"
    reason: "Avoids noisy hourly log lines when nothing needs cleaning"

# Metrics
metrics:
  duration: "5 min"
  completed: "2026-03-07"
---

# Phase 02 Plan 03: Auth Routes, Session Routes, and Cleanup Job Summary

**JWT-authenticated REST API with 9 endpoints, 2-device enforcement, force-login escape hatch, and hourly session cleanup cron job**

## What Was Done

### Task 1: Auth Routes and Session Routes
Created `auth.routes.ts` with 7 endpoints and `session.routes.ts` with 2 endpoints.

**Auth endpoints (public):**
- `POST /api/auth/register` -- Validates with registerSchema, creates user with referral, returns 201 + JWT
- `POST /api/auth/login` -- Validates credentials, enforces 2-device limit, returns 200 + JWT or 409 with device list
- `POST /api/auth/login/force` -- Removes specified session then creates new login (device limit escape hatch)
- `POST /api/auth/forgot-password` -- Always returns 200 (enumeration-safe)
- `POST /api/auth/reset-password` -- Validates token, resets password, clears all sessions

**Auth endpoints (protected with requireAuth):**
- `POST /api/auth/logout` -- Destroys current session
- `POST /api/auth/change-password` -- Verifies current password, updates hash, kills other sessions

**Session endpoints (all protected with requireAuth):**
- `GET /api/sessions` -- Returns active sessions with `isCurrent` flag, `deviceName`, `lastActiveAt`, `createdAt`
- `DELETE /api/sessions/:id` -- Terminates another session (returns 400 if attempting to delete current session)

All handlers use try/catch with AuthError for structured `{ error: { message, code } }` responses. A reusable `validate<T>()` helper wraps Zod safeParse with 422 errors.

### Task 2: Route Registration, Cleanup Job, and Integration
- Updated `routes/index.ts` to register authRouter at `/api/auth` and sessionRouter at `/api/sessions`
- Created `jobs/sessionCleanup.job.ts` with hourly cron (`0 * * * *`) calling `cleanupStaleSessions()`
- Updated `server.ts` to call `startSessionCleanupJob()` on boot

**End-to-end integration verified:**
- Register with valid referral code returns 201 + JWT
- Login returns 200 + JWT
- Third login attempt returns 409 with device list (2-device limit)
- Session list returns sessions with `isCurrent` flag
- DELETE current session returns 400 with helpful message
- DELETE other session returns 200
- Logout destroys session, subsequent requests return 401
- Duplicate registration returns 409
- Wrong password returns 401
- Unauthenticated requests return 401
- Server starts cleanly with "[SESSION_CLEANUP] Scheduled hourly stale session cleanup"

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| edb504a | feat(02-03): add auth and session route handlers |
| 0620536 | feat(02-03): register routes, add session cleanup job, wire server |

## Next Phase Readiness

Phase 2 (Authentication and Sessions) is now **complete**. All 3 plans executed:
- 02-01: Schema, validators, dependencies
- 02-02: Services and middleware
- 02-03: Routes, registration, cleanup job

The auth system is fully functional and testable via curl/Postman. Ready for Phase 3 (User Profiles and Referrals) which will build on the authenticated user context established here.
