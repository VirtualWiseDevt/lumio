# Phase 9: Notifications and Scheduled Jobs - Research

**Researched:** 2026-03-08
**Domain:** Transactional email notifications via Nodemailer + SMTP, cron-based subscription lifecycle jobs
**Confidence:** HIGH

## Summary

This phase adds transactional email notifications triggered by account events (registration, payments, referral rewards) and subscription lifecycle events (pre-expiry warnings, post-expiry notices). The user has locked in Nodemailer with SMTP transport, Gmail SMTP for production, and a dual-mode dev pattern (console logger default, optional Ethereal/Mailtrap SMTP). A new hourly cron job handles subscription expiry checks with idempotent notification tracking.

The codebase already has a well-established pattern for both cron jobs (node-cron v4, see `sessionCleanup.job.ts` and `reconciliation.job.ts`) and dual-mode service switching (see `mpesa.ts` config factory + `mpesa-mock.service.ts`). The email infrastructure should follow these exact same patterns. The Subscription model already has an `expiresAt` indexed field, making expiry queries efficient.

Key technical decisions: Nodemailer v8.x with `@types/nodemailer` for TypeScript, a shared `email.service.ts` with template functions, notification-sent tracking via timestamp fields on the Subscription model (simpler than a separate table), and fire-and-forget sending (`sendEmail().catch(log)`) at all trigger points.

**Primary recommendation:** Build a single `email.service.ts` with a transport factory (mirroring `mpesa.ts` pattern), email template functions, and a `sendEmail` wrapper. Add `notifiedPreExpiry` and `notifiedPostExpiry` DateTime fields to Subscription for idempotent cron tracking.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nodemailer | ^8.0.1 | SMTP email sending | De facto Node.js email library, zero dependencies, mature |
| @types/nodemailer | latest | TypeScript type definitions | Nodemailer is JS-only, types needed for TS projects |
| node-cron | ^4.2.1 | Cron job scheduling | Already installed and used in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none additional) | - | - | Nodemailer handles SMTP, Ethereal, and console output natively |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Nodemailer | SendGrid/Mailgun API | SaaS APIs are simpler but user chose SMTP (no vendor lock-in) |
| Separate NotificationLog table | Fields on Subscription model | Separate table is more flexible but overkill for 2 boolean-like flags |
| BullMQ email queue | Fire-and-forget inline | Queue is more robust but user explicitly chose inline fire-and-forget |

**Installation:**
```bash
cd api && npm install nodemailer && npm install -D @types/nodemailer
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── config/
│   └── email.ts              # Transport factory (mirrors mpesa.ts pattern)
├── services/
│   └── email.service.ts       # sendEmail wrapper + template functions
├── jobs/
│   └── subscriptionExpiry.job.ts  # Hourly cron for pre/post-expiry notifications
```

### Pattern 1: Dual-Mode Email Transport Factory
**What:** A config file that creates either a console-logging transport or a real SMTP transport based on env var, exactly mirroring the M-Pesa mock pattern.
**When to use:** Always -- this is the core email infrastructure pattern.
**Example:**
```typescript
// src/config/email.ts
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "./env.js";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<void>;
}

class SmtpTransport implements EmailTransport {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: `"Lumio" <${env.SMTP_FROM || "noreply@lumio.tv"}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}

