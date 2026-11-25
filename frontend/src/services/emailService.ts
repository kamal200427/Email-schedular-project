
import api from "./api";

import type {
  EmailRecord,
} from "../components/emails/EmailTable";

import type {
  ScheduleEmailPayload,
} from "../components/emails/ComposeEmail";

export interface EmailListResponse {
  emails: EmailRecord[];
  total: number;
  page?: number;
  limit?: number;
}

export interface ScheduleEmailResponse {
  message: string;
  batchId: string;
  totalEmails: number;
}

export interface EmailStats {
  totalEmails: number;
  scheduledEmails: number;
  sentEmails: number;
  failedEmails: number;
}

export interface Sender {
  id: string;
  email: string;
}

export interface SenderListResponse {
  senders: Sender[];
}

export interface RetryEmailResponse {
  message: string;
  emailId: string;
  status: string;
}

const emailService = {

  // Schedule a new email campaign.
  scheduleEmails: async (
    payload: ScheduleEmailPayload
  ): Promise<ScheduleEmailResponse> => {
    const response = await api.post<ScheduleEmailResponse>(
      "/emails/schedule",
      payload
    );

    return response.data;
  },

  // Fetch scheduled emails.
  getScheduledEmails: async (
    page = 1,
    limit = 20
  ): Promise<EmailListResponse> => {
    const response = await api.get<EmailListResponse>(
      "/emails/scheduled",
      {
        params: { page, limit },
      }
    );

    return response.data;
  },

  // Fetch sent emails.
  getSentEmails: async (
    page = 1,
    limit = 20
  ): Promise<EmailListResponse> => {
    const response = await api.get<EmailListResponse>(
      "/emails/sent",
      {
        params: { page, limit },
      }
    );

    return response.data;
  },

  // Fetch failed emails.
  getFailedEmails: async (
    page = 1,
    limit = 20
  ): Promise<EmailListResponse> => {
    const response = await api.get<EmailListResponse>(
      "/emails/failed",
      {
        params: { page, limit },
      }
    );

    return response.data;
  },

  // Fetch dashboard statistics.
  getEmailStats: async (): Promise<EmailStats> => {
    const response = await api.get<EmailStats>(
      "/emails/stats"
    );

    return response.data;
  },

  // Fetch individual email details.
  getEmailById: async (
    emailId: string
  ): Promise<EmailRecord> => {
    const response = await api.get<{ email: EmailRecord }>(
      `/emails/${encodeURIComponent(emailId)}`
    );

    return response.data.email;
  },

  // Cancel a scheduled email.
  cancelEmail: async (
    emailId: string
  ): Promise<void> => {
    await api.post(
      `/emails/${encodeURIComponent(emailId)}/cancel`
    );
  },

  // Retry a failed email.
  retryEmail: async (
    emailId: string
  ): Promise<RetryEmailResponse> => {
    const response = await api.post<RetryEmailResponse>(
      `/emails/${encodeURIComponent(emailId)}/retry`
    );

    return response.data;
  },

  // Search emails.
  searchEmails: async (
    query: string,
    page = 1,
    limit = 20
  ): Promise<EmailListResponse> => {
    const response = await api.get<EmailListResponse>(
      "/emails/search",
      {
        params: {
          q: query,
          page,
          limit,
        },
      }
    );

    return response.data;
  },

  // Fetch available SMTP senders.
  getSenders: async (): Promise<Sender[]> => {
    const response = await api.get<SenderListResponse>(
      "/senders"
    );

    return response.data.senders;
  },

};

export default emailService;
