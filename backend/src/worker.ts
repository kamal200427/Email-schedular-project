
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "./config/database";

import {
  checkRedisConnection,
  closeRedisConnection,
} from "./config/redis";

import {
  closeEmailConnection,
} from "./config/email";

import {
  closeEmailWorker,
} from "./queue/email.worker";

import {
  startOutboxWorker,
  stopOutboxWorker,
} from "./queue/outbox.worker";

async function startWorker(): Promise<void> {
  try {
    console.log("Starting Email Job Scheduler Worker...");

    // Check MySQL connection.
    await checkDatabaseConnection();
    console.log("MySQL connected.");

    // Check Redis connection.
    await checkRedisConnection();
    console.log("Redis connected.");

    // Start BullMQ email worker.
    // Importing email.worker.ts should initialize its Worker instance.
    console.log("Email processing worker initialized.");

    // Start outbox recovery worker.
    startOutboxWorker();

    console.log("All background workers started successfully.");
  } catch (error) {
    console.error("Failed to start background workers:", error);
    await shutdownWorker();
    process.exit(1);
  }
}

let isShuttingDown = false;

async function shutdownWorker(): Promise<void> {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log("Shutting down background workers...");

  try {
    await stopOutboxWorker();
    await closeEmailWorker();
    await closeEmailConnection();
    await closeRedisConnection();
    await closeDatabaseConnection();

    console.log("Background workers stopped successfully.");
  } catch (error) {
    console.error("Worker shutdown error:", error);
  }
}

process.on("SIGINT", async () => {
  await shutdownWorker();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await shutdownWorker();
  process.exit(0);
});

void startWorker();
