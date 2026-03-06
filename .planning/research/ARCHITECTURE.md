# Architecture Research

**Domain:** Premium video streaming platform (East Africa)
**Researched:** 2026-03-07
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```
                              INTERNET
                                 |
                    +-----------++-----------+
                    |     Cloudflare CDN     |
                    |  (DNS + Edge Caching)  |
                    +-----------++-----------+
                                |
              +-----------------+-----------------+
              |                                   |
     +--------v--------+                +---------v--------+
     |   VPS / Docker  |                |  Cloudflare R2   |
     |  (Ubuntu + Nginx|                |  (Object Storage)|
     |   reverse proxy)|                |                  |
     +--------+--------+                |  /videos/        |
              |                         |    master.m3u8   |
     +--------v--------+               |    segments/*.ts  |
     |                  |               |  /thumbnails/    |
     |  +-----------+   |              |    posters/      |
     |  | Next.js   |   |              |    banners/      |
     |  | Client    |   |              +------------------+
     |  | (SSR)     |   |                       ^
     |  | Port 3000 |   |                       |
     |  +-----------+   |            +----------+---------+
     |                  |            | Cloudflare Worker   |
     |  +-----------+   |            | (Segment Auth +    |
     |  | Express   |   |            |  Cache Headers)    |
     |  | API       |   |            +--------------------+
     |  | Port 5000 |   |
     |  +-----------+   |
     |                  |
     |  +-----------+   |
     |  | Admin     |   |
     |  | Next.js   |   |
     |  | Port 3001 |   |
     |  +-----------+   |
     |                  |
     +--------+---------+
              |
     +--------v--------+       +-------------------+
     |   PostgreSQL     |       |  External APIs    |
     |   (via Prisma)   |       |                   |
     |                  |       |  - Daraja (M-Pesa)|
     |   Port 5432      |       |  - SendGrid/SMTP  |
     +------------------+       +-------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Next.js Client** | SSR page rendering, client-side navigation, video player UI, auth state, content browsing | Next.js 14 App Router with Server Components for catalog pages, Client Components for interactive player |
| **Express API** | Business logic, authentication, session management, payment orchestration, content CRUD, subscription enforcement | Layered architecture: Routes -> Controllers -> Services -> Prisma (DAO) |
| **Admin Panel** | Content management (CRUD for movies/series/docs/channels), user management, billing oversight, analytics dashboard | Separate Next.js app consuming same Express API with admin-scoped endpoints |
| **PostgreSQL** | Persistent storage for users, content metadata, payments, sessions, referrals, watchlist, watch progress | Managed via Prisma ORM with typed queries and migrations |
| **Cloudflare R2** | Object storage for HLS video segments (.ts), playlist manifests (.m3u8), thumbnail images, poster art | S3-compatible API, zero egress fees, organized by content ID |
| **Cloudflare CDN** | Edge caching of video segments, static assets, DNS management, DDoS protection | Automatic when R2 is connected via custom domain or Worker |
| **Cloudflare Worker** | Authenticated video segment delivery, cache header management, optional signed URL validation | Hono or vanilla Worker binding to R2 bucket |
| **Cron Service** | Subscription expiry checks, auto-renewal triggers, notification scheduling, stale session cleanup | node-cron running inside the Express process (or a dedicated worker process) |
| **Nginx** | Reverse proxy, SSL termination (Let's Encrypt), request routing between client/API/admin | Docker container or host-level service |

## Recommended Project Structure

```
lumio/
├── client/                          # Next.js 14 client app
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── (auth)/              # Auth route group (login, register)
│   │   │   ├── (browse)/            # Browse route group (home, movies, series, docs, live)
│   │   │   ├── (user)/              # User route group (account, billing, watchlist, invite)
│   │   │   ├── watch/[contentId]/   # Video player page
│   │   │   ├── layout.tsx           # Root layout with auth provider
│   │   │   └── page.tsx             # Landing/home redirect
│   │   ├── components/
│   │   │   ├── ui/                  # Reusable UI primitives (Button, Modal, Card)
│   │   │   ├── content/             # ContentRow, HeroSlider, ContentCard, HoverPopover
│   │   │   ├── player/              # VideoPlayer, PlayerControls, ProgressBar
│   │   │   ├── layout/              # Navbar, Footer, Sidebar
│   │   │   └── payment/             # MpesaModal, PlanSelector, PaymentHistory
│   │   ├── hooks/                   # Custom React hooks (useAuth, useWatchProgress, useSearch)
│   │   ├── lib/                     # Utility functions, API client, constants
│   │   │   ├── api.ts               # Axios/fetch wrapper for Express API calls
│   │   │   ├── auth.ts              # Token storage, refresh logic
│   │   │   └── constants.ts         # API URLs, content type enums
│   │   ├── types/                   # TypeScript interfaces (Content, User, Payment)
│   │   └── styles/                  # Global styles, Tailwind config
│   ├── public/                      # Static assets (favicon, og images)
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
│
├── server/                          # Express.js backend API
│   ├── src/
│   │   ├── routes/                  # Route definitions (one file per domain)
│   │   │   ├── auth.routes.ts       # /api/auth/*
│   │   │   ├── content.routes.ts    # /api/content/*
│   │   │   ├── user.routes.ts       # /api/users/*
│   │   │   ├── payment.routes.ts    # /api/payments/*
│   │   │   ├── referral.routes.ts   # /api/referrals/*
│   │   │   ├── watchlist.routes.ts  # /api/watchlist/*
│   │   │   ├── admin.routes.ts      # /api/admin/*
│   │   │   └── index.ts             # Route aggregator
│   │   ├── controllers/             # Request/response handlers (thin layer)
│   │   │   ├── auth.controller.ts
│   │   │   ├── content.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   └── ...
│   │   ├── services/                # Business logic (thick layer)
│   │   │   ├── auth.service.ts      # JWT issuance, session creation, device limit enforcement
│   │   │   ├── content.service.ts   # Content CRUD, search, recommendations
│   │   │   ├── payment.service.ts   # Daraja API calls, payment state machine
│   │   │   ├── subscription.service.ts  # Plan management, expiry checks, renewals
│   │   │   ├── referral.service.ts  # Code generation, credit calculation
│   │   │   ├── notification.service.ts  # Email dispatch (SendGrid/Nodemailer)
│   │   │   ├── storage.service.ts   # R2 upload, presigned URLs, thumbnail management
│   │   │   └── session.service.ts   # Multi-device tracking, stale cleanup
│   │   ├── middleware/              # Express middleware chain
│   │   │   ├── auth.middleware.ts   # JWT verification, req.user population
│   │   │   ├── subscription.middleware.ts  # Active subscription guard
│   │   │   ├── admin.middleware.ts  # Admin role verification
│   │   │   ├── rateLimit.middleware.ts     # Rate limiting (100/min API, 5/min auth)
│   │   │   ├── validate.middleware.ts      # Request body validation (Zod)
│   │   │   └── error.middleware.ts  # Global error handler
│   │   ├── jobs/                    # Cron job definitions
│   │   │   ├── subscriptionExpiry.job.ts   # Check & deactivate expired subs
│   │   │   ├── autoRenewal.job.ts          # Trigger M-Pesa for auto-renew users
│   │   │   ├── notifications.job.ts        # Send expiry warning emails
│   │   │   └── sessionCleanup.job.ts       # Remove stale sessions (7+ days)
│   │   ├── utils/                   # Helpers (password hashing, token generation, date formatting)
│   │   ├── config/                  # Environment config, database URL, Daraja keys
│   │   ├── types/                   # Shared TypeScript types
│   │   └── app.ts                   # Express app setup (middleware chain, route mounting)
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   ├── migrations/              # Migration history
│   │   └── seed.ts                  # Seed data for development
│   └── package.json
│
├── admin/                           # Admin panel (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/           # Analytics overview
│   │   │   ├── content/             # Content CRUD (movies, series, docs, channels)
│   │   │   │   ├── movies/
│   │   │   │   ├── series/
│   │   │   │   ├── documentaries/
│   │   │   │   └── channels/
│   │   │   ├── users/               # User management
│   │   │   ├── billing/             # Payment history, revenue
│   │   │   ├── settings/            # Daraja config, pricing, limits
│   │   │   └── logs/                # Activity audit trail
│   │   ├── components/              # Admin-specific components (DataTable, Charts, Forms)
│   │   └── lib/                     # Admin API client (same Express backend, admin routes)
│   └── package.json
│
├── docker-compose.yml               # PostgreSQL, Redis (optional), Nginx, client, server, admin
├── nginx/
│   └── nginx.conf                   # Reverse proxy config for all services
├── .env.example                     # Environment variable template
└── README.md
```

### Structure Rationale

- **`client/src/app/(browse)/`:** Route groups separate auth pages from browse pages from user account pages. Each group can have its own layout (browse pages get the navbar + sidebar; auth pages are minimal).
- **`server/src/services/`:** This is the "thick" layer where all business logic lives. Controllers are deliberately thin -- they extract params and call services. This makes business logic testable independent of HTTP.
- **`server/src/middleware/`:** Ordered middleware chain is critical: rate limiting -> auth -> subscription guard -> validation -> controller. Each middleware has a single responsibility.
- **`server/src/jobs/`:** Cron jobs are separated from services. Jobs call services, not the other way around. This prevents circular dependencies and keeps job scheduling logic isolated.
- **`admin/` as separate Next.js app:** Different auth flow (admin-only), different UI library concerns (data tables, charts vs. media cards, player), independently deployable.

## Architectural Patterns

### Pattern 1: Layered Service Architecture (Express API)

**What:** Requests flow through distinct layers: Route -> Controller -> Service -> Prisma/External API. Each layer has a single concern.
**When to use:** All Express API endpoints. No exceptions.
**Trade-offs:** More files to manage, but testability and maintainability are dramatically better than putting logic in route handlers.

**Example:**
```typescript
// routes/payment.routes.ts
router.post('/stk-push',
  authMiddleware,           // Verify JWT, populate req.user
  subscriptionGuard,        // Check if already has active sub (optional)
  validate(stkPushSchema),  // Validate phone number, plan
  paymentController.initiateStkPush  // Delegate to controller
);

