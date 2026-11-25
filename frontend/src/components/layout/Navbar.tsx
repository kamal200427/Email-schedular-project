
import React, { useState } from "react";
import {
  Mail,
   
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import {  useNavigate } from "react-router-dom";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    onLogout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <div
          className="flex cursor-pointer items-center gap-2"
          onClick={() => navigate("/dashboard")}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Mail size={21} />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
              MailScheduler
            </h1>
            <p className="hidden text-[10px] font-medium uppercase tracking-widest text-gray-400 sm:block">
              Email Automation
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
           
        </nav>

        {/* User Profile */}
        <div className="relative flex items-center gap-3">

          {/* User Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            className="hidden items-center gap-2 rounded-lg p-1.5 transition hover:bg-gray-100 sm:flex"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {getInitials(user.name)}
              </div>
            )}

            <div className="hidden text-left lg:block">
              <p className="max-w-35 truncate text-sm font-semibold text-gray-800">
                {user.name}
              </p>
              <p className="max-w-35 truncate text-xs text-gray-500">
                {user.email}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`text-gray-500 transition ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-14 z-50 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">

              <div className="border-b border-gray-100 px-3 py-3">
                <p className="text-sm font-semibold text-gray-900">
                  {user.name}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {user.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDropdownOpen(false)}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                <User size={17} />
                My Profile
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
             

              
            <div className="my-2 border-t border-gray-200" />

            <div className="flex items-center gap-3 px-3 py-2">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {getInitials(user.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {user.name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
