import React, { useState, useEffect } from "react";
import { Phone, Store, MapPin, Trash2, ArrowUpRight, Search, PlusCircle, RefreshCw, Calendar } from "lucide-react";
import api, { API_ROUTES } from "../utils/api";
import { toast } from "react-toastify";

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

const NewTelecallingCustomersPage: React.FC<NewTelecallingCustomersPageProps> = ({ viewMode = 'grid' }) => {
  const [customers, setCustomers] = useState<NewCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
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

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      setIsDeleting(id);
      try {
        await api.delete(`${API_ROUTES.TELECALLING_GET_NEW_CUSTOMERS}/${id}`);
        setCustomers(customers.filter(customer => customer.id !== id));
        toast.success("Customer deleted successfully!", {
          position: "top-right"
        });
      } catch (error) {
        console.error("Error deleting customer:", error);
        toast.error("Failed to delete customer. Please try again.", {
          position: "top-right"
        });
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    customer =>
      customer.customerName.toLowerCase().includes(search.toLowerCase()) ||
      customer.customerPhone.includes(search) ||
      customer.storeName.toLowerCase().includes(search.toLowerCase())
  );

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
    <div>
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone, or store..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Button bar */}
      <div className="flex justify-between mb-6">
        <span className="text-sm text-gray-500">
          {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'} found
        </span>
        <button
          onClick={fetchNewCustomers}
          className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={16} className="mr-1" />
          Refresh
        </button>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mb-4"></div>
          <p className="text-gray-600">Loading new customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {search ? (
            <>
              <p className="text-xl font-medium text-gray-700 mb-2">No matching customers found</p>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </>
          ) : (
            <>
              <p className="text-xl font-medium text-gray-700 mb-2">No new customers found</p>
              <p className="text-gray-500">Add new customers to see them here</p>
              <button 
                onClick={() => window.location.search = '?tab=add'}
                className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusCircle size={18} className="mr-1" />
                Add New Customer
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((customer) => (
            <div 
              key={customer.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
                    {customer.customerName}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    New
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Phone size={16} className="mr-2 text-gray-400" />
                    <span>{customer.customerPhone}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Store size={16} className="mr-2 text-gray-400" />
                    <span className="line-clamp-1">{customer.storeName}</span>
                  </div>
                  
                  {customer.address && (
                    <div className="flex items-start text-gray-600">
                      <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-gray-400" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 pt-1 flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {formatDate(customer.createdAt)}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-5 py-3 flex justify-between">
                <button
                  onClick={() => handleDelete(customer.id)}
                  disabled={isDeleting === customer.id}
                  className={`text-red-600 hover:text-red-800 text-sm flex items-center ${
                    isDeleting === customer.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isDeleting === customer.id ? (
                    <><span className="inline-block animate-spin h-3 w-3 border-b-2 border-red-600 rounded-full mr-1"></span> Deleting...</>
                  ) : (
                    <><Trash2 size={14} className="mr-1" /> Delete</>
                  )}
                </button>
                
                <button 
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <ArrowUpRight size={14} className="mr-1" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added On
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone size={14} className="mr-1" />
                          {customer.customerPhone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.storeName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {customer.address || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        disabled={isDeleting === customer.id}
                        className={`text-red-600 hover:text-red-900 ${isDeleting === customer.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isDeleting === customer.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NewTelecallingCustomersPage;