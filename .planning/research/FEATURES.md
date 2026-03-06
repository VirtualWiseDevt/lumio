# Feature Research

**Domain:** Video Streaming Platform (East African Market)
**Researched:** 2026-03-07
**Confidence:** MEDIUM-HIGH

## Market Context

Showmax -- Africa's largest streaming platform with 3.9M subscribers and 40% African market share -- was shut down by Canal+ on March 5, 2026 after accumulating $428.9M in losses. This creates a massive gap in the East African streaming market. Netflix serves ~9M African subscribers but lacks deep local content focus. StarTimes dominates price-sensitive East Africa with satellite/antenna packages starting at KES 329/month. ViuSasa offers Kenyan-focused content at just KES 10 but is low-production-quality and user-generated focused.

Lumio enters at a unique inflection point: a premium, curated streaming service with M-Pesa-native billing in a market where the dominant local competitor just disappeared.

Key market realities that shape feature decisions:
- **Mobile-first continent:** 613M unique mobile subscribers, only 4-5% of households have fiber broadband
- **Data costs are brutal:** 1 hour of HD streaming = 1-3 GB; data cost often exceeds the subscription cost itself
- **M-Pesa dominance:** 83% of Kenya's digital transactions go through M-Pesa (CBK, 2025)
- **Piracy is rampant:** Kenya loses ~$2.2M/day to piracy; 54,000 physical movie shops sell copied content on flash drives
- **Low ARPU reality:** Prices must stay low due to limited incomes and free piracy alternatives

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

#### Content Browsing & Discovery

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hero banner with auto-rotation | Every major streaming platform (Netflix, Disney+, Prime) uses this as the primary content discovery entry point. Users are trained to expect it. | MEDIUM | Auto-playing video trailer in hero is HIGH complexity; static image rotation is MEDIUM. Recommend starting with image-based hero with play button, add video preview later. |
| Horizontal scroll content rows | Netflix invented this pattern and it is now universal. Users navigate streaming by scrolling rows of categorized content, not browsing grids. | MEDIUM | Needs lazy loading for performance. Each row should represent a curated category (Trending, New Releases, Continue Watching, etc.). |
| Content detail view | Users need full metadata before committing to watch: synopsis, cast, year, duration, age rating, episode lists for series. Standard on all platforms. | MEDIUM | Modal overlay (Netflix-style) is better UX than full page navigation -- keeps user in browsing context. Season/episode dropdowns for series are essential. |
| Search | Users expect to find specific content by title, actor, or genre. Every streaming platform has search. Missing search = broken product. | MEDIUM | Full-text search across titles, descriptions, cast. Ctrl+K keyboard shortcut is a nice modern touch already in spec. Autocomplete suggestions improve UX significantly. |
| Genre/category filtering | Users expect to browse by genre (Action, Drama, Comedy, etc.) and content type (Movies, Series, Documentaries). | LOW | Can be implemented as filtered pages or as filter controls on existing pages. Lumio's separate Movies/Series/Documentaries pages already address the content type dimension. |
| Content thumbnails (portrait + landscape) | Portrait posters for grids/rows, landscape for heroes/banners. Dual image treatment is standard across all platforms. | LOW | Already spec'd: 600x900 portrait, 1920x1080 landscape. Both are essential -- don't ship with only one format. |

#### Video Playback

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| HLS adaptive bitrate streaming | Adjusts video quality based on network conditions. Without ABR, users on poor connections see constant buffering. This is non-negotiable for Africa where bandwidth varies wildly. | MEDIUM | Already decided: Cloudflare CDN + HLS. Use hls.js library for browser playback. Multiple quality renditions (240p, 360p, 480p, 720p, 1080p) are essential for the East African network landscape. |
| Play/pause, seek, volume, fullscreen | Basic player controls. Every video player since YouTube 2005 has these. | LOW | Use a proven player library (Video.js or custom with hls.js). Don't build controls from scratch. |
| Keyboard shortcuts | Space (play/pause), arrow keys (seek), F (fullscreen), M (mute), Esc (exit). Power users expect these; casual users discover them. | LOW | Simple event listener implementation. Already in spec. |
| Progress persistence (Continue Watching) | Users expect to resume where they left off. If they watch 30 minutes of a movie on one session, they expect to pick up at 30:00 on their next visit. Netflix made this table stakes. | MEDIUM | Requires server-side progress tracking. Save progress periodically (every 30s or on pause/close). Display "Continue Watching" row on home page. |
| Video quality indicator | Users want to know if they're watching 720p or 1080p. Helps them understand data usage. | LOW | Simple overlay showing current resolution. |

