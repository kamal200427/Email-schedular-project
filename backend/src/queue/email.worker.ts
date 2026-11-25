
import { Worker, type Job } from "bullmq";
import type { Transporter } from "nodemailer";
import type { Knex } from "knex";

import { redis } from "../config/redis";
import db from "../config/database";

import {
  createSenderTransport,
  type SenderSMTPConfig,
} from "../services/senderTransport.service";

import { EMAIL_QUEUE_NAME, enqueueEmail } from "./email.queue";
import { reserveEmailSlot } from "../services/rateLimit.service";

import type { EmailJobData } from "../modules/emails/email.types";

interface EmailWithBatch {
  id: number;
  batch_id: number;
  sender_id: number;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduled_at: Date | string;
  hourly_limit: number;
  delay_seconds: number;
}

interface SenderWithLimit extends SenderSMTPConfig {
  hourly_limit: number;
}

const ELIGIBLE_STATUSES = [
  "scheduled",
  "pending",
  "queued",
  "rate_limited",
] as const;

const OUTBOX_EVENTS = {
  EMAIL_INDEX: "email.index",
  SLACK_SENT: "slack.email.sent",
  SLACK_FAILED: "slack.email.failed",
  SLACK_RATE_LIMITED: "slack.email.rate_limited",
} as const;

/**
 * Insert an outbox event.
 * The unique email_id + event_type constraint prevents duplicate events.
 */
async function insertOutboxEvent(
  trx: Knex.Transaction,
  emailId: number,
  eventType: string
): Promise<void> {
  await trx("email_outbox")
    .insert({
      email_id: emailId,
      event_type: eventType,
      status: "pending",
      attempts: 0,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    })
    .onConflict(["email_id", "event_type"])
    .ignore();
}

/**
 * Record an email event.
 */
async function recordEmailEvent(
  emailId: number,
  eventType: string,
  message?: string
): Promise<void> {
  await db("email_events").insert({
    email_id: emailId,
    event_type: eventType,
    message: message ?? null,
  });
}

/**
 * Process one email job.
 */
async function processEmail(
  job: Job<EmailJobData>
): Promise<void> {
  const { emailId } = job.data;

  // 1. Load email and batch hourly limit.
  const email = (await db("emails")
    .join(
      "email_batches",
      "emails.batch_id",
      "email_batches.id"
    )
    .select(
      "emails.*",
      "email_batches.hourly_limit",
      "email_batches.delay_seconds"
    )
    .where("emails.id", emailId)
    .first()) as EmailWithBatch | undefined;

  if (!email) {
    throw new Error(`Email ${emailId} was not found.`);
  }

  // 2. Only process eligible emails.
  if (!ELIGIBLE_STATUSES.includes(email.status as typeof ELIGIBLE_STATUSES[number])) {
    console.log(
      `Email ${emailId} has status ${email.status}. Skipping job.`
    );
    return;
  }

  // 3. Load the selected active sender.
  const sender = (await db("senders")
    .where({
      id: email.sender_id,
      is_active: true,
    })
    .first()) as SenderWithLimit | undefined;

  if (!sender) {
    throw new Error(
      `Sender ${email.sender_id} is unavailable.`
    );
  }

  // 4. Calculate effective hourly limit.
  const effectiveHourlyLimit = Math.min(
    Number(email.hourly_limit),
    Number(sender.hourly_limit)
  );

  if (
    !Number.isFinite(effectiveHourlyLimit) ||
    effectiveHourlyLimit <= 0
  ) {
    throw new Error("Invalid effective hourly limit.");
  }

  // 5. Reserve a Redis sending slot.
  const configuredDelay = Number(email.delay_seconds);

if (
  !Number.isFinite(configuredDelay) ||
  configuredDelay < 0
) {
  throw new Error("Invalid configured email delay.");
}

const rateLimit = await reserveEmailSlot({
  senderId: Number(sender.id),
  hourlyLimit: effectiveHourlyLimit,
  minDelaySeconds: configuredDelay,
});

  if (!rateLimit.allowed) {
    if (rateLimit.retryAt === undefined) {
      throw new Error(
        "Rate limit did not provide a retry time."
      );
    }

    const retryAt = new Date(rateLimit.retryAt);

    if (!Number.isFinite(retryAt.getTime())) {
      throw new Error("Invalid rate-limit retry time.");
    }

    // Update status, record event and create Slack notification
    // in the same MySQL transaction.
    const wasUpdated = await db.transaction(async (trx) => {
      const updatedRows = await trx("emails")
        .where({ id: emailId })
        .whereIn("status", [...ELIGIBLE_STATUSES])
        .update({
          status: "rate_limited",
          scheduled_at: retryAt,
          updated_at: trx.fn.now(),
        });

      if (updatedRows === 0) {
        return false;
      }

      await trx("email_events").insert({
        email_id: emailId,
        event_type: "rate_limited",
        message: `Email rescheduled because of ${rateLimit.reason}.`,
      });

      await insertOutboxEvent(
        trx,
        emailId,
        OUTBOX_EVENTS.SLACK_RATE_LIMITED
      );

      return true;
    });

    if (!wasUpdated) {
      console.log(
        `Email ${emailId} changed status before rescheduling.`
      );
      return;
    }

    // Add a new delayed BullMQ job.
    await enqueueEmail(emailId, retryAt);

    console.log(
      `Email ${emailId} rescheduled for ${retryAt.toISOString()}.`
    );

    return;
  }

  // 6. Atomically claim the email.
  const claimedRows = await db("emails")
    .where({ id: emailId })
    .whereIn("status", [...ELIGIBLE_STATUSES])
    .update({
      status: "sending",
      attempts: db.raw("attempts + 1"),
      updated_at: db.fn.now(),
    });

  if (claimedRows === 0) {
    console.log(
      `Email ${emailId} was already claimed or cancelled.`
    );
    return;
  }

  await recordEmailEvent(emailId, "sending");

  // 7. Create the selected sender's SMTP transporter.
  let transporter: Transporter | undefined;

  try {
    transporter = createSenderTransport(sender);

    // 8. Send email using sender-specific SMTP credentials.
    const result = await transporter.sendMail({
      from: sender.email,
      to: email.recipient,
      subject: email.subject,
      text: email.body,
    });

    // 9. Update email, batch and outbox records transactionally.
    await db.transaction(async (trx) => {
      const updatedRows = await trx("emails")
        .where({
          id: emailId,
          status: "sending",
        })
        .update({
          status: "sent",
          sent_at: trx.fn.now(),
          last_error: null,
          delivery_reference: result.messageId,
          updated_at: trx.fn.now(),
        });

      if (updatedRows === 0) {
        throw new Error(
          `Email ${emailId} was no longer in sending status.`
        );
      }

      await trx("email_batches")
        .where({ id: email.batch_id })
        .update({
          sent_count: trx.raw("sent_count + 1"),
          updated_at: trx.fn.now(),
        });

      await trx("email_events").insert({
        email_id: emailId,
        event_type: "sent",
        message: "Email accepted by the SMTP server.",
        metadata: JSON.stringify({
          messageId: result.messageId,
        }),
      });

      // Elasticsearch indexing event.
      await insertOutboxEvent(
        trx,
        emailId,
        OUTBOX_EVENTS.EMAIL_INDEX
      );

      // Slack success notification event.
      await insertOutboxEvent(
        trx,
        emailId,
        OUTBOX_EVENTS.SLACK_SENT
      );
    });

    console.log(
      `Email ${emailId} successfully sent using ${sender.email}.`
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown email sending error.";

    // Only update if this worker still owns the sending state.
    const updatedRows = await db("emails")
      .where({
        id: emailId,
        status: "sending",
      })
      .update({
        status: "queued",
        last_error: message,
        updated_at: db.fn.now(),
      });

    if (updatedRows > 0) {
      await recordEmailEvent(
        emailId,
        "send_attempt_failed",
        message
      );
    }

    // Allow BullMQ to apply its retry policy.
    throw error;
  } finally {
    // Release the sender's SMTP connection.
    transporter?.close();
  }
}

/**
 * Initialize BullMQ email worker.
 */
export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  processEmail,
  {
    connection: redis,
    concurrency: 5,
  }
);

