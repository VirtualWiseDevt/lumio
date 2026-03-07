import type { Express } from "express";
import { healthRouter } from "./health.routes.js";
import { authRouter } from "./auth.routes.js";
import { sessionRouter } from "./session.routes.js";

export { healthRouter, authRouter, sessionRouter };

/**
 * Register all application routes on the Express app.
 */
export function registerRoutes(app: Express): void {
  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/sessions", sessionRouter);
}
