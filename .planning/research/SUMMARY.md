# Project Research Summary

**Project:** Lumio — Premium East African Video Streaming Platform
**Domain:** Subscription video-on-demand with live TV, M-Pesa payments, and HLS delivery
**Researched:** 2026-03-07
**Confidence:** HIGH (all four research areas verified with official sources and community consensus)

## Executive Summary

Lumio enters the East African streaming market at a uniquely advantageous moment: Showmax, Africa's largest streaming platform with 3.9M subscribers, was shut down on March 5, 2026, leaving a significant gap in the market. The recommended approach is a decoupled architecture — a Next.js 15 SSR frontend, an Express 5 REST API backend, PostgreSQL via Prisma 7, and Cloudflare R2 for zero-egress-fee HLS video delivery — deployed on a single Ubuntu VPS behind Nginx with Docker. This stack is production-proven, satisfies all technical requirements, and can scale gracefully as the user base grows. A critical correction from the original plan: Next.js 14 is end-of-life since October 2025 and must not be used. The project must start on Next.js 15.5.x.

The platform's two most complex integrations — Safaricom's Daraja API for M-Pesa STK Push payments and the HLS video transcoding/delivery pipeline — both have well-documented failure modes that must be designed into the architecture from day one. M-Pesa callbacks are delivered exactly once with no retry; without a reconciliation cron job querying the Transaction Status API, lost callbacks silently orphan paying customers. On the video side, FFmpeg transcoding must enforce keyframe alignment across all quality variants or adaptive bitrate switching will produce visual glitches. These are not edge cases — they are the two highest-risk, highest-impact elements of the entire build, and both must be addressed during their respective infrastructure phases before any content is uploaded or payments are accepted.

The recommended build order flows from dependencies: database schema first, then auth (every other feature gates on it), then content API and admin panel (the client has nothing to display without seeded content), then the frontend, then the video player, then payments and subscription enforcement, then the growth features (referrals, coupons, email notifications, auto-renewal). M-Pesa production go-live requires Safaricom approval (days to weeks); this process must be started early — during the payments phase — not at the end of the build.

---

## Key Findings

### Recommended Stack

The chosen stack centers on Next.js 15.5.x (not 14, which is EOL), React 19, TypeScript 5.6+, Tailwind CSS 4.2, Express 5.2, Node.js 22 LTS, PostgreSQL 16, and Prisma 7.2. Prisma 7 is a major breaking change from prior versions: it requires a driver adapter (`@prisma/adapter-pg`), a new `prisma.config.ts` file, explicit dotenv loading, and ships as ESM. Any tutorial or pattern written for Prisma 5/6 will fail.

