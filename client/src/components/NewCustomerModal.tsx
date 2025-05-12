import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Store, User, Phone, Save, Loader } from "lucide-react";
import api, { API_ROUTES } from "../utils/api";
import { toast } from "react-toastify";

interface CustomerData {
  storeName: string;
  customerName: string;
  customerPhone: string;
}

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newCustomers: any[]) => void;
}

const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [customers, setCustomers] = useState<CustomerData[]>([
    { storeName: "", customerName: "", customerPhone: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleAddCustomer = () => {
    const newCustomer = { storeName: "", customerName: "", customerPhone: "" };
    setCustomers((prev) => [...prev, newCustomer]);
    // Set focus to the newly added customer
    setActiveIndex(customers.length);
  };

  const handleRemoveCustomer = (index: number) => {
    setCustomers((prev) => prev.filter((_, i) => i !== index));
    // Update active index if needed
    if (activeIndex >= index && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleInputChange = (
    index: number,
    field: keyof CustomerData,
    value: string
  ) => {
    setCustomers((prev) =>
      prev.map((customer, i) =>
        i === index ? { ...customer, [field]: value } : customer
      )
    );
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation pattern for phone numbers
    const phonePattern = /^\+?[0-9]{10,15}$/;
    return phonePattern.test(phone.replace(/\s+/g, ""));
  };

  const handleSave = async () => {
    // First validation: check for empty fields
    if (customers.some((c) => !c.storeName || !c.customerName || !c.customerPhone)) {
      toast.warning("Please fill in all fields for all customers.", {
        position: "top-right",
      });
      return;
    }

    // Second validation: validate phone numbers
    const invalidPhones = customers.filter(c => !validatePhoneNumber(c.customerPhone));
    if (invalidPhones.length > 0) {
      toast.warning("Please enter valid phone numbers for all customers.", {
        position: "top-right",
      });
      return;
    }

    setLoading(true);
    try {
      const responses = await Promise.all(
        customers.map((customer) =>
          api.post(API_ROUTES.TELECALLING_ADD_CUSTOMER, customer)
        )
      );
      onSave(responses.map((response) => response.data));
      toast.success(`${customers.length} customer${customers.length > 1 ? 's' : ''} added successfully!`, { 
        position: "top-right" 
      });
      onClose();
    } catch (error) {
      console.error("Error adding customers:", error);
      toast.error("Failed to add customers. Please try again.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-red bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl mx-4"
      >
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-bold text-gray-800">Add New Customers</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto pr-2 space-y-6">
          <AnimatePresence>
            {customers.map((customer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`rounded-lg p-4 ${
                  activeIndex === index 
                    ? "border-2 border-blue-400 bg-blue-50" 
                    : "border border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setActiveIndex(index)}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-700">Customer #{index + 1}</span>
                  {customers.length > 1 && (
                    <button
                      onClick={() => handleRemoveCustomer(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors flex items-center"
                      aria-label="Remove customer"
                    >
                      <Trash2 size={16} className="mr-1" />
                      <span className="text-sm">Remove</span>
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Store size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Store Name"
                      value={customer.storeName}
                      onChange={(e) =>
                        handleInputChange(index, "storeName", e.target.value)
                      }
                      className="w-full pl-10 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customer.customerName}
                      onChange={(e) =>
                        handleInputChange(index, "customerName", e.target.value)
                      }
                      className="w-full pl-10 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      placeholder="Customer Phone (e.g., +1234567890)"
                      value={customer.customerPhone}
                      onChange={(e) =>
                        handleInputChange(index, "customerPhone", e.target.value)
                      }
                      className={`w-full pl-10 border rounded-md p-3 focus:ring-2 focus:border-transparent ${
                        customer.customerPhone && !validatePhoneNumber(customer.customerPhone)
                          ? "border-red-300 focus:ring-red-400 bg-red-50"
                          : "border-gray-300 focus:ring-blue-400"
                      }`}
                    />
                    {customer.customerPhone && !validatePhoneNumber(customer.customerPhone) && (
                      <p className="text-red-500 text-sm mt-1">Please enter a valid phone number</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="pt-4 mt-4 border-t">
          <button
            onClick={handleAddCustomer}
            className="w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center"
          >
            <Plus size={16} className="mr-2" />
            Add Another Customer
          </button>
          
          <div className="flex flex-col sm:flex-row justify-end mt-6 space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save {customers.length > 1 ? `All (${customers.length})` : "Customer"}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewCustomerModal;