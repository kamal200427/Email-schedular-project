
import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import useEmails from "../hooks/useEmails";

import EmailTable from "../components/emails/EmailTable";

import EmailTabs, {
  type EmailTabType,
} from "../components/dashboard/EmailTabs";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

import api from "../services/api";

const FailedEmails = () => {
  const navigate = useNavigate();

  const [retryingId, setRetryingId] =
    useState<string | null>(null);

  const {
    emails,
    loading,
    error,
    total,
    fetchEmails,
    refreshEmails,
  } = useEmails({
    mode: "failed",
    autoFetch: false,
  });

  // Fetch failed emails.
  useEffect(() => {
    void fetchEmails("failed").catch(() => {});
  }, [fetchEmails]);

  // Refresh failed email records.
  const handleRefresh = useCallback(async () => {
    try {
      await refreshEmails();
    } catch {
      // Error is already handled by useEmails.
    }
  }, [refreshEmails]);

  // Navigate between email categories.
  const handleTabChange = (tab: EmailTabType) => {
    switch (tab) {
      case "scheduled":
        navigate("/scheduled");
        break;

      case "sent":
        navigate("/sent");
        break;

      case "failed":
        navigate("/failed");
        break;
    }
  };

  // Retry a failed email.
  const handleRetry = async (emailId: string) => {
    const confirmed = window.confirm(
      "Do you want to retry sending this email?"
    );

    if (!confirmed) return;

    try {
      setRetryingId(emailId);

      await api.post(
        `/emails/${encodeURIComponent(emailId)}/retry`
      );

      await fetchEmails("failed");

    } catch (err: any) {
      window.alert(
        err.response?.data?.message ||
        "Unable to retry this email."
      );

    } finally {
      setRetryingId(null);
    }
  };

  if (loading && emails.length === 0) {
    return (
      <Loader
        fullScreen
        message="Loading failed emails..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-red-100 p-3 text-red-600">
            <AlertCircle size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Failed Emails
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review and manage emails that failed during processing.
            </p>
          </div>

        </div>

        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>

      </div>

      {/* Failed Email Statistics */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <p className="text-sm font-medium text-slate-500">
          Total Failed Emails
        </p>

        <div className="mt-2 flex items-center justify-between">

          <h2 className="text-3xl font-bold text-slate-900">
            {total}
          </h2>

          <span className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            <XCircle size={14} />
            Failed
          </span>

        </div>

      </div>

      {/* Failed Email Management */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Tabs */}
        <div className="border-b border-slate-200 px-5 pt-5">

          <EmailTabs
            activeTab="failed"
            onTabChange={handleTabChange}
          />

        </div>

        <div className="p-5">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Failed Email History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review failed deliveries and retry eligible emails.
              </p>
            </div>

          </div>

          {/* Error State */}
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Email Table */}
          <EmailTable
            emails={emails}
            mode="failed"
            loading={loading}
            emptyMessage="Great! No failed emails found."
          />

          {/* Retry Information */}
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  About failed emails
                </h3>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Emails can fail because of SMTP errors,
                  invalid recipient addresses, authentication
                  issues, or temporary provider problems.
                  Retry only after checking the failure reason.
                </p>
              </div>

            </div>

          </div>

          {/* Retry Button Information */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <RotateCcw size={14} />
            Individual retry is available through the retry API.
          </div>

          {retryingId && (
            <div className="fixed bottom-5 right-5 rounded-lg bg-slate-900 px-5 py-3 text-sm text-white shadow-lg">
              Retrying email...
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default FailedEmails;
