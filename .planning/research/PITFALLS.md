# Pitfalls Research

**Domain:** Premium streaming platform (East Africa, M-Pesa payments, HLS video)
**Researched:** 2026-03-07
**Confidence:** MEDIUM-HIGH (verified across multiple sources; M-Pesa specifics verified against Safaricom docs and developer community)

---

## Critical Pitfalls

Mistakes that cause rewrites, revenue loss, or major service failures.

### Pitfall 1: M-Pesa Callback Loss Causing Silent Payment Failures

**What goes wrong:**
Safaricom's Daraja API sends a single callback notification per STK Push transaction. If your server is down, returns a non-200 response, or takes longer than 30 seconds to respond, the callback is lost permanently. There is no retry mechanism from Safaricom's side. The payment succeeds on M-Pesa's end (money leaves the customer's wallet) but your system never records it. The customer paid but gets no subscription access, and you have no record of the payment.

**Why it happens:**
Developers assume callback delivery works like webhooks from Stripe or PayPal where retries are standard. M-Pesa does not retry failed callbacks. Safaricom's documentation explicitly states: "There are no repeat calls for failed callbacks." The only fallback is the Transaction Status Query API, which must be called proactively by your system.

**How to avoid:**
1. Implement a reconciliation cron job that runs every 5-10 minutes, querying the Transaction Status API for any pending payments older than 2 minutes that have not received a callback.
2. Store the `CheckoutRequestID` immediately when initiating STK Push (before the callback arrives) with status `PENDING`.
3. Make your callback endpoint idempotent -- processing the same callback twice must not create duplicate subscriptions or credits.
4. Keep callback processing under 5 seconds: acknowledge receipt immediately, then process asynchronously.
5. Log the raw callback payload before any processing for audit and debugging.

**Warning signs:**
- Customer support tickets saying "I paid but can't access content"
- Discrepancies between M-Pesa statement totals and your payment records
- Pending payments that never resolve to success or failure

**Phase to address:**
Payment integration phase. This must be designed into the payment architecture from day one, not bolted on later.

---

### Pitfall 2: Sandbox-to-Production M-Pesa Migration Shock

**What goes wrong:**
The Daraja sandbox only tests the "happy path" -- API calls almost always succeed, making it impossible to properly test failure scenarios like insufficient funds (ResultCode 1), user cancellation (ResultCode 1032), timeout/unreachable (ResultCode 1037), subscriber locked (ResultCode 1001), or expired STK prompt (ResultCode 1019). Developers ship code that works flawlessly in sandbox but fails catastrophically in production where 30-40% of STK Push attempts may fail for legitimate reasons.

As of early 2026, Daraja 3.0's sandbox has been reported as particularly unstable, leading the developer community to build alternatives like "Pesa Playground" for more realistic testing.

**Why it happens:**
Production requires: (a) a registered Paybill or Till Number, (b) a go-live request letter on company letterhead sent to Safaricom, (c) server IP whitelisting by Safaricom, (d) switching from `sandbox.safaricom.co.ke` to `api.safaricom.co.ke`, and (e) new production credentials. Developers often underestimate the approval timeline (days to weeks) and don't account for the drastically different error landscape in production.

**How to avoid:**
1. Build comprehensive error handling for ALL known ResultCodes (0, 1, 1001, 1019, 1025, 1032, 1037, 2001, 9999) from the start, not just ResultCode 0 (success).
2. Simulate failure scenarios in your own test suite by mocking Daraja callbacks with realistic error payloads.
3. Start the go-live application process early -- submit the letter to `m-pesabusiness@safaricom.co.ke` at least 2-3 weeks before you need production access.
4. Plan a "soft launch" period with small real transactions to validate your error handling.
5. Implement user-facing retry flows: when STK Push fails, show the specific error message and a "Try Again" button rather than a generic error.

**Warning signs:**
- Zero error handling tests for non-zero ResultCodes
- No mock callback fixtures for failure scenarios
- Production launch date approaching without go-live approval

**Phase to address:**
Payment integration phase, but the go-live application should begin during the previous phase to allow for Safaricom's review timeline.

---

### Pitfall 3: HLS Transcoding Without Keyframe Alignment

**What goes wrong:**
When transcoding source video into multiple quality variants (e.g., 360p, 480p, 720p, 1080p), each variant must have keyframes at exactly the same timestamps. Without forced keyframe alignment, adaptive bitrate switching fails: the player cannot cleanly switch between qualities at segment boundaries, causing visual glitches, frozen frames, or buffering during quality transitions. This renders the entire adaptive bitrate feature broken.

