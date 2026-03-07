# Phase 6: Video Infrastructure and HLS Delivery - Research

**Researched:** 2026-03-07
**Domain:** Video transcoding, HLS adaptive streaming, object storage (R2), job queues
**Confidence:** HIGH

## Summary

This phase covers the full pipeline from admin video upload through transcoding to HLS delivery. The core technologies are FFmpeg (invoked via `child_process.spawn`), BullMQ for job queue management with Redis, and Cloudflare R2 (S3-compatible) for object storage accessed through AWS SDK v3. The existing Express API already has content management with publish/unpublish endpoints, image upload infrastructure, and Docker-based development -- all of which serve as integration points.

The key architectural challenge is coordinating presigned URLs for both upload (admin browser direct-to-R2) and playback (rewriting m3u8 playlists with presigned segment URLs). FFmpeg must produce keyframe-aligned multi-bitrate HLS segments, which requires specific flags (`-g`, `-sc_threshold 0`, `-keyint_min`) to prevent scene-detection-based keyframe insertion that would misalign variants.

**Primary recommendation:** Use `child_process.spawn` to invoke FFmpeg directly (fluent-ffmpeg is archived), BullMQ with in-process worker for job management, and `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` for all R2 interactions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bullmq | ^5.x | Job queue for transcoding jobs | Redis-backed, TypeScript native, retry/backoff/events built in |
| @aws-sdk/client-s3 | ^3.x | R2 object storage (S3-compatible API) | Official Cloudflare-recommended SDK for R2 |
| @aws-sdk/s3-request-presigner | ^3.x | Generate presigned URLs for upload and playback | Required companion to client-s3 for presigned URL generation |
| ioredis | ^5.x | Redis client (BullMQ dependency) | BullMQ requires ioredis for Redis connection |
| FFmpeg | 6.x+ (system binary) | Video transcoding and HLS segmentation | Industry standard, no viable alternative |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | ^22.x | Already installed, includes child_process types | FFmpeg spawn calls |
| zod | ^3.24 | Already installed | Validate upload request payloads, stream request params |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| child_process.spawn for FFmpeg | fluent-ffmpeg | fluent-ffmpeg was **archived May 2025** -- do NOT use. Spawn is simple enough for the fixed command patterns needed here |
| BullMQ | Agenda, bee-queue | BullMQ has official video transcoder example, TypeScript-first, most active maintenance |
| AWS SDK v3 | AWS SDK v2 | v2 is deprecated, v3 is modular and tree-shakeable |

**Installation:**
```bash
npm install bullmq @aws-sdk/client-s3 @aws-sdk/s3-request-presigner ioredis
```

**Docker:** FFmpeg must be added to the API Docker container:
```dockerfile
FROM node:22-alpine
RUN apk add --no-cache ffmpeg
# ... rest of Dockerfile
```

**Redis:** Add Redis service to docker-compose.yml for BullMQ:
```yaml
redis:
  image: redis:7-alpine
  container_name: lumio-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

## Architecture Patterns

### Recommended Project Structure
```
api/src/
├── config/
│   ├── r2.ts              # S3Client configuration for R2
│   └── redis.ts           # Redis/IORedis connection config
├── jobs/
│   ├── sessionCleanup.job.ts  # (existing)
│   └── transcode.job.ts       # BullMQ queue + worker + processor
├── services/
│   ├── r2.service.ts          # Upload, download, presign, delete operations
│   ├── transcode.service.ts   # FFmpeg spawn logic, HLS generation
│   └── stream.service.ts      # Playlist rewriting with presigned segment URLs
├── routes/
│   ├── video-upload.routes.ts  # Presigned upload URL generation
│   └── stream.routes.ts        # GET /api/stream/:contentId
└── types/
    └── transcode.types.ts      # Job data interfaces
