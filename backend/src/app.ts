import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

import { emailQueue } from "./queue/email.queue";
import { requireAuth } from "./middleware/auth.middleware";
import express, {
  Request,
  Response,
  NextFunction,
} from "express";

import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env";
import { sessionMiddleware } from "./config/session";
import passport from "./config/passport";

import authRoutes from "./modules/auth/auth.routes";
import emailRoutes from "./modules/emails/email.routes";
import emailStatsRoutes from "./modules/emails/emailStats.routes";
import senderRoutes from "./modules/senders/sender.routes";
import slackRoutes from "./modules/slack/slack.routes";


// Initialize Express application
const app = express();

// =========================================
// BULL BOARD CONFIGURATION
// =========================================

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});
// Trust reverse proxy in production
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// =========================================
// SECURITY MIDDLEWARE
// =========================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// =========================================
// CORS CONFIGURATION
// =========================================

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
    ],
  })
);

// =========================================
// BODY PARSING
// =========================================

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

// =========================================
// SESSION AND AUTHENTICATION
// =========================================

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

// =========================================
// REQUEST LOGGING
// =========================================

app.use(
  pinoHttp({
    level:
      env.NODE_ENV === "production"
        ? "info"
        : "debug",
  })
);

// =========================================
// HEALTH CHECK
// =========================================

app.get(
  "/health",
  (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Email Job Scheduler API is running.",
      service: "email-job-scheduler",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  }
);

// =========================================
// BULL BOARD CONFIGURATION
// =========================================

 

// =========================================
// API VERSION
// =========================================

app.get(
  "/api/v1",
  (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Email Job Scheduler API",
      version: "1.0.0",
    });
  }
);

// =========================================
// API ROUTES
// =========================================

// Authentication
app.use("/api/v1/auth", authRoutes);

// Email scheduling
app.use("/api/v1/emails", emailRoutes);

// Email statistics
app.use("/api/v1/emails", emailStatsRoutes);

// Sender management
app.use("/api/v1/senders", senderRoutes);
app.use("/api/v1/slack", slackRoutes);
// =========================================
// BULL BOARD DASHBOARD
// =========================================

app.use(
  "/admin/queues",
  requireAuth,
  (req, res, next) => {
    const adminEmail =
      process.env.BULL_BOARD_ADMIN_EMAIL?.toLowerCase();

    const userEmail = (
      req.user as { email?: string } | undefined
    )?.email?.toLowerCase();

    if (!adminEmail || userEmail !== adminEmail) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    next();
  },
  serverAdapter.getRouter()
);

// =========================================
// 404 HANDLER
// =========================================

app.use(
  (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: "API endpoint not found.",
      path: req.originalUrl,
    });
  }
);

// =========================================
// GLOBAL ERROR HANDLER
// =========================================

app.use(
  (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("Application error:", error);

    res.status(500).json({
      success: false,
      message:
        env.NODE_ENV === "production"
          ? "Internal server error."
          : error.message,
    });
  }
);

export default app;