// controllers/payment.controller.ts
async initiateStkPush(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentService.initiateStkPush(
      req.user.id,
      req.body.phoneNumber,
      req.body.planId
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);  // Forward to global error handler
  }
}

// services/payment.service.ts
async initiateStkPush(userId: string, phone: string, planId: string) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Calculate referral discount
  const discount = await referralService.calculateDiscount(userId);
  const finalAmount = plan.price - discount;

  // Call Daraja API
  const darajaResponse = await darajaClient.stkPush({
    phoneNumber: phone,
    amount: finalAmount,
    accountReference: `LUMIO-${userId}`,
    callbackUrl: `${config.apiBaseUrl}/api/payments/callback`,
  });

  // Record pending payment
  await prisma.payment.create({
    data: {
      userId,
      planId,
      amount: finalAmount,
      discount,
      checkoutRequestId: darajaResponse.CheckoutRequestID,
      status: 'PENDING',
    },
  });

  return { checkoutRequestId: darajaResponse.CheckoutRequestID };
}
```

### Pattern 2: JWT + Database Session Tracking (2-Device Limit)

**What:** JWTs are issued for stateless auth verification, but sessions are also tracked in the database to enforce the 2-device concurrent limit. The database is the source of truth for active sessions.
**When to use:** Every authenticated request. The JWT middleware verifies the token signature AND checks the session still exists in the database.
**Trade-offs:** Slightly slower than pure JWT (database lookup per request), but absolutely necessary for device limit enforcement and remote logout capability. Consider Redis caching for the session lookup in production.

**Example:**
```typescript
// services/auth.service.ts
async login(email: string, password: string, deviceInfo: DeviceInfo) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Count active sessions
  const activeSessions = await prisma.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'asc' },
  });

  // Enforce 2-device limit: remove oldest session if at limit
  if (activeSessions.length >= 2) {
    await prisma.session.delete({
      where: { id: activeSessions[0].id },
    });
  }

  const sessionId = crypto.randomUUID();
  const token = jwt.sign(
    { userId: user.id, sessionId },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      ipAddress: deviceInfo.ipAddress,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { token, user: sanitizeUser(user) };
}

