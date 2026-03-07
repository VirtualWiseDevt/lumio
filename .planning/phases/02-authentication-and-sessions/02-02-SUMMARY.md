---
phase: 02-authentication-and-sessions
plan: 02
subsystem: auth
tags: [jwt, jose, argon2, session, middleware, ua-parser-js, prisma]

# Dependency graph
requires:
  - phase: 02-01
    provides: Schema migration with auth fields, jose/argon2/ua-parser-js deps, JWT_SECRET env validation, Zod validators, phone normalizer
provides:
  - Token service (JWT sign/verify with HS256, reset token generation with SHA-256)
  - Session service (CRUD, 2-device enforcement, ua-parser-js detection, stale cleanup)
  - Auth service (register, login, logout, changePassword, forgotPassword, resetPassword)
  - Auth middleware (requireAuth with JWT + DB session verification)
  - AuthError class for structured error handling
affects: [02-03-auth-routes, admin-api, content-api, payments]

# Tech tracking
tech-stack:
  added: []
  patterns: [service-layer, interactive-transactions, fire-and-forget-updates, auth-error-class]

key-files:
  created:
    - api/src/services/token.service.ts
    - api/src/services/session.service.ts
    - api/src/services/auth.service.ts
    - api/src/middleware/auth.middleware.ts
  modified: []

key-decisions:
  - "Register uses interactive Prisma transaction ($transaction) for atomic user+referral+session creation"
  - "Session created directly inside transaction (not via createSession) to maintain transactional atomicity"
  - "Login returns discriminated union: deviceLimitReached true/false for type-safe route handling"
  - "Auth middleware fire-and-forget lastActiveAt update with .catch(() => {}) to avoid latency"
  - "Account lockout uses 423 (Locked) status code for locked accounts"

patterns-established:
  - "Service layer pattern: business logic in services, routes are thin wrappers"
  - "AuthError class: structured errors with code, message, statusCode for consistent API responses"
  - "Fire-and-forget DB updates: non-critical writes use .catch(() => {}) to avoid blocking"
  - "Enumeration prevention: login/register/forgotPassword return generic messages"

# Metrics
duration: 2min
completed: 2026-03-07
---

# Phase 2 Plan 2: Auth Services and Middleware Summary

**Complete auth service layer with JWT tokens via jose, argon2 password hashing, 2-device session enforcement, account lockout, and requireAuth middleware**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T00:42:21Z
- **Completed:** 2026-03-07T00:44:29Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Token service with HS256 JWT sign/verify and SHA-256 reset token hashing
- Session service with ua-parser-js device detection, 2-device limit, and stale cleanup
- Full auth service: register (atomic with referral), login (lockout + device limit), logout, change/forgot/reset password
- Auth middleware: Bearer token extraction, JWT + DB session verification, fire-and-forget lastActiveAt

## Task Commits

Each task was committed atomically:

1. **Task 1: Token service and session service** - `9bf8bdb` (feat)
2. **Task 2: Auth service and auth middleware** - `136376a` (feat)

## Files Created/Modified
- `api/src/services/token.service.ts` - JWT sign/verify with jose, reset token generation/hashing
- `api/src/services/session.service.ts` - Session CRUD, 2-device enforcement, ua-parser-js detection, cleanup
- `api/src/services/auth.service.ts` - Register, login, logout, changePassword, forgotPassword, resetPassword, AuthError class
- `api/src/middleware/auth.middleware.ts` - requireAuth middleware with JWT + DB session check

## Decisions Made
- Register uses interactive Prisma `$transaction` for atomic user+referral+session creation (session created directly inside tx, not via createSession helper)
- Login returns discriminated union with `deviceLimitReached` as `true as const` / `false as const` for type-safe route handling
- Account lockout uses HTTP 423 (Locked) status code
- Auth middleware uses fire-and-forget `.catch(() => {})` for lastActiveAt updates to avoid request latency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added UAParser device detection to register transaction**
- **Found during:** Task 2 (auth.service register function)
- **Issue:** Register creates session inside transaction directly (not via createSession), initially used hardcoded "Unknown on Unknown" device info
- **Fix:** Added UAParser import and device parsing inside the transaction to properly detect browser/OS/device
- **Files modified:** api/src/services/auth.service.ts
- **Verification:** TypeScript compiles, device info properly parsed
- **Committed in:** 136376a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for correct device info on registration sessions. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All auth services ready for route wiring in Plan 02-03
- AuthError class ready for route error handling
- requireAuth middleware ready to protect endpoints
- No blockers for Plan 02-03

---
*Phase: 02-authentication-and-sessions*
*Completed: 2026-03-07*
