import type { SenderSMTPConfig } from "../../services/senderTransport.service";
import db from "../../config/database";
import {
  CreateSenderInput,
  UpdateSenderInput,
} from "./sender.types";
import { encrypt } from "../../utils/encryption";

export const getSendersByUser = async (userId: number | string) => {
  return db("senders")
    .where({ user_id: userId })
    .select(
      "id",
      "user_id",
      "name",
      "email",
      "smtp_host",
      "smtp_port",
      "smtp_secure",
      "hourly_limit",
      "is_active",
      "created_at",
      "updated_at"
    )
    .orderBy("created_at", "desc");
};

export const createSender = async (
  userId: number | string,
  input: CreateSenderInput
) => {
  const existing = await db("senders")
    .where({
      user_id: userId,
      email: input.email.toLowerCase(),
    })
    .first();

  if (existing) {
    throw new Error("A sender with this email already exists.");
  }

  const encryptedUsername = encrypt(input.smtpUsername);
  const encryptedPassword = encrypt(input.smtpPassword);

  const [senderId] = await db("senders").insert({
    user_id: userId,
    name: input.name,
    email: input.email.toLowerCase(),
    smtp_host: input.smtpHost,
    smtp_port: input.smtpPort,
    smtp_secure: input.smtpSecure,
    smtp_username_encrypted: encryptedUsername,
    smtp_password_encrypted: encryptedPassword,
    hourly_limit: input.hourlyLimit,
    is_active: true,
  });

  return db("senders")
    .where({ id: senderId, user_id: userId })
    .select(
      "id",
      "name",
      "email",
      "smtp_host",
      "smtp_port",
      "smtp_secure",
      "hourly_limit",
      "is_active",
      "created_at"
    )
    .first();
};

export const updateSender = async (
  userId: number | string,
  senderId: number,
  input: UpdateSenderInput
) => {
  const sender = await db("senders")
    .where({ id: senderId, user_id: userId })
    .first();

  if (!sender) {
    throw new Error("Sender not found.");
  }

  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.smtpHost !== undefined) updateData.smtp_host = input.smtpHost;
  if (input.smtpPort !== undefined) updateData.smtp_port = input.smtpPort;
  if (input.smtpSecure !== undefined) updateData.smtp_secure = input.smtpSecure;
  if (input.hourlyLimit !== undefined) updateData.hourly_limit = input.hourlyLimit;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  if (input.smtpUsername !== undefined) {
    updateData.smtp_username_encrypted = encrypt(input.smtpUsername);
  }

  if (input.smtpPassword !== undefined) {
    updateData.smtp_password_encrypted = encrypt(input.smtpPassword);
  }

  if (Object.keys(updateData).length === 0) {
  return db("senders")
    .where({ id: senderId, user_id: userId })
    .select(
      "id",
      "name",
      "email",
      "smtp_host",
      "smtp_port",
      "smtp_secure",
      "hourly_limit",
      "is_active",
      "created_at",
      "updated_at"
    )
    .first();
}

  updateData.updated_at = db.fn.now();

  await db("senders")
    .where({ id: senderId, user_id: userId })
    .update(updateData);

  return db("senders")
    .where({ id: senderId, user_id: userId })
    .select(
      "id",
      "name",
      "email",
      "smtp_host",
      "smtp_port",
      "smtp_secure",
      "hourly_limit",
      "is_active",
      "created_at",
      "updated_at"
    )
    .first();
};

export const deleteSender = async (
  userId: number | string,
  senderId: number
) => {
  const sender = await db("senders")
    .where({ id: senderId, user_id: userId })
    .first();

  if (!sender) {
    throw new Error("Sender not found.");
  }

  const emailCount = await db("emails")
    .where({ sender_id: senderId })
    .count<{ total: string }[]>("id as total")
    .first();

  if (Number(emailCount?.total ?? 0) > 0) {
    throw new Error(
      "This sender has email history. Deactivate it instead of deleting it."
    );
  }

  await db("senders")
    .where({ id: senderId, user_id: userId })
    .del();

  return true;
};
export const getSenderSMTPConfigByUser = async (
  userId: number | string,
  senderId: number
): Promise<SenderSMTPConfig | undefined> => {
  return db("senders")
    .where({
      id: senderId,
      user_id: userId,
      is_active: true,
    })
    .select(
      "id",
      "email",
      "smtp_host",
      "smtp_port",
      "smtp_secure",
      "smtp_username_encrypted",
      "smtp_password_encrypted"
    )
    .first();
};