// middleware/auth.middleware.ts
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Verify session still exists (handles remote logout, expired sessions)
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId, expiresAt: { gt: new Date() } },
    });
    if (!session) return res.status(401).json({ error: 'Session expired or revoked' });

    req.user = { id: payload.userId, sessionId: payload.sessionId };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Pattern 3: Subscription Guard Middleware

**What:** A middleware that checks whether the current user has an active, non-expired subscription before allowing access to protected content routes.
**When to use:** Applied to all content-serving routes (video playback, content details with full info). NOT applied to billing pages, account settings, or content browse previews.
**Trade-offs:** Adds one database query per request. Can be optimized by caching subscription status in the JWT claims (but then requires token refresh on plan changes).

**Example:**
```typescript
// middleware/subscription.middleware.ts
async function subscriptionGuard(req: Request, res: Response, next: NextFunction) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: req.user.id,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
  });

  if (!subscription) {
    return res.status(403).json({
      error: 'SUBSCRIPTION_REQUIRED',
      message: 'Active subscription required to access this content',
      redirectTo: '/billing',
    });
  }

  req.subscription = subscription;
  next();
}
```

### Pattern 4: M-Pesa Callback Pattern (Asynchronous Payment Confirmation)

**What:** STK Push is asynchronous. The API initiates the push, but confirmation comes later via a Safaricom callback to your server. The payment goes through states: PENDING -> SUCCESS/FAILED.
**When to use:** Every M-Pesa payment flow.
**Trade-offs:** You must handle the gap between "STK push sent" and "callback received." The client polls for status or uses a websocket/SSE connection for real-time updates.

