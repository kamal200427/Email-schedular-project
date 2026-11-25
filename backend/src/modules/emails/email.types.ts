
export type EmailStatus =
  | "scheduled"
  | "pending"
  | "queued"
  | "processing"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled"
  | "rate_limited";

export interface ScheduleEmailRequest {
  senderId: number;
  recipients: string[];
  subject: string;
  body: string;
  startAt: string;
  delaySeconds: number;
  hourlyLimit: number;
}

export interface EmailJobData {
  emailId: number;
}

export interface EmailRecord {
  id: number;
  batch_id: number;
  user_id: number;
  sender_id: number;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduled_at: Date | string;
  sent_at: Date | string | null;
  failed_at: Date | string | null;
  attempts: number;
  last_error: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface EmailBatchRecord {
  id: number;
  user_id: number;
  sender_id: number;
  subject: string;
  body: string;
  start_at: Date | string;
  delay_seconds: number;
  hourly_limit: number;
  total_emails: number;
  sent_count: number;
  failed_count: number;
  status: string;
}

export interface EmailStats {
  total: number;
  scheduled: number;
  sent: number;
  failed: number;
}

export interface EmailJobResult {
  emailId: number;
  status: "sent" | "rescheduled" | "failed";
}

export interface RateLimitResult {
  allowed: boolean;
  retryAt?: number;
  reason?: "hourly_limit" | "minimum_delay";
}
