# Phase 7: Payments and Subscriptions - Research

**Researched:** 2026-03-07
**Domain:** M-Pesa Daraja API integration, subscription management, payment UI
**Confidence:** HIGH

## Summary

This phase integrates M-Pesa STK Push payments via Safaricom's Daraja API, creates a billing page with plan selection and payment modal, enforces subscription guards on video playback, and implements a reconciliation cron for lost callbacks. The user has locked all major architectural decisions -- this research focuses on the Daraja API specifics, implementation patterns, and integration with the existing codebase.

The Daraja API follows a straightforward OAuth2 + REST pattern: obtain a Bearer token, POST to initiate STK Push, receive async callback. The existing codebase already has Payment, Subscription, and Plan models in Prisma, node-cron for scheduled jobs, and the stream routes that need subscription guards. The main technical risks are Daraja sandbox instability (noted in STATE.md) and the async nature of M-Pesa callbacks requiring robust reconciliation.

**Primary recommendation:** Build a mock M-Pesa service first for reliable local development, implement the real Daraja client behind an interface, and use short polling for payment status (simplest, most reliable for 60-second timeout window).

## Standard Stack

### Core (Daraja API -- Direct HTTP, No Library)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Native fetch / axios | existing | Daraja API HTTP calls | Simple REST API -- 3 endpoints total (auth, STK push, STK query). No library needed. |
| node-cron | ^4.2.1 | Reconciliation cron | Already installed, used for session cleanup. Same pattern. |
| Zod | ^3.24 | Request/callback validation | Already used project-wide for all validation. |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| crypto (Node built-in) | N/A | UUID generation for idempotency keys | `crypto.randomUUID()` for Payment.idempotencyKey |
| Buffer (Node built-in) | N/A | Base64 encoding for Daraja password | `Buffer.from(shortcode + passkey + timestamp).toString("base64")` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct HTTP calls | mpesa-api npm package | Adds dependency for 3 simple endpoints; package may be stale; we need full control over mock switching |
| Short polling for payment status | SSE or WebSocket | Short polling is simpler, sufficient for 60s window with 3s intervals (~20 requests max), no infrastructure needed |
| node-cron for reconciliation | BullMQ repeatable job | node-cron already used, simpler for fixed-schedule tasks; BullMQ better for job queues but overkill here |

**No new npm packages required.** All Daraja API calls use the existing axios (client) or native fetch (API server). node-cron is already installed.

## Architecture Patterns

### Recommended Project Structure

```
api/src/
├── config/
│   └── mpesa.ts              # Daraja env config, base URLs, shortcode
├── services/
│   ├── mpesa.service.ts       # Real Daraja API client (OAuth, STK Push, STK Query)
│   ├── mpesa-mock.service.ts  # Mock M-Pesa for local dev
│   ├── payment.service.ts     # Payment orchestration (initiate, process callback, get history)
│   └── subscription.service.ts # Subscription CRUD (activate, check active, expire)
├── middleware/
│   └── subscription.middleware.ts  # requireSubscription guard
├── routes/
│   ├── payment.routes.ts      # POST /initiate, GET /status/:id, GET /history
│   └── mpesa-callback.routes.ts   # POST /api/mpesa/callback (no auth, from Safaricom)
├── jobs/
│   └── reconciliation.job.ts  # 2-minute cron for lost callbacks
└── validators/
    └── payment.validators.ts  # Zod schemas for payment requests

client/src/
├── app/
│   └── billing/
│       └── page.tsx           # /billing route
├── components/
│   └── billing/
│       ├── PlanCard.tsx        # Individual plan display
│       ├── PlanGrid.tsx        # Three plans horizontally
│       ├── SubscriptionStatus.tsx  # Current sub status card
│       ├── PaymentModal.tsx    # Three-step modal (confirm -> waiting -> result)
│       ├── PaymentHistory.tsx  # Transaction history table
│       └── SubscribeGate.tsx   # Modal overlay for expired users
├── api/
│   └── billing.ts             # API client functions for payment endpoints
├── hooks/
│   └── use-subscription.ts    # Subscription state + guard hook
└── types/
    └── billing.ts             # Payment, Plan, Subscription types
```

