# Phase 5: Video Player and User Features - Research

**Researched:** 2026-03-07
**Domain:** Video playback (hls.js), custom player UI, progress tracking, user features (My List, Account Settings)
**Confidence:** HIGH

## Summary

Phase 5 covers four major feature areas: (1) a custom video player supporting MP4 and HLS with Netflix-style overlay controls, (2) playback progress tracking with Continue Watching logic, (3) My List (merged Watchlist/Favorites), and (4) Account Settings. The video player should be built with the native HTML5 `<video>` element and hls.js for HLS streams, with entirely custom React controls (no third-party player UI library). Progress saving uses `navigator.sendBeacon` on `visibilitychange`/`pagehide` for reliability. The existing Prisma schema already has WatchProgress, Watchlist, and Favorite models but needs minor additions (User.newsletter, User.displayName fields).

**Primary recommendation:** Build the video player as a custom React component using `useRef` on the `<video>` element, hls.js for `.m3u8` sources, and Zustand for player state. Do not use react-player, video.js, or any third-party player wrapper -- the custom controls requirement demands direct `<video>` element control.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| hls.js | ^1.6.15 | HLS adaptive bitrate streaming | De facto standard for HLS in browsers; 254-300kb gzipped; handles ABR, buffering, error recovery |
| React (existing) | 19.2.4 | UI framework | Already in stack |
| Zustand (existing) | 5.0.11 | Player state management | Already in stack; lightweight; perfect for cross-component player state |
| @tanstack/react-query (existing) | 5.90.21 | Server state (My List, progress, settings) | Already in stack |
| lucide-react (existing) | 0.511.0 | Player control icons | Already in stack; has Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, Plus, Check, etc. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| screenfull | ^6.0.2 | Cross-browser Fullscreen API wrapper | Normalizes fullscreen across browsers; tiny (1kb); ESM |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom player | react-player | react-player abstracts away the video element, making Netflix-style custom controls very hard |
| Custom player | video.js | Massive bundle, opinionated UI skin, overkill when building fully custom controls |
| screenfull | Raw Fullscreen API | screenfull handles vendor prefixes; but raw API is also fine for modern browsers only |
| hls.js | Shaka Player | Shaka supports DASH too but is larger; hls.js is simpler for HLS-only use case |

**Installation:**
```bash
cd client && npm install hls.js screenfull
```

## Architecture Patterns

### Recommended Project Structure
```
client/src/
├── app/
│   ├── watch/[id]/page.tsx          # Watch page (full-screen player route)
│   ├── my-list/page.tsx             # My List page
│   └── account/page.tsx             # Account settings page
├── components/
│   ├── player/
│   │   ├── VideoPlayer.tsx          # Main player container (orchestrates everything)
│   │   ├── PlayerControls.tsx       # Overlay controls chrome
│   │   ├── ProgressBar.tsx          # Red scrubber with buffer indicator
│   │   ├── VolumeControl.tsx        # Volume slider
│   │   ├── NextEpisodeOverlay.tsx   # 10-second countdown overlay
│   │   └── BufferingIndicator.tsx   # Spinner + slow connection hint
│   ├── content/
│   │   └── ContentCard.tsx          # (existing, add progress bar + My List button)
│   ├── my-list/
│   │   └── MyListButton.tsx         # Plus/Check toggle button
│   └── account/
│       ├── ProfileSection.tsx
│       ├── SubscriptionSection.tsx
│       ├── DeviceSection.tsx
│       └── PreferencesSection.tsx
├── hooks/
│   ├── use-video-player.ts          # Core player logic hook
│   ├── use-player-controls.ts       # Auto-hide, keyboard shortcuts
│   ├── use-progress-tracking.ts     # Save progress to server
│   ├── use-my-list.ts               # My List toggle with optimistic updates
│   └── use-hls.ts                   # hls.js initialization and cleanup
├── stores/
│   └── player.ts                    # Zustand store for player state
├── api/
│   ├── client.ts                    # (existing)
│   ├── content.ts                   # (existing)
│   ├── progress.ts                  # Progress API calls
│   ├── my-list.ts                   # My List API calls
│   └── user.ts                      # User profile/settings API calls
└── types/
    ├── content.ts                   # (existing, extend with progress)
    └── player.ts                    # Player-specific types
```

