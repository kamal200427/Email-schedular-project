
import React from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  LoaderCircle,
  AlertCircle,
  Ban,
  CalendarClock,
} from "lucide-react";

export type EmailStatusType =
  | "scheduled"
  | "pending"
  | "queued"
  | "processing"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled"
  | "rate_limited";

interface EmailStatusProps {
  status: EmailStatusType;
  className?: string;
}

const EmailStatus: React.FC<EmailStatusProps> = ({
  status,
  className = "",
}) => {
  const statusConfig: Record<
    EmailStatusType,
    {
      label: string;
      styles: string;
      icon: React.ReactNode;
    }
  > = {
    scheduled: {
      label: "Scheduled",
      styles: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <CalendarClock size={14} />,
    },

    pending: {
      label: "Pending",
      styles: "bg-gray-100 text-gray-700 border-gray-200",
      icon: <Clock size={14} />,
    },

    queued: {
      label: "Queued",
      styles: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: <Clock size={14} />,
    },

    processing: {
      label: "Processing",
      styles: "bg-purple-50 text-purple-700 border-purple-200",
      icon: <LoaderCircle size={14} className="animate-spin" />,
    },

    sending: {
      label: "Sending",
      styles: "bg-purple-50 text-purple-700 border-purple-200",
      icon: <LoaderCircle size={14} className="animate-spin" />,
    },

    sent: {
      label: "Sent",
      styles: "bg-green-50 text-green-700 border-green-200",
      icon: <CheckCircle size={14} />,
    },

    failed: {
      label: "Failed",
      styles: "bg-red-50 text-red-700 border-red-200",
      icon: <XCircle size={14} />,
    },

    cancelled: {
      label: "Cancelled",
      styles: "bg-gray-100 text-gray-600 border-gray-200",
      icon: <Ban size={14} />,
    },

    rate_limited: {
      label: "Rate Limited",
      styles: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <AlertCircle size={14} />,
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 whitespace-nowrap
        rounded-full border px-2.5 py-1
        text-xs font-medium
        ${config.styles}
        ${className}
      `}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

export default EmailStatus;