**Example:**
```typescript
// Payment state machine:
// PENDING -> SUCCESS (callback confirms) -> subscription activated
// PENDING -> FAILED (callback rejects OR timeout after 2 min)
// PENDING -> EXPIRED (no callback within 5 min, cron marks expired)

// routes/payment.routes.ts
// This route is called BY Safaricom's servers, not by our client
router.post('/callback', paymentController.handleDarajaCallback);

// controllers/payment.controller.ts
async handleDarajaCallback(req: Request, res: Response) {
  // Safaricom sends result in Body.stkCallback
  const { Body: { stkCallback } } = req.body;
  const { ResultCode, CheckoutRequestID, CallbackMetadata } = stkCallback;

  await paymentService.processCallback(
    CheckoutRequestID,
    ResultCode === 0 ? 'SUCCESS' : 'FAILED',
    CallbackMetadata
  );

  // MUST respond to Safaricom immediately
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}

// services/payment.service.ts
async processCallback(checkoutRequestId: string, status: string, metadata: any) {
  const payment = await prisma.payment.findFirst({
    where: { checkoutRequestId },
  });
  if (!payment) return; // Unknown payment, ignore

  if (status === 'SUCCESS') {
    // Extract M-Pesa receipt number from metadata
    const receiptNumber = extractReceiptNumber(metadata);

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', mpesaReceiptNumber: receiptNumber },
      }),
      prisma.subscription.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          planId: payment.planId,
          startsAt: new Date(),
          expiresAt: calculateExpiry(payment.planId),
          status: 'ACTIVE',
        },
        update: {
          planId: payment.planId,
          expiresAt: calculateExpiry(payment.planId),
          status: 'ACTIVE',
        },
      }),
    ]);

    // Apply referral credits if any
    await referralService.consumeCredits(payment.userId, payment.discount);

    // Send success email
    await notificationService.sendPaymentSuccess(payment.userId, payment);
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    await notificationService.sendPaymentFailure(payment.userId, payment);
  }
}
```

## Data Flow

### Request Flow (Content Browsing)

```
Browser (Next.js Client)
    |
    | 1. User visits /movies
    v
Next.js Server (SSR)
    |
    | 2. Server Component fetches content list
    |    GET /api/content/movies?page=1&category=action
    v
Express API
    |
    | 3. authMiddleware: verify JWT, check session in DB
    | 4. contentController.getMovies()
    | 5. contentService.getMovies(): Prisma query with pagination
    v
PostgreSQL
    |
    | 6. Returns movie records with metadata
    v
Express API
    |
    | 7. Attaches R2 CDN URLs for thumbnails
    |    (e.g., https://cdn.lumio.tv/thumbnails/{contentId}/poster.jpg)
    v
Next.js Server
    |
    | 8. Renders HTML with movie cards, sends to browser
    v
Browser
    | 9. Hydrates, enables client-side interactions
    |    (hover popovers, search overlay, watchlist toggles)
```

### Video Playback Flow

