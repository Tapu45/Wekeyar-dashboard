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
    STORES: "/reports/stores",
    UPLOADSTATUS: "/reports/upload-status",
    CUSTOMER_PURCHASE_HISTORY: "/reports/customer/:customerId/purchase-history",
    UPLOAD: "/api/upload",
    UPLOAD_SYNC: "/api/upload/sync",
    UPLOAD_HISTORY: "/api/upload/history",
    UPLOAD_LOGS: "/api/upload/logs/:id",
    UPLOAD_STATUS: "/api/upload/status/:id",
    UPLOAD_HISTORY_DELETE: "/api/upload/history/:id?",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    CHECK_AUTH: "/auth/check-auth",
    CREATE_USER: "/user/create-user",
    INACTIVE_CUSTOMERS: "/reports/inactive-customers",
    TELECALLING_PRODUCTS: "/telecalling/products",
    TELECALLING_ORDERS: "/telecalling/orders",
    TELECALLING_CUSTOMERS: "/telecalling/customers",
    TELECALLERS_WITH_ORDERS: "/telecalling/telecallers-with-orders", // Added route
    TELECALLING_ALL_ORDERS: "/telecalling/telecalling-orders", // Added route
    TELECALLING_NEW_PRODUCTS: "/telecalling/new-products", // Added route
    TELECALLING_UPDATE_REMARKS: "/telecalling/customers/:id/remarks", // Added route
    TELECALLER_REMARKS_ORDERS: "/telecalling/telecaller/remarks-orders", // Added route
    TELECALLING_ADD_CUSTOMER: "/telecalling/customers/new", // Added route
  };
  
