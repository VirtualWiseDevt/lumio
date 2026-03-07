# Phase 2: Authentication and Sessions - Research

**Researched:** 2026-03-07
**Domain:** JWT authentication, password hashing, session management, Express 5 middleware
**Confidence:** HIGH

## Summary

This phase implements a complete authentication system using the project's locked-in stack: `jose` for JWT operations and `argon2` for password hashing, on top of Express 5 with Prisma. The architecture follows a JWT + server-side session hybrid where JWTs are issued at login, each tied to a Session record in the database, enabling server-side session revocation and 2-device enforcement.

The existing Prisma schema already has `User` and `Session` models with the right fields (deviceName, deviceType, ipAddress, token, expiresAt, lastActiveAt). The schema also has a `Referral` model for the invite/referral code flow during registration. No schema changes should be needed for core auth -- only potentially adding a `passwordResetToken`/`passwordResetExpiry` field to the User model (or a separate table) for the forgot-password flow, and a `failedLoginAttempts`/`lockedUntil` field for brute force protection.

Key recommendations: use `jose` v6.x (ESM-native, zero dependencies), `argon2` v0.44.x (Argon2id default, prebuilt binaries), `node-cron` v4.x for stale session cleanup, and `ua-parser-js` v1.x (MIT licensed -- v2.x switched to AGPL). For device detection, stay on v1.x to avoid license issues.

