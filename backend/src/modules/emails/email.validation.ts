
import { z } from "zod";

export const scheduleEmailSchema = z.object({
  senderId: z.coerce.number().int().positive(),

  recipients: z
    .array(
      z.string()
        .trim()
        .email("Invalid email address")
        .max(255)
    )
    .min(1, "At least one recipient is required")
    .max(500, "Maximum 500 recipients allowed")
    .transform((recipients) => {
      return [...new Set(
        recipients.map((email) => email.toLowerCase())
      )];
    }),

  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(500, "Subject cannot exceed 500 characters"),

  body: z
    .string()
    .trim()
    .min(1, "Email body is required")
    .max(100_000, "Email body is too large"),

  startAt: z
    .string()
    .datetime({ offset: true })
    .refine(
      (value) => new Date(value).getTime() > Date.now(),
      "Start time must be in the future"
    ),

  delaySeconds: z
    .number()
    .int()
    .min(0)
    .max(86400),

  hourlyLimit: z
    .number()
    .int()
    .min(1)
    .max(10000)
});

export const emailIdSchema = z.object({
  emailId: z.coerce.number().int().positive()
});

export const emailSearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
  status: z.enum([
    "scheduled",
    "pending",
    "queued",
    "processing",
    "sending",
    "sent",
    "failed",
    "cancelled",
    "rate_limited"
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type ValidatedScheduleEmailRequest = z.infer<
  typeof scheduleEmailSchema
>;

export type ValidatedEmailSearch = z.infer<
  typeof emailSearchSchema
>;
