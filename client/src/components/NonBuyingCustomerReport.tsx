import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_ROUTES } from "../utils/api";
import { ChevronDown, ChevronUp, Phone, Calendar, AlertCircle } from "lucide-react";

export interface NonBuyingCustomer {
  id: number;
  name: string;
  phone: string;
  lastPurchaseDate: Date | null;
  totalPurchaseValue: number;
}

const getNonBuyingCustomers = async (days: number): Promise<NonBuyingCustomer[]> => {
  const { data } = await api.get(API_ROUTES.NON_BUYING_CUSTOMERS, { params: { days } });
  return data;
};

const NonBuyingCustomerReport: React.FC = () => {
  const [days, setDays] = useState(10); // Holds user input
  const [appliedDays, setAppliedDays] = useState(10); // Holds applied filter
  const [visibleItems, setVisibleItems] = useState(10);

  const { data, isLoading, error, refetch } = useQuery<NonBuyingCustomer[]>({
    queryKey: ["non-buying-customers", appliedDays], // Use appliedDays instead of days
    queryFn: () => getNonBuyingCustomers(appliedDays),
  });

  const applyFilter = () => {
    setAppliedDays(days); // Apply the filter on button click
    refetch();
  };

  const showMore = () => {
    setVisibleItems((prev) => Math.min(prev + 5, data?.length || 0));
  };

  const showLess = () => {
    setVisibleItems(5);
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden bg-white shadow-xl rounded-xl">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
          <h2 className="text-2xl font-bold text-white">Non-Buying Customers</h2>
          <p className="text-blue-100">Loading customer data...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
            <p className="font-medium text-blue-600">Loading customer data...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error)
    return (
      <div className="p-8 text-red-600 border border-red-200 rounded-lg shadow-lg bg-red-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8" />
          <p className="text-lg font-semibold">Error loading customer data. Please try again.</p>
        </div>
      </div>
    );

  const visibleData = data?.slice(0, visibleItems) || [];
  const hasMoreToShow = data && visibleItems < data.length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="overflow-hidden bg-white shadow-xl rounded-xl">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <h2 className="text-2xl font-bold text-white">Non-Buying Customers</h2>
        <p className="text-blue-100">Identify customers who haven't made purchases recently</p>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between p-4 mb-8 rounded-lg bg-blue-50">
          <div className="text-lg font-semibold text-gray-800">Inactive for {appliedDays} days</div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 0)}
              className="w-24 h-10 px-3 font-medium text-center text-blue-800 bg-white border border-blue-300 rounded-lg"
              placeholder="Enter days"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={applyFilter}
              className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Apply
            </motion.button>
          </div>
        </div>

        {data && data.length > 0 ? (
          <motion.div className="space-y-4">
            <AnimatePresence>
              {visibleData.map((customer) => (
                <motion.div key={customer.id} whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }} className="p-5 transition-all duration-300 bg-white border border-gray-100 shadow-md rounded-xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800">{customer.name}</h3>
                      <div className="flex items-center mt-2 text-blue-700">
                        <Phone size={16} className="mr-2" />
                        {customer.phone}
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end">
                      <div className="flex items-center mb-1 text-gray-700">
                        <Calendar size={16} className="mr-2" />
                        Last Purchase:{" "}
                        <span className="ml-1 font-medium">
                          {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : "Never"}
                        </span>
                      </div>

                      <div className="flex items-center text-lg font-bold text-green-600">₹{customer.totalPurchaseValue.toLocaleString()}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-center pt-6">
              {hasMoreToShow && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={showMore} className="flex items-center gap-2 px-6 py-3 font-medium text-white bg-blue-600 rounded-lg cursor-pointer group">
                  <span>Show More</span>
                  <ChevronDown size={18} className="transition-transform duration-300 group-hover:translate-y-1" />
                </motion.button>
              )}

              {visibleItems > 5 && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={showLess} className="flex items-center gap-2 px-6 py-3 ml-3 font-medium text-blue-600 bg-white border border-blue-300 rounded-lg cursor-pointer group">
                  <span>Show Less</span>
                  <ChevronUp size={18} className="transition-transform duration-300 group-hover:-translate-y-1" />
                </motion.button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 text-center bg-blue-50 rounded-xl">
            <p className="text-xl font-medium text-blue-800">No inactive customers found</p>
            <p className="mt-2 text-blue-600">Try adjusting the timeframe to see more results</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default NonBuyingCustomerReport;
