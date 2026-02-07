import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Suppliers } from './pages/Suppliers';
import { Inventory } from './pages/Inventory';
import { StockMovements } from './pages/StockMovements';
import { Categories } from './pages/Categories';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { StockAdjustments } from './pages/StockAdjustments';
import { StockTransfers } from './pages/StockTransfers';
import { Locations } from './pages/Locations';
import { Reports } from './pages/Reports';
import { Customers } from './pages/Customers';
import { SalesOrders } from './pages/SalesOrders';
import { Returns } from './pages/Returns';
import { CycleCounts } from './pages/CycleCounts';
import Login from './pages/Login';
import Register from './pages/Register';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { duration: 4000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="categories" element={<Categories />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="movements" element={<StockMovements />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="adjustments" element={<StockAdjustments />} />
              <Route path="transfers" element={<StockTransfers />} />
              <Route path="locations" element={<Locations />} />
              <Route path="customers" element={<Customers />} />
              <Route path="sales-orders" element={<SalesOrders />} />
              <Route path="returns" element={<Returns />} />
              <Route path="cycle-counts" element={<CycleCounts />} />
              <Route path="reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
