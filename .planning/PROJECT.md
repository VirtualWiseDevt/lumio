# Lumio

## What This Is

Lumio is a premium video streaming platform targeting the East African market. It offers Movies, TV Series, Documentaries, and Live TV channels through a Netflix-style web interface, with M-Pesa (Safaricom Daraja API) as the primary payment method. The platform uses an invite-only community model with a referral rewards system, and includes a comprehensive admin panel for content and user management.

## Core Value

Users can stream high-quality movies, series, documentaries, and live TV with seamless M-Pesa subscription payments — affordable, accessible, and built for East Africa.

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### Authentication & Sessions
- [ ] User registration with email, phone, and password
- [ ] User login with JWT-based sessions (7-day expiry)
- [ ] Password change functionality
- [ ] Maximum 2 concurrent device sessions per user, enforced at login
- [ ] Active sessions list with remote logout capability
- [ ] Stale session cleanup (inactive 7+ days)

#### Content Browsing
- [ ] Home page with auto-playing hero banner, horizontal scroll content rows
- [ ] Movies page with hero + filtered movie rows
- [ ] Series page with hero + filtered series rows
- [ ] Documentaries page with hero + filtered documentary rows
- [ ] Live TV page with channel card grid organized by category
- [ ] Hover popover with video preview, action buttons, metadata (500ms delay)
- [ ] Detail modal with trailer, episode list (season dropdown for series), "More Like This" recommendations
- [ ] Search overlay across all content types (Ctrl+K or search icon)

#### Video Player
- [ ] Fullscreen player with play/pause, skip 10s, volume, progress scrubber, fullscreen toggle
- [ ] Keyboard shortcuts (Space, Arrow keys, F, M, Esc)
- [ ] Red progress scrubber with hover preview dot

#### User Features
- [ ] Watchlist (add/remove content)
- [ ] Favorites (add/remove content)
- [ ] Continue Watching with progress tracking and time filtering
- [ ] Account settings page (profile card, status, newsletter/auto-renew toggles, password/name change, device list)

#### Payments & Billing
- [ ] M-Pesa STK Push integration via Safaricom Daraja API (sandbox first, then production)
- [ ] Three subscription plans: Weekly (KES 500 / 7 days), Monthly (KES 1,250 / 30 days), Quarterly (KES 3,000 / 90 days)
- [ ] Billing page with plan selection, M-Pesa number input, payment flow
- [ ] M-Pesa payment modal (STK push notification, waiting spinner, success/failure states)
- [ ] Payment history table
- [ ] Subscription guard middleware (block expired users from content, redirect to billing)
- [ ] Auto-renewal via cron job

#### Referral System
- [ ] Unique referral code per user (link format: www.lumio.tv/?c=CODE)
- [ ] 10% stacking discount per referral (credited on referee's first payment)
- [ ] Referral credits deducted at payment time (excess carries over)
- [ ] Invite Friends page with copy-able link and community guidelines
- [ ] Referral credit capped at 100% (free subscription)

#### Notifications
- [ ] Pre-expiry warning email (2 days before)
- [ ] Post-expiry notice email (1 day after)
- [ ] Payment success/failure confirmation emails
- [ ] Welcome email on registration
- [ ] Referral reward notification email
- [ ] Cron jobs for scheduled notifications and subscription expiry checks

#### Admin Panel
- [ ] Admin authentication with role-based access
- [ ] Dashboard with revenue, active users, content count, failed payments stats
- [ ] Revenue bar chart (6/12 month view) and content breakdown donut chart
- [ ] Recent activity feed with period filtering
- [ ] Content management (Movies, Series, Documentaries, TV Channels) — poster card grid, add/edit/delete forms with all fields (title, year, duration, age rating, quality, categories, posters, video file, trailer URL)
- [ ] Users management — stats cards, full table with filtering, add/edit/delete, session monitoring, CSV export
- [ ] Billing management — stats cards, payment history table, status/user filtering, CSV export
- [ ] Settings — M-Pesa Daraja API credentials config, connection test, general settings, pricing config, device/invite limits
- [ ] Activity logs — audit trail of all CRUD operations

#### Coupon System
- [ ] Redeem Coupon page with code input and redemption

### Out of Scope

- **Android TV app** — deferred to v2 (web-first approach)
- **Mobile app** — deferred to v2+
- **OAuth login (Google, GitHub)** — email/password sufficient for v1
- **Real-time chat** — high complexity, not core to streaming value
- **Video posts / user-generated content** — platform is curated content only
- **Download for offline viewing** — complex DRM, defer to v2+
- **Multiple user profiles per account** — single profile per account for v1
- **Content recommendations engine (ML)** — static match scores for v1

## Context

- **Target market:** East Africa (Kenya primary), where M-Pesa is the dominant payment method
- **UI reference:** Two complete HTML mockups exist — `lumio-v7.html` (client app) and `lumio-admin.html` (admin panel). These are the pixel-perfect design reference for all frontend implementation.
- **Plan document:** Comprehensive implementation blueprint (`lumio-plan.docx`) covering database schemas, API endpoints, payment flows, notification system, security specs, and deployment strategy.
- **Content model:** Movies, Series (with seasons/episodes), Documentaries (same structure as movies), TV Channels (live HLS streams). Each content type managed independently.
- **Video delivery:** HLS (m3u8) adaptive bitrate streaming via Cloudflare CDN, files stored on Cloudflare R2
- **Thumbnail specs:** Portrait posters (600x900, 2:3) for grids/lists, Landscape banners (1920x1080, 16:9) for heroes/popovers
- **Community model:** Invite-only, referral links are private (no public social media sharing per community guidelines)
- **Business model:** Subscription-only with referral discounts. No ads. No freemium tier.

## Constraints

- **Tech stack**: Next.js 14 + TypeScript + Tailwind CSS v4 (frontend), Express.js + Node.js (backend API), PostgreSQL + Prisma (database) — specified in plan document
- **Payments**: M-Pesa via Safaricom Daraja API only — build against sandbox initially, Daraja credentials not yet registered
- **Video storage**: Cloudflare R2 + Cloudflare CDN for video delivery
- **File storage**: Cloudflare R2 or local for thumbnails/posters
- **Email**: Nodemailer + SMTP or SendGrid for transactional emails
- **Device limit**: Maximum 2 concurrent sessions per user (hard business rule)
- **Security**: bcrypt (12 rounds), JWT with 7-day expiry, rate limiting (100 req/min API, 5 req/min auth), CORS restricted to Lumio domains
- **Hosting**: VPS (Ubuntu) + Docker + Nginx reverse proxy + Let's Encrypt SSL

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web-only for v1 | Focus on core product before expanding to TV/mobile platforms | — Pending |
| M-Pesa only (no card payments) | Primary payment method in East African market, simplifies payment integration | — Pending |
| Cloudflare R2 + CDN for video | Cost-effective storage with global CDN delivery, good pricing for bandwidth | — Pending |
| Invite-only community | Privacy-centric model, controlled growth, prevents abuse | — Pending |
| Separate admin app | Independent management interface, different auth/UI concerns from client app | — Pending |
| PostgreSQL over MongoDB | Relational data (users, payments, referrals) fits relational DB. Prisma ORM for type-safe queries | — Pending |
| Sandbox-first for Daraja | Daraja credentials not registered yet, build and test against sandbox environment | — Pending |

---
*Last updated: 2026-03-06 after initialization*
