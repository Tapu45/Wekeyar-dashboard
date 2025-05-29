import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react"; 
import api, { API_ROUTES } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  User, 
  Phone, 
  FileText, 
  ArrowDown, 
  ArrowUp, 
  ShoppingCart, 
  RotateCcw,
  Pill, 
  Package,
} from "lucide-react";
import { exportDetailedToExcel, exportNormalToExcel } from "../utils/Exportutils";
import { FaRupeeSign } from "react-icons/fa";

const fetchCustomerReport = async (startDate: string, endDate: string, search: string, storeId: number | null) => {
  const isBillNo = /^[A-Z]+\/\d+/.test(search);
  const { data } = await api.get(API_ROUTES.CUSTOMER_REPORT, {
    params: { 
      startDate, 
      endDate, 
      search: isBillNo ? undefined : search, 
      billNo: isBillNo ? search : undefined,
      storeId: storeId || undefined,
    },
  });
  return data;
};

const getUserRole = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    return decoded.role;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

const CustomerReportPage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedBill, setExpandedBill] = useState(null);
  const [sortField, setSortField] = useState("customerName");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [stores, setStores] = useState<{ id: number; storeName: string }[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customerReport", startDate, endDate, search, selectedStore],
    queryFn: () => fetchCustomerReport(startDate, endDate, search, selectedStore),
    enabled: false,
  });

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

  useEffect(() => {
    if (startDate && endDate && selectedStore !== null) {
      refetch();
    }
  }, [startDate, endDate, search, selectedStore, refetch]);

  const toggleCustomerExpand = (customerIndex: number) => {
    setExpandedCustomer((prev) => (prev === customerIndex ? null : customerIndex));
    setExpandedDate(null);
    setExpandedBill(null);
  };

  const toggleDateExpand = (date: string | null) => {
    setExpandedDate((prev) => (prev === date ? null : date));
    setExpandedBill(null);
  };

  const toggleBillExpand = (billNo: null) => {
    setExpandedBill((prev) => (prev === billNo ? null : billNo));
  };

  const handleSort = (field: React.SetStateAction<string>) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExport = (type: "normal" | "detailed", format: "excel") => {
    const storeName = selectedStore === 0 
      ? "All Stores" 
      : stores.find(store => store.id === selectedStore)?.storeName || "";
  
    const filters = {
      startDate,
      endDate,
      store: storeName,
      search: search || undefined
    };
  
    if (type === "normal" && format === "excel") {
      exportNormalToExcel(data, filters);
    } else if (type === "detailed" && format === "excel") {
      exportDetailedToExcel(data, filters);
    }
  };

  // Responsive Export Dropdown Component
  const ExportDropdown = () => (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 sm:px-4 py-2 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <span className="hidden sm:inline">Export Options</span>
          <span className="sm:hidden">Export</span>
          <ChevronDown className="ml-1 sm:ml-2 -mr-1 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
        </Menu.Button>
      </div>
  
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 sm:w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleExport("normal", "excel")}
                  className={`${
                    active ? "bg-blue-100 text-blue-900" : "text-gray-700"
                  } group flex items-center px-4 py-2 text-sm w-full`}
                >
                  Summary report
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleExport("detailed", "excel")}
                  className={`${
                    active ? "bg-green-100 text-green-900" : "text-gray-700"
                  } group flex items-center px-4 py-2 text-sm w-full`}
                >
                  Detailed report
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  const sortedData = data ? [...data].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    if (sortField === "customerName") {
      return a.customerName.localeCompare(b.customerName) * direction;
    } else if (sortField === "mobileNo") {
      return a.mobileNo.localeCompare(b.mobileNo) * direction;
    } else if (sortField === "totalBills") {
      return (a.totalBills - b.totalBills) * direction;
    } else if (sortField === "totalAmount") {
      return (a.totalAmount - b.totalAmount) * direction;
    }
    return 0;
  }) : [];

  // Animation variants
  const tableRowVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2 } }
  };

  const childVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  // Responsive Shimmer loading effect
  const LoadingShimmer = () => (
    <div className="w-full space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-12 sm:h-16 bg-blue-100 rounded-md flex items-center px-2 sm:px-4">
            <div className="w-1/4 h-4 sm:h-6 bg-blue-200 rounded mr-2 sm:mr-4"></div>
            <div className="w-1/4 h-4 sm:h-6 bg-blue-200 rounded mr-2 sm:mr-4"></div>
            <div className="w-1/6 h-4 sm:h-6 bg-blue-200 rounded mr-2 sm:mr-4"></div>
            <div className="w-1/6 h-4 sm:h-6 bg-blue-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const userRole = getUserRole();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden bg-white shadow-xl rounded-xl"
    >
      {/* Header Section - Responsive */}
      <div className="p-3 sm:p-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">Customer Report</h2>
            <p className="text-blue-100 text-sm sm:text-base mt-1">
              <span className="hidden sm:inline">
                View detailed analytics of customer purchases, including sales and return bills.
              </span>
              <span className="sm:hidden">
                Customer analytics & purchase details
              </span>
            </p>
          </div>
          {userRole === "admin" && <ExportDropdown />}
        </div>
      </div>
  
      {/* Filters and Data Table */}
      <div className="p-3 sm:p-6">
        {/* Filters - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {/* Store Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-blue-700 mb-1">Select Store</label>
            <select
              className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              value={selectedStore !== null ? selectedStore : ""}
              onChange={(e) => setSelectedStore(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select Store</option>
              <option value={0}>All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.storeName}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-blue-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              disabled={selectedStore === null}
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-blue-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              disabled={selectedStore === null}
            />
          </div>

          {/* Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-blue-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Mobile, or Bill No"
              className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              disabled={selectedStore === null}
            />
          </div>
        </div>
  
        {/* Data Display - Responsive */}
        {isLoading ? (
          <LoadingShimmer />
        ) : error ? (
          <div className="p-4 sm:p-6 bg-red-50 rounded-lg border border-red-200 text-red-700 flex items-center justify-center">
            <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Error fetching data. Please try again.</span>
          </div>
        ) : sortedData && sortedData.length > 0 ? (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-hidden rounded-lg border border-blue-100 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-700 text-white">
                    <th 
                      className="px-6 py-4 text-left cursor-pointer" 
                      onClick={() => handleSort("customerName")}
                    >
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-2" /> Customer Name
                        {sortField === "customerName" && (
                          sortDirection === "asc" ? 
                          <ArrowUp className="h-4 w-4 ml-1" /> : 
                          <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left cursor-pointer" 
                      onClick={() => handleSort("mobileNo")}
                    >
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-2" /> Mobile Number
                        {sortField === "mobileNo" && (
                          sortDirection === "asc" ? 
                          <ArrowUp className="h-4 w-4 ml-1" /> : 
                          <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left cursor-pointer" 
                      onClick={() => handleSort("totalBills")}
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" /> Total Bills
                        {sortField === "totalBills" && (
                          sortDirection === "asc" ? 
                          <ArrowUp className="h-4 w-4 ml-1" /> : 
                          <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left cursor-pointer" 
                      onClick={() => handleSort("totalAmount")}
                    >
                      <div className="flex items-center">
                        <FaRupeeSign className="h-5 w-5 mr-2" /> Total Amount
                        {sortField === "totalAmount" && (
                          sortDirection === "asc" ? 
                          <ArrowUp className="h-4 w-4 ml-1" /> : 
                          <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((customer, customerIndex) => (
                    <React.Fragment key={customerIndex}>
                      {/* Customer Row */}
                      <tr 
                        onClick={() => toggleCustomerExpand(customerIndex)}
                        className={`border-b border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors ${expandedCustomer === customerIndex ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {customer.customerName}
                            <div className="ml-2">
                              {expandedCustomer === customerIndex ? 
                                <ChevronUp className="h-5 w-5 text-blue-500" /> : 
                                <ChevronDown className="h-5 w-5 text-blue-500" />
                              }
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{customer.mobileNo}</td>
                        <td className="px-6 py-4">{customer.totalBills}</td>
                        <td className="px-6 py-4 font-semibold">₹{customer.totalAmount.toLocaleString()}</td>
                      </tr>

                      {/* Expanded Customer Details */}
                      <AnimatePresence>
                        {expandedCustomer === customerIndex && (
                          <motion.tr 
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-blue-50"
                          >
                            <td colSpan={4} className="px-0 py-0">
                              <motion.div 
                                variants={childVariants}
                                className="pl-4 pr-4 pt-2 pb-4"
                              >
                                <div className="space-y-3">
                                  {customer.dates.map((date: { date: string; totalAmount: number; salesBills: any[]; returnBills: any[] }) => (
                                    <div key={date.date} className="rounded-lg border border-blue-200 overflow-hidden">
                                      <div 
                                        onClick={() => toggleDateExpand(date.date)}
                                        className={`flex justify-between items-center px-4 py-3 cursor-pointer ${expandedDate === date.date ? 'bg-blue-100' : 'bg-white'}`}
                                      >
                                        <div className="flex items-center">
                                          <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                                          <span className="font-medium">{date.date}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-blue-800 mr-4">₹{date.totalAmount.toLocaleString()}</span>
                                          {expandedDate === date.date ? 
                                            <ChevronUp className="h-5 w-5 text-blue-500" /> : 
                                            <ChevronDown className="h-5 w-5 text-blue-500" />
                                          }
                                        </div>
                                      </div>

                                      {/* Expanded Date Details */}
                                      <AnimatePresence>
                                        {expandedDate === date.date && (
                                          <motion.div 
                                            variants={childVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            className="px-4 py-3 bg-white border-t border-blue-100"
                                          >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              {/* Sales Bills */}
                                              <div className="rounded-lg border border-blue-100 overflow-hidden">
                                                <div className="bg-blue-600 text-white px-4 py-2 font-medium flex items-center">
                                                  <ShoppingCart className="h-5 w-5 mr-2" />
                                                  Sales Bills
                                                </div>
                                                
                                                <div className="divide-y divide-blue-100">
                                                  {date.salesBills.map((bill) => (
                                                    <div key={bill.billNo}>
                                                      <div 
                                                        onClick={() => toggleBillExpand(bill.billNo)}
                                                        className={`flex justify-between items-center px-4 py-3 cursor-pointer ${expandedBill === bill.billNo ? 'bg-blue-50' : ''}`}
                                                      >
                                                        <div className="flex items-center">
                                                          <FileText className="h-5 w-5 text-blue-500 mr-2" />
                                                          <span>Bill: {bill.billNo}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                          <span className="font-medium text-blue-800 mr-2">₹{bill.amount.toLocaleString()}</span>
                                                          {expandedBill === bill.billNo ? 
                                                            <ChevronUp className="h-5 w-5 text-blue-500" /> : 
                                                            <ChevronDown className="h-5 w-5 text-blue-500" />
                                                          }
                                                        </div>
                                                      </div>

                                                      {/* Expanded Bill Details */}
                                                      <AnimatePresence>
                                                        {expandedBill === bill.billNo && (
                                                          <motion.div 
                                                            variants={childVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="exit"
                                                            className="px-4 py-3 bg-blue-50 border-t border-blue-100"
                                                          >
                                                            <div className="space-y-2">
                                                              {bill.medicines.map((medicine: any, index: number) => (
                                                                <div key={index} className="flex justify-between items-center px-2 py-1 bg-white rounded border border-blue-100">
                                                                  <div className="flex items-center">
                                                                    <Pill className="h-4 w-4 text-blue-500 mr-2" />
                                                                    <span>{medicine.name}</span>
                                                                  </div>
                                                                  <div className="flex items-center">
                                                                    <Package className="h-4 w-4 text-blue-500 mr-1" />
                                                                    <span>{medicine.quantity}</span>
                                                                  </div>
                                                                </div>
                                                              ))}
                                                            </div>
                                                          </motion.div>
                                                        )}
                                                      </AnimatePresence>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>

                                              {/* Return Bills */}
                                              <div className="rounded-lg border border-blue-100 overflow-hidden">
                                                <div className="bg-blue-600 text-white px-4 py-2 font-medium flex items-center">
                                                  <RotateCcw className="h-5 w-5 mr-2" />
                                                  Return Bills
                                                </div>
                                                
                                                <div className="divide-y divide-blue-100">
                                                  {date.returnBills.length > 0 ? (
                                                    date.returnBills.map((bill) => (
                                                      <div key={bill.billNo}>
                                                        <div 
                                                          onClick={() => toggleBillExpand(bill.billNo)}
                                                          className={`flex justify-between items-center px-4 py-3 cursor-pointer ${expandedBill === bill.billNo ? 'bg-blue-50' : ''}`}
                                                        >
                                                          <div className="flex items-center">
                                                            <FileText className="h-5 w-5 text-blue-500 mr-2" />
                                                            <span>Bill: {bill.billNo}</span>
                                                          </div>
                                                          <div className="flex items-center">
                                                            <span className="font-medium text-red-600 mr-2">-₹{bill.amount.toLocaleString()}</span>
                                                            {expandedBill === bill.billNo ? 
                                                              <ChevronUp className="h-5 w-5 text-blue-500" /> : 
                                                              <ChevronDown className="h-5 w-5 text-blue-500" />
                                                            }
                                                          </div>
                                                        </div>

                                                        {/* Expanded Bill Details */}
                                                        <AnimatePresence>
                                                          {expandedBill === bill.billNo && (
                                                            <motion.div 
                                                              variants={childVariants}
                                                              initial="hidden"
                                                              animate="visible"
                                                              exit="exit"
                                                              className="px-4 py-3 bg-blue-50 border-t border-blue-100"
                                                            >
                                                              <div className="space-y-2">
                                                                {bill.medicines.map((medicine: any, index: number) => (
                                                                  <div key={index} className="flex justify-between items-center px-2 py-1 bg-white rounded border border-blue-100">
                                                                    <div className="flex items-center">
                                                                      <Pill className="h-4 w-4 text-blue-500 mr-2" />
                                                                      <span>{medicine.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                      <Package className="h-4 w-4 text-blue-500 mr-1" />
                                                                      <span>{medicine.quantity}</span>
                                                                    </div>
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            </motion.div>
                                                          )}
                                                        </AnimatePresence>
                                                      </div>
                                                    ))
                                                  ) : (
                                                    <div className="px-4 py-3 text-gray-500 italic">No return bills for this date</div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {sortedData.map((customer, customerIndex) => (
                <div key={customerIndex} className="bg-white border border-blue-200 rounded-lg shadow-sm overflow-hidden">
                  {/* Customer Card Header */}
                  <div 
                    onClick={() => toggleCustomerExpand(customerIndex)}
                    className={`p-4 cursor-pointer transition-colors ${expandedCustomer === customerIndex ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center mb-2">
                          <User className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                          <h3 className="font-medium text-gray-900 truncate">{customer.customerName}</h3>
                          <div className="ml-2 flex-shrink-0">
                            {expandedCustomer === customerIndex ? 
                              <ChevronUp className="h-5 w-5 text-blue-500" /> : 
                              <ChevronDown className="h-5 w-5 text-blue-500" />
                            }
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            <span>{customer.mobileNo}</span>
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            <span>{customer.totalBills} Bills</span>
                          </div>
                          <div className="flex items-center font-semibold text-blue-800">
                            <FaRupeeSign className="h-3 w-3 mr-1" />
                            <span>₹{customer.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Customer Details for Mobile */}
                  <AnimatePresence>
                    {expandedCustomer === customerIndex && (
                      <motion.div 
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="border-t border-blue-100"
                      >
                        <motion.div 
                          variants={childVariants}
                          className="p-4 bg-blue-50"
                        >
                          <div className="space-y-3">
                            {customer.dates.map((date: { date: string; totalAmount: number; salesBills: any[]; returnBills: any[] }) => (
                              <div key={date.date} className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                                <div 
                                  onClick={() => toggleDateExpand(date.date)}
                                  className={`flex justify-between items-center p-3 cursor-pointer ${expandedDate === date.date ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                                >
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                                    <span className="font-medium text-sm">{date.date}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="font-medium text-blue-800 mr-2 text-sm">₹{date.totalAmount.toLocaleString()}</span>
                                    {expandedDate === date.date ? 
                                      <ChevronUp className="h-4 w-4 text-blue-500" /> : 
                                      <ChevronDown className="h-4 w-4 text-blue-500" />
                                    }
                                  </div>
                                </div>

                                {/* Expanded Date Details for Mobile */}
                                <AnimatePresence>
                                  {expandedDate === date.date && (
                                    <motion.div 
                                      variants={childVariants}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      className="p-3 bg-white border-t border-blue-100"
                                    >
                                      <div className="space-y-4">
                                        {/* Sales Bills Mobile */}
                                        <div className="border border-blue-100 rounded-lg overflow-hidden">
                                          <div className="bg-blue-600 text-white px-3 py-2 font-medium flex items-center text-sm">
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            Sales Bills
                                          </div>
                                          <div className="divide-y divide-blue-100">
                                            {date.salesBills.map((bill) => (
                                              <div key={bill.billNo} className="p-3">
                                                <div 
                                                  onClick={() => toggleBillExpand(bill.billNo)}
                                                  className={`flex justify-between items-center cursor-pointer ${expandedBill === bill.billNo ? 'mb-2' : ''}`}
                                                >
                                                  <div className="flex items-center">
                                                    <FileText className="h-4 w-4 text-blue-500 mr-2" />
                                                    <span className="text-sm">Bill: {bill.billNo}</span>
                                                  </div>
                                                  <div className="flex items-center">
                                                    <span className="font-medium text-blue-800 mr-2 text-sm">₹{bill.amount.toLocaleString()}</span>
                                                    {expandedBill === bill.billNo ? 
                                                      <ChevronUp className="h-4 w-4 text-blue-500" /> : 
                                                      <ChevronDown className="h-4 w-4 text-blue-500" />
                                                    }
                                                  </div>
                                                </div>

                                                {/* Medicines for Mobile */}
                                                <AnimatePresence>
                                                  {expandedBill === bill.billNo && (
                                                    <motion.div 
                                                      variants={childVariants}
                                                      initial="hidden"
                                                      animate="visible"
                                                      exit="exit"
                                                      className="space-y-2 pt-2 border-t border-blue-100"
                                                    >
                                                      {bill.medicines.map((medicine: any, index: number) => (
                                                        <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded border">
                                                          <div className="flex items-center min-w-0">
                                                            <Pill className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                                                            <span className="text-xs truncate">{medicine.name}</span>
                                                          </div>
                                                          <div className="flex items-center ml-2 flex-shrink-0">
                                                            <Package className="h-3 w-3 text-blue-500 mr-1" />
                                                            <span className="text-xs">{medicine.quantity}</span>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </motion.div>
                                                  )}
                                                </AnimatePresence>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Return Bills Mobile */}
                                        <div className="border border-blue-100 rounded-lg overflow-hidden">
                                          <div className="bg-blue-600 text-white px-3 py-2 font-medium flex items-center text-sm">
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Return Bills
                                          </div>
                                          <div className="divide-y divide-blue-100">
                                            {date.returnBills.length > 0 ? (
                                              date.returnBills.map((bill) => (
                                                <div key={bill.billNo} className="p-3">
                                                  <div 
                                                    onClick={() => toggleBillExpand(bill.billNo)}
                                                    className={`flex justify-between items-center cursor-pointer ${expandedBill === bill.billNo ? 'mb-2' : ''}`}
                                                  >
                                                    <div className="flex items-center">
                                                      <FileText className="h-4 w-4 text-blue-500 mr-2" />
                                                      <span className="text-sm">Bill: {bill.billNo}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                      <span className="font-medium text-red-600 mr-2 text-sm">-₹{bill.amount.toLocaleString()}</span>
                                                      {expandedBill === bill.billNo ? 
                                                        <ChevronUp className="h-4 w-4 text-blue-500" /> : 
                                                        <ChevronDown className="h-4 w-4 text-blue-500" />
                                                      }
                                                    </div>
                                                  </div>

                                                  {/* Return Medicines for Mobile */}
                                                  <AnimatePresence>
                                                    {expandedBill === bill.billNo && (
                                                      <motion.div 
                                                        variants={childVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="exit"
                                                        className="space-y-2 pt-2 border-t border-blue-100"
                                                      >
                                                        {bill.medicines.map((medicine: any, index: number) => (
                                                          <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded border">
                                                            <div className="flex items-center min-w-0">
                                                              <Pill className="h-3 w-3 text-red-500 mr-2 flex-shrink-0" />
                                                              <span className="text-xs truncate">{medicine.name}</span>
                                                            </div>
                                                            <div className="flex items-center ml-2 flex-shrink-0">
                                                              <Package className="h-3 w-3 text-red-500 mr-1" />
                                                              <span className="text-xs">{medicine.quantity}</span>
                                                            </div>
                                                          </div>
                                                        ))}
                                                      </motion.div>
                                                    )}
                                                  </AnimatePresence>
                                                </div>
                                              ))
                                            ) : (
                                              <div className="px-3 py-3 text-gray-500 italic text-sm">No return bills for this date</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10 bg-blue-50 rounded-lg border border-blue-200 text-blue-700 flex flex-col items-center justify-center">
            <FileText className="h-8 w-8 sm:h-12 sm:w-12 mb-4 text-blue-400" />
            <p className="text-base sm:text-lg text-center">No data found for the selected criteria</p>
            <p className="text-xs sm:text-sm mt-2 text-center">Try adjusting your search or date range</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CustomerReportPage;