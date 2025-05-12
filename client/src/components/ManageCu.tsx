import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, PlusCircle} from "lucide-react";
import { useLocation } from "react-router-dom";
import NewTelecallingCustomersPage from "./NewCuList";
import AddCustomerPage from "./NewCustomerModal";

const TelecallingCustomerManager: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");

  // Set the active tab based on URL query parameter if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "add") {
      setActiveTab("add");
    } else if (tab === "list") {
      setActiveTab("list");
    }
  }, [location.search]);

  // Update the URL when tab changes
  const handleTabChange = (tab: "list" | "add") => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("tab", tab);
    window.history.replaceState(null, "", `?${searchParams.toString()}`);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        

        {/* Tab Navigation */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-xl p-2 shadow-md flex flex-wrap justify-center gap-2 border border-blue-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTabChange("list")}
              className={`relative px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                activeTab === "list"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users size={18} />
              <span className="font-medium">New Customers</span>
              {activeTab === "list" && (
                <motion.div
                  layoutId="activeCustomerTab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 -z-10"
                  initial={false}
                />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTabChange("add")}
              className={`relative px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                activeTab === "add"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <PlusCircle size={18} />
              <span className="font-medium">Add Customers</span>
              {activeTab === "add" && (
                <motion.div
                  layoutId="activeCustomerTab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 -z-10"
                  initial={false}
                />
              )}
            </motion.button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "add" ? (
            <motion.div
            key="addCustomer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <AddCustomerPage />
          </motion.div>
          ) : (
            <motion.div
              key="customerList"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <NewTelecallingCustomersPage />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TelecallingCustomerManager;

