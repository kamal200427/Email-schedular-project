
import Redis from "ioredis";

import { env } from "./env";

const redisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,

  // Required for BullMQ worker connections.
  maxRetriesPerRequest: null,

  enableReadyCheck: true,

  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error("Redis connection retry limit reached.");

      return null;
    }

    return Math.min(times * 500, 5000);
  },
};

// Main Redis connection.
export const redis = new Redis(redisOptions);

// Redis connection events.
redis.on("connect", () => {
  console.log("Redis connection established.");
});

redis.on("ready", () => {
  console.log("Redis is ready.");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

redis.on("close", () => {
  console.warn("Redis connection closed.");
});

// Check Redis connectivity.
export const checkRedisConnection = async (): Promise<void> => {
  try {
    const result = await redis.ping();

    if (result !== "PONG") {
      throw new Error("Unexpected Redis ping response.");
    }

    console.log("Redis connected successfully.");
  } catch (error) {
    console.error("Redis health check failed:", error);

    throw error;
  }
};

// Gracefully close Redis.
export const closeRedisConnection = async (): Promise<void> => {
  await redis.quit();

  console.log("Redis connection closed.");
};

export default redis;
