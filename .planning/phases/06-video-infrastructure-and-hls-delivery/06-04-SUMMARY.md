---
phase: 06-video-infrastructure
plan: 04
subsystem: streaming-delivery
tags: [hls, streaming, presigned-urls, bullmq, transcode]
depends_on: ["06-02", "06-03"]
provides: ["stream-endpoints", "publish-triggers-transcode", "worker-startup"]
affects: ["06-05", "06-06"]
tech-stack:
  patterns: ["playlist-proxy", "presigned-url-rewriting", "in-process-worker"]
key-files:
  created:
    - api/src/services/stream.service.ts
    - api/src/routes/stream.routes.ts
  modified:
    - api/src/services/content.service.ts
    - api/src/routes/index.ts
    - api/src/server.ts
metrics:
  duration: "~4 min"
  completed: "2026-03-07"
---

# Phase 6 Plan 4: Streaming Delivery and Publish-Triggers-Transcode Summary

**One-liner:** HLS playlist proxy with presigned R2 segment URLs, publish auto-enqueues transcoding, worker starts on server boot.

## What Was Done

### Task 1: Stream Service and Routes
- Created `stream.service.ts` with `getStreamPlaylist` and `getQualityPlaylist` functions
- Master playlist rewrites quality playlist paths to API URLs (`/api/stream/:contentId/:quality`)
- Quality playlists rewrite `.ts` segment filenames to presigned R2 URLs (4-hour TTL)
- Client never sees raw R2 keys -- only presigned download URLs
- Created `stream.routes.ts` with two endpoints:
  - `GET /api/stream/:contentId` -- master playlist (supports `?episode=episodeId`)
  - `GET /api/stream/:contentId/:quality` -- quality playlist with presigned segments
- Both endpoints: `Content-Type: application/vnd.apple.mpegurl`, `Cache-Control: public, max-age=60`
- Protected by `requireAuth` (regular users, not admin-only)
- Registered stream router at `/api/stream` in `index.ts`

### Task 2: Publish Triggers Transcode + Worker Startup
- Modified `publishContent` to enqueue transcode jobs when content has `sourceVideoKey` and is not already transcoded
- For series: queries all episodes across all seasons, enqueues each with `sourceVideoKey` that isn't completed
- Re-publish after re-upload triggers fresh transcoding (checks `transcodingStatus !== "completed"`)
- `unpublishContent` unchanged -- transcoded content stays transcoded even if unpublished
- Added `startTranscodeWorker()` call in `server.ts` after server starts listening
- Confirmed "Transcode worker started" in Docker logs with no Redis errors

## Commits

| Hash | Message |
|------|---------|
| 7a31f38 | feat(06-04): create stream service and routes for HLS playlist delivery |
| a234bc2 | feat(06-04): wire publish to trigger transcode and start worker on boot |

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Master playlist rewrites to API URLs (not presigned R2) | Quality playlists need per-request presigning; master just lists qualities |
| 404 with "Content not yet transcoded" when no hlsKey | Clear error for client before transcoding completes |
| Episode lookup by episodeId directly (not through content) | Simpler query; episode ID is globally unique |

## Next Phase Readiness

- Stream endpoints ready for client player integration (Plan 06-05/06-06)
- Transcode pipeline fully wired: upload -> publish -> transcode -> stream
- Worker runs in-process (no separate worker service needed)
