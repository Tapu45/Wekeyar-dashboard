import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ShoppingCart, Package, Plus, X, MessageSquare } from "lucide-react";
import api, { API_ROUTES } from "../utils/api";

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

interface OrderFormProps {
  selectedCustomerId: number;
  customerName?: string;
  initialRemarks?: string;
  onOrderSaved: () => void;
  onRemarkSaved?: () => void;
}

interface RemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  initialRemarks: string;
  onSave: (customerId: number, remarks: string) => void;
}

// Remarks Modal Component
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
    onSave(customerId, remarks);
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

const OrderForm: React.FC<OrderFormProps> = ({ 
  selectedCustomerId, 
  customerName,
  initialRemarks = "",
  onOrderSaved,
  onRemarkSaved
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [remarks, setRemarks] = useState(initialRemarks);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const productInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedProductName, setSelectedProductName] = useState("");

  // Pagination for product search
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 10; // Limit results per request

  const fetchProducts = useCallback(async (searchTerm: string, pageNum: number = 1) => {
    if (searchTerm.trim() === "") {
      setProducts([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await api.get(API_ROUTES.TELECALLING_PRODUCTS, {
        params: { 
          search: searchTerm,
          page: pageNum,
          limit: pageSize 
        },
      });
      
      // Update depending on if it's a new search or pagination
      if (pageNum === 1) {
        setProducts(response.data.products || response.data);
        setTotalProducts(response.data.total || response.data.length);
      } else {
        setProducts(prev => [...prev, ...(response.data.products || response.data)]);
      }
      
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products", {
        position: "top-right",
      });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle product search with debounce
  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Don't search if the input is empty
    if (productName.trim() === "") {
      setProducts([]);
      setShowSuggestions(false);
      return;
    }

    // If the product name matches exactly what was just selected, don't search again
    if (productName === selectedProductName && selectedProductName !== "") {
      return;
    }

    // Reset selected product when user types
    if (selectedProductName !== "" && productName !== selectedProductName) {
      setSelectedProductName("");
    }

    // Reset pagination on new search
    setPage(1);
    
    // Create a new timeout for debouncing
    debounceTimeoutRef.current = setTimeout(() => {
      fetchProducts(productName, 1);
    }, 400); // Increased debounce timeout

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [productName, fetchProducts, selectedProductName]);

  // Handle clicks outside the suggestions box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        productInputRef.current && 
        !productInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoadMore = () => {
    if (products.length < totalProducts) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(productName, nextPage);
    }
  };

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
    
    // Reset product selection state
    setProductName("");
    setSelectedProductName("");
    setQuantity(1);
    setShowSuggestions(false);
    setProducts([]);
    
    // Focus back on the input for next entry
    if (productInputRef.current) {
      productInputRef.current.focus();
    }
  };

  const handleRemoveProduct = (index: number) => {
    setOrderProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveOrder = async () => {
    if (orderProducts.length === 0) {
      toast.warning("Please add at least one product to the order", {
        position: "top-right",
      });
      return;
    }

    const requestBody = {
      telecallingCustomerId: selectedCustomerId,
      products: orderProducts,
      remarks: remarks, // Include remarks with the order
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
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Order saved successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      setOrderProducts([]);
      setProductName("");
      setSelectedProductName("");
      setQuantity(1);
      setRemarks("");
      onOrderSaved();
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Failed to save order. Please try again.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRemarkOnly = async (customerId: number, remarks: string) => {
    try {
      setLoading(true);
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

      toast.success("Remarks saved successfully!", {
        position: "top-right",
      });
      
      setRemarks("");
      if (onRemarkSaved) {
        onRemarkSaved();
      }
    } catch (error) {
      console.error("Error updating remarks:", error);
      toast.error("Failed to update remarks. Please try again.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (name: string) => {
    setProductName(name);
    setSelectedProductName(name);
    setShowSuggestions(false);
    
    // Focus on quantity field after selection
    const quantityInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    if (quantityInput) {
      quantityInput.focus();
    }
  };

  const handleOpenRemarksModal = () => {
    setRemarksModalOpen(true);
  };

  // Handle Enter key to add product
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && productName.trim() !== "") {
      // If suggestions are open and product name doesn't match a selected product,
      // select the first product or continue with the current product name
      if (showSuggestions && selectedProductName === "") {
        if (products.length > 0) {
          handleSelectProduct(products[0].name);
        } else {
          handleAddProduct();
        }
      } else {
        // If product is already selected or suggestions are closed
        handleAddProduct();
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <ToastContainer />
      
      {/* Remarks Modal */}
      <RemarksModal
        isOpen={remarksModalOpen}
        onClose={() => setRemarksModalOpen(false)}
        customerId={selectedCustomerId}
        initialRemarks={remarks}
        onSave={handleSaveRemarkOnly}
      />
      
      <div className="p-5 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <ShoppingCart className="text-blue-600 mr-2" size={20} />
          Create New Order {customerName ? `for ${customerName}` : ''}
        </h2>
        <button
          onClick={handleOpenRemarksModal}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors flex items-center"
        >
          <MessageSquare className="mr-2" size={16} />
          Add Remarks Only
        </button>
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
                  onKeyDown={handleKeyDown}
                  placeholder="Search for products..."
                />
                {showSuggestions && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                  >
                    {searchLoading && products.length === 0 && (
                      <div className="p-3 text-gray-600 text-center">
                        Loading products...
                      </div>
                    )}
                    
                    {!searchLoading && products.length === 0 && productName.trim() !== "" && (
                      <div className="p-3 text-gray-600">
                        No products found. You can add a new product.
                      </div>
                    )}
                    
                    {products.length > 0 && (
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
                        
                        {products.length < totalProducts && (
                          <li className="p-2 text-center">
                            <button 
                              onClick={handleLoadMore}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              disabled={searchLoading}
                            >
                              {searchLoading ? "Loading more..." : "Load more products"}
                            </button>
                          </li>
                        )}
                      </ul>
                    )}

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

        {/* Optional remarks section directly in the form */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Remarks (Optional)
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-3 h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any notes about this order or customer..."
          />
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
  );
};

export default OrderForm;