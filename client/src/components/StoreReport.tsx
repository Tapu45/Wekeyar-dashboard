import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";
import { StoreWiseSalesReport, StoreReport } from "../utils/types";
import { motion } from "framer-motion";

const fetchStoreWiseSalesReport = async (date: string, searchQuery: string): Promise<StoreWiseSalesReport> => {
  const { data } = await api.get<StoreWiseSalesReport>(API_ROUTES.STORE_SALES_REPORT, {
    params: { date, searchQuery },
  });
  return data;
};
const StoreWiseSalesReportPage: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Add state variables to track the applied filters
  const [appliedDate, setAppliedDate] = useState<string>(today);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["storeWiseSalesReport", appliedDate, appliedSearchQuery],
    queryFn: () => fetchStoreWiseSalesReport(appliedDate, appliedSearchQuery),
    enabled: !!appliedDate,
  });

  // Handle apply button click
  const handleApplyFilters = () => {
    setAppliedDate(selectedDate);
    setAppliedSearchQuery(searchQuery);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-xl overflow-hidden"
    >
      <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd"></path>
          </svg>
          <h2 className="text-2xl font-bold text-white">Store-Wise Sales Report</h2>
        </div>
        <p className="text-blue-100 mt-2 ml-11">View sales data and trends for each store</p>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end mb-6 justify-between">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
                <label className="font-medium text-gray-700">Select Date</label>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
              />
            </div>
            
            {/* Search Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                </svg>
                <label className="font-medium text-gray-700">Search Stores</label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by store name or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-2 pl-10 w-64 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Apply Button */}
          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-300 shadow-md"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"></path>
            </svg>
            Apply Filters
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-blue-600 font-medium">Loading report...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-red-600 bg-red-50 border border-red-200 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              <p className="text-lg font-semibold">Error fetching report. Please try again.</p>
            </div>
          </div>
        ) : data && data.storeReports.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between gap-3 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd"></path>
                </svg>
                <p className="text-blue-800 font-medium">
                  Report for {data.selectedDate} - {data.storeReports.length} stores
                </p>
              </div>
              {appliedSearchQuery && (
                <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-lg">
                  <span className="text-blue-700 text-sm">Search: "{appliedSearchQuery}"</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.storeReports.map((store: StoreReport, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"></path>
                      </svg>
                      <div>
                        <h3 className="text-lg font-bold text-white">{store.storeName}</h3>
                        <p className="text-blue-100 text-sm">{store.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                      </svg>
                      Sales Data
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 text-sm">Total Net Amount</span>
                        <span className="font-medium text-gray-800">
                          ₹{store.salesData.totalNetAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 text-sm">Total Bills</span>
                        <span className="font-medium text-gray-800">{store.salesData.totalBills}</span>
                      </div>
                      <div className="flex flex-col bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 text-sm">Total Items Sold</span>
                        <span className="font-medium text-gray-800">{store.salesData.totalItemsSold}</span>
                      </div>
                      <div className="flex flex-col bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-sm">Upload Status</span>
                          {store.salesData.isUploaded ? (
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                            </svg>
                          )}
                        </div>
                        
                      </div>
                    </div>

                    <h4 className="font-medium text-gray-700 mt-4 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                      </svg>
                      Trends
                    </h4>
                    <div className="space-y-3">
                    {[
                       { key: "previousDay", icon: "M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" },
                      //  { key: "previousWeek", icon: "M5 4a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z" },
                      //  { key: "previousMonth", icon: "M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
                       { key: "currentMonth", icon: "M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 2a1 1 0 000 2h8a1 1 0 100-2H5zm0 4a1 1 0 000 2h6a1 1 0 100-2H5zm0 4a1 1 0 000 2h4a1 1 0 100-2H5z", label: "This Month" },
                      ].map(({ key, icon }) => {
                        const trend = store.trends[key as keyof typeof store.trends];
                        const trendLabel = key === "currentMonth" 
                          ? "This Month" 
                          : key.replace("previous", "Previous ");
                        return (
                          <div
                            key={key}
                            className="flex justify-between items-center bg-blue-50 p-3 rounded-lg shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d={icon} clipRule="evenodd"></path>
                              </svg>
                              <span className="text-gray-600 capitalize">{trendLabel}</span>
                            </div>
                            <span className="font-medium text-gray-800">
                              ₹{trend.totalNetAmount.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {data?.storeReports.length === 0 && (
  <div className="p-10 text-center bg-blue-50 rounded-xl">
    <svg className="w-12 h-12 text-blue-600 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
    </svg>
    <p className="text-xl font-medium text-blue-800">No stores found</p>
    <p className="mt-2 text-blue-600">Try selecting a different date or search term</p>
  </div>
)}
          </motion.div>
        ) : (
          <div className="p-10 text-center bg-blue-50 rounded-xl">
            <svg className="w-12 h-12 text-blue-600 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
            <p className="text-xl font-medium text-blue-800">No data found</p>
            <p className="mt-2 text-blue-600">Try selecting a different date</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StoreWiseSalesReportPage;