import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../utils/api";
import { API_ROUTES } from "../utils/api";
import { YearlyRevenue, MonthlyRevenue, AvailableYears } from "../utils/types";

const RevenueCharts: React.FC = () => {
  const [yearlyData, setYearlyData] = useState<YearlyRevenue[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [availableYears, setAvailableYears] = useState<AvailableYears>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available years for filtering
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const response = await api.get<AvailableYears>(
          API_ROUTES.AVAILABLE_YEARS
        );
        setAvailableYears(response.data);

        // If there are years available and no year is selected yet, select the most recent
        if (response.data.length > 0 && !selectedYear) {
          setSelectedYear(Math.max(...response.data));
        }
      } catch (err) {
        console.error("Error fetching available years:", err);
        setError("Failed to load available years. Please try again later.");
      }
    };

    fetchAvailableYears();
  }, []);

  // Fetch yearly revenue data
  useEffect(() => {
    const fetchYearlyData = async () => {
      try {
        setLoading(true);
        const response = await api.get<YearlyRevenue[]>(
          API_ROUTES.YEARLY_REVENUE
        );
        setYearlyData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching yearly revenue data:", err);
        setError("Failed to load yearly revenue data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchYearlyData();
  }, []);

  // Fetch monthly revenue data based on selected year
  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!selectedYear) return;

      try {
        setLoading(true);
        const response = await api.get<MonthlyRevenue[]>(
          `${API_ROUTES.MONTHLY_REVENUE}/${selectedYear}`
        );
        console.log("Monthly Revenue Data:", response.data); // Log the response
        setMonthlyData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching monthly revenue data:", err);
        setError(
          "Failed to load monthly revenue data. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [selectedYear]);

  // Handle year change
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value));
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading && !yearlyData.length && !monthlyData.length) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading revenue data...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Monthly Revenue Chart with Year Filter */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Monthly Revenue</h2>
          <div>
            <label htmlFor="yearSelect" className="mr-2 font-medium">
              Select Year:
            </label>
            <select
              id="yearSelect"
              value={selectedYear}
              onChange={handleYearChange}
              className="border rounded py-1 px-3"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="monthName" />
              <YAxis tickFormatter={formatCurrency} width={80} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#4ade80"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RevenueCharts;
