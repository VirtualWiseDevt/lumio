---
phase: 06-video-infrastructure
plan: 02
subsystem: api
tags: [r2, s3, presigned-urls, ffprobe, video-upload, cloudflare-r2]

# Dependency graph
requires:
  - phase: 06-01
    provides: R2 S3Client config, Redis, FFmpeg in container, Prisma transcoding fields
provides:
  - R2 storage service with 8 CRUD operations (presign, upload, delete, list, head, stream)
  - Video upload presign endpoint for direct browser-to-R2 upload
  - Video upload confirm endpoint with ffprobe validation
affects: [06-03-transcoding, 06-04-streaming, 06-05-admin-upload-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [presigned-url-upload, ffprobe-server-validation, stream-to-file-pipeline]

key-files:
  created:
    - api/src/services/r2.service.ts
    - api/src/routes/video-upload.routes.ts
  modified:
    - api/src/routes/index.ts

key-decisions:
  - "R2 service accepts Buffer | Readable for uploadToR2 (supports both transcoded buffers and streams)"
  - "headR2Object catches NotFound and NoSuchKey errors, returns null (S3-compatible error names)"
  - "ffprobe allowed codecs: h264, hevc, vp9, mpeg4, prores, dnxhd, vp8, av1"
  - "Presign endpoint generates key pattern: videos/{contentId}[/episodes/{episodeId}]/raw/source.{ext}"

patterns-established:
  - "Presigned URL pattern: browser uploads directly to R2, server confirms and validates"
  - "ffprobe validation: download from R2 to temp file, run ffprobe, clean up in finally block"

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 6 Plan 02: R2 Storage Service and Video Upload Endpoints Summary

**R2 storage service with presigned upload URLs and ffprobe-based video validation for admin video uploads**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T12:25:33Z
- **Completed:** 2026-03-07T12:28:17Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- R2 storage service with all 8 CRUD operations needed by upload, transcode, and stream features
- Presign endpoint generates presigned PUT URLs for direct browser-to-R2 video upload (up to 5GB)
- Confirm endpoint downloads file from R2, runs ffprobe validation, rejects invalid files, stores sourceVideoKey

## Task Commits

Each task was committed atomically:

1. **Task 1: R2 storage service** - `18e8a5f` (feat)
2. **Task 2: Video upload presign and confirm endpoints** - `055c45f` (feat)

## Files Created/Modified
- `api/src/services/r2.service.ts` - R2 operations: presign upload/download, upload buffer, delete, delete prefix, list, head, stream to file
- `api/src/routes/video-upload.routes.ts` - POST /presign (generate upload URL), POST /confirm (ffprobe validate + store key)
- `api/src/routes/index.ts` - Register videoUploadRouter at /api/admin/video-upload

## Decisions Made
- R2 service accepts `Buffer | Readable` for uploadToR2 to support both transcoded buffers and stream uploads
- headR2Object catches both "NotFound" and "NoSuchKey" error names for S3 compatibility
- ffprobe allowed codecs list covers common professional and web formats
- Presign key pattern: `videos/{contentId}[/episodes/{episodeId}]/raw/source.{ext}` for organized R2 storage
- Confirm endpoint always cleans up temp files in finally block regardless of validation outcome

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in transcode.job.ts (ioredis/bullmq type mismatch from 06-01) -- not related to this plan's files
- Linter attempted to replace r2.service.ts with a stub during editing -- restored full implementation

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- R2 service ready for transcode worker (Plan 03) to use uploadToR2 and streamR2ToFile
- R2 service ready for streaming (Plan 04) to use generatePresignedDownloadUrl
- Video upload endpoints ready for admin UI integration (Plan 05)

---
*Phase: 06-video-infrastructure*
*Completed: 2026-03-07*
