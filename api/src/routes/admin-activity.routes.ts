import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { activityQuerySchema } from "../validators/admin-activity.validators.js";
import { listActivityLogs } from "../services/activity-log.service.js";

export const adminActivityRouter = Router();

adminActivityRouter.use(requireAuth, requireAdmin);

// GET / -- list activity logs with filtering/pagination
adminActivityRouter.get("/", async (req, res) => {
  const result = activityQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const data = await listActivityLogs(result.data);
  res.json(data);
});