```
Browser
    |
    | 1. User clicks "Play" on content card
    v
Next.js Client
    |
    | 2. Navigate to /watch/{contentId}
    | 3. Client Component mounts VideoPlayer
    | 4. Fetch video URL from Express API
    |    GET /api/content/{contentId}/stream
    v
Express API
    |
    | 5. authMiddleware: verify JWT + active session
    | 6. subscriptionGuard: verify active subscription
    | 7. contentService.getStreamUrl(contentId)
    |    Returns: { url: "https://cdn.lumio.tv/videos/{contentId}/master.m3u8" }
    |    OR generates presigned R2 URL with short TTL
    v
Browser (VideoPlayer Component)
    |
    | 8. Initialize HLS.js with master.m3u8 URL
    | 9. HLS.js fetches master playlist
    v
Cloudflare CDN / R2
    |
    | 10. Returns master.m3u8 (lists all quality variants)
    | 11. HLS.js selects appropriate quality based on bandwidth
    | 12. Fetches resolution-specific playlist (e.g., 720p.m3u8)
    | 13. Begins fetching .ts segments sequentially
    v
Browser (Video Element)
    |
    | 14. Segments decoded and rendered
    | 15. Adaptive bitrate: HLS.js switches quality as bandwidth changes
    | 16. Progress tracking: periodically POST /api/watch-progress
    |     { contentId, timestamp, duration }
```

### M-Pesa Payment Flow

```
Browser (Billing Page)
    |
    | 1. User selects plan, enters M-Pesa phone number
    | 2. POST /api/payments/stk-push { planId, phoneNumber }
    v
Express API
    |
    | 3. paymentService.initiateStkPush()
    | 4. Calculate referral discount
    | 5. Call Daraja API: POST /mpesa/stkpush/v1/processrequest
    v
Safaricom Daraja API
    |
    | 6. Sends STK Push to user's phone
    | 7. Returns CheckoutRequestID
    v
Express API
    |
    | 8. Create PENDING payment record in DB
    | 9. Return CheckoutRequestID to client
    v
Browser
    |
    | 10. Show "Waiting for M-Pesa" modal with spinner
    | 11. Poll: GET /api/payments/status/{checkoutRequestId} every 3s
    v
[User's Phone]
    |
    | 12. User sees STK push prompt
    | 13. Enters M-Pesa PIN
    v
Safaricom Daraja API
    |
    | 14. Processes payment
    | 15. POST /api/payments/callback (to Express API)
    v
Express API
    |
    | 16. paymentService.processCallback()
    | 17. Update payment status: PENDING -> SUCCESS
    | 18. Activate/extend subscription
    | 19. Send confirmation email
    v
Browser (Polling)
    |
    | 20. Next poll returns { status: 'SUCCESS' }
    | 21. Show success state, redirect to browse
```

### Key Data Flows

1. **Content Upload (Admin):** Admin uploads video file -> Express API -> stored temporarily on server disk -> FFmpeg transcodes to HLS (multiple bitrates) -> segments + manifests uploaded to R2 -> metadata saved to PostgreSQL -> content available for streaming.

2. **Session Enforcement:** Login request -> check active session count (Prisma query) -> if >= 2, delete oldest session -> create new session record -> issue JWT containing sessionId -> every authenticated request verifies session exists in DB.

3. **Subscription Lifecycle:** User pays -> PENDING payment created -> M-Pesa callback confirms -> subscription activated with expiry date -> cron job checks daily for expiring subs -> sends 2-day warning email -> subscription expires -> user redirected to billing -> auto-renewal attempted if enabled.

4. **Referral Credit Flow:** User A shares code -> User B registers with code -> User A gets 10% credit record -> User A pays for subscription -> credit deducted from payment amount -> excess credit carries over -> credits capped at 100%.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith is fine. Single VPS with Docker. PostgreSQL on same machine. Node.js single process. All components co-located. |
| 1k-10k users | Add Redis for session caching (avoid DB hit per request). Move PostgreSQL to managed service. Increase VPS resources. Consider PM2 cluster mode for Express. Cloudflare CDN handles video bandwidth. |
| 10k-100k users | Separate Express API to its own VPS. Add load balancer. Move cron jobs to dedicated worker process. Add database connection pooling (PgBouncer). Consider read replicas for content queries. |
| 100k+ users | Split into microservices (auth, content, payments). Add message queue (Redis/BullMQ) for async operations. Horizontal scaling with multiple API instances. CDN pre-warming for popular content. This scale is unlikely for v1 and not worth architecting for upfront. |

