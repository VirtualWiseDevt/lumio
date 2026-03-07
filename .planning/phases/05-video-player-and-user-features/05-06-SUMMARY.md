---
phase: 05-video-player-and-user-features
plan: 06
subsystem: client-account
tags: [account, profile, subscription, devices, preferences, tanstack-query]
dependency_graph:
  requires: [05-03]
  provides: [account-settings-page, profile-editing, device-management, preferences-toggles]
  affects: [07-payments]
tech_stack:
  added: []
  patterns: [inline-editing, optimistic-updates, toggle-switch, confirm-before-delete]
file_tracking:
  key_files:
    created:
      - client/src/components/account/ProfileSection.tsx
      - client/src/components/account/SubscriptionSection.tsx
      - client/src/components/account/DeviceSection.tsx
      - client/src/components/account/PreferencesSection.tsx
      - client/src/app/account/page.tsx
    modified: []
decisions:
  - id: "05-06-01"
    description: "Auto-renew toggle disabled with Phase 7 dependency note (no PATCH endpoint yet)"
  - id: "05-06-02"
    description: "Newsletter value read via unknown cast since UserProfile type lacks newsletter field"
  - id: "05-06-03"
    description: "Device removal uses inline confirm/cancel pattern instead of modal dialog"
metrics:
  duration: "~2 min"
  completed: "2026-03-07"
---

# Phase 5 Plan 6: Account Settings Page Summary

**One-liner:** Scrollable /account page with profile editing, subscription status, device session management, and preference toggles using TanStack Query mutations.

## What Was Built

### ProfileSection
- Initials avatar (first letter, red-600 circle, w-20 h-20)
- Read-only email display with "cannot be changed" note
- Inline-editable name and phone fields (Edit -> input + Save/Cancel)
- Uses useMutation for PATCH /user/profile with query invalidation

### SubscriptionSection
- Displays plan name, status badge (green/red), days remaining
- Handles null subscription with "No active subscription" and Subscribe link
- "Manage Subscription" link to /billing (Phase 7 route)

### DeviceSection
- Lists all sessions with device type icons (Monitor/Smartphone/Tablet from lucide-react)
- "This device" badge on current session (isCurrent: true)
- Remove button on non-current sessions with inline confirm/cancel
- Relative time display ("2 hours ago") via timeAgo helper

### PreferencesSection
- Newsletter toggle with optimistic update (onMutate sets cache, onError reverts)
- Auto-renew toggle shown but disabled with "Available when subscription management launches" note
- Custom toggle switch components with aria-checked role="switch"

### Account Page
- Route: /account
- pt-24 to clear navbar, max-w-2xl centered, gap-8 between sections
- Renders all 4 sections in order

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Auto-renew toggle disabled** - No PATCH endpoint for subscription autoRenew exists yet; toggle reflects current state but is disabled with Phase 7 dependency note
2. **Newsletter via unknown cast** - UserProfile type doesn't include newsletter field; used unknown cast to read it from API response dynamically
3. **Inline confirm for device removal** - Used inline Confirm/Cancel buttons instead of a modal dialog for lighter UX

## Next Phase Readiness

- /billing route referenced but not yet created (Phase 7 dependency)
- Auto-renew toggle needs PATCH /api/user/subscription endpoint from Phase 7
- Auth not wired yet in client -- account page will show data once auth context is integrated
