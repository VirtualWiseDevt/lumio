# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** Users can stream high-quality movies, series, documentaries, and live TV with seamless M-Pesa subscription payments -- affordable, accessible, and built for East Africa.
**Current focus:** Phase 10 - Admin Operations and Dashboard

## Current Position

Phase: 10 of 10 (Admin Operations and Dashboard)
Plan: 1 of 6 in Phase 10
Status: In progress
Last activity: 2026-03-08 -- Completed 10-01-PLAN.md (admin services + validators)

Progress: [█████████████████████████████████████████████████░░░░░] 50/~55 total plans

## Performance Metrics

**Velocity:**
- Total plans completed: 50
- Average duration: ~4 min
- Total execution time: ~214 min (including Docker setup + reboot)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 - Foundation | 3/3 | ~48 min | ~16 min |
| 02 - Auth & Sessions | 3/3 | 12 min | 4 min |
| 03 - Content API & Admin | 9/9 | 47 min | 5.2 min |
| 04 - Client Browsing | 8/8 | ~23 min | ~2.9 min |
| 05 - Video Player & User | 9/9 | ~20 min | ~2.2 min |
| 06 - Video Infrastructure | 7/7 | ~29 min | ~4.1 min |
| 07 - Payments & Subscriptions | 6/6 | ~16 min | ~2.7 min |
| 08 - Referral & Invite Model | 6/6 | ~15 min | ~2.5 min |

| 09 - Notifications & Jobs | 4/4 | ~11 min | ~2.8 min |
| 10 - Admin Operations | 1/6 | ~5 min | ~5 min |

**Recent Trend:**
- Last 5 plans: 10-01 (~5 min), 09-04 (~3 min), 09-03 (~3 min), 09-02 (~3 min), 09-01 (~2 min)
- Trend: Admin phase started, first plan includes schema migration + 5 services + 4 validators

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
- [05-02]: Watchlist model reused as My List backing store (no new model)
- [05-02]: isPrismaError helper for P2002 phone uniqueness in user service
- [05-02]: getUserSubscription returns null when no active subscription (not error)
- [05-03]: Player store uses individual setter functions for granular Zustand reactivity
- [05-03]: API client functions follow plain async pattern (not hooks) for TanStack Query compatibility
- [05-03]: User sessions API reuses existing /sessions endpoints from Phase 2
- [05-01]: Prisma compound unique with nullable episodeId requires type assertion (null works at runtime)
- [05-01]: Continue-watching route registered BEFORE /:contentId to prevent Express param matching
- [05-01]: Hybrid threshold: max(120s, 5% duration), exclude completed (90%+), exclude <2min content
- [05-04]: useHls dynamically imports hls.js inside useEffect to avoid SSR "self is not defined"
- [05-04]: Touch zones gated on !showControls so taps interact with control buttons when visible
- [05-04]: screenfull imported dynamically in keyboard handler and fullscreen button
- [05-04]: ProgressBar uses group-hover pattern for scrubber dot and bar height expansion
- [05-04]: formatTime helper local to ProgressBar (different from formatDuration which formats minutes)
- [05-05]: Broad invalidation of ["my-list"] on settle ensures /my-list page cache stays in sync with individual toggles
- [05-05]: MyListButton uses stopPropagation + preventDefault to work inside clickable card containers
- [05-06]: Auto-renew toggle disabled with Phase 7 dependency note (no PATCH endpoint yet)
- [05-06]: Device removal uses inline confirm/cancel pattern instead of modal dialog
- [05-06]: Newsletter value read via unknown cast since UserProfile type lacks newsletter field
- [05-07]: sendBeacon uses Blob with application/json type (Express ignores text/plain)
- [05-07]: 90% completion triggers next-episode overlay (matches server threshold)
- [05-07]: loadedmetadata event for reliable initial time seek instead of setTimeout
- [05-07]: isAdvancing ref prevents race conditions in next-episode auto-advance
- [05-08]: MyListButton replaces static Plus button in HoverPopover and DetailModal
- [05-08]: Auth interceptor reads token from localStorage key "token" and sets Bearer header
- [05-08]: MyListRow uses retry: false to silently fail when user is not authenticated
- [05-08]: ContentCard progress bar is 3px with bg-red-600 overlay at bottom of image area
- [06-01]: IORedis imported as named export { Redis } for ESM/verbatimModuleSyntax compatibility
- [06-01]: R2 env vars use 'placeholder' values in docker-compose (min(1) validation requires non-empty)
- [06-01]: Transcoding status stored as String? (not Prisma enum) to avoid migration complexity
- [06-01]: FFmpeg 8.0.1 available in Alpine (exceeds 6.x+ requirement)
- [06-03]: ioredis connection cast to `never` for BullMQ Queue/Worker (dual ioredis version type mismatch)
- [06-03]: Sequential quality encoding per preset (not parallel) for single-server CPU management
- [06-03]: Segment duration 4 seconds for balanced seek granularity vs segment count
- [06-02]: R2 service accepts Buffer | Readable for uploadToR2 (supports both transcoded buffers and streams)
- [06-02]: headR2Object catches NotFound and NoSuchKey errors, returns null (S3-compatible)
- [06-02]: Presign key pattern: videos/{contentId}[/episodes/{episodeId}]/raw/source.{ext}
- [06-02]: ffprobe allowed codecs: h264, hevc, vp9, mpeg4, prores, dnxhd, vp8, av1
- [08-01]: Referral code generated at registration via crypto.randomBytes(4).toString("hex")
- [08-01]: AdminInviteCode model for bootstrapping initial users (code, maxUses, usedCount, isActive)
- [08-01]: CouponRedemption model with @@unique([couponId, userId]) for per-user tracking
- [08-02]: Credit deduction deferred to callback success (not initiation) to prevent credit loss on failed M-Pesa payments
- [08-02]: KES 0 path creates SUCCESS payment with method "CREDITS" atomically (no M-Pesa needed)
- [08-02]: grantReferralCreditIfFirst checks SUCCESS payment count === 1 for first-payment grant
- [08-02]: Registration checks User.referralCode first, falls back to AdminInviteCode (no Referral for admin codes)
- [08-04]: Navbar hidden on /register and /login paths (auth pages are standalone)
- [08-04]: Register page debounces referral code validation at 500ms with real-time feedback
- [08-05]: CouponInput expandable "Have a promo code?" pattern with validate/apply/remove
- [08-05]: PaymentModal shows line item breakdown (plan - coupon - credits = total), "Activate Free" for KES 0
- Routes registered: /api/referrals (3 endpoints), /api/coupons (1 endpoint), /api/admin/invite-codes (3 endpoints)
- Client pages: /register, /login, /invite, /billing (updated with coupon+credits)
- Client API: auth.ts (register, login, validateReferralCode, forceLogin), referral.ts (getMyReferralCode, getReferralStats)
- Admin invite codes page at /invite-codes with generate, list, copy, toggle