### Scaling Priorities

1. **First bottleneck: Database connections.** A single PostgreSQL instance handles ~100 concurrent connections. With session verification on every request, this fills up fast. **Fix:** Add Redis to cache session data and subscription status. Use PgBouncer for connection pooling.

2. **Second bottleneck: Video transcoding.** FFmpeg is CPU-intensive. Transcoding a 2-hour movie at 6 quality levels takes significant time and pegs CPU. **Fix:** Run transcoding as a background job (BullMQ). For v1 with admin-only uploads and modest content library, the VPS CPU is likely sufficient. Consider a dedicated transcoding worker if content volume grows.

3. **Third bottleneck: Concurrent stream count.** R2 + Cloudflare CDN handles this well due to edge caching. HLS segments are small, cacheable files. This is unlikely to be a bottleneck with Cloudflare's network.

## Anti-Patterns

### Anti-Pattern 1: Putting Business Logic in Controllers

**What people do:** Writing payment calculation, subscription management, and referral logic directly in Express route handlers or controllers.
**Why it's wrong:** Untestable without HTTP, logic duplicated across routes (e.g., subscription check in multiple controllers), impossible to reuse in cron jobs.
**Do this instead:** Controllers are 5-10 lines max. They extract params, call a service method, and format the response. All logic lives in services. Cron jobs call the same services.

### Anti-Pattern 2: Streaming Video Directly Through Express

**What people do:** Proxying video files through the Express server (reading from R2 and piping to the client).
**Why it's wrong:** Node.js is single-threaded. Streaming large video files through Express saturates the event loop and blocks all other requests. One user watching a movie blocks the API for everyone.
**Do this instead:** Serve HLS segments directly from R2 via Cloudflare CDN. Express only provides the manifest URL (a small JSON response). The browser fetches video segments directly from the CDN. Express never touches video bytes.

### Anti-Pattern 3: Using JWT Alone for Session Management

**What people do:** Issuing a JWT and trusting it for 7 days without any server-side session tracking.
**Why it's wrong:** Cannot enforce 2-device limit (no way to know how many active tokens exist). Cannot remote-logout a user (token is valid until expiry). Cannot revoke a compromised token.
**Do this instead:** Hybrid approach. JWT for stateless verification (signature check is fast). Session record in database for stateful enforcement (device count, remote logout). Every auth check does both: verify JWT signature AND verify session exists.

### Anti-Pattern 4: Synchronous Video Transcoding on Upload

**What people do:** Starting FFmpeg transcoding in the Express request handler and waiting for it to complete before responding.
**Why it's wrong:** Transcoding takes minutes to hours. The HTTP request times out. The admin gets no feedback. The Express process is blocked.
**Do this instead:** Accept the upload immediately, save the file, create a "PROCESSING" record in the database, and trigger transcoding asynchronously. Use a job queue (BullMQ) or at minimum spawn a child process. Update the database record when transcoding completes. The admin panel polls for status.

### Anti-Pattern 5: Storing Video Files in PostgreSQL or on Express Server Disk

**What people do:** Saving uploaded video files as BLOBs in the database or keeping them on the VPS filesystem permanently.
**Why it's wrong:** Database BLOBs destroy query performance and backup times. VPS disk is limited, not CDN-cached, and creates a single point of failure for content delivery.
**Do this instead:** Upload to Cloudflare R2 immediately after transcoding. Store only the R2 object key in PostgreSQL. Serve via Cloudflare CDN for edge caching.

### Anti-Pattern 6: Public R2 Bucket Without Access Controls

