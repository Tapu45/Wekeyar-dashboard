import React, { useState, useCallback, useMemo } from "react";
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
  FaCalendarDay,
  FaReceipt,
  FaPills,
} from "react-icons/fa";


interface InactiveCustomer {
  id: number;
  name: string;
  phone: string;
  lastPurchaseDate: string | null;
  storeName: string | null;
  status: string;
}

interface InactiveCustomerListProps {
  fromDate: string | null;
  toDate: string | null;
}

const fetchInactiveCustomers = async ({
  queryKey,
}: {
  queryKey: any;
}): Promise<InactiveCustomer[]> => {
  const [, fromDate, toDate] = queryKey;
  const { data } = await api.get(API_ROUTES.INACTIVE_CUSTOMERS, {
    params: { fromDate, toDate },
  });

  return data.map((customer: any) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    lastPurchaseDate: customer.lastPurchaseDate,
    storeName: customer.storeName,
    status: customer.status,
  }));
};

const fetchCustomerPurchaseHistory = async (customerId: number) => {
  const route = API_ROUTES.CUSTOMER_PURCHASE_HISTORY.replace(
    ":customerId",
    customerId.toString()
  );
  const { data } = await api.get(route);
  return data;
};

// Purchase history component for better code organization
const CustomerPurchaseHistory = ({
  purchaseHistory,
}: {
  purchaseHistory: any;
}) => {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);

  const toggleMonth = useCallback((month: string) => {
    setExpandedMonth((prev) => (prev === month ? null : month));
    setExpandedDate(null);
    setExpandedBill(null);
  }, []);

  const toggleDate = useCallback((date: string) => {
    setExpandedDate((prev) => (prev === date ? null : date));
    setExpandedBill(null);
  }, []);

  const toggleBill = useCallback((bill: string) => {
    setExpandedBill((prev) => (prev === bill ? null : bill));
  }, []);

  if (!purchaseHistory || Object.keys(purchaseHistory).length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No purchase history available
      </div>
    );
  }

  return (
    <div className="mt-2 bg-blue-50 rounded-lg p-2 text-sm">
      {Object.entries(purchaseHistory).map(([month, data]: [string, any]) => (
        <div
          key={month}
          className="mb-2 border border-blue-200 rounded-lg overflow-hidden"
        >
          <button
            className="w-full text-left p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-t-lg font-medium flex justify-between items-center"
            onClick={() => toggleMonth(month)}
          >
            <div className="flex items-center">
              <FaShoppingBag className="mr-2" />
              <span>{month}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-blue-100">
                Bills: {data.totalBills} | ₹{data.totalAmount}
              </span>
              {expandedMonth === month ? <FaChevronDown /> : <FaChevronRight />}
            </div>
          </button>

          <AnimatePresence>
            {expandedMonth === month && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-white px-2">
                  {Object.entries(data.dailyData).map(
                    ([day, dayData]: [string, any]) => (
                      <div
                        key={day}
                        className="my-2 border border-blue-100 rounded-lg overflow-hidden"
                      >
                        <button
                          className="w-full text-left p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-t-lg font-medium flex justify-between items-center"
                          onClick={() => toggleDate(day)}
                        >
                          <div className="flex items-center">
                            <FaCalendarDay className="mr-2" />
                            <span>{day}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-4">₹{dayData.totalAmount}</span>
                            {expandedDate === day ? (
                              <FaChevronDown />
                            ) : (
                              <FaChevronRight />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {expandedDate === day && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white p-1">
                                {dayData.bills.map((bill: any) => (
                                  <div
                                    key={bill.billNo}
                                    className="my-1 border border-blue-50 rounded-lg overflow-hidden"
                                  >
                                    <button
                                      className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-t-lg flex justify-between items-center"
                                      onClick={() => toggleBill(bill.billNo)}
                                    >
                                      <div className="flex items-center">
                                        <FaReceipt className="mr-2 text-blue-500" />
                                        <span>Bill #{bill.billNo}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <span className="mr-4 font-medium">
                                          ₹{bill.amount}
                                        </span>
                                        {expandedBill === bill.billNo ? (
                                          <FaChevronDown className="text-blue-500" />
                                        ) : (
                                          <FaChevronRight className="text-blue-500" />
                                        )}
                                      </div>
                                    </button>

                                    <AnimatePresence>
                                      {expandedBill === bill.billNo && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{
                                            height: "auto",
                                            opacity: 1,
                                          }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.1 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="p-2 bg-white">
                                            <div className="text-gray-500 mb-1 ml-2 text-xs">
                                              Medicines purchased:
                                            </div>
                                            <div className="overflow-x-auto">
                                              <table className="min-w-full divide-y divide-gray-100 text-xs">
                                                <thead>
                                                  <tr className="bg-gray-50">
                                                    <th className="px-2 py-1 text-left text-gray-500">
                                                      Medicine
                                                    </th>
                                                    <th className="px-2 py-1 text-right text-gray-500">
                                                      Qty
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {bill.medicines.map(
                                                    (
                                                      medicine: any,
                                                      index: number
                                                    ) => (
                                                      <tr
                                                        key={index}
                                                        className="hover:bg-gray-50"
                                                      >
                                                        <td className="px-2 py-1 flex items-center">
                                                          <FaPills className="mr-2 text-blue-400" />
                                                          {medicine.name}
                                                        </td>
                                                        <td className="px-2 py-1 text-right">
                                                          {medicine.quantity}
                                                        </td>
                                                      </tr>
                                                    )
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

const InactiveCustomerList: React.FC<InactiveCustomerListProps> = ({
  fromDate,
  toDate,
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["inactiveCustomers", fromDate, toDate],
    queryFn: fetchInactiveCustomers,
    enabled: !!fromDate && !!toDate,
  });

  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(
    null
  );
  const [purchaseHistory, setPurchaseHistory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<InactiveCustomer | null>(null);

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

  const handleOrderClick = (customer: InactiveCustomer) => {
    setSelectedCustomer(customer); // Open the OrderForm for the selected customer
  };

 

  // Memoize the filtered data
  const filteredData = useMemo(
    () =>
      data?.filter(
        (customer) =>
          (customer.name &&
            customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.phone && customer.phone.includes(searchTerm)) ||
          (customer.storeName &&
            customer.storeName.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [data, searchTerm]
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

  // Memoize the sorted data
  const sortedData = useMemo(() => {
    if (!filteredData) return [];

    const result = [...filteredData];
    if (sortField) {
      result.sort((a: any, b: any) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Special handling for dates
        if (sortField === "lastPurchaseDate") {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [filteredData, sortField, sortDirection]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg p-8 shadow-lg">
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
    );
  }

  if (error) {
    return (
      <motion.div
        className="text-center p-6 bg-white rounded-lg border border-blue-200 shadow-lg"
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
        <button className="mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 shadow-md">
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    
    <motion.div
      className="bg-white rounded-lg border border-blue-300 overflow-hidden shadow-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
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

          <div className="flex items-center"></div>
        </div>
      </div>

      <div>
        {/* Select All Button */}
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

        {/* Customer List Table */}
        <div>
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
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              {sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-blue-500"
                  >
                    No inactive customers found matching your search.
                  </td>
                </tr>
              ) : (
                sortedData.map((customer, index) => (
                  <React.Fragment key={customer.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={`${
                        expandedCustomerId === customer.id
                          ? "bg-blue-100"
                          : "hover:bg-blue-50"
                      } cursor-pointer`}
                      onClick={() => handleCustomerClick(customer)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.storeName || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                     
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            customer.status === "inactive"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {customer.status === "inactive" ? "Inactive" : "Sent"}
                        </span>
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
      </div>
    </motion.div>
  );
  
  
};

export default InactiveCustomerList;
