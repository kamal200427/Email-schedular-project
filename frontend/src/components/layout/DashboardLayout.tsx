
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  onLogout,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">

      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={onLogout}
      />

      {/* Dashboard Body */}
      <div className="flex min-h-0 flex-1">

        {/* Desktop Sidebar */}
        <div className="hidden shrink-0 md:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">

            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close navigation menu"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Mobile Sidebar */}
            <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
              <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
                <span className="font-semibold text-gray-900">
                  Navigation
                </span>

                <button
                  type="button"
                  aria-label="Close sidebar"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="h-[calc(100%-4rem)]">
                <Sidebar
                  collapsed={false}
                  onNavigate={() => setMobileSidebarOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="min-w-0 flex-1 overflow-x-hidden">

          {/* Mobile Sidebar Toggle */}
          <div className="border-b border-gray-200 bg-white px-4 py-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <Menu size={19} />
              Menu
            </button>
          </div>

          {/* Page Content */}
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>

        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
