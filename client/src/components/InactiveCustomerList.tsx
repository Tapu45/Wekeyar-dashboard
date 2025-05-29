import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";
import {
  FaStore,
  FaUser,
  FaPhone,
  FaCalendar,
  FaSearch,
  FaSort,
  FaChevronDown,
  FaChevronRight,
  FaShoppingBag,
  FaChevronCircleRight,
} from "react-icons/fa";
import OrderForm from "./Orderform";
import { X } from "lucide-react";
import CustomerPurchaseHistory from "./CustomerPurchase";

interface InactiveCustomer {
  id: number;
  name: string;
  phone: string;
  lastPurchaseDate: string | null;
  storeName: string | null;
  status: string;
  lastCalledDate: string | null;
}

interface InactiveCustomerListProps {
  fromDate: string | null;
  toDate: string | null;
  storeId: number | null;
}

interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
}

// Separated API call function for better error handling
const fetchInactiveCustomers = async ({
  queryKey,
}: {
  queryKey: any;
}): Promise<PaginatedResponse<InactiveCustomer>> => {
  const [, fromDate, toDate, page, pageSize, searchTerm, sortField, sortDirection, storeId] = queryKey;
  
  try {
    const { data } = await api.get(API_ROUTES.INACTIVE_CUSTOMERS, {
      params: { 
        fromDate, 
        toDate,
        page,
        pageSize,
        search: searchTerm || undefined,
        sortField: sortField || undefined,
        sortDirection: sortDirection || undefined,
        storeId: storeId || undefined
      },
    });
    
    if (!data || !data.items) {
      throw new Error("Invalid API response: Missing 'items' property");
    }
    
    return {
      data: data.items.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        lastPurchaseDate: customer.lastPurchaseDate,
        storeName: customer.storeName,
        status: customer.status,
        lastCalledDate: customer.lastCalledDate || null,
      })),
      totalCount: data.totalCount,
      hasMore: data.hasMore
    };
  } catch (error) {
    console.error("Error fetching inactive customers:", error);
    throw error;
  }
};

const fetchCustomerPurchaseHistory = async (customerId: number) => {
  try {
    const route = API_ROUTES.CUSTOMER_PURCHASE_HISTORY.replace(
      ":customerId",
      customerId.toString()
    );
    const { data } = await api.get(route);
    return data;
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    throw error;
  }
};