### Pattern 1: HLS/MP4 Dual-Source Hook
**What:** A `useHls` hook that conditionally initializes hls.js or falls back to native `<video>` based on source URL.
**When to use:** Every time the player loads a video source.
**Example:**
```typescript
// Source: hls.js GitHub README + MDN HTMLMediaElement
import Hls from "hls.js";
import { useEffect, useRef } from "react";

export function useHls(videoRef: React.RefObject<HTMLVideoElement | null>, src: string | null) {
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // HLS source
    if (src.endsWith(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {}); // autoplay may be blocked
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS support
        video.src = src;
      }
    } else {
      // MP4 or other native format
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, videoRef]);
}
```

### Pattern 2: Player State Store (Zustand)
**What:** Centralized player state accessible from controls, overlay, and progress tracking.
**When to use:** Sharing state between VideoPlayer, PlayerControls, ProgressBar, NextEpisodeOverlay.
**Example:**
```typescript
import { create } from "zustand";

interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  buffered: number; // percentage 0-1
  volume: number;   // 0-1
  showControls: boolean;
  showNextEpisode: boolean;

  setPlaying: (v: boolean) => void;
  setMuted: (v: boolean) => void;
  setFullscreen: (v: boolean) => void;
  setBuffering: (v: boolean) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setBuffered: (b: number) => void;
  setVolume: (v: number) => void;
  setShowControls: (v: boolean) => void;
  setShowNextEpisode: (v: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  isMuted: false,
  isFullscreen: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  showControls: true,
  showNextEpisode: false,

  setPlaying: (v) => set({ isPlaying: v }),
  setMuted: (v) => set({ isMuted: v }),
  setFullscreen: (v) => set({ isFullscreen: v }),
  setBuffering: (v) => set({ isBuffering: v }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setBuffered: (b) => set({ buffered: b }),
  setVolume: (v) => set({ volume: v }),
  setShowControls: (v) => set({ showControls: v }),
  setShowNextEpisode: (v) => set({ showNextEpisode: v }),
}));
```

### Pattern 3: Auto-Hide Controls with Inactivity Timer
**What:** Controls overlay that auto-hides after 3 seconds of no mouse/touch/keyboard activity.
**When to use:** Netflix-style player chrome behavior.
**Example:**
```typescript
import { useCallback, useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/player";

export function usePlayerControls() {
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const setShowControls = usePlayerStore((s) => s.setShowControls);

  const showControls = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, [setShowControls]);

  useEffect(() => {
    const handleActivity = () => showControls();

    document.addEventListener("mousemove", handleActivity);
    document.addEventListener("touchstart", handleActivity);
    document.addEventListener("keydown", handleActivity);

    return () => {
      document.removeEventListener("mousemove", handleActivity);
      document.removeEventListener("touchstart", handleActivity);
      document.removeEventListener("keydown", handleActivity);
      clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  return { showControls };
}
```

### Pattern 4: Progress Save with sendBeacon on Unload
**What:** Periodically save progress via API, and use `navigator.sendBeacon` on page unload for reliability.
**When to use:** Progress tracking for Continue Watching.
**Example:**
```typescript
// Save on visibilitychange/pagehide (more reliable than beforeunload)
useEffect(() => {
  const saveOnUnload = () => {
    const data = JSON.stringify({
      contentId,
      episodeId,
      timestamp: Math.floor(videoRef.current?.currentTime ?? 0),
      duration: Math.floor(videoRef.current?.duration ?? 0),
    });
    navigator.sendBeacon("/api/progress", data);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveOnUnload();
  });
  window.addEventListener("pagehide", saveOnUnload);

  return () => {
    document.removeEventListener("visibilitychange", saveOnUnload);
    window.removeEventListener("pagehide", saveOnUnload);
  };
}, [contentId, episodeId]);
```

