
import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from backend/.env
dotenv.config();

const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),

  // MySQL
  DB_HOST: z.string().default("127.0.0.1"),

  DB_PORT: z.coerce.number().int().positive().default(3306),

  DB_USER: z.string().default("root"),

  DB_PASSWORD: z.string().default(""),

  DB_NAME: z.string().default("email_job_scheduler"),

  // Redis
  REDIS_HOST: z.string().default("127.0.0.1"),

  REDIS_PORT: z.coerce.number().int().positive().default(6379),

  REDIS_PASSWORD: z.string().default(""),

  REDIS_DB: z.coerce.number().int().nonnegative().default(0),

  // Elasticsearch
  ELASTICSEARCH_URL: z
    .string()
    .url()
    .default("http://localhost:9200"),

  ELASTICSEARCH_USERNAME: z.string().optional().default(""),

  ELASTICSEARCH_PASSWORD: z.string().optional().default(""),

  // SMTP / Ethereal
  SMTP_HOST: z.string().default("smtp.ethereal.email"),

  SMTP_PORT: z.coerce.number().int().positive().default(587),

  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  SMTP_USER: z.string().optional().default(""),

  SMTP_PASS: z.string().optional().default(""),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(""),

  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),

  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default(
      "http://localhost:5000/api/v1/auth/google/callback"
    ),

  // Session
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must contain at least 32 characters")
    .default("development-only-session-secret-change-this"),

  // Slack OAuth
  SLACK_CLIENT_ID: z.string().optional().default(""),

  SLACK_CLIENT_SECRET: z.string().optional().default(""),

  SLACK_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:5000/api/v1/slack/callback"),

  // Encryption
  ENCRYPTION_KEY: z.string().optional().default(""),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");

  console.error(
    z.treeifyError(parsedEnv.error)
  );

  throw new Error(
    "Environment variable validation failed."
  );
}

export const env = parsedEnv.data;

export type Environment = typeof env;