```

### Pattern 1: Presigned Upload Flow (Admin -> R2)
**What:** Admin browser uploads large video files directly to R2, bypassing the API server.
**When to use:** All video uploads (up to 5 GB).
**Flow:**
1. Admin UI calls `POST /api/admin/video-upload/presign` with contentId, filename, contentType
2. API generates presigned PUT URL for `videos/{contentId}/raw/source.{ext}` in R2
3. API returns presigned URL to browser
4. Browser uploads directly to R2 using `fetch(presignedUrl, { method: 'PUT', body: file })`
5. Browser calls `POST /api/admin/video-upload/confirm` to notify API upload is complete
6. API updates content/episode record with `videoUrl` pointing to raw source

```typescript
// Source: Cloudflare R2 docs - aws-sdk-js-v3 example
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Generate presigned upload URL
const command = new PutObjectCommand({
  Bucket: R2_BUCKET_NAME,
  Key: `videos/${contentId}/raw/source.mp4`,
  ContentType: "video/mp4",
});
const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
```

### Pattern 2: Transcoding Pipeline (Publish Trigger)
**What:** When admin publishes content, enqueue a BullMQ job that spawns FFmpeg to produce HLS variants.
**When to use:** Every publish action where a raw video source exists.
**Flow:**
1. `publishContent()` checks if raw video exists in R2
2. If yes, adds transcoding job to BullMQ queue
3. Worker downloads raw file from R2 to temp directory
4. FFmpeg spawns to produce 4 quality variants with aligned keyframes
5. Worker uploads all .ts segments and .m3u8 playlists to R2
6. Worker updates DB record with transcoding status = "ready"
7. Worker cleans up temp files

```typescript
// Source: BullMQ docs
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({ host: "redis", port: 6379, maxRetriesPerRequest: null });

const transcodeQueue = new Queue("transcode", { connection });

