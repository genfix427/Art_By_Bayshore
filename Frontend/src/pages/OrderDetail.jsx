import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { orderService, shippingService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { formatCurrency, formatDateTime, getImageUrl } from '../utils/formatters';
import toast from 'react-hot-toast';
import {
  Package,
  ChevronRight,
  Truck,
  MapPin,
  Phone,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  Tag,
  Receipt,
  User,
  Check,
  Globe
} from 'lucide-react';

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: '-5%' }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.12, 0.12, 0],
      y: [-20, 400, 800],
      rotate: [0, 180, 360],
      x: [0, 30, -20],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: 'linear',
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

// Floating orb component
const FloatingOrb = ({ delay, x, y, size }) => (
  <motion.div
    className="absolute pointer-events-none z-0 rounded-full bg-primary/5 border border-primary/10"
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
    animate={{
      scale: [1, 1.4, 1],
      opacity: [0.3, 0.08, 0.3],
    }}
    transition={{
      duration: 6 + Math.random() * 4,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// Drifting diamond shape
const FloatingDiamond = ({ delay, startX, duration, size = 10 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: '-3%' }}
    initial={{ opacity: 0, y: -10, rotate: 45 }}
    animate={{
      opacity: [0, 0.1, 0.1, 0],
      y: [-10, 500, 1000],
      rotate: [45, 225, 405],
      x: [0, -25, 15],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  >
    <div
      className="bg-accent/30 border border-accent/20"
      style={{ width: size, height: size, transform: 'rotate(45deg)' }}
    />
  </motion.div>
);

// Orbiting dot
const OrbitingDot = ({ radius, duration, delay, dotSize = 4 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{
      left: '50%',
      top: '50%',
      width: dotSize,
      height: dotSize,
    }}
    animate={{
      x: [
        Math.cos(0) * radius,
        Math.cos(Math.PI / 2) * radius,
        Math.cos(Math.PI) * radius,
        Math.cos((3 * Math.PI) / 2) * radius,
        Math.cos(2 * Math.PI) * radius,
      ],
      y: [
        Math.sin(0) * radius,
        Math.sin(Math.PI / 2) * radius,
        Math.sin(Math.PI) * radius,
        Math.sin((3 * Math.PI) / 2) * radius,
        Math.sin(2 * Math.PI) * radius,
      ],
      opacity: [0.15, 0.06, 0.15, 0.06, 0.15],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  >
    <div className="w-full h-full rounded-full bg-primary" />
  </motion.div>
);

// Animated horizontal line
const DriftingLine = ({ delay, y, direction = 1 }) => (
  <motion.div
    className="absolute pointer-events-none z-0 h-px bg-accent/15"
    style={{ top: `${y}%`, width: '120px' }}
    initial={{ x: direction === 1 ? '-150px' : '100vw', opacity: 0 }}
    animate={{
      x: direction === 1 ? ['-150px', '100vw'] : ['100vw', '-150px'],
      opacity: [0, 0.15, 0.15, 0],
    }}
    transition={{
      duration: 20 + Math.random() * 10,
      delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  />
);

// FedEx Logo Component
const FedExLogo = ({ className = 'w-16 h-6' }) => (
  <svg className={className} viewBox="0 0 960 274" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 28.5H191.5V70H51V109H175V150.5H51V219H0V28.5Z" fill="#4D148C" />
    <path d="M207 137.5C207 77.5 245 23 330.5 23C392 23 432.5 56 443 103.5H389C382 85 361.5 70 331 70C290.5 70 261 98.5 261 137.5C261 176.5 290.5 205 331 205C361.5 205 382 190 389 171.5H443C432.5 219 392 252 330.5 252C245 252 207 197.5 207 137.5Z" fill="#4D148C" />
    <path d="M459 28.5H625V70H510V109H609V150.5H510V177.5H625V219H459V28.5Z" fill="#4D148C" />
    <path d="M640 28.5H760.5C838.5 28.5 877 68.5 877 123.5C877 178.5 838.5 219 760.5 219H640V28.5ZM691 177.5H755.5C805 177.5 825 152 825 123.5C825 95 805 70 755.5 70H691V177.5Z" fill="#4D148C" />
    <path d="M960 219H893.5L846 163L798.5 219H732L810 137.5L737 60.5H803.5L846 111.5L888.5 60.5H955L882 137.5L960 219Z" fill="#FF6600" />
  </svg>
);

// Status badge component
const StatusBadge = ({ status, size = 'default' }) => {
  const statusConfig = {
    pending: {
      icon: Clock,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      label: 'Pending',
    },
    processing: {
      icon: RefreshCw,
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      label: 'Processing',
    },
    confirmed: {
      icon: CheckCircle2,
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      label: 'Confirmed',
    },
    shipped: {
      icon: Truck,
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      label: 'Shipped',
    },
    delivered: {
      icon: CheckCircle2,
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      label: 'Delivered',
    },
    cancelled: {
      icon: XCircle,
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      label: 'Cancelled',
    },
    refunded: {
      icon: AlertCircle,
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      label: 'Refunded',
    },
    paid: {
      icon: CheckCircle2,
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      label: 'Paid',
    },
    unpaid: {
      icon: AlertCircle,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      label: 'Unpaid',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  const sizeClasses = size === 'large' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className={size === 'large' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
};

// Order progress steps
const OrderProgress = ({ status }) => {
  const steps = [
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { id: 'processing', label: 'Processing', icon: RefreshCw },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: Package },
  ];

  const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(status);

  if (status === 'cancelled' || status === 'refunded') {
    return null;
  }

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-5 left-0 right-0 h-px bg-accent/40" />
      <motion.div
        className="absolute top-5 left-0 h-px bg-primary"
        initial={{ width: 0 }}
        animate={{
          width: `${Math.min(100, (currentIndex / (steps.length - 1)) * 100)}%`,
        }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const stepIndex = statusOrder.indexOf(step.id);
          const isCompleted = currentIndex >= stepIndex;
          const isCurrent = currentIndex === stepIndex;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <motion.div
                className={`w-10 h-10 flex items-center justify-center border-2 transition-colors ${
                  isCompleted
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-accent/40 text-accent'
                }`}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={{
                  duration: 0.5,
                  repeat: isCurrent ? Infinity : 0,
                  repeatDelay: 2,
                }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isCompleted ? 'text-secondary' : 'text-accent'
                }`}
              >
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const OrderDetail = () => {
  useSEO({ title: 'Order Details | Art Haven' });

  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  // Generate floating petals
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 10 + i * 12,
    duration: 18 + Math.random() * 10,
    size: 10 + Math.random() * 8,
  }));

  // Generate floating diamonds
  const diamonds = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 3 + 1,
    startX: 5 + i * 18,
    duration: 22 + Math.random() * 12,
    size: 6 + Math.random() * 6,
  }));

  // Generate floating orbs
  const orbs = Array.from({ length: 5 }).map((_, i) => ({
    delay: i * 1.5,
    x: 10 + i * 20,
    y: 15 + (i % 3) * 30,
    size: 80 + Math.random() * 120,
  }));

  // Generate drifting lines
  const lines = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 5,
    y: 20 + i * 20,
    direction: i % 2 === 0 ? 1 : -1,
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
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (order?.fedexShipment?.trackingNumber) {
      fetchTracking();
    }
  }, [order]);

  // Scroll to tracking section if hash is present
  useEffect(() => {
    if (location.hash === '#tracking' && order) {
      setTimeout(() => {
        document
          .getElementById('tracking')
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [location, order]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(
      () => setFeedback({ show: false, message: '', type: 'success' }),
      4000
    );
  };

  const fetchOrder = async () => {
    try {
      const response = await orderService.getById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async () => {
    if (!order?.fedexShipment?.trackingNumber) return;

    try {
      setTrackingLoading(true);
      const response = await shippingService.trackShipment(
        order.fedexShipment.trackingNumber
      );

      if (response.data) {
        setTracking(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tracking:', error);

      if (
        order.orderStatus === 'confirmed' ||
        order.orderStatus === 'pending'
      ) {
        setTracking({
          status: 'Label Not Created',
          events: [
            {
              timestamp: order.createdAt,
              status: 'Order Confirmed',
              description: 'Order confirmed and awaiting shipment',
            },
          ],
        });
      }
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showFeedback('Copied to clipboard');
  };

  // Track on FedEx
  const handleTrackOnFedEx = () => {
    if (order?.fedexShipment?.trackingNumber) {
      const fedexTrackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${order.fedexShipment.trackingNumber}`;
      window.open(fedexTrackingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border border-primary/20 flex items-center justify-center"
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
          <div className="w-20 h-20 border border-accent/40 flex items-center justify-center mx-auto mb-8">
            <Package className="w-10 h-10 text-accent" />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-secondary mb-4">
            Order Not Found
          </h2>
          <p className="text-secondary/70 mb-8">
            The order you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-primary font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="relative">
              Back to Orders
              <span className="absolute bottom-0 left-0 w-full h-px bg-primary" />
            </span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234169E1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
      </div>

      {/* Floating Diamonds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {diamonds.map((diamond, i) => (
          <FloatingDiamond key={`diamond-${i}`} {...diamond} />
        ))}
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {orbs.map((orb, i) => (
          <FloatingOrb key={`orb-${i}`} {...orb} />
        ))}
      </div>

      {/* Drifting Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {lines.map((line, i) => (
          <DriftingLine key={`line-${i}`} {...line} />
        ))}
      </div>

      {/* Orbiting Dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute" style={{ left: '12%', top: '20%' }}>
          <OrbitingDot radius={55} duration={12} delay={0} dotSize={3} />
          <OrbitingDot radius={55} duration={12} delay={6} dotSize={3} />
        </div>
        <div className="absolute" style={{ left: '85%', top: '55%' }}>
          <OrbitingDot radius={40} duration={10} delay={2} dotSize={3} />
          <OrbitingDot radius={40} duration={10} delay={7} dotSize={3} />
        </div>
        <div className="absolute" style={{ left: '50%', top: '80%' }}>
          <OrbitingDot radius={50} duration={14} delay={3} dotSize={2} />
          <OrbitingDot radius={50} duration={14} delay={10} dotSize={2} />
        </div>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-2 ${
              feedback.type === 'error' ? 'bg-red-600' : 'bg-primary'
            } text-white shadow-lg`}
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-secondary/60 mb-8"
        >
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/orders" className="hover:text-primary transition-colors">
            Orders
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-secondary font-medium">
            #{order.orderNumber}
          </span>
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
            className="w-12 h-px bg-primary mb-6 origin-left"
          />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="font-playfair text-3xl lg:text-4xl font-bold text-secondary mb-2">
                Order #{order.orderNumber}
              </h1>
              <p className="text-secondary/70 text-sm">
                Placed on {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.orderStatus} size="large" />
            </div>
          </div>
        </motion.div>

        {/* Order Progress */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="relative bg-white border border-accent/30 p-6 sm:p-8 mb-8"
        >
          <OrderProgress status={order.orderStatus} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 space-y-8"
          >
            {/* Order Items */}
            <motion.div
              variants={itemVariants}
              className="relative bg-white border border-accent/30 overflow-hidden"
            >
              <div className="p-6 border-b border-accent/20">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <h2 className="font-playfair text-xl font-bold text-secondary">
                    Order Items
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-accent/20">
                {order.items.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 flex gap-4"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-accent/10 border border-accent/30 flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-accent" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-secondary mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-secondary/70 mb-2">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm text-secondary/80">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-playfair text-lg font-bold text-secondary">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Tracking Information */}
            {order.fedexShipment?.trackingNumber && (
              <motion.div
                id="tracking"
                variants={itemVariants}
                className="relative bg-white border border-accent/30 overflow-hidden"
              >
                <div className="p-6 border-b border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-primary" />
                      <h2 className="font-playfair text-xl font-bold text-secondary">
                        Tracking Information
                      </h2>
                    </div>
                    <motion.button
                      onClick={fetchTracking}
                      disabled={trackingLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 border border-accent/30 hover:border-primary transition-colors text-sm font-medium text-secondary disabled:opacity-50"
                    >
                      {trackingLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Refresh
                    </motion.button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Tracking Number */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-accent/10 border border-accent/20 mb-6">
                    <div>
                      <p className="text-xs text-secondary/60 uppercase tracking-wide mb-1">
                        Tracking Number
                      </p>
                      <p className="font-mono font-medium text-secondary">
                        {order.fedexShipment.trackingNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() =>
                          copyToClipboard(order.fedexShipment.trackingNumber)
                        }
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 border border-accent/30 hover:border-primary hover:bg-white transition-colors"
                        title="Copy tracking number"
                      >
                        <Copy className="w-4 h-4 text-secondary/60" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Track on FedEx Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                  >
                    <motion.button
                      onClick={handleTrackOnFedEx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-secondary opacity-90 group-hover:opacity-100 transition-opacity" />

                      <div className="relative flex items-center justify-center gap-4 px-6 py-4 cursor-pointer">
                        <FedExLogo className="w-20 h-8 bg-white p-y-1 px-2" />
                        <div className="w-px h-8 bg-white/30" />
                        <div className="flex items-center gap-2 text-white">
                          <Globe className="w-5 h-5" />
                          <span className="font-semibold">
                            Track on FedEx.com
                          </span>
                          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </div>
                    </motion.button>

                    <p className="text-center text-xs text-secondary/50 mt-2">
                      Opens FedEx tracking page in a new tab
                    </p>
                  </motion.div>

                  {/* Tracking Details */}
                  {tracking && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      <div className="p-4 border border-accent/30">
                        <p className="text-xs text-secondary/60 uppercase tracking-wide mb-1">
                          Service
                        </p>
                        <p className="font-medium text-secondary">
                          {order.fedexShipment.serviceType?.replace(/_/g, ' ') ||
                            'Standard'}
                        </p>
                      </div>
                      <div className="p-4 border border-accent/30">
                        <p className="text-xs text-secondary/60 uppercase tracking-wide mb-1">
                          Status
                        </p>
                        <p className="font-medium text-secondary">
                          {tracking.status || 'In Transit'}
                        </p>
                      </div>
                      {tracking.estimatedDelivery && (
                        <div className="p-4 border border-accent/30">
                          <p className="text-xs text-secondary/60 uppercase tracking-wide mb-1">
                            Est. Delivery
                          </p>
                          <p className="font-medium text-secondary">
                            {formatDateTime(tracking.estimatedDelivery)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tracking Timeline */}
                  {trackingLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                    </div>
                  ) : tracking?.events && tracking.events.length > 0 ? (
                    <div>
                      <h3 className="text-xs text-secondary/60 uppercase tracking-wide mb-4">
                        Tracking History
                      </h3>
                      <div className="relative pl-6">
                        {/* Timeline Line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-accent/40" />

                        {tracking.events.map((event, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative mb-6 last:mb-0"
                          >
                            {/* Timeline Dot */}
                            <div
                              className={`absolute -left-6 top-1 w-3.5 h-3.5 border-2 ${
                                index === 0
                                  ? 'bg-primary border-primary'
                                  : 'bg-white border-accent'
                              }`}
                            />

                            <div
                              className={`p-4 ${
                                index === 0
                                  ? 'bg-accent/10 border border-accent/20'
                                  : ''
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                <p className="font-medium text-secondary">
                                  {event.status}
                                </p>
                                <p className="text-xs text-secondary/60">
                                  {formatDateTime(event.timestamp)}
                                </p>
                              </div>
                              {event.location && event.location !== 'N/A' && (
                                <p className="text-sm text-secondary/70 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </p>
                              )}
                              {event.description && (
                                <p className="text-sm text-secondary/80 mt-1">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-accent mx-auto mb-4" />
                      <p className="text-secondary/70">
                        Tracking information will be available once the package
                        is shipped.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Shipping Address */}
            <motion.div
              variants={itemVariants}
              className="relative bg-white border border-accent/30 overflow-hidden"
            >
              <div className="p-6 border-b border-accent/20">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="font-playfair text-xl font-bold text-secondary">
                    Shipping Address
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary/60" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary mb-1">
                      {order.shippingAddress.fullName}
                    </p>
                    <p className="text-secondary/80">
                      {order.shippingAddress.addressLine1}
                    </p>
                    {order.shippingAddress.addressLine2 && (
                      <p className="text-secondary/80">
                        {order.shippingAddress.addressLine2}
                      </p>
                    )}
                    <p className="text-secondary/80">
                      {order.shippingAddress.city},{' '}
                      {order.shippingAddress.state}{' '}
                      {order.shippingAddress.zipCode}
                    </p>
                    <p className="text-secondary/80">
                      {order.shippingAddress.country}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-secondary/70">
                      <Phone className="w-4 h-4 text-primary/60" />
                      <span>{order.shippingAddress.phoneNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-1"
          >
            {/* Order Summary */}
            <motion.div
              variants={itemVariants}
              className="relative bg-white border border-accent/30 sticky top-8"
            >
              <div className="p-6 border-b border-accent/20">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-primary" />
                  <h2 className="font-playfair text-xl font-bold text-secondary">
                    Order Summary
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between text-secondary/80">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Discount{' '}
                      {order.couponUsed?.code && `(${order.couponUsed.code})`}
                    </span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-secondary/80">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>

                {order.tax > 0 && (
                  <div className="flex justify-between text-secondary/80">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-accent/20">
                  <div className="flex justify-between">
                    <span className="font-playfair text-lg font-bold text-secondary">
                      Total
                    </span>
                    <span className="font-playfair text-lg font-bold text-secondary">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="pt-4 border-t border-accent/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary/70">
                      Payment Status
                    </span>
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                </div>
              </div>

              {/* Quick Track on FedEx (Sidebar) */}
              {order.fedexShipment?.trackingNumber && (
                <div className="p-6 border-t border-accent/20">
                  <motion.button
                    onClick={handleTrackOnFedEx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-secondary text-white font-medium flex items-center justify-center gap-2 group cursor-pointer hover:bg-primary transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    Track on FedEx
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </motion.button>
                </div>
              )}

              {/* Actions */}
              <div className="p-6 border-t border-accent/20 space-y-3">
                <Link to="/orders" className="block">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-primary text-white font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Orders
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5 }}
        className="w-32 h-px bg-accent mx-auto my-16"
      />
    </div>
  );
};

export default OrderDetail;