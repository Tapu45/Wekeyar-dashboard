import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";
import { FaStore, FaUser, FaPhone, FaCalendar, FaCheckSquare, FaRegSquare, FaSearch, FaSpinner, FaPaperPlane, FaCheck, FaSort } from "react-icons/fa";

interface InactiveCustomer {
  id: number;
  name: string;
  phone: string;
  lastPurchaseDate: string | null;
  storeName: string | null;
  status: string;
}
interface InactiveCustomerListProps {
  onCopyToTelecalling: (customers: InactiveCustomer[]) => void;
  fromDate: string | null;
  toDate: string | null;
}
const fetchInactiveCustomers = async ({ queryKey }: { queryKey: any }): Promise<InactiveCustomer[]> => {
  const [, fromDate, toDate] = queryKey; // Extract fromDate and toDate from the query key

  const { data } = await api.get(API_ROUTES.INACTIVE_CUSTOMERS, {
    params: { fromDate, toDate },
  });

  return data.map((customer: any) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    lastPurchaseDate: customer.lastPurchaseDate,
    storeName: customer.storeName,
    status: customer.status,
  }));
};

const InactiveCustomerList: React.FC<InactiveCustomerListProps> = ({ onCopyToTelecalling, fromDate, toDate }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["inactiveCustomers", fromDate, toDate], // Include fromDate and toDate in the query key
    queryFn: fetchInactiveCustomers,
  });

  const [selectedCustomers, setSelectedCustomers] = useState<InactiveCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSelectCustomer = (customer: InactiveCustomer) => {
    setSelectedCustomers((prev) =>
      prev.find((c) => c.id === customer.id)
        ? prev.filter((c) => c.id !== customer.id)
        : [...prev, customer]
    );
  };

  const handleCopyToTelecalling = () => {
    onCopyToTelecalling(selectedCustomers);
    setSelectedCustomers([]);
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCustomers([]);
    } else {
      if (filteredData) {
        setSelectedCustomers([...filteredData]);
      }
    }
    setSelectAll(!selectAll);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

 const filteredData = data?.filter((customer) => 
  (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
  (customer.phone && customer.phone.includes(searchTerm)) ||
  (customer.storeName && customer.storeName.toLowerCase().includes(searchTerm.toLowerCase()))
);

  // Apply sorting to filtered data
  const sortedData = filteredData ? [...filteredData] : [];
  if (sortField) {
    sortedData.sort((a: any, b: any) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Special handling for dates
      if (sortField === 'lastPurchaseDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg p-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
          <motion.div 
            className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.p 
          className="mt-6 text-blue-700 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading inactive customers...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="text-center p-6 bg-white rounded-lg border border-blue-100 shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600 font-medium">Failed to load inactive customers.</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-md">
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-lg border border-blue-200 overflow-hidden shadow-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="p-4 border-b border-blue-100 bg-blue-50">
        <h3 className="text-xl font-bold text-blue-800 mb-4">Inactive Customers</h3>
        
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-blue-500">
              <FaSearch />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by name, phone or store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <span className="text-blue-700 mr-2">
              {selectedCustomers.length} of {data?.length || 0} selected
            </span>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center px-4 py-2 rounded-md ml-2 shadow-md ${
                selectedCustomers.length > 0 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-blue-200 text-blue-500 cursor-not-allowed"
              }`}
              onClick={handleCopyToTelecalling}
              disabled={selectedCustomers.length === 0}
            >
              <FaPaperPlane className="mr-2" />
              Copy to Telecalling
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="relative">
        {/* Select All Button */}
        <div className="bg-white p-2 border-b border-blue-100 flex items-center justify-between sticky top-0 z-10">
          <div 
            className="flex items-center cursor-pointer px-3 py-1 bg-blue-50 rounded-md hover:bg-blue-100"
            onClick={handleSelectAll}
          >
            {selectAll ? (
              <FaCheckSquare className="text-blue-600 text-lg mr-2" />
            ) : (
              <FaRegSquare className="text-blue-400 text-lg mr-2" />
            )}
            <span className="text-blue-700 font-medium">
              {selectAll ? "Deselect All" : "Select All"}
            </span>
          </div>
          
          <div className="text-sm text-blue-600">
            {sortField && (
              <div className="flex items-center bg-blue-50 px-3 py-1 rounded-md">
                <span>Sorted by: <span className="font-medium capitalize">{sortField}</span></span>
                <span className="ml-1">({sortDirection === 'asc' ? '↑' : '↓'})</span>
                <button 
                  className="ml-2 text-blue-700"
                  onClick={() => {setSortField(null)}}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Table with Fixed Height and Scrollbar */}
        <div className="overflow-auto" style={{ maxHeight: '400px' }}>
          <table className="min-w-full divide-y divide-blue-100">
            <thead className="bg-blue-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <div className="mr-2">
                      Select
                    </div>
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100"
                  onClick={() => handleSort('storeName')}
                >
                  <div className="flex items-center">
                    <FaStore className="mr-2 text-blue-400" />
                    Store
                    <FaSort className="ml-2 text-blue-300" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    <FaUser className="mr-2 text-blue-400" />
                    Customer
                    <FaSort className="ml-2 text-blue-300" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100"
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center">
                    <FaPhone className="mr-2 text-blue-400" />
                    Phone
                    <FaSort className="ml-2 text-blue-300" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100"
                  onClick={() => handleSort('lastPurchaseDate')}
                >
                  <div className="flex items-center">
                    <FaCalendar className="mr-2 text-blue-400" />
                    Last Purchase
                    <FaSort className="ml-2 text-blue-300" />
                  </div>
                </th>
                <th
  scope="col"
  className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider"
>
  Status
</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-blue-500">
                    No inactive customers found matching your search.
                  </td>
                </tr>
              ) : (
                sortedData.map((customer, index) => (
                  <motion.tr 
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    whileHover={{ backgroundColor: "rgba(239, 246, 255, 0.6)" }}
                    className={selectedCustomers.some(c => c.id === customer.id) ? "bg-blue-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="cursor-pointer flex items-center justify-center w-6 h-6 rounded-md hover:bg-blue-100"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          {selectedCustomers.some(c => c.id === customer.id) ? (
                            <FaCheck className="text-blue-600" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-blue-300 rounded"></div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.storeName || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start flex-col">
                        <div className="text-xs text-blue-500">#{customer.id}</div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.lastPurchaseDate ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-800 rounded-full">
                          {new Date(customer.lastPurchaseDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          Never
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
  <span
    className={`px-2 py-1 text-xs font-medium rounded-full ${
      customer.status === "inactive" ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"
    }`}
  >
    {customer.status === "inactive" ? "Inactive" : "Sent"}
  </span>
</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Fixed bottom action bar */}
      {selectedCustomers.length > 0 && (
        <motion.div 
          className="sticky bottom-0 bg-white shadow-lg border-t border-blue-100 p-4 flex justify-between items-center"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
        >
          <div className="text-sm font-medium text-blue-700">
            {selectedCustomers.length} customers selected
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-md"
            onClick={handleCopyToTelecalling}
          >
            <FaPaperPlane className="mr-2" />
            Copy to Telecalling
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InactiveCustomerList;