class ConsoleTransport implements EmailTransport {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[EMAIL] To: ${message.to}`);
    console.log(`[EMAIL] Subject: ${message.subject}`);
    console.log(`[EMAIL] Body preview: ${message.html.substring(0, 200)}...`);
    console.log(`[EMAIL] ---`);
  }
}

let transport: EmailTransport | null = null;

export function getEmailTransport(): EmailTransport {
  if (!transport) {
    transport = env.EMAIL_TRANSPORT === "smtp"
      ? new SmtpTransport()
      : new ConsoleTransport();
  }
  return transport;
}
```

### Pattern 2: Fire-and-Forget Email Sending
**What:** Call sendEmail without awaiting, catching errors to log only.
**When to use:** All notification trigger points (register, processCallback, grantReferralCredit).
**Example:**
```typescript
// In auth.service.ts register() -- after the transaction
sendWelcomeEmail(user.email, user.name).catch((err) =>
  console.error("[EMAIL] Welcome email failed:", err)
);
```

### Pattern 3: Idempotent Cron Notification Tracking
**What:** Use nullable DateTime fields on Subscription to track when notifications were sent, preventing duplicates across repeated cron runs.
**When to use:** The subscription expiry cron job.
**Example:**
```typescript
// Query: subscriptions expiring in ~2 days that haven't been notified yet
const preExpiry = await prisma.subscription.findMany({
  where: {
    status: "ACTIVE",
    expiresAt: {
      gt: new Date(),                           // not yet expired
      lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // within 2 days
    },
    notifiedPreExpiry: null,                     // not yet notified
  },
  include: { user: true, plan: true },
});
```

### Anti-Patterns to Avoid
- **Awaiting email sends in request handlers:** Blocks the response. Always fire-and-forget with `.catch(log)`.
- **Using BullMQ for email queuing:** User explicitly chose inline fire-and-forget. Don't add queue complexity.
- **Separate NotificationLog table:** Overkill for 2 notification states. Use fields on Subscription.
- **Complex HTML templates with external CSS:** User specified simple HTML with text-only branding. No template engines needed.
- **Sending emails inside Prisma transactions:** Email is a side effect; never call it inside `$transaction`. Send after the transaction completes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SMTP connection management | Custom socket handling | Nodemailer createTransport | Connection pooling, TLS, auth handled |
| Email test accounts | Manual test SMTP setup | `nodemailer.createTestAccount()` + Ethereal | Auto-generates test credentials, preview URLs |
| HTML email escaping | Manual string escaping | Template literal with minimal HTML | Transactional emails are simple; no user-generated content in templates |
| Cron expression parsing | Custom scheduler | node-cron (already installed) | Battle-tested, already used in project |
| Gmail SMTP auth | Custom OAuth flow | Gmail App Password via SMTP auth | Simpler for low-volume transactional email |

**Key insight:** This is a low-volume transactional email system (likely <100 emails/day). The entire infrastructure should be simple: one service file, one config file, one cron job. No queues, no template engines, no email tracking pixels.

## Common Pitfalls

### Pitfall 1: Gmail App Password vs OAuth2
**What goes wrong:** Using regular Gmail password fails; Google requires App Passwords or OAuth2 for SMTP.
**Why it happens:** Google disabled "less secure app access" in September 2024.
**How to avoid:** Use a Google Workspace App Password. Set `SMTP_USER=noreply@lumio.tv` and `SMTP_PASS=<app-password>`. Document this in env setup.
**Warning signs:** "Invalid login" or "Application-specific password required" errors.

### Pitfall 2: Gmail Sending Limits
**What goes wrong:** Gmail limits to ~100-150 emails/day for regular accounts, ~2000/day for Google Workspace.
**Why it happens:** Gmail is designed for personal use, not automated sending.
**How to avoid:** For Lumio's scale (small user base), Google Workspace limits are sufficient. Monitor with a daily send counter log. If limits become an issue, switch to a dedicated SMTP relay (e.g., Amazon SES).
**Warning signs:** 550 errors, "Daily user sending quota exceeded" messages.

### Pitfall 3: Duplicate Notifications from Cron
**What goes wrong:** The same user gets multiple pre-expiry emails because the cron job runs every hour.
**Why it happens:** No tracking of whether a notification was already sent.
**How to avoid:** Add `notifiedPreExpiry DateTime?` and `notifiedPostExpiry DateTime?` fields to Subscription. Set them after sending. Query with `notifiedPreExpiry: null` filter.
**Warning signs:** Users complaining about repeated emails.

### Pitfall 4: Email Failures Blocking Primary Operations
**What goes wrong:** A failed email send crashes the registration or payment flow.
**Why it happens:** Awaiting the email send or not catching errors.
**How to avoid:** Always use `sendEmail().catch(log)` pattern. Never await email sends in request handlers. Never call email sends inside Prisma transactions.
**Warning signs:** Registration/payment failures when SMTP is down.

### Pitfall 5: Sending Expiry Notifications to Already-Renewed Users
**What goes wrong:** User renews subscription, but still gets "your subscription is expiring" email.
**Why it happens:** Cron job queries old subscription records without checking if user has a newer active subscription.
**How to avoid:** Before sending, check if the user has ANY active subscription with `expiresAt > now()`. Skip notification if they do. The stacking logic in `subscription.service.ts` marks old subscriptions as EXPIRED when a new one is created, so checking `status: "ACTIVE"` should be sufficient.
**Warning signs:** Renewed users getting expiry warnings.

### Pitfall 6: Nodemailer ESM Import
**What goes wrong:** `import nodemailer from "nodemailer"` may not work cleanly in ESM.
**Why it happens:** Nodemailer uses CommonJS. ESM default import compatibility varies.
**How to avoid:** Use `import nodemailer from "nodemailer"` (default import works with `esModuleInterop: true` in tsconfig, which this project uses via tsx). If issues arise, use `import * as nodemailer from "nodemailer"`.
**Warning signs:** "nodemailer.createTransport is not a function" error.

## Code Examples

### Creating a Nodemailer Transporter for Gmail
```typescript
// Source: Nodemailer official docs + community patterns
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: "noreply@lumio.tv",
    pass: process.env.SMTP_PASS, // Google Workspace App Password
  },
});
```

### Creating an Ethereal Test Account Programmatically
```typescript
// Source: Nodemailer testing docs
import nodemailer from "nodemailer";

const testAccount = await nodemailer.createTestAccount();
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
  },
});

// After sending:
const info = await transporter.sendMail(message);
console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
```

### Sending an Email
```typescript
// Source: Nodemailer official docs
const info = await transporter.sendMail({
  from: '"Lumio" <noreply@lumio.tv>',
  to: "user@example.com",
  subject: "Welcome to Lumio!",
  html: "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
  text: "Welcome! Thanks for signing up.", // plaintext fallback
});
```

### Simple HTML Email Template Pattern
```typescript
// Inline function -- no template engine needed
function buildWelcomeEmail(name: string): { subject: string; html: string; text: string } {
  return {
    subject: "Welcome to Lumio!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Lumio</h1>
        <hr style="border: 1px solid #eee;" />
        <p>Hi ${name},</p>
        <p>Welcome to Lumio! We're glad to have you.</p>
        <p>Start exploring our content library today.</p>
        <hr style="border: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">
          This is a transactional email from Lumio. You received this because you created an account.
        </p>
      </div>
    `,
    text: `Hi ${name}, Welcome to Lumio! We're glad to have you. Start exploring our content library today.`,
  };
}
```

### Subscription Expiry Cron Job Pattern
```typescript
// src/jobs/subscriptionExpiry.job.ts -- follows sessionCleanup.job.ts pattern
import cron from "node-cron";
import { prisma } from "../config/database.js";
import { getEmailTransport } from "../config/email.js";
import { buildPreExpiryEmail, buildPostExpiryEmail } from "../services/email.service.js";

