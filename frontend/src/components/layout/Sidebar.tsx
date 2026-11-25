
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarClock,
  Send,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
 
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggle,
  onNavigate,
}) => {
  const navigationItems = [
    {
      title: "MAIN MENU",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Scheduled Emails",
          path: "/scheduled",
          icon: CalendarClock,
        },
        {
          name: "Sent Emails",
          path: "/sent",
          icon: Send,
        },
      ],
    },
    {
      title: "INTEGRATIONS",
      items: [
        {
          name: "Slack Integration",
          path: "/settings/integrations",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "PREFERENCES",
      items: [
        {
          name: "Settings",
          path: "/senders",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside
      className={`
        relative flex h-full flex-col border-r border-gray-200
        bg-white transition-all duration-300
        ${collapsed ? "w-19" : "w-64"}
      `}
    >
       

      {/* Navigation */}
      <nav className="flex-1 space-y-6 fixed overflow-y-auto px-3 py-6">
        {navigationItems.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="mb-3 px-3 text-[10px] font-semibold tracking-widest text-gray-400">
                {group.title}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    title={collapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `
                      flex items-center gap-3 rounded-lg px-3 py-3
                      text-sm font-medium transition-all
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }
                      ${collapsed ? "justify-center" : ""}
                      `
                    }
                  >
                    <Icon size={19} className="shrink-0" />

                    {!collapsed && (
                      <span className="truncate">
                        {item.name}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex   fixed items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 left-8 bottom-5"
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span>Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
