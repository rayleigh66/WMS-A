import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute, PublicRoute, RoleHome, RoleRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScannerPage from './pages/ScannerPage';
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

const MANAGER_ROLES = ['MANAGER', 'ADMIN'] as const;
const OPERATION_ROLES = ['OPERATOR', 'MANAGER', 'ADMIN'] as const;
const ALL_ROLES = ['VIEWER', 'OPERATOR', 'MANAGER', 'ADMIN'] as const;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<RoleRoute allowed={[...ALL_ROLES]}><DashboardPage /></RoleRoute>} />
            <Route path="/scanner" element={<RoleRoute allowed={[...OPERATION_ROLES]}><ScannerPage /></RoleRoute>} />
            <Route path="/inventory" element={<RoleRoute allowed={[...ALL_ROLES]}><InventoryPage /></RoleRoute>} />
            <Route path="/movements" element={<RoleRoute allowed={[...ALL_ROLES]}><MovementsPage /></RoleRoute>} />

            <Route path="/stock-in" element={<RoleRoute allowed={[...MANAGER_ROLES]}><StockInPage /></RoleRoute>} />
            <Route path="/stock-out" element={<RoleRoute allowed={[...MANAGER_ROLES]}><StockOutPage /></RoleRoute>} />
            <Route path="/adjustments" element={<RoleRoute allowed={[...MANAGER_ROLES]}><AdjustmentsPage /></RoleRoute>} />
            <Route path="/items" element={<RoleRoute allowed={[...MANAGER_ROLES]}><ItemsPage /></RoleRoute>} />
            <Route path="/warehouses" element={<RoleRoute allowed={[...MANAGER_ROLES]}><WarehousesPage /></RoleRoute>} />
            <Route path="/locations" element={<RoleRoute allowed={[...MANAGER_ROLES]}><LocationsPage /></RoleRoute>} />
            <Route path="/operation-logs" element={<RoleRoute allowed={[...MANAGER_ROLES]}><OperationLogsPage /></RoleRoute>} />
            <Route path="/users" element={<RoleRoute allowed={['ADMIN']}><UsersPage /></RoleRoute>} />
            <Route path="/" element={<RoleHome />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