**Primary recommendation:** Build auth middleware that verifies JWT, loads session from DB (confirming it's not revoked), and attaches user to `req` -- this is the central pattern everything else depends on.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jose | ^6.x | JWT sign/verify (HS256) | ESM-native, zero deps, uses WebCryptoAPI, already in roadmap |
| argon2 | ^0.44.x | Password hashing (Argon2id) | Secure defaults, prebuilt binaries, already in roadmap |
| Prisma | 6.x (existing) | Session storage + user queries | Already installed and configured |
| Zod | 3.x (existing) | Request body validation | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ua-parser-js | ^1.0.x | Parse user-agent for device info | Registration/login to populate Session.deviceName/deviceType |
| node-cron | ^4.0.x | Schedule stale session cleanup | Server startup, runs cleanup job periodically |
| crypto (Node built-in) | N/A | Generate password reset tokens | `crypto.randomBytes(32).toString('hex')` for reset tokens |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ua-parser-js v1 | ua-parser-js v2 | v2 is AGPL licensed -- use v1 (MIT) to avoid license complications |
| node-cron | croner | croner is lighter but node-cron is more established and ESM-compatible |
| HS256 (symmetric) | RS256 (asymmetric) | RS256 is for multi-service architectures; HS256 is simpler for single-API apps |

**Installation:**
```bash
cd api && npm install jose argon2 ua-parser-js@1 node-cron
npm install -D @types/ua-parser-js
```

Note: `node-cron` v4 ships its own types. `jose` and `argon2` have built-in TypeScript support.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── config/
│   ├── env.ts              # Add JWT_SECRET, reset token TTL
│   └── database.ts         # Existing Prisma client
├── middleware/
│   ├── auth.middleware.ts   # JWT verification + session loading
│   ├── error.middleware.ts  # Existing
│   └── notFound.middleware.ts # Existing
├── routes/
│   ├── auth.routes.ts      # POST /register, /login, /logout, /forgot-password, /reset-password
│   ├── session.routes.ts   # GET /sessions, DELETE /sessions/:id
│   ├── health.routes.ts    # Existing
│   └── index.ts            # Existing route aggregator
├── services/
│   ├── auth.service.ts     # Registration, login, password logic
│   ├── session.service.ts  # Session CRUD, device limit enforcement
│   └── token.service.ts    # JWT sign/verify, reset token generation
├── validators/
│   ├── auth.validators.ts  # Zod schemas for register, login, password change/reset
│   └── phone.utils.ts      # Kenyan phone normalization (07XX -> +2547XX)
├── types/
│   └── express.d.ts        # Extend Request with user and session
└── jobs/
    └── sessionCleanup.job.ts  # node-cron job for stale session removal
```

### Pattern 1: JWT + Server-Side Session Hybrid
**What:** JWT contains minimal claims (userId, sessionId). Every authenticated request verifies JWT AND checks session exists in DB.
**When to use:** When you need server-side session revocation (which this app does for 2-device limit and password change invalidation).
**Example:**
```typescript
// token.service.ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signToken(payload: { sub: string; sid: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });
  return payload as { sub: string; sid: string; iat: number; exp: number };
}
```

### Pattern 2: Auth Middleware
**What:** Express middleware that extracts Bearer token, verifies JWT, loads session from DB, attaches user to request.
**When to use:** All protected routes.
**Example:**
```typescript
// auth.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/token.service.js";
import { prisma } from "../config/database.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: { message: "Authentication required" } });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: { message: "Session expired" } });
      return;
    }

    // Update last active time (fire-and-forget)
    prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {}); // Non-blocking

    req.user = session.user;
    req.sessionId = session.id;
    next();
  } catch {
    res.status(401).json({ error: { message: "Invalid token" } });
    return;
  }
}
```

### Pattern 3: 2-Device Enforcement at Login
**What:** Before creating a new session, count active sessions. If 2 exist, reject with session list so user can pick one to remove.
**When to use:** Login endpoint.
**Example:**
```typescript
// session.service.ts
export async function enforceDeviceLimit(userId: string) {
  const activeSessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, deviceName: true, lastActiveAt: true },
    orderBy: { lastActiveAt: "desc" },
  });

  if (activeSessions.length >= 2) {
    return { allowed: false, devices: activeSessions };
  }
  return { allowed: true, devices: activeSessions };
}
```

### Pattern 4: Kenyan Phone Number Normalization
**What:** Convert local format (07XX) to international (+2547XX) for M-Pesa compatibility.
**When to use:** Registration validation.
**Example:**
```typescript
// phone.utils.ts
export function normalizeKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/\s|-/g, "");
  if (/^07\d{8}$/.test(cleaned)) {
    return "+254" + cleaned.slice(1);
  }
  if (/^\+2547\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^2547\d{8}$/.test(cleaned)) {
    return "+" + cleaned;
  }
  throw new Error("Invalid Kenyan phone number");
}
```

### Anti-Patterns to Avoid
- **Storing sensitive data in JWT:** JWT should only contain userId and sessionId. Never put email, role, or other user data in JWT claims -- always load from DB via session lookup.
- **Not checking session in DB:** A JWT-only approach cannot revoke sessions. The DB check is essential for 2-device enforcement and password-change invalidation.
- **Timing-based enumeration:** Always use generic error messages ("Invalid email or password") to prevent account enumeration.
- **Blocking lastActiveAt updates:** The session touch should be fire-and-forget to avoid adding latency to every request.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt/scrypt wrapper | `argon2.hash()` / `argon2.verify()` | Argon2id is the current OWASP recommendation; default params are secure |
| JWT creation/verification | Manual base64 + HMAC | `jose` SignJWT / jwtVerify | Handles encoding, timing-safe comparison, algorithm validation |
| User-agent parsing | Regex-based device detection | `ua-parser-js` v1 UAParser | Thousands of user-agent patterns maintained by community |
| Cron scheduling | setInterval-based cleanup | `node-cron` schedule() | Proper cron syntax, handles drift, can be stopped/started |
| Phone validation regex | Single regex | Dedicated normalizer function | Must handle 07XX, +254, and 254 formats with proper validation |
| Reset token generation | Math.random | `crypto.randomBytes(32)` | Cryptographically secure random bytes |

**Key insight:** Authentication is a security domain where custom implementations introduce vulnerabilities. Use battle-tested libraries with secure defaults.

## Common Pitfalls

### Pitfall 1: JWT Secret Too Short for HS256
**What goes wrong:** jose throws "HS256 requires symmetric keys to be 256 bits or larger" at runtime.
**Why it happens:** The secret string must be at least 32 bytes (256 bits).
**How to avoid:** Validate JWT_SECRET length in env.ts schema: `z.string().min(32, "JWT_SECRET must be at least 32 characters")`.
**Warning signs:** Error thrown on first sign/verify attempt.

### Pitfall 2: Not Handling Expired Sessions in Device Count
**What goes wrong:** Users get locked out because expired sessions count toward the 2-device limit.
**Why it happens:** Querying sessions without filtering by expiresAt.
**How to avoid:** Always filter `where: { expiresAt: { gt: new Date() } }` when counting active sessions.
**Warning signs:** Users report being unable to log in despite having no active devices.

### Pitfall 3: Race Condition on Session Creation
**What goes wrong:** Two simultaneous login requests both pass the 2-device check and create sessions, resulting in 3 active sessions.
**Why it happens:** Time-of-check vs time-of-use (TOCTOU) between counting and inserting.
**How to avoid:** Use a Prisma transaction that counts and creates atomically, or accept the minor race window (unlikely in practice with 2-device limit).
**Warning signs:** Session count occasionally exceeds 2.

### Pitfall 4: argon2 Native Addon Build Failures
**What goes wrong:** `npm install argon2` fails on some environments without build tools.
**Why it happens:** argon2 is a native addon that needs prebuilt binaries or node-gyp compilation.
**How to avoid:** Ensure the CI/deployment environment has the correct prebuilt binary available. argon2 v0.44.x ships prebuilds for Windows, macOS, Linux, and Alpine.
**Warning signs:** Install errors mentioning node-gyp, GCC, or prebuild-install.

### Pitfall 5: Express 5 Error Handling with Async Middleware
**What goes wrong:** Unhandled promise rejection crashes the server.
**Why it happens:** Express 5 auto-catches async errors in route handlers, but custom middleware may need explicit try/catch.
**How to avoid:** Wrap auth middleware in try/catch as shown in the pattern above. Express 5 route handlers (in Router) handle this automatically.
**Warning signs:** Server crash on invalid JWT input.

### Pitfall 6: Token Stored in Session Table Must Match What Client Sends
**What goes wrong:** Session lookup fails because the stored token is a hash but comparison uses raw JWT.
**Why it happens:** Confusion about what to store in `Session.token`.
**How to avoid:** Store the JWT string directly (or a hash of it) in Session.token. The JWT itself is signed and tamper-proof. For this app, store a unique session ID (UUID) and put that in the JWT claims -- don't store the full JWT in the DB.
**Warning signs:** Session lookups always return null.

### Pitfall 7: Password Reset Token Timing Attack
**What goes wrong:** Attacker can determine if a reset token is valid by measuring response time.
**Why it happens:** String comparison short-circuits on first different character.
**How to avoid:** Use `crypto.timingSafeEqual()` for token comparison, or hash the reset token and compare hashes.
**Warning signs:** Security audit findings.

## Code Examples

Verified patterns from official sources:

### Argon2 Hash and Verify
```typescript
// Source: https://github.com/ranisalt/node-argon2#readme
import * as argon2 from "argon2";

