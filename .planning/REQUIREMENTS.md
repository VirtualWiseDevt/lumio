# Requirements: Lumio

**Defined:** 2026-03-07
**Core Value:** Users can stream high-quality movies, series, documentaries, and live TV with seamless M-Pesa subscription payments — affordable, accessible, and built for East Africa.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can register with email, phone number, and password
- [ ] **AUTH-02**: User can log in with email or phone and password
- [ ] **AUTH-03**: User session persists via JWT with 7-day expiry
- [ ] **AUTH-04**: Maximum 2 concurrent device sessions enforced at login (reject if 2 active)
- [ ] **AUTH-05**: User can view active sessions with device name, type, IP, and last active time
- [ ] **AUTH-06**: User can remotely terminate any of their active sessions
- [ ] **AUTH-07**: User can change their password from account settings

### Content Browsing

- [ ] **BRWS-01**: Home page displays full-width hero banner with auto-playing video, title, description, Play and More Info buttons
- [ ] **BRWS-02**: Home page displays horizontal scroll content rows (Continue Watching, Trending, etc.) with left/right arrows
- [ ] **BRWS-03**: Movies page displays hero banner and filtered movie-only content rows
- [ ] **BRWS-04**: Series page displays hero banner and filtered series-only content rows
- [ ] **BRWS-05**: Documentaries page displays hero banner and filtered documentary-only content rows
- [ ] **BRWS-06**: Hover popover appears after 500ms with video preview, action buttons (Play, Add to List, Like, Expand), metadata
- [ ] **BRWS-07**: Detail modal shows video header, match percentage, year, duration, quality badge, age rating, full description, cast, genres
- [ ] **BRWS-08**: Detail modal for series includes episode list with season dropdown navigation
- [ ] **BRWS-09**: Detail modal includes "More Like This" grid with 6 recommended titles based on genre/tag matching
- [ ] **BRWS-10**: Search overlay triggered by search icon or Ctrl+K, with real-time results grouped by content type
- [ ] **BRWS-11**: Live TV page displays channel card grid organized by category headers (Sports, Entertainment, News, etc.)
- [ ] **BRWS-12**: Live TV channel cards show thumbnail, channel logo, channel name, current program, and pulsing LIVE badge

### Video Player

- [ ] **PLAY-01**: Fullscreen video player with HLS adaptive bitrate streaming via hls.js
- [ ] **PLAY-02**: Player controls: play/pause, skip 10s forward/back, volume slider, progress scrubber, fullscreen toggle
- [ ] **PLAY-03**: Keyboard shortcuts: Space (play/pause), Arrow keys (skip 10s), F (fullscreen), M (mute), Esc (close)
- [ ] **PLAY-04**: Red progress scrubber with hover preview dot and time display

### User Features

- [ ] **USER-01**: User can add and remove content from their Watchlist
- [ ] **USER-02**: User can add and remove content from their Favorites
- [ ] **USER-03**: User can view Continue Watching list with progress bars and time filtering (3/6/12 months)
- [ ] **USER-04**: Playback progress is saved periodically and resumed on next visit
- [ ] **USER-05**: Account settings page shows profile card, subscription status, premium days remaining, newsletter/auto-renew toggles, device list
- [ ] **USER-06**: User can enter and redeem coupon/promo codes for subscription discounts

### Payments

- [ ] **PAY-01**: M-Pesa STK Push payment initiated via Safaricom Daraja API
- [ ] **PAY-02**: Three subscription plans available: Weekly (KES 500 / 7 days), Monthly (KES 1,250 / 30 days), Quarterly (KES 3,000 / 90 days)
- [ ] **PAY-03**: Billing page displays current plan info, editable M-Pesa number, plan selection cards, Pay with M-Pesa button
- [ ] **PAY-04**: M-Pesa payment modal shows amount, phone, waiting spinner, and success/failure states
- [ ] **PAY-05**: Payment history table displays user, method, date, plan, amount, and status
- [ ] **PAY-06**: Subscription guard middleware blocks expired users from content and redirects to billing page
- [ ] **PAY-07**: M-Pesa callback webhook processes payment results and updates subscription status atomically

### Referral System

- [ ] **REF-01**: Every user receives a unique referral code and link (format: www.lumio.tv/?c=CODE)
- [ ] **REF-02**: New user registration requires a valid referral code (invite-only model)
- [ ] **REF-03**: Each successful referral (referee completes first payment) adds 10% of referrer's plan cost to their referral credits
- [ ] **REF-04**: Referral credits deducted from plan price at payment time; if credits exceed price, payment is KES 0 and excess carries over
- [ ] **REF-05**: Invite Friends page displays unique referral link with copy button, community guidelines, and sharing restrictions

### Notifications

- [ ] **NOTF-01**: Welcome email sent on user registration
- [ ] **NOTF-02**: Payment success confirmation email with amount, plan, new expiry date, M-Pesa receipt
- [ ] **NOTF-03**: Payment failure notification email with retry suggestion and support contact
- [ ] **NOTF-04**: Pre-expiry warning email sent 2 days before subscription expires
- [ ] **NOTF-05**: Post-expiry notice email sent 1 day after subscription expires with reactivation link
- [ ] **NOTF-06**: Referral reward notification email when referee makes first payment, showing credits earned

### Admin Panel