#### User Account & Personalization

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Watchlist / My List | Users expect to save content for later viewing. This is the most basic personalization feature on any streaming platform. | LOW | Simple add/remove toggle. Persist server-side. Show as dedicated row on home page and as a user page. |
| Favorites | Distinct from Watchlist: favorites = "I loved this," watchlist = "I want to watch this." Some platforms merge these; separating them adds minimal complexity and more user expression. | LOW | Same implementation pattern as Watchlist. Already in spec. |
| Registration & login | Users need accounts for personalization, progress tracking, and subscription management. | MEDIUM | Email + phone + password registration. JWT sessions. Already spec'd with 7-day expiry. |
| Account settings | Users expect to manage their profile, change password, view subscription status. | LOW | Profile editing, password change, subscription status display. Straightforward CRUD. |
| Device/session management | Users must be able to see where they're logged in and log out remote devices. Netflix, Disney+, and every major platform offers this. Critical when you enforce a 2-device concurrent limit. | MEDIUM | List active sessions with device info and last active time. "Log out" button per session. Must be real-time accurate or users get frustrated. |

#### Payments & Subscriptions

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| M-Pesa STK Push payment | The primary payment method for 83% of Kenya's digital transactions. Not having M-Pesa = not having payments in East Africa. This is table stakes specifically for the East African market. | HIGH | Safaricom Daraja API integration. STK Push sends payment prompt to user's phone. Must handle: callback processing, timeout handling, retry logic, reconciliation. Start with sandbox, migrate to production. |
| Subscription plan selection | Users need to choose a plan, see pricing, and understand what they get. Clear pricing page is expected. | LOW | Three tiers already defined (Weekly/Monthly/Quarterly). Simple selection UI with clear pricing. |
| Payment history | Users expect to see their past payments, dates, amounts, and status. Especially important for M-Pesa where users are accustomed to transaction records. | LOW | Simple table of payment records. Date, amount, plan, status. |
| Subscription status & expiry | Users need to know: Am I subscribed? When does it expire? What plan am I on? | LOW | Display on account page and billing page. Clear visual indicator of active/expired status. |
| Auto-renewal | Users expect their subscription to continue without manual re-payment each period. Reduces churn significantly. | HIGH | Requires cron job to trigger STK Push before expiry. Must handle failures gracefully (retry logic, fallback to manual). M-Pesa auto-debit is possible but requires user authorization and careful UX. |
| Subscription guard (paywall) | Expired users must be blocked from content and redirected to billing. This is fundamental to the business model. | MEDIUM | Middleware that checks subscription status before serving content. Clear messaging about why content is blocked and how to resubscribe. |

#### Live TV

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Live TV channel grid | If you offer Live TV (and Lumio does), users expect a grid of available channels organized by category with clear "LIVE" indicators. | MEDIUM | Channel cards showing current program, channel logo, category. HLS live streams. Already in spec. |
| Channel switching | Users expect to click a channel and immediately start watching the live stream. Fast channel switching matters. | LOW | Simple: load new HLS stream URL. Pre-buffer if possible for perceived speed. |

### Differentiators (Competitive Advantage)

