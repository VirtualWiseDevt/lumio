# Phase 8: Referral System and Invite Model - Research

**Researched:** 2026-03-07
**Domain:** Referral system, invite-only registration, credit stacking, coupon redemption
**Confidence:** HIGH

## Summary

This phase builds on significant existing infrastructure. The API already enforces referral codes at registration (validates referrer, creates Referral record, auto-generates code for new user). The Prisma schema already has `Referral` and `Coupon` models, and `User.referralCode` field. The payment service (`payment.service.ts`) processes M-Pesa STK Push but does NOT yet deduct credits or coupons.

The main gaps are: (1) no referral credit balance tracking on User, (2) no credit/coupon deduction in payment flow, (3) no KES 0 payment bypass path, (4) no referral/coupon API endpoints, (5) no Invite Friends client page, (6) no coupon redemption UI on billing page, (7) no per-user coupon tracking model, and (8) the client has NO registration/login pages yet (only the API endpoints exist).

**Primary recommendation:** Extend the existing schema with a `referralCreditBalance` field on User, add a `CouponRedemption` join model, then modify `payment.service.ts` to calculate discounts before initiating STK Push (or skip M-Pesa entirely for KES 0). Build new API routes for referral stats, coupon validation, and referral code lookup. Client work includes the Invite Friends page, coupon input on billing, and credit display in payment modal.

## Standard Stack

This phase uses only existing project dependencies. No new libraries needed.

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.19.2 | Database ORM, schema, migrations | Already used, handles transactions |
| Express | 5.2.1 | API routes for referral/coupon endpoints | Already used |
| Zod | (existing) | Request validation for new endpoints | Already used |
| Next.js | 15.5.9 | Client pages (Invite Friends, registration) | Already used |
| TanStack Query | (existing) | Data fetching for referral stats, coupon validation | Already used |
| crypto (Node built-in) | N/A | Referral code generation | Already used in auth.service.ts |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| motion/react | (existing) | Payment modal animations | Already used in PaymentModal |
| lucide-react | (existing) | Icons for copy button, share buttons | Already used |
| Zustand | (existing) | Auth state (referral code in user store) | If auth store exists |

**Installation:** No new packages needed.

## Architecture Patterns

### Existing Code That Phase 8 Modifies

```
api/src/
├── services/auth.service.ts      # MODIFY: Already validates referral, needs minor tweaks
├── services/payment.service.ts   # MODIFY: Add credit/coupon deduction before STK Push
├── services/subscription.service.ts # MODIFY: Handle KES 0 activation path
├── services/user.service.ts      # MODIFY: Include referralCode in profile response
├── validators/auth.validators.ts # EXISTS: referralCode already validated
├── routes/payment.routes.ts      # MODIFY: Accept couponCode in initiate payload
├── routes/user.routes.ts         # EXTEND: Add referral stats endpoint

client/src/
├── app/billing/page.tsx           # MODIFY: Add coupon input section
├── app/account/page.tsx           # MODIFY: Add Invite Friends link
├── components/billing/PaymentModal.tsx # MODIFY: Show credit/coupon line items
```

### New Code This Phase Creates

```
api/src/
├── services/referral.service.ts   # NEW: Credit calculation, referral stats, code validation
├── services/coupon.service.ts     # NEW: Coupon validation, redemption, stacking logic
├── routes/referral.routes.ts      # NEW: GET /referral/stats, GET /referral/validate/:code
├── routes/coupon.routes.ts        # NEW: POST /coupons/validate
├── validators/referral.validators.ts # NEW
├── validators/coupon.validators.ts   # NEW

client/src/
├── app/invite/page.tsx            # NEW: Invite Friends page
├── api/referral.ts                # NEW: API client functions
├── api/coupon.ts                  # NEW: API client functions
```

