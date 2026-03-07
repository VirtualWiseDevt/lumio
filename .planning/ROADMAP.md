# Roadmap: Lumio

## Overview

Lumio is a premium video streaming platform for East Africa with M-Pesa payments, HLS adaptive bitrate delivery, and an invite-only referral growth model. The build follows a strict dependency chain: database and auth first (everything gates on user identity), then content management and admin tooling (the client has nothing to display without seeded content), then the client browsing experience and video player, then the HLS transcoding pipeline, then M-Pesa payments and subscription enforcement, and finally the growth features (referrals, notifications, coupons) and admin operations dashboard. Ten phases deliver all 59 v1 requirements.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Foundation and Database** - Monorepo, Docker, PostgreSQL, Prisma 7 schema, Express 5 skeleton
- [x] **Phase 2: Authentication and Sessions** - Registration, login, JWT + sessions hybrid, 2-device limit, session management
- [x] **Phase 3: Content API and Admin Content Management** - Content CRUD API, admin panel with content forms, admin auth, image upload with local storage
- [x] **Phase 4: Client Browsing Experience** - Next.js 15 client app, browse pages, hero banners, content rows, detail modal, search
- [x] **Phase 5: Video Player and User Features** - hls.js player, controls, keyboard shortcuts, progress tracking, watchlist, favorites
- [x] **Phase 6: Video Infrastructure and HLS Delivery** - FFmpeg pipeline, keyframe alignment, R2 upload, presigned URLs, CDN cache rules
- [ ] **Phase 7: Payments and Subscriptions** - M-Pesa STK Push via Daraja, billing UI, subscription guard, callback webhook, reconciliation
- [ ] **Phase 8: Referral System and Invite Model** - Referral codes, invite-only registration, stacking discounts, coupons
- [ ] **Phase 9: Notifications and Scheduled Jobs** - Transactional emails, expiry warnings, payment confirmations, cron jobs
- [ ] **Phase 10: Admin Operations and Dashboard** - Dashboard stats/charts, user management, billing management, settings, activity logs

## Phase Details

### Phase 1: Project Foundation and Database
**Goal**: A working development environment with the complete database schema and API skeleton that all subsequent phases build on
**Depends on**: Nothing (first phase)
**Requirements**: None (infrastructure — enables all requirements)
**Success Criteria** (what must be TRUE):
  1. Running `docker compose up` starts PostgreSQL 16 and the Express 5 API server with no errors
  2. The Prisma 7 schema contains all entities (User, Session, Content, Season, Episode, Channel, Plan, Payment, Subscription, Referral, WatchProgress, Watchlist, Favorite, Coupon, ActivityLog) and `prisma migrate deploy` succeeds
  3. The Express API responds on port 5000 with health check, CORS, rate limiting, and error handling middleware active
  4. The monorepo contains three application directories (client, api, admin) with shared TypeScript configuration
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Monorepo scaffolding with npm workspaces, Docker Compose, TypeScript base config, workspace skeletons
- [x] 01-02-PLAN.md -- Express 5 API skeleton with Prisma 7 config, middleware, health check, and graceful shutdown
- [x] 01-03-PLAN.md -- Complete Prisma 7 schema with all 14 models, initial migration, and end-to-end API verification

### Phase 2: Authentication and Sessions
**Goal**: Users can securely create accounts, log in, manage their sessions, and are limited to 2 concurrent devices
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07
**Success Criteria** (what must be TRUE):
  1. User can register with email, phone number, and password, and receives a JWT that persists their session for 7 days
  2. User can log in with email or phone plus password, and the server rejects login when 2 sessions are already active (displaying existing devices)
  3. User can view all their active sessions (device name, type, IP, last active time) and remotely terminate any session
  4. User can change their password from account settings, which invalidates all other active sessions
  5. Stale sessions (inactive 7+ days) are automatically cleaned up by the server
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- Schema migration (auth fields on User), install auth deps, env config, Express types, Zod validators, phone utils
- [x] 02-02-PLAN.md -- Token service (JWT sign/verify), session service (CRUD, 2-device limit), auth service (register/login/password), auth middleware
- [x] 02-03-PLAN.md -- Auth routes (register/login/logout/password), session routes (list/delete), cleanup cron job, route wiring, E2E verification