Features that set Lumio apart. Not expected, but create significant value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **M-Pesa-native subscription billing** | While other platforms bolt on M-Pesa as an afterthought, Lumio builds the entire billing experience around it. STK Push, M-Pesa number storage, payment reminders via SMS -- the billing UX feels native to how East Africans transact. No card required, no PayPal, no friction. | HIGH | This is table stakes for the market but a differentiator in execution quality. The M-Pesa flow should feel as smooth as Netflix's card-on-file experience. |
| **Referral rewards with stacking 10% discounts** | Dropbox proved that referral programs drive explosive growth. Lumio's 10% stacking discount (up to 100% free) creates a viral loop where users are financially incentivized to recruit. In a price-sensitive market, "invite 10 friends and never pay again" is incredibly compelling. | MEDIUM | Core logic: track referrals, calculate discount at payment time, cap at 100%. The invite-only model amplifies this -- every user is a recruiter. Virality coefficient could exceed 1.0 if the incentive is strong enough. |
| **Invite-only community model** | Creates exclusivity and scarcity (Clubhouse effect). Controls growth rate to manage infrastructure costs. Prevents abuse and spam accounts. Each user feels invested because they were "chosen" by a friend. | LOW | Technical implementation is simple (referral code required at registration). The value is in the psychological and growth dynamics it creates. |
| **Data saver / bandwidth optimization** | Showmax differentiated in Africa specifically by offering extremely low bandwidth modes (60 MB/hour). In a market where data costs can exceed subscription costs, aggressive bandwidth optimization is a competitive advantage, not a nice-to-have. | MEDIUM | Offer multiple quality tiers: Ultra Low (240p, ~150 MB/hr), Low (360p, ~300 MB/hr), Medium (480p, ~700 MB/hr), High (720p, ~1.5 GB/hr), Auto (adaptive). Default to "Auto" but let users cap maximum quality to control data spend. |
| **Hover popover with video preview** | Netflix-style hover cards that show a short preview clip, metadata, and action buttons. Most African streaming platforms lack this polish. Elevates perceived quality significantly. | HIGH | Requires: 500ms hover delay, video preview clips (short 15-30s segments), smooth animation, action buttons (Play, Add to List, Like). The preview video part is the expensive bit -- needs preview clips encoded and CDN-served for every title. Can launch without video preview (metadata-only popover) and add video later. |
| **Coupon/promo code system** | Enables marketing campaigns, partnerships with brands, influencer deals. "Use code LUMIO50 for 50% off your first month" is a proven acquisition channel. Not expected by users but enables business growth. | LOW | Simple: code entry field, validate against database, apply discount to next payment. Types: percentage off, fixed amount, free trial extension. |
| **"More Like This" recommendations** | Static similarity scores (not ML) that suggest related content on detail views. Helps users discover content and reduces the "nothing to watch" problem. Even basic tag-matching recommendations add significant value. | MEDIUM | v1 approach: match on shared genres/tags/cast. No ML needed. Compute similarity scores at content ingestion time, store as relations. Display as a row on detail modal. |
| **Pre-expiry and post-expiry email notifications** | Proactive communication about subscription status. Best practice is a sequence: 2 days before expiry (reminder), on expiry day (urgent), 1 day after (benefits paused). Reduces involuntary churn and improves user trust. | LOW | Cron job checks upcoming expirations, sends templated emails. Already in spec. Personalize with user name and expiry date. Open rates increase 26% with personalized subject lines. |
| **Swahili language support (UI)** | Multi-language support is standard globally but rare among smaller African platforms. Offering Swahili alongside English for the East African market shows cultural respect and broadens accessibility. | MEDIUM | i18n framework in Next.js. Translate UI strings (not content metadata initially). Swahili is the primary shared language across Kenya, Tanzania, Uganda, DRC, Rwanda, and Burundi. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems in this context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Multiple user profiles per account** | Netflix has it. Seems like a natural feature for shared households. | At 2-device concurrent limit and KES 500-1,250/month pricing, multi-profile adds complexity without proportional value. It encourages credential sharing (which you're actively trying to prevent). It also multiplies the recommendation and progress-tracking complexity. Netflix has profiles because they have 4+ stream limits and $15+/month pricing. | Keep single profile per account for v1. Revisit when/if you increase device limits or pricing tiers. Already listed as out of scope. |
| **Download for offline viewing** | Users in low-bandwidth areas want to download content on WiFi and watch offline. Seems essential for Africa. | DRM for offline content is extremely complex (requires Widevine L1/L3 integration, secure storage, license management, offline expiry). It also enables piracy -- downloaded files are easier to extract and redistribute. Kenya's piracy problem ($2.2M/day losses) makes this risky. | Aggressive data-saver mode that makes streaming viable on 2G/3G. Ultra-low quality (240p at 150 MB/hr) is watchable and uses less data than downloading a full file. Revisit offline downloads in v2+ with proper DRM. Already listed as out of scope. |
| **Social features (comments, ratings, reviews)** | Community engagement. Users can discuss content. Creates stickiness. | Moderation overhead is enormous. Toxic comments, spoilers, spam, and abuse require constant policing. Small team cannot manage this. Also conflicts with the "premium, curated" brand positioning -- user-generated reviews can undermine curated quality perception. | Curated editorial content (staff picks, featured collections). Social sharing via referral links. Community engagement happens off-platform (WhatsApp groups, Twitter). |
| **Free tier / freemium model** | Lowers barrier to entry. Lets users try before buying. Common in streaming (Tubi, Peacock). | Requires ad infrastructure (ad server, ad insertion, advertiser relationships). Splits engineering focus between free and paid experiences. In a market where piracy offers "free" content already, a limited free tier competes with piracy rather than replacing it. Lumio's invite-only model creates a different kind of low-friction entry. | The referral discount system IS the low-friction entry: invite enough friends and your subscription becomes free. First-month promotional pricing via coupons achieves trial-like behavior without ad infrastructure. |
| **OAuth / social login (Google, GitHub, Facebook)** | Faster registration. Fewer passwords to remember. | Adds third-party dependencies. Phone number + email is already the norm in East Africa (M-Pesa is linked to phone, not Google account). OAuth adds complexity for minimal benefit in this market where users are phone-number-first, not email-first. | Keep email + phone + password. Phone number is the primary identifier (matches M-Pesa). Add OAuth in v2+ if user feedback demands it. Already listed as out of scope. |
| **Real-time chat / community features** | Builds community. Users can discuss shows in real-time. | Massive infrastructure requirement (WebSocket server, message persistence, moderation, abuse prevention). Completely orthogonal to the core streaming value proposition. Community engagement for East African audiences happens on WhatsApp, not in-app chat. | Partner with or encourage WhatsApp group formation for community discussion. The invite-only model naturally creates friend-group clusters who already communicate on WhatsApp. |
| **User-generated content uploads** | ViuSasa does this. Expands content library. Engages creators. | Lumio is positioned as "premium, curated content." UGC dilutes brand quality and creates massive moderation, storage, and legal liability concerns. Completely different business model from curated streaming. | Stay curated. Quality over quantity. The premium positioning is a feature, not a limitation. |
| **AI-powered ML recommendation engine** | Netflix's recommendation engine reportedly saves them $1B/year. Seems essential. | Requires significant data volume to be useful (cold start problem). ML infrastructure (training pipelines, model serving) is expensive and complex. For a platform with hundreds of titles (not millions), manual curation and simple tag-matching outperforms ML. | Static similarity scores based on shared genres, tags, cast. Manual "editor's picks" and curated collections. Revisit ML when you have 100K+ users and 1000+ titles generating enough signal. Already listed as out of scope for v1. |
| **4K / HDR streaming** | Premium quality positioning. Major platforms offer it. | Only 4-5% of African households have fiber broadband. 4K requires 25+ Mbps stable connection. Encoding, storing, and serving 4K content dramatically increases CDN costs. The audience that can use 4K in East Africa is negligibly small. | Cap at 1080p for v1. Even 720p is "high quality" in the East African bandwidth context. Offer aggressive lower-quality options (240p-480p) that serve 95% of users well. Revisit 4K when broadband penetration improves. |
| **Picture-in-picture (PiP) mode** | Lets users browse while watching. Modern browser feature. | Browser-native PiP is easy to enable but creates UX complexity (what happens to the player page? How does the mini-player interact with navigation?). Low priority relative to core features. | Enable browser-native PiP with a single API call (no custom implementation). This gives users the option without engineering investment. Can be a quick win post-launch. |

---

## Feature Dependencies

```
[Authentication]
    |
    +---> [Content Browsing] (requires auth for personalized rows)
    |         |
    |         +---> [Watchlist / Favorites] (requires content catalog)
    |         |
    |         +---> [Search] (requires content catalog)
    |         |
    |         +---> [Hover Popover] (enhances content browsing)
    |         |
    |         +---> [Detail Modal] (requires content catalog)
    |                   |
    |                   +---> ["More Like This"] (requires content with tags/genres)
    |
    +---> [Video Player] (requires auth for access control)
    |         |
    |         +---> [Progress Tracking] (requires player + auth)
    |                   |
    |                   +---> [Continue Watching] (requires progress tracking)
    |
    +---> [Subscription System]
    |         |
    |         +---> [M-Pesa STK Push] (payment method for subscriptions)
    |         |         |
    |         |         +---> [Auto-Renewal] (requires working STK Push)
    |         |
    |         +---> [Subscription Guard / Paywall] (requires subscription status check)
    |         |
    |         +---> [Payment History] (requires payment records)
    |         |
    |         +---> [Coupon System] (modifies subscription pricing)
    |
    +---> [Referral System] (requires user accounts)
    |         |
    |         +---> [Referral Discounts] (integrates with payment at checkout)
    |         |
    |         +---> [Invite-Only Registration] (referral code required)
    |
    +---> [Notification System]
    |         |
    |         +---> [Pre-expiry Emails] (requires subscription expiry data)
    |         |
    |         +---> [Payment Confirmation Emails] (requires payment events)
    |         |
    |         +---> [Welcome Email] (triggered by registration)
    |
    +---> [Device/Session Management] (requires auth sessions)
              |
              +---> [Concurrent Device Limit] (enforced at login)
              |
              +---> [Remote Logout] (requires session listing)

[Admin Panel] (independent authentication, parallel development)
    |
    +---> [Content Management] (CRUD for all content types -- MUST exist before client browsing works)
    |
    +---> [User Management] (view/edit/delete users, session monitoring)
    |
    +---> [Billing Management] (payment history, subscription status)
    |
    +---> [Dashboard / Analytics] (requires data from all other systems)
    |
    +---> [Settings] (Daraja API credentials, pricing config)
```

### Dependency Notes

- **Authentication is the foundation:** Every feature depends on user accounts. Build first.
- **Admin Content Management must precede client browsing:** The client has nothing to display without content in the database. Admin panel content CRUD is a prerequisite for the entire client experience.
- **M-Pesa STK Push unlocks the business model:** Without payments, the platform cannot generate revenue. This is the highest-risk, highest-value integration.
- **Progress Tracking requires Video Player:** Can't track what users watch without a working player.
- **Auto-Renewal requires working STK Push:** Don't attempt auto-renewal until manual payments are battle-tested.
- **Subscription Guard requires Subscription System:** The paywall depends on knowing subscription status, which depends on payment processing.
- **Referral Discounts integrate at payment time:** The referral system calculates discounts, but they're applied during the M-Pesa payment flow. These two systems must be co-designed.

---

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate that East African users will pay for a curated streaming platform.

- [ ] **User registration and login** -- Foundation for everything. Email + phone + password. JWT sessions.
- [ ] **Admin content management (CRUD)** -- Without content in the database, there is no product. Movies, Series (with seasons/episodes), Documentaries, TV Channels.
- [ ] **Home page with hero banner and content rows** -- The primary content discovery surface. Hero + categorized horizontal scroll rows.
- [ ] **Content detail modal** -- Synopsis, metadata, episode list for series, play button. Users need information before committing to watch.
- [ ] **Video player with HLS streaming** -- The core product: play content. Adaptive bitrate, basic controls, keyboard shortcuts.
- [ ] **Progress tracking and Continue Watching** -- Resume playback. This is what makes a streaming platform feel like "my platform" vs. a random video site.
- [ ] **Search** -- Users must be able to find specific content.
- [ ] **Watchlist** -- Save for later. Minimal personalization that makes the platform sticky.
- [ ] **M-Pesa STK Push payments** -- The business model. Plan selection, M-Pesa number input, STK Push, callback handling, subscription activation.
- [ ] **Subscription guard (paywall)** -- Block expired users from content, redirect to billing.
- [ ] **Account settings with device management** -- Profile info, subscription status, active sessions, remote logout.
- [ ] **2-device concurrent session limit** -- Business rule enforcement. Critical for preventing credential sharing at this price point.
- [ ] **Live TV channel grid and playback** -- If Live TV is a launch feature, it needs a channel grid and HLS live stream playback. If content isn't ready, defer to v1.1.
- [ ] **Admin dashboard with basic stats** -- Revenue, user count, content count. Essential for operating the business.

### Add After Validation (v1.x)

Features to add once core streaming + payments are working and initial users are onboarded.

- [ ] **Referral system with stacking discounts** -- Add once you have paying users who can recruit others. The growth engine.
- [ ] **Invite-only registration** -- Activate once referral system works. Until then, open registration with referral code optional.
- [ ] **Coupon/promo code system** -- Enables marketing campaigns and partnerships for user acquisition.
- [ ] **Hover popover with metadata** -- Polish the browsing experience. Start without video preview, add preview clips later.
- [ ] **Favorites** -- Separate from Watchlist. Low effort, nice personalization.
- [ ] **Pre-expiry and post-expiry email notifications** -- Reduce involuntary churn. Requires email infrastructure (Nodemailer + SMTP or SendGrid).
- [ ] **Payment confirmation emails** -- Transactional emails for payment success/failure.
- [ ] **Auto-renewal via cron** -- Only after manual STK Push payments are battle-tested and reliable.
- [ ] **"More Like This" recommendations** -- Tag-based similarity on detail modal. Improves content discovery.
- [ ] **Data saver quality controls** -- Let users set maximum streaming quality. Critical for data-conscious East African users.
- [ ] **Admin: user management, billing management, activity logs** -- Full admin CRUD for operations team.
- [ ] **CSV export for admin** -- Users and billing data export for business analysis.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Android TV app** -- Second platform after web proves the model. Different UI paradigm (10-foot interface, remote navigation).
- [ ] **Mobile app (iOS/Android)** -- Third platform. React Native or native development.
- [ ] **Download for offline viewing** -- Requires DRM (Widevine). Complex but high-value in low-bandwidth markets.
- [ ] **Multiple user profiles** -- Only valuable if you increase device limits and pricing.
- [ ] **Swahili language UI** -- i18n framework. Add after English UI is stable.
- [ ] **ML-powered recommendations** -- Requires data volume. Not useful with <100K users.
- [ ] **EPG (Electronic Program Guide) for Live TV** -- Full program schedule grid. Complex data source integration.
- [ ] **Video preview in hover popover** -- Requires encoding preview clips for every title. CDN cost consideration.
- [ ] **OAuth login** -- Low priority for this market.
- [ ] **Card/bank payments** -- Expand payment options beyond M-Pesa for non-Kenyan East African users.
- [ ] **Content ratings and reviews** -- Only with robust moderation system.
- [ ] **Push notifications (browser/mobile)** -- Supplement email notifications with push.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Authentication & sessions | HIGH | MEDIUM | P1 |
| Admin content management | HIGH | MEDIUM | P1 |
| Hero banner + content rows | HIGH | MEDIUM | P1 |
| Content detail modal | HIGH | MEDIUM | P1 |
| HLS video player | HIGH | MEDIUM | P1 |
| Progress tracking / Continue Watching | HIGH | MEDIUM | P1 |
| Search | HIGH | MEDIUM | P1 |
| M-Pesa STK Push payments | HIGH | HIGH | P1 |
| Subscription guard (paywall) | HIGH | MEDIUM | P1 |
| Watchlist | MEDIUM | LOW | P1 |
| Device/session management | MEDIUM | MEDIUM | P1 |
| Concurrent device limit | MEDIUM | MEDIUM | P1 |
| Live TV grid + playback | MEDIUM | MEDIUM | P1 |
| Admin dashboard | MEDIUM | LOW | P1 |
| Account settings | MEDIUM | LOW | P1 |
| Referral system + discounts | HIGH | MEDIUM | P2 |
| Invite-only registration | MEDIUM | LOW | P2 |
| Coupon system | MEDIUM | LOW | P2 |
| Hover popover (metadata) | MEDIUM | MEDIUM | P2 |
| Favorites | LOW | LOW | P2 |
| Email notifications (all types) | MEDIUM | LOW | P2 |
| Auto-renewal | HIGH | HIGH | P2 |
| Data saver quality controls | HIGH | LOW | P2 |
| "More Like This" recommendations | MEDIUM | MEDIUM | P2 |
| Admin user/billing management | MEDIUM | MEDIUM | P2 |
| Swahili language UI | MEDIUM | MEDIUM | P3 |
| Hover popover (video preview) | LOW | HIGH | P3 |
| EPG for Live TV | LOW | HIGH | P3 |
| Android TV app | HIGH | HIGH | P3 |
| Mobile app | HIGH | HIGH | P3 |
| Offline downloads | HIGH | HIGH | P3 |
| Multiple profiles | LOW | MEDIUM | P3 |
| ML recommendations | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- the product does not function without these
- P2: Should have, add in the weeks after launch -- significant value, manageable effort
- P3: Nice to have, future consideration -- valuable but complex or not urgent

---

## Competitor Feature Analysis

| Feature | Netflix (Africa) | Showmax (RIP March 2026) | StarTimes ON | ViuSasa | Lumio (Planned) |
|---------|-----------------|--------------------------|--------------|---------|-----------------|
| Content type | Global + some African originals | African originals + HBO/international + Premier League | Chinese + international + local | Kenyan local + UGC | Curated movies, series, docs, live TV |
| Pricing | ~KES 300-1,500/mo | ~KES 300-2,100/mo | KES 329-2,300/mo | KES 10 | KES 500-3,000 (weekly/monthly/quarterly) |
| M-Pesa billing | Via PayBill (manual) | Had M-Pesa support | M-Pesa PayBill | M-Pesa | Native STK Push (automatic) |
| Offline download | Yes (mobile app) | Yes (mobile app) | Yes (mobile app) | Yes | No (v1), planned v2+ |
| Data saver mode | Yes (mobile) | Yes (60 MB/hr low) | Limited | N/A | Planned (multiple quality tiers) |
| Multiple profiles | Yes (up to 5) | Yes | No | No | No (by design for v1) |
| Live TV | No | Had sports (EPL) | Yes (core product) | Yes (Kenyan channels) | Yes (channel grid) |
| Referral program | No | No | No | No | Yes (10% stacking discount) |
| Invite-only model | No | No | No | No | Yes |
| Web app | Yes | Yes | Yes | Yes | Yes (v1 primary platform) |
| Mobile app | Yes | Yes (discontinued) | Yes | Yes | No (v2+) |
| Smart TV app | Yes | Yes (discontinued) | Yes (decoder) | No | No (v2+) |
| Content volume | 10,000+ titles | 1,000+ series | Hundreds of channels | Thousands (low quality) | Curated library (quality over quantity) |

### Competitive Gaps Lumio Can Exploit

1. **Showmax void:** The #1 African streaming platform just died. Its ~3.9M subscribers need somewhere to go. Lumio can capture Kenyan/East African users displaced by the shutdown.
2. **M-Pesa-native experience:** No competitor treats M-Pesa as a first-class billing experience. They all bolt it on. Lumio makes it the primary flow.
3. **Referral-driven growth:** No competitor offers referral discounts. In a price-sensitive market, "invite friends, pay less" is uniquely compelling.
4. **Premium curation:** ViuSasa is cheap but low-quality. StarTimes is satellite-focused. Netflix is global, not local. Lumio can own "premium East African streaming."
5. **Community exclusivity:** The invite-only model creates word-of-mouth buzz that paid marketing cannot replicate in a market where trust comes from personal networks.

---

## Sources

- [Showmax shutdown announcement - TechCabal](https://techcabal.com/2026/03/05/multichoice-to-shut-down-showmax/)
- [Showmax shutdown - Variety](https://variety.com/2026/tv/global/canal-plus-multichoice-showmax-1236679536/)
- [Streaming struggles in Africa - Broadcast Media Africa](https://news.broadcastmediaafrica.com/2026/03/06/streaming-struggles-why-africas-market-presents-unique-challenges-for-subscription-services/)
- [Africa OTT mobile-first future - Broadcast Media Africa](https://news.broadcastmediaafrica.com/2026/02/26/ott-content-streaming-summit-africa-2026-day-2-highlights-a-mobile-first-future-and-the-rise-of-the-african-creator-economy/)
- [10 key features for user-friendly streaming - Spyrosoft](https://spyro-soft.com/blog/media-and-entertainment/what-makes-a-streaming-platform-user-friendly-10-key-features)
- [Showmax dethroned Netflix - Rest of World](https://restofworld.org/2024/showmax-subscription-africa-netflix/)
- [Top OTT platforms Africa 2026 - Vitrina AI](https://vitrina.ai/blog/top-ott-platforms-africa-2026)
- [Kenya piracy losses - Screen Daily](https://www.screendaily.com/news/kenya-is-losing-22m-a-day-to-piracy-challenges-opportunities-for-african-distributors-in-spotlight/5198449.article)
- [Kenya piracy crisis - HapaKenya](https://hapakenya.com/2025/08/31/kenyas-digital-success-is-fuelling-a-piracy-crisis-but-what-should-we-do/)
- [Netflix data usage Africa - TechPoint](https://techpoint.africa/guide/netflix-data-usage-guide/)
- [Showmax data savings - Broadcast Media Africa](https://broadcastmediaafrica.com/2024/11/04/south-africa-showmax-tops-mobile-data-savings-among-streaming-services/)
- [Concurrent stream limiting - VdoCipher](https://www.vdocipher.com/blog/concurrent-stream-limit/)
- [Concurrent stream limiting - PallyCon](https://pallycon.com/blog/what-is-concurrent-stream-limit-csl/)
- [HLS.js guide 2025 - VideoSDK](https://www.videosdk.live/developer-hub/hls/hls-js)
- [M-Pesa integration guide - Webpinn](https://webpinn.com/mpesa-integration-guide-kenya/)
- [Community referral programs - Viral Loops](https://viral-loops.com/blog/community-launch-referral-marketing/)
- [ViuSasa - Kenyan Backpacker](https://kenyanbackpacker.com/viusasa-revolutionizing-entertainment-in-kenya/)
- [StarTimes Kenya packages - Business Radar](https://www.businessradar.co.ke/blog/2025/01/17/startimes-packages-in-kenya-prices-features-and-how-to-subscribe-in-2025/)
- [Netflix UX deep dive - CreateBytes](https://createbytes.com/insights/netflix-design-analysis-ui-ux-review)
- [Renewal reminder best practices - Glue Up](https://www.glueup.com/blog/renewal-reminder-best-practices)
- [Netflix architecture reverse-engineered - GitHub Gist](https://gist.github.com/sshh12/dda3a89514f850c459380b18b1f7eb7b)
- [Streaming industry predictions 2026 - Streaming Media](https://www.streamingmedia.com/Articles/News/Online-Video-News/Roundup-Streaming-Industry-Predictions-for-2026-172903.aspx)

---
*Feature research for: Lumio -- Premium East African Video Streaming Platform*
*Researched: 2026-03-07*
