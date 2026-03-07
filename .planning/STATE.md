# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** Users can stream high-quality movies, series, documentaries, and live TV with seamless M-Pesa subscription payments -- affordable, accessible, and built for East Africa.
**Current focus:** Phase 5 - Video Player and User Features

## Current Position

Phase: 4 of 10 complete (Client Browsing Experience)
Plan: 8 of 8 in Phase 4
Status: Complete
Last activity: 2026-03-07 -- Completed Phase 4 (all 8 plans)

Progress: [████████████████████░] 23/~30 total plans

## Performance Metrics

**Velocity:**
- Total plans completed: 23
- Average duration: ~5 min
- Total execution time: ~130 min (including Docker setup + reboot)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 - Foundation | 3/3 | ~48 min | ~16 min |
| 02 - Auth & Sessions | 3/3 | 12 min | 4 min |
| 03 - Content API & Admin | 9/9 | 47 min | 5.2 min |
| 04 - Client Browsing | 8/8 | ~23 min | ~2.9 min |

**Recent Trend:**
- Last 5 plans: 04-04 (3 min), 04-05 (~4 min), 04-06 (~4 min), 04-07 (~3 min), 04-08 (~2 min)
- Trend: Accelerating at ~3 min per plan

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [01-01]: Express 5.2.1, Prisma 6.19.2, Zod 3.25.76, TypeScript 5.9.3 installed as foundation
- [01-01]: api/package.json uses type: module for ESM support (required by Prisma and modern Node.js)
- [01-01]: verbatimModuleSyntax enabled in base tsconfig (enforces explicit type imports)
- [01-02]: DATABASE_URL validated with z.string().min(1) not z.string().url() (Zod URL rejects postgresql://)
- [01-02]: PrismaClient imported from generated path ../generated/prisma/client.js (not @prisma/client)
- [01-02]: Express middleware order: helmet > cors > json > urlencoded > rateLimit > routes > 404 > error
- [01-03]: Prisma 6.19.2 installed (not 7) -- schema uses prisma-client-js provider with url in datasource block
- [01-03]: Docker Desktop 4.63.0 installed with WSL2 backend for PostgreSQL 16
- [02-01]: Zod phone transform uses ctx.addIssue + z.NEVER pattern (proper ZodError propagation)
- [02-01]: Phone regex accepts 07XX and 01XX prefixes for Safaricom and Airtel Kenya
- [02-01]: Removed prisma.config.ts from tsconfig include (outside rootDir, Prisma CLI only)
- [02-02]: Register uses interactive Prisma $transaction for atomic user+referral+session creation
- [02-02]: Login returns discriminated union (deviceLimitReached true/false) for type-safe route handling
- [02-02]: Auth middleware fire-and-forget lastActiveAt update with .catch(() => {}) to avoid latency
- [02-03]: Inline try/catch per route handler for AuthError (prevents double-sending responses)
- [02-03]: Force login endpoint verifies credentials independently, deletes session, then creates new one
- [02-03]: Session cleanup job only logs when sessions are actually removed (quiet hourly runs)
- [Roadmap]: Stack corrected to Next.js 15.5.x (not 14 EOL), Express 5, Prisma 7, argon2, jose
- [Roadmap]: Admin content management placed before client (client needs seeded content)
- [Roadmap]: Video infrastructure isolated into own phase (keyframe errors require full re-transcode)
- [Roadmap]: Payments placed after video pipeline (test payments against real streaming experience)
- [Roadmap]: M-Pesa reconciliation cron required from day one (fire-once callbacks)
- [03-01]: Category model is standalone (no join table); Content.categories stays String[] populated from Category dropdown
- [03-01]: Admin login at dedicated /api/admin/login endpoint (separate from user login)
- [03-01]: requireAdmin middleware always used after requireAuth in chain
- [03-01]: No device limit check for admin sessions
- [03-02]: Admin panel uses bundler moduleResolution (not NodeNext) for Vite compatibility
- [03-02]: Manual route tree instead of TanStack Router codegen plugin
- [03-02]: Sidebar uses anchor tags for future routes (will convert to Link when routes are registered)
- [03-02]: shadcn v4 sonner component replaces deprecated toast component
- [03-03]: Content routes use router.use(requireAuth, requireAdmin) for all routes in router
- [03-03]: Content type immutable after creation (omitted from updateContentSchema)
- [03-03]: Prisma P2025 -> 404, P2002 -> 409 Conflict for inline error handling
- [03-03]: Category slug auto-generated from name via slugify helper
- [03-04]: Multer v2.1.1 with memoryStorage (buffer to Sharp, no temp disk writes)
- [03-04]: Image paths stored as relative (no uploads/ prefix); media route resolves them
- [03-04]: Media route is public (no auth) for admin panel and future client display
- [03-04]: Express 5 wildcard params are string arrays -- joined with "/" for path resolution
- [03-05]: ServiceError class for typed HTTP errors in services (avoids unsafe Error casting)
- [03-05]: getParam helper for Express 5 mergeParams typed access
- [03-05]: isPrismaError helper for clean Prisma error code checking
- [03-06]: TanStack Table with manualSorting for server-side sort via API params
- [03-06]: Edit navigation uses string cast for routes not yet registered (Plan 07 will add detail routes)
- [03-06]: useContentFilters hook uses local state with debounce, not URL search params
- [03-06]: Content list page pattern: PageContainer > FilterBar > Grid/Table > Pagination
- [03-07]: MovieForm reused for MOVIE and DOCUMENTARY via contentType prop
- [03-07]: Categories use toggle button list for visual multi-select (not dropdown)
- [03-07]: Cast uses tag input pattern (Enter to add, X to remove)
- [03-07]: Form stores releaseYear/duration as strings, converts to numbers at submit (Zod transform + react-hook-form incompatibility)
- [03-07]: useParams({ strict: false }) with type assertion for route params
- [03-08]: Zod transforms removed from form schemas; convert strings to numbers in submit handlers (react-hook-form resolver incompatibility)
- [03-08]: Season CRUD uses simple Dialog with controlled inputs (only 2 fields)
- [03-08]: EpisodeForm auto-suggests next episode number based on existing episodes
- [04-03]: Motion AnimatePresence with mode="popLayout" for hero slide crossfade
- [04-03]: HeroSlide uses three-state media machine (image/buffering/video) for predictable fallback
- [04-03]: 1.5s delay before video load to let backdrop establish visual
- [04-03]: IntersectionObserver threshold 0.3 on hero banner to pause video early
- [04-04]: CSS media queries for responsive card sizing (avoids hydration mismatches vs JS approach)
- [04-04]: 100ms close grace period on hover popover (prevents flicker when moving mouse to popover)
- [04-04]: Fixed positioning for popover with viewport-aware edge clamping
- [04-05]: API client functions are plain async (not hooks) -- used inside TanStack Query's queryFn
- [04-05]: DetailModal uses isFullPage prop to toggle between modal overlay and full page rendering
- [04-05]: Motion AnimatePresence wraps modal for opacity + translateY entrance animation
- [04-05]: EpisodeList uses local state for season selection (no URL params needed)
- [04-06]: Search results use list layout with small poster thumbnails (not full cards) for density
- [04-06]: ChannelCard uses Link component for navigation (accessibility + SEO)
- [04-06]: Search overlay z-60 above navbar z-50 with bg-background/95 backdrop-blur

### Pending Todos

None yet.

### Blockers/Concerns

- Daraja sandbox reported unstable (Jan 2026) -- may need Pesa Playground alternative for Phase 7
- Safaricom production go-live approval takes 2-3 weeks -- submit application during Phase 7, not after
- HLS AES-128 encryption decision deferred -- revisit during Phase 6 planning
- prisma migrate dev fails in non-interactive terminal -- use manual migration SQL + prisma migrate deploy

## Session Continuity

Last session: 2026-03-07
Stopped at: Completed Phase 4 (all 8 plans verified)
Resume file: None

IMPORTANT CONTEXT:
- This project uses ESM ("type": "module" in api/package.json). All imports must use .js extensions.
- PrismaClient is imported from "../generated/prisma/client.js" (not @prisma/client)
- Express 5.2.1 auto-catches async errors (no need for express-async-errors)
- The api uses Zod for validation, argon2 for password hashing, jose for JWT
- node-cron v4 has built-in TypeScript types
- ua-parser-js v1 is installed (MIT license, NOT v2 AGPL)
- Login returns discriminated union: { deviceLimitReached: true, devices } | { deviceLimitReached: false, user, token }
- Auth service exports: register, login, logout, changePassword, forgotPassword, resetPassword, AuthError
- Session service exports: createSession, enforceDeviceLimit, getUserSessions, deleteSession, deleteOtherSessions, cleanupStaleSessions
- Auth middleware exports: requireAuth, requireAdmin
- Admin service exports: adminLogin (rejects non-admin users with generic error)
- Routes registered: /api/auth (7 endpoints), /api/sessions (2 endpoints), /api/admin (1 endpoint), /api/admin/content (7 endpoints), /api/admin/categories (4 endpoints), /api/admin/upload (2 endpoints), /api/media (1 endpoint), /api/admin/content/:contentId/seasons (8 endpoints)
- Season service exports: listSeasons, createSeason, updateSeason, deleteSeason, listEpisodes, createEpisode, updateEpisode, deleteEpisode, ServiceError
- Season validators exports: createSeasonSchema, updateSeasonSchema, createEpisodeSchema, updateEpisodeSchema
- Content service exports: listContent, getContent, createContent, updateContent, deleteContent, publishContent, unpublishContent
- Category service exports: listCategories, createCategory, updateCategory, deleteCategory
- Content validators exports: contentQuerySchema, createContentSchema, updateContentSchema
- Category validators exports: createCategorySchema, updateCategorySchema
- Admin seed account: admin@lumio.tv / AdminPass123! (phone: +254700000001)
- Session cleanup job starts on server boot with hourly cron schedule
- Admin panel: React 19 + Vite 6 + Tailwind 4 + shadcn/ui (dark theme) at localhost:3001
- Admin panel uses "type": "module" in package.json, bundler moduleResolution in tsconfig
- Admin API client (admin/src/api/client.ts) uses Axios with Bearer token from localStorage
- Admin auth context (admin/src/hooks/useAuth.tsx) exports AuthProvider and useAuth
- Admin routes use TanStack Router with manual route tree (admin/src/routeTree.gen.ts)
- Vite proxies /api/* to localhost:5000 in dev mode
- Upload service exports: processImage(buffer, type), deleteImageSet(paths)
- Upload config: UPLOAD_DIR, IMAGE_SIZES (poster: 3 sizes, backdrop: 2 sizes), MAX_FILE_SIZE (10MB)
- Upload middleware exports: imageUpload (multer instance), handleMulterError
- Media route serves files from api/uploads/ directory (public, no auth)
- Image paths are relative (e.g., "posters/large/uuid-large.webp") -- media route resolves against UPLOAD_DIR
- shadcn components installed: button, input, label, card, badge, separator, dropdown-menu, dialog, sheet, sonner, table, select, skeleton, alert-dialog, switch, textarea
- @tanstack/react-table installed for data table views
- Admin content API client (admin/src/api/content.ts) exports: listContent, getContent, createContent, updateContent, deleteContent, publishContent, unpublishContent
- Admin categories API client (admin/src/api/categories.ts) exports: listCategories, createCategory, updateCategory, deleteCategory
- Content list page routes registered: /movies, /documentaries, /channels
- Shared components: FilterBar, StatusBadge, Pagination, ContentCard, ContentGrid, ContentTable
- Content column defs: getMovieColumns, getDocumentaryColumns, getChannelColumns, getSeriesColumns
- useContentFilters hook manages: status, category, search (debounced 300ms), page, sortBy, sortOrder, viewMode
- Admin upload API client (admin/src/api/upload.ts) exports: uploadPoster, uploadBackdrop
- ImageUploader component: drag-and-drop with react-dropzone, poster (2:3) and backdrop (16:9) types
- MovieForm component: shared for MOVIE and DOCUMENTARY, React Hook Form + Zod, all content fields
- ChannelForm component: simplified for CHANNEL with streamUrl field
- Content create/edit routes registered: /movies/new, /movies/$movieId, /documentaries/new, /documentaries/$docId, /channels/new, /channels/$channelId, /series, /series/new, /series/$seriesId, /series/$seriesId/seasons/$seasonId
- Admin seasons API client (admin/src/api/seasons.ts) exports: listSeasons, createSeason, updateSeason, deleteSeason, listEpisodes, createEpisode, updateEpisode, deleteEpisode
- SeriesForm component: like MovieForm but for SERIES (no duration/videoUrl), with ImageUploader
- EpisodeForm component: Dialog-based form for episode CRUD (number, title, description, duration, videoUrl, thumbnailUrl)
- react-hook-form, @hookform/resolvers, react-dropzone installed in admin workspace
- Client: Next.js 15.5.9 at client/, Tailwind CSS 4, Motion v12 (import from "motion/react"), Zustand 5
- Client uses bundler moduleResolution (no .js extensions on imports)
- Client path alias: @/* maps to ./src/*
- Client types: Content, Season, Episode, ContentDetail, BrowseRow, BrowsePageData, LiveTvData, SearchResults (client/src/types/content.ts)
- Client utils: cn, formatDuration, mediaUrl (client/src/lib/utils.ts)
- Client store: useUIStore with isSearchOpen state (client/src/stores/ui.ts)
- Hero hooks: useHeroBanner (auto-rotation, pause/resume), useIntersection (IntersectionObserver wrapper)
- Hero components: HeroBanner (full-width auto-rotating), HeroSlide (image-to-video crossfade), HeroControls (dot indicators)
- Content row components: ContentRow (horizontal scroll with arrows), ContentCard (poster + title), HoverPopover (enlarged card with metadata)
- Content row hooks: useContentRow (scroll tracking, arrow visibility), useHoverPopover (500ms delay, shared hover zone)
- .content-card CSS class provides responsive sizing: 2/3/4/5/6 cards at breakpoints <500/500/800/1100/1400px
- Search: useSearch hook (debounce + keyboard shortcuts), SearchOverlay (full-screen, z-60), SearchResults (grouped by type)
- Live TV: ChannelCard (poster + pulsing LIVE badge), ChannelGrid (category sections), /live-tv page
- Client API: content.ts exports fetchHomePageData, fetchBrowsePageData, fetchLiveTvData, fetchTitleDetail, fetchSimilarTitles, searchContent
- Detail components: DetailModal (overlay/full-page), EpisodeList (season dropdown), MoreLikeThis (similar grid)
- Detail routes: /title/[id] (full page), @modal/(.)title/[id] (intercepting route for modal overlay)