### Phase 3: Content API and Admin Content Management
**Goal**: Admin users can manage the full content catalog (movies, series, documentaries, TV channels) through a dedicated admin panel, and the content API serves structured data for the client
**Depends on**: Phase 2
**Requirements**: ADMN-01, ADMN-05, ADMN-06, ADMN-07, ADMN-08
**Success Criteria** (what must be TRUE):
  1. Admin can log in to the admin panel with role-based access and is blocked from the panel without an admin JWT claim
  2. Admin can create, edit, and delete movies with all fields (title, year, duration, age rating, quality, categories, poster images, video file reference, trailer URL) and see them in a poster card grid with status filter
  3. Admin can create, edit, and delete series with seasons and episodes, including per-episode metadata and video references
  4. Admin can create, edit, and delete documentaries and TV channels (with stream URL for channels), each on their own management page
  5. Poster and thumbnail images upload to local storage (with Sharp WebP processing) and display correctly in admin card grids
**Plans**: 9 plans

Plans:
- [x] 03-01-PLAN.md -- Schema migration (cast, director, Category model), admin auth (requireAdmin middleware, login endpoint, seed script)
- [x] 03-02-PLAN.md -- Admin panel scaffold (Vite + React + shadcn/ui + TanStack Router, auth context, sidebar layout)
- [x] 03-03-PLAN.md -- Content CRUD API and Category CRUD API (services, validators, routes with filtering/pagination/sorting)
- [x] 03-04-PLAN.md -- Image upload pipeline (Multer + Sharp WebP processing, multi-size variants, media serving route)
- [x] 03-05-PLAN.md -- Season and Episode CRUD API (hierarchical routes for series management)
- [x] 03-06-PLAN.md -- Admin content list pages (Movies, Documentaries, Channels with grid/table toggle, filters, pagination)
- [x] 03-07-PLAN.md -- Admin content forms (Movie/Documentary/Channel create/edit with image upload component)
- [x] 03-08-PLAN.md -- Admin series management (series list, season management, episode management with hierarchical navigation)
- [x] 03-09-PLAN.md -- Admin categories settings page + end-to-end human verification

### Phase 4: Client Browsing Experience
**Goal**: Users can discover and explore the full content catalog through an immersive Netflix-style browsing interface across all content types
**Depends on**: Phase 3
**Requirements**: BRWS-01, BRWS-02, BRWS-03, BRWS-04, BRWS-05, BRWS-06, BRWS-07, BRWS-08, BRWS-09, BRWS-10, BRWS-11, BRWS-12
**Success Criteria** (what must be TRUE):
  1. Home page displays a full-width hero banner with auto-playing video, title, description, Play and More Info buttons, and horizontal scroll content rows with left/right navigation arrows
  2. Movies, Series, and Documentaries pages each display a hero banner and content rows filtered to their respective content type
  3. Hovering over a content card for 500ms shows a popover with video preview area, action buttons (Play, Add to List, Like, Expand), and metadata
  4. Clicking a content card opens a detail modal with video header, match percentage, year, duration, quality badge, age rating, description, cast, genres, and "More Like This" grid; series detail modal includes episode list with season dropdown
  5. Search overlay opens via Ctrl+K or search icon, displaying real-time results grouped by content type
  6. Live TV page displays channel cards organized by category headers, each card showing thumbnail, channel logo, name, current program, and pulsing LIVE badge
**Plans**: 8 plans

