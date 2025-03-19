import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SummaryReport from "./components/SummaryReport";
import NonBuyingCustomerReport from "./components/NonBuyingCustomerReport";
import NonBuyingMonthlyCustomer from "./components/NonBuyingMonthlyCustomer";
import CustomerReportPage from "./components/CustomerReport";
import StoreWiseSalesReportPage from "./components/StoreReport";
import Sidebar from "./components/Sidebar";
import CustomerList from "./components/CustomerList";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar
            isExpanded={isSidebarExpanded}
            setIsExpanded={setIsSidebarExpanded}
          />

          {/* Main Content */}
          <div
            className={`flex-1 p-6 space-y-6 overflow-y-auto transition-all duration-300 ${
              isSidebarExpanded ? "ml-64" : "ml-20"
            }`}
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <SummaryReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/non-buying-customers"
                element={
                  <ProtectedRoute>
                    <NonBuyingCustomerReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/non-buying-monthly-customers"
                element={
                  <ProtectedRoute>
                    <NonBuyingMonthlyCustomer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer-report"
                element={
                  <ProtectedRoute>
                    <CustomerReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store-sales-report"
                element={
                  <ProtectedRoute>
                    <StoreWiseSalesReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <CustomerList />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;