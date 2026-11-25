
import type { Knex } from "knex";

import db from "../config/database";
import { enqueueEmail } from "./email.queue";
import { indexEmail } from "../services/indexing.service";
import {
  sendSlackEmailNotification,
  type SlackNotificationEvent,
} from "../services/slack.notification.service";

interface OutboxRecord {
  id: number;
  email_id: number;
  event_type: string;
  status: string;
  attempts: number;
}

interface EmailRecord {
  id: number;
  status: string;
  scheduled_at: Date | string | null;
}

const POLL_INTERVAL_MS = 5000;
const BATCH_SIZE = 25;

const SCHEDULE_EVENT_TYPE = "email.schedule";
const INDEX_EVENT_TYPE = "email.index";

const SLACK_EVENT_TYPES: SlackNotificationEvent[] = [
  "slack.email.sent",
  "slack.email.failed",
  "slack.email.rate_limited",
];

const ELIGIBLE_STATUSES = [
  "scheduled",
  "pending",
  "queued",
  "rate_limited",
];

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;
let isStopping = false;
let activePoll: Promise<void> | null = null;

/**
 * Mark an outbox record as processed.
 */
async function markProcessed(
  trx: Knex.Transaction,
  recordId: number
): Promise<void> {
  await trx("email_outbox")
    .where({ id: recordId })
    .update({
      status: "processed",
      processed_at: trx.fn.now(),
      last_error: null,
      updated_at: trx.fn.now(),
    });
}

/**
 * Mark an outbox record as permanently failed.
 */
async function markFailed(
  trx: Knex.Transaction,
  recordId: number,
  message: string
): Promise<void> {
  await trx("email_outbox")
    .where({ id: recordId })
    .update({
      status: "failed",
      attempts: trx.raw("attempts + 1"),
      last_error: message.slice(0, 2000),
      updated_at: trx.fn.now(),
    });
}

/**
 * Process email.schedule events.
 */
async function processScheduleEvent(
  trx: Knex.Transaction,
  record: OutboxRecord,
  email: EmailRecord
): Promise<void> {
  if (
    email.status === "sent" ||
    email.status === "cancelled"
  ) {
    await markProcessed(trx, record.id);
    return;
  }

  if (!ELIGIBLE_STATUSES.includes(email.status)) {
    throw new Error(
      `Email ${email.id} has unexpected status: ${email.status}`
    );
  }

  if (!email.scheduled_at) {
    throw new Error(
      `Email ${email.id} has no scheduled_at value.`
    );
  }

  const scheduledAt = new Date(email.scheduled_at);

  if (!Number.isFinite(scheduledAt.getTime())) {
    throw new Error(
      `Invalid scheduled_at for email ${email.id}.`
    );
  }

  await enqueueEmail(email.id, scheduledAt);

  await markProcessed(trx, record.id);

  console.log(
    `Schedule event recovered for email ${email.id}.`
  );
}

/**
 * Process email.index events.
 */
async function processIndexEvent(
  trx: Knex.Transaction,
  record: OutboxRecord,
  email: EmailRecord
): Promise<void> {
  if (email.status !== "sent") {
    throw new Error(
      `Cannot index email ${email.id}: current status is ${email.status}.`
    );
  }

  await indexEmail(email.id);

  await markProcessed(trx, record.id);

  console.log(
    `Index event processed for email ${email.id}.`
  );
}

/**
 * Process Slack notification events.
 */
async function processSlackEvent(
  trx: Knex.Transaction,
  record: OutboxRecord,
  email: EmailRecord
): Promise<void> {
  const eventType = record.event_type as SlackNotificationEvent;

  await sendSlackEmailNotification(
    email.id,
    eventType
  );

  // A skipped notification is also processed.
  // For example, the user may have disabled this notification.
  await markProcessed(trx, record.id);

  console.log(
    `Slack event processed for email ${email.id}: ${eventType}.`
  );
}

/**
 * Process one outbox record.
 */
async function processOutboxRecord(
  trx: Knex.Transaction,
  record: OutboxRecord
): Promise<void> {
  const email = (await trx("emails")
    .select("id", "status", "scheduled_at")
    .where({ id: record.email_id })
    .first()) as EmailRecord | undefined;

  if (!email) {
    await markFailed(
      trx,
      record.id,
      `Email ${record.email_id} was not found.`
    );
    return;
  }

  switch (record.event_type) {
    case SCHEDULE_EVENT_TYPE:
      await processScheduleEvent(trx, record, email);
      return;

    case INDEX_EVENT_TYPE:
      await processIndexEvent(trx, record, email);
      return;

    case "slack.email.sent":
    case "slack.email.failed":
    case "slack.email.rate_limited":
      await processSlackEvent(trx, record, email);
      return;

    default:
      await markFailed(
        trx,
        record.id,
        `Unsupported event type: ${record.event_type}`
      );
  }
}

/**
 * Process a batch of pending outbox records.
 */
async function processOutboxBatch(): Promise<void> {
  await db.transaction(async (trx) => {
    const records = (await trx("email_outbox")
      .select(
        "id",
        "email_id",
        "event_type",
        "status",
        "attempts"
      )
      .where("status", "pending")
      .whereIn("event_type", [
        SCHEDULE_EVENT_TYPE,
        INDEX_EVENT_TYPE,
        ...SLACK_EVENT_TYPES,
      ])
      .orderBy("id", "asc")
      .limit(BATCH_SIZE)
      .forUpdate()
      .skipLocked()) as OutboxRecord[];

    for (const record of records) {
      try {
        await processOutboxRecord(trx, record);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown outbox processing error.";

        // Keep failed operations pending for retry.
        await trx("email_outbox")
          .where({ id: record.id })
          .update({
            status: "pending",
            attempts: trx.raw("attempts + 1"),
            last_error: errorMessage.slice(0, 2000),
            updated_at: trx.fn.now(),
          });

        console.error(
          `Outbox record ${record.id} failed:`,
          errorMessage
        );
      }
    }
  });
}

/**
 * Run one outbox polling cycle.
 */
async function pollOutbox(): Promise<void> {
  if (isStopping || isRunning) {
    return;
  }

  isRunning = true;

  activePoll = (async () => {
    try {
      await processOutboxBatch();
    } catch (error) {
      console.error("Outbox polling error:", error);
    } finally {
      isRunning = false;
      activePoll = null;
    }
  })();

  await activePoll;
}

/**
 * Start the outbox worker.
 */
export function startOutboxWorker(): void {
  if (pollTimer || isStopping) {
    return;
  }

  console.log("Starting email outbox recovery worker...");

  const scheduleNextPoll = () => {
    if (isStopping) {
      return;
    }

    pollTimer = setTimeout(async () => {
      pollTimer = null;

      await pollOutbox();

      scheduleNextPoll();
    }, POLL_INTERVAL_MS);
  };

  // Process pending events immediately.
  void pollOutbox().then(scheduleNextPoll);
}

/**
 * Stop the outbox worker gracefully.
 */
export async function stopOutboxWorker(): Promise<void> {
  console.log("Stopping email outbox recovery worker...");

  isStopping = true;

  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }

  if (activePoll) {
    await activePoll;
  }

  console.log("Email outbox worker stopped.");
}