**What people do:** Making the entire R2 bucket public so the video player can fetch segments without authentication.
**Why it's wrong:** Anyone with the URL can stream content without a subscription. Content can be scraped and redistributed.
**Do this instead:** Use one of: (a) Cloudflare Worker with authentication logic that proxies R2 reads, (b) presigned URLs with short TTL generated by Express API for each playback session, or (c) Cloudflare Access zero-trust policies. For v1, presigned URLs with 1-hour TTL are the simplest and most effective approach.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Safaricom Daraja API** | REST API with OAuth2 token. Token refreshed every ~1hr. STK Push is async with callback. | Sandbox-first: `sandbox.safaricom.co.ke`. Production: `api.safaricom.co.ke`. Callback URL must be publicly accessible (use ngrok for local dev). Password = Base64(shortcode + passkey + timestamp). |
| **Cloudflare R2** | S3-compatible API via `@aws-sdk/client-s3`. PutObject for uploads, presigned GetObject URLs for reads. | Zero egress fees. Use `S3Client` with Cloudflare endpoint. Bucket organized by content type and ID. |
| **SendGrid / Nodemailer** | REST API (SendGrid) or SMTP (Nodemailer). Transactional emails with templates. | SendGrid preferred for production (better deliverability, template engine). Nodemailer + SMTP fine for dev/staging. |
| **FFmpeg** | Child process execution via `fluent-ffmpeg` npm package. | Must be installed on the VPS. Docker image should include FFmpeg. CPU-intensive -- run transcoding off the main event loop. |
| **Cloudflare CDN** | Automatic when using R2 custom domain or Worker route. | Configure cache TTL for .ts segments (long, they are immutable), shorter for .m3u8 playlists. Set CORS headers for cross-origin segment fetching. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Client <-> Express API** | REST over HTTPS. JSON request/response. JWT in Authorization header. | CORS restricted to Lumio domains. Rate limited. Client uses a typed API client wrapper. |
| **Admin <-> Express API** | Same REST API, different route prefix `/api/admin/*`. Admin middleware checks role. | Shares the same Express server. Admin routes are not accessible to regular users. |
| **Express API <-> PostgreSQL** | Prisma Client (type-safe ORM). Connection pooling via Prisma's built-in pool. | All database access goes through Prisma. No raw SQL unless absolutely necessary (performance edge cases). |
| **Express API <-> R2** | `@aws-sdk/client-s3` for uploads. Presigned URL generation for reads. | Express never streams video bytes. It only provides URLs. Client fetches segments directly from CDN. |
| **Cron Jobs <-> Services** | Direct function calls. Cron jobs import and call service methods. | Cron runs in the same Express process (or a separate worker). Uses same Prisma client instance. |
| **Client <-> Cloudflare CDN** | Direct HTTPS requests for video segments and thumbnails. | No Express involvement. Browser fetches .ts segments and images directly from CDN URL. |

## Database Schema Design (Key Entities)

The Prisma schema should model these core entities and their relationships:

```
User (1) ---> (*) Session           # One user has many sessions (max 2 active)
User (1) ---> (*) Payment           # Payment history
User (1) ---> (0..1) Subscription   # Current active subscription
User (1) ---> (*) WatchProgress     # Per-content progress tracking
User (1) ---> (*) Watchlist         # Saved content
User (1) ---> (*) Favorite          # Favorited content
User (1) ---> (*) Referral          # Referrals made (as referrer)
User (1) ---> (0..1) ReferralCredit # Accumulated referral credits

Content (base) <--- Movie           # Content type: movie
Content (base) <--- Series          # Content type: series
Series (1) ---> (*) Season          # Seasons within a series
Season (1) ---> (*) Episode         # Episodes within a season
Content (base) <--- Documentary     # Content type: documentary (same fields as movie)
Content (base) <--- Channel         # Content type: live TV channel

Plan (1) ---> (*) Payment           # Which plan was paid for
Plan (1) ---> (*) Subscription      # Which plan is active

Content (*) <---> (*) Category      # Many-to-many via junction table
```

**Note on content modeling:** Use a single `Content` table with a `type` discriminator column (`MOVIE`, `SERIES`, `DOCUMENTARY`, `CHANNEL`) rather than separate tables per content type. This simplifies search, listing, and "More Like This" queries. Series-specific data (seasons, episodes) is handled via relations. Channel-specific data (stream URL, schedule) can use a `ChannelMeta` relation table.

## Build Order Implications

Based on component dependencies, the recommended build sequence is:

