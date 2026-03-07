import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  saveProgress,
  getProgress,
  getContinueWatching,
} from "../services/progress.service.js";
import {
  saveProgressSchema,
  continueWatchingQuerySchema,
} from "../validators/progress.validators.js";

export const progressRouter = Router();

// All routes require authentication
progressRouter.use(requireAuth);

// GET /continue-watching - Continue watching list
// IMPORTANT: Must be registered BEFORE /:contentId to avoid matching as a param
progressRouter.get(
  "/continue-watching",
  async (req: Request, res: Response) => {
    const parsed = continueWatchingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    const items = await getContinueWatching(req.user!.id, parsed.data.months);
    res.json(items);
  },
);

// POST / - Save playback progress (also handles sendBeacon requests)
progressRouter.post("/", async (req: Request, res: Response) => {
  const parsed = saveProgressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  await saveProgress(req.user!.id, {
    contentId: parsed.data.contentId,
    episodeId: parsed.data.episodeId ?? null,
    timestamp: parsed.data.timestamp,
    duration: parsed.data.duration,
  });

  res.json({ success: true });
});

// GET /:contentId - Get progress for specific content
progressRouter.get("/:contentId", async (req: Request, res: Response) => {
  const contentId = req.params.contentId as string;
  const episodeId = req.query.episodeId as string | undefined;

  const progress = await getProgress(req.user!.id, contentId, episodeId);
  res.json(progress);
});
