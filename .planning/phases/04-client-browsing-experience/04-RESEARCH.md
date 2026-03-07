# Phase 4: Client Browsing Experience - Research

**Researched:** 2026-03-07
**Domain:** Next.js 15 client app, Netflix-style browsing UI, content API integration
**Confidence:** HIGH

## Summary

This phase builds the public-facing client application as a Next.js 15 app with App Router, providing a Netflix-style browsing experience. The client needs public API endpoints (the existing content API is admin-only), a hero banner with auto-rotating slides and muted video crossfade, horizontal-scroll content rows with snap behavior, hover popovers, a detail modal using intercepting routes, full-screen search overlay, and a Live TV page.

The standard approach is Next.js 15.5.x (locked decision) with Tailwind CSS 4, Zustand for minimal client state, TanStack Query for server state/caching, Motion (formerly Framer Motion) for animations and transitions, and custom CSS scroll-snap for content rows (no carousel library needed given the specific Netflix-style requirements with snap-to-card behavior). The detail modal should use Next.js intercepting routes to support URL-based deep linking (`/title/{id}`).

**Primary recommendation:** Build a Next.js 15.5.x App Router client app with server components for initial data loading, TanStack Query for client-side caching, custom scroll-snap content rows, and intercepting routes for the detail modal.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.5.9 | React framework with App Router | Locked decision in STATE.md; latest 15.5.x patch with security fixes |
| react / react-dom | 19.x | UI rendering | Required by Next.js 15.5; React 19 is stable |
| tailwindcss | 4.x | Utility-first CSS | Matches admin panel; CSS-first config in v4 |
| @tailwindcss/postcss | 4.x | PostCSS integration for Next.js | Required for Tailwind v4 with Next.js |
| postcss | latest | CSS processing | Required by Tailwind v4 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.x | Server state management, caching | All API data fetching; matches admin panel |
| zustand | 5.x | Client-side state | Search overlay open/close, UI state, hero banner state |
| motion | 12.x | Animations and transitions | Hero crossfade, popover appear/disappear, modal transitions |
| axios | 1.x | HTTP client | API calls; matches admin panel pattern |
| clsx | 2.x | Conditional classnames | Already used in admin |
| tailwind-merge | 3.x | Merge Tailwind classes | Already used in admin |
| class-variance-authority | 0.7.x | Component variants | Already used in admin |
| lucide-react | latest | Icons | Already used in admin |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom scroll rows | Embla Carousel (8.6.0) | Embla is excellent but the Netflix-style requirements (snap-to-card, page-scroll arrows, responsive card count) are simpler to implement with CSS scroll-snap + a thin custom hook. Avoids library overhead for a specific UX. |
| Zustand | Jotai | Jotai is atomic; Zustand is simpler for the few global states needed (search open, hero index). Zustand wins for this scope. |
| Custom search overlay | cmdk | cmdk is for command palettes. Netflix search is a full-screen overlay with grouped results, not a command menu. Custom is more appropriate. |
| Motion | CSS transitions only | CSS handles simple opacity/transform. Motion needed for layout animations (popover), AnimatePresence (modal mount/unmount), and hero crossfade sequencing. |

**Installation:**
```bash
# In client workspace
npm install next@15.5.9 react@^19 react-dom@^19
npm install tailwindcss@^4 @tailwindcss/postcss postcss
npm install @tanstack/react-query@^5 zustand@^5 motion@^12 axios@^1
npm install clsx tailwind-merge class-variance-authority lucide-react
npm install -D typescript@^5.9 @types/react @types/react-dom
```

## Architecture Patterns

