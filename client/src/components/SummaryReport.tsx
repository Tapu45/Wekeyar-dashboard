import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";
import InactiveCustomerList from "./InactiveCustomerList";
import {
  
  FaUserCheck,
  FaUserTimes,
  FaCalendarAlt,
  FaFilter,
  FaChartLine,
  FaFileInvoiceDollar,
  FaBuilding,
  FaChevronDown,
  FaSearch,
  FaClock,
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
  const [showFilters, setShowFilters] = useState(true);

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
      scale: 1.02,
      boxShadow: "0px 10px 25px rgba(59, 130, 246, 0.15)",
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
  
  // Calculate percentages for active/inactive
  const activePercentage = totalCustomers > 0 
    ? Math.round((activeCustomers / totalCustomers) * 100) 
    : 0;
  const inactivePercentage = totalCustomers > 0 
    ? Math.round((inactiveCustomers / totalCustomers) * 100) 
    : 0;

  return (
    <motion.div
      className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl border border-blue-100 overflow-hidden"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Modern Hero Header with Gradient and Pattern */}
      <motion.div
        className="relative bg-gradient-to-r from-blue-700 to-blue-900 p-8 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-400"></div>
          <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 left-1/2 w-52 h-52 rounded-full bg-blue-300"></div>
        </div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-white bg-opacity-20 text-white p-4 rounded-lg shadow-lg mr-5 backdrop-blur-sm">
              <FaChartLine className="text-3xl text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white">
                Summary Report
              </h2>
              <p className="text-blue-100 mt-1">
                Complete overview of customer statistics and financial data
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.div
              className="p-1 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm shadow-md"
              whileHover={{ scale: 1.05 }}
            >
              <div className="bg-white bg-opacity-90 rounded-md px-4 py-2 flex items-center">
                <FaClock className="text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </motion.div>
            
            <motion.button 
              className="p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 text-white backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="text-blue-600" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Filter Box with Animation */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="bg-white rounded-xl shadow-lg mx-6 -mt-6 relative z-10 border border-blue-100"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                  <FaSearch className="mr-2 text-blue-600" />
                  Report Filters
                </h3>
                {appliedFilters.storeId && appliedFilters.fromDate && appliedFilters.toDate && (
                  <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    <span>Active filters applied</span>
                    <div className="ml-2 w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                {/* Store Selection */}
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                    <FaBuilding className="mr-2 text-blue-600 text-sm" />
                    Store
                  </label>
                  <div className="relative">
                    <select
                      className="block w-full border border-blue-300 rounded-lg shadow-sm py-2.5 pl-4 pr-10 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none text-gray-700"
                      value={selectedStore || ""}
                      onChange={(e) => handleStoreChange(Number(e.target.value))}
                    >
                      <option value="" disabled>
                        -- Select Store --
                      </option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.storeName}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <FaChevronDown className="text-blue-500 text-xs" />
                    </div>
                  </div>
                </div>

                {/* From Date */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                    <FaCalendarAlt className="mr-2 text-blue-600 text-sm" />
                    From Date
                  </label>
                  <input
                    type="date"
                    className={`block w-full border rounded-lg shadow-sm py-2.5 px-4 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                      !selectedStore 
                        ? "border-gray-200 text-gray-400 cursor-not-allowed" 
                        : "border-blue-300 text-gray-700"
                    }`}
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
                    className={`block w-full border rounded-lg shadow-sm py-2.5 px-4 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                      !selectedStore 
                        ? "border-gray-200 text-gray-400 cursor-not-allowed" 
                        : "border-blue-300 text-gray-700"
                    }`}
                    value={dateInputs.toDate || ""}
                    onChange={(e) => handleInputChange("toDate", e.target.value)}
                    disabled={!selectedStore}
                  />
                </div>

                {/* Apply Filter Button */}
                <div className="md:col-span-2">
                  <motion.button
                    className={`w-full py-2.5 text-white rounded-lg flex items-center justify-center shadow-md ${
                      !selectedStore || !dateInputs.fromDate || !dateInputs.toDate
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    }`}
                    whileHover={
                      !selectedStore || !dateInputs.fromDate || !dateInputs.toDate
                        ? {}
                        : {
                            scale: 1.03,
                            boxShadow: "0px 4px 10px rgba(59, 130, 246, 0.3)",
                          }
                    }
                    whileTap={
                      !selectedStore || !dateInputs.fromDate || !dateInputs.toDate
                        ? {}
                        : { scale: 0.97 }
                    }
                    onClick={handleDateFilter}
                    disabled={!selectedStore || !dateInputs.fromDate || !dateInputs.toDate}
                  >
                    <FaFilter className="mr-2" />
                    Apply Filters
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards - Modern Dashboard Style with Data Visualization */}
      <div className="p-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <FaChartLine className="mr-2 text-blue-600" />
          Dashboard Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          {/* Customer Stats Card with Visualization */}
          <motion.div
            className="p-6 bg-white rounded-xl shadow-lg border border-blue-100 md:col-span-6 lg:col-span-3"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ duration: 0.4 }}
          >
            <h4 className="text-gray-800 font-semibold mb-4">Customer Overview</h4>
            
            <div className="flex flex-col sm:flex-row justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-500">Total Customers</p>
                <div className="text-3xl font-bold text-blue-700 mt-1">{totalCustomers.toLocaleString()}</div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Active</p>
                  <div className="flex items-end">
                    <span className="text-2xl font-bold text-green-600">{activeCustomers.toLocaleString()}</span>
                    <span className="text-sm text-green-600 ml-1 mb-1">({activePercentage}%)</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">Inactive</p>
                  <div className="flex items-end">
                    <span className="text-2xl font-bold text-amber-600">{inactiveCustomers.toLocaleString()}</span>
                    <span className="text-sm text-amber-600 ml-1 mb-1">({inactivePercentage}%)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress bar visualization */}
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-green-600"
                initial={{ width: 0 }}
                animate={{ width: `${activePercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              ></motion.div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Active ({activePercentage}%)</span>
              <span>Inactive ({inactivePercentage}%)</span>
            </div>
          </motion.div>

          {/* Bill Data */}
          <motion.div
            className="p-6 bg-white rounded-xl shadow-lg border border-blue-100 md:col-span-3 lg:col-span-3"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h4 className="text-gray-800 font-semibold mb-4">Billing Summary</h4>
            
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="text-center sm:text-left mb-4 sm:mb-0">
                <p className="text-sm text-gray-500">Total Bills</p>
                <div className="flex items-center mt-1">
                  <FaFileInvoiceDollar className="text-purple-600 text-2xl mr-2" />
                  <span className="text-3xl font-bold text-purple-700">{summaryData?.totalBills?.toLocaleString() || 0}</span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Amount</p>
                <div className="flex items-center mt-1">
                  <span className="text-3xl font-bold text-indigo-700">₹{summaryData?.totalAmount?.toLocaleString() || 0}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Total amount from all transactions</p>
              </div>
            </div>
            
           
          </motion.div>

        </div>
      </div>

      {/* Improved Toggle Switch for Inactive Customers */}
      <div className="flex justify-center mb-8 px-6">
        <motion.div
          className="bg-white p-4 rounded-xl shadow-md border border-blue-100 flex items-center space-x-4 w-full max-w-lg"
          whileHover={{ boxShadow: "0px 4px 15px rgba(59, 130, 246, 0.15)" }}
        >
          <div className="flex-1">
            <h4 className="font-medium text-gray-800">Inactive Customer Details</h4>
            <p className="text-sm text-gray-500">
              {showInactiveCustomerList
                ? "Currently showing inactive customers list"
                : "View complete details of inactive customers"}
            </p>
          </div>

          <motion.div
            className="w-14 h-7 flex items-center rounded-full p-1 cursor-pointer"
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
        </motion.div>
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
            className="overflow-hidden px-6 pb-6"
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                <h3 className="text-lg font-semibold text-blue-800">Inactive Customer List</h3>
                <p className="text-sm text-blue-600">Customers who haven't made purchases during the selected period</p>
              </div>
              <InactiveCustomerList
                fromDate={appliedFilters.fromDate}
                toDate={appliedFilters.toDate}
                storeId={appliedFilters.storeId}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SummaryReport;