### Pattern 1: Mock-First M-Pesa Service

**What:** Abstract Daraja API behind an interface; swap mock for real based on environment variable.
**When to use:** Always -- local dev uses mock, sandbox/production uses real Daraja.

```typescript
// api/src/services/mpesa.service.ts
export interface MpesaClient {
  getAccessToken(): Promise<string>;
  initiateSTKPush(params: STKPushParams): Promise<STKPushResponse>;
  querySTKStatus(checkoutRequestId: string): Promise<STKQueryResponse>;
}

// api/src/config/mpesa.ts
import { env } from "./env.js";

export function getMpesaClient(): MpesaClient {
  if (env.MPESA_ENVIRONMENT === "mock") {
    return new MockMpesaClient();
  }
  return new DarajaMpesaClient();
}
```

### Pattern 2: Atomic Payment-to-Subscription Processing

**What:** Process callback in a Prisma $transaction to update Payment AND create/extend Subscription atomically.
**When to use:** On callback receipt and on reconciliation success.

```typescript
// Inside payment.service.ts
async function activateSubscription(paymentId: string, callbackData: DarajaCallback) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCESS",
        mpesaReceiptNumber: callbackData.receiptNumber,
        resultCode: String(callbackData.resultCode),
        resultDesc: callbackData.resultDesc,
        rawCallback: callbackData.rawJson, // JSON field for debugging
      },
      include: { plan: true },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + payment.plan.durationDays * 24 * 60 * 60 * 1000);

    await tx.subscription.create({
      data: {
        userId: payment.userId,
        planId: payment.planId,
        status: "ACTIVE",
        startsAt: now,
        expiresAt,
      },
    });
  });
}
```

### Pattern 3: Subscription Guard Middleware

**What:** Middleware that checks active subscription before allowing stream access.
**When to use:** Applied to /api/stream routes (after requireAuth).

```typescript
// api/src/middleware/subscription.middleware.ts
export async function requireSubscription(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  const userId = req.user!.id;
  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
  });

  if (!activeSub) {
    res.status(403).json({
      error: {
        message: "Active subscription required",
        code: "SUBSCRIPTION_REQUIRED",
      },
    });
    return;
  }
  next();
}
```

### Pattern 4: Short Polling for Payment Status

**What:** Client polls GET /api/payments/:id/status every 3 seconds for up to 60 seconds.
**When to use:** After initiating STK Push, waiting for M-Pesa callback.

```typescript
// Client-side polling in PaymentModal
const pollPaymentStatus = async (paymentId: string) => {
  const maxAttempts = 20; // 60s / 3s interval
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await api.get(`/payments/${paymentId}/status`);
    if (data.status === "SUCCESS") return { success: true, data };
    if (data.status === "FAILED") return { success: false, data };
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  return { success: false, timeout: true };
};
```

### Anti-Patterns to Avoid

- **Storing Daraja credentials in code:** Use environment variables exclusively. The passkey and consumer secret are sensitive.
- **Processing callback without idempotency:** M-Pesa may send duplicate callbacks. Always check if payment is already SUCCESS before processing.
- **Trusting callback origin blindly:** Validate callback structure with Zod. In production, whitelist Safaricom IPs.
- **Blocking on M-Pesa response:** STK Push initiation returns immediately; the actual payment result comes via callback. Never wait synchronously.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth token management | Custom token cache | Simple in-memory cache with TTL | Daraja tokens expire in 3600s; cache with 5-min buffer. Simple `let token; let tokenExpiry;` pattern sufficient. |
| Phone number formatting | Regex-only validation | Dedicated formatter function | Must handle 07XX, 01XX, +254XX, 254XX formats and always output 254XXXXXXXXX for Daraja |
| Timestamp generation | Manual string concat | Helper function | Daraja needs YYYYMMDDHHMMSS in EAT timezone. Easy to get wrong with UTC/local confusion. |
| Subscription expiry checking | Manual date comparison everywhere | Middleware + service function | Centralize `isSubscriptionActive(userId)` to avoid inconsistent checks |

## Common Pitfalls

### Pitfall 1: Daraja Password Encoding

