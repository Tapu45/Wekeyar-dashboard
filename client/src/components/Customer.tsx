import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingDown, BarChart3 } from "lucide-react";
import NonBuyingCustomerReport from "./NonBuyingCustomerReport";
import NonBuyingMonthlyCustomer from "./NonBuyingMonthlyCustomer";

const CustomerAnalysisManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"nonBuying" | "monthlyNonBuying">("nonBuying");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8 px-2"
        >
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="bg-white p-2 sm:p-3 rounded-full shadow-lg mr-3 sm:mr-4">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
              Customer Analysis
            </h1>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            Track and analyze customer behavior patterns to improve engagement
          </p>
        </motion.div>

        {/* Tab Navigation - Responsive */}
        <div className="mb-6 sm:mb-8 flex justify-center px-2">
          <div className="bg-white rounded-xl p-1 sm:p-2 shadow-md flex flex-col sm:flex-row justify-center gap-1 sm:gap-2 border border-blue-100 w-full max-w-2xl">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("nonBuying")}
              className={`relative px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base ${
                activeTab === "nonBuying"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="font-medium text-center">
                <span className="hidden sm:inline">Non-Buying Customers</span>
                <span className="sm:hidden">Non-Buyers</span>
              </span>
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
              className={`relative px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base ${
                activeTab === "monthlyNonBuying"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <TrendingDown size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="font-medium text-center">
                <span className="hidden sm:inline">Monthly Non-Buyers</span>
                <span className="sm:hidden">Monthly</span>
              </span>
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

        {/* Tab Content - Responsive Container */}
        <div className="w-full min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === "nonBuying" ? (
              <motion.div
                key="nonBuying"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
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
                className="w-full"
              >
                <NonBuyingMonthlyCustomer />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Section - Responsive */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-12 text-center"
        >
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-blue-100">
            <p className="text-xs sm:text-sm text-gray-500">
              📊 Analysis data is updated in real-time • Last refresh: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerAnalysisManager;