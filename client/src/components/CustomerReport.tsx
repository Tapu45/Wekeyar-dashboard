import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Calendar, 
  User, 
  Phone, 
  FileText, 
  DollarSign, 
  ArrowDown, 
  ArrowUp, 
  ShoppingCart, 
  RotateCcw,
  Pill, 
  Package
} from "lucide-react";

const fetchCustomerReport = async (startDate: string, endDate: string, search: string) => {
  const { data } = await api.get(API_ROUTES.CUSTOMER_REPORT, {
    params: { startDate, endDate, search },
  });
  return data;
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customerReport", startDate, endDate, search],
    queryFn: () => fetchCustomerReport(startDate, endDate, search),
    enabled: false,
  });

  useEffect(() => {
    if (startDate && endDate) {
      refetch();
    }
  }, [startDate, endDate, search, refetch]);

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

  // Shimmer loading effect
  const LoadingShimmer = () => (
    <div className="w-full space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-16 bg-blue-100 rounded-md flex items-center px-4">
            <div className="w-1/4 h-6 bg-blue-200 rounded mr-4"></div>
            <div className="w-1/4 h-6 bg-blue-200 rounded mr-4"></div>
            <div className="w-1/6 h-6 bg-blue-200 rounded mr-4"></div>
            <div className="w-1/6 h-6 bg-blue-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden bg-white shadow-xl rounded-xl"
    >
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <h2 className="text-2xl font-bold text-white">Customer Report</h2>
        <p className="text-blue-100">
          View detailed analytics of customer purchases, including sales and return bills.
        </p>
      </div>
  
      {/* Filters and Data Table */}
      <div className="p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              className="pl-10 pr-4 py-3 w-full rounded-lg border border-blue-200 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition duration-150"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              className="pl-10 pr-4 py-3 w-full rounded-lg border border-blue-200 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition duration-150"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-blue-500" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name or Mobile"
              className="pl-10 pr-4 py-3 w-full rounded-lg border border-blue-200 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition duration-150"
            />
          </div>
        </div>
  
        {/* Data Table */}
        {isLoading ? (
          <LoadingShimmer />
        ) : error ? (
          <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-red-700 flex items-center justify-center">
            <FileText className="mr-2 h-5 w-5" />
            Error fetching data. Please try again.
          </div>
        ) : sortedData && sortedData.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-blue-100 shadow-sm">
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
                      <DollarSign className="h-5 w-5 mr-2" /> Total Amount
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
                                                          {bill.medicines.map((medicine: { name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; quantity: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: React.Key | null | undefined) => (
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
                                                            {bill.medicines.map((medicine: { name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; quantity: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: React.Key | null | undefined) => (
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
        ) : (
          <div className="p-10 bg-blue-50 rounded-lg border border-blue-200 text-blue-700 flex flex-col items-center justify-center">
            <FileText className="h-12 w-12 mb-4 text-blue-400" />
            <p className="text-lg">No data found for the selected criteria</p>
            <p className="text-sm mt-2">Try adjusting your search or date range</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CustomerReportPage;