import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

export const API_ROUTES = {
    SUMMARY: "/reports/summary",
    NON_BUYING_CUSTOMERS: "/reports/non-buying-customers",
    NON_BUYING_MONTHLY_CUSTOMERS: "/reports/non-buying-monthly-customers",
    CUSTOMER_REPORT: "/reports/customer-report",
    STORE_SALES_REPORT: "/reports/store-sales-report",
    CUSTOMERS: "/reports/customers",
    YEARLY_REVENUE: "/reports/yearly",
    MONTHLY_REVENUE: "/reports/monthly",
    AVAILABLE_YEARS: "/reports/years",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    CHECK_AUTH: "/auth/check-auth",
  };
  
