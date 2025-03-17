import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_ROUTES } from "../utils/api";
import { PlusCircle, MinusCircle, ChevronDown, ChevronUp, Phone, Calendar, DollarSign, AlertCircle } from "lucide-react";

export interface NonBuyingCustomer {
  id: number;
  name: string;
  phone: string;
  lastPurchaseDate: Date | null;
  totalPurchaseValue: number;
}

const getNonBuyingCustomers = async (
  days: number
): Promise<NonBuyingCustomer[]> => {
  const { data } = await api.get(API_ROUTES.NON_BUYING_CUSTOMERS, {
    params: { days },
  });
  return data;
};

const NonBuyingCustomerReport: React.FC = () => {
  const [days, setDays] = useState(90);
  const [visibleItems, setVisibleItems] = useState(5);
  const { data, isLoading, error, refetch } = useQuery<NonBuyingCustomer[]>({
    queryKey: ["non-buying-customers", days],
    queryFn: () => getNonBuyingCustomers(days),
  });

  const handleIncreaseDays = () => {
    setDays(prev => prev + 30);
  };

  const handleDecreaseDays = () => {
    setDays(prev => Math.max(30, prev - 30));
  };

  const showMore = () => {
    setVisibleItems((prev) => Math.min(prev + 5, data?.length || 0));
  };

  const showLess = () => {
    setVisibleItems(5);
  };

    if (isLoading) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
            <h2 className="text-2xl font-bold text-white">Non-Buying  Customers</h2>
            <p className="text-blue-100">Loading customer data...</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-blue-600 font-medium">Loading customer data...</p>
            </div>
          </div>
        </motion.div>
      )
    }

  if (error)
    return (
      <div className="p-8 text-red-600 bg-red-50 border border-red-200 rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-8 w-8" />
          <p className="text-lg font-semibold">Error loading customer data. Please try again.</p>
        </div>
      </div>
    );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { 
      scale: 0.95
    }
  };

  const visibleData = data?.slice(0, visibleItems) || [];
  const hasMoreToShow = data && visibleItems < data.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden bg-white rounded-xl shadow-xl"
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <h2 className="text-2xl font-bold text-white">Non-Buying Customers</h2>
        <p className="text-blue-100">Identify customers who haven't made purchases recently</p>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-8 p-4 bg-blue-50 rounded-lg">
          <div className="text-gray-800 font-semibold text-lg">Inactive for {days} days</div>
          
          <div className="flex items-center gap-3">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleDecreaseDays}
              disabled={days <= 30}
              className={`p-2 rounded-full ${days <= 30 ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
            >
              <MinusCircle size={24} />
            </motion.button>
            
            <div className="w-16 h-10 flex items-center justify-center bg-white border border-blue-300 rounded-lg font-medium text-blue-800">
              {days}
            </div>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleIncreaseDays}
              className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
            >
              <PlusCircle size={24} />
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => refetch()}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Apply
            </motion.button>
          </div>
        </div>

        {data && data.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <AnimatePresence>
              {visibleData.map((customer) => (
                <motion.div
                  key={customer.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
                  className="p-5 bg-white border border-gray-100 rounded-xl shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800">{customer.name}</h3>
                      <div className="mt-2 flex items-center text-blue-700">
                        <Phone size={16} className="mr-2" />
                        {customer.phone}
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end">
                      <div className="flex items-center text-gray-700 mb-1">
                        <Calendar size={16} className="mr-2" />
                        Last Purchase:{" "}
                        <span className="ml-1 font-medium">
                          {customer.lastPurchaseDate
                            ? new Date(customer.lastPurchaseDate).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-green-600 font-bold text-lg">
                        <DollarSign size={18} className="mr-1" />
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
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={showMore}
                  className="group px-6 py-3 flex items-center gap-2 text-white bg-blue-600 rounded-lg font-medium cursor-pointer"
                >
                  <span>Show More</span>
                  <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform duration-300" />
                </motion.button>
              )}
              
              {visibleItems > 5 && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={showLess}
                  className="group px-6 py-3 ml-3 flex items-center gap-2 text-blue-600 bg-white border border-blue-300 rounded-lg font-medium cursor-pointer"
                >
                  <span>Show Less</span>
                  <ChevronUp size={18} className="group-hover:-translate-y-1 transition-transform duration-300" />
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