export function startSubscriptionExpiryJob(): void {
  cron.schedule("0 * * * *", async () => {
    try {
      const transport = getEmailTransport();
      const now = new Date();

      // Pre-expiry: 2 days before
      const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const preExpirySubs = await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: { gt: now, lte: twoDaysFromNow },
          notifiedPreExpiry: null,
        },
        include: { user: true, plan: true },
      });

      for (const sub of preExpirySubs) {
        const email = buildPreExpiryEmail(sub.user.name, sub.plan.name, sub.expiresAt);
        transport.send({ to: sub.user.email, ...email }).catch((err) =>
          console.error(`[EXPIRY_JOB] Pre-expiry email failed for ${sub.user.email}:`, err)
        );
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { notifiedPreExpiry: now },
        });
      }

      // Similar logic for post-expiry (1 day after) and second reminder (1 day before)
    } catch (error) {
      console.error("[EXPIRY_JOB] Error:", error);
    }
  });
  console.log("[EXPIRY_JOB] Scheduled hourly subscription expiry checks");
}
```

### Env Config Extension
```typescript
// Add to env.ts envSchema:
EMAIL_TRANSPORT: z.enum(["console", "smtp"]).default("console"),
SMTP_HOST: z.string().default("smtp.gmail.com"),
SMTP_PORT: z.coerce.number().default(465),
SMTP_USER: z.string().default(""),
SMTP_PASS: z.string().default(""),
SMTP_FROM: z.string().default("noreply@lumio.tv"),
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Gmail "less secure apps" login | App Passwords or OAuth2 | Sept 2024 | Must use App Password for Google Workspace |
| Nodemailer 6.x | Nodemailer 8.x | 2025 | Minor API changes, ESM improvements |
| Complex email template engines (Handlebars, EJS) | Simple inline HTML for transactional | Ongoing trend | No build step, fewer dependencies, good enough for simple emails |

