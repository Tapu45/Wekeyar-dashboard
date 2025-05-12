import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, TrendingDown, BarChart3 } from "lucide-react";
import NonBuyingCustomerReport from "./NonBuyingCustomerReport";
import NonBuyingMonthlyCustomer from "./NonBuyingMonthlyCustomer";

const CustomerAnalysisManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"nonBuying" | "monthlyNonBuying">("nonBuying");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
      

        {/* Tab Navigation */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-xl p-2 shadow-md flex flex-wrap justify-center gap-2 border border-blue-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("nonBuying")}
              className={`relative px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                activeTab === "nonBuying"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users size={18} />
              <span className="font-medium">Non-Buying Customers</span>
              {activeTab === "nonBuying" && (
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
              onClick={() => setActiveTab("monthlyNonBuying")}
              className={`relative px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                activeTab === "monthlyNonBuying"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <TrendingDown size={18} />
              <span className="font-medium">Monthly Non-Buyers</span>
              {activeTab === "monthlyNonBuying" && (
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
          {activeTab === "nonBuying" ? (
            <motion.div
              key="nonBuying"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <NonBuyingCustomerReport />
            </motion.div>
          ) : (
            <motion.div
              key="monthlyNonBuying"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <NonBuyingMonthlyCustomer />
            </motion.div>
          )}
        </AnimatePresence>

       
      </div>
    </div>
  );
};

export default CustomerAnalysisManager;