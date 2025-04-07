import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_ROUTES } from "../utils/api";
import { ChevronDown, ChevronUp, Phone, Calendar, AlertCircle } from "lucide-react";
import { exportNonBuyingToExcel, exportNonBuyingToPDF } from "../utils/Exportutils";

export interface NonBuyingCustomer {
  id: number;
  name: string;
  phone: string;
  lastPurchaseDate: Date | null;
  totalPurchaseValue: number;
}

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

const getNonBuyingCustomers = async (days: number, storeId: number | null): Promise<NonBuyingCustomer[]> => {
  const { data } = await api.get(API_ROUTES.NON_BUYING_CUSTOMERS, {
    params: { days, storeId },
  });
  return data;
};

const NonBuyingCustomerReport: React.FC = () => {
  const [days, setDays] = useState(10); // Holds user input
  const [appliedDays, setAppliedDays] = useState(10); // Holds applied filter
  const [visibleItems, setVisibleItems] = useState(10);
  const [selectedStore, setSelectedStore] = useState<number | null>(null); // Selected store ID
  const [stores, setStores] = useState<{ id: number; storeName: string }[]>([]); // List of stores

  const { data, isLoading, error, refetch } = useQuery<NonBuyingCustomer[]>({
    queryKey: ["non-buying-customers", appliedDays, selectedStore],
    queryFn: () => getNonBuyingCustomers(appliedDays, selectedStore),
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

  const handleExport = () => {
    const input = window.prompt("Enter export format: 'excel' or 'pdf'");
    const format = input ? input.toLowerCase() : "";

    if (format === "excel") {
      exportNonBuyingToExcel(data || []); // Export to Excel
    } else if (format === "pdf") {
      exportNonBuyingToPDF(data || []); // Export to PDF
    } else {
      alert("Invalid format. Please enter 'excel' or 'pdf'.");
    }
  };

  const userRole = getUserRole();

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden bg-white shadow-xl rounded-xl"
      >
        {/* Header Section */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
          <h2 className="text-2xl font-bold text-white">Non-Buying Customers</h2>
          <p className="text-blue-100">Identify customers who haven't made purchases recently</p>
        </div>

        {/* Loading Spinner */}
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
            Fetching Non Buying Customer data, please wait...
          </motion.p>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden bg-white shadow-xl rounded-xl"
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <h2 className="text-2xl font-bold text-white">Non-Buying Customers</h2>
        <p className="text-blue-100">Identify customers who haven't made purchases recently</p>
      </div>

      {/* Store Dropdown and Export Button */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-blue-700">Store:</label>
          <select
            value={selectedStore || ""}
            onChange={(e) => setSelectedStore(Number(e.target.value))}
            className="w-40 border border-blue-300 rounded-md shadow-sm py-1 px-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="" disabled>
              -- Select --
            </option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.storeName}
              </option>
            ))}
          </select>
        </div>

        {userRole === "admin" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-md hover:bg-blue-700 text-sm"
          >
            Export Data
          </motion.button>
        )}
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
              disabled={!selectedStore}
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
                <motion.div
                  key={customer.id}
                  whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
                  className="p-5 transition-all duration-300 bg-white border border-gray-100 shadow-md rounded-xl"
                >
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
                          {customer.lastPurchaseDate
                            ? new Date(customer.lastPurchaseDate).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>

                      <div className="flex items-center text-lg font-bold text-green-600">
                        ₹{customer.totalPurchaseValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-center pt-6">
              {hasMoreToShow && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={showMore}
                  className="flex items-center gap-2 px-6 py-3 font-medium text-white bg-blue-600 rounded-lg cursor-pointer group"
                >
                  <span>Show More</span>
                  <ChevronDown size={18} className="transition-transform duration-300 group-hover:translate-y-1" />
                </motion.button>
              )}

              {visibleItems > 5 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={showLess}
                  className="flex items-center gap-2 px-6 py-3 ml-3 font-medium text-blue-600 bg-white border border-blue-300 rounded-lg cursor-pointer group"
                >
                  <span>Show Less</span>
                  <ChevronUp size={18} className="transition-transform duration-300 group-hover:-translate-y-1" />
                </motion.button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-10 text-center bg-blue-50 rounded-xl"
          >
            <p className="text-xl font-medium text-blue-800">No inactive customers found</p>
            <p className="mt-2 text-blue-600">Try adjusting the timeframe to see more results</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default NonBuyingCustomerReport;