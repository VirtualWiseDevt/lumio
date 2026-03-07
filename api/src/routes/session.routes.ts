import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getUserSessions,
  deleteSession,
} from "../services/session.service.js";

export const sessionRouter = Router();

// All session routes require authentication
sessionRouter.use(requireAuth);

// GET / (list sessions)
sessionRouter.get("/", async (req, res) => {
  const sessions = await getUserSessions(req.user!.id);
  const mapped = sessions.map((s) => ({
    id: s.id,
    deviceName: s.deviceName,
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
    isCurrent: s.id === req.sessionId,
  }));
  res.status(200).json({ sessions: mapped });
});

// DELETE /:id (terminate session)
sessionRouter.delete("/:id", async (req, res) => {
  if (req.params.id === req.sessionId) {
    res.status(400).json({
      error: {
        message: "Cannot remove current session. Use logout instead.",
        code: "CANNOT_REMOVE_CURRENT",
      },
    });
    return;
  }

  await deleteSession(req.params.id, req.user!.id);
  res.status(200).json({ message: "Session terminated" });
});
