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
import { planRouter } from "./plan.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { mpesaCallbackRouter } from "./mpesa-callback.routes.js";
import { adminInviteRouter } from "./admin-invite.routes.js";
import { referralRouter } from "./referral.routes.js";
import { couponRouter } from "./coupon.routes.js";
import { adminDashboardRouter } from "./admin-dashboard.routes.js";
import { adminUserRouter } from "./admin-user.routes.js";
import { adminBillingRouter } from "./admin-billing.routes.js";
import { adminSettingsRouter } from "./admin-settings.routes.js";
import { adminActivityRouter } from "./admin-activity.routes.js";

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
  planRouter,
  paymentRouter,
  mpesaCallbackRouter,
  adminInviteRouter,
  referralRouter,
  couponRouter,
  adminDashboardRouter,
  adminUserRouter,
  adminBillingRouter,
  adminSettingsRouter,
  adminActivityRouter,
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
  app.use("/api/plans", planRouter);
  app.use("/api/payments", paymentRouter);
  app.use("/api/mpesa/callback", mpesaCallbackRouter);
  app.use("/api/admin/invite-codes", adminInviteRouter);
  app.use("/api/referrals", referralRouter);
  app.use("/api/coupons", couponRouter);
  app.use("/api/admin/dashboard", adminDashboardRouter);
  app.use("/api/admin/users", adminUserRouter);
  app.use("/api/admin/billing", adminBillingRouter);
  app.use("/api/admin/settings", adminSettingsRouter);
  app.use("/api/admin/activity-logs", adminActivityRouter);
}
