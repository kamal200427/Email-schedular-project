
import db from "../../config/database";
import { enqueueEmail } from "../../queue/email.queue";

import type {
  ValidatedScheduleEmailRequest
} from "./email.validation";

interface ScheduleEmailResult {
  batchId: number;
  totalEmails: number;
  queuedEmails: number;
  pendingOutboxEmails: number;
  status: "scheduled" | "partially_queued";
}

interface CreatedEmail {
  id: number;
  scheduled_at: Date | string;
}

export async function scheduleEmails(
  userId: number,
  input: ValidatedScheduleEmailRequest
): Promise<ScheduleEmailResult> {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid authenticated user");
  }

  /*
   * Step 1: Verify sender ownership.
   *
   * A user must not be able to schedule emails using
   * another user's SMTP sender.
   */
  const sender = await db("senders")
    .where({
      id: input.senderId,
      user_id: userId,
      is_active: true
    })
    .first();

  if (!sender) {
    const error = new Error(
      "Sender not found or does not belong to this user"
    ) as Error & { statusCode?: number };

    error.statusCode = 404;
    throw error;
  }

  /*
   * The sender's configured limit is the maximum allowed.
   * A request cannot override it with a higher value.
   */
  const effectiveHourlyLimit = Math.min(
    input.hourlyLimit,
    Number(sender.hourly_limit)
  );

  const startAt = new Date(input.startAt);

  if (Number.isNaN(startAt.getTime()) || startAt.getTime() <= Date.now()) {
    const error = new Error(
      "The scheduled start time must be in the future"
    ) as Error & { statusCode?: number };

    error.statusCode = 400;
    throw error;
  }

  /*
   * Step 2: Normalize and deduplicate recipients again.
   *
   * This is intentional. The service should not rely only
   * on frontend or controller validation.
   */
  const recipients = [
    ...new Set(
      input.recipients.map((recipient) =>
        recipient.trim().toLowerCase()
      )
    )
  ];

  if (recipients.length === 0) {
    throw new Error("At least one valid recipient is required");
  }

  /*
   * Step 3: Create batch, individual email records,
   * events and outbox entries in one transaction.
   */
  const createdEmails = await db.transaction(async (trx) => {
    const [batchIdValue] = await trx("email_batches").insert({
      user_id: userId,
      sender_id: input.senderId,
      subject: input.subject,
      body: input.body,
      start_at: startAt,
      delay_seconds: input.delaySeconds,
      hourly_limit: effectiveHourlyLimit,
      total_emails: recipients.length,
      sent_count: 0,
      failed_count: 0,
      status: "scheduled",
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    const batchId = Number(batchIdValue);

    if (!Number.isSafeInteger(batchId) || batchId <= 0) {
      throw new Error("Could not create email batch");
    }

    const emailRows = recipients.map((recipient, index) => {
      const scheduledAt = new Date(
        startAt.getTime() +
        index * input.delaySeconds * 1000
      );

      return {
        batch_id: batchId,
        user_id: userId,
        sender_id: input.senderId,
        recipient,
        subject: input.subject,
        body: input.body,
        status: "scheduled",
        scheduled_at: scheduledAt,
        attempts: 0,
        last_error: null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      };
    });

    await trx("emails").insert(emailRows);

    /*
     * MySQL does not support Knex's returning() in the same
     * way as PostgreSQL. Fetch the inserted records instead.
     */
    const insertedEmails = await trx("emails")
      .select("id", "scheduled_at")
      .where({ batch_id: batchId })
      .orderBy("id", "asc") as CreatedEmail[];

    if (insertedEmails.length !== recipients.length) {
      throw new Error("Could not retrieve all created emails");
    }

    const eventRows = insertedEmails.map((email) => ({
      email_id: email.id,
      event_type: "scheduled",
      message: "Email scheduled successfully"
    }));

    await trx("email_events").insert(eventRows);

    const outboxRows = insertedEmails.map((email) => ({
      email_id: email.id,
      event_type: "email.schedule",
      status: "pending",
      attempts: 0
    }));

    await trx("email_outbox").insert(outboxRows);

    return {
      batchId,
      emails: insertedEmails
    };
  });

  /*
   * Step 4: Dispatch outbox records to BullMQ.
   *
   * The database transaction has already committed.
   * If Redis is unavailable, the pending outbox entries
   * remain available for a future reconciliation process.
   */
  let queuedEmails = 0;

  for (const email of createdEmails.emails) {
    try {
      await enqueueEmail(
        Number(email.id),
        email.scheduled_at
      );

      await db("email_outbox")
        .where({
          email_id: email.id,
          event_type: "email.schedule",
          status: "pending"
        })
        .update({
          status: "processed",
          processed_at: db.fn.now(),
          updated_at: db.fn.now(),
          attempts: db.raw("attempts + 1")
        });

      queuedEmails++;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown queue error";

      /*
       * Do not delete the outbox record.
       * A reconciliation process can retry it later.
       */
      await db("email_outbox")
        .where({
          email_id: email.id,
          event_type: "email.schedule",
          status: "pending"
        })
        .update({
          attempts: db.raw("attempts + 1"),
          last_error: message,
          updated_at: db.fn.now()
        });

      console.error(
        `Could not enqueue email ${email.id}:`,
        message
      );
    }
  }

  const pendingOutboxEmails =
    createdEmails.emails.length - queuedEmails;

  return {
    batchId: createdEmails.batchId,
    totalEmails: createdEmails.emails.length,
    queuedEmails,
    pendingOutboxEmails,
    status: pendingOutboxEmails === 0
      ? "scheduled"
      : "partially_queued"
  };
}
