import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth
import Login from './pages/auth/Login';

// Dashboard
import Dashboard from './pages/Dashboard';

// Artists
import Artists from './pages/artists/Artists';
import ArtistForm from './pages/artists/ArtistForm';

// Products
import Products from './pages/products/Products';
import ProductForm from './pages/products/ProductForm';

// Orders
import Orders from './pages/orders/Orders';
import OrderDetail from './pages/orders/OrderDetail';

// Coupons
import Coupons from './pages/coupons/Coupons';
import CouponForm from './pages/coupons/CouponForm';

// Inquiries
import Inquiries from './pages/inquiries/Inquiries';
import InquiryDetail from './pages/inquiries/InquiryDetail';

// Newsletter
import Subscribers from './pages/newsletter/Subscribers';
import Campaigns from './pages/newsletter/Campaigns';
import CampaignForm from './pages/newsletter/CampaignForm';
import Users from './pages/auth/Users';
import NotificationsPage from './pages/NotificationsPage';
import AutoClearNotifications from './components/AutoClearNotifications';

function App() {
  return (
    <AuthProvider>
      <AutoClearNotifications />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="notifications" element={<NotificationsPage />} />
          
          {/* Artists */}
          <Route path="artists" element={<Artists />} />
          <Route path="artists/new" element={<ArtistForm />} />
          <Route path="artists/edit/:id" element={<ArtistForm />} />
          
          {/* Products */}
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />
          
          {/* Orders */}
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          
          {/* Coupons */}
          <Route path="coupons" element={<Coupons />} />
          <Route path="coupons/new" element={<CouponForm />} />
          <Route path="coupons/edit/:id" element={<CouponForm />} />

          {/* Users */}
          <Route path="users" element={<Users />} />
          
          {/* Inquiries */}
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="inquiries/:id" element={<InquiryDetail />} />
          
          {/* Newsletter */}
          <Route path="newsletter/subscribers" element={<Subscribers />} />
          <Route path="newsletter/campaigns" element={<Campaigns />} />
          <Route path="newsletter/campaigns/new" element={<CampaignForm />} />
          <Route path="newsletter/campaigns/edit/:id" element={<CampaignForm />} /> 
          
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;