
import { randomBytes } from "crypto";
import db from "../../config/database";
import { env } from "../../config/env";
import { encrypt, decrypt } from "../../utils/encryption";

const SLACK_OAUTH_URL = "https://slack.com/oauth/v2/authorize";
const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";
const SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";

interface SlackOAuthResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  scope?: string;
  bot_user_id?: string;
  team?: {
    id?: string;
    name?: string;
  };
}

interface SlackAuthTestResponse {
  ok: boolean;
  error?: string;
  user_id?: string;
  team_id?: string;
  team?: string;
}

interface SlackMessageResponse {
  ok: boolean;
  error?: string;
  ts?: string;
  channel?: string;
}

export interface SlackIntegration {
  id: number;
  user_id: number;
  team_id: string;
  team_name: string | null;
  bot_user_id: string | null;
  access_token_encrypted: string;
  scope: string | null;
  is_active: boolean | number;
  created_at: Date;
  updated_at: Date;
}

export interface SlackStatus {
  connected: boolean;
  teamName?: string;
  teamId?: string;
  connectedAt?: Date;
}

function getSlackScopes(): string {
  return "chat:write";
}

function getApiError(
  data: { ok?: boolean; error?: string },
  fallback: string
): string {
  return data.error || fallback;
}

/**
 * Generate Slack OAuth authorization URL.
 */
export function createSlackAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID,
    scope: getSlackScopes(),
    redirect_uri: env.SLACK_REDIRECT_URI,
    state,
  });

  return `${SLACK_OAUTH_URL}?${params.toString()}`;
}

/**
 * Generate a cryptographically secure OAuth state value.
 */
export function generateSlackOAuthState(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Exchange the authorization code for a Slack bot token.
 */
async function exchangeSlackCode(
  code: string
): Promise<SlackOAuthResponse> {
  const body = new URLSearchParams({
    code,
    client_id: env.SLACK_CLIENT_ID,
    client_secret: env.SLACK_CLIENT_SECRET,
    redirect_uri: env.SLACK_REDIRECT_URI,
  });

  const response = await fetch(SLACK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Slack token request failed: ${response.status}`);
  }

  const data = (await response.json()) as SlackOAuthResponse;

  if (!data.ok || !data.access_token || !data.team?.id) {
    throw new Error(
      getApiError(data, "Slack OAuth authorization failed.")
    );
  }

  return data;
}

/**
 * Save or update the Slack integration for a user.
 *
 * Requires a UNIQUE constraint on slack_integrations.user_id.
 */
export async function connectSlackAccount(
  userId: number,
  code: string
): Promise<void> {
  const oauthData = await exchangeSlackCode(code);

  const teamId = oauthData.team?.id;
  const teamName = oauthData.team?.name ?? null;
  const accessToken = oauthData.access_token;

  if (!teamId || !accessToken) {
    throw new Error("Slack did not return the required workspace details.");
  }

  const encryptedToken = encrypt(accessToken);

  await db("slack_integrations")
    .insert({
      user_id: userId,
      team_id: teamId,
      team_name: teamName,
      bot_user_id: oauthData.bot_user_id ?? null,
      access_token_encrypted: encryptedToken,
      scope: oauthData.scope ?? null,
      is_active: true,
      updated_at: db.fn.now(),
      created_at: db.fn.now(),
    })
    .onConflict("user_id")
    .merge({
      team_id: teamId,
      team_name: teamName,
      bot_user_id: oauthData.bot_user_id ?? null,
      access_token_encrypted: encryptedToken,
      scope: oauthData.scope ?? null,
      is_active: true,
      updated_at: db.fn.now(),
    });
}

/**
 * Get the active Slack integration for a user.
 */
async function getActiveSlackIntegration(
  userId: number
): Promise<SlackIntegration | undefined> {
  return db<SlackIntegration>("slack_integrations")
    .where({
      user_id: userId,
      is_active: true,
    })
    .first();
}

/**
 * Return Slack connection status without exposing the token.
 */
export async function getSlackStatus(
  userId: number
): Promise<SlackStatus> {
  const integration = await getActiveSlackIntegration(userId);

  if (!integration) {
    return { connected: false };
  }

  return {
    connected: true,
    teamName: integration.team_name ?? undefined,
    teamId: integration.team_id,
    connectedAt: integration.created_at,
  };
}

/**
 * Disconnect Slack from the user's account.
 */
export async function disconnectSlack(
  userId: number
): Promise<boolean> {
  const updatedRows = await db("slack_integrations")
    .where({ user_id: userId })
    .update({
      is_active: false,
      access_token_encrypted: "",
      updated_at: db.fn.now(),
    });

  return updatedRows > 0;
}

/**
 * Send a Slack notification using the connected bot.
 *
 * The bot must be a member of the target channel.
 */
export async function sendSlackNotification(
  userId: number,
  channelId: string,
  message: string
): Promise<{ success: boolean; timestamp?: string }> {
  const integration = await getActiveSlackIntegration(userId);

  if (!integration) {
    throw new Error("Slack account is not connected.");
  }

  const accessToken = decrypt(integration.access_token_encrypted);

  const response = await fetch(SLACK_POST_MESSAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: channelId,
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack API request failed: ${response.status}`);
  }

  const data = (await response.json()) as SlackMessageResponse;

  if (!data.ok) {
    throw new Error(
      getApiError(data, "Unable to send Slack notification.")
    );
  }

  return {
    success: true,
    timestamp: data.ts,
  };
}