### Pattern 5: Optimistic My List Toggle
**What:** Instant UI feedback when toggling My List, with server sync via React Query mutation.
**When to use:** My List add/remove on any surface (card, detail, player).
**Example:**
```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

export function useMyList(contentId: string) {
  const queryClient = useQueryClient();

  const { data: isInList = false } = useQuery({
    queryKey: ["my-list", contentId],
    queryFn: async () => {
      const res = await api.get(`/my-list/${contentId}`);
      return res.data.inList;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (isInList) {
        await api.delete(`/my-list/${contentId}`);
      } else {
        await api.post(`/my-list/${contentId}`);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["my-list", contentId] });
      const previous = queryClient.getQueryData(["my-list", contentId]);
      queryClient.setQueryData(["my-list", contentId], !isInList);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["my-list", contentId], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["my-list"] });
    },
  });

  return { isInList, toggle: toggle.mutate };
}
```

### Anti-Patterns to Avoid
- **Using `<iframe>` for video:** Loses all control over the player; cannot build custom UI.
- **Storing player state in React Query:** Player state (isPlaying, currentTime) changes 4x/second -- use Zustand, not server state management.
- **Using `beforeunload` for progress save:** Unreliable on mobile, incompatible with bfcache. Use `visibilitychange` + `pagehide` instead.
- **Polling progress from server:** Progress is write-heavy, read-rarely. Save client-side, batch to server every 10 seconds.
- **Making My List a separate page-level fetch:** My List status per content item should be a lightweight check, not a bulk fetch. Batch check on browse page load.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HLS parsing/ABR | Custom M3U8 parser, manual quality switching | hls.js | Handles 100+ edge cases in HLS spec, ABR algorithms, error recovery |
| Fullscreen cross-browser | Vendor-prefix detection | screenfull (or raw API if modern-only) | Handles Edge, Safari, Firefox differences |
| Debounced progress saves | Custom interval manager | Simple `setInterval` + cleanup | Not complex enough to warrant a library, but do use `useRef` for the interval ID |
| Time formatting (00:00:00) | String manipulation | Simple utility function | Easy to write, no library needed |

**Key insight:** The video player itself is custom (controls, layout, behavior), but the underlying video technology (HLS decoding, fullscreen API) should use established libraries. The custom work is all in the UI layer.

## Common Pitfalls

### Pitfall 1: hls.js Dynamic Import in SSR
**What goes wrong:** Importing hls.js at module level causes `ReferenceError: self is not defined` in Next.js SSR because hls.js accesses browser globals.
**Why it happens:** hls.js references `self` and `window` at import time.
**How to avoid:** Dynamic import hls.js inside `useEffect` or use `next/dynamic` with `ssr: false` for the player component.
**Warning signs:** Build errors mentioning `self is not defined` or `window is not defined`.

### Pitfall 2: Memory Leaks from hls.js Instance
**What goes wrong:** Not calling `hls.destroy()` on cleanup causes memory leaks, especially when navigating between videos.
**Why it happens:** hls.js holds references to MediaSource, SourceBuffers, and network requests.
**How to avoid:** Always call `hls.destroy()` in the `useEffect` cleanup. Store hls instance in a `useRef`.
**Warning signs:** Growing memory usage, stale network requests in DevTools.

### Pitfall 3: Autoplay Blocked by Browser
**What goes wrong:** `video.play()` throws an unhandled promise rejection when autoplay is blocked.
**Why it happens:** Modern browsers block autoplay unless video is muted or user has interacted.
**How to avoid:** Always `.catch()` the play() promise. Fall back to muted autoplay if unmuted fails. Show a play button overlay if muted autoplay also fails.
**Warning signs:** Console errors about "play() failed because the user didn't interact with the document first."

