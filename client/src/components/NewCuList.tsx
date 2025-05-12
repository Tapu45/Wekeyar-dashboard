import React, { useState, useEffect } from "react";
import { Phone, Store, MapPin, RefreshCw,  ShoppingBag, X, User, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_ROUTES } from "../utils/api";
import { toast } from "react-toastify";
import OrderForm from "./Orderform";

interface NewCustomer {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  storeName: string;
  address: string | null;
  createdAt: string;
}

interface NewTelecallingCustomersPageProps {
  viewMode?: 'grid' | 'list';
}

const NewTelecallingCustomersPage: React.FC<NewTelecallingCustomersPageProps> = ({ }) => {
  const [customers, setCustomers] = useState<NewCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<NewCustomer | null>(null);
  
  // Fetch new telecalling customers
  const fetchNewCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get(API_ROUTES.TELECALLING_GET_NEW_CUSTOMERS);
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching new telecalling customers:", error);
      toast.error("Failed to load new customers. Please try again.", {
        position: "top-right"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewCustomers();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <AnimatePresence mode="wait">
        {!selectedCustomer ? (
          <motion.div
            key="customer-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">New Customers</h1>
                <p className="text-gray-500 mt-1">
                  {customers.length} {customers.length === 1 ? 'customer' : 'customers'} available for orders
                </p>
              </div>
              
              <button
                onClick={fetchNewCustomers}
                className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh List
              </button>
            </div>

            {/* Customers Table */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading customer data...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <User size={24} className="text-gray-400" />
                </div>
                <p className="text-xl font-medium text-gray-700 mb-2">No new customers found</p>
                <p className="text-gray-500">New customers will appear here when added to the system</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Customer Details
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Store Information
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Added On
                        </th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customers.map(customer => (
                        <tr key={customer.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User size={20} className="text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <Phone size={14} className="mr-1 text-gray-400" />
                                  {customer.customerPhone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-gray-900 font-medium">{customer.storeName}</div>
                            {customer.address && (
                              <div className="text-sm text-gray-500 mt-1 flex items-start">
                                <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0 text-gray-400" />
                                <span className="line-clamp-2 max-w-xs">{customer.address}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Clock size={14} className="mr-2 text-gray-400" />
                              {formatDate(customer.createdAt)}
                            </div>
                            <div className="text-xs text-blue-600 mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded-full">
                              New Customer
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <button 
                              onClick={() => setSelectedCustomer(customer)}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              <ShoppingBag size={16} className="mr-2" />
                              Create Order
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="order-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* Customer Info Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Create Order</h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
                >
                  <X size={16} className="mr-2" />
                  Back to List
                </button>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-blue-500"
              >
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="bg-blue-100 p-4 rounded-full mr-5 mb-4 md:mb-0">
                    <User className="text-blue-600" size={24} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-gray-800">{selectedCustomer.customerName}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 sm:gap-x-6">
                      <div className="flex items-center text-gray-600">
                        <Phone className="mr-2 text-gray-400" size={16} />
                        <span>{selectedCustomer.customerPhone}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Store className="mr-2 text-gray-400" size={16} />
                        <span>{selectedCustomer.storeName}</span>
                      </div>
                    </div>
                    {selectedCustomer.address && (
                      <div className="flex items-start text-gray-600 mt-1">
                        <MapPin className="mr-2 mt-1 flex-shrink-0 text-gray-400" size={16} />
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              
              {/* Order Form Component */}
              <OrderForm
                selectedCustomerId={selectedCustomer.id}
                customerName={selectedCustomer.customerName}
                onOrderSaved={() => setSelectedCustomer(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewTelecallingCustomersPage;