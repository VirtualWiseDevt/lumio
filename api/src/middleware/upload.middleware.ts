import multer, { type MulterError } from "multer";
import type { Request, Response, NextFunction } from "express";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../config/upload.js";

/**
 * Multer instance configured with memory storage for Sharp processing.
 * Files are kept in memory as Buffers -- no disk writes until Sharp outputs.
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (
      (ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          file.fieldname,
        ),
      );
    }
  },
});

/**
 * Error-handling middleware for Multer errors.
 * Place after imageUpload middleware in the route chain.
 */
export function handleMulterError(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if ((err as MulterError).code === "LIMIT_FILE_SIZE") {
    res.status(413).json({
      error: {
        message: "File too large. Maximum size is 10 MB.",
        code: "FILE_TOO_LARGE",
      },
    });
    return;
  }

  if ((err as MulterError).code === "LIMIT_UNEXPECTED_FILE") {
    res.status(400).json({
      error: {
        message:
          "Invalid file type. Allowed types: JPEG, PNG, WebP.",
        code: "INVALID_FILE_TYPE",
      },
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({
      error: {
        message: err.message,
        code: "UPLOAD_ERROR",
      },
    });
    return;
  }

  next(err);
}
