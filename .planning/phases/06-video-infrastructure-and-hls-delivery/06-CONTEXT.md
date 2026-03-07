# Phase 6: Video Infrastructure and HLS Delivery - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

## 1. Transcoding Pipeline

### Trigger
- Transcoding starts automatically when admin **publishes** content (not on upload)
- Draft content stays as raw source file — no transcoding cost until publish
- Re-publishing after re-upload triggers fresh transcoding

### Quality presets
- 4 levels: 360p, 480p, 720p, 1080p
- No 240p (modern devices handle 360p minimum)
- All variants must have aligned keyframes for smooth adaptive bitrate switching

### Job management
- BullMQ job queue running inside the Express API process (Redis-backed)
- Single-server deployment for v1 — no separate worker process
- On failure: auto-retry once, then mark as "failed" with error message
- Admin can re-trigger by re-uploading source file

## 2. Storage and Delivery

### R2 bucket structure
- Single bucket with path prefixes
- Pattern: `videos/{contentId}/raw/source.mp4`, `videos/{contentId}/hls/master.m3u8`, `videos/{contentId}/hls/360p/segment001.ts`, etc.

### Presigned URLs
- 4-hour TTL for presigned URLs (covers typical viewing session)
- Client calls `GET /api/stream/:contentId` → receives presigned URL for master.m3u8
- Segment URLs inside the playlist are also presigned by the API

### Raw source retention
- Keep raw source files in R2 permanently after transcoding
- Enables re-transcoding with different settings if needed in the future

### CDN caching
- `.ts` segments: cached as immutable (content never changes once produced)
- `.m3u8` playlists: short TTL (60s) — may update if content is re-transcoded
- Cloudflare CDN serves from African edge PoPs

## 3. Content Protection

### Encryption
- No AES-128 encryption for v1 — signed URLs only
- Presigned URLs with 4-hour expiry provide adequate access control

### Additional guards
- Cloudflare Referer check: only allow requests from lumio.tv domain
- Prevents hotlinking from other sites

### Access flow
- Client requests `GET /api/stream/:contentId` (authenticated)
- API validates JWT, generates presigned master playlist URL
- All segment URLs within playlist are also presigned
- No DRM (Widevine/FairPlay) — out of scope for v1

## 4. Admin Upload Experience

### Upload path
- Direct upload to R2 via presigned PUT URL
- API generates presigned upload URL → admin browser uploads directly to R2
- No API server bandwidth bottleneck for large video files

### Accepted formats
- MP4, MKV, MOV (common container formats)
- Maximum file size: 5 GB

### Validation
- Server-side ffprobe check on initial chunk before full upload
- Validates codec compatibility and format before committing to full upload

### Upload UI
- Video upload field on existing content edit form (movie/series/episode)
- Alongside existing poster/backdrop upload fields
- Individual upload per episode (no batch upload)

### Progress feedback
- Status badge on content card: Uploading → Processing → Ready (or Failed)
- No live percentage — simple state indicator
- Failed status shows error message, admin re-uploads to retry

### Re-transcode
- No dedicated re-transcode button
- Admin re-uploads new source file → triggers fresh transcoding on next publish

## Deferred Ideas

None captured during discussion.

---
*Phase: 06-video-infrastructure-and-hls-delivery*
*Context gathered: 2026-03-07*
