import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";
import InactiveCustomerList from "./InactiveCustomerList";
import { FaUsers, FaUserCheck, FaUserTimes, FaCalendarAlt, FaFilter, FaChevronDown } from "react-icons/fa";

const socket = io("http://localhost:4000"); // Replace with your server URL

interface SummaryData {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
}

const SummaryReport: React.FC = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showInactiveCustomerList, setShowInactiveCustomerList] = useState(false);
  
  // Form state for date inputs
  const [dateInputs, setDateInputs] = useState({
    fromDate: null as string | null,
    toDate: null as string | null
  });
  
  // Applied filter values that trigger query
  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: null as string | null,
    toDate: null as string | null
  });

  // Fetch summary data - only depends on appliedFilters, not the input state
  const { data: summaryData, isLoading, error, refetch } = useQuery<SummaryData>({
    queryKey: ["summary", appliedFilters.fromDate, appliedFilters.toDate],
    queryFn: async () => {
      const { data } = await api.get(API_ROUTES.SUMMARY, {
        params: { 
          fromDate: appliedFilters.fromDate, 
          toDate: appliedFilters.toDate 
        },
      });
      return data;
    },
  });

  const handleCopyToTelecalling = (customers: any[]) => {
    console.log("Selected customers to copy:", customers);

    // Emit the event to the server
    socket.emit("copyToTelecalling", customers);

    setShowSuccessMessage(true); // Show success message
    setTimeout(() => setShowSuccessMessage(false), 3000); // Hide message after 3 seconds
  };

  const handleInputChange = (field: 'fromDate' | 'toDate', value: string) => {
    setDateInputs(prev => ({
      ...prev,
      [field]: value || null
    }));
  };

  const handleDateFilter = () => {
    // Apply the filter values from inputs to the actual query parameters
    setAppliedFilters({
      fromDate: dateInputs.fromDate,
      toDate: dateInputs.toDate
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
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  // Enhanced success message animation
  const successVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.5, 
        ease: "easeOut" 
      }
    },
    exit: { 
      opacity: 0, 
      x: 50, 
      transition: { 
        duration: 0.3, 
        ease: "easeIn" 
      } 
    }
  };

  // Loading animation
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg border border-blue-200">
        <div className="relative">
          {/* Outer rotating ring */}
          <motion.div
            className="w-20 h-20 border-4 border-blue-300 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner pulsating circle */}
          <motion.div
            className="absolute top-2 left-2 w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <motion.p
          className="mt-6 text-blue-800 font-semibold text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Fetching summary data, please wait...
        </motion.p>
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
            whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(59, 130, 246, 0.3)" }}
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
      className="p-6 bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-lg border border-blue-100"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex justify-between items-center mb-6">
        <motion.h2 
          className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-600"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          Summary Report
        </motion.h2>
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div 
              className="px-5 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-800 rounded-md flex items-center shadow-md border border-green-200"
              variants={successVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Customers successfully copied to Telecalling!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date Filters */}
      <motion.div 
        className="flex flex-wrap gap-4 mb-8 p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center text-blue-700 mr-2">
          <FaCalendarAlt className="mr-2 text-blue-600" />
          <span className="font-medium">Filter by date:</span>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-blue-700 mb-1">From Date</label>
          <div className="relative">
            <input
              type="date"
              className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={dateInputs.fromDate || ""}
              onChange={(e) => handleInputChange('fromDate', e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-blue-700 mb-1">To Date</label>
          <div className="relative">
            <input
              type="date"
              className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={dateInputs.toDate || ""}
              onChange={(e) => handleInputChange('toDate', e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-end">
          <motion.button
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 flex items-center shadow-md"
            whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(59, 130, 246, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDateFilter}
          >
            <FaFilter className="mr-2" />
            Apply Filter
          </motion.button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="p-6 bg-white rounded-lg shadow-md border border-blue-200 flex items-center"
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
          className="p-6 bg-white rounded-lg shadow-md border border-blue-200 flex items-center"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-full mr-5 shadow-md">
            <FaUserCheck className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-800">Active Customers</h3>
            <motion.p 
              className="text-3xl font-bold text-blue-500"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {activeCustomers.toLocaleString()}
            </motion.p>
          </div>
        </motion.div>
        
        <motion.div
          className="p-6 bg-white rounded-lg shadow-md border border-blue-200 flex items-center cursor-pointer group relative overflow-hidden"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={handleShowInactiveCustomers}
        >
          <motion.div 
            className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100"
            transition={{ duration: 0.3 }}
          />
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 group-hover:from-blue-500 group-hover:to-blue-600 text-white p-4 rounded-full mr-5 shadow-md transition-colors z-10">
            <FaUserTimes className="text-xl" />
          </div>
          <div className="z-10">
            <h3 className="text-lg font-bold text-blue-800 flex items-center">
              Inactive Customers
              <motion.div
                animate={{ rotate: showInactiveCustomerList ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="ml-2 text-blue-500"
              >
                <FaChevronDown />
              </motion.div>
            </h3>
            <motion.p 
              className="text-3xl font-bold text-blue-400"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {inactiveCustomers.toLocaleString()}
            </motion.p>
          </div>
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
                opacity: { duration: 0.3, delay: 0.1 }
              }
            }}
            exit={{ 
              opacity: 0, 
              height: 0,
              transition: { 
                height: { duration: 0.4, ease: "easeIn" },
                opacity: { duration: 0.2 }
              }
            }}
            className="overflow-hidden"
          >
            <InactiveCustomerList 
              onCopyToTelecalling={handleCopyToTelecalling} 
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