Plans:
- [x] 04-01-PLAN.md -- BrowseRow DB model, public browse service, and 8 browse API endpoints at /api/browse/*
- [x] 04-02-PLAN.md -- Next.js 15 scaffold with Tailwind 4, TanStack Query, Zustand, Navbar, API proxy, TypeScript types
- [x] 04-03-PLAN.md -- Hero banner with auto-rotation, video crossfade, dot indicators, IntersectionObserver
- [x] 04-04-PLAN.md -- Content rows with CSS scroll-snap, responsive cards, arrow navigation, hover popover
- [x] 04-05-PLAN.md -- Detail modal with intercepting routes, episode list, More Like This, API client functions
- [x] 04-06-PLAN.md -- Search overlay (Ctrl+K) with real-time grouped results, Live TV page with channel grid
- [x] 04-07-PLAN.md -- Home, Movies, Series, Documentaries pages wiring hero + rows + data fetching
- [x] 04-08-PLAN.md -- Seed test content and end-to-end human verification of all BRWS requirements

### Phase 5: Video Player and User Features
**Goal**: Users can watch content with a full-featured video player and manage their personal library (watchlist, favorites, continue watching)
**Depends on**: Phase 4
**Requirements**: PLAY-01, PLAY-02, PLAY-03, PLAY-04, USER-01, USER-02, USER-03, USER-04, USER-05
**Success Criteria** (what must be TRUE):
  1. Clicking Play launches a fullscreen video player that streams HLS content with adaptive bitrate switching via hls.js
  2. Player displays controls for play/pause, skip 10s forward/back, volume slider, progress scrubber with red styling and hover preview dot, and fullscreen toggle
  3. Keyboard shortcuts work: Space (play/pause), Arrow keys (skip 10s), F (fullscreen), M (mute), Esc (close player)
  4. Playback progress is saved periodically, and user sees a Continue Watching row with progress bars and time filtering (3/6/12 months) that resumes from where they left off
  5. User can add/remove content from Watchlist and Favorites, and the account settings page shows profile card, subscription status, premium days remaining, newsletter/auto-renew toggles, and device list
**Plans**: 9 plans

Plans:
- [x] 05-01-PLAN.md -- Schema migration (User.newsletter), progress tracking service, continue-watching API endpoints
- [x] 05-02-PLAN.md -- My List API (backed by Watchlist model) and User profile/preferences/subscription API endpoints
- [x] 05-03-PLAN.md -- Client deps (hls.js, screenfull), player types, Zustand player store, API client functions
- [x] 05-04-PLAN.md -- Video player core + controls: VideoPlayer, useHls, PlayerControls, ProgressBar, VolumeControl, keyboard shortcuts, /watch/[id] page
- [x] 05-05-PLAN.md -- My List frontend: useMyList hook with optimistic updates, MyListButton component, /my-list page
- [x] 05-06-PLAN.md -- Account settings page with Profile, Subscription, Devices, Preferences sections
- [x] 05-07-PLAN.md -- Progress tracking hook, NextEpisodeOverlay, Continue Watching row with time filtering
- [x] 05-08-PLAN.md -- Integration wiring: MyListButton in cards/detail/player, Continue Watching on home, auth on API client, navbar links
- [x] 05-09-PLAN.md -- Build verification, API smoke tests, and end-to-end human verification

### Phase 6: Video Infrastructure and HLS Delivery
**Goal**: Admin-uploaded video files are transcoded into multi-bitrate HLS with correct keyframe alignment and delivered securely via Cloudflare R2 and CDN
**Depends on**: Phase 3 (admin upload UI), Phase 5 (player ready to consume HLS)
**Requirements**: None (infrastructure — enables PLAY-01 with real content instead of test files)
**Success Criteria** (what must be TRUE):
  1. Admin can upload an MP4 file through the admin panel and it is transcoded into HLS segments at multiple quality levels (360p, 480p, 720p, 1080p) with a master playlist
  2. All quality variants have aligned keyframes verified by ffprobe, ensuring smooth adaptive bitrate switching without visual glitches
  3. HLS segments and playlists are stored in a private Cloudflare R2 bucket and accessed only via presigned URLs with short TTL
  4. The video player successfully plays transcoded content with adaptive bitrate switching, and the CDN serves segments from African edge PoPs with correct cache headers (.ts immutable, .m3u8 short TTL)
**Plans**: 7 plans

Plans:
- [x] 06-01-PLAN.md -- Docker infrastructure (Redis + FFmpeg), R2/Redis clients, schema migration (transcoding fields), type definitions
- [x] 06-02-PLAN.md -- R2 storage service (presign, upload, delete) and video upload API endpoints (presign + confirm)
- [x] 06-03-PLAN.md -- FFmpeg transcode service (HLS generation, keyframe alignment) and BullMQ job queue (worker + processor)
- [x] 06-04-PLAN.md -- Stream service (playlist proxy with presigned URLs), publish-triggers-transcode, worker startup
- [x] 06-05-PLAN.md -- Admin video upload UI (VideoUploader component, TranscodingBadge) integrated into content forms
- [x] 06-06-PLAN.md -- Client player integration (stream endpoint, auth headers on HLS requests, fallback for non-transcoded)
- [x] 06-07-PLAN.md -- Build verification and end-to-end human verification of video infrastructure pipeline

### Phase 7: Payments and Subscriptions
**Goal**: Users can subscribe to Lumio via M-Pesa, and expired users are blocked from content until they pay
**Depends on**: Phase 5 (content accessible to gate), Phase 6 (real video content to protect)
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07
**Success Criteria** (what must be TRUE):
  1. Billing page displays current subscription status, three plan options (Weekly KES 500, Monthly KES 1,250, Quarterly KES 3,000), an editable M-Pesa phone number field, and a Pay with M-Pesa button
  2. Clicking Pay triggers an M-Pesa STK Push to the user's phone, and the payment modal shows the amount, phone number, a waiting spinner, and resolves to success or failure state
  3. Successful M-Pesa callback atomically records the payment and activates/extends the subscription, and the user gains immediate access to content
  4. A reconciliation cron job queries the Daraja Transaction Status API for PENDING payments older than 2 minutes and resolves lost callbacks
  5. Subscription guard middleware blocks expired users from all content pages and redirects them to the billing page, and payment history table is visible with method, date, plan, amount, and status
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD
- [ ] 07-03: TBD

### Phase 8: Referral System and Invite Model
**Goal**: Lumio operates as an invite-only platform where users grow the community through referrals and earn stacking subscription discounts
**Depends on**: Phase 7 (referral credits deducted at payment time)
**Requirements**: REF-01, REF-02, REF-03, REF-04, REF-05, USER-06
**Success Criteria** (what must be TRUE):
  1. Every user has a unique referral code and link (www.lumio.tv/?c=CODE), and registration requires a valid referral code (invite-only)
  2. When a referred user completes their first payment, the referrer receives a 10% credit of their own plan cost, and credits stack with each referral up to a cap of 100%
  3. At payment time, referral credits are deducted from the plan price; if credits exceed the price, payment is KES 0 and excess credits carry over to the next billing cycle
  4. Invite Friends page displays the user's unique referral link with a copy button and community guidelines
  5. User can enter and redeem coupon/promo codes for subscription discounts on the billing page
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Notifications and Scheduled Jobs
**Goal**: Users receive timely email notifications for account events, payments, and subscription lifecycle, driven by automated cron jobs
**Depends on**: Phase 7 (payment events), Phase 8 (referral events)
**Requirements**: NOTF-01, NOTF-02, NOTF-03, NOTF-04, NOTF-05, NOTF-06
**Success Criteria** (what must be TRUE):
  1. User receives a welcome email immediately after registration
  2. User receives a payment success email (with amount, plan, new expiry date, M-Pesa receipt number) or a payment failure email (with retry suggestion and support contact) after each payment attempt
  3. User receives a pre-expiry warning email 2 days before their subscription expires and a post-expiry notice email 1 day after expiry with a reactivation link
  4. Referrer receives a notification email when their referred user makes their first payment, showing the credits earned
  5. Cron jobs run on schedule for subscription expiry checks and notification dispatch without manual intervention
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Admin Operations and Dashboard
**Goal**: Admin users have full operational visibility and management control over users, billing, platform settings, and system activity
**Depends on**: Phase 7 (billing data), Phase 9 (notification data for activity)
**Requirements**: ADMN-02, ADMN-03, ADMN-04, ADMN-09, ADMN-10, ADMN-11, ADMN-12
**Success Criteria** (what must be TRUE):
  1. Admin dashboard displays stat cards for revenue, active users, total content count, and failed payments with period comparison, plus a revenue bar chart (6/12 month view) and content breakdown donut chart
  2. Admin dashboard displays a recent activity feed filterable by period (week/month/quarter/all time/custom)
  3. Admin can view, filter, add, edit, and delete users with stats cards, session monitoring, and CSV export
  4. Admin can view and filter payment history with stats cards, status/user filtering, and CSV export
  5. Admin can configure M-Pesa Daraja API credentials with a connection test button, manage general settings, pricing config, device/invite limits, and view an audit trail of all admin CRUD operations
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD
- [ ] 10-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 > 2 > 3 > 4 > 5 > 6 > 7 > 8 > 9 > 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation and Database | 3/3 | Complete | 2026-03-07 |
| 2. Authentication and Sessions | 3/3 | Complete | 2026-03-07 |
| 3. Content API and Admin Content Management | 9/9 | Complete | 2026-03-07 |
| 4. Client Browsing Experience | 8/8 | Complete | 2026-03-07 |
| 5. Video Player and User Features | 9/9 | Complete | 2026-03-07 |
| 6. Video Infrastructure and HLS Delivery | 7/7 | Complete | 2026-03-07 |
| 7. Payments and Subscriptions | 0/TBD | Not started | - |
| 8. Referral System and Invite Model | 0/TBD | Not started | - |
| 9. Notifications and Scheduled Jobs | 0/TBD | Not started | - |
| 10. Admin Operations and Dashboard | 0/TBD | Not started | - |
