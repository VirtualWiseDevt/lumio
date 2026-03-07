import "dotenv/config";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { startSessionCleanupJob } from "./jobs/sessionCleanup.job.js";

const app = buildApp();

const server = app.listen(env.PORT, () => {
  console.log(`API server running on port ${env.PORT}`);
  startSessionCleanupJob();
});

/**
 * Graceful shutdown handler.
 * Closes HTTP server and disconnects Prisma on SIGTERM/SIGINT.
 */
function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Server closed. Database disconnected.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
