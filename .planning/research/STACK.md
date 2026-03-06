# Stack Research

**Domain:** Video Streaming Platform (East Africa, M-Pesa payments)
**Researched:** 2026-03-07
**Confidence:** HIGH (all core technologies verified with official sources)

---

## Critical Finding: Next.js 14 is End-of-Life

The proposed stack specifies Next.js 14. **Next.js 14 reached end-of-life on October 26, 2025** (per endoflife.date/nextjs, verified 2026-03-07). It no longer receives security patches. For a greenfield project starting in March 2026, this is unacceptable.

**Recommendation:** Use **Next.js 15.5.x** (LTS, security support until October 2026) or **Next.js 16.1.x** (current LTS, actively maintained). Given the project is greenfield and the team specified Next.js 14 App Router patterns, **Next.js 15** is the safest choice -- it preserves the same App Router mental model while gaining React 19 support, Turbopack stability, and active security patches. Next.js 16 is viable but newer and would require React 19+ which may have fewer ecosystem-compatible packages.

**Verdict: Use Next.js 15.5.x.** It is the production-stable LTS with 7 months of support remaining, ample time to build and launch. Plan to upgrade to 16.x before October 2026.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Next.js** | 15.5.12 | Frontend framework (SSR, routing, API routes) | Current LTS with React 19 support, Turbopack stable, active security patches. Next.js 14 is EOL. | HIGH |
| **React** | 19.x | UI library | Required by Next.js 15. Server Components, Actions, use() hook, improved Suspense. | HIGH |
| **TypeScript** | 5.6+ | Type safety | Required by Prisma 7 (min 5.4). Use latest stable in the 5.x line. | HIGH |
| **Tailwind CSS** | 4.2.x | Styling | Stable since Jan 2025. v4.2.0 adds new colors and utilities. Uses CSS-first config (@theme), no tailwind.config.js needed. 5x faster builds. | HIGH |
| **Express.js** | 5.2.x | Backend API server | Express 5 is stable (released Oct 2024). Adds promise support in middleware, native path security (ReDoS mitigation), drops Node <18 support. Express 4 is in maintenance mode. | HIGH |
| **Node.js** | 22.x LTS | Runtime | Maintenance LTS until April 2027. Node 24 is Active LTS but newer -- Node 22 is safer for broader package compatibility. Meets Prisma 7 minimum (20.19.0). | HIGH |
| **PostgreSQL** | 16.x | Primary database | Mature, relational, perfect for subscription/payment/user data. Good JSON support for flexible metadata. Well-supported by Prisma. | HIGH |
| **Prisma ORM** | 7.2.x | Database ORM | Major v7 release: ESM-native, driver-adapter architecture, new prisma.config.ts. Requires @prisma/adapter-pg + pg driver. Min Node 20.19, min TS 5.4. | HIGH |

### Payment Integration

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Safaricom Daraja API** | 2.0 (REST) | M-Pesa STK Push payments | Only official API for M-Pesa integration. Build against sandbox first, then production. No npm wrapper needed -- use direct HTTP calls with axios/fetch for full control. | HIGH |
| **axios** | 1.7.x | HTTP client for Daraja API calls | Interceptors for auth token refresh, timeout handling, better error objects than fetch. Daraja requires OAuth token management. | MEDIUM |

