
import db from "../config/database";

import elasticsearch, {
  EMAIL_INDEX,
} from "../config/elasticsearch";

interface EmailIndexDocument {
  email_id: string;
  user_id: string;
  batch_id: string;
  sender_id: string;
  sender_email: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailDatabaseRecord {
  id: number;
  user_id: number | string;
  batch_id: number;
  sender_id: number;
  sender_email: string | null;
  recipient: string;
  subject: string;
  body: string | null;
  status: string;
  scheduled_at: Date | string | null;
  sent_at: Date | string | null;
  failed_at: Date | string | null;
  attempts: number;
  last_error: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function toISODate(
  value: Date | string | null
): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

/**
 * Ensure the Elasticsearch index exists.
 */
export async function ensureEmailIndex(): Promise<void> {
  const exists = await elasticsearch.indices.exists({
    index: EMAIL_INDEX,
  });

  if (exists) return;

  try {
    await elasticsearch.indices.create({
      index: EMAIL_INDEX,

      mappings: {
        properties: {
          email_id: { type: "keyword" },
          user_id: { type: "keyword" },
          batch_id: { type: "keyword" },
          sender_id: { type: "keyword" },

          sender_email: {
            type: "text",
            fields: {
              keyword: { type: "keyword" },
            },
          },

          recipient: {
            type: "text",
            fields: {
              keyword: { type: "keyword" },
            },
          },

          subject: { type: "text" },
          body: { type: "text" },
          status: { type: "keyword" },

          scheduled_at: { type: "date" },
          sent_at: { type: "date" },
          failed_at: { type: "date" },

          attempts: { type: "integer" },
          last_error: { type: "text" },
          created_at: { type: "date" },
          updated_at: { type: "date" },
        },
      },
    });

    console.log(
      `Elasticsearch index created: ${EMAIL_INDEX}`
    );
  } catch (error) {
    // Another worker may have created the index concurrently.
    const statusCode = (
      error as { meta?: { statusCode?: number } }
    )?.meta?.statusCode;

    if (statusCode !== 400 && statusCode !== 409) {
      throw error;
    }

    const nowExists = await elasticsearch.indices.exists({
      index: EMAIL_INDEX,
    });

    if (!nowExists) {
      throw error;
    }
  }
}

/**
 * Index one successfully sent email.
 *
 * Deterministic document ID makes this operation idempotent.
 */
export async function indexEmail(
  emailId: number
): Promise<void> {
  if (!Number.isInteger(emailId) || emailId <= 0) {
    throw new Error("Invalid email ID.");
  }

  await ensureEmailIndex();

  const email = await db("emails")
    .leftJoin(
      "senders",
      "emails.sender_id",
      "senders.id"
    )
    .select(
      "emails.*",
      "senders.email as sender_email"
    )
    .where("emails.id", emailId)
    .first() as EmailDatabaseRecord | undefined;

  if (!email) {
    throw new Error(
      `Email ${emailId} was not found in MySQL.`
    );
  }

  if (email.status !== "sent") {
    throw new Error(
      `Email ${emailId} is not sent. Current status: ${email.status}.`
    );
  }

  const document: EmailIndexDocument = {
    email_id: String(email.id),
    user_id: String(email.user_id),
    batch_id: String(email.batch_id),
    sender_id: String(email.sender_id),
    sender_email: email.sender_email ?? "",
    recipient: email.recipient,
    subject: email.subject,
    body: email.body ?? "",
    status: email.status,
    scheduled_at: toISODate(email.scheduled_at),
    sent_at: toISODate(email.sent_at),
    failed_at: toISODate(email.failed_at),
    attempts: Number(email.attempts ?? 0),
    last_error: email.last_error ?? null,
    created_at:
      toISODate(email.created_at) ?? new Date().toISOString(),
    updated_at:
      toISODate(email.updated_at) ?? new Date().toISOString(),
  };

  // Same email ID always produces the same Elasticsearch document ID.
  // Repeated calls overwrite the same document.
  await elasticsearch.index({
    index: EMAIL_INDEX,
    id: String(email.id),
    document,
    refresh: "wait_for",
  });

  console.log(
    `Email ${emailId} indexed successfully.`
  );
}

/**
 * Delete an indexed email.
 */
export async function deleteEmailIndex(
  emailId: number
): Promise<void> {
  const exists = await elasticsearch.indices.exists({
    index: EMAIL_INDEX,
  });

  if (!exists) return;

  try {
    await elasticsearch.delete({
      index: EMAIL_INDEX,
      id: String(emailId),
    });
  } catch (error) {
    const statusCode = (
      error as { meta?: { statusCode?: number } }
    )?.meta?.statusCode;

    if (statusCode !== 404) {
      throw error;
    }
  }
}