**Why it happens:**
FFmpeg's default behavior uses scene-change detection to insert keyframes, which produces different keyframe positions for each resolution/bitrate. Developers transcode each variant independently without understanding that segment boundaries across variants must align perfectly. The problem is invisible during testing with a single quality level.

**How to avoid:**
1. Use identical `-force_key_frames "expr:gte(t,n_forced*6)"` (for 6-second segments) across ALL variant encodes.
2. Set `-sc_threshold 0` to disable scene-change detection that would insert extra keyframes.
3. Set the GOP size with `-g 48` (for 24fps content at 2-second keyframe intervals) or `-g 120` (for 30fps at 4-second intervals).
4. Validate output with `ffprobe` to confirm keyframes land at consistent timestamps across all variants.
5. Build transcoding as a pipeline with a single config controlling all variants, not separate encode commands.

**Warning signs:**
- Quality switching causes visible glitches or rebuffering
- `ffprobe` shows different keyframe intervals between quality variants
- Segment durations differ by more than 0.5 seconds between variants

**Phase to address:**
Video infrastructure phase. Must be correct in the transcoding pipeline before any content is uploaded. Retroactive fixes require re-transcoding the entire library.

---

### Pitfall 4: Cloudflare R2 as Video Source Without Proper HLS Segmentation

**What goes wrong:**
R2 stores objects as single files. If you upload MP4 files and try to stream them directly, users must download the entire file before playback begins. Even for smaller files, R2 does not perform transcoding, adaptive bitrate packaging, or HLS segmentation. Developers upload content to R2 expecting it to "just work" like a video hosting service. Large MP4 files (1GB+) streamed directly from R2 have been reported to stop playing every ~10 minutes, requiring page reloads.

**Why it happens:**
Confusion between object storage (R2) and video processing services (Cloudflare Stream). R2 is a blob store -- it serves files. It does not transform them. Developers accustomed to services like Cloudflare Stream, Mux, or AWS MediaConvert expect processing capabilities that don't exist in R2.

**How to avoid:**
1. Build a transcoding pipeline (FFmpeg) that converts source video into HLS format BEFORE uploading to R2: one `.m3u8` master playlist, variant playlists for each quality level, and `.ts` segment files (6-10 seconds each).
2. Upload the complete HLS package (playlists + segments) to R2, not raw MP4 files.
3. Configure Cloudflare CDN caching rules for HLS content: cache `.ts` segments aggressively (long TTL, immutable), cache `.m3u8` playlists with shorter TTL.
4. Add the `accept-ranges: bytes` response header via Cloudflare Transform Rules if doing any range-request-based delivery.
5. Consider Cloudflare Stream instead of R2 if you want managed transcoding and adaptive delivery, but weigh the cost difference.

**Warning signs:**
- Video takes 10+ seconds to start playing
- No `.m3u8` files in your R2 bucket -- only `.mp4`
- Users reporting playback stops mid-video
- No multiple quality options visible in the player

**Phase to address:**
Video infrastructure phase. The transcoding pipeline must exist before content upload begins.

---

### Pitfall 5: JWT Concurrent Session Limit Without Server-Side State

**What goes wrong:**
JWTs are stateless by design. A 2-device concurrent session limit fundamentally requires server-side state to track active sessions. Developers attempt to encode the device limit into the JWT itself or rely on client-side enforcement, both of which are trivially bypassable. Without server-side session tracking, there is no reliable way to: (a) know how many active sessions exist, (b) invalidate a specific session when the limit is exceeded, or (c) prevent token reuse after "logout."

**Why it happens:**
The appeal of JWT is statelessness. Adding a session table feels like defeating the purpose. But concurrent device limits are inherently a stateful problem. The JWT contains the identity; the session table tracks where that identity is currently active.

**How to avoid:**
1. Maintain a `sessions` table in PostgreSQL: `id`, `user_id`, `device_fingerprint`, `refresh_token_hash`, `created_at`, `last_active_at`, `is_active`.
2. On login, check active session count. If >= 2, either reject the login or prompt the user to choose which existing session to terminate.
3. Store one refresh token per device per user. The refresh token is the session anchor.
4. Use short-lived access tokens (15 minutes) so that revoked sessions naturally expire quickly.
5. On refresh token rotation, validate the session still exists and is active in the database.
6. Handle the race condition: two simultaneous logins on new devices when the user is already at 1/2 sessions. Use a database transaction with row-level locking on the user's sessions to prevent both from succeeding.

