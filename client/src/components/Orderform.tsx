import React, { useState, useEffect, useRef } from "react";
import { motion} from "framer-motion";
import { toast } from "react-toastify";
import { 
  ShoppingCart, 
  Package, 
  X,
  Plus
} from "lucide-react";
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

interface Customer {
  customerId: number;
  customerName: string;
  customerPhone: string;
  storeName: string | null;
}

interface OrderComponentProps {
  customer: Customer;
  onOrderComplete?: () => void;
  onCancel?: () => void;
}

const OrderComponent: React.FC<OrderComponentProps> = ({ 
  customer, 
  onOrderComplete,
  onCancel
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [remarks, setRemarks] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const productInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle clicks outside the suggestions box
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          productInputRef.current && !productInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (productName.trim() === "") {
        setProducts([]); // Clear the list if input is empty
        return;
      }

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
      telecallingCustomerId: customer.customerId,
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
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Order saved successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      setOrderProducts([]);
      setRemarks("");
      if (onOrderComplete) {
        onOrderComplete();
      }
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

  return (
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <ShoppingCart className="text-blue-600 mr-2" size={20} />
              Create New Order
            </h2>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Customer: {customer.customerName} {customer.storeName ? `(${customer.storeName})` : ''}
          </div>
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
              {/* Products in Order */}
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
              
              {/* Remarks field */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 h-24"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any notes about this order..."
                />
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
  );
};

export default OrderComponent;