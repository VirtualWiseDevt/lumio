import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  userQuerySchema,
  createUserSchema,
  updateUserSchema,
} from "../validators/admin-user.validators.js";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listUserSessions,
  deleteUserSession,
  exportUsers,
} from "../services/admin-user.service.js";
import { logActivity } from "../services/activity-log.service.js";

export const adminUserRouter = Router();

adminUserRouter.use(requireAuth, requireAdmin);

// GET / -- list users with filtering/pagination
adminUserRouter.get("/", async (req, res) => {
  const result = userQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const data = await listUsers(result.data);
  res.json(data);
});

// GET /export -- export users as JSON array
adminUserRouter.get("/export", async (req, res) => {
  const result = userQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const { page: _page, limit: _limit, ...exportParams } = result.data;
  const data = await exportUsers(exportParams);
  res.json(data);
});

// GET /:userId -- get single user
adminUserRouter.get("/:userId", async (req, res) => {
  const { userId } = req.params as { userId: string };
  const user = await getUser(userId);
  if (!user) {
    res.status(404).json({
      error: { message: "User not found", code: "NOT_FOUND" },
    });
    return;
  }
  res.json(user);
});

// POST / -- create user
adminUserRouter.post("/", async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const user = await createUser(result.data);

  logActivity({
    userId: req.user!.id,
    action: "CREATE",
    entityType: "USER",
    entityId: user.id,
    ipAddress: req.ip,
  }).catch(() => {});

  res.status(201).json(user);
});

// PUT /:userId -- update user
adminUserRouter.put("/:userId", async (req, res) => {
  const { userId } = req.params as { userId: string };
  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const user = await updateUser(userId, result.data);

  logActivity({
    userId: req.user!.id,
    action: "UPDATE",
    entityType: "USER",
    entityId: userId,
    ipAddress: req.ip,
  }).catch(() => {});

  res.json(user);
});

// DELETE /:userId -- delete (soft) user
adminUserRouter.delete("/:userId", async (req, res) => {
  const { userId } = req.params as { userId: string };
  await deleteUser(userId);

  logActivity({
    userId: req.user!.id,
    action: "DELETE",
    entityType: "USER",
    entityId: userId,
    ipAddress: req.ip,
  }).catch(() => {});

  res.status(204).send();
});

// GET /:userId/sessions -- list user sessions
adminUserRouter.get("/:userId/sessions", async (req, res) => {
  const { userId } = req.params as { userId: string };
  const sessions = await listUserSessions(userId);
  res.json(sessions);
});

// DELETE /:userId/sessions/:sessionId -- revoke user session
adminUserRouter.delete("/:userId/sessions/:sessionId", async (req, res) => {
  const { userId, sessionId } = req.params as {
    userId: string;
    sessionId: string;
  };
  await deleteUserSession(userId, sessionId);
  res.status(204).send();
});
