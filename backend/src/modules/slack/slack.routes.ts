
import {
  getSlackSettings,
  updateSlackSettings,
} from "./slack.settings.controller";

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";

import {
  connectSlack,
  slackCallback,
  slackStatus,
  slackDisconnect,
  sendSlackMessage,
} from "./slack.controller";

const router = Router();

// Start OAuth connection.
router.get("/connect", requireAuth, connectSlack);

// Slack OAuth callback.
// OAuth state is validated inside the controller.
router.get("/callback", slackCallback);

// Check connection status.
router.get("/status", requireAuth, slackStatus);

// Disconnect Slack.
router.delete("/disconnect", requireAuth, slackDisconnect);

// Send a test notification.
router.post("/notify", requireAuth, sendSlackMessage);

router.get("/settings", requireAuth, getSlackSettings);
router.put("/settings", requireAuth, updateSlackSettings);


export default router;
