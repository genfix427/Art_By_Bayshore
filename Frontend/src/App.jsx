import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext.jsx';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NewsletterUnsubscribe from './pages/NewsletterUnsubscribe';
import NotFound from './pages/NotFound.jsx';
import Artists from './pages/Artists.jsx';
import ArtistDetails from './pages/ArtistDetails.jsx';
import Categories from './pages/Categories.jsx';
import CategoryDetails from './pages/CategoryDetails.jsx';
import Wishlist from './pages/Wishlist.jsx';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:slug" element={<ProductDetail />} />
            <Route path="artists" element={<Artists />} />
            <Route path="artists/:slug" element={<ArtistDetails />} />
            <Route path="categories" element={<Categories />} />
            <Route path="categories/:slug" element={<CategoryDetails />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="newsletter/unsubscribe/:token" element={<NewsletterUnsubscribe />} />

            {/* Protected Routes */}
            <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="order-confirmation/:orderId" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="orders/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;