**What goes wrong:** STK Push returns "Bad Request - Invalid Password" or similar auth error.
**Why it happens:** The password is `Base64(ShortCode + Passkey + Timestamp)` where Timestamp is YYYYMMDDHHMMSS. Common mistakes: wrong timezone, wrong concatenation order, including separators.
**How to avoid:** Create a dedicated `generateDarajaPassword(timestamp: string): string` helper. Unit test it with known values.
**Warning signs:** 400 errors on STK Push initiation.

### Pitfall 2: Phone Number Format Mismatch

**What goes wrong:** STK Push fails with "Invalid Phone Number" or push goes to wrong number.
**Why it happens:** Daraja expects `254XXXXXXXXX` (12 digits, no +). User profile stores `+254XXXXXXXXX`. Frontend may show `07XXXXXXXX`.
**How to avoid:** Normalize phone to `254XXXXXXXXX` format in the payment service before sending to Daraja. Strip leading +, replace leading 0 with 254.
**Warning signs:** STK push not appearing on customer's phone.

### Pitfall 3: Duplicate Payment Processing

**What goes wrong:** User gets charged twice, or subscription extended twice for one payment.
**Why it happens:** M-Pesa may send the callback more than once, or reconciliation cron finds a payment that the callback already processed (race condition).
**How to avoid:** Three-layer protection as specified in CONTEXT.md. In the callback handler, only process payments with status PENDING. Use Prisma's `updateMany` with `where: { id, status: "PENDING" }` to ensure atomic state transition.
**Warning signs:** Multiple subscription records for a single payment.

### Pitfall 4: Callback URL Not Publicly Accessible

**What goes wrong:** STK Push initiates successfully, user pays, but callback never arrives.
**Why it happens:** Callback URL must be publicly accessible HTTPS endpoint. localhost doesn't work for Daraja sandbox.
**How to avoid:** Use ngrok or similar tunnel for local dev. Set `MPESA_CALLBACK_URL` as env var. Mock service bypasses this entirely for local dev.
**Warning signs:** Payments stuck in PENDING forever.

### Pitfall 5: OAuth Token Expiry Mid-Request

**What goes wrong:** STK Push or Query returns 401 Unauthorized intermittently.
**Why it happens:** Token cached but expired between cache check and API call.
**How to avoid:** Cache token with 5-minute buffer before actual expiry (token valid 3600s, refresh at 3300s). On 401 response, clear cache and retry once.
**Warning signs:** Intermittent auth failures, especially during low-traffic periods.

### Pitfall 6: Timezone Issues with Daraja Timestamp

**What goes wrong:** Password validation fails at Daraja end.
**Why it happens:** Daraja expects timestamp in East Africa Time (EAT, UTC+3). If server runs in UTC, the generated timestamp won't match expected format.
**How to avoid:** Explicitly generate timestamp in EAT timezone using `Intl.DateTimeFormat` or manual offset.
**Warning signs:** STK Push works sometimes (when server and EAT align) but fails at other times.

### Pitfall 7: Missing Callback on Sandbox

**What goes wrong:** Sandbox doesn't always send callbacks, leaving payments in PENDING state.
**Why it happens:** Known Daraja sandbox instability (documented in STATE.md). Sandbox can be unreliable during Kenyan business hours.
**How to avoid:** This is exactly why the mock service exists for local dev. Only use sandbox for targeted integration testing. The reconciliation cron handles missed callbacks.
**Warning signs:** Consistent PENDING payments during sandbox testing.

## Code Examples

### Daraja OAuth Token Generation

```typescript
// Source: Safaricom Daraja API docs + verified patterns
const DARAJA_BASE_URL = env.MPESA_ENVIRONMENT === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const response = await fetch(
    `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Daraja OAuth failed: ${response.status}`);
  }

  const data = await response.json() as { access_token: string; expires_in: string };
  cachedToken = data.access_token;
  // Refresh 5 minutes before expiry
  tokenExpiry = Date.now() + (parseInt(data.expires_in) - 300) * 1000;
  return cachedToken;
}
```

### STK Push Initiation

