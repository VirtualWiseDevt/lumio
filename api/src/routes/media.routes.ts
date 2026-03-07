import { Router } from "express";
import { resolve, extname } from "node:path";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { UPLOAD_DIR } from "../config/upload.js";

export const mediaRouter = Router();

/** Map file extensions to MIME types for served media. */
const MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/**
 * GET /*
 * Serve uploaded media files from the uploads directory.
 * Public route -- no authentication required (images must be visible in UI).
 */
mediaRouter.get("/*", async (req, res) => {
  // Express 5 wildcard params are string arrays
  const params = req.params as Record<string, string | string[]>;
  const rawPath = params[0];
  const requestedPath = Array.isArray(rawPath)
    ? rawPath.join("/")
    : rawPath || "";

  if (!requestedPath) {
    res.status(400).json({
      error: { message: "No file path provided", code: "NO_PATH" },
    });
    return;
  }

  // Resolve the full filesystem path and verify it stays within UPLOAD_DIR
  const fullPath = resolve(UPLOAD_DIR, requestedPath);

  if (!fullPath.startsWith(UPLOAD_DIR)) {
    // Path traversal attempt
    res.status(404).json({
      error: { message: "File not found", code: "NOT_FOUND" },
    });
    return;
  }

  // Check file exists
  if (!existsSync(fullPath)) {
    res.status(404).json({
      error: { message: "File not found", code: "NOT_FOUND" },
    });
    return;
  }

  // Verify it is a file (not a directory)
  const fileStat = await stat(fullPath);
  if (!fileStat.isFile()) {
    res.status(404).json({
      error: { message: "File not found", code: "NOT_FOUND" },
    });
    return;
  }

  // Set content type
  const ext = extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  res.set("Content-Type", contentType);
  res.set("Content-Length", String(fileStat.size));
  res.set("Cache-Control", "public, max-age=86400"); // 1 day for dev

  // Stream the file
  const stream = createReadStream(fullPath);
  stream.pipe(res);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.status(500).json({
        error: { message: "Error reading file", code: "READ_ERROR" },
      });
    }
  });
});
