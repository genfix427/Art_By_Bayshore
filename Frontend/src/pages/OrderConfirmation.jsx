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
      opacity: [0, 0.3, 0.3, 0],
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
    <svg width={size} height={size} viewBox="0 0 24 24" className="text-primary">
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

// Floating circle component
const FloatingCircle = ({ delay, startX, duration, size = 20 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, scale: 0.5 }}
    animate={{
      opacity: [0, 0.25, 0.25, 0],
      y: [-20, 500, 1000],
      scale: [0.5, 1, 0.5],
      x: [0, -40, 20],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div 
      className="rounded-full border-2 border-primary"
      style={{ width: size, height: size }}
    />
  </motion.div>
);

// Floating diamond component
const FloatingDiamond = ({ delay, startX, duration, size = 16 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 45 }}
    animate={{
      opacity: [0, 0.2, 0.2, 0],
      y: [-20, 600, 1200],
      rotate: [45, 225, 405],
      x: [0, 50, -30],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div 
      className="border-2 border-secondary"
      style={{ width: size, height: size }}
    />
  </motion.div>
);

// Floating dot component
const FloatingDot = ({ delay, startX, duration, size = 8 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20 }}
    animate={{
      opacity: [0, 0.4, 0.4, 0],
      y: [-20, 700, 1400],
      x: [0, -20, 40, 0],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div 
      className="rounded-full bg-accent"
      style={{ width: size, height: size }}
    />
  </motion.div>
);

// Pulsing orb component
const PulsingOrb = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full bg-primary pointer-events-none ${className}`}
    initial={{ opacity: 0.05, scale: 1 }}
    animate={{
      opacity: [0.05, 0.15, 0.05],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 4,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Floating star component
const FloatingStar = ({ delay, startX, duration, size = 12 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.35, 0.35, 0],
      y: [-20, 550, 1100],
      rotate: [0, 360, 720],
      x: [0, 25, -15],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" className="text-primary">
      <path
        d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

// Flower decoration component
const FlowerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill="currentColor" opacity="0.6" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill="currentColor" opacity="0.6" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.6" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.6" />
  </svg>
);

// Status badge
const StatusBadge = ({ status }) => {
  const config = {
    pending: { bg: 'bg-accent/30', text: 'text-secondary', border: 'border-primary/30' },
    paid: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    processing: { bg: 'bg-accent/40', text: 'text-primary', border: 'border-primary/40' },
    shipped: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
    delivered: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
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

  // Generate floating elements
  const petals = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 2.5,
    startX: 10 + i * 14,
    duration: 18 + Math.random() * 10,
    size: 10 + Math.random() * 8,
  }));

  const circles = Array.from({ length: 5 }).map((_, i) => ({
    delay: i * 3 + 1,
    startX: 8 + i * 18,
    duration: 20 + Math.random() * 8,
    size: 14 + Math.random() * 10,
  }));

  const diamonds = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 4 + 2,
    startX: 15 + i * 22,
    duration: 22 + Math.random() * 8,
    size: 12 + Math.random() * 8,
  }));

  const dots = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 5 + i * 12,
    duration: 14 + Math.random() * 8,
    size: 5 + Math.random() * 5,
  }));

  const stars = Array.from({ length: 5 }).map((_, i) => ({
    delay: i * 3.5 + 1.5,
    startX: 12 + i * 16,
    duration: 16 + Math.random() * 8,
    size: 10 + Math.random() * 6,
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
          className="w-16 h-16 border-2 border-primary/30 flex items-center justify-center"
        >
          <div className="w-8 h-8 border-t-2 border-primary" />
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
          <div className="w-20 h-20 border-2 border-primary/20 flex items-center justify-center mx-auto mb-8">
            <Package className="w-10 h-10 text-primary/40" />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-secondary mb-4">
            Order Not Found
          </h2>
          <p className="text-black/70 mb-8">
            We couldn't find the order you're looking for.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 font-medium hover:bg-secondary transition-colors"
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
          colors={['#4169E1', '#1E3A5F', '#B0C4DE', '#6B8DD6', '#3A5BA0']}
        />
      )}

      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234169E1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Pulsing Background Orbs */}
      <PulsingOrb className="w-72 h-72 -top-36 -left-36 blur-3xl" delay={0} />
      <PulsingOrb className="w-96 h-96 -bottom-48 -right-48 blur-3xl" delay={2} />
      <PulsingOrb className="w-56 h-56 top-1/4 -right-28 blur-2xl" delay={1} />
      <PulsingOrb className="w-48 h-48 bottom-1/3 -left-24 blur-2xl" delay={3} />

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
        {circles.map((circle, i) => (
          <FloatingCircle key={`circle-${i}`} {...circle} />
        ))}
        {diamonds.map((diamond, i) => (
          <FloatingDiamond key={`diamond-${i}`} {...diamond} />
        ))}
        {dots.map((dot, i) => (
          <FloatingDot key={`dot-${i}`} {...dot} />
        ))}
        {stars.map((star, i) => (
          <FloatingStar key={`star-${i}`} {...star} />
        ))}
      </div>

      {/* Animated Lines */}
      <motion.div
        className="absolute top-20 left-0 w-full h-px bg-primary pointer-events-none"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.1 }}
        transition={{ duration: 2, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-20 left-0 w-full h-px bg-primary pointer-events-none"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.1 }}
        transition={{ duration: 2, delay: 0.7 }}
      />

      {/* Decorative Flowers */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute top-32 left-10 w-32 h-32 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-primary" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-32 right-10 w-28 h-28 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-secondary" />
      </motion.div>

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
            <div className="absolute inset-0 bg-primary flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            {/* Decorative rings */}
            <motion.div
              className="absolute inset-0 border-2 border-primary/30"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 border-2 border-primary/20"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
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
              className="w-16 h-px bg-primary mx-auto mb-6"
            />
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-playfair text-4xl lg:text-5xl font-bold text-secondary mb-4"
          >
            Thank You for Your Order!
          </motion.h1>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 text-lg text-black/70 mb-4"
          >
            <span>Order Number:</span>
            <span className="font-mono font-bold text-primary">#{order.orderNumber}</span>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 text-black/60"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span>A confirmation email has been sent to your email address</span>
          </motion.div>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative bg-white border-2 border-primary/15 mb-8 shadow-lg"
        >

          {/* Header */}
          <div className="p-6 border-b-2 border-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-primary" />
                <h2 className="font-playfair text-xl font-bold text-secondary">
                  Order Details
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-black/60">
                  <Calendar className="w-4 h-4 text-primary" />
                  {formatDateTime(order.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="p-6 border-b-2 border-primary/10 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-black/60">Order Status:</span>
              <StatusBadge status={order.orderStatus} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-black/60">Payment:</span>
              <StatusBadge status={order.paymentStatus} />
            </div>
          </div>

          {/* Items */}
          <div className="p-6 border-b-2 border-primary/10">
            <h3 className="text-xs text-primary/70 uppercase tracking-wide mb-4 font-semibold">
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
                  <div className="w-16 h-16 bg-accent/20 border-2 border-primary/10 flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary">{item.title}</p>
                    <p className="text-sm text-black/60">Qty: {item.quantity}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-secondary">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-black/60">
                        {formatCurrency(item.price)} each
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="p-6 border-b-2 border-primary/10">
            <div className="space-y-3">
              <div className="flex justify-between text-black/70">
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

              <div className="flex justify-between text-black/70">
                <span>Shipping</span>
                <span>{formatCurrency(order.shippingCost)}</span>
              </div>

              {order.tax > 0 && (
                <div className="flex justify-between text-black/70">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}

              <div className="pt-3 border-t-2 border-primary/10">
                <div className="flex justify-between">
                  <span className="font-playfair text-xl font-bold text-secondary">Total</span>
                  <span className="font-playfair text-xl font-bold text-primary">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-secondary">Shipping Address</h3>
            </div>

            <div className="flex items-start gap-4 ml-8">
              <div className="w-10 h-10 bg-accent/30 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-secondary mb-1">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-black/70 text-sm">{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p className="text-black/70 text-sm">{order.shippingAddress.addressLine2}</p>
                )}
                <p className="text-black/70 text-sm">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p className="text-black/70 text-sm">{order.shippingAddress.country}</p>
                <div className="flex items-center gap-2 mt-2 text-black/60 text-sm">
                  <Phone className="w-3.5 h-3.5 text-primary" />
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
          className="relative bg-accent/20 border-2 border-primary/15 p-6 mb-8"
        >

          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <h3 className="font-playfair text-lg font-bold text-secondary">What's Next?</h3>
          </div>

          <div className="space-y-4 ml-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-secondary">Order Confirmation</p>
                <p className="text-sm text-black/70">
                  You'll receive an email confirmation with your order details
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-secondary">Order Processing</p>
                <p className="text-sm text-black/70">
                  We'll carefully prepare your artwork for shipment
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-secondary">Shipping Notification</p>
                <p className="text-sm text-black/70">
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
              className="w-full py-4 bg-primary text-white font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              View All Orders
            </motion.button>
          </Link>
          
          <Link to="/products" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 group"
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
          className="w-32 h-px bg-primary/30 mx-auto mt-16"
        />
      </div>
    </div>
  );
};

export default OrderConfirmation;