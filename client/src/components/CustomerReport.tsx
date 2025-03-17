import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";
import { CustomerReportData } from "../utils/types";
import { motion } from "framer-motion";

const fetchCustomerReport = async (startDate: string, endDate: string, storeId?: number) => {
  const { data } = await api.get<CustomerReportData[]>(API_ROUTES.CUSTOMER_REPORT, {
    params: { startDate, endDate, storeId },
  });
  return data;
};

const CustomerReportPage: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState<number | undefined>(undefined);
  const [visibleItems, setVisibleItems] = useState(5);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customerReport", startDate, endDate, storeId],
    queryFn: () => fetchCustomerReport(startDate, endDate, storeId),
    enabled: false,
  });

  useEffect(() => {
    if (startDate && endDate) {
      refetch();
    }
  }, [startDate, endDate, storeId, refetch]);

  const showMore = () => {
    setVisibleItems((prev) => Math.min(prev + 5, data?.length || 0));
  };

  const showLess = () => {
    setVisibleItems(5);
  };

  const visibleData = data?.slice(0, visibleItems) || [];
  const hasMoreToShow = data && visibleItems < data.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-xl overflow-hidden"
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <h2 className="text-2xl font-bold text-white">Customer Report</h2>
        <p className="text-blue-100">View customer purchase history and details</p>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">Store ID</label>
            <input
              type="number"
              placeholder="Enter Store ID"
              value={storeId || ""}
              onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : undefined)}
              className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
            />
          </div>
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
            <p className="text-lg font-semibold">Error fetching report. Please try again.</p>
          </div>
        ) : data && data.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-800 font-medium">Showing {visibleItems} of {data.length} customers</p>
              
              <div className="flex border border-blue-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("card")}
                  className={`px-4 py-2 flex items-center ${viewMode === "card" 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-blue-700 hover:bg-blue-50"}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Card View
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 flex items-center ${viewMode === "table" 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-blue-700 hover:bg-blue-50"}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Table View
                </button>
              </div>
            </div>
            
            {viewMode === "card" ? (
              <div className="grid grid-cols-1 gap-8">
                {visibleData.map((customer, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <h3 className="text-xl font-bold text-white">{customer.customerName}</h3>
                        <div className="flex items-center gap-2 text-blue-100 mt-2 md:mt-0">
                          <span className="text-white font-medium">Total Purchases:</span>
                          <span className="bg-blue-400 bg-opacity-30 px-3 py-1 rounded-full text-white">
                            {customer.purchaseFrequency}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row justify-between mb-6">
                        <div className="mb-4 md:mb-0">
                          <span className="text-gray-500 text-sm">Contact Number</span>
                          <div className="font-medium text-gray-800 flex items-center mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {customer.mobileNo}
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 px-6 py-3 rounded-lg flex items-center">
                          <div className="mr-3">
                            <span className="text-gray-500 text-sm">Total Sales</span>
                            <div className="text-2xl font-bold text-blue-600">₹{customer.totalSales.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                          </div>
                          <div className="text-green-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Store Purchases</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          {customer.stores.map((store, storeIndex) => (
                            <div 
                              key={storeIndex} 
                              className={`flex justify-between items-center p-3 ${storeIndex !== customer.stores.length - 1 ? 'border-b border-gray-200 mb-2' : ''}`}
                            >
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                                <span className="font-medium">{store.storeName}</span>
                              </div>
                              <span className="font-bold text-blue-600">₹{store.sales.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <th className="text-left p-4">Customer Name</th>
                      <th className="text-left p-4">Mobile Number</th>
                      <th className="text-right p-4">Purchase Frequency</th>
                      <th className="text-right p-4">Total Sales</th>
                      <th className="text-left p-4">Store Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleData.map((customer, index) => (
                      <motion.tr 
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={index % 2 === 0 ? "bg-white" : "bg-blue-50"}
                      >
                        <td className="p-4 border-t border-gray-200 font-medium">{customer.customerName}</td>
                        <td className="p-4 border-t border-gray-200">{customer.mobileNo}</td>
                        <td className="p-4 border-t border-gray-200 text-right">{customer.purchaseFrequency}</td>
                        <td className="p-4 border-t border-gray-200 text-right font-medium text-blue-600">
                          ₹{customer.totalSales.toLocaleString(undefined, {maximumFractionDigits: 2})}
                        </td>
                        <td className="p-4 border-t border-gray-200">
                        <div className="bg-white rounded-md shadow-sm border border-gray-100 p-2">
                            {customer.stores.map((store, storeIndex) => (
                              <div 
                                key={storeIndex} 
                                className={`flex justify-between items-center p-2 ${storeIndex !== customer.stores.length - 1 ? 'border-b border-gray-100' : ''}`}
                              >
                                <span className="text-sm">{store.storeName}</span>
                                <span className="text-sm font-medium text-blue-600">₹{store.sales.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-center pt-6">
              {hasMoreToShow && (
                <button
                  onClick={showMore}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md transform transition hover:-translate-y-1"
                >
                  Show More
                </button>
              )}

              {visibleItems > 5 && (
                <button
                  onClick={showLess}
                  className="px-6 py-3 ml-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 shadow-md transform transition hover:-translate-y-1"
                >
                  Show Less
                </button>
              )}
            </div>
          </motion.div>
        ) : startDate && endDate ? (
          <div className="p-10 text-center bg-blue-50 rounded-xl">
            <p className="text-xl font-medium text-blue-800">No data found</p>
            <p className="mt-2 text-blue-600">Try adjusting the filters to see results</p>
          </div>
        ) : (
          <div className="p-10 text-center bg-blue-50 rounded-xl">
            <p className="text-xl font-medium text-blue-700">Please select start and end dates to view the report</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CustomerReportPage;