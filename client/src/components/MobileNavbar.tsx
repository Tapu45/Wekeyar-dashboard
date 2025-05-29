import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard,
  User,
  BarChart3,
  Store,
  UploadCloud,
  LogOut,
  Headset,
  Menu,
  X
} from "lucide-react";

interface MobileNavbarProps {
  userRole: string;
}

interface SidebarLink {
  title: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ userRole }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Define the exact same links as Sidebar with role-based access
  const links: SidebarLink[] = [
    { title: "Summary Report", path: "/", icon: LayoutDashboard, roles: ["admin", "tellecaller"] },
    {
      title: "Non-Buying Customers",
      path: "/non-buying-customers",
      icon: User,
      roles: ["admin", "tellecaller"],
    },
    { title: "Customer Report", path: "/customer-report", icon: BarChart3, roles: ["admin", "tellecaller"] },
    { title: "Store Sales Report", path: "/store-sales-report", icon: Store, roles: ["admin", "tellecaller"] },
    { title: "Upload", path: "/upload-manager", icon: UploadCloud, roles: ["admin"] },
    { title: "User Creation", path: "/user", icon: User, roles: ["admin"] },
    { title: "Tellecaller", path: "/telecalling-dashboard", icon: Headset, roles: ["admin"] },
    { title: "Add Customer", path: "/add-new-customer", icon: User, roles: ["admin", "tellecaller"] },
  ];

  // Filter links based on the user's role (same as Sidebar)
  const filteredLinks = links.filter((link) => link.roles.includes(userRole));

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <>
      {/* Fixed top navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950 border-b border-blue-700/30 z-50 h-16 shadow-lg">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              WekeyarPlus
            </h1>
          </div>

          {/* Menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-white hover:text-blue-200 hover:bg-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 top-16"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed top-16 left-0 right-0 bg-gradient-to-b from-blue-800 via-blue-900 to-blue-950 border-b border-blue-700/30 z-50 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-2">
              {/* Navigation Links */}
              {filteredLinks.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-gradient-to-r from-white to-blue-100 text-blue-800 shadow-lg"
                        : "text-white hover:bg-blue-700/60 hover:text-blue-200"
                      }
                    `}
                  >
                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-blue-700" : ""}`} />
                    {item.title}
                  </Link>
                );
              })}

              {/* Logout button */}
              <div className="pt-4 mt-4 border-t border-blue-700/30">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-600/20 hover:text-red-200 transition-colors duration-200"
                >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                  Logout
                </button>
              </div>

              {/* User role indicator and footer */}
              <div className="px-4 py-3 border-t border-blue-700/30 mt-4">
                <p className="text-xs text-blue-200/70 uppercase tracking-wide mb-2">
                  Role: {userRole || "User"}
                </p>
                <p className="text-xs text-blue-200/50 text-center">
                  Powered by Nexus InfoTech
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileNavbar;