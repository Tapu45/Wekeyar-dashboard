import React, { useEffect, useState } from "react";
import api, { API_ROUTES } from "../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface CustomerWithRemarks {
  id: number;
  customerName: string;
  customerPhone: string;
  remarks: string;
  orderCount: number;
}

const TelecallerRemarksOrders: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerWithRemarks[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomersWithRemarks = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("No authorization token found. Please log in again.", {
            position: "top-right",
          });
          return;
        }

        const response = await api.get(API_ROUTES.TELECALLER_REMARKS_ORDERS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCustomers(response.data);
      } catch (error) {
        console.error("Error fetching customers with remarks/orders:", error);
        toast.error("Failed to fetch data. Please try again.", {
          position: "top-right",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomersWithRemarks();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <ToastContainer />
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Telecaller Remarks and Orders</h1>
      {loading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : customers.length === 0 ? (
        <p className="text-gray-600">No remarks or orders saved yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>

              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.customerPhone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.remarks}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TelecallerRemarksOrders;