For video, the decision is Cloudflare R2 (zero egress fees, S3-compatible, CDN-connected) with hls.js 1.6 for browser playback and direct FFmpeg CLI invocation for server-side transcoding. Cloudflare Stream was rejected due to per-minute billing that becomes expensive at scale; AWS S3 was rejected due to egress fees. For auth, `jose` replaces `jsonwebtoken` (stalled development, no ESM) and `argon2` replaces `bcrypt` (OWASP #1 for 2026, memory-hard). For payments, direct HTTP calls to the Daraja REST API via axios are preferred over any npm wrapper.

**Core technologies:**
- **Next.js 15.5.x**: Frontend SSR framework — current LTS, React 19, Turbopack stable; Next.js 14 is EOL
- **Express 5.2.x**: Backend API — promise-native middleware, better security defaults than Express 4
- **Prisma 7.2.x**: ORM — ESM-native, driver-adapter architecture; breaking change from v5/v6 patterns
- **PostgreSQL 16**: Primary database — relational, JSON support, well-supported by Prisma
- **Cloudflare R2 + CDN**: Video/asset storage and delivery — zero egress fees, African edge PoPs
- **hls.js 1.6**: Browser HLS playback — handles ABR switching, supports Low-Latency HLS
- **Safaricom Daraja API v2 (REST)**: M-Pesa STK Push — only official M-Pesa API, direct HTTP recommended
- **jose 6.x**: JWT signing/verification — modern, ESM-native, replaces jsonwebtoken
- **argon2**: Password hashing — OWASP #1 for 2026, replaces bcrypt
- **node-cron 3.x**: Scheduled tasks — subscription expiry, auto-renewal, notification emails
- **Node.js 22 LTS**: Runtime — Prisma 7 requires minimum Node 20.19; 22 LTS provides headroom until April 2027

See `.planning/research/STACK.md` for full version matrix, installation commands, and alternatives analysis.

### Expected Features

The market context is decisive: 83% of Kenya's digital transactions use M-Pesa, mobile data costs often exceed subscription costs, piracy accounts for $2.2M/day in losses, and the average East African user is mobile-first with variable bandwidth (3G to 72 Mbps depending on carrier). Features must be designed around these realities.

**Must have (table stakes — v1 launch):**
- User registration/login with JWT sessions and 2-device concurrent limit — foundation for everything
- Admin content management CRUD — the client has nothing to show without content in the database
- Hero banner with auto-rotating content rows — primary discovery surface; users are trained to expect it
- Content detail modal with synopsis, metadata, episode lists — users need information before watching
- HLS video player with adaptive bitrate — non-negotiable for Africa's variable bandwidth
- Progress tracking and Continue Watching — what distinguishes a streaming platform from a video site
- Search — missing search feels like a broken product
- Watchlist — minimal personalization that drives retention
- M-Pesa STK Push payment flow — the entire business model; not optional
- Subscription guard/paywall — fundamental to generating revenue
- Account settings with device/session management — required when enforcing a 2-device limit
- Live TV channel grid and HLS live stream playback — if content is ready at launch
- Admin dashboard with revenue/user/content stats — essential for operating the business

**Should have (competitive differentiators — v1.x post-launch):**
- Referral system with stacking 10% discounts (up to 100% free) — proven viral growth loop; no competitor has this
- Invite-only registration — exclusivity, controlled growth, reduces abuse
- Coupon/promo code system — enables marketing campaigns and influencer deals
- Hover popover with metadata — polish; no video preview needed initially
- Pre-expiry and post-expiry email notifications — measurably reduces involuntary churn
- Auto-renewal via M-Pesa STK Push cron — only after manual payments are battle-tested
- Data saver quality controls (240p/360p/480p/720p/Auto) — critical for data-cost-sensitive users
- "More Like This" tag-based recommendations — improves content discovery without ML infrastructure

**Defer to v2+:**
- Download for offline viewing — requires Widevine DRM; complex, piracy risk
- Mobile apps (iOS/Android) — second platform after web proves the model
- Android TV app — requires 10-foot UI redesign
- Multiple user profiles — only valuable with higher device limits and pricing
- Swahili language UI — add after English UI is stable
- ML-powered recommendations — cold start problem; not useful below ~100K users
- 4K streaming — only 4-5% of East African households have the bandwidth to use it

**Anti-features (avoid entirely):**
- Free tier / freemium — would require ad infrastructure; competes with piracy rather than replacing it
- Social features (comments, ratings) — moderation overhead the team cannot sustain
- OAuth/social login — phone-number-first market; Google account is not how East Africans identify
- User-generated content uploads — contradicts the "premium, curated" positioning

See `.planning/research/FEATURES.md` for full dependency graph, competitor analysis, and prioritization matrix.

### Architecture Approach

The architecture is a monorepo with three applications: a Next.js 15 client app (SSR, content browsing, video player), a separate Next.js admin panel (content CRUD, user/billing management), and an Express 5 API server (all business logic). Both Next.js apps consume the same Express API, with admin routes protected by a role middleware. PostgreSQL is the source of truth for all relational data; Cloudflare R2 holds all binary assets (HLS segments, thumbnails). Express never touches video bytes — it issues presigned R2 URLs with short TTL, and the browser fetches segments directly from Cloudflare's CDN.

The Express API follows strict layered architecture: Routes → Controllers (thin, 5-10 lines) → Services (all business logic) → Prisma. Cron jobs call services directly, not controllers. This pattern is mandatory — putting business logic in route handlers makes it untestable and impossible to reuse in scheduled jobs. Auth uses a hybrid approach: JWT for stateless signature verification plus a PostgreSQL sessions table for stateful device-limit enforcement and remote logout. Pure JWT cannot support a 2-device concurrent limit.

**Major components:**
1. **Next.js Client (Port 3000)** — SSR page rendering, content browsing, video player UI, auth state; Server Components for catalog, Client Components for interactive player
2. **Express API (Port 5000)** — all business logic, auth, session management, payment orchestration, content metadata, subscription enforcement; layered Route → Controller → Service → Prisma architecture
3. **Admin Panel (Port 3001)** — separate Next.js app, admin-only auth middleware, content CRUD, user management, billing oversight, analytics dashboard
4. **PostgreSQL (Port 5432)** — users, sessions, content metadata, payments, subscriptions, referrals, watchlist, watch progress; accessed exclusively via Prisma
5. **Cloudflare R2** — HLS segment files (.ts), playlist manifests (.m3u8), thumbnail images, poster art; S3-compatible, zero egress; accessed via AWS SDK v3
6. **Cloudflare CDN** — edge delivery of R2 assets; African PoPs in Nairobi, Mombasa, Dar es Salaam; .ts segments cached with immutable TTL
7. **Nginx (reverse proxy)** — SSL termination, routing between client/API/admin, Docker-managed
8. **Cron jobs (in Express process)** — subscription expiry checks, auto-renewal STK Push triggers, pre-expiry email notifications, stale session cleanup

**Critical architecture rules:**
- Express never proxies video bytes (blocks the event loop; kills API for all users)
- JWT alone cannot enforce device limits (stateless; no way to count or revoke active sessions)
- Synchronous FFmpeg transcoding on upload will time out (transcoding is a background job)
- Video files go to R2, never to PostgreSQL BLOBs or VPS filesystem
- R2 bucket is private; all segment access is via presigned URLs with short TTL

See `.planning/research/ARCHITECTURE.md` for full data flow diagrams, Prisma schema entity map, build order table, and scaling considerations.

### Critical Pitfalls

1. **M-Pesa callback loss (revenue risk)** — Safaricom delivers callbacks exactly once with no retry. If your server is down or slow, the payment succeeds on M-Pesa's end but your system never records it. Prevention: implement a reconciliation cron that queries the Transaction Status API for all PENDING payments older than 2 minutes, every 5-10 minutes. Make the callback endpoint idempotent. Log the raw payload before processing. Acknowledge immediately (within 5s); process async.

2. **Sandbox-to-production M-Pesa shock (launch risk)** — The sandbox only tests happy-path flows. In production, 30-40% of STK Push attempts fail (insufficient funds, user cancellation, timeout, locked SIM). The Daraja 3.0 sandbox is also reported unstable as of early 2026. Prevention: handle all ResultCodes (0, 1, 1001, 1019, 1025, 1032, 1037, 2001, 9999) from the start. Build mock callback fixtures for every error. Start the production go-live application to Safaricom at least 2-3 weeks before launch.

3. **HLS keyframe misalignment (broken ABR)** — Without forced keyframe alignment across all quality variants, adaptive bitrate switching produces glitches and rebuffering. Prevention: use `-force_key_frames "expr:gte(t,n_forced*6)"`, `-sc_threshold 0`, and identical GOP sizes across all encode jobs. Validate with `ffprobe`. This must be correct before any content is uploaded — retroactive fixes require re-transcoding the entire library.

4. **JWT-only session management (device limit bypass)** — Pure JWTs are stateless; there is no way to enforce a 2-device limit or support remote logout without server-side state. Prevention: maintain a `sessions` table in PostgreSQL. On login, check active session count; if at limit, remove the oldest session. Every authenticated request verifies both the JWT signature and the existence of the session record. Handle the race condition (two simultaneous logins at 1/2 sessions) with a database transaction and row-level locking.

5. **Payment-to-subscription atomicity (data integrity)** — The flow "receive M-Pesa callback → record payment → activate subscription → notify user" has multiple failure points. A crash between any two steps leaves the user in a broken state (paid but no access, or subscribed with no payment record). Prevention: wrap payment recording and subscription activation in a single Prisma `$transaction`. Use the `CheckoutRequestID` as an idempotency key so re-processed callbacks are no-ops. Implement a state machine: INITIATED → PENDING → CONFIRMED → SUBSCRIPTION_ACTIVATED.

6. **HLS.js memory leak during extended playback** — The default `backBufferLength: Infinity` causes memory to grow unboundedly during long sessions, resulting in rebuffering and crashes after 30-90 minutes. In East Africa where users may leave streams running, this is a real risk. Prevention: set `backBufferLength: 30` for VOD content, `backBufferLength: 10` for live streams. Validate with a 60-minute playback test on mobile.

See `.planning/research/PITFALLS.md` for the full "Looks Done But Isn't" checklist, recovery strategies, security mistakes, and pitfall-to-phase mapping.

---

## Implications for Roadmap

Based on the combined research, the dependency graph is clear and strongly suggests a 6-phase structure. The critical path is: Data Foundation → Auth → Content + Admin → Client Frontend → Video + Payments → Growth Features.

### Phase 1: Foundation — Database, Infrastructure, and Auth

**Rationale:** Every other feature in the system depends on the database schema and authentication. Auth is the foundational dependency; it cannot be built without the schema, and nothing else can be built without auth. Infrastructure setup (Docker, Nginx, Node.js, Prisma 7 config) is also required before any code runs. This phase has no external dependencies and can be completed entirely in isolation.

**Delivers:** Working monorepo project structure; Docker-compose environment with PostgreSQL; complete Prisma schema for all entities (User, Session, Content, Plan, Payment, Subscription, Referral, WatchProgress, Watchlist); Express API skeleton with middleware chain; fully functional auth system (register, login, logout, JWT + session tracking, 2-device limit enforcement, remote logout).

**Addresses (from FEATURES.md):** User registration and login, 2-device concurrent session limit, device/session management.

**Avoids (from PITFALLS.md):** JWT-only session management pitfall — sessions table must be in the schema from day one, not retrofitted later.

**Research flag:** Standard patterns — layered Express architecture, Prisma 7 setup, JWT + sessions hybrid are well-documented. No phase research needed.

---

### Phase 2: Content API and Admin Panel

**Rationale:** The client application has nothing to display without content in the database. The Admin Panel content management system is a prerequisite for the client — not an afterthought. Building the content API and admin CRUD in parallel (both consume the same Express routes) means the client team can start with seeded test data and the admin team can prepare real content simultaneously.

**Delivers:** Complete content API (movies, series with seasons/episodes, documentaries, live TV channels — CRUD, search, filtering, pagination); admin panel with content management forms, user management, and billing overview; content seeding for development; thumbnail upload to Cloudflare R2.

**Addresses (from FEATURES.md):** Admin content management CRUD, search, genre/category filtering, admin dashboard with basic stats.

**Avoids (from PITFALLS.md):** Full video upload pipeline (FFmpeg transcoding to HLS) is deferred to Phase 4 to avoid keyframe alignment errors before the pipeline design is validated. Phase 2 uses test HLS files or stub video URLs.

**Research flag:** Standard patterns — REST CRUD with Prisma, R2 image uploads, admin data tables. No phase research needed.

---

### Phase 3: Client Frontend (Browsing and User Account)

**Rationale:** With the content API available and seeded, the Next.js client can be built against real data. Authentication (Phase 1) and content API (Phase 2) are both prerequisites. This phase does not require video playback or payments — those come next. Building the browse experience first lets the team validate UX and content discovery flows before the complexity of the video player and payment integration.

**Delivers:** Next.js 15 client app with App Router; home page with hero banner and horizontal content rows; Movies, Series, Documentaries, Live TV browse pages; content detail modal (synopsis, cast, episode list for series); search with autocomplete; watchlist add/remove; account settings page; billing/subscription status page (shell, no payment yet); hls.js-based video player with basic controls, keyboard shortcuts, and progress tracking.

**Addresses (from FEATURES.md):** Hero banner, horizontal content rows, content detail modal, search, watchlist, account settings, video player with ABR, keyboard shortcuts, Continue Watching row.

**Avoids (from PITFALLS.md):** hls.js SSR import failure (must use `next/dynamic` with `ssr: false`); backBufferLength must be set (not left at Infinity default) during initial player setup.

**Research flag:** Standard patterns for most. The video player integration has moderate complexity but hls.js documentation is thorough. No phase research needed.

---

### Phase 4: Video Infrastructure (FFmpeg Pipeline and R2 HLS Delivery)

**Rationale:** This phase is separated from the frontend (Phase 3) and payments (Phase 5) deliberately. Getting the FFmpeg transcoding pipeline correct — keyframe alignment, multi-bitrate encoding, HLS segmentation, R2 upload, presigned URL generation, CDN cache rules — requires focused attention and must be validated before any real content is uploaded. Errors here require re-transcoding the entire library. The player (Phase 3) can test with pre-generated HLS test files until this pipeline is ready.

**Delivers:** Admin upload flow (MP4 ingest → FFmpeg multi-bitrate transcoding → HLS segments to R2); validated FFmpeg config with keyframe alignment and GOP alignment across all quality variants (240p, 360p, 480p, 720p, 1080p); master playlist generation; presigned URL generation for authenticated playback; Cloudflare CDN cache rules (.ts = immutable, .m3u8 = short TTL); `ffprobe` validation script confirming keyframe alignment; content protection (private R2 bucket + presigned URLs with 1-2 hour TTL).

**Addresses (from FEATURES.md):** HLS adaptive bitrate streaming, data saver quality tiers (all five variants), content protection for subscription gating.

**Avoids (from PITFALLS.md):** HLS keyframe misalignment (must validate with ffprobe), R2 without HLS segmentation (never store raw MP4), public bucket without access control, streaming video through Express (Express only issues URLs).

**Research flag:** Needs phase research — FFmpeg HLS packaging flags, keyframe alignment verification with ffprobe, Cloudflare cache rule configuration for HLS. The patterns exist but the specific parameters matter and errors are costly to fix.

---

### Phase 5: Payments, Subscriptions, and Access Enforcement

**Rationale:** This is the highest-risk, highest-business-value phase. The Daraja API has specific behavior — async callbacks, no retries, production approval process — that must be built correctly from the start. It is placed after the client and video infrastructure are working so payment testing can happen against a real streaming experience. The production go-live application to Safaricom should be submitted during or immediately before this phase (2-3 week approval window).

**Delivers:** Daraja OAuth token management with auto-refresh; M-Pesa STK Push initiation flow; callback endpoint (idempotent, < 5s response); payment state machine (INITIATED → PENDING → CONFIRMED → SUBSCRIPTION_ACTIVATED); subscription activation/extension in a Prisma transaction; reconciliation cron for lost callbacks (queries Transaction Status API every 5-10 min); subscription guard middleware on all content routes; billing page with plan selection UI and M-Pesa number input; payment history page; "Waiting for M-Pesa" modal with polling and timeout handling; error messages mapped to all Daraja ResultCodes; rate limiting on STK Push endpoint (1/30s per user, 3/5min per phone number).

**Addresses (from FEATURES.md):** M-Pesa STK Push payments, subscription plan selection, payment history, subscription status display, subscription guard/paywall, subscription expiry.

**Avoids (from PITFALLS.md):** Callback loss (reconciliation cron), sandbox-to-production shock (all ResultCodes handled, mock test suite, go-live submitted early), payment-subscription atomicity (Prisma transaction), fake callback validation (check source IP + Transaction Status API), referral discount double-apply (reservation pattern, addressed in Phase 6).

**Research flag:** Needs phase research — Daraja 3.0 specific behavior, sandbox alternatives (Pesa Playground), go-live application process, production IP whitelist requirements, known ResultCode behaviors.

---

### Phase 6: Growth Features (Referrals, Notifications, Auto-Renewal)

**Rationale:** These features depend on everything else being working and battle-tested. Auto-renewal must not be activated until manual STK Push payments have been validated in production. The referral system applies discounts at payment time, so the payment flow must be stable first. Email notifications depend on subscription event data being reliable. This phase converts a working product into a growth engine.

**Delivers:** Referral code generation per user; referral tracking (who invited whom); stacking 10% discount calculation (capped at 100%); discount application at payment time (atomic, with race condition protection); referral credit reservation pattern to prevent double-apply; invite-only registration enforcement (referral code required at registration); coupon/promo code system (percentage, fixed amount, free trial extension); pre-expiry email notifications (3 days, 1 day, 2 hours before); post-expiry email (day 1 after); payment confirmation emails; welcome email; auto-renewal cron (triggers STK Push before expiry, with retry logic and fallback to manual); hover popover with content metadata; favorites (separate from watchlist).

**Addresses (from FEATURES.md):** Referral system with stacking discounts, invite-only model, coupon system, all email notification types, auto-renewal, hover popover (metadata only), favorites.

**Avoids (from PITFALLS.md):** Referral discount race condition (reservation pattern + Prisma transaction), auto-renewal cron double-processing (distributed lock or idempotency key on cron run), referral discount cap enforcement (cannot reduce price below M-Pesa minimum transaction amount).

**Research flag:** Referral discount atomicity pattern and cron distributed locking warrant brief research. Auto-renewal M-Pesa timing (when to trigger vs. expiry) needs validation against Daraja rate limits.

---

### Phase Ordering Rationale

- **Auth before everything:** The feature dependency graph from FEATURES.md shows auth as the root node — every other feature requires it. Building auth first is unambiguous.
- **Admin before client:** The client displays content that must exist in the database. Admin content CRUD is a prerequisite, not a parallel workstream. This is confirmed by FEATURES.md's dependency tree ("Admin Content Management must precede client browsing").
- **Video infrastructure separated:** FFmpeg transcoding errors require re-transcoding the full library. Isolating this into its own phase gives focused attention to getting the pipeline right before production content is uploaded.
- **Payments last among core features:** The Daraja API is the highest-risk integration. Placing it after the client and video pipeline means the team has a working product to test payments against, and can spend focused time on the Daraja-specific patterns.
- **Growth features last:** Referrals and auto-renewal depend on payments being stable. "Don't build auto-renewal until manual payments are battle-tested" is explicit in FEATURES.md.

### Research Flags

**Phases needing `/gsd:research-phase` during planning:**

- **Phase 4 (Video Infrastructure):** FFmpeg keyframe alignment parameters, ffprobe validation commands, Cloudflare cache rule syntax for HLS. Errors here are expensive (full library re-transcode). Spend time getting the exact FFmpeg flags right before implementation.
- **Phase 5 (Payments):** Daraja 3.0 specific behavior (the sandbox is reported unstable), production go-live process steps, IP whitelist requirements, ResultCode behaviors in production, Pesa Playground as sandbox alternative.

**Phases with standard, well-documented patterns (skip research-phase):**

- **Phase 1 (Foundation):** Prisma 7 setup is documented in STACK.md with exact code. Express layered architecture is standard. JWT + sessions hybrid is covered in ARCHITECTURE.md with code examples.
- **Phase 2 (Content API + Admin):** CRUD REST APIs with Prisma are routine. R2 image uploads use the standard AWS SDK v3 pattern.
- **Phase 3 (Client Frontend):** Next.js 15 App Router, hls.js with `next/dynamic`, Tailwind CSS 4 — all documented. ARCHITECTURE.md covers the video playback flow in detail.
- **Phase 6 (Growth):** Referral system and cron jobs are standard patterns. The specific edge cases (race conditions, distributed locking) are covered in PITFALLS.md with prevention strategies.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against official docs, npm registry, and endoflife.date. Version compatibility matrix resolved. Prisma 7 breaking changes confirmed against official upgrade guide. |
| Features | HIGH | Market context verified against recent news (Showmax shutdown March 2026), competitor pricing from primary sources, M-Pesa adoption statistics from CBK. Feature prioritization grounded in competitive analysis. |
| Architecture | MEDIUM-HIGH | Layered Express architecture, JWT + session hybrid, and HLS + R2 delivery patterns are well-documented. Prisma transaction patterns verified. Some Cloudflare Worker authentication details are community-sourced. |
| Pitfalls | MEDIUM-HIGH | M-Pesa callback behavior verified against Safaricom docs and developer community. Daraja 3.0 sandbox instability confirmed by news (Jan 2026). HLS keyframe alignment patterns from authoritative video infrastructure vendors (Mux). hls.js memory behavior documented by Mux. Session race conditions from disclosed vulnerability (HackerOne). |

**Overall confidence:** HIGH

### Gaps to Address

- **Daraja 3.0 production behavior:** The sandbox is reportedly unstable (Jan 2026 news). Production error rates and ResultCode frequency distributions are not precisely known. Plan for a soft launch with real small transactions before full launch.
- **Safaricom go-live approval timeline:** The 2-3 week estimate is community-sourced. Start early and plan for potential delays. Have a contingency (manual PayBill payment instructions) if approval is delayed.
- **HLS AES-128 encryption:** Research noted this as a gap — segments should be encrypted but the implementation was flagged as a shortcut. Phase 4 should decide whether to implement AES-128 from the start or accept it as a Phase 4.5 item before any licensed premium content is added.
- **Cloudflare Worker vs. presigned URLs for segment auth:** ARCHITECTURE.md offers both options. The presigned URL approach is simpler for v1. The Cloudflare Worker approach offers more control. Phase 4 research should validate which is more practical given the content volume and team capacity.
- **FFmpeg on VPS resource constraints:** Transcoding a 2-hour movie at 5 quality levels is CPU-intensive. The specific VPS spec (CPU cores, RAM) affects whether transcoding can run on the same machine as the API or requires a separate worker process. This should be validated early in Phase 4.

---

## Sources

### Primary (HIGH confidence)
- [endoflife.date/nextjs](https://endoflife.date/nextjs) — Next.js 14 EOL October 2025 confirmed
- [Next.js 15 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-15) — React 19 requirement, breaking changes
- [Prisma 7 upgrade guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) — Driver adapter architecture, prisma.config.ts
- [Prisma 7 system requirements](https://www.prisma.io/docs/orm/reference/system-requirements) — Node 20.19+, TypeScript 5.4+ minimum
- [Safaricom Daraja Developer Portal](https://developer.safaricom.co.ke/) — Official API docs, ResultCodes, callback behavior
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) — Content protection approach
- [Cloudflare R2 AWS SDK JS v3 example](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/) — Implementation reference
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases) — LTS versions
- [Tailwind CSS v4.0 release](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config
- [Express 5 migration guide](https://expressjs.com/en/guide/migrating-5.html) — Breaking changes
- [HLS.js GitHub](https://github.com/video-dev/hls.js/) — Version 1.6.15 latest stable
- [Showmax shutdown - TechCabal](https://techcabal.com/2026/03/05/multichoice-to-shut-down-showmax/) — Market context
- [Daraja 3.0 sandbox issues - Tech-ish Kenya](https://tech-ish.com/2026/01/28/safaricom-m-pesa-daraja-3-0-sandbox-issues-spur-pesa-playground-alternative/) — Sandbox instability confirmed January 2026

### Secondary (MEDIUM confidence)
- [HLS.js memory behavior - Mux](https://www.mux.com/blog/an-hls-js-cautionary-tale-qoe-and-video-player-memory) — backBufferLength defaults
- [Adaptive bitrate streaming - Mux](https://www.mux.com/articles/adaptive-bitrate-streaming-how-it-works-and-how-to-get-it-right) — ABR patterns
- [Private media pipeline - arun.blog](https://www.arun.blog/private-media-pipeline-cloudflare-and-hls/) — HLS + R2 + Cloudflare Worker architecture
- [R2 video streaming cost - screencasting.com](https://screencasting.com/cheap-video-hosting) — 15TB for $2.18 verified cost
- [jose vs jsonwebtoken - Medium](https://joodi.medium.com/jose-vs-jsonwebtoken-why-you-should-switch-4f50dfa3554c) — ESM support comparison
- [Password hashing guide 2025-2026](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/) — Argon2 as OWASP #1
- [Daraja API error codes - Tuma](https://tuma.co.ke/common-mpesa-daraja-api-error-codes-explanation-and-mitigation/) — ResultCode reference
- [Optimistic locking with Prisma - OneUptime](https://oneuptime.com/blog/post/2026-01-25-optimistic-locking-prisma-nodejs/view) — Race condition prevention
- [Device limiting pattern - FusionAuth](https://fusionauth.io/docs/extend/examples/device-limiting) — Session limit architecture
- [Instacart coupon race condition - HackerOne](https://hackerone.com/reports/157996) — Real-world race condition disclosure

### Tertiary (LOW confidence)
- [HLS transcoding with Node.js - Medium](https://medium.com/sharma02gaurav/adaptive-bitrate-streaming-hls-vod-service-in-nodejs-8df0d91d2eb4) — Community pattern, needs validation against actual FFmpeg behavior

---

*Research completed: 2026-03-07*
*Ready for roadmap: yes*
