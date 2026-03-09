import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ProductListPage from './features/product/ProductListPage';
import CartPage from './features/cart/CartPage';
import OrderHistoryPage from './features/order/OrderHistoryPage';
import OrderDetailPage from './features/order/OrderDetailPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ProfilePage from './features/profile/ProfilePage';
import UserManagementPage from './features/dashboard/UserManagementPage';
import OrderManagementPage from './features/dashboard/OrderManagementPage';
import PartsUploadPage from './features/dashboard/PartsUploadPage';
import BoxTrackingPage from './features/dashboard/BoxTrackingPage';
import BillManagementPage from './features/dashboard/BillManagementPage';
import { useAuthStore } from './store/useAuthStore';

function RootRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/products' : '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<RootRedirect />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="products" element={<ProtectedRoute><ProductListPage /></ProtectedRoute>} />
          <Route path="cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
          <Route path="orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="dashboard/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
          <Route path="dashboard/orders" element={<ProtectedRoute><OrderManagementPage /></ProtectedRoute>} />
          <Route path="dashboard/boxes" element={<ProtectedRoute><BoxTrackingPage /></ProtectedRoute>} />
          <Route path="dashboard/parts-upload" element={<ProtectedRoute><PartsUploadPage /></ProtectedRoute>} />
          <Route path="dashboard/bills" element={<ProtectedRoute><BillManagementPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
