# Phase 3: Content API and Admin Content Management - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin users can manage the full content catalog (movies, series, documentaries, TV channels) through a dedicated admin panel, and the content API serves structured data for the client. Includes admin authentication, content CRUD, category management, image upload, and poster/backdrop storage.

Requirements: ADMN-01, ADMN-05, ADMN-06, ADMN-07, ADMN-08.

</domain>

<decisions>
## Implementation Decisions

### Admin panel tech & auth
- Separate app in admin/ workspace (own build, not part of client Next.js app)
- Dedicated admin login endpoint (/api/admin/login), not shared with user auth
- Single admin role — either you have admin access or you don't
- Super-admin can create other admin accounts from the admin panel (no self-registration)

### Content form fields & UX
- Full Netflix-style fields for movies: title, year, duration, age rating, quality (HD/4K), categories/genres, cast, director, description, poster image, backdrop image, trailer URL, video file reference
- Video files referenced by URL/path only — actual upload happens in Phase 6 (video infrastructure)
- Categories/genres managed by admins: admin can create, edit, delete categories from a settings/categories page
- Series form uses separate pages: create series first, then navigate to manage seasons, then episodes as sub-pages

### Content catalog display
- Toggle between poster card grid and data table views
- Draft/Published status workflow (draft = hidden from users, published = visible)
- Filter bar: status pill buttons [All] [Published] [Draft] + category dropdown + search text input
- No content type filter needed — each type has its own management page (Movies, Series, Documentaries, TV Channels as separate sidebar items)
- Table view columns are sortable by click (year, quality, date added, etc.)
- No bulk actions for v1 — one-at-a-time operations only

### Image upload & storage
- Drag-and-drop zone for image uploads with preview thumbnail shown after upload
- Two images per content item: vertical poster (for card grids) and horizontal backdrop (for hero banner/detail modal)
- Server-side auto-resize/optimization: generate multiple sizes (thumbnail, medium, large) from upload
- Local storage for development — R2 integration added later (not set up yet)

### Claude's Discretion
- Admin panel framework choice (Next.js, React + Vite, etc.)
- Admin panel UI component library
- Image resize dimensions and format (WebP, JPEG)
- Local storage directory structure
- API endpoint design for content CRUD
- Admin panel sidebar navigation structure
- Form validation approach
- Pagination strategy for content lists

</decisions>

<specifics>
## Specific Ideas

- Filter bar layout: `[All] [Published] [Draft]    Category: [All Categories ▾]    🔍 Search...` — status as pill buttons, category as dropdown pulling from admin-managed list, search with real-time filtering
- Each content type has its own sidebar page — no need for a unified "all content" page with type filter
- Series management is hierarchical navigation: Series list → Series detail (with seasons) → Season detail (with episodes)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-content-api-and-admin-content-management*
*Context gathered: 2026-03-07*
