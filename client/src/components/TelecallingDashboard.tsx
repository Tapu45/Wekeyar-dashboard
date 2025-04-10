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
  Loader,
  Search,
  Filter
} from "lucide-react";

interface OrderDetail {
  productName: string;
  quantity: number;
  isNewProduct: boolean;
}

interface TelecallingOrder {
  id: number;
  orderDetails: OrderDetail[];
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



interface TelecallerWithOrderCount {
  id: number;
  username: string;
  email: string;
  orderCount: number;
}

const TelecallingDashboard: React.FC = () => {
  const [telecallingOrders, setTelecallingOrders] = useState<TelecallingOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<TelecallingOrder[]>([]);
  const [telecallersWithOrders, setTelecallersWithOrders] = useState<TelecallerWithOrderCount[]>([]);
  const [filteredTelecallers, setFilteredTelecallers] = useState<TelecallerWithOrderCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    orders: true,
    newProducts: true,
    telecallers: true
  });
  
  // For showing/hiding order details
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);

  // For sorting functionality
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);

  // For date range filter
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // For telecaller search
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all telecalling orders
        const ordersResponse = await api.get(API_ROUTES.TELECALLING_ALL_ORDERS);
        setTelecallingOrders(ordersResponse.data);
        setFilteredOrders(ordersResponse.data);

        // Fetch telecallers with order count
        const telecallersResponse = await api.get(API_ROUTES.TELECALLERS_WITH_ORDERS);
        setTelecallersWithOrders(telecallersResponse.data);
        setFilteredTelecallers(telecallersResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter orders by date range
  useEffect(() => {
    if (!startDate && !endDate) {
      setFilteredOrders(telecallingOrders);
      return;
    }

    const filtered = telecallingOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000); // Max date
      
      // Set hours to 0 and 23 for proper comparison
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      return orderDate >= start && orderDate <= end;
    });
    
    setFilteredOrders(filtered);
  }, [startDate, endDate, telecallingOrders]);

  // Filter telecallers by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTelecallers(telecallersWithOrders);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = telecallersWithOrders.filter(telecaller => 
      telecaller.username.toLowerCase().includes(term) || 
      telecaller.email.toLowerCase().includes(term)
    );
    
    setFilteredTelecallers(filtered);
  }, [searchTerm, telecallersWithOrders]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const resetDateFilters = () => {
    setStartDate("");
    setEndDate("");
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

  const sortedOrders = getSortedItems(filteredOrders, sortConfig?.key);
  const sortedTelecallers = getSortedItems(filteredTelecallers, sortConfig?.key);

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
                {/* Date Range Filter */}
                <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center">
                      <Filter size={18} className="text-blue-600 mr-2" />
                      <span className="font-medium text-blue-800">Filter Orders by Date:</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center gap-2">
                        <label htmlFor="startDate" className="text-sm text-blue-700">From:</label>
                        <input
                          type="date"
                          id="startDate"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label htmlFor="endDate" className="text-sm text-blue-700">To:</label>
                        <input
                          type="date"
                          id="endDate"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <button 
                        onClick={resetDateFilters}
                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  
                  {(startDate || endDate) && (
                    <div className="mt-3 text-sm text-blue-700">
                      <span className="font-medium">Filtered Results:</span> {filteredOrders.length} orders 
                      {startDate && !endDate && ` from ${new Date(startDate).toLocaleDateString()}`}
                      {!startDate && endDate && ` until ${new Date(endDate).toLocaleDateString()}`}
                      {startDate && endDate && ` from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-blue-50">
                        <ThHeader label="Order ID" sortKey="id" />
                        <ThHeader label="Products" sortKey="productName" />
                        <ThHeader label="Customer Name" sortKey="telecallingCustomer.customerName" />
                        <ThHeader label="Telecaller" sortKey="telecaller.username" />
                        <ThHeader label="Order Date" sortKey="orderDate" />
                        <th className="border-b border-blue-200 px-4 py-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOrders.length > 0 ? (
                        sortedOrders.map((order) => (
                          <React.Fragment key={order.id}>
                            <tr className="hover:bg-blue-50 transition-colors">
                              <td className="border-b border-blue-100 px-4 py-3 text-blue-700 font-medium">#{order.id}</td>
                              <td className="border-b border-blue-100 px-4 py-3">
                                <div className="flex items-center">
                                  <Package size={16} className="text-blue-500 mr-2" />
                                  <span className="text-gray-700">
                                    {order.orderDetails.length > 1 
                                      ? `${order.orderDetails.length} products` 
                                      : order.orderDetails[0]?.productName || 'No products'}
                                  </span>
                                </div>
                              </td>
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
                              <td className="border-b border-blue-100 px-4 py-3">
                                <button 
                                  className="text-blue-600 hover:text-blue-800 focus:outline-none flex items-center"
                                  onClick={() => toggleOrderDetails(order.id)}
                                >
                                  {expandedOrders.includes(order.id) 
                                    ? <><ChevronUp size={16} className="mr-1" /> Hide Details</> 
                                    : <><ChevronDown size={16} className="mr-1" /> View Details</>}
                                </button>
                              </td>
                            </tr>
                            
                            {/* Expanded Order Details */}
                            {expandedOrders.includes(order.id) && (
                              <tr>
                                <td colSpan={6} className="bg-blue-50 px-4 py-3">
                                  <div className="p-3 rounded-md">
                                    <h4 className="font-medium text-blue-800 mb-2">Order Details</h4>
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-blue-200">
                                          <th className="py-2 px-3 text-left">Product Name</th>
                                          <th className="py-2 px-3 text-left">Quantity</th>
                                          <th className="py-2 px-3 text-left">Type</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {order.orderDetails.map((detail: { productName: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; quantity: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; isNewProduct: any; }, index: React.Key | null | undefined) => (
                                          <tr key={index} className="border-b border-blue-100">
                                            <td className="py-2 px-3">{detail.productName}</td>
                                            <td className="py-2 px-3">{detail.quantity}</td>
                                            <td className="py-2 px-3">
                                              {detail.isNewProduct && (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">New</span>
                                              )}
                                              {!detail.isNewProduct && (
                                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Existing</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    <div className="mt-3 flex items-center text-sm text-blue-600">
                                      <Phone size={14} className="mr-2" />
                                      Customer Phone: {order.telecallingCustomer.customerPhone}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            {startDate || endDate ? 
                              "No orders found for the selected date range." : 
                              "No orders available."}
                          </td>
                        </tr>
                      )}
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
                {/* Search Box for Telecallers */}
                <div className="mb-6 flex items-center bg-blue-50 p-4 rounded-lg">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-blue-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by username or email..."
                      className="block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-700"
                        onClick={() => setSearchTerm("")}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
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
                      {sortedTelecallers.length > 0 ? (
                        sortedTelecallers.map((telecaller) => (
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            {searchTerm ? 
                              "No telecallers found matching your search." : 
                              "No telecallers available."}
                          </td>
                        </tr>
                      )}
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