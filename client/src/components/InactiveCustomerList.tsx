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
 // Add null checks for data and data.items
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
      // Reset to first page when search changes
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
      storeId,// Assuming storeId is not needed for this query
    ],
    queryFn: fetchInactiveCustomers,
    enabled: !!fromDate && !!toDate,
    // Using better cache strategy with proper initial data
    placeholderData: (previousData) => previousData,
    // Reduce stale time to ensure more frequent updates
    staleTime: 2 * 60 * 1000, // Cache results for 2 minutes
    retry: 1, // Retry once on failure
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
      // Scroll to top when paging
      window.scrollTo(0, 0);
    }
  }, [data?.hasMore]);

  const handlePrevPage = useCallback(() => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
      // Scroll to top when paging
      window.scrollTo(0, 0);
    }
  }, [page]);

  // Better handling for empty data states
  const safeData = useMemo(() => {
    return data || { data: [], totalCount: 0, hasMore: false };
  }, [data]);

  // Explicitly handle loading state for initial load only
  const isInitialLoading = isLoading && page === 1 && !data;

  return (
    <div className="flex flex-col">
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
            <div className="p-4 border-b border-blue-200 bg-blue-700 text-white">
              <h3 className="text-xl font-bold mb-4">Inactive Customers</h3>

              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-blue-300">
                    <FaSearch />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 bg-blue-600 border border-blue-500 rounded-md focus:ring-blue-300 focus:border-blue-300 text-white placeholder-blue-300"
                    placeholder="Search by name, phone or store..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Add refresh button */}
                <button 
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {isInitialLoading ? (
              <div className="flex flex-col items-center justify-center h-64 p-8">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                  <motion.div
                    className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-700 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <motion.p
                  className="mt-6 text-blue-800 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Loading inactive customers...
                </motion.p>
              </div>
            ) : error ? (
              <motion.div
                className="bg-white rounded-lg p-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <svg
                  className="w-12 h-12 text-red-500 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-600 font-medium">
                  Failed to load inactive customers.
                </p>
                <button 
                  className="mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 shadow-md"
                  onClick={() => refetch()}
                >
                  Try Again
                </button>
              </motion.div>
            ) : (
              <div>
                {/* Sort indicator */}
                <div className="bg-white p-2 border-b border-blue-100 flex items-center justify-between sticky top-0 z-10">
                  <div className="text-sm text-blue-700">
                    {sortField && (
                      <div className="flex items-center bg-blue-100 px-3 py-1 rounded-md">
                        <span>
                          Sorted by:{" "}
                          <span className="font-medium capitalize">{sortField}</span>
                        </span>
                        <span className="ml-1">
                          ({sortDirection === "asc" ? "↑" : "↓"})
                        </span>
                        <button
                          className="ml-2 text-blue-800"
                          onClick={() => {
                            setSortField(null);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loading overlay for subsequent pages */}
                {isFetching && !isInitialLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-20">
                    <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-lg shadow-md">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-800 font-medium">Loading...</span>
                    </div>
                  </div>
                )}

                {/* Customer List Table */}
                <div className="relative">
                  <table className="min-w-full divide-y divide-blue-100">
                    <thead className="bg-blue-600 text-white sticky top-0 z-10">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700"
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
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700"
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
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700"
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
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700"
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
      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700"
      onClick={() => handleSort("lastCalledDate")} // Add sorting for Last Called Date
    >
      <div className="flex items-center">
        <FaCalendar className="mr-2 text-blue-200" />
        Last Called
        <FaSort className="ml-2 text-blue-200" />
      </div>
    </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-100">
                      {safeData.data.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-blue-500"
                          >
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
                                expandedCustomerId === customer.id
                                  ? "bg-blue-100"
                                  : "hover:bg-blue-50"
                              }`}
                            >
                              <td 
                                className="px-6 py-4 whitespace-nowrap cursor-pointer"
                                onClick={() => handleCustomerClick(customer)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.storeName || "N/A"}
                                </div>
                              </td>
                              <td 
                                className="px-6 py-4 whitespace-nowrap cursor-pointer"
                                onClick={() => handleCustomerClick(customer)}
                              >
                                <div className="flex items-start flex-col">
                                  <div className="text-xs text-blue-600">
                                    #{customer.id}
                                  </div>
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
                                className="px-6 py-4 whitespace-nowrap cursor-pointer"
                                onClick={() => handleCustomerClick(customer)}
                              >
                                <div className="text-sm text-gray-900">
                                  {customer.phone}
                                </div>
                              </td>
                              <td 
                                className="px-6 py-4 whitespace-nowrap cursor-pointer"
                                onClick={() => handleCustomerClick(customer)}
                              >
                                {customer.lastPurchaseDate ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    {new Date(
                                      customer.lastPurchaseDate
                                    ).toLocaleDateString("en-US", {
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
                              <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
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
                              <td className="px-6 py-4 whitespace-nowrap">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCustomer(customer);
                                  }}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Create Order
                                </motion.button>
                              </td>
                            </motion.tr>

                            {/* Expandable purchase history */}
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
                                    className="px-6 py-2 bg-blue-50 border-t border-b border-blue-100"
                                  >
                                    <div className="py-2">
                                      <div className="font-medium text-blue-800 mb-2 flex items-center">
                                        <FaShoppingBag className="mr-2" />
                                        Purchase History for {customer.name}
                                      </div>

                                      {isHistoryLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                          <span className="text-blue-600">
                                            Loading history...
                                          </span>
                                        </div>
                                      ) : (
                                        <CustomerPurchaseHistory
                                          purchaseHistory={purchaseHistory}
                                        />
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
                
                {/* Pagination controls */}
                {safeData.data.length > 0 && (
                  <div className="p-4 border-t border-blue-100 bg-blue-50 flex justify-between items-center">
                    <div className="text-sm text-blue-700">
                      Showing {pageSize * (page - 1) + 1} to {Math.min(pageSize * page, safeData.totalCount)} of {safeData.totalCount} customers
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={page === 1}
                        className={`px-4 py-2 rounded flex items-center ${
                          page === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <FaChevronCircleRight className="mr-2 transform rotate-180" />
                        Previous
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={!safeData.hasMore}
                        className={`px-4 py-2 rounded flex items-center ${
                          !safeData.hasMore
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        Next
                        <FaChevronCircleRight className="ml-2" />
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
            {/* Customer Info Header */}
            <div className="mb-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center bg-white p-4 rounded-lg shadow-md mb-4"
              >
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <FaUser className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedCustomer.name}</h3>
                  <div className="flex items-center text-gray-600">
                    <FaStore className="mr-1" size={14} />
                    <span className="mr-4">{selectedCustomer.storeName || "N/A"}</span>
                    <FaPhone className="mr-1" size={14} />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="ml-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center"
                >
                  <X size={16} className="mr-1" />
                  Back to List
                </button>
              </motion.div>
              
              {/* Order Form */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <FaShoppingBag className="text-blue-600 mr-2" size={20} />
                    Create New Order
                  </h2>
                </div>
                <div className="p-6">
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