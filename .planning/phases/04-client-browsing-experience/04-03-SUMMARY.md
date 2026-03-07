# Phase 4 Plan 03: Hero Banner Summary

**One-liner:** Auto-rotating Netflix-style hero banner with image-first loading, muted video crossfade, dot indicators, and IntersectionObserver-based video pause.

## What Was Built

### Hooks
- **useIntersection** (`client/src/hooks/use-intersection.ts`): Generic IntersectionObserver wrapper returning `{ ref, isVisible }` with configurable threshold and rootMargin. Disconnects observer on unmount.
- **useHeroBanner** (`client/src/hooks/use-hero-banner.ts`): State machine managing auto-rotation through slides every 8s (configurable). Provides `pause()` / `resume()` for hover and video playback. `setCurrentIndex()` resets the timer for manual dot navigation. Wraps around from last to first slide.

### Components
- **HeroBanner** (`client/src/components/hero/HeroBanner.tsx`): Full-width hero section (70vh) accepting `Content[]` array. Uses AnimatePresence for opacity crossfade between slides. Renders gradient overlays, content info (title, description, Play/More Info buttons), dot indicators (bottom-center), and mute/unmute button (bottom-right). Pauses auto-rotation on hover.
- **HeroSlide** (`client/src/components/hero/HeroSlide.tsx`): Individual slide implementing the image-to-video crossfade sequence. State machine: `"image" | "buffering" | "video"`. Loads poster immediately via Next.js Image, starts video after 1.5s delay if trailerUrl exists, crossfades when buffered. Pauses video when not active or not visible. Falls back to static image on autoplay failure or missing trailer.
- **HeroControls** (`client/src/components/hero/HeroControls.tsx`): Animated dot indicators using Motion. Active dot expands to 32px width, inactive dots are 8px. Click to jump to slide.

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Motion AnimatePresence with `mode="popLayout"` | Smooth opacity crossfade between slides without layout shift |
| 1.5s delay before video load | Let backdrop image establish visual, avoid jarring video start |
| Three-state media machine (image/buffering/video) | Clean transitions, predictable fallback behavior |
| IntersectionObserver threshold 0.3 on banner | Pause video early when hero is mostly scrolled away |
| Hover pauses auto-rotation | Prevents slide change while user is reading content info |
| Video opacity transition (CSS 500ms) | Smooth crossfade from image to video without Motion overhead |

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 6facf61 | Create hero hooks (useHeroBanner and useIntersection) |
| 2 | 2acdc66 | Create HeroBanner, HeroSlide, and HeroControls components |

## Files Created

- `client/src/hooks/use-intersection.ts` (35 lines)
- `client/src/hooks/use-hero-banner.ts` (76 lines)
- `client/src/components/hero/HeroBanner.tsx` (115 lines)
- `client/src/components/hero/HeroSlide.tsx` (105 lines)
- `client/src/components/hero/HeroControls.tsx` (41 lines)

## Duration

Start: 2026-03-07T07:34:16Z
End: 2026-03-07T07:37:12Z
Duration: ~3 minutes

## Next Phase Readiness

Hero banner is ready to be composed into browse pages. The `HeroBanner` component accepts a `Content[]` array and handles all interactive behavior internally. Browse pages (04-04 and beyond) can import and render it with featured content from the browse API.
