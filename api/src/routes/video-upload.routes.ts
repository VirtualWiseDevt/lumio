import { Router } from "express";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import path from "node:path";
import { unlink } from "node:fs/promises";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  generatePresignedUploadUrl,
  uploadToR2,
  headR2Object,
  streamR2ToFile,
  deleteFromR2,
} from "../services/r2.service.js";
import { env } from "../config/env.js";
import { enqueueTranscode } from "../jobs/transcode.job.js";

const ALLOWED_CONTENT_TYPES = [
  "video/mp4",
  "video/x-matroska",
  "video/quicktime",
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

const ALLOWED_CODECS = [
  "h264",
  "hevc",
  "vp9",
  "mpeg4",
  "prores",
  "dnxhd",
  "vp8",
  "av1",
];

const presignSchema = z.object({
  contentId: z.string().uuid(),
  episodeId: z.string().uuid().optional(),
  filename: z.string().min(1),
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE, "File size exceeds 5GB limit"),
});

const confirmSchema = z.object({
  contentId: z.string().uuid(),
  episodeId: z.string().uuid().optional(),
  key: z.string().min(1),
});

const videoUpload = multer({
  dest: "/tmp/video-uploads",
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if ((ALLOWED_CONTENT_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
  },
});

export const videoUploadRouter = Router();

videoUploadRouter.use(requireAuth, requireAdmin);

/**
 * POST /api/admin/video-upload/presign
 * Generate a presigned PUT URL for direct browser-to-R2 upload.
 */
videoUploadRouter.post("/presign", async (req, res) => {
  const parsed = presignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid request", details: parsed.error.flatten().fieldErrors } });
    return;
  }

  const { contentId, episodeId, filename, contentType, fileSize: _fileSize } = parsed.data;

  // Verify content exists
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) {
    res.status(404).json({ error: { message: "Content not found" } });
    return;
  }

  // Verify episode exists if episodeId provided
  if (episodeId) {
    const episode = await prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) {
      res.status(404).json({ error: { message: "Episode not found" } });
      return;
    }
  }

  // Generate R2 key
  const ext = filename.split(".").pop() || "mp4";
  const key = episodeId
    ? `videos/${contentId}/episodes/${episodeId}/raw/source.${ext}`
    : `videos/${contentId}/raw/source.${ext}`;

  const signedUrl = await generatePresignedUploadUrl(key, contentType);

  // Rewrite to public R2.dev URL so the browser can reach it without SSL issues
  const uploadUrl = env.R2_PUBLIC_URL
    ? signedUrl.replace(
        `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}`,
        `https://${env.R2_PUBLIC_URL}`,
      )
    : signedUrl;

  res.json({ uploadUrl, key });
});

/**
 * POST /api/admin/video-upload/upload
 * Proxy upload: accepts multipart file, streams to R2, validates with ffprobe.
 * Avoids browser-to-R2 SSL issues by keeping the R2 connection server-side.
 */
videoUploadRouter.post("/upload", videoUpload.single("video"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { message: "No video file provided" } });
    return;
  }

  const contentId = req.body.contentId;
  const episodeId = req.body.episodeId || undefined;

  if (!contentId || typeof contentId !== "string") {
    await unlink(req.file.path).catch(() => {});
    res.status(400).json({ error: { message: "contentId is required" } });
    return;
  }

  // Verify content exists
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) {
    await unlink(req.file.path).catch(() => {});
    res.status(404).json({ error: { message: "Content not found" } });
    return;
  }

  if (episodeId) {
    const episode = await prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) {
      await unlink(req.file.path).catch(() => {});
      res.status(404).json({ error: { message: "Episode not found" } });
      return;
    }
  }

  const ext = req.file.originalname.split(".").pop() || "mp4";
  const key = episodeId
    ? `videos/${contentId}/episodes/${episodeId}/raw/source.${ext}`
    : `videos/${contentId}/raw/source.${ext}`;

  try {
    // ffprobe validation on the temp file
    const probeResult = await runFfprobe(req.file.path);
    const videoStream = probeResult.streams?.find(
      (s: { codec_type?: string }) => s.codec_type === "video",
    );

    if (!videoStream || !ALLOWED_CODECS.includes(videoStream.codec_name)) {
      res.status(400).json({
        error: { message: "Invalid video file: no valid video stream detected" },
      });
      return;
    }

    // Stream file to R2
    const fileStream = createReadStream(req.file.path);
    await uploadToR2(key, fileStream, req.file.mimetype);

    // Update database
    if (episodeId) {
      await prisma.episode.update({
        where: { id: episodeId },
        data: { sourceVideoKey: key },
      });
    } else {
      await prisma.content.update({
        where: { id: contentId },
        data: { sourceVideoKey: key },
      });
    }

    // Enqueue transcode job
    const outputPrefix = episodeId
      ? `videos/${contentId}/episodes/${episodeId}/hls`
      : `videos/${contentId}/hls`;
    await enqueueTranscode({ contentId, episodeId, sourceKey: key, outputPrefix });

    res.json({ success: true, key });
  } finally {
    await unlink(req.file.path).catch(() => {});
  }
});

/**
 * POST /api/admin/video-upload/confirm
 * Download file from R2, validate with ffprobe, store sourceVideoKey.
 */
videoUploadRouter.post("/confirm", async (req, res) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid request", details: parsed.error.flatten().fieldErrors } });
    return;
  }

  const { contentId, episodeId, key } = parsed.data;

  // Verify file exists in R2
  const head = await headR2Object(key);
  if (!head) {
    res.status(400).json({ error: { message: "File not found in storage" } });
    return;
  }

  // ffprobe validation
  const tempPath = `/tmp/ffprobe-validate-${Date.now()}${path.extname(key)}`;

  try {
    // Download file from R2 to temp path
    await streamR2ToFile(key, tempPath);

    // Run ffprobe
    const probeResult = await runFfprobe(tempPath);

    // Find video stream
    const videoStream = probeResult.streams?.find(
      (s: { codec_type?: string }) => s.codec_type === "video",
    );

    if (!videoStream || !ALLOWED_CODECS.includes(videoStream.codec_name)) {
      // Invalid video - delete from R2
      await deleteFromR2(key);
      res.status(400).json({
        error: { message: "Invalid video file: no valid video stream detected" },
      });
      return;
    }

    // Valid video - update database
    if (episodeId) {
      await prisma.episode.update({
        where: { id: episodeId },
        data: { sourceVideoKey: key },
      });
    } else {
      await prisma.content.update({
        where: { id: contentId },
        data: { sourceVideoKey: key },
      });
    }

    // Enqueue transcode job
    const outputPrefix = episodeId
      ? `videos/${contentId}/episodes/${episodeId}/hls`
      : `videos/${contentId}/hls`;
    await enqueueTranscode({ contentId, episodeId, sourceKey: key, outputPrefix });

    res.json({ success: true, key });
  } finally {
    // Always clean up temp file
    await unlink(tempPath).catch(() => {});
  }
});

/**
 * Run ffprobe on a file and return parsed JSON output.
 */
function runFfprobe(
  filePath: string,
): Promise<{ streams?: Array<{ codec_type?: string; codec_name: string }> }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_streams",
      "-show_format",
      filePath,
    ]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`Failed to parse ffprobe output: ${stdout}`));
      }
    });

    proc.on("error", reject);
  });
}
