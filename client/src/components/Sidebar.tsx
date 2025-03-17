import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  LayoutDashboard,
  User,
  BarChart3,
  ClipboardList,
  Store,
} from "lucide-react";

interface SidebarLink {
  title: string;
  path: string;
  icon: React.ElementType;
}

const Sidebar: React.FC<{
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}> = ({ isExpanded, setIsExpanded }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const links: SidebarLink[] = [
    { title: "Summary Report", path: "/", icon: LayoutDashboard },
    { title: "Non-Buying Customers", path: "/non-buying-customers", icon: User },
    { title: "Monthly Non-Buying", path: "/non-buying-monthly-customers", icon: ClipboardList },
    { title: "Customer Report", path: "/customer-report", icon: BarChart3 },
    { title: "Store Sales Report", path: "/store-sales-report", icon: Store },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        className="fixed top-4 left-4 p-2 rounded-lg bg-white shadow-lg md:hidden z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm md:hidden z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-blue-600 to-blue-800 shadow-xl transition-all duration-300 ease-in-out z-50 ${
          isExpanded ? "w-64" : "w-20"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">W</span>
            </div>
            <h1
              className={`font-bold text-white text-xl transition-opacity duration-200 ${
                isExpanded ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Wekeyar
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden md:block hover:bg-blue-500 p-1.5 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-blue-500/30 group relative ${
                  isActivePath(link.path) ? "bg-white text-blue-700 font-medium shadow-md" : "text-white"
                }`}
                onClick={() => setIsMobileOpen(false)} // Close sidebar on mobile when a link is clicked
              >
                <div className="flex items-center justify-center w-6">
                  <Icon
                    size={22}
                    className={isActivePath(link.path) ? "text-blue-600" : "text-white"}
                  />
                </div>
                <span
                  className={`font-medium whitespace-nowrap transition-all duration-200 ${
                    isExpanded ? "opacity-100" : "opacity-0 hidden"
                  }`}
                >
                  {link.title}
                </span>
                {!isExpanded && (
                  <div
                    className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                  >
                    {link.title}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-500 text-white text-center text-sm opacity-70">
          {isExpanded && <p>© 2025 Dashboard</p>}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;