**Warning signs:**
- No `sessions` table in the database schema
- No middleware checking session validity on token refresh
- Users reporting they can log in on 3+ devices simultaneously

**Phase to address:**
Auth and session management phase. This is architectural -- it shapes the entire auth flow and cannot be retrofitted without breaking existing sessions.

---

### Pitfall 6: Missing Payment-to-Subscription Atomicity

**What goes wrong:**
The flow "receive payment callback -> create/extend subscription -> grant access" has multiple failure points. If the process crashes between recording the payment and activating the subscription, the customer has paid but has no access. If it crashes between activating the subscription and confirming to the user, the user thinks payment failed and pays again, creating a double charge. Without atomicity, partial states proliferate.

**Why it happens:**
Developers treat payment processing as a simple if/then: "if payment succeeds, activate subscription." But distributed systems (M-Pesa callback -> your server -> database -> notification) have multiple failure points. Any step can fail independently.

**How to avoid:**
1. Use database transactions: payment record creation and subscription activation must be in the same transaction.
2. Implement idempotency: use the M-Pesa `CheckoutRequestID` as an idempotency key. If a callback is processed twice, the second execution must be a no-op.
3. Design a state machine for payments: `INITIATED -> PENDING -> CONFIRMED -> SUBSCRIPTION_ACTIVATED` (or `FAILED`). Each state transition is explicit and logged.
4. The reconciliation job (from Pitfall 1) should also check for payments stuck in `CONFIRMED` but not yet `SUBSCRIPTION_ACTIVATED`.
5. Store the M-Pesa `TransactionID` and `CheckoutRequestID` to enable manual reconciliation when automated processes fail.

**Warning signs:**
- Payment records without corresponding subscription records
- Subscription records without corresponding payment records
- Users with active subscriptions but no payment history

**Phase to address:**
Payment integration phase, specifically during subscription activation flow design.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping HLS encryption (AES-128) | Faster initial setup, simpler CDN config | Content can be freely downloaded and redistributed; content owners may refuse to license to you | MVP only, with explicit plan to add AES-128 before any premium/licensed content |
| Single-server cron jobs (no distributed locking) | Simple implementation | Double-charges, duplicate notifications, missed expirations when you scale to multiple servers | Never for payment/billing crons; acceptable for non-critical jobs like analytics |
| Storing M-Pesa credentials in environment variables without rotation | Quick setup | If credentials leak, attacker can initiate transactions on your Paybill; no audit trail of credential access | Never in production; use a secrets manager with rotation |
| Hardcoding M-Pesa sandbox URLs and toggling with env vars | Quick dev/prod switching | Inevitably someone deploys with sandbox config to production, or vice versa; transactions silently go to wrong environment | MVP, but replace with environment-specific config validation on startup |
| Using a single JWT secret for all token types | Simpler key management | Compromise of access token secret also compromises refresh tokens; cannot rotate independently | Never; use separate secrets for access and refresh tokens from day one |
| Polling for subscription expiry instead of event-driven checks | Simpler to implement | Polling interval creates a window where expired users retain access; resource waste at scale | MVP with short polling interval (1 minute), but migrate to event-driven before scaling |

## Integration Gotchas