### Pitfall 4: Progress Bar Flicker from Rapid State Updates
**What goes wrong:** Updating React state on every `timeupdate` event (fires ~4x/second) causes unnecessary re-renders of the entire player.
**Why it happens:** Naive state management re-renders all children.
**How to avoid:** Use Zustand selectors so only ProgressBar subscribes to `currentTime`. Or update the progress bar DOM directly via ref for smoother animation.
**Warning signs:** Sluggish player controls, high React DevTools render count.

### Pitfall 5: sendBeacon Content-Type
**What goes wrong:** `navigator.sendBeacon` with a JSON string sends as `text/plain`, and Express doesn't parse it.
**Why it happens:** sendBeacon doesn't allow setting Content-Type header directly.
**How to avoid:** Use `new Blob([jsonString], { type: "application/json" })` as the sendBeacon data, which sets the correct Content-Type.
**Warning signs:** Server receives empty body from beacon requests.

### Pitfall 6: Fullscreen on iOS Safari
**What goes wrong:** iOS Safari does not support the Fullscreen API on arbitrary elements. Only `<video>` element itself can go fullscreen via `webkitEnterFullscreen()`.
**Why it happens:** Apple restricts fullscreen to video elements on iOS.
**How to avoid:** On iOS, call `videoElement.webkitEnterFullscreen()` instead of `containerElement.requestFullscreen()`. Custom overlay controls will NOT render in iOS fullscreen -- this is a known platform limitation. Document this as a known issue.
**Warning signs:** Fullscreen button does nothing on iOS.

### Pitfall 7: Race Condition in Next Episode Auto-Advance
**What goes wrong:** Multiple `ended` events or rapid completion triggers navigate to next episode multiple times.
**Why it happens:** Event listeners not properly guarded.
**How to avoid:** Use a ref flag (`isAdvancing.current`) to guard the auto-advance logic. Reset it on navigation.
**Warning signs:** Skipping episodes, double navigation.

## Code Examples

### Video Element Event Wiring
```typescript
// Source: MDN HTMLMediaElement events
// Wire up the native video element events to Zustand store
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  const onPlay = () => setPlaying(true);
  const onPause = () => setPlaying(false);
  const onTimeUpdate = () => setCurrentTime(video.currentTime);
  const onDurationChange = () => setDuration(video.duration);
  const onWaiting = () => setBuffering(true);
  const onPlaying = () => setBuffering(false);
  const onProgress = () => {
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1) / video.duration);
    }
  };

  video.addEventListener("play", onPlay);
  video.addEventListener("pause", onPause);
  video.addEventListener("timeupdate", onTimeUpdate);
  video.addEventListener("durationchange", onDurationChange);
  video.addEventListener("waiting", onWaiting);
  video.addEventListener("playing", onPlaying);
  video.addEventListener("progress", onProgress);

  return () => {
    video.removeEventListener("play", onPlay);
    video.removeEventListener("pause", onPause);
    video.removeEventListener("timeupdate", onTimeUpdate);
    video.removeEventListener("durationchange", onDurationChange);
    video.removeEventListener("waiting", onWaiting);
    video.removeEventListener("playing", onPlaying);
    video.removeEventListener("progress", onProgress);
  };
}, []);
```

### Keyboard Shortcuts
```typescript
// Source: CONTEXT.md decisions
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't handle if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause();
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime -= 10;
        break;
      case "ArrowRight":
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime += 10;
        break;
      case "f":
      case "F":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "m":
      case "M":
        e.preventDefault();
        if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
        break;
      case "Escape":
        e.preventDefault();
        router.back();
        break;
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, []);
```

### Continue Watching Threshold Logic (Server-Side)
```typescript
// Source: CONTEXT.md decisions
function shouldShowInContinueWatching(
  timestamp: number,     // seconds watched
  duration: number,      // total duration in seconds
  completed: boolean,
): boolean {
  // Content shorter than 2 minutes never shows
  if (duration < 120) return false;

  // If completed (90%+), don't show
  if (completed) return false;

  // Minimum watch threshold: max(120 seconds, 5% of duration)
  const threshold = Math.max(120, duration * 0.05);
  return timestamp >= threshold;
}

function isCompleted(timestamp: number, duration: number): boolean {
  return duration > 0 && (timestamp / duration) >= 0.9;
}
```

