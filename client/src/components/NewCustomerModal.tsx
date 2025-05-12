import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Store, User, Phone, Save, Loader, MapPin, ChevronDown, X, Search } from "lucide-react";
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
  const [filteredStores, setFilteredStores] = useState<StoreData[]>([]);
  const [storeLoading, setStoreLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [storeSearch, setStoreSearch] = useState("");

  // Fetch stores when component mounts
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get(API_ROUTES.STORES);
        setStores(response.data);
        setFilteredStores(response.data);
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
    setStoreSearch("");
  };

  const toggleDropdown = (index: number) => {
    setOpenDropdown(openDropdown === index ? null : index);
    setStoreSearch("");
    setFilteredStores(stores);
  };

  const handleStoreSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    setStoreSearch(searchTerm);
    
    if (searchTerm.trim() === "") {
      setFilteredStores(stores);
      return;
    }
    
    const filtered = stores.filter(store => 
      store.storeName.toLowerCase().includes(searchTerm)
    );
    setFilteredStores(filtered);
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
      // Implement the API call to save customers
      await Promise.all(customers.map(customer => 
        api.post(API_ROUTES.TELECALLING_ADD_CUSTOMER, customer)
      ));
      
      toast.success(`${customers.length} customer${customers.length > 1 ? 's' : ''} added successfully!`, { 
        position: "top-right",
        autoClose: 3000
      });
      
      // Reset the form instead of navigating
      setCustomers([{ storeName: "", customerName: "", customerPhone: "", address: "" }]);
      setActiveIndex(0);
      
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
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.store-dropdown-container')) {
        setOpenDropdown(null);
      }
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
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            Add New Telecalling Customers
          </h1>
          <p className="text-gray-600 mt-2">
            Create new customer records for telecalling activities.
          </p>
        </div>

        {/* Customer Form Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="space-y-6">
            {customers.map((customer, index) => (
              <div
                key={index}
                className={`rounded-lg p-5 border transition-all duration-200 ${
                  activeIndex === index 
                    ? "border-2 border-blue-400 bg-blue-50 shadow-md" 
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setActiveIndex(index)}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <h3 className="font-medium text-lg text-gray-700">Customer Information</h3>
                  </div>
                  {customers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomer(index);
                      }}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors flex items-center"
                      aria-label="Remove customer"
                    >
                      <Trash2 size={18} className="mr-1" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative store-dropdown-container">
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
                        <div className={`w-full pl-10 pr-10 border rounded-md p-3 flex justify-between items-center cursor-pointer bg-white transition-all ${
                          customer.storeName ? "border-green-300" : "border-gray-300"
                        } ${openDropdown === index ? "ring-2 ring-blue-300" : ""}`}>
                          {customer.storeName ? (
                            <span className="font-medium">{customer.storeName}</span>
                          ) : (
                            <span className="text-gray-400">Select a store</span>
                          )}
                          <ChevronDown size={18} className={`absolute right-3 transition-transform ${openDropdown === index ? 'transform rotate-180 text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        
                        {/* Store dropdown */}
                        {openDropdown === index && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-64 overflow-y-auto">
                            <div className="p-2 border-b sticky top-0 bg-white">
                              <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text" 
                                  placeholder="Search stores..."
                                  className="w-full p-2.5 pl-9 pr-8 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-300" 
                                  onClick={(e) => e.stopPropagation()}
                                  value={storeSearch}
                                  onChange={handleStoreSearch}
                                />
                                {storeSearch && (
                                  <button 
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setStoreSearch("");
                                      setFilteredStores(stores);
                                    }}
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {storeLoading ? (
                              <div className="p-4 flex items-center justify-center">
                                <Loader size={18} className="animate-spin mr-2 text-blue-500" />
                                <span>Loading stores...</span>
                              </div>
                            ) : filteredStores.length > 0 ? (
                              <div className="py-1">
                                {filteredStores.map(store => (
                                  <div 
                                    key={store.id} 
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStoreSelect(index, store.storeName);
                                    }}
                                  >
                                    <Store size={14} className="mr-2 text-gray-500" />
                                    {store.storeName}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-gray-500">
                                {storeSearch ? "No matching stores found" : "No stores available"}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name <span className="text-red-500">*</span>
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
                        className={`w-full pl-10 border rounded-md p-3 focus:ring-2 focus:border-transparent transition-all ${
                          customer.customerName ? "border-green-300" : "border-gray-300"
                        } focus:ring-blue-400`}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
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
                        className={`w-full pl-10 border rounded-md p-3 focus:ring-2 focus:border-transparent transition-all ${
                          customer.customerPhone && validatePhoneNumber(customer.customerPhone)
                            ? "border-green-300"
                            : customer.customerPhone && !validatePhoneNumber(customer.customerPhone)
                              ? "border-red-300 focus:ring-red-400 bg-red-50"
                              : "border-gray-300 focus:ring-blue-400"
                        }`}
                      />
                      {customer.customerPhone && !validatePhoneNumber(customer.customerPhone) && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <X size={14} className="mr-1" />
                          Please enter a valid phone number
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="relative md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                        <MapPin size={18} className="text-gray-400" />
                      </div>
                      <textarea
                        placeholder="Enter customer address (optional)"
                        value={customer.address}
                        onChange={(e) =>
                          handleInputChange(index, "address", e.target.value)
                        }
                        className={`w-full pl-10 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all ${
                          customer.address ? "border-gray-400" : ""
                        }`}
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
            className="w-full mt-6 px-4 py-3 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center border border-blue-100 font-medium"
          >
            <Plus size={18} className="mr-2" />
            Add Another Customer
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-6 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-md"
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
        
        <div className="mt-4 text-sm text-gray-600 flex items-center">
          <span className="text-red-500 mr-1">*</span> Required fields
        </div>
      </div>
    </div>
  );
};

export default AddCustomerPage;