Common mistakes when connecting to external services in this stack.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Daraja API OAuth | Caching the access token without handling expiry; token expires after 3600 seconds but devs cache indefinitely | Cache the token with its expiry timestamp. Request a new token 5 minutes before expiry. Never cache in a shared mutable variable without thread safety |
| Daraja STK Push | Setting `TransactionDesc` longer than 182 characters | Enforce a hard limit in your API layer. This is a silent rejection -- Safaricom returns error 1025/9999 without clear explanation |
| Cloudflare R2 | Making the bucket public for convenience | Use presigned URLs with short expiry (1-2 hours) for video segment delivery. Presigned URLs are cryptographically protected against tampering |
| Cloudflare CDN | Not configuring cache rules for HLS content, resulting in cache misses on every segment request | Create Page Rules or Cache Rules: `.ts` segments with `Cache-Control: public, max-age=31536000, immutable`; `.m3u8` playlists with shorter TTL (5-60 minutes) |
| HLS.js in Next.js | Importing HLS.js at the top level causing SSR failures since HLS.js requires `window` and `document` | Dynamic import with `next/dynamic` and `ssr: false`, or use `useEffect` with conditional `import('hls.js')` |
| Prisma with PostgreSQL | Using `findFirst` + `update` for concurrent session checks instead of atomic operations | Use `$transaction` with serializable isolation, or raw SQL with `SELECT ... FOR UPDATE` for session slot allocation |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full video catalog on page load | Initial page load > 3 seconds, high bandwidth usage | Implement pagination/infinite scroll with cursor-based queries; load thumbnails lazily | 50+ videos in catalog |
| No CDN cache warming for popular content | First viewers of new content experience 2-5 second load times as segments are fetched from R2 origin | Pre-warm CDN cache for new releases by requesting key segments after upload | Any new content release |
| HLS.js `backBufferLength: Infinity` (default) | Memory usage grows continuously during playback; rebuffering starts 30-90 minutes in; worse on mobile devices | Set `backBufferLength: 30` for VOD, `backBufferLength: 10` for any live content | After 30+ minutes of continuous playback, especially on mobile |
| Checking subscription status with a database query on every API request | Database becomes bottleneck at scale; latency increases across all endpoints | Cache subscription status in Redis or in-memory with short TTL (60 seconds); invalidate on payment/expiry events | 100+ concurrent users making API calls |
| Single-quality video encoding (no ABR) | Buffering on slow connections; bandwidth waste on fast ones | Always encode at minimum 3 variants: 360p (low), 720p (medium), 1080p (high) | Any user not on strong 4G/WiFi -- common in East Africa where average speeds vary from 14 to 72 Mbps depending on carrier |
| Un-optimized thumbnail generation | Slow catalog browsing; high origin bandwidth for image assets | Generate multiple thumbnail sizes at upload time; serve via Cloudflare CDN with format negotiation (WebP/AVIF) | 100+ videos, each with poster images |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Serving HLS segments without any access control | Anyone with segment URLs can download your entire content library using `ffmpeg` or browser dev tools | Use signed URLs for `.ts` segments with 1-2 hour expiry; validate subscription status before generating signed URLs |
| Not validating M-Pesa callback origin | Attacker sends fake "payment successful" callbacks to your endpoint, granting free subscriptions | Validate callbacks by: (1) checking source IP against Safaricom's known ranges, (2) querying Transaction Status API to confirm the transaction independently, (3) validating the `CheckoutRequestID` matches a payment you initiated |
| Storing M-Pesa phone numbers without encryption at rest | Data breach exposes customer financial identifiers; regulatory risk under Kenya's Data Protection Act 2019 | Encrypt phone numbers at rest in PostgreSQL; hash them for lookup purposes; limit access to raw numbers |
| JWT refresh tokens stored in localStorage | XSS attack can steal refresh tokens and hijack sessions indefinitely | Store refresh tokens in httpOnly, secure, sameSite cookies. Access tokens can be in memory only |
| No rate limiting on STK Push initiation | Attacker triggers thousands of STK Push requests to arbitrary phone numbers, causing spam and potential Safaricom account suspension | Rate limit per user (max 1 STK Push per 30 seconds), per phone number (max 3 per 5 minutes), and globally |
| Video URL patterns that are guessable | Content IDs in sequential integers allow enumeration of entire library | Use UUIDs or content hashes for video identifiers in URLs; never expose database IDs |

## UX Pitfalls