const InactiveCustomerList: React.FC<InactiveCustomerListProps> = ({
  fromDate,
  toDate,
  storeId,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<InactiveCustomer | null>(null);

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 700);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset pagination when sort changes
  useEffect(() => {
    setPage(1);
  }, [sortField, sortDirection]);

  // Improved query configuration
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: [
      "inactiveCustomers", 
      fromDate, 
      toDate, 
      page, 
      pageSize, 
      debouncedSearchTerm,
      sortField,
      sortDirection,
      storeId,
    ],
    queryFn: fetchInactiveCustomers,
    enabled: !!fromDate && !!toDate,
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const handleCustomerClick = useCallback(
    async (customer: InactiveCustomer) => {
      if (expandedCustomerId === customer.id) {
        setExpandedCustomerId(null);
        setPurchaseHistory(null);
        return;
      }

      setExpandedCustomerId(customer.id);
      setIsHistoryLoading(true);

      try {
        const history = await fetchCustomerPurchaseHistory(customer.id);
        setPurchaseHistory(history);
      } catch (error) {
        console.error("Failed to fetch purchase history:", error);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [expandedCustomerId]
  );

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection]
  );

  const handleNextPage = useCallback(() => {
    if (data?.hasMore) {
      setPage(prevPage => prevPage + 1);
      window.scrollTo(0, 0);
    }
  }, [data?.hasMore]);

  const handlePrevPage = useCallback(() => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
      window.scrollTo(0, 0);
    }
  }, [page]);

  const safeData = useMemo(() => {
    return data || { data: [], totalCount: 0, hasMore: false };
  }, [data]);

  const isInitialLoading = isLoading && page === 1 && !data;

  return (
    <div className="flex flex-col w-full min-w-0">
      <AnimatePresence mode="wait">
        {!selectedCustomer ? (
          <motion.div
            key="customer-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg border border-blue-300 overflow-hidden shadow-lg"
          >
            {/* Header Section - Responsive */}
            <div className="p-3 sm:p-4 lg:p-6 border-b border-blue-200 bg-blue-700 text-white">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Inactive Customers</h3>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                {/* Search Input - Responsive */}
                <div className="relative flex-grow max-w-full sm:max-w-md">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-blue-300">
                    <FaSearch className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 bg-blue-600 border border-blue-500 rounded-md focus:ring-blue-300 focus:border-blue-300 text-white placeholder-blue-300 text-sm"
                    placeholder="Search by name, phone or store..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Refresh Button - Responsive */}
                <button 
                  onClick={() => refetch()}
                  className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center sm:justify-start w-full sm:w-auto text-sm"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isInitialLoading ? (
              <div className="flex flex-col items-center justify-center h-48 sm:h-64 p-4 sm:p-8">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 rounded-full"></div>
                  <motion.div
                    className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-700 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <motion.p
                  className="mt-4 sm:mt-6 text-blue-800 font-medium text-sm sm:text-base text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Loading inactive customers...
                </motion.p>
              </div>
            ) : error ? (
              <motion.div
                className="bg-white rounded-lg p-4 sm:p-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 font-medium text-sm sm:text-base">Failed to load inactive customers.</p>
                <button 
                  className="mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 shadow-md text-sm"
                  onClick={() => refetch()}
                >
                  Try Again
                </button>
              </motion.div>
            ) : (
              <div className="relative">
                {/* Sort indicator - Responsive */}
                <div className="bg-white p-2 sm:p-3 border-b border-blue-100 flex items-center justify-between sticky top-0 z-10">
                  <div className="text-xs sm:text-sm text-blue-700">
                    {sortField && (
                      <div className="flex items-center bg-blue-100 px-2 sm:px-3 py-1 rounded-md">
                        <span className="text-xs sm:text-sm">
                          Sorted by: <span className="font-medium capitalize">{sortField}</span>
                        </span>
                        <span className="ml-1">({sortDirection === "asc" ? "↑" : "↓"})</span>
                        <button
                          className="ml-2 text-blue-800 text-sm"
                          onClick={() => setSortField(null)}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loading overlay */}
                {isFetching && !isInitialLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-20">
                    <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-100 rounded-lg shadow-md">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-800 font-medium text-sm">Loading...</span>
                    </div>
                  </div>
                )}

                {/* Mobile Card View */}
                <div className="block md:hidden">
                  {safeData.data.length === 0 ? (
                    <div className="p-6 text-center text-blue-500">
                      No inactive customers found matching your search.
                    </div>
                  ) : (
                    <div className="divide-y divide-blue-100">
                      {safeData.data.map((customer, index) => (
                        <motion.div
                          key={customer.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.5) }}
                          className={`p-4 ${expandedCustomerId === customer.id ? "bg-blue-50" : "bg-white"}`}
                        >
                          {/* Customer Card */}
                          <div 
                            className="cursor-pointer"
                            onClick={() => handleCustomerClick(customer)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <span className="text-xs text-blue-600 mr-2">#{customer.id}</span>
                                  <h4 className="font-medium text-gray-900 text-sm">{customer.name}</h4>
                                  {expandedCustomerId === customer.id ? (
                                    <FaChevronDown className="ml-2 text-blue-600 text-xs" />
                                  ) : (
                                    <FaChevronRight className="ml-2 text-blue-600 text-xs" />
                                  )}
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center text-xs text-gray-600">
                                    <FaStore className="mr-1" />
                                    <span>{customer.storeName || "N/A"}</span>
                                  </div>
                                  <div className="flex items-center text-xs text-gray-600">
                                    <FaPhone className="mr-1" />
                                    <span>{customer.phone}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCustomer(customer);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                              >
                                Order
                              </button>
                            </div>
                            
                            {/* Dates */}
                            <div className="flex flex-wrap gap-2 text-xs">
                              <div className="flex items-center">
                                <FaCalendar className="mr-1 text-gray-400" />
                                <span className="text-gray-500 mr-1">Last Purchase:</span>
                                {customer.lastPurchaseDate ? (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                    {new Date(customer.lastPurchaseDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">Never</span>
                                )}
                              </div>
                              
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">Last Called:</span>
                                {customer.lastCalledDate ? (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                    {new Date(customer.lastCalledDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">Never</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expandable purchase history for mobile */}
                          <AnimatePresence>
                            {expandedCustomerId === customer.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3 pt-3 border-t border-blue-200"
                              >
                                <div className="font-medium text-blue-800 mb-2 flex items-center text-sm">
                                  <FaShoppingBag className="mr-2" />
                                  Purchase History
                                </div>
                                {isHistoryLoading ? (
                                  <div className="flex items-center justify-center p-3">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                    <span className="text-blue-600 text-sm">Loading...</span>
                                  </div>
                                ) : (
                                  <CustomerPurchaseHistory purchaseHistory={purchaseHistory} />
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-100">
                    <thead className="bg-blue-600 text-white sticky top-0 z-10">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700"
                          onClick={() => handleSort("storeName")}
                        >
                          <div className="flex items-center">
                            <FaStore className="mr-2 text-blue-200" />
                            Store
                            <FaSort className="ml-2 text-blue-200" />
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center">
                            <FaUser className="mr-2 text-blue-200" />
                            Customer
                            <FaSort className="ml-2 text-blue-200" />
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700"
                          onClick={() => handleSort("phone")}
                        >
                          <div className="flex items-center">
                            <FaPhone className="mr-2 text-blue-200" />
                            Phone
                            <FaSort className="ml-2 text-blue-200" />
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700"
                          onClick={() => handleSort("lastPurchaseDate")}
                        >
                          <div className="flex items-center">
                            <FaCalendar className="mr-2 text-blue-200" />
                            Last Purchase
                            <FaSort className="ml-2 text-blue-200" />
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700"
                          onClick={() => handleSort("lastCalledDate")}
                        >
                          <div className="flex items-center">
                            <FaCalendar className="mr-2 text-blue-200" />
                            Last Called
                            <FaSort className="ml-2 text-blue-200" />
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-100">
                      {safeData.data.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-blue-500">
                            No inactive customers found matching your search.
                          </td>
                        </tr>
                      ) : (
                        safeData.data.map((customer, index) => (
                          <React.Fragment key={customer.id}>
                            <motion.tr
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.5) }}
                              className={`${
                                expandedCustomerId === customer.id ? "bg-blue-100" : "hover:bg-blue-50"
                              }`}
                            >
                              <td 
                                className="px-3 lg:px-6 py-4 whitespace-nowrap cursor-pointer"
                                onClick={() => handleCustomerClick(customer)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.storeName || "N/A"}
                                </div>
                              </td>
                              <td 
                                className="px-3 lg:px-6 py-4 whitespace-nowrap cursor-pointer"
                                onClick={() => handleCustomerClick(customer)}
                              >
                                <div className="flex items-start flex-col">
                                  <div className="text-xs text-blue-600">#{customer.id}</div>
                                  <div className="text-sm font-medium text-gray-900 flex items-center">
                                    {customer.name}
                                    {expandedCustomerId === customer.id ? (
                                      <FaChevronDown className="ml-2 text-blue-600 text-xs" />
                                    ) : (
                                      <FaChevronRight className="ml-2 text-blue-600 text-xs" />
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td 
                                className="px-3 lg:px-6 py-4 whitespace-nowrap cursor-pointer"
                                onClick={() => handleCustomerClick(customer)}
                              >
                                <div className="text-sm text-gray-900">{customer.phone}</div>
                              </td>
                              <td 
                                className="px-3 lg:px-6 py-4 whitespace-nowrap cursor-pointer"
                                onClick={() => handleCustomerClick(customer)}
                              >
                                {customer.lastPurchaseDate ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    {new Date(customer.lastPurchaseDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                    Never
                                  </span>
                                )}
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap cursor-pointer">
                                {customer.lastCalledDate ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    {new Date(customer.lastCalledDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                    Never
                                  </span>
                                )}
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCustomer(customer);
                                  }}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                >
                                  Create Order
                                </motion.button>
                              </td>
                            </motion.tr>

                            {/* Expandable purchase history for desktop */}
                            <AnimatePresence>
                              {expandedCustomerId === customer.id && (
                                <motion.tr
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <td
                                    colSpan={6}
                                    className="px-3 lg:px-6 py-2 bg-blue-50 border-t border-b border-blue-100"
                                  >
                                    <div className="py-2">
                                      <div className="font-medium text-blue-800 mb-2 flex items-center">
                                        <FaShoppingBag className="mr-2" />
                                        Purchase History for {customer.name}
                                      </div>
                                      {isHistoryLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                          <span className="text-blue-600">Loading history...</span>
                                        </div>
                                      ) : (
                                        <CustomerPurchaseHistory purchaseHistory={purchaseHistory} />
                                      )}
                                    </div>
                                  </td>
                                </motion.tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination controls - Responsive */}
                {safeData.data.length > 0 && (
                  <div className="p-3 sm:p-4 border-t border-blue-100 bg-blue-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xs sm:text-sm text-blue-700 text-center sm:text-left">
                      Showing {pageSize * (page - 1) + 1} to {Math.min(pageSize * page, safeData.totalCount)} of {safeData.totalCount} customers
                    </div>
                    <div className="flex gap-2 justify-center sm:justify-end">
                      <button
                        onClick={handlePrevPage}
                        disabled={page === 1}
                        className={`px-3 sm:px-4 py-2 rounded flex items-center text-sm ${
                          page === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <FaChevronCircleRight className="mr-1 sm:mr-2 transform rotate-180" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={!safeData.hasMore}
                        className={`px-3 sm:px-4 py-2 rounded flex items-center text-sm ${
                          !safeData.hasMore
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                        <FaChevronCircleRight className="ml-1 sm:ml-2" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="order-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* Customer Info Header - Responsive */}
            <div className="mb-4 sm:mb-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center bg-white p-3 sm:p-4 rounded-lg shadow-md mb-4 gap-3 sm:gap-0"
              >
                <div className="flex items-center flex-1">
                  <div className="bg-blue-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <FaUser className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedCustomer.name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 text-sm gap-1 sm:gap-4">
                      <div className="flex items-center">
                        <FaStore className="mr-1" size={12} />
                        <span>{selectedCustomer.storeName || "N/A"}</span>
                      </div>
                      <div className="flex items-center">
                        <FaPhone className="mr-1" size={12} />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center text-sm"
                >
                  <X size={16} className="mr-1" />
                  Back to List
                </button>
              </motion.div>
              
              {/* Order Form - Responsive */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-3 sm:p-5 border-b border-gray-200">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                    <FaShoppingBag className="text-blue-600 mr-2" size={18} />
                    Create New Order
                  </h2>
                </div>
                <div className="p-3 sm:p-6">
                  <OrderForm
                    selectedCustomerId={selectedCustomer.id}
                    onOrderSaved={() => setSelectedCustomer(null)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InactiveCustomerList;