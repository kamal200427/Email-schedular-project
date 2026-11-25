
import { z } from "zod";

export const createSenderSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z.string().trim().email().max(255),

  smtpHost: z.string().trim().min(1).max(255),

  smtpPort: z.number().int().min(1).max(65535),

  smtpSecure: z.boolean(),

  smtpUsername: z.string().trim().min(1).max(255),

  smtpPassword: z.string().min(1).max(1000),

  hourlyLimit: z.number().int().min(1).max(10000),
});

export const updateSenderSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),

  smtpHost: z.string().trim().min(1).max(255).optional(),

  smtpPort: z.number().int().min(1).max(65535).optional(),

  smtpSecure: z.boolean().optional(),

  smtpUsername: z.string().trim().min(1).max(255).optional(),

  smtpPassword: z.string().min(1).max(1000).optional(),

  hourlyLimit: z.number().int().min(1).max(10000).optional(),

  isActive: z.boolean().optional(),
});
