import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { formatCurrency, formatDateTime, getImageUrl } from '../utils/formatters';
import {
  CheckCircle2,
  Package,
  Mail,
  ArrowRight,
  ShoppingBag,
  Truck,
  MapPin,
  Phone,
  User,
  Tag,
  Calendar,
  Receipt,
  Sparkles
} from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

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

// Status badge
const StatusBadge = ({ status }) => {
  const config = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    paid: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  };

  const style = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {status.toUpperCase()}
    </span>
  );
};

const OrderConfirmation = () => {
  useSEO({ title: 'Order Confirmed | Art Haven' });

  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const { width, height } = useWindowSize();

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
        delayChildren: 0.3,
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

  const checkmarkVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.2,
      },
    },
  };

  useEffect(() => {
    fetchOrder();
    
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading) {
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

  // Not Found State
  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 border border-gray-900/10 flex items-center justify-center mx-auto mb-8">
            <Package className="w-10 h-10 text-gray-900/20" />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-4">
            Order Not Found
          </h2>
          <p className="text-gray-900/60 mb-8">
            We couldn't find the order you're looking for.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 font-medium hover:bg-gray-800 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          colors={['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db']}
        />
      )}

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
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Success Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          {/* Checkmark */}
          <motion.div
            variants={checkmarkVariants}
            className="relative w-24 h-24 mx-auto mb-8"
          >
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            {/* Decorative rings */}
            <motion.div
              className="absolute inset-0 border-2 border-gray-900/20"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: 2 }}
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mb-2"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-16 h-px bg-gray-900 mx-auto mb-6"
            />
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
          >
            Thank You for Your Order!
          </motion.h1>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 text-lg text-gray-900/70 mb-4"
          >
            <span>Order Number:</span>
            <span className="font-mono font-bold text-gray-900">#{order.orderNumber}</span>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 text-gray-900/50"
          >
            <Mail className="w-4 h-4" />
            <span>A confirmation email has been sent to your email address</span>
          </motion.div>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative bg-white border border-gray-900/10 mb-8"
        >

          {/* Header */}
          <div className="p-6 border-b border-gray-900/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-gray-900" />
                <h2 className="font-playfair text-xl font-bold text-gray-900">
                  Order Details
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-900/50">
                  <Calendar className="w-4 h-4" />
                  {formatDateTime(order.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="p-6 border-b border-gray-900/10 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900/50">Order Status:</span>
              <StatusBadge status={order.orderStatus} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900/50">Payment:</span>
              <StatusBadge status={order.paymentStatus} />
            </div>
          </div>

          {/* Items */}
          <div className="p-6 border-b border-gray-900/10">
            <h3 className="text-xs text-gray-900/50 uppercase tracking-wide mb-4">
              Items Ordered
            </h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-16 h-16 bg-gray-100 border border-gray-900/10 flex-shrink-0 overflow-hidden">
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
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-900/50">Qty: {item.quantity}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-900/50">
                        {formatCurrency(item.price)} each
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="p-6 border-b border-gray-900/10">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-900/70">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    Discount {order.couponUsed?.code && `(${order.couponUsed.code})`}
                  </span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-900/70">
                <span>Shipping</span>
                <span>{formatCurrency(order.shippingCost)}</span>
              </div>

              {order.tax > 0 && (
                <div className="flex justify-between text-gray-900/70">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-900/10">
                <div className="flex justify-between">
                  <span className="font-playfair text-xl font-bold text-gray-900">Total</span>
                  <span className="font-playfair text-xl font-bold text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-gray-900" />
              <h3 className="font-medium text-gray-900">Shipping Address</h3>
            </div>

            <div className="flex items-start gap-4 ml-8">
              <div className="w-10 h-10 bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-900/50" />
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-gray-900/70 text-sm">{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p className="text-gray-900/70 text-sm">{order.shippingAddress.addressLine2}</p>
                )}
                <p className="text-gray-900/70 text-sm">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p className="text-gray-900/70 text-sm">{order.shippingAddress.country}</p>
                <div className="flex items-center gap-2 mt-2 text-gray-900/50 text-sm">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{order.shippingAddress.phoneNumber}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative bg-gray-50 border border-gray-900/10 p-6 mb-8"
        >

          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-gray-900" />
            <h3 className="font-playfair text-lg font-bold text-gray-900">What's Next?</h3>
          </div>

          <div className="space-y-4 ml-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Order Confirmation</p>
                <p className="text-sm text-gray-900/60">
                  You'll receive an email confirmation with your order details
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Order Processing</p>
                <p className="text-sm text-gray-900/60">
                  We'll carefully prepare your artwork for shipment
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Shipping Notification</p>
                <p className="text-sm text-gray-900/60">
                  You'll receive tracking information when your order ships
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/orders" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              View All Orders
            </motion.button>
          </Link>
          
          <Link to="/products" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 border border-gray-900 text-gray-900 font-medium hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center gap-2 group"
            >
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Bottom Decoration */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, delay: 1.2 }}
          className="w-32 h-px bg-gray-900/10 mx-auto mt-16"
        />
      </div>
    </div>
  );
};

export default OrderConfirmation;