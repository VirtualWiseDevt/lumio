---
phase: 05-video-player-and-user-features
plan: 07
subsystem: ui
tags: [progress-tracking, sendbeacon, next-episode, continue-watching, tanstack-query]

# Dependency graph
requires:
  - phase: 05-04
    provides: VideoPlayer component, useHls and useVideoPlayer hooks
  - phase: 05-01
    provides: Progress API endpoints and continue-watching route
provides:
  - useProgressTracking hook (10s interval + pause + sendBeacon)
  - NextEpisodeOverlay with 10s countdown auto-advance
  - ContinueWatchingRow with progress bars and time filter
  - Watch page next-episode resolution and progress resume
affects: [home-page-integration, series-playback-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "sendBeacon with Blob for reliable unload progress saves"
    - "Ref flag guard to prevent duplicate completion triggers"
    - "resolveNextEpisode traverses seasons/episodes for auto-advance"

key-files:
  created:
    - client/src/hooks/use-progress-tracking.ts
    - client/src/components/player/NextEpisodeOverlay.tsx
    - client/src/components/content/ContinueWatchingRow.tsx
  modified:
    - client/src/components/player/VideoPlayer.tsx
    - client/src/app/watch/[id]/page.tsx

key-decisions:
  - "sendBeacon uses Blob with application/json type (Express ignores text/plain)"
  - "90% completion triggers next-episode overlay (matches server threshold)"
  - "loadedmetadata event for reliable initial time seek instead of setTimeout"
  - "isAdvancing ref prevents race conditions in next-episode auto-advance"

patterns-established:
  - "useProgressTracking: interval + event-based hybrid for reliable progress saves"
  - "resolveNextEpisode: stateless utility for episode traversal across seasons"

# Metrics
duration: 2min
completed: 2026-03-07
---

# Phase 5 Plan 7: Progress Tracking, Next Episode, Continue Watching Summary

**Progress tracking with 10s saves + sendBeacon on unload, 10s countdown auto-advance overlay, and Continue Watching row with red progress bars and time filters**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T10:20:35Z
- **Completed:** 2026-03-07T10:22:54Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Progress saves every 10s via API, on pause, and on page unload via sendBeacon with proper Content-Type
- NextEpisodeOverlay with 10s countdown, thumbnail, episode label, play now / cancel buttons
- ContinueWatchingRow with TanStack Query, 3/6/12 month filter buttons, red progress bars
- Watch page resolves next episode across seasons and passes to player for auto-advance
- Improved initial time seek using loadedmetadata event for reliability

## Task Commits

Each task was committed atomically:

1. **Task 1: Progress tracking hook and NextEpisodeOverlay** - `0fd02a7` (feat)
2. **Task 2: Continue Watching row and player integration** - `79611d3` (feat)

## Files Created/Modified
- `client/src/hooks/use-progress-tracking.ts` - Hook for 10s interval saves + sendBeacon on unload
- `client/src/components/player/NextEpisodeOverlay.tsx` - 10s countdown with thumbnail and cancel
- `client/src/components/content/ContinueWatchingRow.tsx` - Continue Watching row with progress bars
- `client/src/components/player/VideoPlayer.tsx` - Integrated progress tracking and next episode overlay
- `client/src/app/watch/[id]/page.tsx` - Next episode resolution and improved progress resume

## Decisions Made
- sendBeacon uses `new Blob([json], { type: "application/json" })` because Express won't parse text/plain
- 90% completion threshold matches server-side continue-watching logic
- Used loadedmetadata event instead of setTimeout for initial time seek (more reliable)
- isAdvancing ref flag in NextEpisodeOverlay prevents race conditions on rapid clicks
- resolveNextEpisode is a pure function outside the component for testability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Progress tracking complete, ready for home page integration (ContinueWatchingRow)
- Player loop complete: save progress -> resume -> auto-advance episodes
- All client-side playback features wired up

---
*Phase: 05-video-player-and-user-features*
*Completed: 2026-03-07*
