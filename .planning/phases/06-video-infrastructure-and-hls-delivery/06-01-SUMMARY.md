---
phase: 06-video-infrastructure
plan: 01
subsystem: video-infrastructure
tags: [redis, ffmpeg, r2, docker, prisma, bullmq]
dependency_graph:
  requires: [01-01, 01-02, 01-03]
  provides: [redis-service, ffmpeg-binary, r2-client, redis-client, transcode-types, transcoding-schema-fields]
  affects: [06-02, 06-03, 06-04, 06-05, 06-06, 06-07]
tech_stack:
  added: [bullmq@5.70.4, ioredis@5.10.0, "@aws-sdk/client-s3@3.1004.0", "@aws-sdk/s3-request-presigner@3.1004.0"]
  patterns: [S3Client-for-R2, IORedis-with-BullMQ-null-retries, docker-service-healthcheck]
key_files:
  created: [api/src/config/r2.ts, api/src/config/redis.ts, api/src/types/transcode.types.ts, api/prisma/migrations/20260307121500_add_transcoding_fields/migration.sql]
  modified: [docker-compose.yml, api/Dockerfile.dev, api/package.json, api/src/config/env.ts, api/prisma/schema.prisma, package-lock.json]
decisions:
  - id: 06-01-01
    description: "IORedis imported as named export { Redis } for ESM/verbatimModuleSyntax compatibility"
  - id: 06-01-02
    description: "R2 env vars use 'placeholder' values in docker-compose (min(1) validation requires non-empty)"
  - id: 06-01-03
    description: "Transcoding status stored as String? (not Prisma enum) to avoid migration complexity"
  - id: 06-01-04
    description: "FFmpeg 8.0.1 available in Alpine (exceeds 6.x+ requirement)"
metrics:
  duration: "~9 min"
  completed: 2026-03-07
---

# Phase 6 Plan 1: Video Infrastructure Setup Summary

**One-liner:** Redis 7 + FFmpeg 8 Docker services, R2/Redis SDK clients, Prisma transcoding fields, and BullMQ-compatible type definitions.

## What Was Done

### Task 1: Docker infrastructure and npm dependencies (55c9ce9)
- Added Redis 7-alpine service to docker-compose.yml with healthcheck (redis-cli ping)
- Added FFmpeg installation to API Dockerfile.dev (apk add --no-cache ffmpeg)
- Installed bullmq, ioredis, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner in api workspace
- Added R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, REDIS_HOST, REDIS_PORT to env.ts Zod schema
- Added JWT_SECRET and all new env vars to docker-compose.yml api environment
- Rebuilt and verified: all 3 containers healthy, FFmpeg 8.0.1 + ffprobe available

### Task 2: R2 client, Redis client, schema migration, and type definitions (7d28b7e)
- Created api/src/config/r2.ts: S3Client configured for Cloudflare R2 endpoint format
- Created api/src/config/redis.ts: IORedis with maxRetriesPerRequest: null (BullMQ requirement)
- Added 4 transcoding fields to Content model: transcodingStatus, transcodingError, sourceVideoKey, hlsKey
- Added same 4 fields to Episode model
- Created migration SQL and applied via prisma migrate deploy
- Created api/src/types/transcode.types.ts with TranscodingStatus, QualityPreset, TranscodeJobData, TranscodeResult types and QUALITY_PRESETS array

## Decisions Made

1. **IORedis named import** (06-01-01): Used `import { Redis as IORedis }` instead of default import for ESM/verbatimModuleSyntax compatibility.
2. **R2 placeholder values** (06-01-02): docker-compose uses "placeholder" strings for R2 env vars since Zod .min(1) rejects empty strings. Real values set when R2 is configured.
3. **String fields for status** (06-01-03): transcodingStatus is String? (not Prisma enum) to avoid migration complexity and allow flexible status values.
4. **FFmpeg version** (06-01-04): Alpine provides FFmpeg 8.0.1 which exceeds the 6.x+ requirement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] IORedis default import fails with verbatimModuleSyntax**
- **Found during:** Task 2
- **Issue:** `import IORedis from "ioredis"` produces TS2351 error (no construct signatures) under verbatimModuleSyntax
- **Fix:** Changed to `import { Redis as IORedis } from "ioredis"` which works with ESM named exports
- **Files modified:** api/src/config/redis.ts
- **Commit:** 7d28b7e

## Verification Results

- docker compose ps: postgres (healthy), redis (healthy), api (running) -- all 3 containers up
- FFmpeg 8.0.1 and ffprobe available inside API container
- Redis ping: PONG from API container
- Prisma migrate status: Database schema is up to date (6 migrations applied)
- TypeScript compiles clean (npx tsc --noEmit)
- API server running on port 5000 with no errors

## Next Phase Readiness

All infrastructure is in place for subsequent plans:
- Plan 02 (Upload endpoints): R2 client ready for presigned URLs
- Plan 03 (Transcode worker): BullMQ + Redis + FFmpeg + type definitions ready
- Plan 04-07: Schema fields ready for transcoding status tracking
