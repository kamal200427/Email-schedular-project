
import { useCallback, useEffect, useState } from "react";

import api from "../services/api";

import type {
  EmailRecord,
  EmailTableMode,
} from "../components/emails/EmailTable";

import type{
  ScheduleEmailPayload,
} from "../components/emails/ComposeEmail";

interface EmailApiResponse {
  emails: EmailRecord[];
  total?: number;
}

interface ScheduleApiResponse {
  message: string;
  batchId: string;
  totalEmails: number;
}

interface UseEmailsOptions {
  autoFetch?: boolean;
  mode?: EmailTableMode;
}

interface UseEmailsReturn {
  emails: EmailRecord[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  total: number;

  fetchEmails: (
    selectedMode?: EmailTableMode
  ) => Promise<void>;

  scheduleEmails: (
    payload: ScheduleEmailPayload
  ) => Promise<ScheduleApiResponse>;

  cancelEmail: (emailId: string) => Promise<void>;

  searchEmails: (
    query: string
  ) => Promise<EmailRecord[]>;

  refreshEmails: () => Promise<void>;
}

const endpoints: Record<EmailTableMode, string> = {
  scheduled: "/emails/scheduled",
  sent: "/emails/sent",
  failed: "/emails/failed",
};

const useEmails = ({
  autoFetch = true,
  mode = "scheduled",
}: UseEmailsOptions = {}): UseEmailsReturn => {

  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Fetch email records.
  const fetchEmails = useCallback(
    async (selectedMode: EmailTableMode = mode) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<EmailApiResponse>(
          endpoints[selectedMode]
        );

        const emailList = response.data.emails || [];

        setEmails(emailList);
        setTotal(response.data.total ?? emailList.length);

      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          "Unable to fetch emails.";

        setError(message);
        setEmails([]);
        setTotal(0);

        throw err;

      } finally {
        setLoading(false);
      }
    },
    [mode]
  );

  // Schedule emails.
  const scheduleEmails = useCallback(
    async (
      payload: ScheduleEmailPayload
    ): Promise<ScheduleApiResponse> => {
      try {
        setSubmitting(true);
        setError(null);

        const response = await api.post<ScheduleApiResponse>(
          "/emails/schedule",
          payload
        );

        await fetchEmails("scheduled");

        return response.data;

      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          "Unable to schedule emails.";

        setError(message);

        throw new Error(message);

      } finally {
        setSubmitting(false);
      }
    },
    [fetchEmails]
  );

  // Cancel scheduled email.
  const cancelEmail = useCallback(
    async (emailId: string) => {
      try {
        setError(null);

        await api.post(
          `/emails/${encodeURIComponent(emailId)}/cancel`
        );

        await fetchEmails("scheduled");

      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          "Unable to cancel email.";

        setError(message);

        throw new Error(message);
      }
    },
    [fetchEmails]
  );

  // Search emails.
  const searchEmails = useCallback(
    async (query: string): Promise<EmailRecord[]> => {
      try {
        setError(null);

        const response = await api.get<EmailApiResponse>(
          "/emails/search",
          {
            params: { q: query },
          }
        );

        return response.data.emails || [];

      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          "Unable to search emails.";

        setError(message);

        throw new Error(message);
      }
    },
    []
  );

  // Refresh current email list.
  const refreshEmails = useCallback(async () => {
    await fetchEmails(mode);
  }, [fetchEmails, mode]);

  // Automatically fetch emails on component mount.
  useEffect(() => {
    if (autoFetch) {
      void fetchEmails().catch(() => {
        // Error is already stored in state.
      });
    }
  }, [autoFetch, fetchEmails]);

  return {
    emails,
    loading,
    submitting,
    error,
    total,
    fetchEmails,
    scheduleEmails,
    cancelEmail,
    searchEmails,
    refreshEmails,
  };
};

export default useEmails;
