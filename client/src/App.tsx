import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SummaryReport from "./components/SummaryReport";
import CustomerReportPage from "./components/CustomerReport";
import StoreWiseSalesReportPage from "./components/StoreReport";
import CustomerList from "./components/CustomerList";
import UploadPage from "./components/UploadPage";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import UserCreationPage from "./components/UserCreation";

import TelecallingDashboard from "./components/TelecallingDashboard";

import UploadStatusPage from "./components/UploadStatusPage";
import ProductUploadPage from "./components/ProductUpload";
import UploadManager from "./components/upload";
import CustomerAnalysisManager from "./components/Customer";
import TelecallingCustomerManager from "./components/ManageCu";



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
              <ProtectedRoute allowedRoles={["admin", "tellecaller"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Default route: Redirect based on role */}
            <Route
              index
              element={
                <ProtectedRoute allowedRoles={["admin", "tellecaller"]}>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />

            {/* Summary Report accessible only by admin */}
            <Route
              path="summary-report"
              element={
                <ProtectedRoute allowedRoles={["admin", "tellecaller"]}>
                  <SummaryReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="non-buying-customers"
              element={
                <ProtectedRoute allowedRoles={["admin", "tellecaller"]}>
                  <CustomerAnalysisManager />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="non-buying-monthly-customers"
              element={
                <ProtectedRoute allowedRoles={["admin", "tellecaller"]}>
                  <NonBuyingMonthlyCustomer />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="customer-report"
              element={
                <ProtectedRoute allowedRoles={["admin", "tellecaller"]}>
                  <CustomerReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="store-sales-report"
              element={
                <ProtectedRoute allowedRoles={["admin", "tellecaller"]}>
                  <StoreWiseSalesReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <CustomerList />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="telecaller-remarks-orders"
              element={
                <ProtectedRoute allowedRoles={["tellecaller", "admin"]}>
                  <TelecallerRemarksOrders />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="Upload"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UploadPage />
                </ProtectedRoute>
              }
            />

<Route
              path="upload-manager"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UploadManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="upload-status"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UploadStatusPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="Add-new-customer"
              element={
                <ProtectedRoute allowedRoles={["admin", "tellecaller"]}>
                  <TelecallingCustomerManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="user"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserCreationPage />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="tellecalling"
              element={
                <ProtectedRoute allowedRoles={["tellecaller"]}>
                  <Tellecalling />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="telecalling-dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <TelecallingDashboard />
                </ProtectedRoute>
              }
            />
             <Route
              path="productmaster-upload"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ProductUploadPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;

/**
 * RoleBasedRedirect Component
 * Redirects users to the appropriate default page based on their role.
 */
const RoleBasedRedirect: React.FC = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded: { role: string } = JSON.parse(atob(token.split(".")[1]));
    if (decoded.role === "admin" || decoded.role === "tellecaller") {
      return <Navigate to="/summary-report" replace />; // Redirect all roles to SummaryReport
    }
  } catch (error) {
    console.error("Failed to decode token:", error);
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/login" replace />;
};
