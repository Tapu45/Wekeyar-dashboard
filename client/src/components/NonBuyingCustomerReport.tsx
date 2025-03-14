import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";

export interface NonBuyingCustomer {
  id: number;
  name: string;
  phone: string;
  lastPurchaseDate: Date | null;
  totalPurchaseValue: number;
}

const getNonBuyingCustomers = async (
  days: number
): Promise<NonBuyingCustomer[]> => {
  const { data } = await api.get(API_ROUTES.NON_BUYING_CUSTOMERS, {
    params: { days },
  });
  return data;
};

const NonBuyingCustomerReport: React.FC = () => {
  const [days, setDays] = useState(90);
  const { data, isLoading, error } = useQuery<NonBuyingCustomer[]>({
    queryKey: ["non-buying-customers", days],
    queryFn: () => getNonBuyingCustomers(days),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div className="p-4 bg-white border rounded-lg">
      <h2 className="text-xl font-bold">Non-Buying Customers Report</h2>
      <div className="flex gap-4">
        <label>Days:</label>
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="p-2 border"
        />
      </div>
      <ul className="mt-4">
        {data?.map((customer: NonBuyingCustomer) => (
          <li key={customer.id} className="p-2 border-b">
            <div>{customer.name}</div>
            <div>{customer.phone}</div>
            <div>
              Last Purchase:{" "}
              {customer.lastPurchaseDate
                ? new Date(customer.lastPurchaseDate).toLocaleDateString()
                : "Never"}
            </div>
            <div>Total Spend: ₹{customer.totalPurchaseValue}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NonBuyingCustomerReport;