// Hash (uses Argon2id by default with secure params)
const hash = await argon2.hash(password);

// Verify
const isValid = await argon2.verify(hash, password);
```

### Jose JWT Sign and Verify
```typescript
// Source: https://github.com/panva/jose#readme
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Sign
const jwt = await new SignJWT({ sub: userId, sid: sessionId })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("7d")
  .sign(secret);

// Verify
const { payload } = await jwtVerify(jwt, secret, {
  algorithms: ["HS256"],
});
// payload.sub = userId, payload.sid = sessionId
```

### UA-Parser-JS Device Detection (v1.x)
```typescript
// Source: https://github.com/faisalman/ua-parser-js (v1 branch)
import { UAParser } from "ua-parser-js";

function getDeviceInfo(userAgent: string) {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  // Build device name: "Chrome 120 on Windows 11"
  const deviceName = `${browser.name || "Unknown"} on ${os.name || "Unknown"}`;
  // Device type: "mobile", "tablet", "desktop" (undefined = desktop)
  const deviceType = device.type || "desktop";

  return { deviceName, deviceType };
}
```

### Node-Cron Stale Session Cleanup
```typescript
// Source: https://github.com/node-cron/node-cron
import cron from "node-cron";
import { prisma } from "../config/database.js";

export function startSessionCleanupJob() {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { lastActiveAt: { lt: cutoff } },
        ],
      },
    });
    console.log(`[SESSION_CLEANUP] Removed ${result.count} stale sessions`);
  });
}
```

### Extend Express Request Type
```typescript
// types/express.d.ts
import type { User } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}
```

### Password Reset Token Generation
```typescript
import crypto from "node:crypto";

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Store hashed version in DB to prevent DB-leak compromise
function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
```

### Login Rate Limiting (Account Lockout)
```typescript
// In auth.service.ts - track failed attempts
async function checkAccountLock(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true, lockedUntil: true },
  });
  if (!user) return false;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return true; // Account is locked
  }
  return false;
}

async function recordFailedLogin(userId: string): Promise<void> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
  });

  if (user.failedLoginAttempts >= 5) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        failedLoginAttempts: 0,
      },
    });
  }
}

async function resetFailedLogins(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}
```

## Schema Modifications Needed

The existing Prisma schema needs these additions:

### User Model Additions
```prisma
model User {
  // ... existing fields ...

  // Account lockout (brute force protection)
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?

  // Password reset
  passwordResetToken  String?
  passwordResetExpiry DateTime?

  // Referral code for invite system
  referralCode        String?   @unique
}
```

### Referral Code Validation
The existing `Referral` model uses referrerId/refereeId. During registration, the invite code from `?c=CODE` maps to a user's referralCode (a new field). After registration, create a Referral record linking referrer to referee.

## Discretionary Decisions (Recommendations)

These are items marked as "Claude's Discretion" in CONTEXT.md:

### JWT Token Structure
- **Algorithm:** HS256 (symmetric, single API server)
- **Claims:** `sub` (userId), `sid` (sessionId), `iat` (issued at), `exp` (expiration)
- **No additional claims** -- all user data loaded from DB via session lookup
- **Confidence:** HIGH

### Password Strength Requirements
- Minimum 8 characters
- At least one uppercase, one lowercase, one digit
- No special character requirement (reduces user friction without meaningfully reducing security)
- Validate with Zod regex in auth.validators.ts
- **Confidence:** MEDIUM (industry standards vary; NIST recommends length over complexity)

### Reset Token TTL and Format
- **Format:** 64-character hex string (32 random bytes)
- **TTL:** 1 hour (standard for email-based reset)
- **Storage:** Hash the token with SHA-256 before storing in DB (prevents DB-leak compromise)
- **Confidence:** HIGH

### Device Name Detection
- Use `ua-parser-js` v1.x to extract browser name + OS name
- Format: `"{Browser} on {OS}"` (e.g., "Chrome on Windows")
- Device type: use ua-parser-js device.type, default to "desktop" when undefined
- **Confidence:** HIGH

### Error Response JSON Structure
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```
This matches the existing error handler pattern in error.middleware.ts.
- **Confidence:** HIGH