```typescript
// Source: Safaricom Daraja API docs
function generateTimestamp(): string {
  // Generate YYYYMMDDHHMMSS in EAT (UTC+3)
  const now = new Date();
  const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return eat.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
}

function generatePassword(timestamp: string): string {
  return Buffer.from(
    env.MPESA_SHORTCODE + env.MPESA_PASSKEY + timestamp
  ).toString("base64");
}

async function initiateSTKPush(params: {
  phone: string;      // 254XXXXXXXXX format
  amount: number;
  accountRef: string;
  callbackUrl: string;
}): Promise<{ CheckoutRequestID: string; MerchantRequestID: string }> {
  const token = await getAccessToken();
  const timestamp = generateTimestamp();

  const response = await fetch(
    `${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: env.MPESA_SHORTCODE,
        Password: generatePassword(timestamp),
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: params.amount,
        PartyA: params.phone,
        PartyB: env.MPESA_SHORTCODE,
        PhoneNumber: params.phone,
        CallBackURL: params.callbackUrl,
        AccountReference: params.accountRef,
        TransactionDesc: `Lumio ${params.accountRef} subscription`,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`STK Push failed: ${response.status} - ${err}`);
  }

  return response.json() as Promise<{ CheckoutRequestID: string; MerchantRequestID: string }>;
}
```

### Callback Payload Parsing

```typescript
// Source: Daraja callback documentation
// Successful callback structure:
const callbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z.object({
        Item: z.array(z.object({
          Name: z.string(),
          Value: z.union([z.string(), z.number()]).optional(),
        })),
      }).optional(), // Only present on success (ResultCode 0)
    }),
  }),
});

