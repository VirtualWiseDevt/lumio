import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getUserProfile,
  updateUserProfile,
  updatePreferences,
  getUserSubscription,
} from "../services/user.service.js";
import {
  updateProfileSchema,
  updatePreferencesSchema,
} from "../validators/user.validators.js";

export const userRouter = Router();

userRouter.use(requireAuth);

/** GET /profile — Get user profile */
userRouter.get("/profile", async (req: Request, res: Response) => {
  const profile = await getUserProfile(req.user!.id);
  res.json(profile);
});

/** PATCH /profile — Update user profile (name and/or phone) */
userRouter.patch("/profile", async (req: Request, res: Response) => {
  const result = updateProfileSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: { message: result.error.issues[0].message } });
    return;
  }

  try {
    const profile = await updateUserProfile(req.user!.id, result.data);
    res.json(profile);
  } catch (error) {
    if ((error as Error & { statusCode?: number }).statusCode === 409) {
      res.status(409).json({ error: { message: (error as Error).message } });
      return;
    }
    throw error;
  }
});

/** PATCH /preferences — Update user preferences (newsletter) */
userRouter.patch("/preferences", async (req: Request, res: Response) => {
  const result = updatePreferencesSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: { message: result.error.issues[0].message } });
    return;
  }

  const preferences = await updatePreferences(req.user!.id, result.data);
  res.json(preferences);
});

/** GET /subscription — Get user subscription status */
userRouter.get("/subscription", async (req: Request, res: Response) => {
  const subscription = await getUserSubscription(req.user!.id);
  res.json(subscription);
});
