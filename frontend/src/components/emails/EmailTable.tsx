
import React from "react";
import {
  Mail,
  Inbox,
  CalendarClock,
} from "lucide-react";

import Loader from "../common/Loader";
import EmailStatus, {
  type EmailStatusType
} from "./EmailStatus";

export interface EmailRecord {
  id: string;
  email: string;
  subject: string;
  status: EmailStatusType;
  scheduledAt?: string;
  sentAt?: string;
}

export type EmailTableMode =
  | "scheduled"
  | "sent"
  | "failed";

interface EmailTableProps {
  emails: EmailRecord[];
  mode: EmailTableMode;
  loading?: boolean;
  emptyMessage?: string;
}

const EmailTable: React.FC<EmailTableProps> = ({
  emails,
  mode,
  loading = false,
  emptyMessage,
}) => {
  const dateLabel =
    mode === "scheduled"
      ? "Scheduled Time"
      : "Sent Time";

  const getEmailDate = (email: EmailRecord) => {
    const date =
      mode === "scheduled"
        ? email.scheduledAt
        : email.sentAt;

    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Invalid date";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-blue-600" />

          <h3 className="text-sm font-semibold text-gray-900">
            {mode === "scheduled"
              ? "Scheduled Emails"
              : mode === "sent"
              ? "Sent Emails"
              : "Failed Emails"}
          </h3>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {loading ? "Loading..." : `${emails.length} records`}
        </span>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3">
          <Loader size="lg" message="Loading emails..." />
        </div>
      ) : emails.length === 0 ? (

        /* Empty State */
        <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            {mode === "scheduled" ? (
              <CalendarClock size={26} className="text-gray-400" />
            ) : (
              <Inbox size={26} className="text-gray-400" />
            )}
          </div>

          <h3 className="text-base font-semibold text-gray-800">
            No emails found
          </h3>

          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {emptyMessage ||
              (mode === "scheduled"
                ? "You don't have any scheduled emails yet."
                : mode === "sent"
                ? "You haven't sent any emails yet."
                : "There are no failed emails.")}
          </p>
        </div>

      ) : (

        /* Email Table */
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[750px] border-collapse text-left">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Recipient
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Subject
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {dateLabel}
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {emails.map((email) => (
                <tr
                  key={email.id}
                  className="transition hover:bg-gray-50"
                >
                  {/* Recipient */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Mail size={16} />
                      </div>

                      <span className="text-sm font-medium text-gray-800">
                        {email.email}
                      </span>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="max-w-xs truncate px-5 py-4 text-sm text-gray-600">
                    {email.subject || "No Subject"}
                  </td>

                  {/* Date */}
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                    {getEmailDate(email)}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <EmailStatus status={email.status} />
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmailTable;