### Session Cleanup Frequency
- Run every hour (`"0 * * * *"`)
- Deletes sessions where `expiresAt < now()` OR `lastActiveAt < 7 days ago`
- Log count of removed sessions
- **Confidence:** HIGH

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| bcrypt for hashing | argon2id | 2019+ (OWASP recommendation) | Better memory-hard protection |
| jsonwebtoken package | jose | 2022+ | ESM-native, zero deps, WebCryptoAPI |
| JWT-only (stateless) | JWT + server-side session | Industry trend | Enables revocation, device limits |
| ua-parser-js v2 (AGPL) | ua-parser-js v1 (MIT) | 2024 license change | v1 stays MIT, v2 requires AGPL compliance |
| setInterval for cleanup | node-cron | Always preferred | Proper cron semantics, drift handling |

**Deprecated/outdated:**
- `jsonwebtoken` package: Still works but is CommonJS-only with dependencies; jose is the modern replacement
- `bcrypt`/`bcryptjs`: Still functional but argon2id is the current OWASP recommendation
- ua-parser-js v2.x in proprietary projects: AGPL license is incompatible; use v1.x

## Open Questions

1. **Referral code format and generation**
   - What we know: Registration requires an invite/referral code field, pre-filled from `?c=CODE`
   - What's unclear: How are referral codes generated? Are they per-user or admin-created? What's the format (alphanumeric, length)?
   - Recommendation: Add a `referralCode` field to User model, auto-generate on user creation (8-char alphanumeric). Validate the code exists during registration. Defer complex referral reward logic to a later phase if not in AUTH requirements.

2. **Email delivery for password reset**
   - What we know: Password reset uses email-based flow with time-limited token
   - What's unclear: No email sending library is in the stack yet. How will reset emails be sent?
   - Recommendation: For this phase, implement the token generation and reset endpoint. Use a placeholder/console.log for email sending. Add actual email service (e.g., nodemailer, Resend) as a follow-up or in a later phase.

3. **Session.token field usage**
   - What we know: Session model has a `token` field (String, @unique)
   - What's unclear: Whether to store the full JWT or just use the session UUID
   - Recommendation: Use the session `id` (UUID) as the `sid` claim in JWT. The `token` field can store a hash of the JWT for additional validation, or simply mirror the session ID. The simplest approach: store a unique identifier in `token` that can be used for session lookup by token value if needed.

## Sources

### Primary (HIGH confidence)
- jose GitHub README (https://github.com/panva/jose) - JWT sign/verify API, HS256 secret requirements, ESM-only v6
- argon2 GitHub README (https://github.com/ranisalt/node-argon2) - hash/verify API, Argon2id defaults, prebuilt binaries
- node-cron GitHub README (https://github.com/node-cron/node-cron) - v4.0, ISC license, schedule API
- Existing codebase: schema.prisma (User/Session models), app.ts (middleware order), health.routes.ts (Express 5 async pattern)

### Secondary (MEDIUM confidence)
- ua-parser-js v1 docs (https://github.com/faisalman/ua-parser-js) - device detection API, v1 MIT license status
- WebSearch results confirming ua-parser-js v2 AGPL license change (multiple sources: LogRocket, Socket.dev, GitHub issue #680)
- WebSearch results on Express JWT middleware patterns (DigitalOcean, StackAbuse, multiple 2025 guides)

### Tertiary (LOW confidence)
- node-cron ESM compatibility claims (WebSearch only, not directly verified in v4 source)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries verified via official GitHub READMEs and npm
- Architecture: HIGH - Patterns derived from official docs and existing codebase conventions
- Pitfalls: HIGH - HS256 key length requirement verified in jose docs; argon2 native addon issues well-documented
- Discretionary decisions: MEDIUM - Password complexity and reset TTL based on industry standards, not project-specific requirements

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain, libraries are mature)
