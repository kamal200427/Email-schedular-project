import {
  searchEmailsByUser as searchEmailsInElasticsearch,
} from "../../services/search.service";
import db from "../../config/database";

export type EmailListType = "scheduled" | "sent" | "failed";

const statusFilters: Record<EmailListType, string[]> = {
  scheduled: ["scheduled", "pending", "queued", "processing", "sending", "rate_limited"],
  sent: ["sent"],
  failed: ["failed"],
};

export const getEmailsByType = async (
  userId: number | string,
  type: EmailListType
) => {
  const query = db("emails")
    .where("user_id", userId)
    .whereIn("status", statusFilters[type]);

  const [{ total }] = await query.clone().count({ total: "*" });

  const emails = await query
    .select(
      "id",
      "batch_id",
      "sender_id",
      "recipient",
      "subject",
      "body",
      "status",
      "scheduled_at",
      "sent_at",
      "failed_at",
      "attempts",
      "last_error",
      "created_at",
      "updated_at"
    )
    .orderBy(
      type === "sent" ? "sent_at" : "scheduled_at",
      type === "failed" ? "desc" : "asc"
    );

  const formattedEmails = emails.map((email) => ({
    id: String(email.id),
    batchId: String(email.batch_id),
    senderId: String(email.sender_id),
    email: email.recipient,
    subject: email.subject,
    body: email.body,
    status: email.status,
    scheduledAt: email.scheduled_at,
    sentAt: email.sent_at,
    failedAt: email.failed_at,
    errorMessage: email.last_error,
    retryCount: Number(email.attempts ?? 0),
    createdAt: email.created_at,
    updatedAt: email.updated_at,
  }));

  return {
    emails: formattedEmails,
    total: Number(total ?? 0),
  };
};

export const searchEmailsByUser = async (
  userId: number | string,
  searchTerm: string
) => {
  const query = db("emails")
    .where("user_id", userId)
    .andWhere((builder) => {
      builder
        .where("recipient", "like", `%${searchTerm}%`)
        .orWhere("subject", "like", `%${searchTerm}%`)
        .orWhere("body", "like", `%${searchTerm}%`);
    });

  const [{ total }] = await query.clone().count({ total: "*" });

  const emails = await query
    .select(
      "id",
      "batch_id",
      "sender_id",
      "recipient",
      "subject",
      "body",
      "status",
      "scheduled_at",
      "sent_at",
      "failed_at",
      "attempts",
      "last_error",
      "created_at",
      "updated_at"
    )
    .orderBy("created_at", "desc")
    .limit(100);

  return {
    emails: emails.map((email) => ({
      id: String(email.id),
      batchId: String(email.batch_id),
      senderId: String(email.sender_id),
      email: email.recipient,
      subject: email.subject,
      body: email.body,
      status: email.status,
      scheduledAt: email.scheduled_at,
      sentAt: email.sent_at,
      failedAt: email.failed_at,
      errorMessage: email.last_error,
      retryCount: Number(email.attempts ?? 0),
      createdAt: email.created_at,
      updatedAt: email.updated_at,
    })),
    total: Number(total ?? 0),
  };
};
