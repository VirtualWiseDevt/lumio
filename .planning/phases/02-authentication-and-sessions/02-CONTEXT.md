# Phase 2: Authentication and Sessions - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely create accounts, log in, manage their sessions, and are limited to 2 concurrent devices. Includes registration, login, JWT + server-side sessions hybrid, 2-device enforcement, session management UI, password change, password reset, and stale session cleanup.

Requirements: AUTH-01 through AUTH-07.

</domain>

<decisions>
## Implementation Decisions

### Registration flow
- Form fields: name, email, phone, password (all required)
- Invite/referral code: required field, pre-filled from URL query param (?c=CODE), user can edit it
- Phone format: Kenyan only (07XX or +254) — auto-convert 07XX to +2547XX for M-Pesa compatibility
- Duplicate account error: generic "Account already exists" — no field-specific error (prevents enumeration)

### Login and error responses
- Login identifier: email only (phone is for M-Pesa, not login)
- Failed login error: generic "Invalid email or password" (prevents enumeration)
- 2-device limit rejection: show list of active devices, let user pick one to remove before proceeding
- Rate limiting: lock account for 15 minutes after 5 failed login attempts (brute force protection)

### Session management UX
- Session list shows: device name and last active time only (no IP address)
- Current device: labeled "This device" with no remove button — user must use logout instead
- Terminating other sessions: requires confirmation dialog ("Remove this device? They'll need to log in again.")
- Session list location: under a "Devices" section in the account settings page

### Token and security behavior
- Session duration: 7 days, no "remember me" option — consistent for all logins
- Password change: invalidates all other sessions immediately (only current session survives)
- Password reset: yes, email-based forgot password flow with time-limited reset token
- Stale session cleanup: server-side job removes sessions inactive for 7+ days

### Claude's Discretion
- JWT token structure (claims, signing algorithm)
- Password strength requirements (minimum length, complexity rules)
- Reset token TTL and format
- Device name/type detection method (user-agent parsing)
- Exact error response JSON structure
- Session cleanup frequency (cron interval)

</decisions>

<specifics>
## Specific Ideas

- Security-first approach: generic errors everywhere to prevent account enumeration
- 2-device limit UX inspired by streaming apps: when blocked, show devices and let user choose which to kick
- Registration requires invite code (invite-only model) — code comes from referral URL but is always visible and editable on the form
- Phone number is collected at registration but login is email-only — phone is reserved for M-Pesa payments

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-authentication-and-sessions*
*Context gathered: 2026-03-07*
