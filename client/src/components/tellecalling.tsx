import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import api, { API_ROUTES } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  PhoneCall, 
  Store, 
  User, 
  ShoppingCart, 
  Package, 
  AlertCircle,
  X,
  Plus,
  MessageSquare
} from "lucide-react";
import NewCustomerModal from "./NewCustomerModal";

const socket = io(import.meta.env.VITE_API_URL); // Replace with your server URL

interface Customer {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  lastPurchaseDate: string | null;
  storeName: string | null;
  remarks?: string;
}

interface Product {
  id: number;
  name: string;
  createdAt: string;
}

interface OrderProduct {
  productName: string;
  quantity: number;
  isNewProduct: boolean;
}

interface RemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  initialRemarks: string;
  onSave: (customerId: number, remarks: string) => void;
}

const RemarksModal: React.FC<RemarksModalProps> = ({
  isOpen,
  onClose,
  customerId,
  initialRemarks,
  onSave,
}) => {
  const [remarks, setRemarks] = useState(initialRemarks || "");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    onSave(customerId, remarks); // Call the updated handleUpdateRemarks function
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <MessageSquare className="text-blue-600 mr-2" size={20} />
            Customer Remarks
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <textarea
          className="w-full border border-gray-300 rounded-md p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add remarks about this customer..."
        />

        <div className="flex justify-end mt-4 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Remarks
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Telecalling: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [remarks, setRemarks] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [selectedRemarkCustomerId, setSelectedRemarkCustomerId] = useState<number | null>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [, setNewCustomerModalOpen] = useState(false); // State for modal

  useEffect(() => {
    // Fetch telecalling customers
    setLoading(true);
    socket.emit("getTelecallingCustomers");

    socket.on("updateTelecalling", (updatedCustomers: Customer[]) => {
      setCustomers(updatedCustomers);
      setLoading(false);
    });

    // Handle clicks outside the suggestions box
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          productInputRef.current && !productInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socket.off("updateTelecalling");
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (productName.trim() === "") {
        setProducts([]); // Clear the list if input is empty
        return;
      }
      console.log("fetching products",productName);

      try {
        const response = await api.get(API_ROUTES.TELECALLING_PRODUCTS, {
          params: { search: productName },
        });
        setProducts(response.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to fetch products", {
          position: "top-right",
        });
      }
    };

    const debounceTimeout = setTimeout(fetchProducts, 300); // Debounce API calls
    return () => clearTimeout(debounceTimeout); // Cleanup timeout
  }, [productName]);

  const handleAddProduct = () => {
    if (!productName || quantity <= 0) {
      toast.warning("Please provide a valid product name and quantity", {
        position: "top-right",
      });
      return;
    }

    const isNewProduct = !products.some(
      (product) => product.name.toLowerCase() === productName.toLowerCase()
    );

    setOrderProducts((prev) => [
      ...prev,
      { productName, quantity, isNewProduct },
    ]);
    setProductName("");
    setQuantity(1);
    setShowSuggestions(false);
  };

 

  const handleOpenRemarksModal = (customerId: number, initialRemarks: string = "") => {
    setSelectedRemarkCustomerId(customerId);
    setRemarks(initialRemarks);
    setRemarksModalOpen(true);
  };

  const handleCloseRemarksModal = () => {
    setRemarksModalOpen(false);
    setSelectedRemarkCustomerId(null);
  };

  const handleUpdateRemarks = async (customerId: number, remarks: string) => {
    try {
      console.log("Updating remarks for customer", customerId, remarks);
      
      // Update the remarks in the frontend
      setCustomers(customers.map(customer =>
        customer.customerId === customerId
          ? { ...customer, remarks }
          : customer
      ));
  
      // Send the updated remarks to the backend
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authorization token found. Please log in again.", {
          position: "top-right",
        });
        return;
      }
  
      await api.patch(
        API_ROUTES.TELECALLING_UPDATE_REMARKS.replace(":id", customerId.toString()),
        { remarks },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

       // Remove the customer from the list in the frontend
    setCustomers(customers.filter((customer) => customer.customerId !== customerId));
  
      toast.success("Remarks updated successfully!", {
        position: "top-right",
      });
    } catch (error) {
      console.error("Error updating remarks:", error);
      toast.error("Failed to update remarks. Please try again.", {
        position: "top-right",
      });
    }
  };

  const handleRemoveProduct = (index: number) => {
    setOrderProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveOrder = async () => {
    if (!selectedCustomer) {
      toast.warning("Please select a customer first", {
        position: "top-right",
      });
      return;
    }

    if (orderProducts.length === 0) {
      toast.warning("Please add at least one product to the order", {
        position: "top-right",
      });
      return;
    }

   

    const requestBody = {
      telecallingCustomerId: selectedCustomer.customerId,
      products: orderProducts,
      remarks,
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token"); 
      if (!token) {
        toast.error("No authorization token found. Please log in again.", {
          position: "top-right",
        });
        return;
      }
      await api.post(API_ROUTES.TELECALLING_ORDERS, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      });
      toast.success("Order saved successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      setOrderProducts([]);
      setRemarks("");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error saving order:", (error as any).response?.data || error.message);
        toast.error((error as any).response?.data?.error || "Failed to save order", {
          position: "top-right",
        });
      } else {
        console.error("Error saving order:", error);
        toast.error("Failed to save order", {
          position: "top-right",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (name: string) => {
    setProductName(name);
    setShowSuggestions(false);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  return (
    <div className="bg-gray-50 min-h-screen"> 
      <ToastContainer />
      
      <NewCustomerModal
      // isOpen={newCustomerModalOpen} // Modal open state
      // onClose={() => setNewCustomerModalOpen(false)} // Close the modal
      // onSave={handleAddNewCustomer} // Save the new customer
    />
      
      {/* Remarks Modal */}
      <AnimatePresence>
        {remarksModalOpen && selectedRemarkCustomerId && (
          <RemarksModal
            isOpen={remarksModalOpen}
            onClose={handleCloseRemarksModal}
            customerId={selectedRemarkCustomerId}
            initialRemarks={customers.find(c => c.customerId === selectedRemarkCustomerId)?.remarks || ""}
            onSave={handleUpdateRemarks}
          />
        )}
      </AnimatePresence>
  
      <div className="max-w-7xl mx-auto p-6">
      <header className="mb-8 flex justify-between items-center">
  <div>
    <div className="flex items-center mb-2">
      <PhoneCall className="text-blue-600 mr-2" size={28} />
      <h1 className="text-3xl font-bold text-gray-800">Telecalling Dashboard</h1>
    </div>
    <p className="text-gray-600">Manage your telecalling customers and orders</p>
  </div>
  
  <button
    onClick={() => setNewCustomerModalOpen(true)} // Open the modal
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
  >
    <Plus size={20} className="mr-2" />
    Add New Customer
  </button>
</header>
  
        {selectedCustomer ? (
          <div className="mb-6 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center bg-white p-4 rounded-lg shadow-md"
            >
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <User className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{selectedCustomer.customerName}</h3>
                <div className="flex items-center text-gray-600">
                  <Store className="mr-1" size={14} />
                  <span className="mr-4">{selectedCustomer.storeName || "N/A"}</span>
                  <PhoneCall className="mr-1" size={14} />
                  <span>{selectedCustomer.customerPhone}</span>
                </div>
              </div>
            </motion.div>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center"
            >
              <X size={16} className="mr-1" />
              Back to List
            </button>
          </div>
        ) : null}
  
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            {!selectedCustomer ? (
              <motion.div
                key="customer-list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {/* Customer List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <User className="text-blue-600 mr-2" size={20} />
                      Customers for Telecalling
                    </h2>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {customers.length} Customers
                    </span>
                  </div>
  
                  {customers.length === 0 ? (
                    <div className="p-10 text-center">
                      {loading ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                          <p className="text-gray-600">Loading customers...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <AlertCircle className="text-gray-400 mb-3" size={48} />
                          <p className="text-gray-600">No customers selected for telecalling.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Store
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Purchase
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Remarks
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {customers.map((customer) => (
                            <motion.tr
                              key={customer.customerId}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.5)" }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">{customer.storeName || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{customer.customerName}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{customer.customerPhone}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {customer.lastPurchaseDate
                                  ? new Date(customer.lastPurchaseDate).toLocaleDateString()
                                  : "No purchases"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-gray-600 mr-2 truncate max-w-xs">
                                    {customer.remarks || "No remarks"}
                                  </span>
                                  <button
                                    onClick={() => handleOpenRemarksModal(customer.customerId, customer.remarks)}
                                    className="px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                  >
                                    <MessageSquare size={16} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleSelectCustomer(customer)}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Create Order
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="order-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {/* Order Form */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <ShoppingCart className="text-blue-600 mr-2" size={20} />
                      Create New Order
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name
                          </label>
                          <div className="relative">
                            <input
                              ref={productInputRef}
                              type="text"
                              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              value={productName}
                              onChange={(e) => setProductName(e.target.value)}
                              onFocus={() => {
                                if (productName.trim() !== "" && products.length > 0) {
                                  setShowSuggestions(true);
                                }
                              }}
                              placeholder="Search for products..."
                            />
                            {showSuggestions && (
                              <motion.div
                                ref={suggestionsRef}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                              >
                                {products.length > 0 ? (
                                  <ul className="divide-y divide-gray-200">
                                    {products.map((product) => (
                                      <motion.li
                                        key={product.id}
                                        whileHover={{ backgroundColor: "rgba(243, 244, 246, 1)" }}
                                        className="p-3 flex justify-between items-center cursor-pointer"
                                        onClick={() => handleSelectProduct(product.name)}
                                      >
                                        <div className="flex items-center">
                                          <Package className="text-blue-600 mr-2" size={16} />
                                          <span>{product.name}</span>
                                        </div>
                                      </motion.li>
                                    ))}
                                  </ul>
                                ) : null}
  
                                {!products.some(
                                  (product) =>
                                    product.name.toLowerCase() === productName.toLowerCase()
                                ) &&
                                  productName.trim() !== "" && (
                                    <motion.div
                                      whileHover={{ backgroundColor: "rgba(243, 244, 246, 1)" }}
                                      className="p-3 flex justify-between items-center bg-yellow-50 cursor-pointer"
                                      onClick={() => handleSelectProduct(productName)}
                                    >
                                      <div className="flex items-center">
                                        <Plus className="text-blue-600 mr-2" size={16} />
                                        <span>{productName}</span>
                                      </div>
                                      <span className="text-xs text-white bg-blue-500 px-2 py-1 rounded-md">
                                        New
                                      </span>
                                    </motion.div>
                                  )}
                              </motion.div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            className="w-full border border-gray-300 rounded-md p-3"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            min={1}
                          />
                        </div>
                        <button
                          onClick={handleAddProduct}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Product
                        </button>
                      </div>
                      <div>
                        {/* Products in Order - replaces the rename section */}
                        <div>
                          <h3 className="block text-sm font-medium text-gray-700 mb-3">
                            Products in Order
                          </h3>
                          {orderProducts.length > 0 ? (
                            <ul className="space-y-2 max-h-60 overflow-y-auto">
                              {orderProducts.map((product, index) => (
                                <li
                                  key={index}
                                  className="flex items-center justify-between bg-gray-100 p-3 rounded-md"
                                >
                                  <div>
                                    <p className="font-medium">{product.productName}</p>
                                    <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveProduct(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X size={16} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-600 bg-gray-100 p-4 rounded-md">No products added yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
  
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleSaveOrder}
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {loading ? "Saving..." : "Save Order"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Telecalling;
