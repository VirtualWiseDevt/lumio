# Phase 4: Client Browsing Experience - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can discover and explore the full content catalog through an immersive Netflix-style browsing interface. Includes home page with hero banner and content rows, content type pages (Movies, Series, Documentaries), hover popovers, detail modals, search overlay, and Live TV page. No video playback (Phase 5), no subscription gating (Phase 7).

Requirements: BRWS-01, BRWS-02, BRWS-03, BRWS-04, BRWS-05, BRWS-06, BRWS-07, BRWS-08, BRWS-09, BRWS-10, BRWS-11, BRWS-12.

</domain>

<decisions>
## Implementation Decisions

### Hero banner & home layout
- Auto-rotate hero banner on a timer (~8 seconds), cycling through 3-5 featured items with dot indicators
- Hero media: image-first, then crossfade to muted trailer. Sequence: (1) landscape backdrop loads instantly, (2) after ~1.5s if trailer URL exists, video loads in background, (3) once buffered, crossfade from image to muted video, (4) no trailer = static image stays
- Muted by default with unmute button in corner
- Video pauses when scrolled out of view (IntersectionObserver), pauses when hero rotates to next slide
- Graceful fallback: no trailer URL, embed fails, slow connection — all show static backdrop
- Admin-configured content rows on home page (admin can create/order custom rows like "Staff Picks", "Kenyan Originals")
- Content type pages (Movies, Series, Documentaries) each get their own hero banner (featured from that type) plus filtered content rows

### Content cards & hover popover
- Cards at rest show poster image + title (no other metadata)
- Hover popover after 500ms: full Netflix-style — enlarged card with backdrop image (no video preview for v1), action buttons (Play, Add to List, Like, Expand), genres, age rating
- Video preview clips in popover are deferred to v2 (CONT-01) — backdrop image only for now
- 6 cards visible at desktop, responsive breakpoints:
  - 1400px+: 6 cards
  - 1100-1399px: 5 cards
  - 800-1099px: 4 cards
  - 500-799px: 3 cards
  - Under 500px: 2 cards
- Cards fill available width equally with consistent gaps (8-12px)
- Left/right arrow buttons appear on row hover (hidden at rest)
- Arrow click scrolls by one "page" (number of visible cards) with smooth animation
- Snap to card boundaries — no half-cards visible
- First page hides left arrow, last page hides right arrow
- Touch devices: free swipe replaces arrow buttons

### Detail modal & series episodes
- Netflix-style scroll overlay — wide modal that overlays the page, dimmed background, URL changes to /title/{id}
- No match percentage — skip it for v1 (no recommendation engine)
- Series episodes: season dropdown to pick season, episodes listed below with number, thumbnail, title, duration, description
- "More Like This": 6 titles of same content type sharing the most categories with current title

### Search & Live TV
- Search overlay: full-screen overlay triggered by Ctrl+K or search icon, covers the page with search input at top, results below
- Search results grouped by type: Movies (N), Series (N), Documentaries (N), Channels (N) — with "See all" links per section
- Live TV page: channel cards in a grid organized by category headers (Sports, News, Entertainment, etc.)
- Channel cards: simple — channel logo, name, and pulsing LIVE badge only (no current program info for v1)

### Claude's Discretion
- Next.js 15 app setup and routing strategy
- Client-side state management approach
- Animation/transition library choice
- Exact spacing, typography, and color scheme (dark theme matching admin panel)
- Loading skeleton designs
- Empty state illustrations/messages
- Error state handling
- How admin-configured rows are stored and served (API design)
- Content row section naming strategy

</decisions>

<specifics>
## Specific Ideas

- Hero trailer sequence mirrors Netflix: image loads instantly (perceived performance), video crossfades in when buffered — users on slow connections see a beautiful backdrop, fast connections get the full experience
- Row scrolling snaps to card boundaries so you never end up with half-cards visible — page-based scrolling, not free-scroll
- Admin-configured rows mean the admin panel will need a way to create/order content rows (this may require a small API addition)

</specifics>

<deferred>
## Deferred Ideas

- Video preview clips in hover popovers — CONT-01 (v2)
- Data saver mode to disable hero trailers — A11Y-01 (v2)
- Current program info on Live TV channel cards — could be added when EPG data is available

</deferred>

---

*Phase: 04-client-browsing-experience*
*Context gathered: 2026-03-07*
