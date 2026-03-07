import { Router, type Request, type Response } from "express";
import { prisma } from "../config/database.js";

export const planRouter = Router();

/**
 * GET /api/plans
 * List all active subscription plans (public -- no auth required).
 */
planRouter.get("/", async (_req: Request, res: Response) => {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  res.json({ plans });
});
