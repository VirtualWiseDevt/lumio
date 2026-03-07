---
phase: 06-video-infrastructure
plan: 05
subsystem: admin-video-upload
tags: [admin, video-upload, r2, presigned-url, transcoding-badge]
dependencies:
  requires: ["06-02"]
  provides: ["admin-video-upload-ui", "transcoding-status-display"]
  affects: ["06-06", "06-07"]
tech-stack:
  added: []
  patterns: ["presigned-upload", "direct-to-r2-browser-upload"]
key-files:
  created:
    - admin/src/api/video-upload.ts
    - admin/src/components/content/VideoUploader.tsx
    - admin/src/components/content/TranscodingBadge.tsx
  modified:
    - admin/src/api/content.ts
    - admin/src/api/seasons.ts
    - admin/src/components/forms/MovieForm.tsx
    - admin/src/components/forms/EpisodeForm.tsx
    - admin/src/routes/_authenticated/series/$seriesId.seasons.$seasonId.tsx
decisions: []
metrics:
  duration: "~4 min"
  completed: "2026-03-07"
---

# Phase 06 Plan 05: Admin Video Upload UI Summary

Video upload API client and UI components for admin panel with direct R2 upload via presigned URLs and transcoding status badges.

## What Was Done

### Task 1: Video upload API client and components
- Created `video-upload.ts` API client with `getPresignedUploadUrl` and `confirmVideoUpload` functions
- Created `VideoUploader` component with states: idle, uploading, uploaded, error
- Upload flow: file select -> presigned URL from API -> PUT directly to R2 -> confirm with API
- 5GB file size validation, accepts MP4/MKV/MOV
- Created `TranscodingBadge` component with color-coded status badges (pending/yellow, processing/blue+pulse, completed/green, failed/red with error tooltip)

### Task 2: Integrate into content forms
- Added `sourceVideoKey`, `transcodingStatus`, `transcodingError`, `hlsKey` fields to Content and Episode types
- Integrated VideoUploader into MovieForm (shared for MOVIE and DOCUMENTARY) in edit mode only
- Integrated VideoUploader into EpisodeForm dialog with contentId and episodeId props
- Added TranscodingBadge to MovieForm title area and EpisodeForm dialog title
- Updated episode table in season detail page to show TranscodingBadge for episodes with video
- Create mode shows "Save content first" placeholder instead of uploader
- Upload completion invalidates TanStack Query cache to refresh form data

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Commit | Description |
|--------|-------------|
| c9840c4 | feat(06-05): create video upload API client and components |
| fa3eda3 | feat(06-05): integrate VideoUploader into content forms |

## Verification

- TypeScript compiles without errors (`npx tsc --noEmit`)
- Vite production build succeeds (`npx vite build`)
- VideoUploader renders on movie/documentary edit pages
- VideoUploader renders in episode edit dialog
- TranscodingBadge shows correct color/text for each status
- 5GB file size validation prevents oversized uploads
- No video upload on create pages (must save content first)
- No video upload on ChannelForm (channels use streamUrl)