### Recommended Project Structure
```
client/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Home page (Server Component)
│   │   ├── globals.css           # Tailwind imports + dark theme vars
│   │   ├── movies/
│   │   │   └── page.tsx          # Movies browse page
│   │   ├── series/
│   │   │   └── page.tsx          # Series browse page
│   │   ├── documentaries/
│   │   │   └── page.tsx          # Documentaries browse page
│   │   ├── live-tv/
│   │   │   └── page.tsx          # Live TV page
│   │   ├── title/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Full detail page (direct navigation / SEO)
│   │   └── @modal/               # Parallel route slot for modal
│   │       ├── default.tsx       # Returns null (no modal by default)
│   │       └── (.)title/
│   │           └── [id]/
│   │               └── page.tsx  # Intercepted route renders modal
│   ├── components/
│   │   ├── ui/                   # Base UI components (can share from admin)
│   │   ├── hero/                 # HeroBanner, HeroSlide, HeroControls
│   │   ├── content/              # ContentRow, ContentCard, HoverPopover
│   │   ├── detail/               # DetailModal, EpisodeList, MoreLikeThis
│   │   ├── search/               # SearchOverlay, SearchResults
│   │   ├── live-tv/              # ChannelCard, ChannelGrid
│   │   └── layout/               # Navbar, Footer
│   ├── hooks/                    # Custom hooks
│   │   ├── use-content-row.ts    # Scroll position, arrow visibility
│   │   ├── use-hero-banner.ts    # Auto-rotation, video state
│   │   ├── use-hover-popover.ts  # Delay, positioning, cleanup
│   │   ├── use-search.ts         # Debounced search, keyboard shortcut
│   │   └── use-intersection.ts   # IntersectionObserver wrapper
│   ├── api/                      # API client functions
│   │   ├── client.ts             # Axios instance configured for API
│   │   ├── content.ts            # Public content endpoints
│   │   └── search.ts             # Search endpoint
│   ├── stores/                   # Zustand stores
│   │   └── ui.ts                 # Search overlay, hero state
│   ├── lib/                      # Utilities
│   │   └── utils.ts              # cn() helper, formatDuration, etc.
│   └── types/                    # Shared TypeScript types
│       └── content.ts            # Content, Season, Episode types
├── public/                       # Static assets
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS config for Tailwind v4
├── tailwind.config.ts            # Tailwind config (if needed beyond CSS)
├── tsconfig.json                 # TypeScript config (bundler resolution)
└── package.json
```

### Pattern 1: Intercepting Routes for Detail Modal
**What:** Next.js intercepting routes allow showing a modal overlay when navigating from within the app, while still supporting direct URL access as a full page.
**When to use:** Detail modal at `/title/{id}` -- clicking a card shows modal overlay; direct URL loads full page.
**Structure:**
```
app/
├── layout.tsx                    # Renders {children} and {modal}
├── @modal/
│   ├── default.tsx               # export default function() { return null; }
│   └── (.)title/
│       └── [id]/
│           └── page.tsx          # Renders <DetailModal /> overlay
└── title/
    └── [id]/
        └── page.tsx              # Full detail page for direct navigation
```
**Root layout:**
```tsx
// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <Navbar />
          {children}
          {modal}
        </Providers>
      </body>
    </html>
  );
}
```

### Pattern 2: Server Component Data Prefetching with TanStack Query
**What:** Use Server Components to prefetch data and hydrate the client-side TanStack Query cache.
**When to use:** Every browse page that loads content rows.
**Example:**
```tsx
// app/page.tsx (Server Component)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { fetchHomePageData } from '@/api/content';
import { HomePage } from '@/components/pages/HomePage';

export default async function Home() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['home', 'featured'],
    queryFn: () => fetchHomePageData(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  );
}
```

