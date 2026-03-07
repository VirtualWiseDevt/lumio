import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";

/**
 * Middleware that requires an active subscription.
 * Must be used AFTER requireAuth (needs req.user).
 *
 * Returns 403 with SUBSCRIPTION_REQUIRED code if the user
 * does not have an active, non-expired subscription.
 */
export async function requireSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      error: { message: "Authentication required", code: "AUTH_REQUIRED" },
    });
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
  });

  if (!subscription) {
    res.status(403).json({
      error: {
        message: "Active subscription required",
        code: "SUBSCRIPTION_REQUIRED",
      },
    });
    return;
  }

  next();
}
