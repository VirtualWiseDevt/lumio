---
phase: 05-video-player-and-user-features
plan: 04
subsystem: client-video-player
tags: [video-player, hls, streaming, keyboard-shortcuts, zustand]
completed: 2026-03-07
duration: ~3 min
depends_on: [05-03]
provides:
  - Video player component with HLS and MP4 support
  - Netflix-style overlay controls with auto-hide
  - Keyboard shortcuts for playback control
  - /watch/[id] route with progress resume
  - Mobile touch zones for rewind/play/skip
affects: [05-07, 05-08]
tech_stack:
  added: []
  patterns:
    - Dynamic hls.js import inside useEffect for SSR safety
    - Zustand individual selectors for granular re-renders in player
    - screenfull dynamic import for fullscreen toggle
key_files:
  created:
    - client/src/hooks/use-hls.ts
    - client/src/hooks/use-video-player.ts
    - client/src/hooks/use-player-controls.ts
    - client/src/components/player/VideoPlayer.tsx
    - client/src/components/player/PlayerControls.tsx
    - client/src/components/player/ProgressBar.tsx
    - client/src/components/player/VolumeControl.tsx
    - client/src/components/player/BufferingIndicator.tsx
    - client/src/app/watch/[id]/page.tsx
  modified: []
decisions:
  - useHls dynamically imports hls.js inside useEffect to avoid SSR "self is not defined"
  - Touch zones gated on !showControls so taps interact with control buttons when visible
  - ProgressBar uses group-hover pattern for scrubber dot and bar height expansion
  - screenfull imported dynamically in keyboard handler and fullscreen button
  - formatTime helper local to ProgressBar (different from formatDuration which formats minutes)
---

# Phase 5 Plan 4: Video Player and Controls Summary

Full-viewport video player with HLS streaming, Netflix-style overlay controls, keyboard shortcuts, mobile touch zones, and progress resume from /watch/[id] route.

## Tasks Completed

### Task 1: Core hooks and VideoPlayer container
- **useHls hook**: Dynamically imports hls.js inside useEffect (SSR-safe), supports .m3u8 via hls.js with Safari canPlayType fallback, and direct MP4 playback. Configures maxBufferLength: 30 and maxMaxBufferLength: 60. Handles fatal errors with startLoad/recoverMediaError/destroy pattern.
- **useVideoPlayer hook**: Wires native video element events (play, pause, timeupdate, durationchange, waiting, playing, progress) to Zustand player store. Calls store.reset() on unmount.
- **VideoPlayer component**: Fixed inset-0 z-50 bg-black container. Renders video element with playsInline and autoPlay. Mobile touch zones split into three invisible divs (left=rewind 10s, center=play/pause, right=skip 10s), gated on !showControls.
- **Watch page** (/watch/[id]): Extracts contentId from params (Promise, awaited via use()), episodeId from searchParams. Fetches content detail and saved progress. Determines video source from episode, streamUrl, or first available episode. Resumes from saved progress timestamp. Shows loading spinner and error states.

### Task 2: Player controls chrome with keyboard shortcuts
- **usePlayerControls hook**: Auto-hide controls after 3s of inactivity (mousemove, touchstart, keydown reset timer). Keyboard shortcuts: Space (play/pause with preventDefault), ArrowLeft/Right (-/+10s), F (fullscreen via screenfull), M (mute toggle), Escape (close player). Guards against input/textarea targets. Tracks fullscreen changes via screenfull.on("change").
- **PlayerControls**: Netflix-style gradient overlay (top: title + close button, bottom: progress bar + controls row). CSS opacity transition for show/hide. Cursor hidden when controls hidden.
- **ProgressBar**: Three-layer bar (dark bg, gray buffered, red played). Expands h-1 to h-2 on hover via group-hover. Red scrubber dot visible on hover. Time tooltip follows mouse position. Click-to-seek and drag-to-scrub with global mousemove/mouseup listeners. Time display in HH:MM:SS format.
- **VolumeControl**: Mute toggle icon (Volume2/VolumeX) with hover-expanding horizontal slider (0-1 range). Updates video.volume and Zustand store.
- **BufferingIndicator**: Centered spinner with 5-second slow-connection hint (checks bufferingStartTime from store via setInterval).

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Commit | Description |
|--------|-------------|
| e9ae790 | feat(05-04): create video player core with HLS hook and watch page |
| 337822c | feat(05-04): add player controls chrome with keyboard shortcuts |

## Verification

- TypeScript compilation passes (`npx tsc --noEmit`)
- /watch/[id] page route exists
- hls.js dynamically imported (no SSR errors)
- All keyboard shortcuts handled
- ProgressBar has click-to-seek and drag-to-scrub
- BufferingIndicator shows slow-connection after 5s
- Mobile touch zones gated on !showControls
