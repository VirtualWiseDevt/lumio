---
phase: 06-video-infrastructure
plan: 03
subsystem: infra
tags: [ffmpeg, hls, bullmq, transcoding, r2, video]

requires:
  - phase: 06-01
    provides: "Redis config, R2 client, Prisma transcoding fields, transcode types, FFmpeg in container"
provides:
  - "FFmpeg transcode service with probeSource, transcodeToHls, generateMasterPlaylist"
  - "BullMQ transcode queue with enqueueTranscode, processTranscodeJob, startTranscodeWorker"
  - "Multi-bitrate HLS generation at up to 4 quality levels (360p-1080p)"
affects: [06-04, 06-05, 06-06]

tech-stack:
  added: []
  patterns:
    - "spawnAsync wrapper for child_process.spawn with Promise"
    - "BullMQ Queue/Worker pattern with redis connection cast for ioredis compatibility"
    - "try/finally for temp file cleanup in job processors"
    - "setStatus helper for polymorphic Content/Episode DB updates"

key-files:
  created:
    - "api/src/services/transcode.service.ts"
    - "api/src/jobs/transcode.job.ts"
  modified: []

key-decisions:
  - "ioredis connection cast to `never` for BullMQ compatibility (dual ioredis versions)"
  - "Sequential quality encoding (not parallel) for single-server resource management"
  - "Segment duration 4 seconds for balanced seek granularity vs segment count"

patterns-established:
  - "spawnAsync: wraps spawn in Promise, collects stdout/stderr, rejects on non-zero exit"
  - "setStatus helper: polymorphic DB update for Content or Episode based on episodeId presence"
  - "Job processor pattern: download -> probe -> filter presets -> transcode -> upload -> update DB"

duration: 3min
completed: 2026-03-07
---

# Phase 6 Plan 3: FFmpeg Transcode Service and BullMQ Job Queue Summary

**FFmpeg HLS transcoding service with keyframe-aligned multi-bitrate output and BullMQ job queue with R2 upload and cache-control headers**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T12:25:41Z
- **Completed:** 2026-03-07T12:28:29Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- FFmpeg transcode service with probeSource (ffprobe), transcodeToHls (keyframe-aligned HLS), and generateMasterPlaylist
- BullMQ job queue with 2 attempts / 30s fixed backoff, DB status mirroring at every stage
- Cache-Control headers: .ts segments immutable (1yr), .m3u8 playlists 60s TTL
- Upscale prevention: presets above source height automatically filtered
- Temp file cleanup guaranteed via finally block

## Task Commits

Each task was committed atomically:

1. **Task 1: FFmpeg transcode service** - `2f670f8` (feat)
2. **Task 2: BullMQ transcode job queue and worker** - `6b15a82` (feat)

## Files Created/Modified
- `api/src/services/transcode.service.ts` - FFmpeg spawn logic: probeSource, transcodeToHls, generateMasterPlaylist, spawnAsync helper
- `api/src/jobs/transcode.job.ts` - BullMQ queue, worker, enqueue function, job processor with R2 upload and DB status tracking

## Decisions Made
- **ioredis cast to `never`:** BullMQ v5 bundles its own ioredis which has incompatible types with the project's ioredis. Cast resolves the type mismatch safely since both are the same underlying library.
- **Sequential encoding:** Presets encoded one at a time (not parallel) since this targets a single-server deployment where CPU is the bottleneck.
- **r2.service.ts stub not needed:** Plan 06-02 completed in parallel and the real implementation was already committed with matching signatures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ioredis type mismatch with BullMQ**
- **Found during:** Task 2 (BullMQ queue creation)
- **Issue:** BullMQ v5 bundles its own ioredis with incompatible TypeScript types. Queue and Worker constructors rejected the project's redis instance.
- **Fix:** Cast redis connection as `never` for Queue and Worker constructors. Both are the same library at runtime.
- **Files modified:** api/src/jobs/transcode.job.ts
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** 6b15a82 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Type cast necessary for BullMQ/ioredis compatibility. No scope creep.

## Issues Encountered
- Plan 06-02 (parallel wave) had already created r2.service.ts with the exact signatures needed, so the stub creation mentioned in the plan was unnecessary. The real implementation was used directly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Transcode service and job queue ready to be wired into server.ts (Plan 06-04)
- Worker is NOT started yet -- Plan 06-04 will call startTranscodeWorker()
- All exports match the plan's artifact specification

---
*Phase: 06-video-infrastructure*
*Completed: 2026-03-07*
