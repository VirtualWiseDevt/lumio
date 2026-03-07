# Phase 04 Plan 04: Content Rows and Hover Popover Summary

**One-liner:** Netflix-style horizontal scroll rows with responsive card counts, snap-to-card, arrow navigation, and 500ms hover popover with metadata.

## What Was Built

### useContentRow Hook (`client/src/hooks/use-content-row.ts`)
- Tracks scroll position via scroll event listener with requestAnimationFrame
- Exposes canScrollLeft/canScrollRight booleans for arrow visibility
- scrollLeft/scrollRight methods scroll by one page with smooth behavior
- Recalculates on window resize and initial mount

### ContentRow Component (`client/src/components/content/ContentRow.tsx`)
- Section title with horizontal scroll container
- Scroll snap (x mandatory) with snap-align-start on each card
- Left/right arrow buttons visible on row hover (group-hover pattern)
- Arrows hidden at scroll boundaries
- Integrates HoverPopover via useHoverPopover hook
- AnimatePresence for smooth popover mount/unmount

### ContentCard Component (`client/src/components/content/ContentCard.tsx`)
- Poster image (aspect-[2/3]) via Next.js Image with responsive sizes
- Fallback gradient placeholder when no poster available
- Title below image (truncated)
- Hover scale-105 transition

### HoverPopover Component (`client/src/components/content/HoverPopover.tsx`)
- Fixed-position popover 1.5x card width, centered over card
- Viewport-aware edge clamping (8px margin)
- Motion animate: scale 0.9->1, opacity 0->1 (200ms)
- Top: backdrop image (posterLandscape), aspect-video
- Bottom: Play (accent), Add to List, Like, Expand buttons
- Metadata: age rating badge, quality badge, duration, release year
- Categories: first 3 with bullet separator

### useHoverPopover Hook (`client/src/hooks/use-hover-popover.ts`)
- 500ms open delay (setTimeout)
- Stores card DOMRect for popover positioning
- 100ms close grace period (mouse can move from card to popover)
- Popover mouse enter cancels close timer
- Full cleanup on unmount

### Responsive Card Sizing (globals.css)
- CSS media queries via .content-card class
- <500px: 2 cards, 500px+: 3, 800px+: 4, 1100px+: 5, 1400px+: 6
- Cards fill available width equally with 8px gaps

## Commits

| Hash | Message |
|------|---------|
| 2c8651a | feat(04-04): create content row hook and ContentRow component |
| 5daed63 | feat(04-04): add ContentCard, HoverPopover, and useHoverPopover hook |

## Deviations from Plan

None - plan executed exactly as written.

## Files Created

- `client/src/hooks/use-content-row.ts` (62 lines)
- `client/src/hooks/use-hover-popover.ts` (84 lines)
- `client/src/components/content/ContentRow.tsx` (103 lines)
- `client/src/components/content/ContentCard.tsx` (53 lines)
- `client/src/components/content/HoverPopover.tsx` (152 lines)

## Files Modified

- `client/src/app/globals.css` (added .content-card responsive classes)

## Duration

~2.5 minutes

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| CSS media queries for card sizing (not JS) | Pure CSS avoids hydration mismatches and is more performant |
| requestAnimationFrame for scroll state updates | Prevents layout thrashing during rapid scroll events |
| 100ms close grace period on popover | Allows smooth mouse movement from card to popover without flicker |
| Fixed positioning for popover | Works correctly regardless of scroll container overflow |
| Viewport-aware edge clamping | Prevents popover from clipping off-screen at row edges |

## Next Steps

- 04-05: Browse page assembly (uses ContentRow to render browse data)
- ContentRow ready for consumption by any page component
