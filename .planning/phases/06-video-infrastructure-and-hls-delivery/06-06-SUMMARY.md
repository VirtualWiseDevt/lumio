# Phase 6 Plan 6: Client HLS Stream Integration Summary

Wire client video player to use stream API endpoint for HLS adaptive bitrate playback from R2-hosted transcoded content.

**One-liner:** Player uses /api/stream/:contentId for transcoded HLS content with auth headers, falls back to direct URLs for non-transcoded.

## What Was Done

### Task 1: Wire player to stream endpoint
- Added `getStreamUrl(contentId, episodeId?)` helper to `client/src/api/content.ts` returning `/api/stream/:contentId[?episode=...]`
- Configured hls.js `xhrSetup` callback to add Bearer token on API playlist requests only (presigned R2 segment URLs excluded)
- Updated watch page video source resolution: prefers stream endpoint when `hlsKey` exists, falls back to direct `videoUrl`/`streamUrl`
- Added `transcodingStatus`, `hlsKey`, `sourceVideoKey` fields to `ContentDetail` and `Episode` client types

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Auth header only on /api/ URLs in xhrSetup | Presigned R2 segment URLs would reject extra Authorization headers |
| getStreamUrl uses relative /api/ path | Client axios baseURL is already /api, but hls.js fetches directly so relative path works with Next.js proxy |
| hlsKey check determines stream vs direct URL | Consistent with server-side model where hlsKey is set only after successful transcoding |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles clean (`npx tsc --noEmit` passes)
- `getStreamUrl("abc")` returns `/api/stream/abc`
- `getStreamUrl("abc", "ep1")` returns `/api/stream/abc?episode=ep1`
- `useHls` xhrSetup sends Bearer token on playlist fetches
- Watch page uses stream endpoint when hlsKey exists on content or episode
- Falls back to direct videoUrl/streamUrl for non-transcoded content

## Key Files

### Created
None

### Modified
- `client/src/api/content.ts` - Added getStreamUrl helper
- `client/src/hooks/use-hls.ts` - Added xhrSetup with auth header for API requests
- `client/src/app/watch/[id]/page.tsx` - HLS stream endpoint preference with fallback
- `client/src/types/content.ts` - Added transcoding fields to ContentDetail and Episode

## Commits
- `0bec76f`: feat(06-06): wire client player to HLS stream endpoint

## Duration
~1 min