Common user experience mistakes for a streaming platform targeting East Africa.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No offline/low-bandwidth fallback for the app shell | Users on 3G see blank screens or infinite spinners; they leave | Pre-render critical UI with Next.js SSR/SSG; show skeleton screens immediately; progressive enhancement for video content |
| STK Push with no user feedback during the wait | User sees no indication that a payment prompt was sent; they press "Pay" again, creating duplicate pending payments | Show a modal with: (1) "Check your phone for M-Pesa prompt", (2) a countdown timer (60 seconds), (3) a "Didn't receive? Try again" button that only appears after timeout |
| Forcing high-quality playback on slow connections | Constant buffering drives users away | Start at the lowest quality variant and let ABR scale up. East Africa: include a 360p@400kbps variant for 3G users |
| No "resume playback" across devices | User starts watching on phone, switches to laptop, loses their place | Store playback position server-side on pause/close events; resume from saved position on any device |
| Generic error messages for payment failures | User sees "Payment failed" with no idea what happened or what to do | Map M-Pesa ResultCodes to user-friendly messages: 1032 -> "You cancelled the payment. Tap to try again"; 1037 -> "We couldn't reach your phone. Check your network and try again"; 1 -> "Insufficient M-Pesa balance" |
| Subscription expiry with no warning | User's access cuts off mid-viewing; frustrating and feels hostile | Send push/SMS notification at 3 days, 1 day, and 2 hours before expiry; show an in-app banner during the last 24 hours |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **M-Pesa Integration:** Often missing reconciliation job for lost callbacks -- verify you have a cron that queries Transaction Status API for stale PENDING payments
- [ ] **M-Pesa Integration:** Often missing production error handling -- verify you handle ALL ResultCodes (0, 1, 1001, 1019, 1025, 1032, 1037, 2001, 9999), not just success (0)
- [ ] **HLS Streaming:** Often missing keyframe alignment across quality variants -- verify with `ffprobe` that all variants have keyframes at identical timestamps
- [ ] **HLS Streaming:** Often missing the lowest quality tier for 3G -- verify you have a 360p@400kbps variant
- [ ] **Video Player:** Often missing `backBufferLength` configuration -- verify HLS.js is not using the Infinity default
- [ ] **Session Management:** Often missing the race condition guard on concurrent login -- verify two simultaneous logins from new devices when at 1/2 sessions cannot both succeed
- [ ] **Subscription Guard:** Often missing the check on video segment delivery -- verify that subscription status is checked when generating signed URLs for segments, not just on page load
- [ ] **Referral Discounts:** Often missing the cap enforcement -- verify that stacking 10% discounts cannot reduce the price below your minimum viable amount (e.g., the M-Pesa minimum transaction amount)
- [ ] **Referral Discounts:** Often missing atomicity on discount application during payment -- verify that a referral discount cannot be applied twice if two referred users pay simultaneously (use reservation pattern)
- [ ] **Auto-Renewal Cron:** Often missing distributed locking -- verify that running the cron on multiple servers does not process the same subscription twice
- [ ] **Content Protection:** Often missing encryption for HLS segments -- verify `.ts` files are encrypted with AES-128 and keys are served only to authenticated users

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Lost M-Pesa callbacks | LOW | Run a bulk reconciliation using Transaction Status Query API for all PENDING payments in the last 24-48 hours; retroactively activate subscriptions |
| Unaligned keyframes in existing content | HIGH | Re-transcode the entire content library with correct FFmpeg settings; no way to fix in place |
| Sessions table missing (pure JWT auth) | MEDIUM | Add sessions table; force all users to re-login on next token refresh; existing tokens naturally expire within access token TTL |
| Payment without subscription activation | LOW | Query all payments with `CONFIRMED` status that lack a corresponding active subscription; activate them in batch; notify affected users |
| Content served without encryption | MEDIUM | Re-package all HLS content with AES-128 encryption; update all playlist URLs; existing cached segments remain unencrypted until CDN cache expires |
| Referral discount exploited (over-stacking) | MEDIUM | Audit all subscriptions with referral discounts; cap retroactively; absorb the revenue difference as a customer goodwill cost; fix the logic going forward |
| Double-charged by cron job | HIGH | Identify affected users from payment logs; issue M-Pesa B2C refunds (requires separate Daraja API integration); high customer trust damage |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| M-Pesa callback loss | Payment Integration | Reconciliation cron exists; simulate callback failure and verify recovery within 10 minutes |
| Sandbox-to-production shock | Payment Integration | All ResultCodes handled; mock callback test suite covers every error code |
| Keyframe misalignment | Video Infrastructure | `ffprobe` validation script confirms identical keyframe timestamps across all variants |
| R2 without HLS segmentation | Video Infrastructure | Uploaded content consists of `.m3u8` + `.ts` files, not raw `.mp4` |
| JWT without session state | Auth & Sessions | Sessions table exists; login from 3rd device when at limit is rejected or prompts session selection |
| Payment-subscription atomicity | Payment Integration | Kill the process mid-callback-processing; verify subscription state is consistent after recovery |
| HLS.js memory leak | Video Player / Frontend | 60-minute playback test on mobile shows stable memory usage |
| Content served unprotected | Video Infrastructure | Attempt to access `.ts` segment URL without valid signed URL; verify 403 response |
| Referral discount race condition | Referral System | Two concurrent payments with same referral code; verify discount applies only once |
| Cron double-processing | Subscription Lifecycle | Run expiry cron simultaneously on two processes; verify no duplicate charges or notifications |
| STK Push spam | Payment Integration | Rate limiting verified: >1 request per 30 seconds from same user returns 429 |