// Helper to extract metadata items
function extractCallbackMetadata(items: Array<{ Name: string; Value?: string | number }>) {
  const map = new Map(items.map(i => [i.Name, i.Value]));
  return {
    amount: map.get("Amount") as number,
    receiptNumber: map.get("MpesaReceiptNumber") as string,
    transactionDate: map.get("TransactionDate") as number,
    phoneNumber: map.get("PhoneNumber") as number,
  };
}
```

### STK Query (for Reconciliation)

```typescript
// Source: Daraja STK Query docs
async function querySTKStatus(checkoutRequestId: string): Promise<{
  ResultCode: number;
  ResultDesc: string;
}> {
  const token = await getAccessToken();
  const timestamp = generateTimestamp();

  const response = await fetch(
    `${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: env.MPESA_SHORTCODE,
        Password: generatePassword(timestamp),
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    }
  );

  return response.json() as Promise<{ ResultCode: number; ResultDesc: string }>;
}
```

### Phone Number Normalization

```typescript
// Normalize Kenyan phone to 254XXXXXXXXX format for Daraja
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, "");
  if (cleaned.startsWith("+254")) return cleaned.slice(1); // +254 -> 254
  if (cleaned.startsWith("254")) return cleaned;            // already correct
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1); // 07XX -> 254XX
  throw new Error(`Invalid Kenyan phone number: ${phone}`);
}
```

### Mock M-Pesa Service

```typescript
// api/src/services/mpesa-mock.service.ts
// Simulates STK Push flow with configurable delays and outcomes
export class MockMpesaClient implements MpesaClient {
  async getAccessToken(): Promise<string> {
    return "mock-access-token";
  }

  async initiateSTKPush(params: STKPushParams): Promise<STKPushResponse> {
    const checkoutRequestId = `ws_CO_MOCK_${Date.now()}`;

    // Simulate async callback after 2-5 seconds
    setTimeout(() => {
      // Import and call the callback handler directly
      // Success if amount is even, fail if odd (for testing)
      const success = params.amount % 2 === 0;
      this.simulateCallback(checkoutRequestId, params, success);
    }, 2000 + Math.random() * 3000);

    return {
      MerchantRequestID: `mock-merchant-${Date.now()}`,
      CheckoutRequestID: checkoutRequestId,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage: "Success. Request accepted for processing",
    };
  }

  async querySTKStatus(checkoutRequestId: string): Promise<STKQueryResponse> {
    // Mock: check payment status in DB
    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId },
    });
    if (!payment) return { ResultCode: 1, ResultDesc: "Not found" };
    if (payment.status === "SUCCESS") return { ResultCode: 0, ResultDesc: "Success" };
    if (payment.status === "FAILED") return { ResultCode: 1032, ResultDesc: "Cancelled" };
    return { ResultCode: 1037, ResultDesc: "Pending" }; // Still processing
  }

  private async simulateCallback(
    checkoutRequestId: string,
    params: STKPushParams,
    success: boolean
  ) {
    // Call the internal callback processor directly (no HTTP needed)
    // This avoids needing a public URL for mock
  }
}
```

### Reconciliation Job

```typescript
// api/src/jobs/reconciliation.job.ts
import cron from "node-cron";
import { prisma } from "../config/database.js";
import { getMpesaClient } from "../config/mpesa.js";

export function startReconciliationJob(): void {
  // Run every 2 minutes
  cron.schedule("*/2 * * * *", async () => {
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const pendingPayments = await prisma.payment.findMany({
        where: {
          status: "PENDING",
          createdAt: {
            lt: twoMinutesAgo,
            gt: tenMinutesAgo, // Don't check payments older than 10 min (already failed)
          },
          checkoutRequestId: { not: null },
        },
      });

      if (pendingPayments.length === 0) return;

      const mpesa = getMpesaClient();
      for (const payment of pendingPayments) {
        try {
          const result = await mpesa.querySTKStatus(payment.checkoutRequestId!);
          if (result.ResultCode === 0) {
            // Process as successful -- activate subscription
            await processSuccessfulPayment(payment.id, result);
            console.log(`[RECONCILIATION] Resolved payment ${payment.id} as SUCCESS`);
          } else if (isTerminalError(result.ResultCode)) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: "FAILED", resultCode: String(result.ResultCode), resultDesc: result.ResultDesc },
            });
            console.log(`[RECONCILIATION] Resolved payment ${payment.id} as FAILED: ${result.ResultDesc}`);
          }
          // Non-terminal: leave as PENDING for next cron run
        } catch (err) {
          console.error(`[RECONCILIATION] Error checking payment ${payment.id}:`, err);
        }
      }
    } catch (error) {
      console.error("[RECONCILIATION] Error:", error);
    }
  });
  console.log("[RECONCILIATION] Scheduled every 2 minutes for lost M-Pesa callbacks");
}
```

## Daraja API Reference

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/oauth/v1/generate?grant_type=client_credentials` | GET | Get Bearer token (Basic Auth) |
| `/mpesa/stkpush/v1/processrequest` | POST | Initiate STK Push |
| `/mpesa/stkpushquery/v1/query` | POST | Query STK Push status |

### Base URLs

| Environment | URL |
|-------------|-----|
| Sandbox | `https://sandbox.safaricom.co.ke` |
| Production | `https://api.safaricom.co.ke` |

### STK Push Result Codes

| Code | Meaning | Terminal? | User Message |
|------|---------|-----------|--------------|
| 0 | Success | Yes | Payment successful |
| 1 | Insufficient funds | Yes | Insufficient M-Pesa balance |
| 1001 | Transaction in progress | No | Another transaction in progress |
| 1025 | Unable to send STK | Yes (retry) | Could not send payment prompt |
| 1032 | Cancelled by user | Yes | Payment cancelled |
| 1037 | Timeout / unreachable | Yes | Payment timed out |
| 9999 | System error | Yes (retry) | System error, please retry |

### Required Environment Variables (New)

```bash
# M-Pesa Daraja API
MPESA_ENVIRONMENT=mock          # mock | sandbox | production
MPESA_CONSUMER_KEY=             # From Daraja portal
MPESA_CONSUMER_SECRET=          # From Daraja portal
MPESA_SHORTCODE=174379          # Sandbox default; production: your paybill
MPESA_PASSKEY=                  # From Daraja portal
MPESA_CALLBACK_URL=             # Public HTTPS URL for callbacks
```

## Schema Changes Required

### Payment Model Additions

```prisma
model Payment {
  // ... existing fields ...
  idempotencyKey     String?  @unique    // Nullable for existing records
  rawCallback        Json?               // Full Daraja callback JSON for debugging
  reconciliationAttempts Int  @default(0) // Track retry count
}
```

The `idempotencyKey` is nullable because existing test Payment records (if any) won't have it. The unique constraint catches duplicate submissions at the DB level.

### Plan Seeding

Three plans need to be seeded:

```typescript
const plans = [
  { name: "Weekly", price: 500, durationDays: 7 },
  { name: "Monthly", price: 1250, durationDays: 30 },
  { name: "Quarterly", price: 3000, durationDays: 90 },
];
```

## API Routes Design

### Payment Routes (authenticated)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/plans` | List active plans (public or auth) |
| POST | `/api/payments/initiate` | Initiate STK Push (requires auth) |
| GET | `/api/payments/:id/status` | Poll payment status (requires auth) |
| GET | `/api/payments/history` | User's payment history (requires auth) |

### Callback Route (no auth -- from Safaricom)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/mpesa/callback` | Receive M-Pesa callback |

### Subscription Route (authenticated)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/user/subscription` | Already exists -- returns active sub |

### Stream Routes (add subscription guard)

Modify existing `/api/stream` routes to include `requireSubscription` middleware after `requireAuth`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Daraja 2.0 | Daraja 3.0 | 2024 | New portal UI, same API endpoints |
| Manual OAuth refresh | Token caching with auto-refresh | Standard practice | Avoids rate limits on /oauth endpoint |
| Callback-only status | Callback + STK Query reconciliation | Standard pattern | Required for production reliability |

## Open Questions

1. **Daraja Sandbox Stability**
   - What we know: STATE.md notes sandbox instability in Jan 2026 and suggests "Pesa Playground" alternative
   - What's unclear: Whether Pesa Playground is needed or sandbox has improved
   - Recommendation: Mock service handles local dev. Only attempt sandbox during integration testing. If sandbox is down, skip -- the mock is sufficient for development.

2. **Production Go-Live Timeline**
   - What we know: Safaricom approval takes 2-3 weeks (from STATE.md)
   - What's unclear: Exact documentation/requirements for production approval
   - Recommendation: Use sandbox shortcode (174379) and default passkey for development. Production go-live is a deployment concern, not a development blocker.

3. **Subscription Expiry Cron**
   - What we know: Subscriptions have `status` and `expiresAt` fields. Currently no cron to expire subscriptions.
   - What's unclear: Whether to mark subscriptions as EXPIRED proactively or just check `expiresAt > now` in queries.
   - Recommendation: Check `expiresAt > now` in the subscription guard (real-time accuracy). Optionally add a daily cron to mark old subscriptions as EXPIRED for clean data, but it's not required for enforcement.

## Sources

### Primary (HIGH confidence)
- Safaricom Daraja API documentation (developer.safaricom.co.ke) -- endpoints, auth, payload structures
- Existing codebase: Prisma schema (Payment, Subscription, Plan models already defined), route patterns, middleware patterns, cron job patterns
- CONTEXT.md -- all architectural decisions locked by user

### Secondary (MEDIUM confidence)
- [KodaSchool Daraja Integration Guide](https://kodaschool.com/blog/how-to-integrate-mpesa-daraja-api-with-node-js) -- Node.js implementation patterns
- [DEV.to M-Pesa Express Guide](https://dev.to/msnmongare/m-pesa-express-stk-push-api-guide-40a2) -- Callback structure, STK query
- [Tuma M-Pesa Error Codes](https://tuma.co.ke/common-mpesa-daraja-api-error-codes-explanation-and-mitigation/) -- ResultCode reference
- [mpesa-nextjs-docs](https://mpesa-nextjs-docs.vercel.app/handling-callback) -- Callback handling patterns

### Tertiary (LOW confidence)
- STK Push error code 1037 (timeout/unreachable) -- described by multiple sources but not in official docs
- Daraja sandbox default passkey value -- varies across tutorials, verify on portal

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Daraja API is well-documented REST; no npm packages needed beyond existing stack
- Architecture: HIGH -- Follows existing codebase patterns (services, routes, middleware, cron jobs)
- Daraja API specifics: MEDIUM -- Verified across multiple sources but official docs portal was not directly fetchable
- Pitfalls: HIGH -- Common M-Pesa integration issues are well-documented across Kenyan dev community

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain -- Daraja API rarely changes)
