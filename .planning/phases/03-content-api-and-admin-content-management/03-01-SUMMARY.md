---
phase: 03-content-api-and-admin-content-management
plan: 01
subsystem: api-schema-admin-auth
tags: [prisma, migration, admin, auth, middleware, seed]
dependency-graph:
  requires: [01-03, 02-01, 02-02, 02-03]
  provides: [updated-content-schema, category-model, admin-auth-middleware, admin-login-endpoint, admin-seed]
  affects: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07, 03-08, 03-09]
tech-stack:
  added: []
  patterns: [requireAdmin-middleware-chain, dedicated-admin-login, prisma-seed-script]
key-files:
  created:
    - api/prisma/migrations/20260307014516_add_cast_director_category/migration.sql
    - api/src/services/admin.service.ts
    - api/src/validators/admin.validators.ts
    - api/src/routes/admin.routes.ts
    - api/prisma/seed.ts
  modified:
    - api/prisma/schema.prisma
    - api/src/middleware/auth.middleware.ts
    - api/src/routes/index.ts
    - api/package.json
decisions:
  - Category model uses simple id/name/slug (no join table to Content); Content.categories remains String[] populated from Category dropdown
  - Admin seed uses phone +254700000001 (existing seed user occupies +254700000000)
  - Admin login is a dedicated endpoint at /api/admin/login, separate from user login
  - requireAdmin middleware always used after requireAuth in middleware chain
  - No device limit check for admin sessions
metrics:
  duration: ~7 min
  completed: 2026-03-07
---

# Phase 3 Plan 1: Schema Migration + Admin Auth Foundation Summary

**One-liner:** Added cast/director fields and Category model to Prisma schema, created requireAdmin middleware and dedicated admin login endpoint with seed script.

## What Was Done

### Task 1: Schema Migration
- Added `cast String[]` and `director String?` fields to the Content model
- Created `Category` model with `id`, `name` (unique), `slug` (unique), `createdAt`, and index on name
- Generated migration SQL via `prisma migrate diff` and applied with `prisma migrate deploy`
- Regenerated Prisma client

### Task 2: Admin Auth + Seed
- Added `requireAdmin` middleware to `auth.middleware.ts` -- checks `req.user.role !== 'ADMIN'` and returns 403
- Created `admin.service.ts` with `adminLogin` function -- verifies credentials + admin role, creates session, returns JWT
- Created `admin.validators.ts` with `adminLoginSchema` (email + password)
- Created `admin.routes.ts` with `POST /login` endpoint
- Registered `/api/admin` route in `index.ts`
- Created `prisma/seed.ts` with upsert for admin account (admin@lumio.tv / AdminPass123!)
- Added prisma seed config to package.json

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Category model is standalone (no join table) | Content.categories stays as String[] for simplicity; Category model serves as source of valid names for admin dropdowns |
| Admin seed phone: +254700000001 | Existing seed user already uses +254700000000 |
| Dedicated /api/admin/login endpoint | Separates admin auth from user auth; rejects non-admin users with generic "Invalid credentials" to prevent enumeration |
| No device limit for admin | Admin sessions don't need the 2-device restriction that regular users have |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Admin seed phone conflict**
- **Found during:** Task 2 verification
- **Issue:** Existing seed user already had phone +254700000000; upsert on email didn't cover phone uniqueness constraint
- **Fix:** Changed admin seed phone to +254700000001
- **Files modified:** api/prisma/seed.ts
- **Commit:** 245a17c

## Verification Results

- `npx prisma validate` -- passes
- `npx prisma migrate status` -- all 3 migrations applied, schema up to date
- `npx tsc --noEmit` -- compiles clean
- `npx prisma db seed` -- creates admin account, idempotent on re-run

## Commits

| Hash | Message |
|------|---------|
| 764174a | feat(03-01): add cast, director fields and Category model to schema |
| 245a17c | feat(03-01): add admin auth middleware, login endpoint, and seed script |

## Next Phase Readiness

All subsequent Phase 3 plans can now use:
- `requireAuth, requireAdmin` middleware chain for protected admin routes
- Updated Prisma schema with cast, director, and Category model
- Admin login at POST /api/admin/login for obtaining admin JWT tokens
- Seeded admin account for development/testing