### Video Delivery

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Cloudflare R2** | N/A (service) | Video file storage | Zero egress fees -- critical for a streaming platform. S3-compatible API. Proven for HLS segment delivery (verified: 15TB for $2.18 in production). | HIGH |
| **Cloudflare CDN** | N/A (service) | Content delivery | Automatic with R2 custom domain setup. Global edge network includes African PoPs (Nairobi, Mombasa, Dar es Salaam). | HIGH |
| **hls.js** | 1.6.x | Client-side HLS playback | Industry standard for HLS in browsers without native support. 1.6.15 is latest stable. Handles adaptive bitrate switching, segment loading, error recovery. | HIGH |
| **FFmpeg** | 7.x | Video transcoding to HLS | Server-side transcoding of uploads to multi-bitrate HLS segments (.ts) + playlists (.m3u8). Required for adaptive bitrate. Use CLI directly, not fluent-ffmpeg (unmaintained, last publish 2+ years ago). | MEDIUM |
| **@aws-sdk/client-s3** | 3.x | R2 file operations | Official AWS SDK works with R2 (S3-compatible). Use for uploading HLS segments and generating presigned URLs for content protection. | HIGH |
| **@aws-sdk/s3-request-presigner** | 3.x | Presigned URL generation | Time-limited signed URLs for HLS segments. Prevents direct URL sharing. Essential for subscription-gated content. | HIGH |

### Authentication & Security

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **jose** | 6.x | JWT signing/verification | Modern, ESM-native, promise-based, supports EdDSA + all modern algorithms. Actively maintained. **Replaces jsonwebtoken** which has stalled development and poor ESM support. | HIGH |
| **argon2** | 0.41.x (argon2 npm) | Password hashing | OWASP #1 recommended algorithm for 2026. Memory-hard design resists GPU/ASIC attacks. **Replaces bcrypt** which, while still secure, is showing its age (work factor 13+ needed for 2026 security, resulting in 16s hashes). | MEDIUM |
| **helmet** | 8.1.x | HTTP security headers | Sets 15 security headers (CSP, HSTS, X-Frame-Options, etc.) in one middleware call. Standard for Express apps. | HIGH |
| **cors** | 2.8.x | CORS middleware | Restrict origins to Lumio domains only. Latest stable. | HIGH |
| **express-rate-limit** | 8.3.x | Rate limiting | 100 req/min API, 5 req/min auth as specified. In-memory store for single-server, Redis store for scaling. | HIGH |

### Email

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Nodemailer** | 6.x | SMTP transport | 13M weekly downloads, zero dependencies, battle-tested. Handles SMTP connection pooling, retries. | HIGH |
| **React Email** | 4.x | Email templates | Build email templates as React components with Tailwind support. Preview server for development. Compiles to email-safe HTML. Works alongside Nodemailer (Nodemailer sends, React Email renders). | MEDIUM |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zod** | 4.3.x | Schema validation | Validate all API request bodies, environment variables, Daraja API responses. TypeScript-first with automatic type inference. |
| **zustand** | 5.x | Client-side state | Lightweight (~3KB) state management for UI state (modals, player state, watchlist cache). Simpler than Redux for this scale. Works with Next.js App Router / RSC. |
| **node-cron** | 3.x | Scheduled tasks | Subscription expiry checks, pre-expiry email notifications, auto-renewal cron jobs. Simple, in-process scheduling -- no Redis needed. |
| **date-fns** | 4.x | Date manipulation | Subscription date calculations, expiry checks, payment history formatting. Tree-shakeable, no moment.js bloat. |
| **sharp** | 0.33.x | Image processing | Resize/optimize poster thumbnails (600x900 portrait, 1920x1080 landscape). Server-side only. |
| **uuid** | 11.x | Unique ID generation | Referral codes, session tokens, idempotency keys for Daraja payments. |
| **dotenv** | 16.x | Environment variables | Required explicitly by Prisma 7 (no longer auto-loads .env). Load DATABASE_URL, Daraja credentials, JWT secrets. |
| **winston** | 3.x | Structured logging | Production logging with levels, timestamps, JSON format. Audit trail for admin activity logs. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **ESLint** 9.x + `@next/eslint-plugin-next` | Linting | Next.js 15 includes built-in ESLint config. Use flat config format (eslint.config.mjs). |
| **Prettier** 3.x | Code formatting | With `prettier-plugin-tailwindcss` for class sorting. |
| **Turbopack** (built into Next.js 15) | Dev server bundler | 96% faster hot reload than Webpack. Stable in Next.js 15. Use `next dev --turbopack`. |
| **Prisma Studio** | Database GUI | New version in Prisma 7 via `npx prisma studio`. Visual data browser/editor. |
| **Docker** + **docker-compose** | Local development + deployment | PostgreSQL + Redis (if needed) + app containers. Matches Ubuntu VPS deployment target. |
| **tsx** | TypeScript execution | Run TypeScript scripts directly (seed scripts, migration helpers). Replacement for ts-node. |

