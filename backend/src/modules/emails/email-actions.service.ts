
import db from "../../config/database";
import { removeEmailJob } from "../../queue/email.queue";

type CancellationResult =
  | {
      status: "not_found";
    }
  | {
      status: "not_cancellable";
      currentStatus: string;
    }
  | {
      status: "already_cancelled";
    }
  | {
      status: "cancelled";
      queueJobRemoved: boolean;
    };

const cancellableStatuses = [
  "scheduled",
  "pending",
  "queued",
  "rate_limited",
];

export const cancelEmailForUser = async (
  userId: number | string,
  emailId: number
): Promise<CancellationResult> => {
  const transactionResult = await db.transaction(async (trx) => {
    const email = await trx("emails")
      .where({
        id: emailId,
        user_id: userId,
      })
      .forUpdate()
      .first();

    if (!email) {
      return { status: "not_found" } as const;
    }

    if (email.status === "cancelled") {
      return { status: "already_cancelled" } as const;
    }

    if (!cancellableStatuses.includes(email.status)) {
      return {
        status: "not_cancellable",
        currentStatus: email.status,
      } as const;
    }

    await trx("emails")
      .where({
        id: emailId,
        user_id: userId,
      })
      .update({
        status: "cancelled",
        updated_at: trx.fn.now(),
      });

    await trx("email_events").insert({
      email_id: emailId,
      event_type: "cancelled",
      message: "Email cancelled by user.",
      metadata: JSON.stringify({
        previousStatus: email.status,
      }),
      created_at: trx.fn.now(),
    });

    return {
      status: "cancelled",
      scheduledAt: email.scheduled_at,
    } as const;
  });

  if (transactionResult.status !== "cancelled") {
    return transactionResult;
  }

  // Remove the delayed/waiting BullMQ job.
  // The database status remains the source of truth if
  // the job is already active and cannot be removed.
  let queueJobRemoved = false;

  try {
    const removal = await removeEmailJob(
      emailId,
      transactionResult.scheduledAt
    );

    queueJobRemoved = removal.removed;
  } catch (error) {
    console.error(
      `Could not remove BullMQ job for email ${emailId}:`,
      error
    );
  }

  return {
    status: "cancelled",
    queueJobRemoved,
  };
};
