
import type { Request, Response } from "express";
import {
  getSlackNotificationSettings,
  updateSlackNotificationSettings,
} from "./slack.settings.service";

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

export async function getSlackSettings(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const settings = await getSlackNotificationSettings(getUserId(req));

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get Slack settings error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve Slack notification settings.",
    });
  }
}

export async function updateSlackSettings(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = getUserId(req);

    const body = req.body as Record<string, unknown>;

    const requiredBooleanFields = [
      "isEnabled",
      "notifyEmailSent",
      "notifyEmailFailed",
      "notifyRateLimited",
      "notifyBatchCompleted",
    ];

    const channelId = body.channelId;
    const channelName = body.channelName;

    if (typeof channelId !== "string" || !channelId.trim()) {
      res.status(400).json({
        success: false,
        message: "A Slack channel ID is required.",
      });
      return;
    }

    if (
      channelName !== undefined &&
      channelName !== null &&
      typeof channelName !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Channel name must be a string.",
      });
      return;
    }

    for (const field of requiredBooleanFields) {
      if (typeof body[field] !== "boolean") {
        res.status(400).json({
          success: false,
          message: `${field} must be true or false.`,
        });
        return;
      }
    }

    const settings = await updateSlackNotificationSettings(userId, {
      channelId,
      channelName: typeof channelName === "string" ? channelName : null,
      isEnabled: body.isEnabled as boolean,
      notifyEmailSent: body.notifyEmailSent as boolean,
      notifyEmailFailed: body.notifyEmailFailed as boolean,
      notifyRateLimited: body.notifyRateLimited as boolean,
      notifyBatchCompleted: body.notifyBatchCompleted as boolean,
    });

    res.status(200).json({
      success: true,
      message: "Slack notification settings saved.",
      data: settings,
    });
  } catch (error) {
    console.error("Update Slack settings error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update Slack notification settings.";

    const statusCode = message.includes("Connect your Slack account") ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
