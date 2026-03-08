import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  settingKeysSchema,
  updateSettingsSchema,
} from "../validators/admin-settings.validators.js";
import {
  getSettings,
  setSettings,
  testMpesaConnection,
} from "../services/settings.service.js";
import { logActivity } from "../services/activity-log.service.js";

export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAuth, requireAdmin);

// GET / -- get settings (optionally filtered by keys)
adminSettingsRouter.get("/", async (req, res) => {
  const result = settingKeysSchema.safeParse(req.query);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const settings = await getSettings(result.data.keys);
  res.json(settings);
});

// PUT / -- update settings
adminSettingsRouter.put("/", async (req, res) => {
  const result = updateSettingsSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  await setSettings(result.data.settings, req.user!.id);

  logActivity({
    userId: req.user!.id,
    action: "SETTINGS_CHANGE",
    entityType: "SETTINGS",
    details: { changedKeys: Object.keys(result.data.settings) },
    ipAddress: req.ip,
  }).catch(() => {});

  const updated = await getSettings(Object.keys(result.data.settings));
  res.json(updated);
});

// POST /mpesa/test -- test M-Pesa connection
adminSettingsRouter.post("/mpesa/test", async (_req, res) => {
  const result = await testMpesaConnection();
  res.json(result);
});
