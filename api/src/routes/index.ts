import type { Express } from "express";
import { healthRouter } from "./health.routes.js";
import { authRouter } from "./auth.routes.js";
import { sessionRouter } from "./session.routes.js";
import { adminRouter } from "./admin.routes.js";
import { contentRouter } from "./content.routes.js";
import { categoryRouter } from "./category.routes.js";

export {
  healthRouter,
  authRouter,
  sessionRouter,
  adminRouter,
  contentRouter,
  categoryRouter,
};

/**
 * Register all application routes on the Express app.
 */
export function registerRoutes(app: Express): void {
  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/sessions", sessionRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/admin/content", contentRouter);
  app.use("/api/admin/categories", categoryRouter);
}
