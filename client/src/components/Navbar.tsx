import React from "react";
import { Link, useLocation } from "react-router-dom";

const NavBar: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="sticky top-0 bg-white shadow-md rounded-lg px-6 py-4 flex flex-wrap gap-2 md:gap-6">
      {[
        { path: "/", label: "Summary Report"},
        { path: "/non-buying-customers", label: "Non-Buying Customers"},
        { path: "/non-buying-monthly-customers", label: "Monthly Non-Buying Customers" },
        { path: "/customer-report", label: "Customer Report" },
        { path: "/store-sales-report", label: "Store Sales Report"}
      ].map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`relative px-3 py-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg ${
            location.pathname === item.path
              ? "text-white bg-blue-600 font-medium"
              : "text-blue-600 hover:bg-blue-50"
          }`}
        >
          <span className="relative z-10">{item.label}</span>
          {location.pathname === item.path && (
            <span className="absolute inset-0 bg-blue-600 rounded-md animate-pulse opacity-70"></span>
          )}
        </Link>
      ))}
    </nav>
  );
};

export default NavBar;