---
phase: 03-content-api-and-admin-content-management
plan: 02
subsystem: admin-panel-shell
tags: [react, vite, shadcn-ui, tanstack-router, auth, sidebar, admin]
dependency-graph:
  requires: [03-01]
  provides: [admin-shell, auth-context, api-client, sidebar-layout, login-page]
  affects: [03-03, 03-04, 03-05, 03-06, 03-07, 03-08, 03-09]
tech-stack:
  added: [react@19, react-dom@19, vite@6, tailwindcss@4, "@tanstack/react-router@1", "@tanstack/react-query@5", axios, shadcn-ui, radix-ui, sonner, lucide-react, date-fns, clsx, tailwind-merge, class-variance-authority]
  patterns: [auth-context-provider, axios-interceptor-auth, layout-route-guard, dark-theme-css-variables]
key-files:
  created: [admin/vite.config.ts, admin/index.html, admin/components.json, admin/src/main.tsx, admin/src/app.css, admin/src/lib/utils.ts, admin/src/api/client.ts, admin/src/api/auth.ts, admin/src/hooks/useAuth.tsx, admin/src/routes/__root.tsx, admin/src/routes/login.tsx, admin/src/routes/_authenticated.tsx, admin/src/routes/_authenticated/index.tsx, admin/src/components/layout/Sidebar.tsx, admin/src/components/layout/Header.tsx, admin/src/components/layout/PageContainer.tsx, admin/src/routeTree.gen.ts]
  modified: [admin/package.json, admin/tsconfig.json]
decisions:
  - id: "03-02-01"
    description: "Use anchor tags for sidebar nav links to future routes (not TanStack Link) to avoid type errors for unregistered routes"
    rationale: "TanStack Router enforces type-safe paths; routes like /movies don't exist yet and will be added in subsequent plans"
  - id: "03-02-02"
    description: "Use bundler moduleResolution in admin tsconfig (not NodeNext) for Vite compatibility"
    rationale: "Vite uses its own module resolution; NodeNext requires .js extensions which break JSX imports"
  - id: "03-02-03"
    description: "Manual route tree instead of TanStack Router codegen plugin"
    rationale: "Avoids extra dev dependency; route tree is small and manageable manually"
  - id: "03-02-04"
    description: "shadcn/ui sonner component used instead of deprecated toast component"
    rationale: "shadcn v4 deprecated the toast component in favor of sonner"
metrics:
  duration: "~10 min"
  completed: "2026-03-07"
---

# Phase 3 Plan 2: Admin Panel Shell Summary

React + Vite admin panel with shadcn/ui dark theme, TanStack Router auth guard, JWT login page, and sidebar navigation for all content types.

## What Was Built

### Task 1: Vite + React + shadcn/ui + TanStack Router initialization
- Created Vite config with React plugin, Tailwind v4 plugin, port 3001, and API proxy to localhost:5000
- Set up TypeScript with bundler resolution, JSX support, and @/ path alias
- Configured shadcn/ui with dark theme CSS variables (zinc palette, oklch colors)
- Installed 10 core shadcn components: button, input, label, card, badge, separator, dropdown-menu, dialog, sheet, sonner

### Task 2: Auth context, API client, login page, sidebar layout
- **API client** (`admin/src/api/client.ts`): Axios instance with request interceptor (adds Bearer token from localStorage) and response interceptor (clears token and redirects to /login on 401)
- **Auth API** (`admin/src/api/auth.ts`): Login function (POST /api/admin/login) and profile verification (GET /api/sessions)
- **Auth context** (`admin/src/hooks/useAuth.tsx`): AuthProvider with token lifecycle management -- validates stored token on mount, provides login/logout functions
- **Login page** (`admin/src/routes/login.tsx`): Email/password form with shadcn Card, error toasts via sonner, redirect to / on success
- **Auth guard** (`admin/src/routes/_authenticated.tsx`): Layout route that checks isAuthenticated, redirects unauthenticated users to /login, shows loading state during token validation
- **Sidebar** (`admin/src/components/layout/Sidebar.tsx`): Fixed 240px sidebar with navigation links (Dashboard, Movies, Series, Documentaries, TV Channels, Settings), active link highlighting, logout button
- **Header** (`admin/src/components/layout/Header.tsx`): Top bar with page title and user avatar initials
- **PageContainer** (`admin/src/components/layout/PageContainer.tsx`): Consistent page wrapper with header and padded content area
- **Route tree** (`admin/src/routeTree.gen.ts`): Manual route tree connecting root, login, and authenticated layout routes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn toast component deprecated in v4**
- **Found during:** Task 1
- **Issue:** `npx shadcn add toast` fails with "The toast component is deprecated. Use the sonner component instead."
- **Fix:** Replaced toast with sonner in the shadcn add command
- **Files modified:** admin/package.json (sonner dep added by shadcn)

**2. [Rule 3 - Blocking] TanStack Router type-safe Link rejects unregistered paths**
- **Found during:** Task 2
- **Issue:** Sidebar uses `<Link to="/movies">` etc. but those routes don't exist in the route tree yet, causing TS2322
- **Fix:** Changed from TanStack `<Link>` to plain `<a>` tags for sidebar navigation. Routes will be registered in subsequent plans (03-03 through 03-07) and can be converted to `<Link>` then.
- **Files modified:** admin/src/components/layout/Sidebar.tsx

## Verification

- `npx tsc --noEmit` -- compiles clean (0 errors)
- `npx vite build` -- builds successfully (428KB JS, 33KB CSS)
- Login page component exists with email/password form
- Sidebar has all 6 navigation links (Dashboard, Movies, Series, Documentaries, TV Channels, Settings)
- Auth context manages full JWT lifecycle (store, validate, clear)
- API client configured with auth interceptor targeting /api (proxied to localhost:5000)

## Next Phase Readiness

All subsequent admin plans (03-03 through 03-09) can build into this shell:
- New routes register in routeTree.gen.ts and nest under authenticatedRoute
- New pages use PageContainer for consistent layout
- API calls use the apiClient instance for automatic auth
- UI components from shadcn are available for forms, tables, dialogs

**No blockers identified.**
