
import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";

import { scheduleEmailsController } from "./email.controller";

import {
  getScheduledEmails,
  getSentEmails,
  getFailedEmails,
  searchEmails,
} from "./email-list.controller";

import { cancelEmail } from "./email-actions.controller";

const router = Router();

// Protect all email endpoints
router.use(requireAuth);

// Schedule emails
router.post("/schedule", scheduleEmailsController);

// Email lists
router.get("/scheduled", getScheduledEmails);
router.get("/sent", getSentEmails);
router.get("/failed", getFailedEmails);

// Search emails
router.get("/search", searchEmails);

// Cancel scheduled email
router.post("/:id/cancel", cancelEmail);

export default router;
