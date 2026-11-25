
import type { Request, Response } from "express";
import { env } from "../../config/env";
import {
  connectSlackAccount,
  createSlackAuthorizationUrl,
  disconnectSlack,
  generateSlackOAuthState,
  getSlackStatus,
  sendSlackNotification,
} from "./slack.service";

declare module "express-session" {
  interface SessionData {
    slackOAuthState?: string;
    slackOAuthUserId?: number;
  }
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: number | string;
  };
}

function getUserId(req: AuthenticatedRequest): number {
  const userId = Number(req.user?.id);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error("Invalid authenticated user.");
  }

  return userId;
}

/**
 * GET /api/v1/slack/connect
 *
 * Start Slack OAuth authorization.
 */
export async function connectSlack(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = getUserId(req);

    const state = generateSlackOAuthState();

    req.session.slackOAuthState = state;
    req.session.slackOAuthUserId = userId;

    const authorizationUrl = createSlackAuthorizationUrl(state);

    res.redirect(authorizationUrl);
  } catch (error) {
    console.error("Slack connect error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to start Slack authorization.",
    });
  }
}

/**
 * GET /api/v1/slack/callback
 *
 * Slack redirects the user here after authorization.
 */
export async function slackCallback(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const code =
      typeof req.query.code === "string" ? req.query.code : undefined;

    const returnedState =
      typeof req.query.state === "string" ? req.query.state : undefined;

    const expectedState = req.session.slackOAuthState;
    const userId = req.session.slackOAuthUserId;

    // Clear OAuth state before processing the callback.
    delete req.session.slackOAuthState;
    delete req.session.slackOAuthUserId;

    if (!expectedState || !returnedState || returnedState !== expectedState) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired Slack OAuth state.",
      });
      return;
    }

    if (!userId || !code) {
      res.status(400).json({
        success: false,
        message: "Slack authorization was not completed.",
      });
      return;
    }

    if (req.query.error) {
      res.redirect(
        `${process.env.FRONTEND_URL}/settings/integrations?slack=denied`
      );
      return;
    }

    await connectSlackAccount(userId, code);

    res.redirect(
      `${process.env.FRONTEND_URL}/settings/integrations?slack=connected`
    );
  } catch (error) {
    console.error("Slack callback error:", error);

    res.redirect(
      `${process.env.FRONTEND_URL}/settings/integrations?slack=error`
    );
  }
}

/**
 * GET /api/v1/slack/status
 *
 * Check whether Slack is connected.
 */
export async function slackStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = getUserId(req);

    const status = await getSlackStatus(userId);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Slack status error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve Slack connection status.",
    });
  }
}

/**
 * DELETE /api/v1/slack/disconnect
 *
 * Disconnect Slack.
 */
export async function slackDisconnect(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = getUserId(req);

    await disconnectSlack(userId);

    res.status(200).json({
      success: true,
      message: "Slack account disconnected successfully.",
    });
  } catch (error) {
    console.error("Slack disconnect error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to disconnect Slack.",
    });
  }
}

/**
 * POST /api/v1/slack/notify
 *
 * Send a test notification to a Slack channel.
 */
export async function sendSlackMessage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = getUserId(req);

    const { channelId, message } = req.body as {
      channelId?: string;
      message?: string;
    };

    if (
      typeof channelId !== "string" ||
      !channelId.trim() ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "channelId and message are required.",
      });
      return;
    }

    if (channelId.length > 100 || message.length > 3000) {
      res.status(400).json({
        success: false,
        message: "Channel ID or message is too long.",
      });
      return;
    }

    const result = await sendSlackNotification(
      userId,
      channelId.trim(),
      message.trim()
    );

    res.status(200).json({
      success: true,
      message: "Slack notification sent successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Slack notification error:", error);

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to send Slack notification.",
    });
  }
}
