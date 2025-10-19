import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/dashboard/page.tsx";
import Revenues from "./pages/revenues/page.tsx";
import Expenses from "./pages/expenses/page.tsx";
import Bonus from "./pages/bonus/page.tsx";
import EmployeeRequests from "./pages/employee-requests/page.tsx";
import MyRequests from "./pages/my-requests/page.tsx";
import ManageRequests from "./pages/manage-requests/page.tsx";
import ProductOrders from "./pages/product-orders/page.tsx";
import Migration from "./pages/migration.tsx";
import NotFound from "./pages/NotFound.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/revenues" element={<Revenues />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/bonus" element={<Bonus />} />
          <Route path="/employee-requests" element={<EmployeeRequests />} />
          <Route path="/my-requests" element={<MyRequests />} />
          <Route path="/manage-requests" element={<ManageRequests />} />
          <Route path="/product-orders" element={<ProductOrders />} />
          <Route path="/migration" element={<Migration />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
