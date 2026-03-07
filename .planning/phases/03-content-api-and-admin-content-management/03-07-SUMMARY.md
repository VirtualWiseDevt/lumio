---
phase: 03-content-api-and-admin-content-management
plan: 07
subsystem: admin-panel
tags: [react, forms, image-upload, react-hook-form, zod, react-dropzone]
depends_on:
  requires: ["03-04", "03-06"]
  provides: ["content-create-edit-forms", "image-uploader-component", "content-route-pages"]
  affects: ["03-08", "03-09"]
tech_stack:
  added: ["react-hook-form", "@hookform/resolvers", "react-dropzone"]
  patterns: ["two-column-form-layout", "tag-input", "category-toggle-select", "image-upload-with-preview"]
key_files:
  created:
    - admin/src/api/upload.ts
    - admin/src/components/shared/ImageUploader.tsx
    - admin/src/components/forms/MovieForm.tsx
    - admin/src/components/forms/ChannelForm.tsx
    - admin/src/routes/_authenticated/movies/new.tsx
    - admin/src/routes/_authenticated/movies/$movieId.tsx
    - admin/src/routes/_authenticated/documentaries/new.tsx
    - admin/src/routes/_authenticated/documentaries/$docId.tsx
    - admin/src/routes/_authenticated/channels/new.tsx
    - admin/src/routes/_authenticated/channels/$channelId.tsx
  modified:
    - admin/src/routeTree.gen.ts
    - admin/package.json
decisions:
  - id: "03-07-01"
    decision: "MovieForm reused for both MOVIE and DOCUMENTARY content types via contentType prop"
  - id: "03-07-02"
    decision: "Categories use toggle button list (not dropdown) for visual multi-select"
  - id: "03-07-03"
    decision: "Cast uses tag input pattern with Enter to add, X to remove"
  - id: "03-07-04"
    decision: "Form stores releaseYear/duration as strings, converts to numbers at submit time (avoids Zod transform issues with react-hook-form)"
  - id: "03-07-05"
    decision: "useParams uses strict:false with type assertion for route params (matches 03-06 pattern for unregistered route types)"
metrics:
  duration: "~5 min"
  completed: "2026-03-07"
---

# Phase 3 Plan 7: Content Create/Edit Forms and Image Upload Summary

**One-liner:** React Hook Form + Zod validated content forms with drag-and-drop image upload via react-dropzone, covering movies, documentaries, and TV channels.

## What Was Built

### Task 1: Image Uploader Component and Upload API Client
- **Upload API client** (`admin/src/api/upload.ts`): `uploadPoster(file)` and `uploadBackdrop(file)` functions that POST FormData to the upload endpoints, returning image paths
- **ImageUploader component** (`admin/src/components/shared/ImageUploader.tsx`): Reusable drag-and-drop image upload with three states (idle dropzone, uploading spinner, preview with replace button). Supports poster (2:3 aspect) and backdrop (16:9 aspect) types. File validation: JPEG/PNG/WebP only, 10MB max. Toast errors for invalid files.

### Task 2: Content Forms and Route Pages
- **MovieForm** (`admin/src/components/forms/MovieForm.tsx`): Full-featured form for movies and documentaries with: title, description, release year, duration, age rating (select), quality (select), director, cast (tag input), categories (toggle buttons), trailer URL, video URL, poster image, backdrop image, published toggle. Two-column layout on desktop. "Save as Draft" and "Save & Publish" buttons.
- **ChannelForm** (`admin/src/components/forms/ChannelForm.tsx`): Simplified form for TV channels with: title, description, stream URL (required), categories, poster/backdrop images, published toggle.
- **6 route pages**: Create and edit pages for movies, documentaries, and channels. Edit pages fetch content by ID with loading skeleton and 404 error state. All pages have back navigation to list pages.
- **Route tree updated** with all 6 new routes registered.

### shadcn Components Added
- Switch (for publish toggle)
- Textarea (for description fields)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Zod transform incompatibility with react-hook-form**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Zod schema with `.transform()` for releaseYear/duration caused type mismatch between form input type (string) and API payload type (number). A linter also simplified the schema to remove transforms.
- **Fix:** Keep form values as strings in Zod schema, convert to numbers manually in the `onSubmit` handler before calling API. Used `Record<string, unknown>` for payload type.
- **Files modified:** `admin/src/components/forms/MovieForm.tsx`

**2. [Rule 3 - Blocking] TanStack Router useParams type narrowing**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `useParams({ from: "/movies/$movieId" as string })` produced union type that couldn't destructure `movieId`. TanStack Router generates strict types from registered routes.
- **Fix:** Used `useParams({ strict: false })` with type assertion `as { movieId?: string }`, matching the pattern established in 03-06 for routes with unresolved types.
- **Files modified:** All 3 edit route pages

## Verification

- TypeScript compiles clean (`npx tsc --noEmit` passes)
- All required files created with correct exports
- MovieForm: 454 lines (min 80 required)
- ChannelForm: 225 lines (min 40 required)
- ImageUploader: 143 lines (min 40 required)
- Forms use createContent/updateContent from content API
- ImageUploader calls uploadPoster/uploadBackdrop from upload API

## Commits

| Hash | Description |
|------|-------------|
| c8349aa | feat(03-07): add image uploader component and upload API client |
| 91a0546 | feat(03-07): add content create/edit forms and route pages |

## Next Phase Readiness

All content create/edit functionality is in place. Movies, documentaries, and channels can be created and edited through the admin panel with full form validation, image upload, and API integration. Plan 03-08 (series management) and 03-09 (remaining admin features) can proceed.