### Pattern 1: Credit Calculation at Payment Time
**What:** When initiating payment, calculate total discount (coupon + credits) and either reduce STK Push amount or skip M-Pesa for KES 0.
**When to use:** Every payment initiation.
**Example:**
```typescript
// In payment.service.ts - modified initiatePayment
export async function initiatePayment(
  userId: string,
  planId: string,
  phone: string,
  couponCode?: string,
): Promise<PaymentResult> {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) throw new Error("Plan not found");

  let finalAmount = plan.price;
  let couponDiscount = 0;
  let creditDiscount = 0;
  let couponId: string | null = null;

  // Step 1: Apply coupon first (if provided)
  if (couponCode) {
    const coupon = await validateAndApplyCoupon(couponCode, userId, plan.price);
    couponDiscount = coupon.discountAmount;
    couponId = coupon.id;
    finalAmount -= couponDiscount;
  }

  // Step 2: Apply referral credits on remaining amount
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.referralCreditBalance > 0) {
    creditDiscount = Math.min(user.referralCreditBalance, finalAmount);
    finalAmount -= creditDiscount;
  }

  // Step 3: If KES 0, skip M-Pesa entirely
  if (finalAmount <= 0) {
    return await processZeroPayment(userId, planId, plan.price, couponDiscount, creditDiscount, couponId);
  }

  // Step 4: Normal M-Pesa STK Push with reduced amount
  // ... existing STK Push logic with finalAmount
}
```

### Pattern 2: Credit Granting on First Payment
**What:** When referee completes first payment, grant 10% of referrer's plan price to referrer's credit balance.
**When to use:** Inside `processCallback` after successful payment.
**Example:**
```typescript
// In payment callback, after activateSubscription:
async function grantReferralCredit(tx: TxClient, userId: string) {
  // Find if this user was referred
  const referral = await tx.referral.findUnique({
    where: { refereeId: userId },
    include: { referrer: { include: { subscriptions: { include: { plan: true } } } } },
  });

  if (!referral || referral.isRedeemed) return;

  // Get referrer's current plan price
  const referrerSub = await tx.subscription.findFirst({
    where: { userId: referral.referrerId, status: "ACTIVE" },
    include: { plan: true },
  });

  if (!referrerSub) return;

  const creditAmount = Math.round(referrerSub.plan.price * 0.10);

  // Update referral record
  await tx.referral.update({
    where: { id: referral.id },
    data: { creditAmount, isRedeemed: true },
  });

  // Add to referrer's credit balance (capped at 100% of their plan price)
  await tx.user.update({
    where: { id: referral.referrerId },
    data: { referralCreditBalance: { increment: creditAmount } },
  });
}
```

### Pattern 3: Referral Code Validation Endpoint (Public)
**What:** Allow checking if a referral code is valid before registration, returning referrer's display name.
**When to use:** Real-time validation on registration form.
**Example:**
```typescript
// GET /api/referrals/validate/:code (public, no auth)
router.get("/validate/:code", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { referralCode: req.params.code },
    select: { name: true },
  });
  if (!user) {
    res.status(404).json({ valid: false });
    return;
  }
  // "Kelvin M." format
  const parts = user.name.split(" ");
  const displayName = parts.length > 1
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : parts[0];
  res.json({ valid: true, referrerName: displayName });
});
```

