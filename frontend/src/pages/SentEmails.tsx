
import { useCallback, useEffect } from "react";

import {
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import useEmails from "../hooks/useEmails";

import EmailTable from "../components/emails/EmailTable";

import EmailTabs, {
  type EmailTabType,
} from "../components/dashboard/EmailTabs";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

const SentEmails = () => {

  const {
    emails,
    loading,
    error,
    total,
    fetchEmails,
    refreshEmails,
  } = useEmails({
    mode: "sent",
    autoFetch: false,
  });

  // Fetch sent emails.
  useEffect(() => {
    void fetchEmails("sent").catch(() => {});
  }, [fetchEmails]);

  // Refresh sent email list.
  const handleRefresh = useCallback(async () => {
    try {
      await refreshEmails();
    } catch {
      // Error is handled by the hook.
    }
  }, [refreshEmails]);

  // Navigate between email categories.
  const handleTabChange = (tab: EmailTabType) => {
    if (tab === "scheduled") {
      window.location.assign("/scheduled");
    } else if (tab === "failed") {
      window.location.assign("/dashboard?tab=failed");
    } else {
      window.location.assign("/sent");
    }
  };

  if (loading && emails.length === 0) {
    return (
      <Loader
        fullScreen
        message="Loading sent emails..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-green-100 p-3 text-green-600">
            <Send size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Sent Emails
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track your successfully delivered email submissions.
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

      {/* Statistics */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <p className="text-sm font-medium text-slate-500">
          Total Sent Emails
        </p>

        <div className="mt-2 flex items-center justify-between">

          <h2 className="text-3xl font-bold text-slate-900">
            {total}
          </h2>

          <span className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            <CheckCircle2 size={14} />
            Sent
          </span>

        </div>

      </div>

      {/* Email Management */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 pt-5">

          <EmailTabs
            activeTab="sent"
            onTabChange={handleTabChange}
          />

        </div>

        <div className="p-5">

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Email History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View the history of emails processed by your system.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Sent Email Table */}
          <EmailTable
            emails={emails}
            mode="sent"
            loading={loading}
            emptyMessage="No sent emails are available yet."
          />

          {/* Information */}
          <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold">
              Email processing information
            </p>

            <p className="mt-1">
              This list shows emails that your SMTP provider
              has accepted for sending. SMTP acceptance does
              not necessarily confirm that the recipient's
              inbox received or displayed the email.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default SentEmails;
