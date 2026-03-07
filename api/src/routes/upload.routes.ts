import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  imageUpload,
  handleMulterError,
} from "../middleware/upload.middleware.js";
import { processImage } from "../services/upload.service.js";

export const uploadRouter = Router();

// All upload routes require admin authentication
uploadRouter.use(requireAuth, requireAdmin);

/**
 * POST /poster
 * Upload a poster image. Returns paths for all generated WebP size variants.
 */
uploadRouter.post(
  "/poster",
  imageUpload.single("image"),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({
        error: { message: "No image provided", code: "NO_IMAGE" },
      });
      return;
    }

    const paths = await processImage(req.file.buffer, "poster");
    res.status(201).json({ paths });
  },
);

/**
 * POST /backdrop
 * Upload a backdrop image. Returns paths for all generated WebP size variants.
 */
uploadRouter.post(
  "/backdrop",
  imageUpload.single("image"),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({
        error: { message: "No image provided", code: "NO_IMAGE" },
      });
      return;
    }

    const paths = await processImage(req.file.buffer, "backdrop");
    res.status(201).json({ paths });
  },
);

// Handle Multer-specific errors (file size, invalid type)
uploadRouter.use(handleMulterError);