/**
 * Completed job event.
 */
emailWorker.on("completed", (job) => {
  console.log(`Email job completed: ${job.id}`);
});

/**
 * Failed job event.
 */
emailWorker.on("failed", async (job, error) => {
  console.error(
    `Email job failed: ${job?.id}`,
    error.message
  );

  if (!job) {
    return;
  }

  const maxAttempts = job.opts.attempts ?? 1;

  // Wait until BullMQ has exhausted all attempts.
  if (job.attemptsMade < maxAttempts) {
    return;
  }

  const emailId = job.data.emailId;

  try {
    await db.transaction(async (trx) => {
      const email = await trx("emails")
        .where({ id: emailId })
        .forUpdate()
        .first();

      if (
        !email ||
        ["sent", "cancelled", "failed"].includes(email.status)
      ) {
        return;
      }

      const updatedRows = await trx("emails")
        .where({
          id: emailId,
          status: email.status,
        })
        .update({
          status: "failed",
          failed_at: trx.fn.now(),
          last_error: error.message,
          updated_at: trx.fn.now(),
        });

      if (updatedRows === 0) {
        return;
      }

      await trx("email_batches")
        .where({ id: email.batch_id })
        .update({
          failed_count: trx.raw("failed_count + 1"),
          updated_at: trx.fn.now(),
        });

      await trx("email_events").insert({
        email_id: emailId,
        event_type: "failed",
        message: error.message,
      });

      // Slack permanent-failure notification event.
      await insertOutboxEvent(
        trx,
        emailId,
        OUTBOX_EVENTS.SLACK_FAILED
      );
    });

    console.log(
      `Email ${emailId} marked as failed after all retry attempts.`
    );
  } catch (databaseError) {
    console.error(
      "Could not update failed email status:",
      databaseError
    );
  }
});

/**
 * Worker error event.
 */
emailWorker.on("error", (error) => {
  console.error("Email worker error:", error);
});

/**
 * Graceful shutdown.
 */
export async function closeEmailWorker(): Promise<void> {
  await emailWorker.close();
  console.log("Email processing worker closed.");
}
