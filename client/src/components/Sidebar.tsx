import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  LayoutDashboard,
  User,
  BarChart3,
  ClipboardList,
  Store,
  UploadCloud,
  LogOut,
} from "lucide-react";

interface SidebarLink {
  title: string;
  path: string;
  icon: React.ElementType;
}

const Sidebar = ({
  isExpanded,
  setIsExpanded,
}: {
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const links: SidebarLink[] = [
    { title: "Summary Report", path: "/", icon: LayoutDashboard },
    {
      title: "Non-Buying Customers",
      path: "/non-buying-customers",
      icon: User,
    },
    {
      title: "Monthly Non-Buying",
      path: "/non-buying-monthly-customers",
      icon: ClipboardList,
    },
    { title: "Customer Report", path: "/customer-report", icon: BarChart3 },
    { title: "Store Sales Report", path: "/store-sales-report", icon: Store },
    { title: "Upload", path: "/upload", icon: UploadCloud },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        className="fixed z-50 p-2 bg-white rounded-lg shadow-md top-4 left-4 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-blue-800 text-white shadow-lg transition-all duration-300 ease-in-out z-50 ${
          isExpanded ? "w-64" : "w-20"
        }`}
      >
        {/* Logo and Toggle Button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-blue-700">
          <h2
            className={`text-xl font-bold transition-all ${
              isExpanded ? "block" : "hidden"
            }`}
          >
            WekeyarPlus
          </h2>
          <button
            className="hidden md:block"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-2">
          {links.map(({ title, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all ${
                isActivePath(path)
                  ? "bg-white text-blue-800 font-semibold shadow-md"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setIsMobileOpen(false)}
            >
              <Icon size={22} />
              <span className={isExpanded ? "block" : "hidden"}>{title}</span>
            </Link>
          ))}

          {/* Logout */}
          <button
            className="flex items-center w-full gap-3 px-4 py-2 rounded-md hover:bg-red-600"
            onClick={handleLogout}
          >
            <LogOut size={22} />
            <span className={isExpanded ? "block" : "hidden"}>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
