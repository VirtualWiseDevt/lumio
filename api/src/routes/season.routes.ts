import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  createSeasonSchema,
  updateSeasonSchema,
  createEpisodeSchema,
  updateEpisodeSchema,
} from "../validators/season.validators.js";
import {
  listSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
  listEpisodes,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  ServiceError,
} from "../services/season.service.js";
import { logActivity } from "../services/activity-log.service.js";

export const seasonRouter = Router({ mergeParams: true });

// All season/episode routes require admin
seasonRouter.use(requireAuth, requireAdmin);

function getParam(req: { params: Record<string, string> }, name: string): string {
  return req.params[name];
}

// ─── Season Routes ────────────────────────────────────────────────────────────

// GET / -- list seasons for content
seasonRouter.get("/", async (req, res) => {
  const seasons = await listSeasons(getParam(req, "contentId"));
  res.json(seasons);
});

// POST / -- create season
seasonRouter.post("/", async (req, res) => {
  const result = createSeasonSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  try {
    const season = await createSeason(getParam(req, "contentId"), result.data);
    logActivity({
      userId: req.user!.id,
      action: "CREATE",
      entityType: "SEASON",
      entityId: season.id,
      details: { seasonNumber: season.seasonNumber },
      ipAddress: req.ip || undefined,
    }).catch(() => {});
    res.status(201).json(season);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.status).json({
        error: { message: error.message, code: error.status === 409 ? "CONFLICT" : error.status === 400 ? "BAD_REQUEST" : "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});

// PUT /:seasonId -- update season
seasonRouter.put("/:seasonId", async (req, res) => {
  const result = updateSeasonSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  try {
    const season = await updateSeason(getParam(req, "seasonId"), result.data);
    logActivity({
      userId: req.user!.id,
      action: "UPDATE",
      entityType: "SEASON",
      entityId: season.id,
      details: { seasonNumber: season.seasonNumber },
      ipAddress: req.ip || undefined,
    }).catch(() => {});
    res.json(season);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.status).json({
        error: { message: error.message, code: error.status === 409 ? "CONFLICT" : "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});

// DELETE /:seasonId -- delete season
seasonRouter.delete("/:seasonId", async (req, res) => {
  try {
    await deleteSeason(getParam(req, "seasonId"));
    logActivity({
      userId: req.user!.id,
      action: "DELETE",
      entityType: "SEASON",
      entityId: getParam(req, "seasonId"),
      details: {},
      ipAddress: req.ip || undefined,
    }).catch(() => {});
    res.status(204).send();
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.status).json({
        error: { message: error.message, code: "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});

// ─── Episode Routes ───────────────────────────────────────────────────────────

// GET /:seasonId/episodes -- list episodes for season
seasonRouter.get("/:seasonId/episodes", async (req, res) => {
  const episodes = await listEpisodes(getParam(req, "seasonId"));
  res.json(episodes);
});

// POST /:seasonId/episodes -- create episode
seasonRouter.post("/:seasonId/episodes", async (req, res) => {
  const result = createEpisodeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  try {
    const episode = await createEpisode(getParam(req, "seasonId"), result.data);
    logActivity({
      userId: req.user!.id,
      action: "CREATE",
      entityType: "EPISODE",
      entityId: episode.id,
      details: { title: episode.title, episodeNumber: episode.episodeNumber },
      ipAddress: req.ip || undefined,
    }).catch(() => {});
    res.status(201).json(episode);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.status).json({
        error: { message: error.message, code: error.status === 409 ? "CONFLICT" : "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});

// PUT /:seasonId/episodes/:episodeId -- update episode
seasonRouter.put("/:seasonId/episodes/:episodeId", async (req, res) => {
  const result = updateEpisodeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  try {
    const episode = await updateEpisode(getParam(req, "episodeId"), result.data);
    logActivity({
      userId: req.user!.id,
      action: "UPDATE",
      entityType: "EPISODE",
      entityId: episode.id,
      details: { title: episode.title, episodeNumber: episode.episodeNumber },
      ipAddress: req.ip || undefined,
    }).catch(() => {});
    res.json(episode);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.status).json({
        error: { message: error.message, code: error.status === 409 ? "CONFLICT" : "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});

// DELETE /:seasonId/episodes/:episodeId -- delete episode
seasonRouter.delete("/:seasonId/episodes/:episodeId", async (req, res) => {
  try {
    await deleteEpisode(getParam(req, "episodeId"));
    logActivity({
      userId: req.user!.id,
      action: "DELETE",
      entityType: "EPISODE",
      entityId: getParam(req, "episodeId"),
      details: {},
      ipAddress: req.ip || undefined,
    }).catch(() => {});
    res.status(204).send();
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.status).json({
        error: { message: error.message, code: "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});
