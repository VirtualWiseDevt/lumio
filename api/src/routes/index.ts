import type { Express } from "express";
import { healthRouter } from "./health.routes.js";

export { healthRouter };

/**
 * Register all application routes on the Express app.
 * Future routes are added here as the API grows.
 */
export function registerRoutes(app: Express): void {
  app.use("/health", healthRouter);

  // Future route registrations:
  // app.use("/api/auth", authRouter);
  // app.use("/api/users", userRouter);
  // app.use("/api/content", contentRouter);
  // app.use("/api/subscriptions", subscriptionRouter);
  // app.use("/api/payments", paymentRouter);
}
