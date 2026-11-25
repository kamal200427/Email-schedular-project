
/* =========================================
   EMAIL STATUS
========================================= */

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


/* =========================================
   EMAIL TABLE MODE
========================================= */

export type EmailTableMode =
  | "scheduled"
  | "sent"
  | "failed";


/* =========================================
   EMAIL RECORD
========================================= */

export interface EmailRecord {
  id: string;

  batchId?: string;

  senderId?: string;
  senderEmail?: string;

  email: string;
  subject: string;
  body?: string;

  status: EmailStatus;

  scheduledAt?: string;
  sentAt?: string;
  failedAt?: string;

  errorMessage?: string;
  retryCount?: number;

  createdAt?: string;
  updatedAt?: string;
}


/* =========================================
   SCHEDULE EMAIL PAYLOAD
========================================= */

export interface ScheduleEmailPayload {
  senderId: string;

  subject: string;
  body: string;

  recipients: string[];

  startAt: string;

  delaySeconds: number;

  hourlyLimit: number;
}


/* =========================================
   SCHEDULE EMAIL RESPONSE
========================================= */

export interface ScheduleEmailResponse {
  message: string;

  batchId: string;

  totalEmails: number;
}


/* =========================================
   EMAIL STATISTICS
========================================= */

export interface EmailStats {
  totalEmails: number;

  scheduledEmails: number;

  sentEmails: number;

  failedEmails: number;
}


/* =========================================
   EMAIL BATCH
========================================= */

export interface EmailBatch {
  id: string;

  senderId: string;

  subject: string;

  body: string;

  totalEmails: number;

  startAt: string;

  delaySeconds: number;

  hourlyLimit: number;

  status:
    | "scheduled"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled";

  createdAt: string;

  updatedAt?: string;
}


/* =========================================
   SMTP SENDER
========================================= */

export interface SenderOption {
  id: string;

  email: string;

  name?: string;

  isActive?: boolean;
}


export interface SenderListResponse {
  senders: SenderOption[];
}


/* =========================================
   EMAIL LIST RESPONSE
========================================= */

export interface EmailListResponse {
  emails: EmailRecord[];

  total: number;

  page?: number;

  limit?: number;

  totalPages?: number;
}


/* =========================================
   EMAIL SEARCH
========================================= */

export interface EmailSearchParams {
  query: string;

  page?: number;

  limit?: number;

  status?: EmailStatus;
}


/* =========================================
   EMAIL RETRY RESPONSE
========================================= */

export interface RetryEmailResponse {
  message: string;

  emailId: string;

  status: EmailStatus;
}


/* =========================================
   EMAIL CANCEL RESPONSE
========================================= */

export interface CancelEmailResponse {
  message: string;

  emailId: string;

  status: EmailStatus;
}


/* =========================================
   EMAIL ERROR RESPONSE
========================================= */

export interface EmailErrorResponse {
  message: string;

  error?: string;

  code?: string;
}


/* =========================================
   EMAIL EVENT
========================================= */

export interface EmailEvent {
  id: string;

  emailId: string;

  eventType:
    | "created"
    | "queued"
    | "processing"
    | "sent"
    | "failed"
    | "cancelled"
    | "retried";

  message?: string;

  createdAt: string;
}
