import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { orderService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { formatCurrency, formatDate, getImageUrl } from '../utils/formatters';
import Pagination from '../components/common/Pagination';
import {
  Package,
  ChevronRight,
  ShoppingBag,
  Truck,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Calendar,
  Search,
} from 'lucide-react';

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.08, 0.08, 0],
      y: [-20, 400, 800],
      rotate: [0, 180, 360],
      x: [0, 30, -20],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-900">
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

// Flower decoration component
const FlowerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill="currentColor" opacity="0.5" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill="currentColor" opacity="0.5" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.5" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.5" />
  </svg>
);

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { 
      icon: Clock, 
      bg: 'bg-amber-50', 
      text: 'text-amber-700', 
      border: 'border-amber-200',
      label: 'Pending'
    },
    processing: { 
      icon: RefreshCw, 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      border: 'border-blue-200',
      label: 'Processing'
    },
    confirmed: { 
      icon: CheckCircle2, 
      bg: 'bg-indigo-50', 
      text: 'text-indigo-700', 
      border: 'border-indigo-200',
      label: 'Confirmed'
    },
    shipped: { 
      icon: Truck, 
      bg: 'bg-orange-50', 
      text: 'text-orange-700', 
      border: 'border-orange-200',
      label: 'Shipped'
    },
    delivered: { 
      icon: CheckCircle2, 
      bg: 'bg-green-50', 
      text: 'text-green-700', 
      border: 'border-green-200',
      label: 'Delivered'
    },
    cancelled: { 
      icon: XCircle, 
      bg: 'bg-red-50', 
      text: 'text-red-700', 
      border: 'border-red-200',
      label: 'Cancelled'
    },
    refunded: { 
      icon: AlertCircle, 
      bg: 'bg-gray-50', 
      text: 'text-gray-700', 
      border: 'border-gray-200',
      label: 'Refunded'
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

const Orders = () => {
  useSEO({ title: 'My Orders | Art Haven' });

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Generate floating petals
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 10 + i * 12,
    duration: 18 + Math.random() * 10,
    size: 10 + Math.random() * 8,
  }));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      
      const response = await orderService.getMyOrders(params);
      setOrders(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border border-gray-900/20 flex items-center justify-center"
        >
          <div className="w-8 h-8 border-t border-gray-900" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111827' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={i} {...petal} />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-900/50 mb-8"
        >
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/profile" className="hover:text-gray-900 transition-colors">Account</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Orders</span>
        </motion.nav>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8 }}
            className="w-12 h-px bg-gray-900 mb-6 origin-left"
          />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                My Orders
              </h1>
              <p className="text-gray-900/50 text-sm tracking-wide">
                Track and manage your orders
              </p>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white border border-gray-900/10 p-12 text-center"
          >

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 mx-auto mb-6 border border-gray-900/10 flex items-center justify-center"
            >
              <Package className="w-10 h-10 text-gray-900/20" />
            </motion.div>

            <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-3">
              No Orders Yet
            </h2>
            <p className="text-gray-900/50 mb-8 max-w-md mx-auto">
              Start your art collection journey. Browse our curated selection of artworks.
            </p>

            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 font-medium hover:bg-gray-800 transition-colors group"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Browse Collection</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                variants={itemVariants}
                className="relative bg-white border border-gray-900/10 overflow-hidden group hover:border-gray-900/30 transition-colors"
              >

                {/* Order Header */}
                <div className="p-6 border-b border-gray-900/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-playfair text-xl font-bold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <StatusBadge status={order.orderStatus} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-900/50">
                        <Calendar className="w-4 h-4" />
                        <span>Placed on {formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-playfair text-2xl font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-sm text-gray-900/50">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 4).map((item, idx) => (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="w-16 h-16 border-2 border-white bg-gray-100 overflow-hidden"
                          style={{ zIndex: 4 - idx }}
                        >
                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-16 h-16 border-2 border-white bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900/70 truncate">
                        {order.items.map(item => item.title).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.fedexShipment?.trackingNumber && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6 p-4 bg-gray-50 border border-gray-900/5"
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-gray-900" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Tracking: {order.fedexShipment.trackingNumber}
                          </p>
                          {order.shippingStatus && (
                            <p className="text-xs text-gray-900/50 mt-0.5">
                              {order.shippingStatus.replace(/-/g, ' ').toUpperCase()}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link to={`/orders/${order._id}`} className="flex-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </motion.button>
                    </Link>

                    {order.fedexShipment?.trackingNumber && (
                      <Link to={`/orders/${order._id}#tracking`} className="flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-3 border border-gray-900 text-gray-900 font-medium hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Truck className="w-4 h-4" />
                          Track Package
                        </motion.button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center pt-8"
              >
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5 }}
        className="w-32 h-px bg-gray-900/10 mx-auto my-16"
      />
    </div>
  );
};

export default Orders;