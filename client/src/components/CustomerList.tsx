import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import { API_ROUTES } from "../utils/api";
import { Customer } from "../utils/types";
import { Search, Phone, MapPin, User, ChevronRight, Info } from "lucide-react";

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<Customer[]>(API_ROUTES.CUSTOMERS);
        setCustomers(response.data);
        setFilteredCustomers(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to fetch customers. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Handle search functionality
  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
    hover: {
      scale: 1.02,
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-700">Customer Directory</h1>
        <div className="text-blue-500 text-sm">
          <span className="font-bold">{filteredCustomers.length}</span> of{" "}
          {customers.length} customers
        </div>
      </div>

      {/* Enhanced Search Bar */}
      <div className="mb-8 relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-blue-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-4 border-2 border-blue-100 rounded-lg shadow-sm focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition-all duration-300 text-blue-800 placeholder-blue-300"
          />
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setSearchQuery("")}
            >
              <span className="text-blue-400 hover:text-blue-600 cursor-pointer">
                ×
              </span>
            </motion.button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
          />
          <span className="ml-4 text-blue-600 font-medium">
            Loading customers...
          </span>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 text-blue-700 p-4 rounded-lg border-l-4 border-blue-500 flex items-center"
        >
          <Info className="mr-2 text-blue-600" size={20} />
          {error}
        </motion.div>
      ) : filteredCustomers.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="bg-white border border-blue-100 rounded-lg overflow-hidden shadow-md transition-shadow duration-300"
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="p-5 border-b border-blue-50 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <div className="flex items-center">
                    <User className="mr-2" size={20} />
                    <h2 className="text-lg font-bold truncate">
                      {customer.name}
                    </h2>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center mb-3 text-blue-700">
                    <Phone size={16} className="mr-3 text-blue-500" />
                    <p>{customer.phone}</p>
                  </div>
                  <div className="flex items-center mb-3 text-blue-700">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {customer.status}
                    </span>
                  </div>
                  <div className="flex items-center text-blue-700">
                    <MapPin
                      size={16}
                      className="mr-3 text-blue-500 flex-shrink-0"
                    />
                    <p className="truncate">{customer.address}</p>
                  </div>
                </div>
               
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <Search size={48} className="text-blue-200 mb-4" />
          <p className="text-blue-700 font-medium mb-2">No customers found</p>
          <p className="text-blue-400 text-sm">
            Try adjusting your search criteria
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default CustomerList;