### Pattern 3: CSS Scroll-Snap Content Rows
**What:** Native CSS scroll-snap for Netflix-style horizontal scrolling with snap-to-card behavior.
**When to use:** All content rows on browse pages.
**Key CSS:**
```css
.content-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none; /* Firefox */
}
.content-row::-webkit-scrollbar { display: none; }
.content-card {
  scroll-snap-align: start;
  flex: 0 0 calc((100% - 5 * 8px) / 6); /* 6 cards at desktop */
}
```
**Arrow navigation hook:**
```tsx
function useContentRow(ref: React.RefObject<HTMLDivElement>) {
  const scrollByPage = (direction: 'left' | 'right') => {
    if (!ref.current) return;
    const containerWidth = ref.current.clientWidth;
    ref.current.scrollBy({
      left: direction === 'right' ? containerWidth : -containerWidth,
      behavior: 'smooth',
    });
  };
  // Track canScrollLeft / canScrollRight with scroll event listener
}
```

### Pattern 4: Hover Popover with Delay
**What:** 500ms delay before showing enlarged card popover; cancel on mouse leave.
**When to use:** Content cards on all browse pages.
**Key considerations:**
- Use `setTimeout` with cleanup on mouse leave
- Popover must stay open when mouse moves from card to popover
- Position relative to card but aware of viewport edges (flip at row edges)
- Use Motion's `AnimatePresence` for enter/exit animations
```tsx
function useHoverPopover(delay = 500) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const onMouseEnter = (id: string) => {
    timeoutRef.current = setTimeout(() => setActiveId(id), delay);
  };

  const onMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setActiveId(null);
  };

  return { activeId, onMouseEnter, onMouseLeave };
}
```

### Pattern 5: Hero Banner with Video Crossfade
**What:** Auto-rotating hero with image-first loading, then crossfade to muted video.
**State machine:**
```
IDLE -> IMAGE_LOADED -> VIDEO_BUFFERING -> VIDEO_PLAYING -> (rotate) -> IDLE
```
**Key implementation:**
- `<video>` element hidden behind `<img>`, opacity transition for crossfade
- `IntersectionObserver` to pause video when hero scrolls out of view
- Auto-rotation timer (8s) resets when user interacts
- `video.play()` returns a Promise -- handle rejection gracefully (browser blocks autoplay)

### Anti-Patterns to Avoid
- **Fetching data in client components without prefetching:** Server Components should prefetch to avoid loading spinners on initial render. Client components use TanStack Query with already-hydrated cache.
- **Using `useEffect` for data fetching:** Use TanStack Query hooks (useQuery) instead. Manual useEffect fetching leads to race conditions, no caching, and duplicate requests.
- **Storing server data in Zustand:** Server data belongs in TanStack Query cache. Zustand is only for pure UI state (search open, hero index).
- **Heavy JS in Server Components:** Keep heavy client-side logic (IntersectionObserver, scroll handlers, hover state, video playback) in Client Components with `"use client"` directive.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server state caching | Custom fetch + useState | TanStack Query | Handles caching, deduplication, background refresh, error retry |
| Animation enter/exit | Manual CSS class toggling | Motion AnimatePresence | Handles unmount animations, layout shifts, gesture integration |
| Image optimization | Manual `<img>` tags | Next.js `<Image>` component | Auto-optimization, lazy loading, blur placeholder, responsive sizing |
| Responsive breakpoints | Manual window.matchMedia | Tailwind responsive classes | Standard approach, SSR-safe, consistent with project |
| Keyboard shortcuts | Raw addEventListener | Custom hook with cleanup | Ensures cleanup, prevents memory leaks, handles focus trapping |
| Debounced search | Manual setTimeout | use-debounce or custom hook | Edge cases with cleanup, stale closure avoidance |
| Route-based modals | Custom portal + history manipulation | Next.js intercepting routes | Built-in support for URL preservation, back button, SSR |

**Key insight:** The Netflix-style UI has many interactive pieces (hover delays, scroll snapping, video playback, auto-rotation) that each seem simple but accumulate complexity. Use established patterns (CSS scroll-snap, IntersectionObserver, TanStack Query) rather than building from scratch.

## Common Pitfalls

