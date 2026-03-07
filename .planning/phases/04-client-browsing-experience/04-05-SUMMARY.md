# Phase 4 Plan 5: Detail Modal and API Client Summary

## One-liner
Netflix-style detail modal with intercepting routes, episode list, similar content grid, and typed API client for all browse endpoints.

## What Was Done

### Task 1: Create API client functions for all browse endpoints
- Created `client/src/api/content.ts` with 6 typed async functions
- `fetchHomePageData()` - home page browse data
- `fetchBrowsePageData(type)` - movies/series/documentaries browse data
- `fetchLiveTvData()` - live TV channel categories
- `fetchTitleDetail(id)` - content detail with seasons/episodes
- `fetchSimilarTitles(id)` - similar content for "More Like This"
- `searchContent(query)` - search across all content types
- All functions typed with content interfaces, using axios api client

### Task 2: Create detail modal, episode list, more-like-this, and intercepting routes
- **DetailModal** (`client/src/components/detail/DetailModal.tsx`): Netflix-style overlay modal with:
  - Fixed overlay backdrop (bg-black/70) with click-to-close
  - Escape key closes modal, body scroll locked when open
  - Backdrop image header with gradient overlay
  - Play and My List action buttons
  - Metadata display: year, duration, quality badge, age rating badge
  - Description, cast, director, genres
  - Loading skeleton and error retry states
  - Motion AnimatePresence for entrance/exit animations
  - `isFullPage` prop for direct URL access (no overlay)
- **EpisodeList** (`client/src/components/detail/EpisodeList.tsx`): Season dropdown with episode cards showing number, thumbnail, title, duration, description
- **MoreLikeThis** (`client/src/components/detail/MoreLikeThis.tsx`): TanStack Query-powered similar content grid (3 cols desktop, 2 mobile) with skeleton loading
- **Intercepting route** (`client/src/app/@modal/(.)title/[id]/page.tsx`): Next.js route interception for modal overlay pattern
- **Full page route** (`client/src/app/title/[id]/page.tsx`): Direct navigation renders full page (SEO-friendly)

## Commits

| Commit | Description |
|--------|-------------|
| bbdccc1 | feat(04-05): create API client functions for all browse endpoints |
| db76d25 | feat(04-05): create detail modal, episode list, and intercepting routes |

## Deviations from Plan

### Parallel Execution Race Condition
The detail component files (DetailModal.tsx, EpisodeList.tsx, MoreLikeThis.tsx) and the full page route (title/[id]/page.tsx) were picked up and committed by the parallel 04-06 agent (commit 218b0cb) while this plan was staging them. The intercepting route file `@modal/(.)title/[id]/page.tsx` was committed separately in this plan's Task 2 commit (db76d25). All files are correctly committed and tracked.

## Decisions Made

- [04-05]: API client functions are plain async (not hooks) -- used inside TanStack Query's queryFn
- [04-05]: DetailModal uses isFullPage prop to toggle between modal overlay and full page rendering
- [04-05]: Motion AnimatePresence wraps modal for opacity + translateY entrance animation
- [04-05]: EpisodeList uses local state for season selection (no URL params needed)
- [04-05]: MoreLikeThis renders as 3-col grid on desktop, 2-col on mobile

## Key Files

### Created
- `client/src/api/content.ts` - API client functions for browse endpoints
- `client/src/components/detail/DetailModal.tsx` - Netflix-style detail modal
- `client/src/components/detail/EpisodeList.tsx` - Season/episode list component
- `client/src/components/detail/MoreLikeThis.tsx` - Similar content grid
- `client/src/app/@modal/(.)title/[id]/page.tsx` - Intercepting route for modal
- `client/src/app/title/[id]/page.tsx` - Full page route for direct navigation

## Duration
~4 minutes
