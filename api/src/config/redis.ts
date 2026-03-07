import { Redis as IORedis } from "ioredis";
import { env } from "./env.js";

export const redis = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});
