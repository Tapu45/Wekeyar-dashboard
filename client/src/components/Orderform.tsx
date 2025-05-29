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

// Responsive Remarks Modal Component
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md mx-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
            <MessageSquare className="text-blue-600 mr-2" size={18} />
            <span className="truncate">Customer Remarks</span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <textarea
          className="w-full border border-gray-300 rounded-md p-3 h-24 sm:h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add remarks about this customer..."
        />

        <div className="flex flex-col sm:flex-row justify-end mt-4 space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
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
  const pageSize = 10;

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
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (productName.trim() === "") {
      setProducts([]);
      setShowSuggestions(false);
      return;
    }

    if (productName === selectedProductName && selectedProductName !== "") {
      return;
    }

    if (selectedProductName !== "" && productName !== selectedProductName) {
      setSelectedProductName("");
    }

    setPage(1);
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchProducts(productName, 1);
    }, 400);

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
    
    setProductName("");
    setSelectedProductName("");
    setQuantity(1);
    setShowSuggestions(false);
    setProducts([]);
    
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
      remarks: remarks,
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
    
    const quantityInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    if (quantityInput) {
      quantityInput.focus();
    }
  };

  const handleOpenRemarksModal = () => {
    setRemarksModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && productName.trim() !== "") {
      if (showSuggestions && selectedProductName === "") {
        if (products.length > 0) {
          handleSelectProduct(products[0].name);
        } else {
          handleAddProduct();
        }
      } else {
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
      
      {/* Header - Responsive */}
      <div className="p-3 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center min-w-0">
          <ShoppingCart className="text-blue-600 mr-2 flex-shrink-0" size={20} />
          <span className="truncate">
            Create New Order {customerName ? `for ${customerName}` : ''}
          </span>
        </h2>
        <button
          onClick={handleOpenRemarksModal}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center text-sm sm:text-base"
        >
          <MessageSquare className="mr-2 flex-shrink-0" size={16} />
          <span>Add Remarks Only</span>
        </button>
      </div>
      
      <div className="p-3 sm:p-6">
        {/* Main Content Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Product Input Section */}
          <div className="space-y-4 order-1">
            {/* Product Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Product Name
              </label>
              <div className="relative">
                <input
                  ref={productInputRef}
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-2 sm:p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
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
                {/* Product Suggestions - Responsive */}
                {showSuggestions && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 sm:max-h-60 overflow-y-auto"
                  >
                    {searchLoading && products.length === 0 && (
                      <div className="p-3 text-gray-600 text-center text-sm">
                        Loading products...
                      </div>
                    )}
                    
                    {!searchLoading && products.length === 0 && productName.trim() !== "" && (
                      <div className="p-3 text-gray-600 text-sm">
                        No products found. You can add a new product.
                      </div>
                    )}
                    
                    {products.length > 0 && (
                      <ul className="divide-y divide-gray-200">
                        {products.map((product) => (
                          <motion.li
                            key={product.id}
                            whileHover={{ backgroundColor: "rgba(243, 244, 246, 1)" }}
                            className="p-2 sm:p-3 flex justify-between items-center cursor-pointer"
                            onClick={() => handleSelectProduct(product.name)}
                          >
                            <div className="flex items-center min-w-0">
                              <Package className="text-blue-600 mr-2 flex-shrink-0" size={14} />
                              <span className="text-sm sm:text-base truncate">{product.name}</span>
                            </div>
                          </motion.li>
                        ))}
                        
                        {products.length < totalProducts && (
                          <li className="p-2 text-center">
                            <button 
                              onClick={handleLoadMore}
                              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
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
                          className="p-2 sm:p-3 flex justify-between items-center bg-yellow-50 cursor-pointer"
                          onClick={() => handleSelectProduct(productName)}
                        >
                          <div className="flex items-center min-w-0">
                            <Plus className="text-blue-600 mr-2 flex-shrink-0" size={14} />
                            <span className="text-sm sm:text-base truncate">{productName}</span>
                          </div>
                          <span className="text-xs text-white bg-blue-500 px-2 py-1 rounded-md flex-shrink-0">
                            New
                          </span>
                        </motion.div>
                      )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Quantity
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md p-2 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
              />
            </div>

            {/* Add Product Button */}
            <button
              onClick={handleAddProduct}
              className="w-full sm:w-auto px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
            >
              Add Product
            </button>
          </div>

          {/* Products in Order Section */}
          <div className="order-2 lg:order-2">
            <h3 className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Products in Order ({orderProducts.length})
            </h3>
            {orderProducts.length > 0 ? (
              <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                {orderProducts.map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-md"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {product.productName}
                        {product.isNewProduct && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            New
                          </span>
                        )}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Quantity: {product.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveProduct(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 ml-2 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600 bg-gray-100 p-4 rounded-md text-center text-sm sm:text-base">
                No products added yet.
              </div>
            )}
          </div>
        </div>

        {/* Order Remarks Section - Responsive */}
        <div className="mt-4 sm:mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Order Remarks (Optional)
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 sm:p-3 h-16 sm:h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any notes about this order or customer..."
          />
        </div>

        {/* Save Button - Responsive */}
        <div className="mt-4 sm:mt-6 flex justify-end">
          <button
            onClick={handleSaveOrder}
            disabled={loading || orderProducts.length === 0}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors text-sm sm:text-base font-medium ${
              loading || orderProducts.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;