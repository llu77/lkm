import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";

// Critical path - keep eager loading for fastest initial render
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";

// Lazy load all other pages for optimal code splitting
const Dashboard = lazy(() => import("./pages/dashboard/page.tsx"));
const Revenues = lazy(() => import("./pages/revenues/page.tsx"));
const Expenses = lazy(() => import("./pages/expenses/page.tsx"));
const Bonus = lazy(() => import("./pages/bonus/page.tsx"));
const EmployeeRequests = lazy(() => import("./pages/employee-requests/page.tsx"));
const MyRequests = lazy(() => import("./pages/my-requests/page.tsx"));
const ManageRequests = lazy(() => import("./pages/manage-requests/page.tsx"));
const ProductOrders = lazy(() => import("./pages/product-orders/page.tsx"));
const Migration = lazy(() => import("./pages/migration.tsx"));
const BackupsPage = lazy(() => import("./pages/backups/page.tsx"));
const AIAssistant = lazy(() => import("./pages/ai-assistant/page.tsx"));
const SystemSupport = lazy(() => import("./pages/system-support/page.tsx"));
const Employees = lazy(() => import("./pages/employees/page.tsx"));
const AdvancesDeductions = lazy(() => import("./pages/advances-deductions/page.tsx"));
const Payroll = lazy(() => import("./pages/payroll/page.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

/**
 * Loading fallback component
 * Shows during lazy chunk loading - optimized for perceived performance
 */
function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Suspense fallback={<PageLoadingFallback />}>
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
            <Route path="/backups" element={<BackupsPage />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/system-support" element={<SystemSupport />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/advances-deductions" element={<AdvancesDeductions />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DefaultProviders>
  );
}