---

## Version Compatibility Matrix

| Package | Requires Node.js | Requires TypeScript | Notes |
|---------|-------------------|---------------------|-------|
| Next.js 15.5 | >= 18.18.0 | >= 5.0 | React 19 required for App Router |
| Prisma 7.2 | >= 20.19.0 | >= 5.4 | **Strictest requirement -- drives Node.js floor** |
| Express 5.2 | >= 18.0.0 | N/A (use @types/express) | |
| Tailwind CSS 4.2 | N/A (CSS build tool) | N/A | Requires PostCSS or Vite plugin |
| hls.js 1.6 | N/A (browser) | Types included | |

**Resolution:** Use **Node.js 22.x LTS** and **TypeScript 5.6+** to satisfy all requirements with headroom.

---

## Prisma 7 Setup (Critical Change from Plan Document)

The plan document assumes Prisma works like v5/v6. Prisma 7 has breaking architectural changes:

### Required Packages
```bash
# Prisma 7 core
npm install @prisma/client @prisma/adapter-pg pg
npm install -D prisma @types/pg

# Initialize (creates prisma.config.ts + schema.prisma)
npx prisma init --datasource-provider postgresql
```

### prisma.config.ts (NEW in Prisma 7)
```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### Prisma Client Instantiation (Changed)
```typescript
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

**Key differences from v5/v6:**
1. Database URL moved from schema.prisma to prisma.config.ts
2. Must use driver adapter (@prisma/adapter-pg) -- no built-in drivers
3. Environment variables NOT auto-loaded -- must explicitly import dotenv
4. Ships as ESM -- ensure project is configured for ESM or has proper interop

---

## Installation Commands

