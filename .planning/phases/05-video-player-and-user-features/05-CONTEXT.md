# Phase 5 Context: Video Player and User Features

## 1. Player Controls & Behavior

### Player chrome
- Netflix-style overlay controls that auto-hide after 3 seconds of inactivity
- Reappear on mouse move, touch, or keyboard input
- Full-page route at `/watch/{id}` (not modal overlay)

### Video source handling
- Support both MP4 and HLS: if source URL ends in `.m3u8`, use hls.js; otherwise use native `<video>` element
- This allows content to work before Phase 6 (HLS pipeline) ships

### Autoplay behavior
- Auto-play next episode with 10-second countdown overlay
- Countdown shows next episode thumbnail, title, and cancel button
- If user doesn't cancel, next episode starts automatically

### Progress scrubber
- Simple red progress bar with time tooltip on hover
- No thumbnail previews on scrubber (too complex for v1)
- Red played portion, gray buffered portion, dark gray remaining

### Buffering UX
- Centered spinner on buffering
- After 5 seconds of continuous buffering, show "Slow connection" hint text below spinner

### No PiP
- Picture-in-Picture is out of scope for v1

### Mobile touch controls
- Tap zones: left third = rewind 10s, right third = skip 10s, center = play/pause
- Same overlay auto-hide behavior as desktop

### Keyboard shortcuts (from requirements)
- Space: play/pause
- Left/Right arrows: skip 10s back/forward
- F: toggle fullscreen
- M: toggle mute
- Esc: close player (navigate back)

## 2. Continue Watching & Progress Tracking

### Save frequency
- Save playback progress to server every 10 seconds
- Also save on pause and on page unload (visibilitychange + pagehide with sendBeacon -- more reliable than beforeunload on mobile, doesn't break bfcache)

### Continue Watching threshold (hybrid rule)
- Minimum watch time before appearing in Continue Watching: `max(120 seconds, 5% of total duration)`
- Cap: if watched past 90%, don't show (content is "finished")
- Progress is always saved silently from second 0 (in case user returns to same content)
- Content shorter than 2 minutes total never appears in Continue Watching

### Completion rule
- Content marked "completed" at 90% watched
- Removed from Continue Watching row at that point

### Series auto-advance
- Finishing an episode (90%+) auto-queues the next unwatched episode in Continue Watching
- If all episodes in a season are done, advance to first episode of next season
- If series is fully watched, remove from Continue Watching entirely

### Continue Watching row
- Shows on home page with red progress bars on each card
- Time filtering available: 3/6/12 months (from requirements)

## 3. My List (Watchlist + Favorites merged)

### Single list
- Watchlist and Favorites merged into one "My List" feature
- Single toggle: content is either in My List or not

### Access points
- Dedicated `/my-list` page accessible from navbar
- "My List" content row on home page
- Toggle button on content cards, detail modal, and player

### Interaction
- Plus icon (+) toggles to checkmark when in list
- Filled state = in My List, outline state = not in list
- No toast notification needed (icon state change is sufficient feedback)

### Auth assumption
- Every user browsing content is authenticated and subscribed (invite-only model)
- No anonymous/guest state handling needed for any user feature

## 4. Account Settings Page

### Layout
- Single scrollable page with distinct sections (not tabbed)
- Sections: Profile, Subscription, Devices, Preferences

### Profile section
- Shows user avatar placeholder (initials), email (read-only), display name (editable), phone (editable)
- Phone update is important for M-Pesa billing accuracy
- Email is fixed as identity -- cannot be changed

### Subscription section
- Shows current plan name, status (active/expired), days remaining
- "Manage Subscription" link navigates to /billing page
- No inline plan management -- billing page handles that (Phase 7)

### Device list section
- Shows all active sessions: device name, device type icon, IP address, last active time
- "Remove" button on each device except the current session
- Uses existing session management API from Phase 2

### Preferences section
- Newsletter toggle (on/off)
- Auto-renew toggle (on/off)
- These store preferences for Phase 7 (payments) and Phase 9 (notifications)

## Deferred Ideas

None captured during discussion.

---
*Created: 2026-03-07*
*Phase: 5 of 10*
*Requirements: PLAY-01, PLAY-02, PLAY-03, PLAY-04, USER-01, USER-02, USER-03, USER-04, USER-05*
