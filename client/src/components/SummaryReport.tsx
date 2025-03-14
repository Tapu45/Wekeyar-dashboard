import React from "react";
import { useQuery } from "@tanstack/react-query";
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
}
  
const SummaryReport: React.FC = () => {
    const { data, isLoading, error } = useQuery<SummaryReport>({ queryKey: ["summary"], queryFn: getSummaryReport });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div className="p-4 bg-white border rounded-lg">
      <h2 className="text-xl font-bold">Summary Report</h2>
      <ul className="pl-6 list-disc">
        <li>Total Customers: {data?.totalCustomers ?? 0}</li>
        <li>Active Customers: {data?.activeCustomers ?? 0}</li>
        <li>Inactive Customers: {data?.inactiveCustomers ?? 0}</li>
        <li>Total Revenue: ₹{data?.totalRevenue?.toLocaleString() ?? 0}</li>
        <li>Avg Monthly Revenue: ₹{data?.avgMonthlyRevenue?.toLocaleString() ?? 0}</li>
      </ul>
    </div>
  );
};

export default SummaryReport;
