import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import { jwtDecode } from "jwt-decode";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: { role: string } = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  // Handle responsive layout changes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      
      if (mobile) {
        setIsSidebarExpanded(false);
      } else if (window.innerWidth >= 1024) { // lg breakpoint
        setIsSidebarExpanded(true);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Mobile Navbar - visible only on mobile */}
      {isMobile && (
        <MobileNavbar userRole={userRole} />
      )}

      {/* Desktop/Tablet Sidebar - hidden on mobile */}
      {!isMobile && (
        <Sidebar
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
          userRole={userRole}
        />
      )}

      {/* Main Content */}
      <div
        className={`
          flex-1 
          ${isMobile 
            ? "pt-16 p-4" // Add top padding for navbar on mobile
            : `p-2 sm:p-4 lg:p-6 ${isSidebarExpanded ? "ml-64" : "ml-16 sm:ml-20"}`
          }
          space-y-4 sm:space-y-6
          overflow-y-auto 
          transition-all duration-300 
          w-full
          min-w-0
        `}
      >
        <div className="max-w-full">
          {children || <Outlet />}
        </div>
      </div>

      {/* Mobile overlay when sidebar is expanded (for tablet view) */}
      {!isMobile && isSidebarExpanded && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarExpanded(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;