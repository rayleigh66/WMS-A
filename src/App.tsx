import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute, PublicRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ItemsPage from './pages/ItemsPage';
import WarehousesPage from './pages/WarehousesPage';
import LocationsPage from './pages/LocationsPage';
import InventoryPage from './pages/InventoryPage';
import StockInPage from './pages/StockInPage';
import StockOutPage from './pages/StockOutPage';
import AdjustmentsPage from './pages/AdjustmentsPage';
import MovementsPage from './pages/MovementsPage';
import UsersPage from './pages/UsersPage';
import OperationLogsPage from './pages/OperationLogsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/stock-in" element={<StockInPage />} />
            <Route path="/stock-out" element={<StockOutPage />} />
            <Route path="/adjustments" element={<AdjustmentsPage />} />
            <Route path="/movements" element={<MovementsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/operation-logs" element={<OperationLogsPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
