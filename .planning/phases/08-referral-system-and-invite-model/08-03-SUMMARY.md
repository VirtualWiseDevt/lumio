---
phase: 08-referral-system-and-invite-model
plan: 03
subsystem: admin-invite-codes
tags: [admin, invite-codes, crud, management-ui]
depends_on:
  requires: [08-01]
  provides: [admin-invite-api, admin-invite-ui]
  affects: [08-04, 08-06]
tech-stack:
  added: []
  patterns: [crypto-random-hex-codes, tanstack-query-mutations]
key-files:
  created:
    - api/src/services/admin-invite.service.ts
    - api/src/validators/admin-invite.validators.ts
    - api/src/routes/admin-invite.routes.ts
    - admin/src/api/invite-codes.ts
    - admin/src/routes/_authenticated/invite-codes/index.tsx
  modified:
    - api/src/routes/index.ts
    - admin/src/routeTree.gen.ts
    - admin/src/components/layout/Sidebar.tsx
decisions:
  - code-format: "8 char uppercase hex via crypto.randomBytes(4).toString('hex').toUpperCase()"
  - route-registered: "inviteCodesRoute added to admin route tree, Ticket icon in sidebar"
metrics:
  duration: ~2 min
  completed: 2026-03-08
---

# Phase 8 Plan 3: Admin Invite Code Management Summary

Admin API for generating/managing invite codes plus admin panel page for bootstrapping initial users.

## What Was Done

### Task 1: Admin Invite Code API
- `admin-invite.service.ts`: createInviteCode (8-char hex), listInviteCodes (ordered desc), toggleInviteCode (active/inactive)
- `admin-invite.validators.ts`: createInviteCodeSchema (maxUses: 1-1000, default 1), toggleInviteCodeSchema
- `admin-invite.routes.ts`: POST /, GET /, PATCH /:id (all behind requireAuth + requireAdmin)
- Registered at /api/admin/invite-codes

### Task 2: Admin Panel UI
- API client with createInviteCode, listInviteCodes, toggleInviteCode
- Invite codes page: generate dialog, table with code/maxUses/used/remaining/status/created/actions
- Copy-to-clipboard, toggle active/inactive, loading skeletons, empty state
- Route registered in routeTree.gen.ts, Ticket icon added to sidebar

## Verification

- `npx tsc --noEmit` passes in both api/ and admin/
- Route registered and accessible via sidebar
