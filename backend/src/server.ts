
import app from "./app";

import { env } from "./config/env";

// Database
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "./config/database";

// Redis
import {
  checkRedisConnection,
  closeRedisConnection,
} from "./config/redis";

// Elasticsearch
import {
  checkElasticsearchConnection,
  closeElasticsearchConnection,
} from "./config/elasticsearch";

// Email
import {
  closeEmailConnection,
} from "./config/email";

import { Server } from "http";

// HTTP server instance.
let server: Server | null = null;

// Prevent multiple shutdown operations.
let isShuttingDown = false;

// =========================================
// START SERVER
// =========================================

const startServer = async (): Promise<void> => {
  try {
    console.log("-----------------------------------");
    console.log("Starting Email Job Scheduler...");
    console.log("-----------------------------------");

    // 1. Connect to MySQL.
    console.log("Connecting to MySQL...");

    await checkDatabaseConnection();

    // 2. Connect to Redis.
    console.log("Connecting to Redis...");

    await checkRedisConnection();

    // 3. Connect to Elasticsearch.
    console.log("Connecting to Elasticsearch...");

    await checkElasticsearchConnection();

    // 4. Start Express server.
    server = app.listen(env.PORT, () => {
      console.log("-----------------------------------");
      console.log("Backend server started successfully.");
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Port: ${env.PORT}`);
      console.log(
        `API: http://localhost:${env.PORT}/api/v1`
      );
      console.log(
        `Health: http://localhost:${env.PORT}/health`
      );
      console.log("-----------------------------------");
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error);
      process.exitCode = 1;
    });

  } catch (error) {
    console.error(
      "Unable to start Email Job Scheduler:",
      error
    );

    await cleanupResources();

    process.exitCode = 1;
  }
};

// =========================================
// CLEANUP RESOURCES
// =========================================

const cleanupResources = async (): Promise<void> => {
  const cleanupTasks = [
    {
      name: "MySQL",
      close: closeDatabaseConnection,
    },
    {
      name: "Redis",
      close: closeRedisConnection,
    },
    {
      name: "Elasticsearch",
      close: closeElasticsearchConnection,
    },
    {
      name: "SMTP",
      close: closeEmailConnection,
    },
  ];

  for (const task of cleanupTasks) {
    try {
      await task.close();

      console.log(`${task.name} resources closed.`);
    } catch (error) {
      console.error(
        `Failed to close ${task.name}:`,
        error
      );
    }
  }
};

// =========================================
// GRACEFUL SHUTDOWN
// =========================================

const shutdown = async (
  signal: string
): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Shutting down...`);

  if (server) {
    await new Promise<void>((resolve) => {
      server!.close((error) => {
        if (error) {
          console.error(
            "HTTP server shutdown error:",
            error
          );
        } else {
          console.log("HTTP server closed.");
        }

        resolve();
      });
    });
  }

  await cleanupResources();

  console.log("Application shutdown completed.");

  process.exit(0);
};

// =========================================
// PROCESS SIGNAL HANDLERS
// =========================================

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

// =========================================
// UNHANDLED ERRORS
// =========================================

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);

  process.exitCode = 1;

  void shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);

  process.exitCode = 1;

  void shutdown("uncaughtException");
});

// Start the application.
void startServer();