**Deprecated/outdated:**
- Gmail "less secure app access": Fully removed by Google. Use App Passwords instead.
- Nodemailer `well-known` service shortcuts: Still work but explicit host/port is clearer.

## Open Questions

1. **Second reminder (1 day before) timing granularity**
   - What we know: Context says "Second reminder: 1 day before expiry"
   - What's unclear: With an hourly cron, the "2 days before" and "1 day before" windows overlap. Need separate tracking fields for each.
   - Recommendation: Add a third field `notifiedPreExpiry1Day DateTime?` OR use a single `notifiedPreExpiry` for the 2-day notice and `notifiedPreExpiry1Day` for the 1-day notice. Keep it explicit with two fields.

2. **Password reset email integration**
   - What we know: `forgotPassword()` in auth.service.ts currently logs the reset token to console with a TODO for Phase 9
   - What's unclear: Whether this should be wired up as part of this phase
   - Recommendation: Wire it up -- it's a natural fit and uses the same email infrastructure. The reset token URL format needs to be decided (e.g., `https://lumio.tv/reset-password?token=xxx`).

3. **Reconciliation notification wiring**
   - What we know: `RECONCILIATION_NOTIFICATION_PLACEHOLDER` grep anchor exists in reconciliation.job.ts
   - What's unclear: Whether reconciled payments need different email content than callback-triggered payments
   - Recommendation: Use the same payment success email template. Replace the console.log placeholder with a fire-and-forget email send.

## Sources

### Primary (HIGH confidence)
- Nodemailer official site (nodemailer.com) -- API docs, Gmail usage, testing
- Project codebase -- existing cron job patterns, M-Pesa mock pattern, service structure
- Prisma schema -- Subscription model fields, indexes

### Secondary (MEDIUM confidence)
- npm registry -- Nodemailer v8.0.1 as latest version
- Community guides (dev.to, Medium) -- TypeScript + Nodemailer patterns confirmed across multiple sources
- Mailtrap blog -- Gmail SMTP configuration and limitations

### Tertiary (LOW confidence)
- Gmail sending limits (100-150/day regular, ~2000/day Workspace) -- commonly cited but exact numbers vary by source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Nodemailer is the de facto standard, version confirmed via npm
- Architecture: HIGH - Directly mirrors existing project patterns (mpesa.ts factory, cron job structure)
- Pitfalls: HIGH - Gmail auth changes are well-documented; duplicate notification prevention is a known pattern
- Email templates: MEDIUM - Simple inline HTML approach is well-established but exact styling is discretionary

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (30 days -- Nodemailer is stable, patterns are well-established)
