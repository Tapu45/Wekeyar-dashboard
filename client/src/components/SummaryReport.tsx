import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api, { API_ROUTES } from "../utils/api";

export interface SummaryReport {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
  avgMonthlyRevenue: number;
}

const getSummaryReport = async (): Promise<SummaryReport> => {
  const { data } = await api.get(API_ROUTES.SUMMARY);
  return data;
};

const SummaryReport: React.FC = () => {
  const { data, isLoading, error } = useQuery<SummaryReport>({
    queryKey: ["summary"],
    queryFn: getSummaryReport,
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
        <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-red-600 bg-red-100 border border-red-300 rounded-lg shadow-md">
        <p className="font-semibold">Error loading data. Please try again later.</p>
      </div>
    );

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.1 + i * 0.1,
      },
    }),
  };

  const metrics = [
    { label: "Total Customers", value: data?.totalCustomers ?? 0, icon: "👥", color: "bg-blue-50 text-blue-700" },
    { label: "Active Customers", value: data?.activeCustomers ?? 0, icon: "✅", color: "bg-green-50 text-green-700" },
    { label: "Inactive Customers", value: data?.inactiveCustomers ?? 0, icon: "⏸️", color: "bg-yellow-50 text-yellow-700" },
    { label: "Total Revenue", value: `₹${data?.totalRevenue?.toLocaleString() ?? 0}`, icon: "💰", color: "bg-purple-50 text-purple-700" },
    { label: "Avg Monthly Revenue", value: `₹${data?.avgMonthlyRevenue?.toLocaleString() ?? 0}`, icon: "📊", color: "bg-indigo-50 text-indigo-700" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="overflow-hidden bg-white rounded-lg shadow-lg"
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700">
        <h2 className="text-2xl font-bold text-white">Summary Report</h2>
        <p className="text-blue-100">Business performance at a glance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            custom={index}
            variants={itemVariants}
            className={`p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ${metric.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
              <div className="text-3xl">{metric.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SummaryReport;