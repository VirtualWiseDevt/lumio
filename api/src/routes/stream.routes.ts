import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireSubscription } from "../middleware/subscription.middleware.js";
import { prisma } from "../config/database.js";
import {
  getStreamPlaylist,
  getQualityPlaylist,
} from "../services/stream.service.js";
import { generatePresignedDownloadUrl } from "../services/r2.service.js";

export const streamRouter = Router();

/**
 * GET /api/stream/:contentId/preview
 * Public endpoint — redirects to a presigned URL for the 15-second preview clip.
 * No auth required since previews are short clips and <video> elements can't send headers.
 */
streamRouter.get("/:contentId/preview", async (req: Request, res: Response) => {
  const contentId = req.params.contentId as string;
  const content = await prisma.content.findUnique({
    where: { id: contentId, isPublished: true },
  });

  if (!content?.previewUrl) {
    res.status(404).json({ error: { message: "No preview available" } });
    return;
  }

  const url = await generatePresignedDownloadUrl(content.previewUrl);
  res.redirect(url);
});

// All routes below require authentication and active subscription
streamRouter.use(requireAuth, requireSubscription);

/**
 * GET /api/stream/:contentId
 * Returns the master HLS playlist with quality playlist paths rewritten to API URLs.
 */
streamRouter.get("/:contentId", async (req: Request, res: Response) => {
  const contentId = req.params.contentId as string;
  const episodeId = req.query.episode as string | undefined;

  // Determine which entity to check for hlsKey
  let hlsKey: string | null = null;

  if (episodeId) {
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
    });
    if (!episode) {
      res.status(404).json({ error: { message: "Episode not found" } });
      return;
    }
    hlsKey = episode.hlsKey;
  } else {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });
    if (!content) {
      res.status(404).json({ error: { message: "Content not found" } });
      return;
    }
    hlsKey = content.hlsKey;
  }

  if (!hlsKey) {
    res
      .status(404)
      .json({ error: { message: "Content not yet transcoded" } });
    return;
  }

  const playlist = await getStreamPlaylist(contentId, episodeId);

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.send(playlist);
});

/**
 * GET /api/stream/:contentId/:quality
 * Returns a quality-specific HLS playlist with .ts segments rewritten to presigned URLs.
 */
streamRouter.get(
  "/:contentId/:quality",
  async (req: Request, res: Response) => {
    const contentId = req.params.contentId as string;
    const quality = req.params.quality as string;
    const episodeId = req.query.episode as string | undefined;

    const playlist = await getQualityPlaylist(contentId, quality, episodeId);

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.send(playlist);
  },
);
