import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SummaryReport from "./components/SummaryReport";
import NonBuyingCustomerReport from "./components/NonBuyingCustomerReport";
import NonBuyingMonthlyCustomer from "./components/NonBuyingMonthlyCustomer";
import CustomerReportPage from "./components/CustomerReport";
import StoreWiseSalesReportPage from "./components/StoreReport";
import CustomerList from "./components/CustomerList";
import UploadPage from "./components/UploadPage";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected routes nested under dashboard layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SummaryReport />} />
            <Route
              path="non-buying-customers"
              element={<NonBuyingCustomerReport />}
            />
            <Route
              path="non-buying-monthly-customers"
              element={<NonBuyingMonthlyCustomer />}
            />
            <Route path="customer-report" element={<CustomerReportPage />} />
            <Route
              path="store-sales-report"
              element={<StoreWiseSalesReportPage />}
            />
            <Route path="customers" element={<CustomerList />} />
            <Route path="upload" element={<UploadPage />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