// Add job on publish
await transcodeQueue.add("transcode-video", {
  contentId,
  sourceKey: `videos/${contentId}/raw/source.mp4`,
}, {
  attempts: 2,  // 1 retry (2 total attempts)
  backoff: { type: "fixed", delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 200,
});

// Worker in same process
const worker = new Worker("transcode", async (job: Job) => {
  const { contentId, sourceKey } = job.data;
  // 1. Download from R2 to temp
  // 2. Run FFmpeg
  // 3. Upload outputs to R2
  // 4. Update DB status
  await job.updateProgress(50);
  return { contentId, status: "ready" };
}, {
  connection,
  concurrency: 1,  // One transcode at a time (CPU-intensive)
});

worker.on("completed", (job) => { /* update DB status */ });
worker.on("failed", (job, err) => { /* update DB with error */ });
worker.on("error", (err) => { console.error("Worker error:", err); });
```

### Pattern 3: FFmpeg Multi-Bitrate HLS with Keyframe Alignment
**What:** Single FFmpeg command producing 4 quality levels with aligned keyframes.
**When to use:** The core transcoding step.

```typescript
// Source: community best practices, verified against FFmpeg docs
import { spawn } from "node:child_process";

const PRESETS = [
  { name: "360p",  width: 640,  height: 360,  bitrate: "800k",  maxrate: "856k",  bufsize: "1200k", audioBitrate: "96k"  },
  { name: "480p",  width: 854,  height: 480,  bitrate: "1400k", maxrate: "1498k", bufsize: "2100k", audioBitrate: "128k" },
  { name: "720p",  width: 1280, height: 720,  bitrate: "2800k", maxrate: "2996k", bufsize: "4200k", audioBitrate: "128k" },
  { name: "1080p", width: 1920, height: 1080, bitrate: "5000k", maxrate: "5350k", bufsize: "7500k", audioBitrate: "192k" },
];

// GOP size: 48 frames at assumed 24fps = 2-second segments
// For 30fps content, use 60; key insight is segment duration * fps
const GOP_SIZE = 48;
const SEGMENT_DURATION = 4; // seconds per HLS segment

function buildFfmpegArgs(inputPath: string, outputDir: string): string[] {
  const args = ["-i", inputPath, "-preset", "medium", "-sc_threshold", "0"];

  for (const p of PRESETS) {
    args.push(
      "-vf", `scale=w=${p.width}:h=${p.height}:force_original_aspect_ratio=decrease`,
      "-c:v", "libx264",
      "-b:v", p.bitrate,
      "-maxrate", p.maxrate,
      "-bufsize", p.bufsize,
      "-g", String(GOP_SIZE),
      "-keyint_min", String(GOP_SIZE),
      "-c:a", "aac",
      "-b:a", p.audioBitrate,
      "-ac", "2",
      "-hls_time", String(SEGMENT_DURATION),
      "-hls_playlist_type", "vod",
      "-hls_flags", "independent_segments",
      "-hls_segment_type", "mpegts",
      "-hls_segment_filename", `${outputDir}/${p.name}/segment%03d.ts`,
      `${outputDir}/${p.name}/playlist.m3u8`
    );
  }

  return args;
}
```

**Important:** The above is a simplified example. In practice, FFmpeg with multiple outputs requires careful argument ordering. The recommended approach is to run FFmpeg separately per resolution (4 sequential or parallel runs) rather than one complex multi-output command, because:
- Easier error handling per resolution
- Simpler progress tracking
- Avoids complex filter_complex graphs

### Pattern 4: Playlist Rewriting for Presigned Playback
**What:** API reads m3u8 files from R2, rewrites segment URLs to presigned URLs.
**When to use:** Every `GET /api/stream/:contentId` request.

```typescript
// Read master.m3u8 from R2
// For each variant playlist reference, generate presigned URL
// Read each variant playlist, replace .ts segment references with presigned URLs
// Return rewritten master playlist to client

async function getPresignedPlaylist(contentId: string): Promise<string> {
  const masterKey = `videos/${contentId}/hls/master.m3u8`;
  const masterContent = await getObjectAsString(r2Client, masterKey);

  // Parse m3u8 and replace relative paths with presigned URLs
  const lines = masterContent.split("\n");
  const rewritten = await Promise.all(lines.map(async (line) => {
    if (line.endsWith(".m3u8")) {
      const key = `videos/${contentId}/hls/${line.trim()}`;
      return await getSignedUrl(r2Client, new GetObjectCommand({
        Bucket: R2_BUCKET_NAME, Key: key
      }), { expiresIn: 14400 }); // 4 hours
    }
    return line;
  }));

  return rewritten.join("\n");
}
```

**Critical detail:** The client (hls.js) will fetch variant playlists from the presigned URLs, which return raw m3u8 content from R2. Those variant playlists contain relative .ts segment paths. Since the presigned URL domain is `<account>.r2.cloudflarestorage.com`, the relative paths will resolve correctly only if segments are stored alongside the playlist. The API must ALSO rewrite variant playlists, or use a different approach:

**Recommended approach:** Have the API serve as a proxy for playlists only (not segments). The API endpoint returns the rewritten playlist content directly (not a redirect to R2). Segment URLs within the variant playlists are rewritten to presigned R2 URLs. This way hls.js fetches playlists from the API and segments directly from R2.

### Anti-Patterns to Avoid
- **Streaming video through the API server:** Never proxy .ts segment data through Express. Use presigned URLs so clients fetch segments directly from R2/CDN.
- **Single massive FFmpeg command with filter_complex:** Hard to debug, hard to track progress per resolution. Run separate FFmpeg processes per quality level.
- **Storing transcoding state only in BullMQ:** Always mirror job status to the database (Prisma). BullMQ job data is ephemeral; DB is the source of truth for UI status badges.
- **Using fluent-ffmpeg:** Archived May 2025. Use child_process.spawn directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job queue with retry/backoff | Custom retry loops with setTimeout | BullMQ | Race conditions, no persistence across restarts, no visibility |
| S3-compatible presigned URLs | Manual HMAC signature generation | @aws-sdk/s3-request-presigner | Signature algorithm is complex (SigV4), error-prone |
| HLS playlist parsing | Custom regex parser for m3u8 | Line-by-line string processing is fine here | m3u8 format is simple enough (line-based) that a full parser library is overkill, but do NOT regex-parse -- use line splitting |
| FFmpeg argument construction | Fluent API wrapper | Direct spawn with typed argument builders | fluent-ffmpeg is archived; argument arrays are explicit and debuggable |
| Video format validation | Custom binary header parsing | ffprobe (ships with FFmpeg) | Handles all container formats, codec detection |

**Key insight:** The complexity in this domain is in orchestration (job lifecycle, error handling, status tracking) rather than in any single operation. Each individual step is straightforward; the challenge is wiring them together reliably.

## Common Pitfalls

### Pitfall 1: Keyframe Misalignment Between Quality Variants
**What goes wrong:** Adaptive bitrate switching causes visual glitches, freezing, or buffering when switching between quality levels.
**Why it happens:** FFmpeg's scene detection inserts extra keyframes at scene changes. If different resolution encodes detect scenes at slightly different frames, keyframes don't align.
**How to avoid:** Always use `-sc_threshold 0` to disable scene detection, and set identical `-g` and `-keyint_min` values across all quality levels.
**Warning signs:** `ffprobe -show_frames -select_streams v -show_entries frame=pict_type,pts_time` shows keyframes at different timestamps across variants.

### Pitfall 2: Presigned URL Domain Mismatch with CDN
**What goes wrong:** Presigned URLs use `<account>.r2.cloudflarestorage.com` but CDN/custom domain cannot serve presigned URLs.
**Why it happens:** R2 presigned URLs only work with the S3 API domain, not custom domains.
**How to avoid:** Accept that presigned URLs go through `r2.cloudflarestorage.com`. Cloudflare CDN caching still applies for public content served through the custom domain, but for private/presigned access, traffic goes through the S3 API endpoint. For segments that should be cached at edge, consider making the bucket public for .ts files with a Cloudflare Transform Rule, or accept that presigned segment URLs bypass CDN caching.
**Warning signs:** 403 errors when accessing presigned URLs through a custom domain.

### Pitfall 3: Redis Connection Config for BullMQ
**What goes wrong:** BullMQ worker silently stops processing jobs.
**Why it happens:** IORedis default `maxRetriesPerRequest` is 20, which conflicts with BullMQ's blocking connection pattern.
**How to avoid:** Always set `maxRetriesPerRequest: null` on the IORedis connection used by BullMQ.
**Warning signs:** Worker connects but never picks up jobs, or throws `MaxRetriesPerRequestError`.

```typescript
// CORRECT
const connection = new IORedis({ maxRetriesPerRequest: null });
// WRONG - will cause silent failures
const connection = new IORedis(); // uses default maxRetriesPerRequest: 20
```

### Pitfall 4: Temp File Cleanup on Transcoding Failure
**What goes wrong:** Disk fills up with partially transcoded files after failed jobs.
**Why it happens:** FFmpeg crashes or is killed, leaving temp files. The job retry doesn't clean up the previous attempt's output.
**How to avoid:** Use a unique temp directory per job attempt. Wrap FFmpeg execution in try/finally that always removes the temp directory.
**Warning signs:** Disk usage grows steadily, Docker container runs out of space.

### Pitfall 5: Large File Upload to R2 (5 GB limit)
**What goes wrong:** Single PUT request fails for files over ~100 MB due to timeout or memory issues.
**Why it happens:** Browser fetch with large body can timeout; R2 has a 5 GB limit per PUT but network conditions may cause failures.
**How to avoid:** For v1 with 5 GB max, a single presigned PUT should work (R2 supports up to 5 GB per PUT). However, for reliability, consider implementing multipart upload for files > 100 MB in a future iteration. For v1, the single PUT approach is acceptable given the context decisions.
**Warning signs:** Upload failures for files > 500 MB on slow connections.

### Pitfall 6: FFmpeg Not Found in Container
**What goes wrong:** `spawn ENOENT` error when trying to run ffmpeg.
**Why it happens:** FFmpeg is not installed in the Docker image.
**How to avoid:** Add `RUN apk add --no-cache ffmpeg` to Dockerfile.dev. Verify with `ffmpeg -version` in container startup.
**Warning signs:** Error on first transcode attempt.

## Code Examples

### R2 Client Configuration
```typescript
// Source: Cloudflare R2 docs
// api/src/config/r2.ts
import { S3Client } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;
```

### Redis Connection for BullMQ
```typescript
// Source: BullMQ docs
// api/src/config/redis.ts
import IORedis from "ioredis";

export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null, // REQUIRED for BullMQ
});
```

### Transcode Job Queue and Worker
```typescript
// Source: BullMQ docs - queues, workers, retrying-failing-jobs
// api/src/jobs/transcode.job.ts
import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.js";