### Progress Bar with Three Segments
```typescript
// Red (played) + gray (buffered) + dark gray (remaining)
function ProgressBar() {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const buffered = usePlayerStore((s) => s.buffered);

  const played = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = buffered * 100;

  return (
    <div className="group relative h-1 w-full cursor-pointer bg-white/20 hover:h-2 transition-[height]">
      {/* Buffered */}
      <div className="absolute left-0 top-0 h-full bg-white/30" style={{ width: `${bufferedPct}%` }} />
      {/* Played */}
      <div className="absolute left-0 top-0 h-full bg-red-600" style={{ width: `${played}%` }} />
      {/* Scrubber dot (visible on hover) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: `${played}%` }}
      />
    </div>
  );
}
```

### sendBeacon with Correct Content-Type
```typescript
function saveProgressBeacon(contentId: string, episodeId: string | null, timestamp: number, duration: number) {
  const body = JSON.stringify({ contentId, episodeId, timestamp, duration });
  const blob = new Blob([body], { type: "application/json" });
  navigator.sendBeacon("/api/progress", blob);
}
```

## Schema Changes Required

The existing Prisma schema needs minor additions:

### User Model Additions
```prisma
model User {
  // ... existing fields ...
  displayName  String?          // Editable display name (separate from `name`)
  newsletter   Boolean @default(false)  // Newsletter preference
}
```

**Note:** `autoRenew` already exists on the Subscription model. The Account Settings preferences section should read `autoRenew` from the user's active subscription, not from the User model.

### WatchProgress Model
The existing WatchProgress model is adequate. Fields: `userId`, `contentId`, `episodeId`, `timestamp`, `duration`, `completed`. The `@@unique([userId, contentId, episodeId])` constraint supports upsert for progress saves.

### My List Decision
CONTEXT.md specifies merging Watchlist and Favorites into a single "My List." The schema has both `Watchlist` and `Favorite` models. Options:
1. **Use only the Watchlist model as "My List"** and ignore the Favorite model (simplest)
2. Create a new `MyList` model and deprecate both

**Recommendation:** Use the existing `Watchlist` model as the backing store for "My List." No schema migration needed. The `Favorite` model can remain unused (no need to delete it now).

## API Routes Needed

New routes for this phase:

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/progress` | POST | Yes | Save playback progress (also handles sendBeacon) |
| `/api/progress/:contentId` | GET | Yes | Get progress for specific content (with episode resolution) |
| `/api/continue-watching` | GET | Yes | Get Continue Watching list with filtering |
| `/api/my-list` | GET | Yes | Get user's My List |
| `/api/my-list/:contentId` | GET | Yes | Check if content is in My List |
| `/api/my-list/:contentId` | POST | Yes | Add to My List |
| `/api/my-list/:contentId` | DELETE | Yes | Remove from My List |
| `/api/user/profile` | GET | Yes | Get user profile data |
| `/api/user/profile` | PATCH | Yes | Update display name, phone |
| `/api/user/preferences` | PATCH | Yes | Update newsletter toggle |
| `/api/user/subscription` | GET | Yes | Get active subscription info |

## Watch Page Route

The `/watch/[id]` page should:
1. Hide the Navbar (full-screen experience)
2. Accept both content IDs (movies) and episode IDs (series)
3. URL pattern: `/watch/[contentId]?episode=[episodeId]` for series
4. Fetch content metadata + existing progress on load
5. Resume from saved timestamp

The layout should conditionally hide Navbar. Use a separate layout group:
```
app/
├── (main)/           # Layout with Navbar
│   ├── layout.tsx
│   ├── page.tsx      # Home
│   ├── my-list/
│   └── account/
└── (player)/         # Layout WITHOUT Navbar
    ├── layout.tsx    # Minimal layout, no Navbar
    └── watch/[id]/
        └── page.tsx
