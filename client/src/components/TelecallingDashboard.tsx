import React, { useEffect, useState } from "react";
import api, { API_ROUTES } from "../utils/api";
import { 
  Package, 
  ShoppingCart, 
  User, 
  Phone, 
  Calendar, 
  ChevronUp, 
  ChevronDown,
  Loader
} from "lucide-react";

interface TelecallingOrder {
  id: number;
  productName: string;
  quantity: number;
  isNewProduct: boolean;
  orderDate: string;
  telecallingCustomer: {
    id: number;
    customerName: string;
    customerPhone: string;
  };
  telecaller: {
    id: number;
    username: string;
    email: string;
  };
}

interface NewProduct {
  id: number;
  productName: string;
  quantity: number;
  orderDate: string;
  telecallingCustomer: {
    id: number;
    customerName: string;
    customerPhone: string;
  };
  telecaller: {
    id: number;
    username: string;
  };
}

interface TelecallerWithOrderCount {
  id: number;
  username: string;
  email: string;
  orderCount: number;
}

const TelecallingDashboard: React.FC = () => {
  const [telecallingOrders, setTelecallingOrders] = useState<TelecallingOrder[]>([]);
  const [newProducts, setNewProducts] = useState<NewProduct[]>([]);
  const [telecallersWithOrders, setTelecallersWithOrders] = useState<TelecallerWithOrderCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    orders: true,
    newProducts: true,
    telecallers: true
  });

  // For sorting functionality
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all telecalling orders
        const ordersResponse = await api.get(API_ROUTES.TELECALLING_ALL_ORDERS);
        setTelecallingOrders(ordersResponse.data);

        // Fetch new products
        const newProductsResponse = await api.get(API_ROUTES.TELECALLING_NEW_PRODUCTS);
        setNewProducts(newProductsResponse.data);

        // Fetch telecallers with order count
        const telecallersResponse = await api.get(API_ROUTES.TELECALLERS_WITH_ORDERS);
        setTelecallersWithOrders(telecallersResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = (items: any[], sortKey: string | null = null) => {
    if (!sortConfig || !sortKey) return items;
    
    return [...items].sort((a, b) => {
      // Handle nested properties
      let aValue, bValue;

      if (sortKey.includes('.')) {
        const keys = sortKey.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      } else {
        aValue = a[sortKey];
        bValue = b[sortKey];
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const sortedOrders = getSortedItems(telecallingOrders, sortConfig?.key);
  const sortedNewProducts = getSortedItems(newProducts, sortConfig?.key);
  const sortedTelecallers = getSortedItems(telecallersWithOrders, sortConfig?.key);

  const ThHeader: React.FC<{ label: string; sortKey: string; className?: string }> = ({ label, sortKey, className = "" }) => (
    <th 
      className={`border-b border-blue-200 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-blue-50 transition-colors ${className}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {getSortIndicator(sortKey)}
      </div>
    </th>
  );

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold animate-fadeIn">Telecalling Dashboard</h1>
        <p className="text-blue-100 mt-2">Real-time overview of telecalling operations</p>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center p-10">
            <Loader className="animate-spin text-blue-500 mr-2" size={24} />
            <p className="text-blue-500 font-medium">Loading dashboard data...</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid gap-8 animate-fadeInUp">
          {/* Section: All Telecalling Orders */}
          <section className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 transform hover:shadow-lg border border-blue-100">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('orders')}
            >
              <div className="flex items-center">
                <ShoppingCart className="mr-2" size={20} />
                <h2 className="text-xl font-semibold">All Telecalling Orders</h2>
              </div>
              {expandedSections.orders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.orders && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-blue-50">
                        <ThHeader label="Order ID" sortKey="id" />
                        <ThHeader label="Product Name" sortKey="productName" />
                        <ThHeader label="Quantity" sortKey="quantity" />
                        <ThHeader label="Customer Name" sortKey="telecallingCustomer.customerName" />
                        <ThHeader label="Telecaller" sortKey="telecaller.username" />
                        <ThHeader label="Order Date" sortKey="orderDate" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                          <td className="border-b border-blue-100 px-4 py-3 text-blue-700 font-medium">#{order.id}</td>
                          <td className="border-b border-blue-100 px-4 py-3">
                            <div className="flex items-center">
                              <Package size={16} className="text-blue-500 mr-2" />
                              {order.productName}
                              {order.isNewProduct && (
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">New</span>
                              )}
                            </div>
                          </td>
                          <td className="border-b border-blue-100 px-4 py-3">{order.quantity}</td>
                          <td className="border-b border-blue-100 px-4 py-3">
                            <div className="flex items-center">
                              <User size={16} className="text-blue-500 mr-2" />
                              {order.telecallingCustomer.customerName}
                            </div>
                          </td>
                          <td className="border-b border-blue-100 px-4 py-3">{order.telecaller.username}</td>
                          <td className="border-b border-blue-100 px-4 py-3">
                            <div className="flex items-center">
                              <Calendar size={16} className="text-blue-500 mr-2" />
                              {new Date(order.orderDate).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Section: New Products */}
          <section className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 transform hover:shadow-lg border border-blue-100">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('newProducts')}
            >
              <div className="flex items-center">
                <Package className="mr-2" size={20} />
                <h2 className="text-xl font-semibold">New Products</h2>
              </div>
              {expandedSections.newProducts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.newProducts && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-blue-50">
                        <ThHeader label="Product ID" sortKey="id" />
                        <ThHeader label="Product Name" sortKey="productName" />
                        <ThHeader label="Quantity" sortKey="quantity" />
                        <ThHeader label="Customer Name" sortKey="telecallingCustomer.customerName" />
                        <ThHeader label="Telecaller" sortKey="telecaller.username" />
                        <ThHeader label="Order Date" sortKey="orderDate" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedNewProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-blue-50 transition-colors">
                          <td className="border-b border-blue-100 px-4 py-3 text-blue-700 font-medium">#{product.id}</td>
                          <td className="border-b border-blue-100 px-4 py-3">
                            <div className="flex items-center">
                              <Package size={16} className="text-blue-500 mr-2" />
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">New</span>
                              {product.productName}
                            </div>
                          </td>
                          <td className="border-b border-blue-100 px-4 py-3">{product.quantity}</td>
                          <td className="border-b border-blue-100 px-4 py-3">
                            <div className="flex items-center">
                              <User size={16} className="text-blue-500 mr-2" />
                              {product.telecallingCustomer.customerName}
                            </div>
                          </td>
                          <td className="border-b border-blue-100 px-4 py-3">{product.telecaller.username}</td>
                          <td className="border-b border-blue-100 px-4 py-3">
                            <div className="flex items-center">
                              <Calendar size={16} className="text-blue-500 mr-2" />
                              {new Date(product.orderDate).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Section: Telecallers with Order Count */}
          <section className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 transform hover:shadow-lg border border-blue-100">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('telecallers')}
            >
              <div className="flex items-center">
                <Phone className="mr-2" size={20} />
                <h2 className="text-xl font-semibold">Telecallers Performance</h2>
              </div>
              {expandedSections.telecallers ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.telecallers && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-blue-50">
                        <ThHeader label="Telecaller ID" sortKey="id" />
                        <ThHeader label="Username" sortKey="username" />
                        <ThHeader label="Email" sortKey="email" />
                        <ThHeader label="Order Count" sortKey="orderCount" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTelecallers.map((telecaller) => (
                        <tr key={telecaller.id} className="hover:bg-blue-50 transition-colors">
                          <td className="border-b border-blue-100 px-4 py-3 text-blue-700 font-medium">#{telecaller.id}</td>
                          <td className="border-b border-blue-100 px-4 py-3">
                            <div className="flex items-center">
                              <User size={16} className="text-blue-500 mr-2" />
                              {telecaller.username}
                            </div>
                          </td>
                          <td className="border-b border-blue-100 px-4 py-3">{telecaller.email}</td>
                          <td className="border-b border-blue-100 px-4 py-3">
                            <div className="flex items-center">
                              <span className={`px-3 py-1 rounded-full text-white ${
                                telecaller.orderCount > 10 ? 'bg-green-500' : 
                                telecaller.orderCount > 5 ? 'bg-blue-500' : 'bg-yellow-500'
                              }`}>
                                {telecaller.orderCount}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};



export default TelecallingDashboard;