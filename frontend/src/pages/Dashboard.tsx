
import { useCallback, useEffect, useState } from "react";

import {
  Mail,
  RefreshCw,
  Plus,
  CalendarClock,
  Send,
  AlertCircle,
} from "lucide-react";

import useEmails from "../hooks/useEmails";
import useAuth from "../hooks/useAuth";

import StatsCards from "../components/dashboard/StatsCards";
import EmailTabs, {
  type EmailTabType,
} from "../components/dashboard/EmailTabs";

import EmailTable from "../components/emails/EmailTable";
import ComposeEmail, {
  type ScheduleEmailPayload,
  type SenderOption,
} from "../components/emails/ComposeEmail";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

import api from "../services/api";

interface DashboardStats {
  totalEmails: number;
  scheduledEmails: number;
  sentEmails: number;
  failedEmails: number;
}

const initialStats: DashboardStats = {
  totalEmails: 0,
  scheduledEmails: 0,
  sentEmails: 0,
  failedEmails: 0,
};

const Dashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] =
    useState<EmailTabType>("scheduled");

  const [composeOpen, setComposeOpen] = useState(false);

  const [senders, setSenders] = useState<SenderOption[]>([]);

  const [stats, setStats] =
    useState<DashboardStats>(initialStats);

  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const {
    emails,
    loading,
    submitting,
    error,
    fetchEmails,
    scheduleEmails,
    cancelEmail,
    refreshEmails,
  } = useEmails({
    mode: activeTab,
  });

  // Fetch counts for all email categories.
  const fetchStats = useCallback(async () => {
    try {
      setStatsError(null);

      const response = await api.get("/emails/stats");

      // Support common API response structures.
      const responseData = response.data;

      const data =
        responseData?.data?.stats ??
        responseData?.stats ??
        responseData?.data ??
        responseData;

      if (!data || typeof data !== "object") {
        throw new Error("Invalid statistics response from server.");
      }

      const nextStats: DashboardStats = {
        totalEmails: Number(data.totalEmails ?? 0),
        scheduledEmails: Number(data.scheduledEmails ?? 0),
        sentEmails: Number(data.sentEmails ?? 0),
        failedEmails: Number(data.failedEmails ?? 0),
      };

      setStats(nextStats);

    } catch (err: any) {
      console.error("Unable to fetch email statistics:", err);

      setStatsError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load dashboard statistics."
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch available SMTP senders.
  const fetchSenders = useCallback(async () => {
    try {
      const response = await api.get("/senders");

      setSenders(response.data?.senders ?? []);
    } catch (err) {
      console.error("Unable to fetch senders:", err);
    }
  }, []);

  // Refresh list, statistics and senders together.
  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      refreshEmails(),
      fetchStats(),
      fetchSenders(),
    ]);
  }, [refreshEmails, fetchStats, fetchSenders]);

  // Load selected email category.
  useEffect(() => {
    void fetchEmails(activeTab).catch(() => {
      // Error is handled by useEmails.
    });
  }, [activeTab, fetchEmails]);

  // Initial dashboard loading.
  useEffect(() => {
    void fetchStats();
    void fetchSenders();
  }, [fetchStats, fetchSenders]);

  // Schedule emails.
  const handleSchedule = async (
    payload: ScheduleEmailPayload
  ) => {
    try {
      await scheduleEmails(payload);

      setComposeOpen(false);
      setActiveTab("scheduled");

      await Promise.all([
        fetchStats(),
        refreshEmails(),
      ]);
    } catch (err) {
      console.error("Email scheduling failed:", err);
      throw err;
    }
  };

  // Cancel scheduled email.
  const handleCancel = async (emailId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this scheduled email?"
    );

    if (!confirmed) return;

    try {
      await cancelEmail(emailId);

      await Promise.all([
        fetchStats(),
        refreshEmails(),
      ]);
    } catch (err) {
      console.error("Email cancellation failed:", err);
    }
  };

  // Counts are independent of the currently selected tab.
  const tabCounts = {
    scheduled: stats.scheduledEmails,
    sent: stats.sentEmails,
    failed: stats.failedEmails,
  };

  const tabTitles: Record<EmailTabType, string> = {
    scheduled: "Scheduled Emails",
    sent: "Sent Emails",
    failed: "Failed Emails",
  };

  const tabDescriptions: Record<EmailTabType, string> = {
    scheduled: "Manage your upcoming email campaigns.",
    sent: "View emails that have been successfully sent.",
    failed: "Review emails that could not be delivered.",
  };

  const isInitialLoading = statsLoading && loading;

  if (isInitialLoading) {
    return (
      <Loader
        fullScreen
        message="Loading your dashboard..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      {/* Dashboard Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {user?.name || "User"}!
            Manage and monitor your email campaigns.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <Button
            variant="outline"
            onClick={() => void refreshDashboard()}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>

          <Button
            onClick={() => setComposeOpen(true)}
            disabled={senders.length === 0}
          >
            <Plus size={17} className="mr-2" />
            Compose Email
          </Button>

        </div>
      </div>

      {/* Statistics Error */}
      {statsError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {statsError}
        </div>
      )}

      {/* Statistics Cards */}
      <StatsCards
        totalEmails={stats.totalEmails}
        scheduledEmails={stats.scheduledEmails}
        sentEmails={stats.sentEmails}
        failedEmails={stats.failedEmails}
        loading={statsLoading}
      />

      {/* Quick Summary */}
      <div className="my-8 grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <CalendarClock size={23} />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Upcoming emails
            </p>

            <p className="text-xl font-bold text-slate-900">
              {stats.scheduledEmails}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="rounded-lg bg-green-50 p-3 text-green-600">
            <Send size={23} />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Successfully sent
            </p>

            <p className="text-xl font-bold text-slate-900">
              {stats.sentEmails}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="rounded-lg bg-red-50 p-3 text-red-600">
            <AlertCircle size={23} />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Failed emails
            </p>

            <p className="text-xl font-bold text-slate-900">
              {stats.failedEmails}
            </p>
          </div>
        </div>

      </div>

      {/* Email Management */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 pt-5">

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Email Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {tabDescriptions[activeTab]}
            </p>
          </div>

          <EmailTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={tabCounts}
          />

        </div>

        <div className="p-5">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h3 className="font-semibold text-slate-900">
                {tabTitles[activeTab]}
              </h3>

              <p className="text-sm text-slate-500">
                {emails.length} emails displayed
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void Promise.all([
                  refreshEmails(),
                  fetchStats(),
                ]);
              }}
              disabled={loading}
            >
              <RefreshCw size={15} className="mr-2" />
              Refresh List
            </Button>

          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <EmailTable
            emails={emails}
            mode={activeTab}
            loading={loading}
            emptyMessage={`No ${activeTab} emails found.`}
            onCancel={handleCancel}
          />

        </div>
      </div>

      {/* Compose Email Modal */}
      <ComposeEmail
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSchedule={handleSchedule}
        senders={senders}
      />

      {/* Scheduling Indicator */}
      {submitting && (
        <div className="fixed bottom-5 right-5 z-40 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          <Mail size={16} className="mr-2 inline" />
          Scheduling your emails...
        </div>
      )}

      {/* No Sender Warning */}
      {senders.length === 0 && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No email sender is configured. Add an SMTP sender before scheduling emails.
        </div>
      )}

    </div>
  );
};

export default Dashboard;