```

**Alternative (simpler):** Keep existing layout but conditionally hide Navbar based on pathname. Since the Navbar is in root layout, use CSS `hidden` on the `/watch/*` route. The simpler approach: the watch page renders a fixed full-viewport div that overlays everything including the Navbar.

**Recommendation:** Use the overlay approach. The watch page renders a `fixed inset-0 z-50 bg-black` container that covers the entire viewport. This avoids layout restructuring and the player naturally takes over the screen.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| beforeunload for progress save | visibilitychange + pagehide + sendBeacon | Ongoing (bfcache adoption) | beforeunload unreliable on mobile, breaks bfcache |
| react-player wrapper | Direct `<video>` + hls.js | 2023+ | More control, smaller bundle, better custom UIs |
| Video.js for custom players | hls.js + custom React controls | 2023+ | Video.js skin system fights custom UI; hls.js is just the engine |
| document.webkitFullscreenElement | document.fullscreenElement | Stable since 2020 | No vendor prefix needed in modern browsers; screenfull still useful for edge cases |

**Deprecated/outdated:**
- `react-hls-player`: Last published 3 years ago, not maintained
- `video.js` for custom-skin use cases: Overkill when you need full UI control

## Open Questions

1. **Episode ID in watch URL**
   - What we know: Movies use `/watch/[contentId]`, series need episode context
   - What's unclear: Should the URL be `/watch/[contentId]?episode=[episodeId]` or `/watch/[episodeId]` directly?
   - Recommendation: Use `/watch/[contentId]?episode=[episodeId]` so the player always knows the parent content for series metadata and next-episode resolution.

2. **Auth token in sendBeacon**
   - What we know: sendBeacon sends POST but cannot set custom headers (no Authorization header)
   - What's unclear: How to authenticate beacon requests
   - Recommendation: Use a session cookie as fallback for the beacon endpoint, OR include the auth token in the request body and validate it server-side. Simplest: have the progress endpoint also accept auth from a cookie (set during login alongside the JWT).

3. **displayName vs name field**
   - What we know: Schema has `name` on User. Context says "display name (editable)"
   - What's unclear: Is `name` already the display name, or do we need a separate field?
   - Recommendation: Use the existing `name` field as the editable display name. No schema change needed for this.

## Sources

### Primary (HIGH confidence)
- [hls.js GitHub README](https://github.com/video-dev/hls.js/) - API, basic usage, events, error handling
- [hls.js npm](https://www.npmjs.com/package/hls.js) - Version 1.6.15 confirmed
- [MDN Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) - requestFullscreen, exitFullscreen, fullscreenchange
- [MDN navigator.sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) - API, limitations, Content-Type behavior
- Existing codebase: Prisma schema, client structure, API routes, stores pattern

### Secondary (MEDIUM confidence)
- [LogRocket: Next.js HLS streaming](https://blog.logrocket.com/next-js-real-time-video-streaming-hls-js-alternatives/) - SSR considerations, bundle size (254-300kb)
- [screenfull npm](https://www.npmjs.com/package/screenfull) - Version 6.0.2, ESM
- [Speedkit: Unload beacon reliability](https://www.speedkit.com/blog/unload-beacon-reliability-benchmarking-strategies-for-minimal-data-loss) - visibilitychange + pagehide = 91% reliability

### Tertiary (LOW confidence)
- [Medium: Netflix player clone patterns](https://medium.com/@pieecia/create-a-netflix-video-player-with-react-player-typescript-and-styled-components-2142b8003d07) - General architecture reference

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - hls.js is the de facto standard; version confirmed on npm
- Architecture: HIGH - Patterns derived from existing codebase conventions + established React video player patterns
- Pitfalls: HIGH - Well-documented issues (SSR, autoplay, sendBeacon Content-Type, iOS fullscreen)
- API design: HIGH - Follows existing Express route patterns in the codebase
- Schema changes: MEDIUM - Depends on decision about `name` vs `displayName` and Watchlist reuse for My List

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days - stable domain, hls.js is mature)