### Anti-Patterns to Avoid
- **Calculating credits client-side:** Always compute on server. Client only displays what server returns.
- **Race condition on credit deduction:** Use Prisma `$transaction` to atomically read balance, compute discount, deduct balance, and create payment.
- **Allowing self-referral:** Check that referrer ID !== new user ID during registration (already prevented implicitly since user doesn't exist yet, but guard against code reuse attacks).

## Schema Changes Required

### Add to User model
```prisma
model User {
  // ... existing fields
  referralCreditBalance Int @default(0)  // NEW: running credit balance in KES
}
```

### Add CouponRedemption model (per-user tracking)
```prisma
model CouponRedemption {
  id        String   @id @default(uuid())
  couponId  String
  userId    String
  paymentId String?
  createdAt DateTime @default(now())

  coupon  Coupon  @relation(fields: [couponId], references: [id])
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  payment Payment? @relation(fields: [paymentId], references: [id])

  @@unique([couponId, userId])  // per-user limit: one redemption per coupon per user
  @@index([userId])
  @@index([couponId])
}
```

### Add perUserLimit to Coupon model
```prisma
model Coupon {
  // ... existing fields
  perUserLimit Int @default(1)  // NEW
  redemptions CouponRedemption[]  // NEW relation
}
```

### Modify Payment model
```prisma
model Payment {
  // ... existing fields
  couponId           String?  // NEW: which coupon was applied
  couponDiscount     Int      @default(0)  // NEW: KES discount from coupon
  referralCreditsUsed Int     @default(0)  // NEW: KES credits deducted

  couponRedemption CouponRedemption?  // NEW relation
}
```

### Add AdminInviteCode model (for bootstrapping)
```prisma
model AdminInviteCode {
  id        String   @id @default(uuid())
  code      String   @unique
  maxUses   Int      @default(1)
  usedCount Int      @default(0)
  createdBy String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([code])
}
```

**Note:** The existing `CouponType` enum has PERCENTAGE, FIXED_AMOUNT, and FREE_DAYS. Per user decision, only PERCENTAGE is used in Phase 8. The enum can remain as-is for future flexibility, but validation should only accept PERCENTAGE coupons.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unique code generation | Custom alphabet/collision-check loop | `crypto.randomBytes(4).toString("hex")` | Already used in auth.service.ts, 8-char hex gives 4 billion combos, collision handled by `@unique` constraint |
| Clipboard copy | Manual execCommand | `navigator.clipboard.writeText()` | Modern API, supported in all target browsers |
| WhatsApp sharing | Custom deep link logic | `https://wa.me/?text=` URL scheme | Official WhatsApp API, works on mobile and desktop |
| SMS sharing | Custom SMS integration | `sms:?body=` URL scheme | Native SMS app integration, zero dependencies |
| Atomic credit deduction | Manual lock/check/deduct | Prisma `$transaction` with optimistic locking | Prevents double-spend race conditions |

**Key insight:** The referral system is mostly business logic (credit math, validation rules) built on existing Prisma + Express patterns. No new infrastructure is needed.

## Common Pitfalls

### Pitfall 1: Double Credit Granting
**What goes wrong:** If M-Pesa callback fires twice (duplicate), referrer gets credit twice.
**Why it happens:** M-Pesa callbacks are not guaranteed exactly-once delivery.
**How to avoid:** The existing `processCallback` already skips non-PENDING payments (idempotent). Additionally, `Referral.isRedeemed` acts as a one-time flag. Check both.
**Warning signs:** Referral credit amounts exceeding expected values.

### Pitfall 2: Credit Balance Going Negative
**What goes wrong:** Concurrent payments could both read the same balance and both deduct.
**Why it happens:** Read-then-write without atomic transaction.
**How to avoid:** Use `$transaction` with isolation level. Read balance, compute deduction, decrement atomically. Use `prisma.user.update({ data: { referralCreditBalance: { decrement: amount } } })` and check the result is non-negative.
**Warning signs:** Negative `referralCreditBalance` values in database.

### Pitfall 3: Referral Code in URL Not Reaching Registration
**What goes wrong:** User visits `lumio.tv/?c=CODE`, but by the time they reach the registration form, the code is lost.
**Why it happens:** SPA navigation clears URL params; no client-side auth pages exist yet.
**How to avoid:** Capture `?c=` param on landing page, store in `sessionStorage`, and pre-fill on registration form. Or use Next.js `searchParams` to pass through.
**Warning signs:** Users reporting "code not found" despite clicking referral links.

### Pitfall 4: Coupon + Credits Stacking Order Matters
**What goes wrong:** If credits applied first, coupon percentage applies to full price giving user more discount than intended.
**Why it happens:** Wrong application order.
**How to avoid:** Per user decision: coupon percentage applied to plan price FIRST, then credits applied to remaining balance. Order is locked.
**Warning signs:** Discounts exceeding 100% of plan price.

### Pitfall 5: Admin Invite Codes vs User Referral Codes
**What goes wrong:** Admin invite codes and user referral codes could collide if stored in same field.
**Why it happens:** Both are used in the `referralCode` field during registration.
**How to avoid:** Registration should check BOTH `User.referralCode` AND `AdminInviteCode.code`. Admin codes are separate model, separate namespace. The auth service `register` function needs to check both tables.
**Warning signs:** Admin codes not working, or collisions between code types.

### Pitfall 6: Excess Credit Carryover
**What goes wrong:** Credits that exceed the plan price are lost instead of carrying over.
**Why it happens:** Deducting full balance instead of only what's needed.
**How to avoid:** `creditDiscount = Math.min(user.referralCreditBalance, remainingAmount)`. Only deduct `creditDiscount`, not the full balance.
**Warning signs:** Users with referral credits showing KES 0 balance after a payment where credits exceeded plan price.

## Code Examples

### Referral Code Generation (Existing Pattern)
```typescript
// Source: api/src/services/auth.service.ts (line 57)
// Already generates 8-char hex code at registration
const generatedCode = crypto.randomBytes(4).toString("hex");
// Example output: "a3f7b2c1" — meets 6-8 char requirement
```

### Payment Amount Calculation with Discounts
```typescript
// New function for payment.service.ts
interface PaymentCalculation {
  planPrice: number;
  couponDiscount: number;
  creditsUsed: number;
  finalAmount: number;
  remainingCredits: number;
}

function calculatePaymentAmount(
  planPrice: number,
  couponPercentage: number, // 0-100
  availableCredits: number,
): PaymentCalculation {
  // Step 1: Apply coupon to plan price
  const couponDiscount = Math.round(planPrice * (couponPercentage / 100));
  const afterCoupon = planPrice - couponDiscount;

  // Step 2: Apply credits to remaining
  const creditsUsed = Math.min(availableCredits, afterCoupon);
  const finalAmount = afterCoupon - creditsUsed;

  // Step 3: Calculate remaining credits
  const remainingCredits = availableCredits - creditsUsed;

  return {
    planPrice,
    couponDiscount,
    creditsUsed,
    finalAmount: Math.max(0, finalAmount),
    remainingCredits,
  };
}
```

### Zero-Payment Path (KES 0)
```typescript
// When credits/coupon fully cover plan price
async function processZeroPayment(
  tx: TxClient,
  userId: string,
  planId: string,
  planPrice: number,
  couponDiscount: number,
  creditsUsed: number,
  couponId: string | null,
): Promise<{ paymentId: string }> {
  // Create payment record with KES 0
  const payment = await tx.payment.create({
    data: {
      userId,
      planId,
      amount: 0,
      discount: couponDiscount + creditsUsed,
      couponDiscount,
      referralCreditsUsed: creditsUsed,
      couponId,
      status: "SUCCESS",
      method: "CREDITS",
      idempotencyKey: crypto.randomUUID(),
    },
  });

  // Deduct credits
  if (creditsUsed > 0) {
    await tx.user.update({
      where: { id: userId },
      data: { referralCreditBalance: { decrement: creditsUsed } },
    });
  }

  // Activate subscription
  await activateSubscription(tx, payment.id);

  return { paymentId: payment.id };
}
```

### Invite Friends Page Share URLs
```typescript
// WhatsApp share
const referralUrl = `https://lumio.tv/?c=${user.referralCode}`;
const whatsappText = encodeURIComponent(
  `Join me on Lumio! Stream movies, series & more. Use my invite link: ${referralUrl}`
);
const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

// SMS share
const smsBody = encodeURIComponent(
  `Join me on Lumio! Use my invite link: ${referralUrl}`
);
const smsUrl = `sms:?body=${smsBody}`;
```

### Clipboard Copy with Fallback
```typescript
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-HTTPS
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate referral code table | `referralCode` on User model | Already implemented | Simpler, one lookup |
| Credit calculation in webhook | Credit at first payment callback | Current design | Ensures referee actually paid |
| Full M-Pesa for all payments | KES 0 bypass with CREDITS method | Phase 8 | Avoids unnecessary M-Pesa round-trip |

## Existing Code Inventory

Key findings about what already exists:

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Referral code on User | EXISTS | schema.prisma L72 | `referralCode String? @unique` |
| Referral model | EXISTS | schema.prisma L304-318 | Has referrerId, refereeId, creditAmount, isRedeemed |
| Coupon model | EXISTS | schema.prisma L320-333 | Has code, type, value, maxUses, currentUses, expiresAt |
| CouponType enum | EXISTS | schema.prisma L41-45 | PERCENTAGE, FIXED_AMOUNT, FREE_DAYS |
| Registration referral validation | EXISTS | auth.service.ts L38-43 | Validates code, throws INVALID_REFERRAL_CODE |
| Referral record creation | EXISTS | auth.service.ts L71-74 | Creates in transaction with user |
| Code generation | EXISTS | auth.service.ts L57 | `crypto.randomBytes(4).toString("hex")` |
| Referral code in login response | EXISTS | auth.routes.ts L149 | Returns referralCode in user object |
| Validator for referralCode | EXISTS | auth.validators.ts L24 | `referralCode: z.string().min(1)` |
| Client registration pages | MISSING | N/A | No /register or /login client pages |
| Referral credit balance | MISSING | User model | Need `referralCreditBalance Int` |
| Per-user coupon tracking | MISSING | N/A | Need CouponRedemption model |
| Credit deduction in payment | MISSING | payment.service.ts | Charges full plan.price |
| KES 0 payment path | MISSING | payment.service.ts | Always initiates STK Push |
| Referral stats endpoint | MISSING | N/A | No route for referral data |
| Coupon validation endpoint | MISSING | N/A | No route for coupon check |
| Invite Friends page | MISSING | client | No page exists |
| Coupon UI on billing | MISSING | billing/page.tsx | No coupon field |
| Credit display in payment modal | MISSING | PaymentModal.tsx | Shows full plan price only |
| Admin invite code model | MISSING | N/A | Need for bootstrapping |

## Open Questions

1. **Client-side registration/login pages**
   - What we know: API endpoints exist at POST /api/auth/register and POST /api/auth/login. Client has no auth pages.
   - What's unclear: Whether auth pages are being built in this phase or a prior phase. The registration form NEEDS to exist for referral code to work.
   - Recommendation: Phase 8 must include creating client-side registration page (at minimum) to demonstrate the referral code flow. If login/register pages already exist from a prior phase that wasn't tracked, just modify them.

2. **Referral credit cap enforcement**
   - What we know: 10 referrals at 10% = 100% cap. Credit balance is a running KES amount.
   - What's unclear: Is the cap on total accumulated credits ever, or current balance? If referrer changes plans, does the 100% cap change?
   - Recommendation: Cap is on credit balance relative to current plan price at each payment time. Don't cap the raw KES balance; just cap how much can be applied (min of balance, plan price). This handles plan changes naturally.

3. **Admin invite codes and registration flow**
   - What we know: Admin creates invite codes for initial users. Registration validates `User.referralCode`.
   - What's unclear: How admin invite codes integrate with the existing registration flow that only checks `User.referralCode`.
   - Recommendation: Modify registration to check BOTH tables. If code matches a User's referralCode, create normal Referral. If code matches an AdminInviteCode (and has uses remaining), increment usedCount and skip Referral creation (no referrer to credit).

## Sources

### Primary (HIGH confidence)
- `api/prisma/schema.prisma` - Existing Referral, Coupon, User models examined
- `api/src/services/auth.service.ts` - Registration flow with referral validation
- `api/src/services/payment.service.ts` - Payment initiation and callback processing
- `api/src/services/subscription.service.ts` - Subscription activation in transactions
- `api/src/validators/auth.validators.ts` - Zod schemas for registration
- `client/src/app/billing/page.tsx` - Current billing page structure
- `client/src/components/billing/PaymentModal.tsx` - Payment modal flow
- `client/src/app/account/page.tsx` - Account page layout
- `client/src/api/billing.ts` - Client API functions
- `client/src/types/billing.ts` - TypeScript types for billing

### Secondary (MEDIUM confidence)
- WhatsApp URL scheme `https://wa.me/?text=` - Well-documented, standard approach
- SMS URL scheme `sms:?body=` - Standard cross-platform scheme
- `navigator.clipboard.writeText()` - Modern Clipboard API

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, no new dependencies
- Architecture: HIGH - Extends existing patterns (services, routes, validators, Prisma transactions)
- Schema changes: HIGH - Based on direct examination of current schema
- Pitfalls: HIGH - Derived from actual code analysis (e.g., callback idempotency already handled)
- Client pages: MEDIUM - Registration page may or may not exist from earlier work

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain, no external dependency changes)
