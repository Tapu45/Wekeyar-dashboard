import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api, { API_ROUTES } from "../utils/api";
import CustomerList from "./CustomerList";
import RevenueCharts from "./revenueChart";

interface SummaryReport {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
  avgMonthlyRevenue: number;
}

interface FilterParams {
  fromDate?: string;
  toDate?: string;
  storeId?: number;
  noOfdays?: number;
}

const fetchSummary = async (filters: FilterParams): Promise<SummaryReport> => {
  const params = new URLSearchParams();

  if (filters.fromDate) params.append("fromDate", filters.fromDate);
  if (filters.toDate) params.append("toDate", filters.toDate);
  if (filters.storeId) params.append("storeId", filters.storeId.toString());
  if (filters.noOfdays) params.append("noOfdays", filters.noOfdays.toString());

  const { data } = await api.get(`${API_ROUTES.SUMMARY}?${params.toString()}`);
  return data;
};

const SummaryReport: React.FC = () => {
  const [filters, setFilters] = useState<FilterParams>({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    storeId: undefined,
    noOfdays: undefined,
  });

  const [showCustomerList, setShowCustomerList] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["summaryReport", filters],
    queryFn: () => fetchSummary(filters),
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]:
        name === "storeId" || name === "noOfdays"
          ? Number(value) || undefined
          : value,
    }));
  };

  const handleQuickFilter = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    setFilters((prev) => ({
      ...prev,
      fromDate: startDate.toISOString().split("T")[0],
      toDate: endDate.toISOString().split("T")[0],
      noOfdays: days,
    }));
  };

  const applyFilters = () => {
    refetch();
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  if (error)
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        Error loading data.
      </div>
    );

  const metrics = [
    {
      label: "Total Customers",
      value: data?.totalCustomers,
      icon: "👥",
      onClick: () => setShowCustomerList(!showCustomerList),
    },
    { label: "Active Customers", value: data?.activeCustomers, icon: "✅" },
    { label: "Inactive Customers", value: data?.inactiveCustomers, icon: "⏸️" },
    {
      label: "Total Revenue",
      value: `₹${data?.totalRevenue?.toLocaleString()}`,
      icon: "💰",
    },
    {
      label: "Avg Monthly Revenue",
      value: `₹${data?.avgMonthlyRevenue?.toLocaleString()}`,
      icon: "📊",
    },
  ];

  return (
    <motion.div
      className="p-6 bg-white rounded-lg shadow-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Summary Report</h2>

        <div className="flex space-x-2">
          <button
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            onClick={() => handleQuickFilter(7)}
          >
            Last 7 days
          </button>
          <button
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            onClick={() => handleQuickFilter(30)}
          >
            Last 30 days
          </button>
          <button
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            onClick={() => handleQuickFilter(90)}
          >
            Last 90 days
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store ID
            </label>
            <input
              type="text"
              name="storeId"
              value={filters.storeId || ""}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            className="p-4 bg-gray-50 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={metric.onClick}
          >
            <div className="flex justify-between items-center">
              <p className="text-gray-600">{metric.label}</p>
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <h3 className="text-2xl font-bold mt-2">{metric.value || 0}</h3>
          </motion.div>
        ))}
      </div>

      {showCustomerList && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <CustomerList />
        </motion.div>
      )}

      <RevenueCharts />
    </motion.div>
  );
};

export default SummaryReport;
