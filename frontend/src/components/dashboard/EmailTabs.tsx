
import React from "react";
import {
  CalendarClock,
  Send,
  AlertCircle,
} from "lucide-react";

export type EmailTabType = "scheduled" | "sent" | "failed";

interface EmailTabsProps {
  activeTab: EmailTabType;
  onTabChange: (tab: EmailTabType) => void;
  counts: {
    scheduled: number;
    sent: number;
    failed: number;
  };
}

const EmailTabs: React.FC<EmailTabsProps> = ({
  activeTab,
  onTabChange,
  counts = {},
}) => {
  const tabs = [
    {
      id: "scheduled" as const,
      label: "Scheduled Emails",
      icon: CalendarClock,
      count: counts.scheduled ?? 0,
    },
    {
      id: "sent" as const,
      label: "Sent Emails",
      icon: Send,
      count: counts.sent ?? 0,
    },
    {
      id: "failed" as const,
      label: "Failed Emails",
      icon: AlertCircle,
      count: counts.failed ?? 0,
    },
  ];

  return (
    <div className="w-full border-b border-gray-200">
      <div className="flex gap-6 overflow-x-auto">

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`
                relative flex shrink-0 items-center gap-2
                whitespace-nowrap border-b-2 px-2 pb-3 pt-2
                text-sm font-medium transition-all
                ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }
              `}
            >
              <Icon size={17} />

              {tab.label}

              <span
                className={`
                  rounded-full px-2 py-0.5 text-xs font-semibold
                  ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
              >
                {tab.count}
              </span>
            </button>
          );
        })}

      </div>
    </div>
  );
};

export default EmailTabs;