- [ ] **ADMN-01**: Admin authentication with role-based access (admin JWT claim)
- [ ] **ADMN-02**: Dashboard displays revenue, active users, total content, and failed payments stat cards with period comparison
- [ ] **ADMN-03**: Dashboard displays revenue bar chart (6/12 month view) and content breakdown donut chart
- [ ] **ADMN-04**: Dashboard displays recent activity feed with period filtering (week/month/quarter/all time/custom)
- [ ] **ADMN-05**: Movies management page with poster card grid, status filter, hover edit/delete actions, add/edit form with all fields
- [ ] **ADMN-06**: Series management page with poster card grid, status filter, hover edit/delete actions, add/edit form with seasons/episodes
- [ ] **ADMN-07**: Documentaries management page with poster card grid, status filter, hover edit/delete actions, add/edit form
- [ ] **ADMN-08**: TV Channels management page with poster card grid, status filter, hover edit/delete actions, add/edit form with stream URL
- [ ] **ADMN-09**: Users management page with stats cards, full table, active/inactive filter, add/edit/delete, session monitoring, CSV export
- [ ] **ADMN-10**: Billing management page with stats cards, payment history table, status/user filtering, CSV export
- [ ] **ADMN-11**: Settings page with M-Pesa Daraja API credentials config, connection test button, general settings, pricing config, device/invite limits
- [ ] **ADMN-12**: Activity logs page with audit trail table of all admin CRUD operations (timestamp, admin, action, details)

## v2 Requirements

### Subscription Automation

- **AUTO-01**: Auto-renewal cron job triggers M-Pesa STK Push before subscription expiry
- **AUTO-02**: Auto-renewal retry logic on payment failure with configurable attempts

### Accessibility & Localization

- **A11Y-01**: Data saver mode allowing users to cap video quality (240p/360p/480p/720p)
- **A11Y-02**: Swahili language support for UI strings alongside English

### Platform Expansion

- **PLAT-01**: Android TV app with D-pad navigation and remote-optimized controls
- **PLAT-02**: Mobile app (iOS/Android) with responsive design

### Content Enhancements

- **CONT-01**: Video preview clips in hover popovers (15-30s preview segments)
- **CONT-02**: Trailer auto-play in detail modal video header

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth login (Google, GitHub) | Email/phone + password sufficient for East African market; M-Pesa phone number is the primary identifier |
| Real-time chat | High complexity, not core to streaming value proposition |
| User-generated content | Platform is curated content only; UGC dilutes premium brand |
| Download for offline viewing | DRM complexity (Widevine L1/L3) + piracy risk in Kenya ($2.2M/day losses) |
| Multiple user profiles per account | Encourages credential sharing at low price points; complexity not justified with 2-device limit |
| ML recommendation engine | Cold start problem; static genre/tag matching sufficient for v1 content library size |
| Card/PayPal payments | M-Pesa handles 83% of Kenya's digital transactions; adding card adds complexity without proportional reach |
| Real-time notifications (WebSocket) | Email notifications sufficient for v1; in-app push deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 2 | Pending |
| BRWS-01 | Phase 4 | Pending |
| BRWS-02 | Phase 4 | Pending |
| BRWS-03 | Phase 4 | Pending |
| BRWS-04 | Phase 4 | Pending |
| BRWS-05 | Phase 4 | Pending |
| BRWS-06 | Phase 4 | Pending |
| BRWS-07 | Phase 4 | Pending |
| BRWS-08 | Phase 4 | Pending |
| BRWS-09 | Phase 4 | Pending |
| BRWS-10 | Phase 4 | Pending |
| BRWS-11 | Phase 4 | Pending |
| BRWS-12 | Phase 4 | Pending |
| PLAY-01 | Phase 5 | Pending |
| PLAY-02 | Phase 5 | Pending |
| PLAY-03 | Phase 5 | Pending |
| PLAY-04 | Phase 5 | Pending |
| USER-01 | Phase 5 | Pending |
| USER-02 | Phase 5 | Pending |
| USER-03 | Phase 5 | Pending |
| USER-04 | Phase 5 | Pending |
| USER-05 | Phase 5 | Pending |
| USER-06 | Phase 8 | Pending |
| PAY-01 | Phase 7 | Pending |
| PAY-02 | Phase 7 | Pending |
| PAY-03 | Phase 7 | Pending |
| PAY-04 | Phase 7 | Pending |
| PAY-05 | Phase 7 | Pending |
| PAY-06 | Phase 7 | Pending |
| PAY-07 | Phase 7 | Pending |
| REF-01 | Phase 8 | Pending |
| REF-02 | Phase 8 | Pending |
| REF-03 | Phase 8 | Pending |
| REF-04 | Phase 8 | Pending |
| REF-05 | Phase 8 | Pending |
| NOTF-01 | Phase 9 | Pending |
| NOTF-02 | Phase 9 | Pending |
| NOTF-03 | Phase 9 | Pending |
| NOTF-04 | Phase 9 | Pending |
| NOTF-05 | Phase 9 | Pending |
| NOTF-06 | Phase 9 | Pending |
| ADMN-01 | Phase 3 | Pending |
| ADMN-02 | Phase 10 | Pending |
| ADMN-03 | Phase 10 | Pending |
| ADMN-04 | Phase 10 | Pending |
| ADMN-05 | Phase 3 | Pending |
| ADMN-06 | Phase 3 | Pending |
| ADMN-07 | Phase 3 | Pending |
| ADMN-08 | Phase 3 | Pending |
| ADMN-09 | Phase 10 | Pending |
| ADMN-10 | Phase 10 | Pending |
| ADMN-11 | Phase 10 | Pending |
| ADMN-12 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 59 total
- Mapped to phases: 59
- Unmapped: 0

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after roadmap creation*
