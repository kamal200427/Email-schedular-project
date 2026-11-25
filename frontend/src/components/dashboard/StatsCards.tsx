
import React from "react";
import {
  Mail,
  CalendarClock,
  Send,
  AlertCircle,
} from "lucide-react";

interface StatsCardsProps {
  totalEmails: number;
  scheduledEmails: number;
  sentEmails: number;
  failedEmails: number;
  loading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  totalEmails,
  scheduledEmails,
  sentEmails,
  failedEmails,
  loading = false,
}) => {
  const stats = [
    {
      title: "Total Emails",
      value: totalEmails,
      icon: Mail,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      description: "All email records",
    },
    {
      title: "Scheduled",
      value: scheduledEmails,
      icon: CalendarClock,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      description: "Waiting to be sent",
    },
    {
      title: "Sent Emails",
      value: sentEmails,
      icon: Send,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      description: "Successfully processed",
    },
    {
      title: "Failed Emails",
      value: failedEmails,
      icon: AlertCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      description: "Unsuccessful deliveries",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>

                {loading ? (
                  <div className="mt-3 h-8 w-20 animate-pulse rounded-md bg-gray-200" />
                ) : (
                  <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                    {stat.value.toLocaleString("en-IN")}
                  </h3>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  {stat.description}
                </p>
              </div>

              <div
                className={`
                  flex h-12 w-12 items-center justify-center
                  rounded-xl ${stat.iconBg}
                `}
              >
                <Icon
                  size={23}
                  className={stat.iconColor}
                />
              </div>

            </div>
          </div>
        );
      })}

    </div>
  );
};

export default StatsCards;
