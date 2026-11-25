
import db from "../../config/database";

export interface SlackNotificationSettings {
  channelId: string;
  channelName: string | null;
  isEnabled: boolean;
  notifyEmailSent: boolean;
  notifyEmailFailed: boolean;
  notifyRateLimited: boolean;
  notifyBatchCompleted: boolean;
}

export interface UpdateSlackNotificationSettingsInput {
  channelId: string;
  channelName?: string | null;
  isEnabled: boolean;
  notifyEmailSent: boolean;
  notifyEmailFailed: boolean;
  notifyRateLimited: boolean;
  notifyBatchCompleted: boolean;
}

const DEFAULT_SETTINGS: SlackNotificationSettings = {
  channelId: "",
  channelName: null,
  isEnabled: false,
  notifyEmailSent: true,
  notifyEmailFailed: true,
  notifyRateLimited: true,
  notifyBatchCompleted: true,
};

export async function getSlackNotificationSettings(
  userId: number
): Promise<SlackNotificationSettings> {
  const row = await db("slack_notification_settings")
    .where({ user_id: userId })
    .first();

  if (!row) {
    return DEFAULT_SETTINGS;
  }

  return {
    channelId: row.channel_id,
    channelName: row.channel_name ?? null,
    isEnabled: Boolean(row.is_enabled),
    notifyEmailSent: Boolean(row.notify_email_sent),
    notifyEmailFailed: Boolean(row.notify_email_failed),
    notifyRateLimited: Boolean(row.notify_rate_limited),
    notifyBatchCompleted: Boolean(row.notify_batch_completed),
  };
}

export async function updateSlackNotificationSettings(
  userId: number,
  input: UpdateSlackNotificationSettingsInput
): Promise<SlackNotificationSettings> {
  const channelId = input.channelId.trim();

  if (!channelId) {
    throw new Error("A Slack channel ID is required.");
  }

  if (channelId.length > 100) {
    throw new Error("Slack channel ID is too long.");
  }

  const integration = await db("slack_integrations")
    .where({
      user_id: userId,
      is_active: true,
    })
    .first("id");

  if (!integration) {
    throw new Error("Connect your Slack account before saving notification settings.");
  }

  const values = {
    channel_id: channelId,
    channel_name: input.channelName?.trim() || null,
    is_enabled: input.isEnabled,
    notify_email_sent: input.notifyEmailSent,
    notify_email_failed: input.notifyEmailFailed,
    notify_rate_limited: input.notifyRateLimited,
    notify_batch_completed: input.notifyBatchCompleted,
    updated_at: db.fn.now(),
  };

  await db("slack_notification_settings")
    .insert({
      user_id: userId,
      ...values,
      created_at: db.fn.now(),
    })
    .onConflict("user_id")
    .merge(values);

  return getSlackNotificationSettings(userId);
}
