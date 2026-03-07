---
phase: 05-video-player-and-user-features
plan: 01
subsystem: api-progress
tags: [progress, continue-watching, prisma, zod, express]
completed: 2026-03-07
duration: ~9 min
dependency-graph:
  requires: [04-01]
  provides: [progress-api, continue-watching-api, user-newsletter-field]
  affects: [05-03, 05-04, 05-05]
tech-stack:
  added: []
  patterns: [hybrid-threshold-filtering, upsert-with-compound-unique]
key-files:
  created:
    - api/src/services/progress.service.ts
    - api/src/validators/progress.validators.ts
    - api/src/routes/progress.routes.ts
  modified:
    - api/src/routes/index.ts
decisions:
  - "Prisma compound unique with nullable episodeId requires type assertion (null works at runtime)"
  - "Continue-watching route registered BEFORE /:contentId to prevent Express param matching"
  - "Hybrid threshold: max(120s, 5% duration), exclude completed (90%+), exclude <2min content"
metrics:
  tasks: 2/2
  commits: 2
---

# Phase 5 Plan 1: Progress API and Continue Watching Backend

Backend foundation for video playback progress saving and Continue Watching feature with hybrid threshold logic.

## Task Execution

### Task 1: Schema migration and progress service
**Commit:** `f1f1bcc` feat(05-01): add User.newsletter field and progress service

- Created progress service with saveProgress (upsert), getProgress (findUnique), getContinueWatching (filtered query)
- Implemented hybrid Continue Watching threshold: only include items where timestamp >= max(120, duration * 0.05), duration >= 120s, not completed
- Created Zod validators: saveProgressSchema and continueWatchingQuerySchema (months: 3/6/12)
- Note: User.newsletter field and migration were already committed in 05-02 (which ran before this plan)

### Task 2: Progress and continue-watching routes with registration
**Commit:** `e4eb88d` feat(05-01): add progress and continue-watching routes

- Created progress routes with requireAuth on all endpoints
- POST / saves progress (handles sendBeacon with JSON body)
- GET /continue-watching returns filtered list with content metadata and episode info
- GET /:contentId returns progress for specific content (optional ?episodeId query)
- Registered progressRouter in index.ts at /api/progress (after /api/browse, before /api/admin)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma compound unique nullable field type mismatch**
- **Found during:** Task 1
- **Issue:** Prisma generates `episodeId: string` in compound unique input type even though schema field is `String?`. Passing null causes TS error.
- **Fix:** Used type assertion `(episodeId ?? null) as string` since Prisma handles null correctly at runtime.
- **Files modified:** api/src/services/progress.service.ts

**2. [Rule 3 - Blocking] Docker Desktop not running**
- **Found during:** Task 1 (migration step)
- **Issue:** Docker Desktop was not running, preventing database connection for migration.
- **Fix:** Started Docker Desktop and waited for readiness before running prisma migrate deploy.

**3. [Rule 3 - Blocking] Prisma generate DLL lock**
- **Found during:** Task 1
- **Issue:** `prisma generate` failed with EPERM on query_engine-windows.dll.node rename.
- **Fix:** Deleted the locked DLL file and re-ran prisma generate successfully.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Type assertion for nullable compound unique key | Prisma 6 generates non-nullable types for compound unique inputs even when field is optional; null works at runtime |
| continue-watching route before /:contentId | Express matches routes top-down; "continue-watching" would match :contentId param otherwise |
| Episode metadata resolved in-memory | Join seasons+episodes in query, then filter in JS to resolve episode info for series progress |

## Verification

- [x] `npx prisma validate` passes
- [x] `npx tsc --noEmit` passes with no errors
- [x] Routes registered in index.ts: /api/progress
- [x] Progress service exports: saveProgress, getProgress, getContinueWatching
- [x] Schema has User.newsletter field (committed in 05-02)
- [x] All routes behind requireAuth

## Next Phase Readiness

No blockers. The progress API is ready for:
- Plan 05-03: Video player integration (client will call POST /api/progress)
- Plan 05-04/05: Continue Watching UI components (will consume GET /api/progress/continue-watching)
