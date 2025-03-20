import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { CustomerReportData, MedicineDetails } from "../utils/types";
import { ChevronDown, ChevronUp, Calendar, Search, ShoppingBag, CreditCard, User, Phone, Receipt, Clock } from "lucide-react";

const fetchCustomerReport = async (startDate: string, endDate: string, search?: string): Promise<CustomerReportData[]> => {
  const { data } = await api.get(API_ROUTES.CUSTOMER_REPORT, {
    params: { startDate, endDate, search },
  });
  return data;
};

const CustomerReportPage: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery<CustomerReportData[]>({
    queryKey: ["customerReport", startDate, endDate, search],
    queryFn: () => fetchCustomerReport(startDate, endDate, search),
    enabled: false,
  });

  useEffect(() => {
    if (startDate && endDate) {
      refetch();
    }
  }, [startDate, endDate, search, refetch]);

  const toggleExpand = (customerIndex: number) => {
    setExpandedCustomer((prev) => (prev === customerIndex ? null : customerIndex));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-xl overflow-hidden"
    >
      <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800">
        <div className="flex items-center space-x-3">
          <ShoppingBag size={28} className="text-white" />
          <div>
            <h2 className="text-2xl font-bold text-white">Customer Report</h2>
            <p className="text-blue-100">View detailed customer purchase analytics</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all duration-200"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <span>End Date</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all duration-200"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700 flex items-center gap-2">
              <Search size={18} className="text-blue-600" />
              <span>Search (Mobile No or Name)</span>
            </label>
            <input
              type="text"
              placeholder="Enter Mobile No or Name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all duration-200"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex space-x-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-4 h-4 bg-blue-600 rounded-full"
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-red-600 bg-red-50 border border-red-200 rounded-lg shadow-lg"
          >
            <p className="text-lg font-semibold">Error fetching report. Please try again.</p>
          </motion.div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                  <th className="text-left p-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>Customer Name</span>
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>Mobile Number</span>
                    </div>
                  </th>
                  <th className="text-right p-4 font-semibold">
                    <div className="flex items-center justify-end gap-2">
                      <ShoppingBag size={16} />
                      <span>Purchase Quantity</span>
                    </div>
                  </th>
                  <th className="text-right p-4 font-semibold">
                    <div className="flex items-center justify-end gap-2">
                      <CreditCard size={16} />
                      <span>Total Purchase</span>
                    </div>
                  </th>
                  <th className="text-center p-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.map((customer: CustomerReportData, customerIndex: number) => (
                  <React.Fragment key={customerIndex}>
                    <tr
                      className={`
                        hover:bg-blue-50 transition-colors duration-150
                        ${customerIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        ${expandedCustomer === customerIndex ? "bg-blue-50" : ""}
                      `}
                      onClick={() => toggleExpand(customerIndex)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="p-4 border-t border-gray-200 font-medium">{customer.customerName}</td>
                      <td className="p-4 border-t border-gray-200">{customer.mobileNo}</td>
                      <td className="p-4 border-t border-gray-200 text-right">{customer.totalProducts}</td>
                      <td className="p-4 border-t border-gray-200 text-right font-medium text-blue-600">
                        ₹{customer.totalSales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 border-t border-gray-200 text-center">
                        <button className="text-blue-600 hover:text-blue-800 transition-colors duration-150">
                          {expandedCustomer === customerIndex ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedCustomer === customerIndex && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td colSpan={5} className="p-0 border-t-0">
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                              className="p-6 bg-blue-50 border-t border-b border-blue-100"
                            >
                              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                <ShoppingBag size={18} className="mr-2 text-blue-600" />
                                Medicine Details
                              </h4>
                              <div className="bg-white rounded-lg shadow-sm">
                                <div className="grid grid-cols-5 p-3 bg-gray-100 font-medium text-gray-700 border-b border-gray-200">
                                  <div className="col-span-2">Medicine Name</div>
                                  <div className="col-span-1 flex items-center gap-1">
                                    <Receipt size={14} />
                                    <span>Bill No</span>
                                  </div>
                                  <div className="col-span-1 flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>Date</span>
                                  </div>
                                  <div className="col-span-1 text-center">Quantity</div>
                                </div>
                                {customer.bills[0]?.medicines.map((medicine: MedicineDetails, index: number) => (
                                  <div
                                    key={index}
                                    className={`grid grid-cols-5 items-center p-4 ${
                                      index !== customer.bills[0].medicines.length - 1 ? "border-b border-gray-200" : ""
                                    }`}
                                  >
                                    <div className="col-span-2 font-medium text-gray-800">{medicine.name}</div>
                                    <div className="col-span-1 text-gray-600">{customer.bills[0]?.billNo}</div>
                                    <div className="col-span-1 text-gray-600">{new Date(customer.bills[0]?.date).toLocaleDateString()}</div>
                                    <div className="col-span-1 text-center">
                                      <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                        {medicine.quantity}
                                      </span>
                                    </div>
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
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 text-center bg-blue-50 rounded-xl"
          >
            <ShoppingBag size={48} className="mx-auto mb-4 text-blue-300" />
            <p className="text-xl font-medium text-blue-800">No data found</p>
            <p className="text-blue-600 mt-2">Try adjusting your search criteria</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CustomerReportPage;