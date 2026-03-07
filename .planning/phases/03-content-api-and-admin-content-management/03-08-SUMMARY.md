---
phase: 03
plan: 08
subsystem: admin-ui
tags: [series, seasons, episodes, crud, tanstack-router, tanstack-query, react-hook-form]
depends_on:
  requires: ["03-05", "03-06", "03-07"]
  provides: ["series-management-ui", "season-episode-api-client"]
  affects: ["future-video-pipeline-ui"]
tech-stack:
  added: []
  patterns: ["hierarchical-crud-pages", "dialog-based-inline-editing", "breadcrumb-navigation"]
key-files:
  created:
    - admin/src/api/seasons.ts
    - admin/src/components/forms/SeriesForm.tsx
    - admin/src/components/forms/EpisodeForm.tsx
    - admin/src/routes/_authenticated/series/index.tsx
    - admin/src/routes/_authenticated/series/new.tsx
    - admin/src/routes/_authenticated/series/$seriesId.tsx
    - admin/src/routes/_authenticated/series/$seriesId.seasons.$seasonId.tsx
  modified:
    - admin/src/components/content/columns.tsx
    - admin/src/routeTree.gen.ts
    - admin/src/components/forms/MovieForm.tsx
decisions:
  - id: "03-08-01"
    decision: "Remove Zod transforms in form schemas; convert strings to numbers in submit handlers"
    reason: "react-hook-form resolver type mismatch with Zod transform output types"
  - id: "03-08-02"
    decision: "Season CRUD uses simple Dialog with controlled inputs instead of react-hook-form"
    reason: "Only 2 fields (number, title) - full form validation overkill"
  - id: "03-08-03"
    decision: "Episode form auto-suggests next episode number based on existing episodes"
    reason: "Reduces friction when adding sequential episodes"
metrics:
  duration: "~6 min"
  completed: "2026-03-07"
---

# Phase 3 Plan 8: Series Management Pages Summary

Three-level hierarchical CRUD UI for Series > Seasons > Episodes with full navigation, breadcrumbs, and API integration.

## What Was Built

### Season/Episode API Client (admin/src/api/seasons.ts)
- 8 CRUD functions: listSeasons, createSeason, updateSeason, deleteSeason, listEpisodes, createEpisode, updateEpisode, deleteEpisode
- TypeScript types: Season, Episode, CreateSeasonData, UpdateSeasonData, CreateEpisodeData, UpdateEpisodeData
- All endpoints match the backend API from plan 03-05

### SeriesForm (admin/src/components/forms/SeriesForm.tsx)
- Complete content form for SERIES type (no duration/videoUrl fields)
- Fields: title, description, releaseYear, ageRating, quality, categories, cast, director, trailerUrl, poster/backdrop images, isPublished
- Uses ImageUploader from 03-07 for drag-and-drop image uploads
- React Hook Form + Zod validation, TanStack Query mutations

### EpisodeForm (admin/src/components/forms/EpisodeForm.tsx)
- Dialog-based form for inline episode creation/editing
- Fields: number, title, description, duration, videoUrl, thumbnailUrl
- Auto-suggests next episode number when creating

### Series List Page (/series)
- Grid/table view toggle with FilterBar, Pagination
- Season count column in table view showing "N seasons" per series
- Publish/unpublish/delete actions with confirmation dialogs
- Click navigates to series detail page (not edit form)

### Series Detail Page (/series/:id)
- Top: SeriesForm in edit mode for series metadata
- Bottom: Season list showing season number, title, episode count
- Add/Edit season via Dialog (number + optional title)
- Delete season with confirmation (warns about cascade)
- "Manage Episodes" button navigates to season detail page

### Season Detail Page (/series/:id/seasons/:seasonId)
- Episode table: number, title, duration, video status badge
- Add/Edit episodes via EpisodeForm dialog
- Delete episodes with confirmation
- Breadcrumb: Series > Title > Season N

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Zod transform type incompatibility with react-hook-form**
- **Found during:** Task 1
- **Issue:** Zod `.transform()` produces output types that conflict with react-hook-form's Resolver generic
- **Fix:** Removed all Zod transforms from form schemas; convert strings to numbers in submit handlers instead
- **Files modified:** SeriesForm.tsx, EpisodeForm.tsx, MovieForm.tsx (from 03-07)
- **Commit:** f735103

## Next Phase Readiness

- Series management UI is complete and functional
- All CRUD operations wired to backend API from 03-05
- Route tree updated with 4 new routes
- No blockers for subsequent plans
