import type { Express } from "express";
import { healthRouter } from "./health.routes.js";
import { authRouter } from "./auth.routes.js";
import { sessionRouter } from "./session.routes.js";
import { adminRouter } from "./admin.routes.js";
import { contentRouter } from "./content.routes.js";
import { categoryRouter } from "./category.routes.js";
import { uploadRouter } from "./upload.routes.js";
import { mediaRouter } from "./media.routes.js";
import { seasonRouter } from "./season.routes.js";
import { browseRouter } from "./browse.routes.js";
import { progressRouter } from "./progress.routes.js";
import { myListRouter } from "./mylist.routes.js";
import { userRouter } from "./user.routes.js";
import { videoUploadRouter } from "./video-upload.routes.js";
import { streamRouter } from "./stream.routes.js";

export {
  healthRouter,
  authRouter,
  sessionRouter,
  adminRouter,
  contentRouter,
  categoryRouter,
  uploadRouter,
  mediaRouter,
  seasonRouter,
  browseRouter,
  progressRouter,
  myListRouter,
  userRouter,
  videoUploadRouter,
  streamRouter,
};

/**
 * Register all application routes on the Express app.
 */
export function registerRoutes(app: Express): void {
  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/sessions", sessionRouter);
  app.use("/api/browse", browseRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/admin/content", contentRouter);
  app.use("/api/admin/categories", categoryRouter);
  app.use("/api/admin/upload", uploadRouter);
  app.use("/api/media", mediaRouter);
  app.use("/api/admin/content/:contentId/seasons", seasonRouter);
  app.use("/api/my-list", myListRouter);
  app.use("/api/user", userRouter);
  app.use("/api/admin/video-upload", videoUploadRouter);
  app.use("/api/stream", streamRouter);
}
