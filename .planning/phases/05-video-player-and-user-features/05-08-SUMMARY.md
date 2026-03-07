---
phase: 05-video-player-and-user-features
plan: 08
subsystem: client-integration
tags: [my-list, continue-watching, auth, play-navigation, home-page]
depends_on:
  requires: ["05-04", "05-05", "05-07"]
  provides: ["integrated-my-list-ui", "auth-interceptor", "play-navigation", "home-page-personalization"]
  affects: ["06", "07", "08"]
tech_stack:
  added: []
  patterns: ["axios-request-interceptor", "inline-query-component"]
key_files:
  created: []
  modified:
    - client/src/components/content/HoverPopover.tsx
    - client/src/components/detail/DetailModal.tsx
    - client/src/components/player/PlayerControls.tsx
    - client/src/components/player/VideoPlayer.tsx
    - client/src/components/layout/Navbar.tsx
    - client/src/app/page.tsx
    - client/src/api/client.ts
    - client/src/components/content/ContentCard.tsx
decisions:
  - "MyListButton replaces static Plus button in HoverPopover and DetailModal"
  - "Play button in DetailModal navigates to /watch/[id] with first episode for series"
  - "Auth interceptor reads token from localStorage key 'token' and sets Bearer header"
  - "MyListRow uses retry: false to silently fail when user is not authenticated"
  - "ContentCard progress bar is 3px height with bg-red-600 and bg-white/20 track"
metrics:
  duration: "~2 min"
  completed: "2026-03-07"
---

# Phase 5 Plan 08: Feature Integration Wiring Summary

**One-liner:** Wired MyListButton into popover/detail/player, added Continue Watching and My List rows to home page, auth interceptor, and progress bar to ContentCard.

## What Was Done

### Task 1: Add MyListButton and Play navigation to existing components
- Replaced static Plus button in HoverPopover with MyListButton (size="sm")
- Replaced static My List button in DetailModal with MyListButton (size="md")
- Made Play button in DetailModal navigate to /watch/[id] (with ?episode= for series)
- Added MyListButton to PlayerControls top-right area next to close button
- Updated VideoPlayer to pass contentId through to PlayerControls
- Added My List and Account links to Navbar

### Task 2: Continue Watching row, My List row, auth interceptor, progress bar
- Added ContinueWatchingRow import and render on home page above browse rows
- Created inline MyListRow component using useQuery to fetch my list items
- MyListRow renders as horizontal scrollable row with ContentCard items, returns null when empty
- Added axios request interceptor to attach Authorization: Bearer token from localStorage
- Added optional progressPercent prop to ContentCard with thin red progress bar overlay

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| MyListRow uses retry: false | Prevents error spam when user is not authenticated |
| Pass contentId through VideoPlayer to PlayerControls | Clean prop drilling since PlayerControls needs it for MyListButton |

## Verification

- TypeScript compilation passes with `npx tsc --noEmit`
- MyListButton rendered in HoverPopover, DetailModal, and PlayerControls
- Play button in DetailModal navigates to /watch/[id]
- Navbar has My List and Account links
- Home page includes ContinueWatchingRow and MyListRow above browse rows
- API client has auth interceptor for Bearer token
- ContentCard accepts optional progressPercent prop

## Commits

| Hash | Message |
|------|---------|
| 87041b6 | feat(05-08): add MyListButton and Play navigation to existing components |
| bba212e | feat(05-08): add Continue Watching row, My List row, auth interceptor, and progress bar |
