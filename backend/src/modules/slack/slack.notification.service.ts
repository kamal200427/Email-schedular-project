
import db from "../../config/database";
import { sendSlackNotification } from "./slack.service";

export type SlackNotificationEvent =
  | "email.sent"
  | "email.failed"
  | "email.rate_limited"
  | "batch.completed";

export interface SlackNotificationPayload {
  userId: number;
  eventType: SlackNotificationEvent;
  emailId?: number;
  recipient?: string;
  subject?: string;
  errorMessage?: string;
  batchId?: number;
  totalEmails?: number;
  sentCount?: number;
  failedCount?: number;
}

interface SlackNotificationSettings {
  user_id: number;
  channel_id: string;
  is_enabled: boolean | number;
  notify_email_sent: boolean | number;
  notify_email_failed: boolean | number;
  notify_rate_limited: boolean | number;
  notify_batch_completed: boolean | number;
}

function isEnabled(value: boolean | number): boolean {
  return value === true || value === 1;
}

function getPreferenceColumn(
  eventType: SlackNotificationEvent
): keyof SlackNotificationSettings {
  switch (eventType) {
    case "email.sent":
      return "notify_email_sent";

    case "email.failed":
      return "notify_email_failed";

    case "email.rate_limited":
      return "notify_rate_limited";

    case "batch.completed":
      return "notify_batch_completed";
  }
}

function buildSlackMessage(
  payload: SlackNotificationPayload
): string {
  switch (payload.eventType) {
    case "email.sent":
      return [
        "✅ *Email sent successfully*",
        `*Recipient:* ${payload.recipient ?? "Unknown"}`,
        `*Subject:* ${payload.subject ?? "No subject"}`,
        `*Email ID:* ${payload.emailId ?? "N/A"}`,
      ].join("\n");

    case "email.failed":
      return [
        "❌ *Email delivery failed*",
        `*Recipient:* ${payload.recipient ?? "Unknown"}`,
        `*Subject:* ${payload.subject ?? "No subject"}`,
        `*Reason:* ${payload.errorMessage ?? "Unknown error"}`,
        `*Email ID:* ${payload.emailId ?? "N/A"}`,
      ].join("\n");

    case "email.rate_limited":
      return [
        "⏳ *Email delayed by rate limiting*",
        `*Recipient:* ${payload.recipient ?? "Unknown"}`,
        `*Subject:* ${payload.subject ?? "No subject"}`,
        `*Email ID:* ${payload.emailId ?? "N/A"}`,
      ].join("\n");

    case "batch.completed":
      return [
        "📊 *Email batch completed*",
        `*Batch ID:* ${payload.batchId ?? "N/A"}`,
        `*Total emails:* ${payload.totalEmails ?? 0}`,
        `*Sent:* ${payload.sentCount ?? 0}`,
        `*Failed:* ${payload.failedCount ?? 0}`,
      ].join("\n");
  }
}

export async function notifySlack(
  payload: SlackNotificationPayload
): Promise<{ sent: boolean; reason?: string }> {
  const settings = await db<SlackNotificationSettings>(
    "slack_notification_settings"
  )
    .where({
      user_id: payload.userId,
      is_enabled: true,
    })
    .first();

  if (!settings) {
    return {
      sent: false,
      reason: "Slack notifications are disabled or not configured.",
    };
  }

  const preferenceColumn = getPreferenceColumn(payload.eventType);

  if (!isEnabled(settings[preferenceColumn] as boolean | number)) {
    return {
      sent: false,
      reason: `Notification ${payload.eventType} is disabled.`,
    };
  }

  if (!settings.channel_id) {
    throw new Error("Slack notification channel is not configured.");
  }

  await sendSlackNotification(
    payload.userId,
    settings.channel_id,
    buildSlackMessage(payload)
  );

  return { sent: true };
}
