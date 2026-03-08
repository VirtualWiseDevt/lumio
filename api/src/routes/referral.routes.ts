import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { referralCodeParamSchema } from "../validators/referral.validators.js";
import {
  validateReferralCode,
  getReferralStats,
} from "../services/referral.service.js";
import { prisma } from "../config/database.js";

export const referralRouter = Router();

/**
 * GET /api/referrals/validate/:code
 * Validate a referral code or admin invite code (public, no auth).
 */
referralRouter.get("/validate/:code", async (req: Request, res: Response) => {
  const { code } = referralCodeParamSchema.parse(req.params);

  // Check user referral codes first
  const result = await validateReferralCode(code);
  if (result.valid) {
    res.json(result);
    return;
  }

  // Check admin invite codes
  const adminCode = await prisma.adminInviteCode.findFirst({
    where: { code, isActive: true },
  });

  if (adminCode && adminCode.usedCount < adminCode.maxUses) {
    res.json({ valid: true, referrerName: "Lumio" });
    return;
  }

  res.status(404).json({ valid: false });
});

/**
 * GET /api/referrals/stats
 * Get referral statistics for the authenticated user.
 */
referralRouter.get("/stats", requireAuth, async (req: Request, res: Response) => {
  const stats = await getReferralStats(req.user!.id);
  res.json(stats);
});

/**
 * GET /api/referrals/my-code
 * Get the authenticated user's referral code and shareable URL.
 */
referralRouter.get("/my-code", requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    select: { referralCode: true },
  });

  res.json({
    referralCode: user.referralCode,
    referralUrl: `https://lumio.tv/?c=${user.referralCode}`,
  });
});
