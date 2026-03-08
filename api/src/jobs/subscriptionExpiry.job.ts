import cron from "node-cron";
import { prisma } from "../config/database.js";
import {
  sendEmail,
  buildPreExpiryEmail,
  buildPostExpiryEmail,
} from "../services/email.service.js";

export function startSubscriptionExpiryJob(): void {
  // Run every hour at minute 30 (offset from session cleanup at :00)
  cron.schedule("30 * * * *", async () => {
    try {
      const now = new Date();
      const oneDayMs = 24 * 60 * 60 * 1000;

      let count2Day = 0;
      let count1Day = 0;
      let countPostExpiry = 0;

      // ── Pre-expiry 2 days ──────────────────────────────────────────
      const twoDayExpiring = await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: { gt: now, lte: new Date(now.getTime() + 2 * oneDayMs) },
          notifiedPreExpiry2Day: null,
        },
        include: { user: true, plan: true },
      });

      for (const sub of twoDayExpiring) {
        const { subject, html, text } = buildPreExpiryEmail(sub.user.name, {
          planName: sub.plan.name,
          expiresAt: sub.expiresAt,
          daysRemaining: 2,
        });
        sendEmail(sub.user.email, subject, html, text).catch((err) =>
          console.error(
            `[EXPIRY_JOB] Failed to send 2-day pre-expiry to ${sub.user.email}:`,
            err,
          ),
        );
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { notifiedPreExpiry2Day: now },
        });
        count2Day++;
      }

      // ── Pre-expiry 1 day ───────────────────────────────────────────
      const oneDayExpiring = await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: { gt: now, lte: new Date(now.getTime() + 1 * oneDayMs) },
          notifiedPreExpiry1Day: null,
        },
        include: { user: true, plan: true },
      });

      for (const sub of oneDayExpiring) {
        const { subject, html, text } = buildPreExpiryEmail(sub.user.name, {
          planName: sub.plan.name,
          expiresAt: sub.expiresAt,
          daysRemaining: 1,
        });
        sendEmail(sub.user.email, subject, html, text).catch((err) =>
          console.error(
            `[EXPIRY_JOB] Failed to send 1-day pre-expiry to ${sub.user.email}:`,
            err,
          ),
        );
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { notifiedPreExpiry1Day: now },
        });
        count1Day++;
      }

      // ── Post-expiry 1 day ──────────────────────────────────────────
      const postExpiry = await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: {
            lt: now,
            gte: new Date(now.getTime() - 2 * oneDayMs),
          },
          notifiedPostExpiry: null,
        },
        include: { user: true, plan: true },
      });

      for (const sub of postExpiry) {
        // Skip if the user has renewed (another active subscription still valid)
        const renewed = await prisma.subscription.findFirst({
          where: {
            userId: sub.userId,
            status: "ACTIVE",
            expiresAt: { gt: now },
            id: { not: sub.id },
          },
        });

        if (renewed) {
          // Mark as notified so we don't re-check every hour
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { notifiedPostExpiry: now },
          });
          continue;
        }

        const { subject, html, text } = buildPostExpiryEmail(sub.user.name, {
          planName: sub.plan.name,
          expiredAt: sub.expiresAt,
        });
        sendEmail(sub.user.email, subject, html, text).catch((err) =>
          console.error(
            `[EXPIRY_JOB] Failed to send post-expiry to ${sub.user.email}:`,
            err,
          ),
        );
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { notifiedPostExpiry: now },
        });
        countPostExpiry++;
      }

      // Only log if any notifications were processed
      const total = count2Day + count1Day + countPostExpiry;
      if (total > 0) {
        console.log(
          `[EXPIRY_JOB] Processed: ${count2Day} 2-day, ${count1Day} 1-day pre-expiry, ${countPostExpiry} post-expiry`,
        );
      }
    } catch (error) {
      console.error("[EXPIRY_JOB] Error:", error);
    }
  });
  console.log("[EXPIRY_JOB] Scheduled hourly subscription expiry checks");
}
