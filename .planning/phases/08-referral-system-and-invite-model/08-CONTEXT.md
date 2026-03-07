# Phase 8: Referral System and Invite Model - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Lumio operates as an invite-only platform. This phase delivers: referral codes auto-generated per user, invite-only registration enforcement, stacking subscription credits (10% per referral, up to 100% cap), an Invite Friends page with WhatsApp/SMS sharing, and coupon/promo code redemption on the billing page. Admin coupon management is Phase 10 (admin dashboard).

</domain>

<decisions>
## Implementation Decisions

### Referral Code & Invite Flow
- Code format: short alphanumeric, 6-8 characters (e.g., "KE7X2M4P")
- Auto-generated at registration — every user gets a code immediately
- Registration requires a valid referral code (invite-only enforced)
- Referral code in URL: `lumio.tv/?c=KE7X2M4P` pre-fills the code field on registration form
- Code field is editable — user can clear and type a different code
- Valid code shows "Invited by [First Name Last Initial]." feedback (e.g., "Invited by Kelvin M.")
- Navigating to /register directly with no URL param shows empty required code field
- Bootstrapping: admin panel has a section to generate invite codes for initial users (one-time or multi-use)

### Credit Calculation & Stacking
- 10% credit based on the referrer's own plan price (not the referred user's payment)
- Credits stack with each referral up to 100% cap (10 referrals = free streaming)
- When credits fully cover the plan price: skip M-Pesa entirely, auto-activate subscription with a KES 0 payment record
- Credit balance displayed on billing page: "Referral Credits: KES X"
- Line item breakdown before payment: "Plan KES 1,250 - Credits KES 375 = Pay KES 875"
- Referral credits and coupon discounts stack on the same payment (coupon applied first, then credits on remaining)
- Excess credits carry over to next billing cycle

### Invite Friends Page
- Page location: accessible from Account page (link/button), NOT in main navbar
- Layout (top to bottom):
  1. Hero section: "Invite Friends, Earn Free Streaming" heading with value pitch subtitle ("For every friend who joins and subscribes, you earn 10% off your next payment. Refer 10 friends and stream for free!")
  2. Referral link box with Copy button (inline "Copied!" checkmark feedback for 2 seconds)
  3. Share buttons: "Share via WhatsApp" and "Share via SMS" side by side
  4. Referral stats: totals only (friends joined count, credits earned amount) — no individual names
  5. Community Guidelines section with suspension warnings (prominent, not hidden)
- WhatsApp share URL: `https://wa.me/?text=Join me on Lumio! Stream unlimited movies, series & Live TV. Use my invite link: lumio.tv/?c={CODE}`
- SMS share URL: `sms:?body=Join me on Lumio! lumio.tv/?c={CODE}`
- Community Guidelines text (exact): "We kindly remind you that sharing this link on social media platforms including Reddit, Discord, Telegram, Facebook, and Instagram is strictly prohibited. Violations result in: Immediate suspension of your account, Suspension of your referrer's account, Suspension of accounts you referred. Lumio is a privacy-centric service curated for friends and family exclusively."

### Coupon & Promo Codes
- Discount type: percentage only (e.g., 20% off, 50% off)
- Redemption UX: "Have a promo code?" expandable field on the billing page, applied before selecting plan to show discounted prices
- Usage limits: both global limit (e.g., max 100 uses) AND per-user limit (each user can use a coupon once)
- Coupons have expiry dates
- Coupons and referral credits stack (coupon discount applied first, then credits deducted from remainder)

### Claude's Discretion
- Exact referral code generation algorithm (crypto-random, nanoid, etc.)
- Admin invite code UI specifics (Phase 10 may handle the full admin UI, but basic generation needed here)
- Coupon model schema details (fields beyond code, percentage, maxUses, usedCount, expiresAt)
- How to handle edge cases like self-referral prevention

</decisions>

<specifics>
## Specific Ideas

- WhatsApp is essential for the Kenyan market (15M+ users). One-tap WhatsApp sharing directly increases referral conversion vs copy-paste.
- Community guidelines with suspension warnings are core to Lumio's identity as a privacy-centric, invite-only platform — not a social media blast service
- The invite page layout was provided as a detailed mockup by the user (see decisions above for exact structure)
- VIU reference mentioned — protecting the invite-only community model

</specifics>

<deferred>
## Deferred Ideas

- Admin coupon management UI (create/edit/delete coupons) — Phase 10 admin dashboard
- Referral analytics for admin (top referrers, conversion rates) — Phase 10 admin dashboard

</deferred>

---

*Phase: 08-referral-system-and-invite-model*
*Context gathered: 2026-03-07*
