import { Router } from "express";
import { prisma } from "../config/database.js";

export const healthRouter = Router();

/**
 * GET /health
 * Returns API health status with database connectivity info.
 * Express 5: No asyncHandler needed -- promise rejections are automatically caught.
 */
healthRouter.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime(),
    });
  } catch {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});
