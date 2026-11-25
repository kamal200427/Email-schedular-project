
import { Queue, type JobsOptions } from "bullmq";
import { redis } from "../config/redis";
import type { EmailJobData } from "../modules/emails/email.types";

export const EMAIL_QUEUE_NAME = "email-sending";

export const emailQueue = new Queue<EmailJobData>(
  EMAIL_QUEUE_NAME,
  {
    connection: redis,

    defaultJobOptions: {
      attempts: 3,

      backoff: {
        type: "exponential",
        delay: 5000
      },

      removeOnComplete: {
        age: 24 * 60 * 60,
        count: 10000
      },

      removeOnFail: false
    }
  }
);

/**
 * Add an email to the BullMQ queue.
 *
 * The job ID is deterministic for a particular email and scheduled time.
 * This helps prevent duplicate enqueue operations for the same schedule.
 */
export async function enqueueEmail(
  emailId: number,
  scheduledAt: Date | string
) {
  const scheduledTime = new Date(scheduledAt).getTime();

  if (!Number.isFinite(scheduledTime)) {
    throw new Error("Invalid email scheduled time");
  }

  const delay = Math.max(0, scheduledTime - Date.now());

  const jobId = `email-${emailId}-${scheduledTime}`;

  const options: JobsOptions = {
    jobId,
    delay
  };

  return emailQueue.add(
    "send-email",
    { emailId },
    options
  );
}

export async function closeEmailQueue(): Promise<void> {
  await emailQueue.close();
}

export const getEmailJobId = (
  emailId: number,
  scheduledAt: Date | string
): string => {
  const scheduledTime = new Date(scheduledAt).getTime();

  if (!Number.isFinite(scheduledTime)) {
    throw new Error("Invalid email scheduled time.");
  }

  return `email-${emailId}-${scheduledTime}`;
};

export const removeEmailJob = async (
  emailId: number,
  scheduledAt: Date | string
): Promise<{ removed: boolean; active: boolean }> => {
  const jobId = getEmailJobId(emailId, scheduledAt);

  const job = await emailQueue.getJob(jobId);

  if (!job) {
    return {
      removed: false,
      active: false,
    };
  }

  const state = await job.getState();

  // Active jobs cannot safely be removed.
  if (state === "active") {
    return {
      removed: false,
      active: true,
    };
  }

  await job.remove();

  return {
    removed: true,
    active: false,
  };
};
