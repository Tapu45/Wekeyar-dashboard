import React from "react";
import SummaryReport from "./components/SummaryReport";
import NonBuyingCustomerReport from "./components/NonBuyingCustomerReport";
import NonBuyingMonthlyCustomer from "./components/NonBuyingMonthlyCustomer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6 space-y-6">
        <SummaryReport />
        <NonBuyingCustomerReport />
        <NonBuyingMonthlyCustomer />
      </div>
    </QueryClientProvider>
  );
};

export default App;