### Pitfall 1: Video Autoplay Blocked by Browser
**What goes wrong:** `video.play()` throws a DOMException if browser policy blocks autoplay.
**Why it happens:** All modern browsers block autoplay with sound. Some block autoplay entirely on first visit.
**How to avoid:** Always set `muted` and `playsInline` attributes. Wrap `video.play()` in try/catch. Fall back to static backdrop image on failure.
**Warning signs:** Unhandled promise rejection errors in console.

### Pitfall 2: Hover Popover Flicker
**What goes wrong:** Popover rapidly appears/disappears when mouse moves between card and popover.
**Why it happens:** Mouse leave fires on card before mouse enter fires on popover.
**How to avoid:** Use a shared hover zone -- popover should be a sibling or child of the card wrapper, not a portal. Or use a small delay (50-100ms) before closing.
**Warning signs:** Users complain popover is "jumpy" or "impossible to click."

### Pitfall 3: Content Row Scroll Position Reset on Re-render
**What goes wrong:** Scrolling a content row, then a parent re-render resets scroll to 0.
**Why it happens:** React re-renders the container, creating a new DOM element.
**How to avoid:** Use `key` prop on rows that stays stable. Avoid re-mounting row containers. Keep row state in a ref, not derived from props.
**Warning signs:** Rows jump back to start after any state change.

### Pitfall 4: Intercepting Routes Not Working with Dynamic Segments
**What goes wrong:** Modal doesn't show when clicking a card; navigates to full page instead.
**Why it happens:** Incorrect folder structure for intercepting routes. The `(.)` prefix intercepts one level up; `(..)` intercepts two levels up.
**How to avoid:** Test intercepting route structure carefully. For root-level interception from any page, use `(.)title/[id]` if in same directory level, or `(..)title/[id]` for one level up.
**Warning signs:** URL changes but modal doesn't render; full page loads instead.

### Pitfall 5: Hydration Mismatch with Client-Only Features
**What goes wrong:** React throws hydration errors for components using window, IntersectionObserver, or matchMedia.
**Why it happens:** Server-rendered HTML doesn't match client render.
**How to avoid:** Mark interactive components with `"use client"`. Use `useEffect` for browser-only APIs. Consider `dynamic(() => import('./Component'), { ssr: false })` for heavy client components.
**Warning signs:** Console warnings about hydration mismatch.

### Pitfall 6: Missing Public API Endpoints
**What goes wrong:** Client app has no endpoints to fetch public content -- all existing content routes are admin-only.
**Why it happens:** Phase 3 only built admin content management.
**How to avoid:** This phase MUST create public API routes at `/api/content` (or `/api/browse`) that serve only published content without requiring auth. These are separate from the admin routes.
**Warning signs:** 401/403 errors from the client app.

### Pitfall 7: N+1 Query Problem for Content Rows
**What goes wrong:** Home page loads 6+ content rows, each making a separate API call.
**Why it happens:** Each row fetches independently without batching.
**How to avoid:** Design a single `/api/browse/home` endpoint that returns all rows for the home page in one response. Each row includes its title and content array. This is the Netflix pattern -- one API call per page, not per row.
**Warning signs:** Waterfall of 6+ network requests on page load.

## Code Examples

### Next.js Client tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["src", "next-env.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next"]
}
```

### TanStack Query Provider Setup
```tsx
// src/components/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### API Client for Public Endpoints
```tsx
// src/api/client.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});
```

### Responsive Content Card CSS (Tailwind)
```css
/* Card widths by breakpoint */
/* <500px: 2 cards, 500-799px: 3, 800-1099px: 4, 1100-1399px: 5, 1400+: 6 */
.content-card {
  @apply flex-shrink-0 snap-start;
  width: calc((100% - 8px) / 2); /* default: 2 cards */
}
@media (min-width: 500px) {
  .content-card { width: calc((100% - 2 * 8px) / 3); }
}
@media (min-width: 800px) {
  .content-card { width: calc((100% - 3 * 8px) / 4); }
}
@media (min-width: 1100px) {
  .content-card { width: calc((100% - 4 * 8px) / 5); }
}
@media (min-width: 1400px) {
  .content-card { width: calc((100% - 5 * 8px) / 6); }
}
```