| Order | Component | Depends On | Rationale |
|-------|-----------|------------|-----------|
| 1 | **PostgreSQL + Prisma schema** | Nothing | Everything else depends on the data model. Define User, Content, Session, Payment, Subscription, Plan models first. Run migrations. |
| 2 | **Express API foundation** | Database | App setup, middleware chain (error handler, CORS, rate limiter), health check endpoint. No business logic yet, just the skeleton. |
| 3 | **Auth system** | Express + DB | Registration, login, JWT issuance, session tracking, device limit. This unblocks all other features that need authentication. |
| 4 | **Content API (read-only)** | Express + DB + Auth | Content listing, filtering, search, detail endpoints. Seed the database with test content. This unblocks frontend content browsing. |
| 5 | **Next.js Client foundation** | Content API | App Router setup, layouts, auth provider, API client. Home page, content browse pages consuming the content API. |
| 6 | **Video Player** | Client + Content API | HLS.js integration, custom controls, progress tracking. Requires test HLS content in R2 (can use FFmpeg locally to generate test files). |
| 7 | **M-Pesa Payments** | Auth + DB | Daraja integration (sandbox), STK Push, callback handler, payment state machine. Subscription activation. |
| 8 | **Subscription Guard** | Payments | Middleware that blocks content access for non-subscribers. Billing page redirect. |
| 9 | **Admin Panel** | Content API + Auth | Content CRUD, user management, dashboard. Requires admin auth middleware. |
| 10 | **R2 + CDN integration** | Admin (for upload) + Player (for playback) | Upload pipeline: admin uploads video -> server transcodes -> uploads to R2. Playback: player fetches from CDN. |
| 11 | **Cron Jobs** | Payments + Subscriptions + Notifications | Expiry checks, auto-renewal, notification emails. These are the last piece because they depend on all the business logic services being complete. |
| 12 | **Referral System** | Auth + Payments | Referral codes, credit tracking, discount application. Depends on payment flow being complete. |
| 13 | **Email Notifications** | Payments + Subscriptions | Welcome email, payment confirmation, expiry warnings. Can be built incrementally alongside other features. |

**Critical path:** Database -> Auth -> Content API -> Client -> Player -> Payments -> Subscription Guard. This is the minimum viable path to a working streaming platform where a user can register, browse, pay, and watch.

## Sources

- [Wes Bos R2 Video Streaming project (DeepWiki)](https://deepwiki.com/wesbos/R2-video-streaming) - HIGH confidence, detailed HLS + R2 architecture
- [sarvagyakrcs/http-live-streaming GitHub](https://github.com/sarvagyakrcs/http-live-streaming) - MEDIUM confidence, Next.js + HLS + R2 + Cloudflare Worker architecture
- [Cloudflare HLS documentation](https://www.cloudflare.com/learning/video/what-is-http-live-streaming/) - HIGH confidence, official Cloudflare
- [Cloudflare R2 presigned URLs documentation](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) - HIGH confidence, official Cloudflare
- [Private media pipeline with Cloudflare and HLS](https://www.arun.blog/private-media-pipeline-cloudflare-and-hls/) - MEDIUM confidence, real-world architecture
- [Hygraph video streaming architecture](https://hygraph.com/blog/video-streaming-architecture) - MEDIUM confidence, system design reference
- [Design a Video Streaming Platform (System Design Handbook)](https://www.systemdesignhandbook.com/guides/design-youtube/) - MEDIUM confidence, system design patterns
- [Express.js TypeScript REST API architecture (Toptal)](https://www.toptal.com/developers/express-js/nodejs-typescript-rest-api-pt-2) - MEDIUM confidence, layered architecture patterns
- [Multi-device session management in Node.js](https://www.sevensquaretech.com/multi-device-session-management-in-nodejs/) - MEDIUM confidence, JWT + Redis/DB session tracking
- [M-Pesa Daraja API Node.js integration (KodaSchool)](https://kodaschool.com/blog/how-to-integrate-mpesa-daraja-api-with-node-js) - MEDIUM confidence, STK Push implementation
- [Safaricom Daraja developer portal](https://developer.safaricom.co.ke/) - HIGH confidence, official API documentation
- [Next.js App Router documentation](https://nextjs.org/docs/app) - HIGH confidence, official Next.js
- [Next.js streaming and loading UI](https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming) - HIGH confidence, official Next.js
- [HLS transcoding with Node.js (Medium)](https://medium.com/sharma02gaurav/adaptive-bitrate-streaming-hls-vod-service-in-nodejs-8df0d91d2eb4) - LOW confidence, community pattern
- [node-cron npm documentation](https://www.npmjs.com/package/node-cron) - HIGH confidence, official package docs

---
*Architecture research for: Lumio - Premium Video Streaming Platform (East Africa)*
*Researched: 2026-03-07*
