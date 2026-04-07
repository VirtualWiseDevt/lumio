import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

/**
 * Base directory for uploaded files.
 * npm scripts run from the api/ workspace root, so process.cwd() is api/.
 */
export const UPLOAD_DIR = resolve(process.cwd(), "uploads");

/**
 * Image size presets for poster and backdrop types.
 */
export const IMAGE_SIZES = {
  poster: {
    large: { width: 800, suffix: "large" },
    medium: { width: 400, suffix: "medium" },
    thumbnail: { width: 200, suffix: "thumbnail" },
  },
  backdrop: {
    large: { width: 1920, suffix: "large" },
    medium: { width: 960, suffix: "medium" },
  },
  thumbnail: {
    large: { width: 1280, height: 720, suffix: "large" },
    medium: { width: 640, height: 360, suffix: "medium" },
  },
} as const;

/** MIME types accepted for image upload. */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Maximum file size in bytes (10 MB). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** WebP quality settings. */
export const WEBP_QUALITY = { original: 90, resized: 80 } as const;

/**
 * Create all required upload subdirectories if they do not already exist.
 */
export function ensureUploadDirs(): void {
  const dirs = [
    join(UPLOAD_DIR, "posters", "original"),
    join(UPLOAD_DIR, "posters", "large"),
    join(UPLOAD_DIR, "posters", "medium"),
    join(UPLOAD_DIR, "posters", "thumbnail"),
    join(UPLOAD_DIR, "backdrops", "original"),
    join(UPLOAD_DIR, "backdrops", "large"),
    join(UPLOAD_DIR, "backdrops", "medium"),
    join(UPLOAD_DIR, "thumbnails", "original"),
    join(UPLOAD_DIR, "thumbnails", "large"),
    join(UPLOAD_DIR, "thumbnails", "medium"),
  ];

  for (const dir of dirs) {
    mkdirSync(dir, { recursive: true });
  }
}