```bash
# ==========================================
# FRONTEND (Next.js 15 project)
# ==========================================

# Core
npx create-next-app@15 lumio-client --typescript --tailwind --eslint --app --src-dir
npm install hls.js zustand zod date-fns

# Dev
npm install -D prettier prettier-plugin-tailwindcss @types/node

# ==========================================
# BACKEND (Express 5 project)
# ==========================================

# Core
npm install express@5 cors helmet express-rate-limit
npm install @prisma/client @prisma/adapter-pg pg
npm install jose argon2 zod
npm install axios nodemailer react-email @react-email/components
npm install node-cron uuid winston sharp dotenv date-fns
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Dev
npm install -D prisma @types/pg @types/express @types/cors
npm install -D @types/nodemailer @types/node-cron @types/uuid
npm install -D typescript tsx eslint prettier
npm install -D @types/node
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| **Frontend Framework** | Next.js 15 | Next.js 14 | **EOL since Oct 2025.** No security patches. Unacceptable for new project. |
| **Frontend Framework** | Next.js 15 | Next.js 16 | Viable but newer. 15 has larger ecosystem of tutorials/examples. Upgrade path is clear. |
| **Backend Framework** | Express 5 | Fastify | Express has larger ecosystem, more Daraja API examples. Fastify is faster but team familiarity matters more for this project. |
| **Backend Framework** | Express 5 | Express 4 | Express 4 is in maintenance mode. Express 5 adds promise support, better security defaults. |
| **ORM** | Prisma 7 | Drizzle ORM | Drizzle is lighter and SQL-closer, but Prisma's migration system, Studio, and type generation are better for rapid development. Prisma 7 is now ESM and lean. |
| **JWT** | jose | jsonwebtoken | jsonwebtoken has stalled development, no ESM support, outdated crypto. jose is the modern standard. |
| **Password Hashing** | argon2 | bcrypt | bcrypt still works but needs work factor 13+ for 2026 security (16s per hash). Argon2id is OWASP #1, memory-hard design, configurable. |
| **State Management** | zustand | Redux Toolkit | RTK is 15KB vs zustand's 3KB. Overkill for this app's client state needs (modals, player state, simple caches). |
| **Video Storage** | Cloudflare R2 | Cloudflare Stream | Stream is simpler but charges per minute stored + delivered. R2 has zero egress. For a streaming platform with high bandwidth, R2 + self-hosted HLS saves significantly (verified: 15TB for $2.18 vs Stream's per-minute billing). |
| **Video Storage** | Cloudflare R2 | AWS S3 | S3 has egress fees ($0.09/GB). For video streaming, bandwidth costs dominate. R2's zero egress is the decisive factor. |
| **Email Templates** | React Email | Raw HTML | React Email gives component reuse, Tailwind in emails, preview server. Worth the small dependency for professional transactional emails. |
| **Scheduler** | node-cron | BullMQ | BullMQ requires Redis, adds complexity. node-cron is sufficient for cron-style jobs (expiry checks, notifications). If job persistence/retries become critical later, migrate to BullMQ. |
| **HTTP Client** | axios | node-fetch / native fetch | Daraja API needs interceptors for OAuth token refresh, explicit timeout control, and structured error handling. axios excels here. |
| **Validation** | zod | joi / yup | Zod v4 is TypeScript-native with inferred types. Joi lacks TS inference. Yup is slower and less actively developed. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Next.js 14** | End-of-life since Oct 2025. No security patches. | Next.js 15.5.x |
| **jsonwebtoken** | Stalled development, no ESM, outdated crypto patterns | jose 6.x |
| **bcrypt** (for new project) | Needs work factor 13+ for 2026 security, resulting in slow hashes. Older design. | argon2 (Argon2id algorithm) |
| **fluent-ffmpeg** | Unmaintained (last published 2+ years ago). npm shows "no longer supported". | Direct FFmpeg CLI via child_process or execa |
| **Express 4** | Maintenance mode. No new features. Express 5 has promise support + security improvements. | Express 5.2.x |
| **moment.js** | Deprecated, huge bundle size (300KB+). | date-fns (tree-shakeable) |
| **Prisma 5/6 patterns** | Prisma 7 has breaking changes (driver adapters, prisma.config.ts, ESM). Following old tutorials will fail. | Prisma 7 patterns with @prisma/adapter-pg |
| **tailwind.config.js** | Tailwind v4 uses CSS-first @theme directive. JS config is legacy. | @theme in CSS file |
| **mpesa-api npm package** | Third-party wrapper, may not be maintained. Adds unnecessary abstraction over simple REST calls. | Direct Daraja API HTTP calls with axios |
| **video.js** | Heavy (200KB+), complex plugin system, overkill. Project only needs HLS playback. | hls.js (lightweight) + custom React player component |

---

## Stack Patterns by Variant

**If scaling beyond single VPS:**
- Add **Redis** for session store, rate limiting, and caching
- Switch node-cron to **BullMQ** for persistent job queues
- Use **Cloudflare Workers** for HLS segment serving (edge delivery)
- Consider **pg connection pooling** via PgBouncer

**If adding mobile apps later (v2):**
- Backend API is already decoupled (Express) -- mobile clients consume same API
- Consider **React Native** to share component logic with web
- HLS playback works natively on iOS/Android

**If content library grows large (10K+ titles):**
- Add **Elasticsearch** or **Meilisearch** for full-text search
- Current plan uses PostgreSQL full-text search, which works for hundreds of titles but degrades at scale

**If live TV requires low latency:**
- Consider **Cloudflare Stream Live** for ingest + transcoding
- Or use **RTMP ingest with FFmpeg** converting to Low-Latency HLS (LL-HLS)
- hls.js supports LL-HLS out of the box

---

## Daraja API Integration Notes

The Safaricom Daraja API has specific patterns that affect the stack:

1. **OAuth Token Management:** Daraja requires fetching an access token (valid 1 hour) before every STK Push request. Use axios interceptors to auto-refresh tokens.

2. **STK Push Flow:**
   - App sends STK Push request to Daraja
   - Daraja triggers push notification on user's phone
   - User enters M-Pesa PIN
   - Daraja sends callback to your server with result
   - **Your callback URL must be publicly accessible** -- use ngrok for local development

3. **Callback URL Requirement:** Your Express server needs a publicly accessible endpoint for Daraja callbacks. In production, this is your VPS. In development, use **ngrok** or **Cloudflare Tunnels**.

4. **Sandbox vs Production:** Build against sandbox first (credentials available immediately at developer.safaricom.co.ke). Production requires business registration with Safaricom.

5. **Password Generation:** STK Push password = Base64(BusinessShortCode + Passkey + Timestamp). This is a server-side operation -- never expose the passkey to the client.

---

## Cloudflare R2 + HLS Architecture

Content protection for a subscription-gated platform:

1. **Upload Pipeline:** Admin uploads MP4 -> Server transcodes with FFmpeg to multi-bitrate HLS -> Segments (.ts) and playlists (.m3u8) uploaded to R2 via @aws-sdk/client-s3

2. **Playback Pipeline:** Client requests playlist -> Backend verifies subscription -> Generates presigned URLs for HLS segments -> Client plays via hls.js

3. **Content Protection:** Use presigned URLs with short expiry (e.g., 4 hours). The playlist (.m3u8) references relative segment paths. A Cloudflare Worker or backend middleware rewrites segment URLs to presigned versions.

4. **Adaptive Bitrate:** Transcode to at least 3 renditions (480p/720p/1080p). Master playlist references quality-specific playlists. hls.js handles automatic quality switching based on bandwidth.

---

## Sources

### Official Documentation (HIGH confidence)
- [Next.js endoflife status](https://endoflife.date/nextjs) -- Next.js 14 EOL confirmed Oct 2025
- [Next.js 15 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-15) -- React 19 requirement, breaking changes
- [Next.js 16 blog post](https://nextjs.org/blog/next-16) -- Latest major version reference
- [Prisma 7 upgrade guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) -- Driver adapter architecture, prisma.config.ts
- [Prisma 7 release blog](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) -- Rust-free, faster
- [Prisma system requirements](https://www.prisma.io/docs/orm/reference/system-requirements) -- Node 20.19+, TS 5.4+
- [Express 5 migration guide](https://expressjs.com/en/guide/migrating-5.html) -- Breaking changes from v4
- [Tailwind CSS v4.0 release](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config, performance
- [Safaricom Daraja Developer Portal](https://developer.safaricom.co.ke/) -- Official API docs
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) -- Content protection
- [Cloudflare R2 AWS SDK JS v3 example](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/) -- Implementation reference
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases) -- LTS versions

### Verified Community Sources (MEDIUM confidence)
- [Password Hashing Guide 2025-2026](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/) -- Argon2 as OWASP #1
- [jose vs jsonwebtoken comparison](https://joodi.medium.com/jose-vs-jsonwebtoken-why-you-should-switch-4f50dfa3554c) -- ESM support, modern API
- [R2 video streaming cost analysis](https://screencasting.com/cheap-video-hosting) -- 15TB for $2.18
- [Private media pipeline with Cloudflare + HLS](https://www.arun.blog/private-media-pipeline-cloudflare-and-hls/) -- Architecture pattern
- [hls.js GitHub](https://github.com/video-dev/hls.js/) -- Version 1.6.15 latest
- [React Email + Nodemailer integration](https://react.email/docs/integrations/nodemailer) -- Combined pattern

### npm Registry (HIGH confidence for versions)
- express-rate-limit 8.3.0 (published March 2026)
- helmet 8.1.0
- cors 2.8.6
- hls.js 1.6.15
- zod 4.3.6
- Prisma 7.2.x

---

*Stack research for: Lumio Video Streaming Platform (East Africa)*
*Researched: 2026-03-07*
