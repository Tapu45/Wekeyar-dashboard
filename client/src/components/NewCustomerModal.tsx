import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Store, User, Phone, Save, Loader, MapPin, ChevronDown } from "lucide-react";
import api, { API_ROUTES } from "../utils/api";
import { toast } from "react-toastify";

interface CustomerData {
  storeName: string;
  customerName: string;
  customerPhone: string;
  address: string;
}

interface StoreData {
  id: number;
  storeName: string;
}

const AddCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerData[]>([
    { storeName: "", customerName: "", customerPhone: "", address: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [storeLoading, setStoreLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Fetch stores when component mounts
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get(API_ROUTES.STORES);
        setStores(response.data);
        setStoreLoading(false);
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Failed to load stores. Please try again.", {
          position: "top-right",
        });
        setStoreLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleAddCustomer = () => {
    const newCustomer = { storeName: "", customerName: "", customerPhone: "", address: "" };
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

  const handleStoreSelect = (index: number, storeName: string) => {
    handleInputChange(index, "storeName", storeName);
    setOpenDropdown(null);
  };

  const toggleDropdown = (index: number) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const handleSave = async () => {
    // First validation: check for empty required fields
    if (customers.some((c) => !c.storeName || !c.customerName || !c.customerPhone)) {
      toast.warning("Please fill in all required fields for all customers.", {
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
      
      toast.success(`${customers.length} customer${customers.length > 1 ? 's' : ''} added successfully!`, { 
        position: "top-right" 
      });
      
      // Navigate back to the telecalling dashboard or customer list
      navigate("/telecalling/customers");
    } catch (error: any) {
      console.error("Error adding customers:", error);
      const errorMessage = error.response?.data?.error || "Failed to add customers. Please try again.";
      toast.error(errorMessage, {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Add New Telecalling Customers</h1>
          <p className="text-gray-600 mt-2">
            Create new customer records for telecalling activities.
          </p>
        </div>

        {/* Customer Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {customers.map((customer, index) => (
              <div
                key={index}
                className={`rounded-lg p-5 border ${
                  activeIndex === index 
                    ? "border-2 border-blue-400 bg-blue-50" 
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setActiveIndex(index)}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg text-gray-700">Customer #{index + 1}</h3>
                  {customers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomer(index);
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors flex items-center"
                      aria-label="Remove customer"
                    >
                      <Trash2 size={18} className="mr-1" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Store size={18} className="text-gray-400" />
                      </div>
                      <div 
                        className="w-full relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(index);
                        }}
                      >
                        <div className="w-full pl-10 pr-10 border border-gray-300 rounded-md p-3 flex justify-between items-center cursor-pointer bg-white">
                          {customer.storeName || (
                            <span className="text-gray-400">Select a store</span>
                          )}
                          <ChevronDown size={18} className={`absolute right-3 transition-transform ${openDropdown === index ? 'transform rotate-180' : ''}`} />
                        </div>
                        
                        {/* Store dropdown */}
                        {openDropdown === index && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {storeLoading ? (
                              <div className="p-3 flex items-center justify-center">
                                <Loader size={18} className="animate-spin mr-2" />
                                <span>Loading stores...</span>
                              </div>
                            ) : stores.length > 0 ? (
                              <>
                                <div className="p-2 border-b">
                                  <input
                                    type="text" 
                                    placeholder="Search stores..."
                                    className="w-full p-2 border border-gray-200 rounded" 
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => {
                                      // You can implement search filtering here
                                    }}
                                  />
                                </div>
                                {stores.map(store => (
                                  <div 
                                    key={store.id} 
                                    className="p-3 hover:bg-blue-50 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStoreSelect(index, store.storeName);
                                    }}
                                  >
                                    {store.storeName}
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="p-3">No stores found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter customer name"
                        value={customer.customerName}
                        onChange={(e) =>
                          handleInputChange(index, "customerName", e.target.value)
                        }
                        className="w-full pl-10 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        placeholder="Enter 10-digit phone number"
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

                  <div className="relative md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={18} className="text-gray-400" />
                      </div>
                      <textarea
                        placeholder="Enter customer address (optional)"
                        value={customer.address}
                        onChange={(e) =>
                          handleInputChange(index, "address", e.target.value)
                        }
                        className="w-full pl-10 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddCustomer}
            className="w-full mt-6 px-4 py-3 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center"
          >
            <Plus size={18} className="mr-2" />
            Add Another Customer
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-6 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save {customers.length > 1 ? `All (${customers.length})` : "Customer"}
              </>
            )}
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          * Required fields
        </div>
      </div>
    </div>
  );
};

export default AddCustomerPage;