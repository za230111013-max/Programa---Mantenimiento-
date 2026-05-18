import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import { OrdersPage } from './pages/orders/OrdersPage';
import { OrderDetailsPage } from './pages/orders/OrderDetailsPage';
import { CreateOrderPage } from './pages/orders/CreateOrderPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { PreventivePage } from './pages/preventive/PreventivePage';
import { PredictivePage } from './pages/predictive/PredictivePage';
import { AmefPage } from './pages/amef/AmefPage';
import { SettingsPage } from './pages/settings/SettingsPage';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* All authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            
            {/* Orders — all roles */}
            <Route path="orders">
              <Route index element={<OrdersPage />} />
              <Route path="new" element={<CreateOrderPage />} />
              <Route path=":id" element={<OrderDetailsPage />} />
            </Route>

            <Route path="preventive" element={<PreventivePage />} />
            <Route path="predictive" element={<PredictivePage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Route>
        </Route>

        {/* Admin & Supervisor only */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'supervisor']} />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route path="amef" element={<AmefPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
