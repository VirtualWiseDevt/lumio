import cron from "node-cron";
import { cleanupStaleSessions } from "../services/session.service.js";

export function startSessionCleanupJob(): void {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    try {
      const count = await cleanupStaleSessions();
      if (count > 0) {
        console.log(`[SESSION_CLEANUP] Removed ${count} stale sessions`);
      }
    } catch (error) {
      console.error("[SESSION_CLEANUP] Error:", error);
    }
  });
  console.log("[SESSION_CLEANUP] Scheduled hourly stale session cleanup");
}
