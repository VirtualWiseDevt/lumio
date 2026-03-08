# Phase 9: Notifications and Scheduled Jobs - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Lumio delivers transactional email notifications for account events (welcome, payments, referral rewards) and subscription lifecycle events (pre-expiry warnings, post-expiry notices). Cron jobs automate expiry checks and notification dispatch. No in-app notifications, no push notifications, no SMS notifications — email only.

</domain>

<decisions>
## Implementation Decisions

### Email Delivery Method
- Nodemailer + SMTP transport (not a SaaS email API)
- Production SMTP: Gmail SMTP (Google Workspace account)
- Sender identity: noreply@lumio.tv
- Dev mode: dual-mode pattern (like M-Pesa mock)
  - Default: console logger — prints email subject, recipient, and body preview to terminal
  - Optional: Ethereal/Mailtrap test SMTP for visual email template testing
  - Controlled by env var (e.g., EMAIL_TRANSPORT=console|smtp)

### Email Content and Branding
- Simple HTML format — basic structure with headings, paragraphs, links. No heavy CSS, no images
- Text-only header: "Lumio" styled in text (no logo image). Renders in all email clients
- Tone: Claude's discretion per email type (friendlier for welcome, professional for receipts)
- Payment success email: full breakdown — amount paid, plan name, duration, new expiry date, M-Pesa receipt number, coupon/credit deductions if any
- Payment failure email: retry suggestion and support contact info
- All emails include an unsubscribe-safe footer (even though transactional emails don't legally require it)

### Subscription Lifecycle Timing
- Pre-expiry warning: 2 days before expiry (matches NOTF-04 requirement)
- Second reminder: 1 day before expiry (follow-up if not yet renewed)
- Post-expiry notice: 1 day after expiry with reactivation link to /billing
- No grace period — access blocked immediately at expiry (already enforced by Phase 7 middleware)
- Expiry-check cron job runs every hour
- Cron must be idempotent: track which notifications have been sent (avoid duplicate emails on repeated runs)
- Skip users who have already renewed (check current subscription status before sending)

### Notification Trigger Points
- All notification sends are fire-and-forget: email failures are logged but never block the primary operation (registration, payment, etc.)
- Inline fire-and-forget (not queued via BullMQ): call sendEmail().catch(log) without awaiting. Simple, matches existing patterns (e.g., lastActiveAt fire-and-forget)
- Welcome email triggered from auth.service.ts register() — inside the service layer, not the route handler
- Payment success/failure emails triggered from payment.service.ts processCallback()
- Referral reward email triggered from referral.service.ts grantReferralCredit() (or from payment callback alongside it)
- Pre-expiry, post-expiry emails triggered by the hourly cron job
- Reactivation link in post-expiry email points to /billing (app handles auth check seamlessly)

### Claude's Discretion
- Exact HTML email template structure and inline styles
- Nodemailer transport configuration details
- How to track "notification already sent" state (field on Subscription? separate table? timestamp check?)
- Email subject lines for each notification type
- Whether to create a shared email utility or separate per-notification functions

</decisions>

<specifics>
## Specific Ideas

- Dual-mode email transport mirrors the M-Pesa mock pattern (MPESA_ENVIRONMENT controls mock vs real). Use similar env-driven switching for email (console logger in dev, real SMTP in production)
- The reconciliation notification placeholder from Phase 7 (grep: RECONCILIATION_NOTIFICATION_PLACEHOLDER) should be wired up in this phase
- node-cron v4 already installed and used for session cleanup (hourly) and reconciliation (every 2 min) — add expiry check to existing cron infrastructure

</specifics>

<deferred>
## Deferred Ideas

- In-app notification center — would be a new capability, not in scope
- SMS notifications — out of scope for v1
- Push notifications (web/mobile) — out of scope for v1
- Email preference management UI — could be added to account settings later

</deferred>

---

*Phase: 09-notifications-and-scheduled-jobs*
*Context gathered: 2026-03-08*