interface TranscodeJobData {
  contentId: string;
  entityType: "content" | "episode";
  entityId: string;
  sourceKey: string;
}

export const transcodeQueue = new Queue<TranscodeJobData>("transcode", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 10000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

export const transcodeWorker = new Worker<TranscodeJobData>(
  "transcode",
  async (job: Job<TranscodeJobData>) => {
    const { contentId, sourceKey, entityType, entityId } = job.data;

    // 1. Update DB: status = "processing"
    // 2. Download source from R2 to temp dir
    // 3. Run ffprobe to get source metadata (duration, resolution, fps)
    // 4. Run FFmpeg for each quality level
    // 5. Generate master.m3u8
    // 6. Upload all outputs to R2
    // 7. Update DB: status = "ready"
    // 8. Clean up temp files

    return { contentId, status: "ready" };
  },
  {
    connection: redisConnection,
    concurrency: 1, // CPU-intensive, one at a time
  }
);

// CRITICAL: Always attach error listener
transcodeWorker.on("error", (err) => {
  console.error("Transcode worker error:", err);
});
```

### FFmpeg Spawn with Progress Parsing
```typescript
// api/src/services/transcode.service.ts
import { spawn } from "node:child_process";

interface TranscodeResult {
  playlistPath: string;
  segmentCount: number;
}

export function runFfmpeg(
  args: string[],
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });

    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      // Parse progress from stderr: "time=00:01:23.45"
      const match = stderr.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (match && onProgress) {
        // Progress calculation requires knowing total duration (from ffprobe)
      }
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
    });

    proc.on("error", reject);
  });
}
```

### FFprobe Validation
```typescript
// Validate uploaded video before accepting
import { spawn } from "node:child_process";