### Hero Video Crossfade Pattern
```tsx
"use client";

import { useEffect, useRef, useState } from "react";

type HeroPhase = "image" | "buffering" | "video";

function useHeroVideo(trailerUrl: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<HeroPhase>("image");

  useEffect(() => {
    if (!trailerUrl || !videoRef.current) return;

    const video = videoRef.current;
    const timer = setTimeout(() => {
      video.src = trailerUrl;
      video.load();
      setPhase("buffering");

      const onCanPlay = () => {
        video.play()
          .then(() => setPhase("video"))
          .catch(() => setPhase("image")); // Autoplay blocked
      };
      video.addEventListener("canplay", onCanPlay, { once: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [trailerUrl]);

  return { videoRef, phase };
}
```

### IntersectionObserver Hook
```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function useIntersection(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.5, ...options }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
```

### Search Overlay with Keyboard Shortcut
```tsx
"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui";

export function useSearchShortcut() {
  const { openSearch } = useUIStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openSearch]);
}
```

### "More Like This" Query (Category Matching)
```sql
-- Find 6 titles of same type sharing the most categories
-- This should be a Prisma raw query or application-level logic
SELECT c.*,
  (SELECT COUNT(*) FROM unnest(c.categories) cat
   WHERE cat = ANY($categories)) as shared_count
FROM "Content" c
WHERE c.type = $type
  AND c.id != $currentId
  AND c."isPublished" = true
ORDER BY shared_count DESC
LIMIT 6;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| framer-motion package | motion package (import from "motion/react") | 2024 | Same API, new package name. Install `motion`, not `framer-motion` |
| Pages Router | App Router | Next.js 13+ | Server Components, intercepting routes, parallel routes |
| getServerSideProps | Server Components + TanStack Query prefetch | Next.js 13+ | No more data fetching at page level only |
| Tailwind config (JS) | Tailwind CSS-first config (@theme directive) | Tailwind v4 | Simpler setup, no tailwind.config.js needed |
| React.memo / useMemo | React Compiler (experimental in Next.js 15) | 2024 | Automatic memoization; can enable but optional |
| Custom carousel libraries | CSS scroll-snap + thin wrapper | 2023+ | Native browser support, no JS for basic scrolling |

**Deprecated/outdated:**
- `framer-motion` package: Renamed to `motion`. Import from `"motion/react"` not `"framer-motion"`.
- `getServerSideProps` / `getStaticProps`: Replaced by Server Components in App Router.
- Tailwind `tailwind.config.js`: Still works but Tailwind v4 prefers CSS-first configuration with `@theme`.
- `next/router`: Replaced by `next/navigation` in App Router (useRouter, usePathname, useSearchParams).

## Public API Design

The client needs new public API endpoints separate from admin routes. These should be added to the Express API.

### Required Public Endpoints

| Endpoint | Method | Purpose | Response Shape |
|----------|--------|---------|---------------|
| `/api/browse/home` | GET | Home page data | `{ featured: Content[], rows: { title: string, items: Content[] }[] }` |
| `/api/browse/movies` | GET | Movies page | `{ featured: Content[], rows: { title: string, items: Content[] }[] }` |
| `/api/browse/series` | GET | Series page | Same as above, filtered to SERIES |
| `/api/browse/documentaries` | GET | Documentaries page | Same as above, filtered to DOCUMENTARY |
| `/api/browse/live-tv` | GET | Live TV page | `{ categories: { name: string, channels: Content[] }[] }` |
| `/api/browse/title/:id` | GET | Single title detail | `Content` with seasons/episodes if SERIES |
| `/api/browse/title/:id/similar` | GET | More Like This | `Content[]` (6 items) |
| `/api/browse/search` | GET | Search | `{ movies: Content[], series: Content[], documentaries: Content[] }` |

### Key Design Decisions for API
- All browse endpoints return only `isPublished: true` content
- No auth required for browsing (subscription gating is Phase 7)
- Featured content uses `isFeatured: true` flag from Content model
- Admin-configured content rows need a new model or configuration system (see Open Questions)
- Search uses `title ILIKE '%query%'` across all content types
- Images returned as relative paths; client prepends API base URL + `/api/media/`

## Open Questions

1. **Admin-configured content rows storage**
   - What we know: CONTEXT says "admin can create/order custom rows like Staff Picks, Kenyan Originals"
   - What's unclear: There's no ContentRow model in the Prisma schema. Options: (a) create a new ContentRow model with title + ordered content IDs, (b) use categories as rows + hardcode "Trending" etc., (c) simple JSON config
   - Recommendation: Create a lightweight `ContentRow` model: `{ id, title, slug, position, contentIds: String[] }`. Admin manages these rows; public API returns them in order. This can be a simple model or even a JSON field on a Settings model. Keep it minimal -- a `BrowseRow` table with `title`, `position`, and a many-to-many with Content.

2. **Next.js proxy to Express API in development**
   - What we know: Admin uses Vite proxy (`/api/*` -> localhost:5000). Next.js has `rewrites` in next.config.
   - What's unclear: Exact config syntax for Next.js 15.5
   - Recommendation: Use `next.config.ts` rewrites to proxy `/api/:path*` to `http://localhost:5000/api/:path*` in development. In production, reverse proxy (nginx) handles this.

3. **Sharing UI components between admin and client**
   - What we know: Both use React 19, Tailwind 4, similar patterns. Admin has shadcn components.
   - What's unclear: Whether to create a shared package or duplicate
   - Recommendation: Don't share. Admin and client have different UX needs. Client components are Netflix-dark, admin is dashboard-style. Copy the `cn()` utility and Tailwind config approach, but build client-specific components. May selectively copy shadcn components needed (Dialog for modal base).

4. **Content row "Trending" / "Continue Watching" logic**
   - What we know: "Continue Watching" requires auth + watch progress (Phase 5+). "Trending" needs view tracking.
   - What's unclear: How to populate rows without playback data
   - Recommendation: For Phase 4, use admin-configured rows only. "Trending" can be most recently published or most-added-to-watchlists. "Continue Watching" is deferred to Phase 5+ when video playback exists.

## Sources

### Primary (HIGH confidence)
- Next.js official docs (nextjs.org/docs/app) - App Router, intercepting routes, parallel routes, video guides
- Next.js 15.5.9 - latest 15.5.x patch confirmed via npm and security advisory
- Tailwind CSS v4 setup guide (tailwindcss.com/docs/guides/nextjs)

### Secondary (MEDIUM confidence)
- Motion (motion.dev) - confirmed as the successor to framer-motion, v12.35.0 latest
- Zustand v5.0.11 - confirmed via npm, hook-based API, no Provider needed
- TanStack Query v5 with Next.js App Router - confirmed via official docs and multiple guides
- Embla Carousel v8.6.0 - confirmed as popular option but custom CSS scroll-snap preferred

### Tertiary (LOW confidence)
- React Compiler integration with Next.js 15 -- experimental, mentioned in search results but not verified with official Next.js 15.5 docs
- Exact `BrowseRow` model design -- no established pattern; recommendation is based on project requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via npm/official docs, versions confirmed
- Architecture: HIGH - Next.js intercepting routes well-documented, TanStack Query + Next.js pattern established
- Pitfalls: HIGH - Based on well-known issues with video autoplay, hydration, hover state
- Public API design: MEDIUM - Logical design based on schema analysis, but no existing pattern in codebase to follow
- Content row storage: LOW - Requires new schema design; recommendation is reasonable but unverified

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days; Next.js 15.5.x is stable, no fast-moving changes expected)
