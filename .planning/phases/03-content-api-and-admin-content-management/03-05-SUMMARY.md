---
phase: 03-content-api-and-admin-content-management
plan: 05
subsystem: api
tags: [seasons, episodes, crud, nested-routes, admin]
completed: 2026-03-07
duration: ~4 min
dependency-graph:
  requires: [03-03]
  provides: [season-episode-crud-api]
  affects: [03-06, 03-07]
tech-stack:
  added: []
  patterns: [ServiceError class, mergeParams nested routing, getParam helper for Express 5 typed params]
key-files:
  created:
    - api/src/validators/season.validators.ts
    - api/src/services/season.service.ts
    - api/src/routes/season.routes.ts
  modified:
    - api/src/routes/index.ts
decisions:
  - ServiceError class used instead of raw Error with status property (cleaner TypeScript typing)
  - getParam helper function to safely access merged params from parent Express 5 routes
  - isPrismaError helper to avoid repeated casting patterns
---

# Phase 03 Plan 05: Season and Episode CRUD API Summary

**One-liner:** Nested Season/Episode CRUD at /api/admin/content/:contentId/seasons with series-only validation, unique constraints, and cascading deletes.

## What Was Built

### Season CRUD (4 endpoints)
- `GET /api/admin/content/:contentId/seasons` -- list seasons ordered by number, includes episode count
- `POST /api/admin/content/:contentId/seasons` -- create season (validates content is SERIES type)
- `PUT /api/admin/content/:contentId/seasons/:seasonId` -- update season number/title
- `DELETE /api/admin/content/:contentId/seasons/:seasonId` -- delete season (cascades to episodes)

### Episode CRUD (4 endpoints)
- `GET /api/admin/content/:contentId/seasons/:seasonId/episodes` -- list episodes ordered by number
- `POST /api/admin/content/:contentId/seasons/:seasonId/episodes` -- create episode with validation
- `PUT /api/admin/content/:contentId/seasons/:seasonId/episodes/:episodeId` -- update episode
- `DELETE /api/admin/content/:contentId/seasons/:seasonId/episodes/:episodeId` -- delete episode

### Validation
- Season: number (positive int, required), title (optional, max 255)
- Episode: number (positive int), title (required, 1-255), description, duration, videoUrl, thumbnail (all optional)
- Duplicate season numbers per series return 409
- Duplicate episode numbers per season return 409
- Creating season on non-SERIES content returns 400

### Architecture
- ServiceError class for typed HTTP errors (avoids unsafe Error casting)
- isPrismaError helper for clean Prisma error code checking
- getParam helper for Express 5 mergeParams typed access
- All routes admin-protected via requireAuth + requireAdmin

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript compilation errors with Error casting**
- **Found during:** Task 1 verification
- **Issue:** `(error as Record<string, unknown>).status` fails TS strict mode -- Error type doesn't overlap with Record<string, unknown>
- **Fix:** Created ServiceError class extending Error with typed status property, and isPrismaError helper using `unknown` intermediate cast
- **Files modified:** api/src/services/season.service.ts

**2. [Rule 1 - Bug] Express 5 params typing for merged params**
- **Found during:** Task 1 verification
- **Issue:** `req.params.contentId` errors because Express 5 types params as `{}` by default; mergeParams params not reflected in types
- **Fix:** Created getParam helper that casts req to `{ params: Record<string, string> }` for safe access
- **Files modified:** api/src/routes/season.routes.ts

## Commits

| Hash | Message |
|------|---------|
| 9b9d7ff | feat(03-05): create Season and Episode CRUD API with nested routing |

## Next Phase Readiness

Ready for admin panel series management UI (03-06/03-07). The API provides all CRUD operations needed for the Series -> Seasons -> Episodes hierarchy.

**Exports available:**
- `seasonRouter` from routes/season.routes.ts
- `listSeasons`, `createSeason`, `updateSeason`, `deleteSeason` from services/season.service.ts
- `listEpisodes`, `createEpisode`, `updateEpisode`, `deleteEpisode` from services/season.service.ts
- `ServiceError` class for typed error handling pattern