## Sources

**M-Pesa / Daraja API:**
- [Common MPESA Daraja API error codes - Tuma Payment Solutions](https://tuma.co.ke/common-mpesa-daraja-api-error-codes-explanation-and-mitigation/) (MEDIUM confidence -- developer community resource, verified against Safaricom docs)
- [Common M-PESA API Errors - WooDev](https://woodev.co.ke/common-m-pesa-api-errors/) (MEDIUM confidence -- verified error codes match Tuma and Safaricom)
- [How to Go Live with M-Pesa Daraja API - DEV Community](https://dev.to/msnmongare/how-to-go-live-with-m-pesa-daraja-api-production-environment-4h96) (MEDIUM confidence -- community guide)
- [Daraja 3.0 sandbox issues - Tech-ish Kenya](https://tech-ish.com/2026/01/28/safaricom-m-pesa-daraja-3-0-sandbox-issues-spur-pesa-playground-alternative/) (HIGH confidence -- news report, January 2026)
- [Safaricom Daraja Developer Portal](https://developer.safaricom.co.ke/) (HIGH confidence -- official source)
- [M-Pesa Daraja Callback Handling - Next.js docs](https://mpesa-nextjs-docs.vercel.app/handling-callback) (MEDIUM confidence)

**HLS / Video Streaming:**
- [HLS.js Cautionary Tale: QoE and Memory - Mux](https://www.mux.com/blog/an-hls-js-cautionary-tale-qoe-and-video-player-memory) (HIGH confidence -- authoritative video infrastructure vendor)
- [Adaptive Bitrate Streaming - Mux](https://www.mux.com/articles/adaptive-bitrate-streaming-how-it-works-and-how-to-get-it-right) (HIGH confidence)
- [FFmpeg HLS Segmenter Guide](https://copyprogramming.com/howto/hls-implementation-with-ffmpeg) (MEDIUM confidence -- technical guide)
- [HLS Packaging using FFmpeg - OTTVerse](https://ottverse.com/hls-packaging-using-ffmpeg-live-vod/) (MEDIUM confidence)
- [HLS Encryption AES-128 - Dacast](https://www.dacast.com/blog/hls-encryption-for-video/) (MEDIUM confidence)

**Cloudflare R2:**
- [Cloudflare Community: Video Streaming from R2](https://community.cloudflare.com/t/is-streaming-public-videos-from-r2-via-cloudflare-cdn-allowed/853060) (MEDIUM confidence -- community forum)
- [Cloudflare Community: R2 for Video Streaming](https://community.cloudflare.com/t/r2-for-video-streaming/700246) (MEDIUM confidence)
- [Cloudflare R2 Presigned URLs Documentation](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) (HIGH confidence -- official docs)

**Session Management / Auth:**
- [Device Limiting - FusionAuth](https://fusionauth.io/docs/extend/examples/device-limiting) (MEDIUM confidence -- vendor docs for a different product, but pattern is general)
- [JWTs for Sessions Done Right - SuperTokens](https://supertokens.com/blog/are-you-using-jwts-for-user-sessions-in-the-correct-way) (MEDIUM confidence -- vendor blog, well-cited)
- [Instacart Race Condition in Redeeming Coupons - HackerOne](https://hackerone.com/reports/157996) (HIGH confidence -- actual disclosed vulnerability)
- [Optimistic Locking with Prisma](https://oneuptime.com/blog/post/2026-01-25-optimistic-locking-prisma-nodejs/view) (MEDIUM confidence)

**East Africa / Bandwidth:**
- [Kenya Mobile Internet Speeds 2025 - TechTrends Kenya](https://techtrendske.co.ke/2026/02/14/kenya-mobile-internet-speeds/) (MEDIUM confidence -- tech news, February 2026)
- [Kenya internet speed statistics - SpeedGEO](https://www.speedgeo.net/statistics/kenya) (MEDIUM confidence)

---
*Pitfalls research for: Lumio -- premium streaming platform for East Africa*
*Researched: 2026-03-07*
