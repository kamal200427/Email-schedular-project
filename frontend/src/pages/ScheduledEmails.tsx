
import { useCallback, useEffect, useState } from "react";

import {
  CalendarClock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import useEmails from "../hooks/useEmails";

import EmailTable from "../components/emails/EmailTable";

import EmailTabs, {
  type EmailTabType,
} from "../components/dashboard/EmailTabs";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

const ScheduledEmails = () => {
  const [cancelLoading, setCancelLoading] =
    useState<string | null>(null);

  const {
    emails,
    loading,
    error,
    total,
    fetchEmails,
    cancelEmail,
    refreshEmails,
  } = useEmails({
    mode: "scheduled",
    autoFetch: false,
  });

  // Load scheduled emails.
  useEffect(() => {
    void fetchEmails("scheduled").catch(() => {});
  }, [fetchEmails]);

  // Refresh email list.
  const handleRefresh = useCallback(async () => {
    try {
      await refreshEmails();
    } catch {
      // Error is handled by the hook.
    }
  }, [refreshEmails]);

  // Cancel a scheduled email.
  const handleCancel = async (emailId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this scheduled email?"
    );

    if (!confirmed) return;

    try {
      setCancelLoading(emailId);

      await cancelEmail(emailId);

    } catch (err) {
      console.error("Cancellation failed:", err);

    } finally {
      setCancelLoading(null);
    }
  };

  // Navigate to another email category.
  const handleTabChange = (tab: EmailTabType) => {
    if (tab === "sent") {
      window.location.assign("/sent");
    } else if (tab === "failed") {
      window.location.assign("/dashboard?tab=failed");
    } else {
      window.location.assign("/scheduled");
    }
  };

  if (loading && emails.length === 0) {
    return (
      <Loader
        fullScreen
        message="Loading scheduled emails..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <CalendarClock size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Scheduled Emails
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your upcoming email deliveries.
              </p>
            </div>

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
          Total Scheduled Emails
        </p>

        <div className="mt-2 flex items-center justify-between">

          <h2 className="text-3xl font-bold text-slate-900">
            {total}
          </h2>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Scheduled
          </span>

        </div>

      </div>

      {/* Email Categories */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 pt-5">

          <EmailTabs
            activeTab="scheduled"
            onTabChange={handleTabChange}
          />

        </div>

        <div className="p-5">

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Upcoming Deliveries
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review and manage emails waiting to be sent.
            </p>
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
            mode="scheduled"
            loading={loading}
            emptyMessage="You don't have any scheduled emails yet."
          />

          {/* Cancellation Information */}
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">
              Cancellation information
            </p>

            <p className="mt-1">
              Only emails that have not started processing can
              be cancelled. The backend must verify the email
              status before performing cancellation.
            </p>
          </div>

        </div>
      </div>

      {cancelLoading && (
        <div className="fixed bottom-5 right-5 rounded-lg bg-slate-900 px-5 py-3 text-sm text-white shadow-lg">
          Cancelling email...
        </div>
      )}

    </div>
  );
};

export default ScheduledEmails;