### Pending Todos

None yet.

### Blockers/Concerns

- Daraja sandbox reported unstable (Jan 2026) -- may need Pesa Playground alternative for Phase 7
- Safaricom production go-live approval takes 2-3 weeks -- submit application during Phase 7, not after
- HLS AES-128 encryption decision deferred -- revisit during Phase 6 planning
- prisma migrate dev fails in non-interactive terminal -- use manual migration SQL + prisma migrate deploy

## Session Continuity

Last session: 2026-03-08
Stopped at: Completed 10-01-PLAN.md (admin services + validators)
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
- Routes registered: /api/auth (7 endpoints), /api/sessions (2 endpoints), /api/admin (1 endpoint), /api/admin/content (7 endpoints), /api/admin/categories (4 endpoints), /api/admin/upload (2 endpoints), /api/media (1 endpoint), /api/admin/content/:contentId/seasons (8 endpoints), /api/my-list (4 endpoints), /api/user (4 endpoints), /api/progress (3 endpoints)
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
- Player types: PlayerState, ProgressData, ContinueWatchingItem, MyListItem, UserProfile, UserSubscription, DeviceSession (client/src/types/player.ts)
- Player store: usePlayerStore with all state fields, individual setters, and reset() (client/src/stores/player.ts)
- Client API: progress.ts exports saveProgress, getProgress, getContinueWatching
- Client API: my-list.ts exports getMyList, isInMyList, addToMyList, removeFromMyList
- Client API: user.ts exports getUserProfile, updateUserProfile, updatePreferences, getUserSubscription, getUserSessions, deleteSession
- hls.js ^1.6.15 and screenfull ^6.0.2 installed in client workspace
- My List service exports: getMyList, isInMyList, addToMyList, removeFromMyList (uses Watchlist model)
- User service exports: getUserProfile, updateUserProfile, updatePreferences, getUserSubscription
- User validators exports: updateProfileSchema, updatePreferencesSchema
- Progress service exports: saveProgress, getProgress, getContinueWatching
- Progress validators exports: saveProgressSchema, continueWatchingQuerySchema
- Player hooks: useHls (HLS/MP4 source), useVideoPlayer (event wiring to store), usePlayerControls (auto-hide, keyboard shortcuts)
- Player components: VideoPlayer (container), PlayerControls (overlay chrome), ProgressBar (scrubber), VolumeControl (slider), BufferingIndicator (spinner + slow hint)
- Watch page: /watch/[id]?episode=[episodeId] renders full-viewport player with progress resume
- Account components: ProfileSection, SubscriptionSection, DeviceSection, PreferencesSection (client/src/components/account/)
- Account page at /account renders all 4 sections with TanStack Query for data fetching/mutations
- useMyList hook: optimistic toggle with TanStack Query (client/src/hooks/use-my-list.ts)
- MyListButton component: circular Plus/Check toggle with sm/md/lg sizes (client/src/components/my-list/MyListButton.tsx)
- /my-list page: responsive grid with skeleton loading and empty state (client/src/app/my-list/page.tsx)
- useProgressTracking hook: 10s interval saves + pause event + sendBeacon on unload (client/src/hooks/use-progress-tracking.ts)
- NextEpisodeOverlay: 10s countdown with thumbnail, episode label, play now / cancel (client/src/components/player/NextEpisodeOverlay.tsx)
- ContinueWatchingRow: TanStack Query with time filter, red progress bars, click navigates to /watch (client/src/components/content/ContinueWatchingRow.tsx)
- VideoPlayer now integrates progress tracking and next episode overlay
- Watch page resolves next episode across seasons and uses loadedmetadata for initial seek
- HoverPopover uses MyListButton (size="sm") instead of static Plus button
- DetailModal uses MyListButton (size="md") and Play navigates to /watch/[id]
- PlayerControls accepts contentId prop and renders MyListButton in top-right
- Home page renders ContinueWatchingRow and MyListRow above browse rows
- API client (client/src/api/client.ts) has axios request interceptor for Bearer token from localStorage
- ContentCard accepts optional progressPercent prop for red progress bar overlay
- Navbar includes My List (/my-list) and Account (/account) links
- Redis 7 running in Docker (lumio-redis container) alongside PostgreSQL
- FFmpeg 8.0.1 and ffprobe available inside API container (apk add ffmpeg)
- R2 S3Client configured at api/src/config/r2.ts, exports r2Client and R2_BUCKET_NAME
- IORedis client at api/src/config/redis.ts with maxRetriesPerRequest: null (BullMQ requirement)
- Content and Episode models have transcodingStatus, transcodingError, sourceVideoKey, hlsKey fields
- Transcode types at api/src/types/transcode.types.ts: TranscodingStatus, QualityPreset, TranscodeJobData, TranscodeResult, QUALITY_PRESETS
- bullmq@5.70.4, ioredis@5.10.0, @aws-sdk/client-s3@3.1004.0, @aws-sdk/s3-request-presigner@3.1004.0 installed in api
- R2 service exports: generatePresignedUploadUrl, generatePresignedDownloadUrl, uploadToR2, deleteFromR2, deleteR2Prefix, listR2Objects, headR2Object, streamR2ToFile
- Video upload routes: POST /api/admin/video-upload/presign (presigned PUT URL), POST /api/admin/video-upload/confirm (ffprobe validate + store sourceVideoKey)
- Routes registered: /api/admin/video-upload (2 endpoints) added to existing route list
- Transcode service exports: probeSource, transcodeToHls, generateMasterPlaylist (api/src/services/transcode.service.ts)
- Transcode job exports: transcodeQueue, startTranscodeWorker, enqueueTranscode (api/src/jobs/transcode.job.ts)
- BullMQ queue "transcode" with 2 attempts, 30s fixed backoff, concurrency 1
- Transcode worker starts on server boot (startTranscodeWorker() in server.ts)
- Cache-Control on R2 uploads: .ts segments immutable (1yr), .m3u8 playlists 60s TTL
- Episode HLS prefix: videos/{contentId}/episodes/{episodeId}/hls/, Content: videos/{contentId}/hls/
- Stream service exports: getStreamPlaylist, getQualityPlaylist (api/src/services/stream.service.ts)
- Stream routes: GET /api/stream/:contentId (master playlist), GET /api/stream/:contentId/:quality (quality playlist with presigned segments)
- Routes registered: /api/stream (2 endpoints) added to existing route list
- publishContent auto-enqueues transcode for content and episodes with sourceVideoKey
- Video upload API client (admin/src/api/video-upload.ts) exports: getPresignedUploadUrl, confirmVideoUpload
- VideoUploader component: direct R2 upload via presigned PUT, 5GB limit, MP4/MKV/MOV (admin/src/components/content/VideoUploader.tsx)
- TranscodingBadge component: status-colored badges pending/processing/completed/failed (admin/src/components/content/TranscodingBadge.tsx)
- VideoUploader integrated into MovieForm (edit mode only) and EpisodeForm (edit mode with contentId + episodeId)
- Content and Episode admin types include sourceVideoKey, transcodingStatus, transcodingError, hlsKey fields
- [06-07]: Cloudflare Referer check WAF rule deferred to pre-production (user will configure when CDN domain ready)
- [06-07]: Admin UI verification deferred (user confirmed pipeline ready, will test with real R2 credentials)
- [07-01]: getMpesaClient is async factory using dynamic imports (avoids loading unused implementation)
- [07-01]: MockMpesaClient uses string variable for dynamic import to avoid TS2307 on not-yet-created payment.service.ts
- [07-01]: Mock callback success/failure by amount % 100: ending in 01 fails, others succeed
- [07-01]: DarajaMpesaClient generates EAT timestamps via UTC+3 offset (no timezone library)
- [06-06]: Auth header only on /api/ URLs in hls.js xhrSetup (presigned R2 segment URLs reject extra headers)
- [06-06]: hlsKey check determines stream endpoint vs direct URL (set only after successful transcoding)
- Client API: content.ts also exports getStreamUrl(contentId, episodeId?) for HLS stream endpoint URLs
- Client types: ContentDetail and Episode now include transcodingStatus, hlsKey, sourceVideoKey fields
- Watch page prefers /api/stream/:contentId for transcoded content, falls back to direct videoUrl/streamUrl
- useHls hook xhrSetup sends Bearer token on API playlist requests only (not on presigned R2 segment URLs)
- MpesaClient interface at api/src/config/mpesa.ts exports: STKPushParams, STKPushResponse, STKQueryResponse, MpesaClient, getMpesaClient, mpesaConfig, DARAJA_BASE_URL
- DarajaMpesaClient at api/src/services/mpesa.service.ts: OAuth token caching (5min buffer), STK Push, STK Query
- MockMpesaClient at api/src/services/mpesa-mock.service.ts: simulated callbacks, amounts ending in 01 fail
- normalizePhoneForDaraja at api/src/utils/phone.ts: converts +254/254/07/01 to 254XXXXXXXXX
- Subscription plans seeded: Weekly (500/7d), Monthly (1250/30d), Quarterly (3000/90d) via api/prisma/seed-plans.ts
- Payment model has idempotencyKey (String? @unique), rawCallback (Json?), reconciliationAttempts (Int @default(0))
- M-Pesa env vars: MPESA_ENVIRONMENT (mock/sandbox/production), MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL
- [07-02]: rawCallback stored as Prisma.InputJsonValue cast (Prisma Json type compatibility)
- [07-02]: Subscription stacking: new sub extends from existing active sub's expiresAt, old sub marked EXPIRED
- [07-02]: TxClient type derived from PrismaClient $transaction parameter types (no manual interface)
- [07-02]: requireSubscription middleware returns 403 with SUBSCRIPTION_REQUIRED code
- Payment service exports: initiatePayment, processCallback, getPaymentStatus, getPaymentHistory
- Subscription service exports: activateSubscription, hasActiveSubscription, getActiveSubscription
- Subscription middleware exports: requireSubscription
- Payment validators exports: initiatePaymentSchema, callbackSchema
- [07-03]: SubscriptionInfo type separate from UserSubscription (more fields: id, autoRenew)
- [07-03]: pollPaymentStatus uses 3s interval / 20 max attempts (60s total timeout)
- [07-03]: useSubscription urgency thresholds: green (7+), yellow (3-7), red (<3 days)
- Client billing types: Plan, Payment, PaymentStatus, SubscriptionInfo, InitiatePaymentResponse, PaymentStatusResponse, PaymentHistoryResponse (client/src/types/billing.ts)
- Client billing API: getPlans, initiatePayment, getPaymentStatus, pollPaymentStatus, getPaymentHistory, getSubscription (client/src/api/billing.ts)
- useSubscription hook: TanStack Query with isActive, daysRemaining, urgency color, refetch (client/src/hooks/use-subscription.ts)
- [07-05]: PaymentModal three-step flow: confirm (phone pre-fill) -> waiting (3s poll) -> result (success/failed/timeout)
- [07-05]: PaymentHistory self-fetching component with TanStack Query pagination
- [07-05]: PlanCard "Best Value" badge on Monthly plan, "Current Plan" badge on active plan
- [07-05]: Billing page conditionally renders SubscriptionStatus (isActive) or value pitch (first-time)
- [07-06]: SubscribeGate modal blocks playback with AnimatePresence overlay and /billing link
- [07-06]: Watch page checks subscription before content loading (early block, not post-load overlay)
- [07-06]: HoverPopover Play button navigates to /watch/[id] and gates on subscription (was previously no-op)
- Billing components: PlanCard, PlanGrid, SubscriptionStatus, PaymentModal, PaymentHistory (client/src/components/billing/)
- Billing page at /billing assembles all billing components with plan selection and payment flow
- SubscribeGate component: modal overlay for expired users, props isOpen/onClose, link to /billing (client/src/components/billing/SubscribeGate.tsx)
- Watch page, HoverPopover, and DetailModal all gate playback via useSubscription().isActive + SubscribeGate
- [07-04]: Plans endpoint public (no auth) for SEO and billing page pre-auth loading
- [07-04]: M-Pesa callback always returns 200 with ResultCode 0 regardless of processing outcome
- [07-04]: Reconciliation success path uses console.log placeholder for Phase 9 notification (grep: RECONCILIATION_NOTIFICATION_PLACEHOLDER)
- [08-04]: Navbar hidden on /register and /login via pathname check (not route groups)
- [08-04]: Referral code validated with 500ms debounce, pre-filled from ?c= URL param or sessionStorage
- [08-04]: Auth API client stores token in localStorage("token") on register/login success
- Plan routes: GET /api/plans (public, no auth)
- Payment routes: POST /api/payments/initiate, GET /api/payments/history, GET /api/payments/:id/status (all auth required)
- M-Pesa callback route: POST /api/mpesa/callback (no auth, always returns 200)
- Stream routes now require requireAuth + requireSubscription middleware chain
- Client auth types: RegisterInput, LoginInput, AuthResponse, DeviceLimitResponse, ReferralValidation (client/src/types/auth.ts)
- Client auth API: register, login, validateReferralCode, forceLogin (client/src/api/auth.ts)
- Registration page at /register with invite code pre-fill, debounced validation, "Invited by [Name]." feedback
- Login page at /login with device limit display and force-login (replace session) option
- Home page redirects ?c=CODE to /register?c=CODE with sessionStorage fallback
- Reconciliation job: startReconciliationJob() runs every 2 minutes, max 5 attempts, resolves lost M-Pesa callbacks
- Server.ts starts reconciliation job on boot alongside session cleanup and transcode worker
- [09-01]: Email service uses console transport in dev (no SMTP config needed for local development)
- [09-01]: buildWelcomeEmail, buildPasswordResetEmail, buildPaymentSuccessEmail, buildPaymentFailureEmail, buildPreExpiryEmail, buildPostExpiryEmail, buildReferralRewardEmail exported from email.service.ts
- [09-01]: sendEmail is fire-and-forget (no await) -- logs errors to console, never blocks request
- [09-02]: Payment reconciliation wired with buildPaymentSuccessEmail and buildPaymentFailureEmail
- [09-02]: Password reset DEV log replaced with buildPasswordResetEmail real email
- [09-03]: Subscription expiry job: hourly cron, 2-day and 1-day pre-expiry + post-expiry notifications
- [09-03]: Idempotent tracking via notifiedPreExpiry2Day, notifiedPreExpiry1Day, notifiedPostExpiry fields
- [09-04]: Phase 9 verified: all 8 checks pass (tsc, prisma, startup, NOTF coverage, fire-and-forget, idempotency, placeholders)
- Email service exports: sendEmail, buildWelcomeEmail, buildPasswordResetEmail, buildPaymentSuccessEmail, buildPaymentFailureEmail, buildPreExpiryEmail, buildPostExpiryEmail, buildReferralRewardEmail
- Subscription expiry job: startSubscriptionExpiryJob() runs hourly, checks pre-expiry and post-expiry, sends emails
- Server.ts starts 4 background jobs: session cleanup, transcode worker, reconciliation, subscription expiry
