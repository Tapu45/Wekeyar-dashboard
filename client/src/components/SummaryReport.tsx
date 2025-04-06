import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";
import InactiveCustomerList from "./InactiveCustomerList";
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaCalendarAlt,
  FaFilter,
  FaChartLine,
  FaFileInvoiceDollar,
  FaBuilding,
} from "react-icons/fa";

interface SummaryData {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalBills: number;
  totalAmount: number;
}

const SummaryReport: React.FC = () => {
  const [showInactiveCustomerList, setShowInactiveCustomerList] = useState(false);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [stores, setStores] = useState<{ id: number; storeName: string }[]>([]);

  // Fetch stores from the backend
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data } = await api.get(API_ROUTES.STORES);
        setStores(data);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      }
    };

    fetchStores();
  }, []);

  // Form state for date inputs
  const [dateInputs, setDateInputs] = useState({
    fromDate: null as string | null,
    toDate: null as string | null,
  });

  // Applied filter values that trigger query
  const [appliedFilters, setAppliedFilters] = useState({
    storeId: null as number | null,
    fromDate: null as string | null,
    toDate: null as string | null,
  });

  // Fetch summary data
  const {
    data: summaryData,
    isLoading,
    error,
    refetch,
  } = useQuery<SummaryData>({
    queryKey: [
      "summary",
      appliedFilters.storeId,
      appliedFilters.fromDate,
      appliedFilters.toDate,
    ],
    queryFn: async () => {
      const { data } = await api.get(API_ROUTES.SUMMARY, {
        params: {
          storeId: appliedFilters.storeId,
          fromDate: appliedFilters.fromDate,
          toDate: appliedFilters.toDate,
        },
      });
      return data;
    },
    enabled:
      !!appliedFilters.storeId &&
      !!appliedFilters.fromDate &&
      !!appliedFilters.toDate,
  });

  const handleInputChange = (field: "fromDate" | "toDate", value: string) => {
    setDateInputs((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const handleStoreChange = (storeId: number) => {
    setSelectedStore(storeId);
    setDateInputs({ fromDate: null, toDate: null });
  };

  const handleDateFilter = () => {
    setAppliedFilters({
      storeId: selectedStore,
      fromDate: dateInputs.fromDate,
      toDate: dateInputs.toDate,
    });
  };

  const handleShowInactiveCustomers = () => {
    setShowInactiveCustomerList(!showInactiveCustomerList);
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: {
      scale: 1.05,
      boxShadow: "0px 10px 25px rgba(59, 130, 246, 0.2)",
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  // Enhanced loading animation
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg border border-blue-200">
        <div className="relative">
          {/* Outer rotating ring */}
          <motion.div
            className="w-24 h-24 border-4 border-blue-300 border-t-blue-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />

          {/* Middle ring */}
          <motion.div
            className="absolute top-1 left-1 w-22 h-22 border-4 border-blue-400 border-t-transparent rounded-full"
            animate={{ rotate: -180 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Inner pulsating circle */}
          <motion.div
            className="absolute top-4 left-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <FaChartLine className="text-white text-xl" />
          </motion.div>
        </div>

        <motion.div
          className="mt-8 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.p
            className="text-blue-800 font-semibold text-lg"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Fetching summary data
          </motion.p>

          <motion.div className="flex mt-2 space-x-1">
            <motion.div
              className="w-2 h-2 bg-blue-600 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-blue-600 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-blue-600 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-lg border border-red-100 shadow-lg">
        <div className="text-center">
          <motion.div
            className="bg-red-100 p-4 rounded-full inline-flex mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <FaUserTimes className="text-red-500 text-3xl" />
          </motion.div>
          <motion.p
            className="text-red-600 font-medium text-lg"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Failed to load summary data.
          </motion.p>
          <motion.button
            onClick={() => refetch()}
            className="mt-5 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 5px 15px rgba(59, 130, 246, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  const totalCustomers = summaryData?.totalCustomers || 0;
  const activeCustomers = summaryData?.activeCustomers || 0;
  const inactiveCustomers = summaryData?.inactiveCustomers || 0;

  return (
    <motion.div
      className="p-6 bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl border border-blue-100"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Improved Header */}
      <motion.div
        className="mb-8 pb-4 border-b-2 border-blue-200"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-3 rounded-lg shadow-lg mr-4">
              <FaChartLine className="text-2xl" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-500">
                Summary Report
              </h2>
              <p className="text-blue-600 mt-1">
                Complete overview of customer statistics and financial data
              </p>
            </div>
          </div>
          <motion.div
            className="p-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-md hidden md:flex"
            whileHover={{ scale: 1.05 }}
          >
            <div className="bg-white rounded-full px-4 py-1 flex items-center">
              <span className="text-blue-700 font-medium text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* All Filters in One Line */}
      <motion.div
        className="mb-8 bg-white rounded-xl shadow-md p-4 border border-blue-100"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Store Selection */}
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <FaBuilding className="mr-2 text-blue-600 text-sm" />
              Store
            </label>
            <select
              className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={selectedStore || ""}
              onChange={(e) => handleStoreChange(Number(e.target.value))}
            >
              <option value="" disabled>
                -- Select --
              </option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.storeName}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-600 text-sm" />
              From Date
            </label>
            <input
              type="date"
              className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={dateInputs.fromDate || ""}
              onChange={(e) => handleInputChange("fromDate", e.target.value)}
              disabled={!selectedStore}
            />
          </div>

          {/* To Date */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-600 text-sm" />
              To Date
            </label>
            <input
              type="date"
              className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={dateInputs.toDate || ""}
              onChange={(e) => handleInputChange("toDate", e.target.value)}
              disabled={!selectedStore}
            />
          </div>

          {/* Apply Filter Button */}
          <div className="md:col-span-2">
            <motion.button
              className="w-full h-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 flex items-center justify-center shadow-md"
              whileHover={{
                scale: 1.03,
                boxShadow: "0px 4px 10px rgba(59, 130, 246, 0.3)",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDateFilter}
              disabled={!selectedStore || !dateInputs.fromDate || !dateInputs.toDate}
            >
              <FaFilter className="mr-2" />
              Apply Filters
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards - Larger Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="p-6 bg-white rounded-xl shadow-lg border border-blue-200 flex items-center"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          transition={{ duration: 0.4 }}
        >
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 rounded-full mr-5 shadow-md">
            <FaUsers className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-800">Total Customers</h3>
            <motion.p
              className="text-3xl font-bold text-blue-600"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {totalCustomers.toLocaleString()}
            </motion.p>
          </div>
        </motion.div>

        <motion.div
          className="p-6 bg-white rounded-xl shadow-lg border border-blue-200 flex items-center"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-full mr-5 shadow-md">
            <FaUserCheck className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-800">Active Customers</h3>
            <motion.p
              className="text-3xl font-bold text-green-600"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {activeCustomers.toLocaleString()}
            </motion.p>
          </div>
        </motion.div>

        <motion.div
          className="p-6 bg-white rounded-xl shadow-lg border border-blue-200 flex items-center"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-full mr-5 shadow-md">
            <FaUserTimes className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-800">Inactive Customers</h3>
            <motion.p
              className="text-3xl font-bold text-amber-600"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {inactiveCustomers.toLocaleString()}
            </motion.p>
          </div>
        </motion.div>

        {/* Total Bills */}
        <motion.div
          className="p-6 bg-white rounded-xl shadow-lg border border-blue-200 flex items-center"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-full mr-5 shadow-md">
            <FaFileInvoiceDollar className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-800">Total Bills</h3>
            <motion.p
              className="text-3xl font-bold text-purple-600"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {summaryData?.totalBills?.toLocaleString() || 0}
            </motion.p>
          </div>
        </motion.div>

        {/* Total Amount */}
        <motion.div
          className="p-6 bg-white rounded-xl shadow-lg border border-blue-200 flex items-center md:col-span-2 lg:col-span-2"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-full mr-5 shadow-md">
            <FaChartLine className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-indigo-800">Total Amount</h3>
            <motion.div className="flex items-baseline">
              <motion.p
                className="text-3xl font-bold text-indigo-600"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                ₹{summaryData?.totalAmount?.toLocaleString() || 0}
              </motion.p>
              
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Improved Toggle Switch */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 flex items-center space-x-4">
          <span className="text-gray-600 font-medium">
            {showInactiveCustomerList ? "Showing inactive customers" : "Show inactive customers"}
          </span>
          <motion.div
            className="w-14 h-7 flex items-center bg-gray-200 rounded-full p-1 cursor-pointer"
            onClick={handleShowInactiveCustomers}
            style={{ 
              backgroundColor: showInactiveCustomerList ? '#3b82f6' : '#e5e7eb',
              justifyContent: showInactiveCustomerList ? 'flex-end' : 'flex-start',
              padding: '2px'
            }}
          >
            <motion.div
              className="bg-white w-5 h-5 rounded-full shadow-md flex items-center justify-center"
              layout
              transition={{ type: "spring", stiffness: 700, damping: 30 }}
            >
              {showInactiveCustomerList ? (
                <FaUserTimes className="text-blue-500 text-xs" />
              ) : (
                <FaUserCheck className="text-gray-400 text-xs" />
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Inactive Customer List */}
      <AnimatePresence>
        {showInactiveCustomerList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              transition: {
                height: { duration: 0.5, ease: "easeOut" },
                opacity: { duration: 0.3, delay: 0.1 },
              },
            }}
            exit={{
              opacity: 0,
              height: 0,
              transition: {
                height: { duration: 0.4, ease: "easeIn" },
                opacity: { duration: 0.2 },
              },
            }}
            className="overflow-hidden"
          >
            <InactiveCustomerList
              fromDate={appliedFilters.fromDate}
              toDate={appliedFilters.toDate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SummaryReport;