interface ProbeResult {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}

export function ffprobe(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      filePath,
    ]);

    let stdout = "";
    proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error("ffprobe failed"));
      const data = JSON.parse(stdout);
      const videoStream = data.streams.find((s: any) => s.codec_type === "video");
      if (!videoStream) return reject(new Error("No video stream found"));

      const [num, den] = (videoStream.r_frame_rate || "24/1").split("/");
      resolve({
        duration: parseFloat(data.format.duration),
        width: videoStream.width,
        height: videoStream.height,
        fps: parseInt(num) / parseInt(den),
        codec: videoStream.codec_name,
      });
    });
    proc.on("error", reject);
  });
}
```

### Master Playlist Generation
```typescript
// Generate master.m3u8 after all variants are encoded
const VARIANT_INFO = [
  { name: "360p",  bandwidth: 900000,  resolution: "640x360",  codecs: "avc1.42e015,mp4a.40.2" },
  { name: "480p",  bandwidth: 1600000, resolution: "854x480",  codecs: "avc1.4d401f,mp4a.40.2" },
  { name: "720p",  bandwidth: 3200000, resolution: "1280x720", codecs: "avc1.4d401f,mp4a.40.2" },
  { name: "1080p", bandwidth: 5600000, resolution: "1920x1080",codecs: "avc1.640028,mp4a.40.2" },
];

export function generateMasterPlaylist(): string {
  let playlist = "#EXTM3U\n#EXT-X-VERSION:3\n";
  for (const v of VARIANT_INFO) {
    playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${v.bandwidth},RESOLUTION=${v.resolution},CODECS="${v.codecs}"\n`;
    playlist += `${v.name}/playlist.m3u8\n`;
  }
  return playlist;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| fluent-ffmpeg wrapper | Direct child_process.spawn | May 2025 (archived) | Must use spawn directly; no maintained Node.js FFmpeg wrapper exists |
| MPEG-TS segments (.ts) | fMP4 segments (.m4s) | 2024+ trend | fMP4 supports HEVC and DASH. For v1 with H.264-only, MPEG-TS is fine and has wider compatibility |
| AWS SDK v2 | AWS SDK v3 | 2023+ | v3 is modular, v2 deprecated. Use v3 exclusively |
| Bull (v3/v4) | BullMQ (v5) | 2022+ | BullMQ is the successor, TypeScript-first, better API |
| QueueScheduler required | Not needed in BullMQ v2+ | BullMQ 2.0 | Delayed jobs work without extra scheduler class |

**Deprecated/outdated:**
- **fluent-ffmpeg:** Archived May 2025, do not use
- **FFmpegKit:** Archived June 2025
- **AWS SDK v2 (@aws-sdk/...):** Use v3 modular packages
- **Bull (not BullMQ):** Legacy, use BullMQ instead

## Database Schema Additions

The Content and Episode models need transcoding status tracking. Recommended additions:

```prisma
// Add to Content model
transcodingStatus  String?   // "pending" | "processing" | "ready" | "failed"
transcodingError   String?   // Error message if failed
sourceVideoKey     String?   // R2 key for raw source: "videos/{id}/raw/source.mp4"
hlsKey             String?   // R2 key prefix for HLS: "videos/{id}/hls/"

// Add to Episode model
transcodingStatus  String?
transcodingError   String?
sourceVideoKey     String?
hlsKey             String?
```

## Environment Variables Required

```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=lumio-videos

# Redis (for BullMQ)
REDIS_HOST=redis
REDIS_PORT=6379
```

## Open Questions

1. **Segment Duration vs GOP Size Coupling**
   - What we know: GOP size should be `segment_duration * fps`. For 4-second segments at 24fps, GOP=96. At 30fps, GOP=120. Source content may have varying framerates.
   - What's unclear: Should we detect fps from source and calculate GOP dynamically, or use a fixed GOP (e.g., 48) and let HLS segment boundaries be approximate?
   - Recommendation: Use ffprobe to detect source fps, then calculate GOP = segment_duration * fps. This ensures clean segment boundaries.

2. **CDN Caching with Presigned URLs**
   - What we know: Presigned URLs include signature parameters that change per request. Cloudflare CDN would treat each as a unique URL, defeating caching.
   - What's unclear: Whether Cloudflare has special handling for R2 presigned URLs through the same account.
   - Recommendation: For v1, accept that presigned segment URLs are not CDN-cached. This is acceptable for initial scale. If caching becomes critical, explore making segments publicly readable with Cloudflare Access rules.

3. **Windows Development: FFmpeg Availability**
   - What we know: The dev environment is Windows 11 with Docker Desktop + WSL2. FFmpeg runs inside the Docker container (Alpine).
   - What's unclear: Whether local development outside Docker (e.g., `npm run dev` directly) needs FFmpeg on Windows.
   - Recommendation: All transcoding must happen inside Docker. Ensure docker-compose is the primary dev workflow for this phase. Add ffmpeg to the Docker container image.

## Sources

### Primary (HIGH confidence)
- [Cloudflare R2 - aws-sdk-js-v3 docs](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/) - S3Client configuration, presigned URLs
- [Cloudflare R2 - Presigned URLs docs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) - TTL limits (1s to 7 days), supported operations, domain restrictions
- [BullMQ official docs](https://docs.bullmq.io/) - Queue, Worker, retry configuration, events
- [BullMQ retrying-failing-jobs](https://docs.bullmq.io/guide/retrying-failing-jobs) - attempts, backoff strategies

### Secondary (MEDIUM confidence)
- [BullMQ video transcoder example](https://github.com/taskforcesh/bullmq-video-transcoder) - Official example of video transcoding with BullMQ flows
- [Mux FFmpeg HLS guide](https://www.mux.com/articles/how-to-convert-mp4-to-hls-format-with-ffmpeg-a-step-by-step-guide) - FFmpeg HLS command patterns
- [Peer5 multi-bitrate HLS guide](https://medium.com/@peer5/creating-a-production-ready-multi-bitrate-hls-vod-stream-dff1e2f1612c) - Keyframe alignment flags, bitrate recommendations
- [OTTVerse HLS packaging](https://ottverse.com/hls-packaging-using-ffmpeg-live-vod/) - FFmpeg HLS options reference

### Tertiary (LOW confidence)
- [fluent-ffmpeg archived status](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/1324) - Confirmed archived May 2025
- FFmpeg recommended bitrates - aggregated from multiple community sources, no single authoritative reference

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official documentation, versions confirmed
- Architecture: HIGH - Patterns verified against official docs for BullMQ, R2 SDK, and FFmpeg
- Pitfalls: HIGH - Keyframe alignment, Redis config, presigned URL domain issues all documented in official sources
- Code examples: MEDIUM - Based on official docs but adapted for this project's specific setup; may need adjustment during implementation

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days - stable domain, libraries have slow release cycles)
