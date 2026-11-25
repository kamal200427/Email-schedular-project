
import db from "../config/database";
import { decrypt } from "../utils/encryption";

const SLACK_POST_MESSAGE_URL =
  "https://slack.com/api/chat.postMessage";

export type SlackNotificationEvent =
  | "slack.email.sent"
  | "slack.email.failed"
  | "slack.email.rate_limited";

interface SlackIntegrationRow {
  access_token_encrypted: string;
  is_active: boolean | number;
  team_name: string | null;
}

interface SlackNotificationSettingsRow {
  channel_id: string;
  channel_name: string | null;
  is_enabled: boolean | number;
  notify_email_sent: boolean | number;
  notify_email_failed: boolean | number;
  notify_email_rate_limited: boolean | number;
}

interface EmailNotificationRow {
  id: number;
  user_id: number;
  recipient: string;
  subject: string;
  status: string;
  last_error: string | null;
  scheduled_at: Date | string | null;
  sent_at: Date | string | null;
  failed_at: Date | string | null;
}

interface SlackApiResponse {
  ok: boolean;
  error?: string;
  ts?: string;
  channel?: string;
}

export interface SlackNotificationResult {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  timestamp?: string;
}

function isEnabled(value: boolean | number): boolean {
  return value === true || value === 1;
}

function getNotificationPreference(
  settings: SlackNotificationSettingsRow,
  eventType: SlackNotificationEvent
): boolean {
  switch (eventType) {
    case "slack.email.sent":
      return isEnabled(settings.notify_email_sent);

    case "slack.email.failed":
      return isEnabled(settings.notify_email_failed);

    case "slack.email.rate_limited":
      return isEnabled(settings.notify_email_rate_limited);

    default:
      return false;
  }
}

function buildSlackMessage(
  email: EmailNotificationRow,
  eventType: SlackNotificationEvent
): string {
  const subject = email.subject || "(No subject)";

  switch (eventType) {
    case "slack.email.sent":
      return [
        ":white_check_mark: *Email successfully sent*",
        `*Recipient:* ${email.recipient}`,
        `*Subject:* ${subject}`,
        `*Email ID:* ${email.id}`,
        `*Status:* ${email.status}`,
      ].join("\n");

    case "slack.email.failed":
      return [
        ":x: *Email delivery failed*",
        `*Recipient:* ${email.recipient}`,
        `*Subject:* ${subject}`,
        `*Email ID:* ${email.id}`,
        `*Error:* ${email.last_error || "Unknown delivery error"}`,
      ].join("\n");

    case "slack.email.rate_limited":
      return [
        ":hourglass_flowing_sand: *Email delayed by rate limit*",
        `*Recipient:* ${email.recipient}`,
        `*Subject:* ${subject}`,
        `*Email ID:* ${email.id}`,
        `*Next scheduled time:* ${
          email.scheduled_at
            ? new Date(email.scheduled_at).toISOString()
            : "Not available"
        }`,
      ].join("\n");
  }
}

/**
 * Send a notification to the user's configured Slack channel.
 *
 * If Slack notifications are disabled or not configured,
 * the event is safely skipped.
 */
export async function sendSlackEmailNotification(
  emailId: number,
  eventType: SlackNotificationEvent
): Promise<SlackNotificationResult> {
  if (!Number.isInteger(emailId) || emailId <= 0) {
    throw new Error("Invalid email ID for Slack notification.");
  }

  // 1. Load the email and identify its owner.
  const email = (await db("emails")
    .select(
      "id",
      "user_id",
      "recipient",
      "subject",
      "status",
      "last_error",
      "scheduled_at",
      "sent_at",
      "failed_at"
    )
    .where({ id: emailId })
    .first()) as EmailNotificationRow | undefined;

  if (!email) {
    throw new Error(`Email ${emailId} was not found.`);
  }

  // 2. Load the user's notification settings.
  const settings = (await db("slack_notification_settings")
    .where({ user_id: email.user_id })
    .first()) as SlackNotificationSettingsRow | undefined;

  if (!settings) {
    return {
      sent: false,
      skipped: true,
      reason: "Slack notification settings are not configured.",
    };
  }

  if (
    !isEnabled(settings.is_enabled) ||
    !settings.channel_id
  ) {
    return {
      sent: false,
      skipped: true,
      reason: "Slack notifications are disabled or no channel is configured.",
    };
  }

  // 3. Check the preference for this event.
  if (!getNotificationPreference(settings, eventType)) {
    return {
      sent: false,
      skipped: true,
      reason: `Notification preference is disabled for ${eventType}.`,
    };
  }

  // 4. Load the user's active Slack integration.
  const integration = (await db("slack_integrations")
    .where({
      user_id: email.user_id,
      is_active: true,
    })
    .first()) as SlackIntegrationRow | undefined;

  if (!integration) {
    return {
      sent: false,
      skipped: true,
      reason: "The user's Slack account is not connected.",
    };
  }

  // 5. Decrypt the stored bot token.
  const accessToken = decrypt(
    integration.access_token_encrypted
  );

  if (!accessToken) {
    throw new Error("Slack access token is empty.");
  }

  // 6. Build the notification message.
  const message = buildSlackMessage(email, eventType);

  // 7. Send the message to Slack.
  const response = await fetch(SLACK_POST_MESSAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: settings.channel_id,
      text: message,
      mrkdwn: true,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Slack HTTP request failed with status ${response.status}.`
    );
  }

  const data = (await response.json()) as SlackApiResponse;

  if (!data.ok) {
    throw new Error(
      `Slack API error: ${data.error || "Unknown Slack error."}`
    );
  }

  console.log(
    `Slack notification sent for email ${emailId}: ${eventType}`
  );

  return {
    sent: true,
    timestamp: data.ts,
  };
}
