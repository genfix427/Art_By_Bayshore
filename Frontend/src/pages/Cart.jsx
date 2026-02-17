import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useSEO } from '../hooks/useSEO.jsx';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  X,
  ArrowRight,
  ArrowLeft,
  Package,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Check,
  Loader2,
  Heart,
  Sparkles,
  CreditCard,
  RotateCcw,
  Calculator,
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

const Cart = () => {
  useSEO({ title: 'Shopping Cart | Art Haven' });

  const { cart, loading, updateCartItem, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });
  const [promoCode, setPromoCode] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Generate floating petals
  const petals = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 2.5,
    startX: 10 + i * 15,
    duration: 18 + Math.random() * 10,
    size: 8 + Math.random() * 6,
  }));

  // Generate floating diamonds
  const diamonds = Array.from({ length: 5 }).map((_, i) => ({
    delay: i * 3 + 1,
    startX: 8 + i * 20,
    duration: 22 + Math.random() * 12,
    size: 6 + Math.random() * 6,
  }));

  // Generate floating orbs
  const orbs = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 1.5,
    x: 15 + i * 22,
    y: 10 + (i % 3) * 35,
    size: 80 + Math.random() * 100,
  }));

  // Generate drifting lines
  const lines = Array.from({ length: 3 }).map((_, i) => ({
    delay: i * 6,
    y: 25 + i * 25,
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
    exit: {
      opacity: 0,
      x: -100,
      height: 0,
      marginBottom: 0,
      padding: 0,
      transition: { duration: 0.3 },
    },
  };

  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdatingItem(itemId);
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      showFeedback('Failed to update quantity', 'error');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setRemovingItem(itemId);
    try {
      await removeFromCart(itemId);
      showFeedback('Item removed from cart');
    } catch (error) {
      showFeedback('Failed to remove item', 'error');
    } finally {
      setRemovingItem(null);
    }
  };

  const handleClearCart = async () => {
    setClearing(true);
    try {
      await clearCart();
      showFeedback('Cart cleared');
    } catch (error) {
      showFeedback('Failed to clear cart', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const subtotal = cart?.subtotal || 0;

  // Loading State
  if (loading && !cart) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 sm:w-16 sm:h-16 border border-primary/20 flex items-center justify-center"
        >
          <div className="w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-primary" />
        </motion.div>
      </div>
    );
  }

  // Empty Cart State
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-4 py-12">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234169E1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Floating Petals */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          {petals.map((petal, i) => (
            <FloatingPetal key={`petal-${i}`} {...petal} />
          ))}
        </div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          {orbs.map((orb, i) => (
            <FloatingOrb key={`orb-${i}`} {...orb} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-md w-full"
        >
          {/* Empty Cart Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8"
          >
            <div className="absolute inset-0 border border-accent/40 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-accent" />
            </div>
            <motion.div
              className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            >
              <FlowerDecor className="w-full h-full text-primary/20" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-12 sm:w-16 h-px bg-primary mx-auto mb-4 sm:mb-6"
          />

          <h1 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary mb-3 sm:mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-secondary/70 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base px-4">
            Discover our curated collection of beautiful artworks and start building your personal gallery.
          </p>

          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 sm:gap-3 bg-primary text-white px-6 sm:px-8 py-3 sm:py-4 font-medium hover:bg-secondary transition-colors group cursor-pointer text-sm sm:text-base"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 sm:mt-16 grid grid-cols-3 gap-3 sm:gap-6"
          >
            {[
              { icon: Calculator, label: 'Shipping', sublabel: 'At checkout' },
              { icon: ShieldCheck, label: 'Secure', sublabel: 'Protected' },
              { icon: RotateCcw, label: 'Original', sublabel: 'Authentic' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 border border-accent/40 flex items-center justify-center">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary/50" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-secondary block">{item.label}</span>
                <span className="text-[10px] sm:text-xs text-secondary/50">{item.sublabel}</span>
              </motion.div>
            ))}
          </motion.div>
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
      </div>

      {/* Floating Diamonds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        {lines.map((line, i) => (
          <DriftingLine key={`line-${i}`} {...line} />
        ))}
      </div>

      {/* Orbiting Dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
        <div className="absolute" style={{ left: '8%', top: '25%' }}>
          <OrbitingDot radius={50} duration={12} delay={0} dotSize={3} />
          <OrbitingDot radius={50} duration={12} delay={6} dotSize={3} />
        </div>
        <div className="absolute" style={{ left: '90%', top: '60%' }}>
          <OrbitingDot radius={38} duration={10} delay={3} dotSize={3} />
          <OrbitingDot radius={38} duration={10} delay={8} dotSize={3} />
        </div>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 px-4 sm:px-6 py-3 flex items-center justify-center gap-2 shadow-lg ${
              feedback.type === 'error' ? 'bg-red-600' : 'bg-primary'
            } text-white`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">

        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden sm:flex items-center gap-2 text-sm text-primary mb-6 sm:mb-8"
        >
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-600 font-medium">Shopping Cart</span>
        </motion.nav>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 mb-6 sm:mb-10"
        >
          <div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8 }}
              className="w-8 sm:w-12 h-px bg-primary mb-4 sm:mb-6 origin-left"
            />
            <h1 className="font-playfair text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 sm:mb-2">
              Shopping Cart
            </h1>
            <p className="text-secondary/70 text-sm sm:text-base">
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          {cart.items.length > 0 && (
            <motion.button
              onClick={handleClearCart}
              disabled={clearing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="self-start inline-flex items-center gap-2 px-3 sm:px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 text-xs sm:text-sm font-medium cursor-pointer"
            >
              {clearing ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              Clear Cart
            </motion.button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">

          {/* Cart Items */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 order-1 lg:order-1"
          >
            <div className="relative bg-white border border-accent/30">
              <AnimatePresence mode="popLayout">
                {cart.items.map((item, index) => {
                  const isUpdating = updatingItem === item._id;
                  const isRemoving = removingItem === item._id;
                  const itemTotal = item.price * item.quantity;
                  const isUnavailable = item.product && !item.product.isActive;
                  const isLowStock = item.product && item.quantity > item.product.stockQuantity;

                  return (
                    <motion.div
                      key={item._id}
                      variants={itemVariants}
                      layout
                      exit="exit"
                      className={`p-4 sm:p-6 border-b border-accent/20 last:border-b-0 transition-opacity ${
                        isRemoving ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex gap-3 sm:gap-4 md:gap-6">
                        {/* Product Image */}
                        <Link
                          to={`/products/${item.product?.slug}`}
                          className="flex-shrink-0 group"
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 border border-accent/30 overflow-hidden bg-accent/5 relative"
                          >
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                              </div>
                            )}

                            {isUnavailable && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <span className="text-[10px] sm:text-xs text-red-600 font-medium">Unavailable</span>
                              </div>
                            )}
                          </motion.div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-2 sm:gap-4">
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/products/${item.product?.slug}`}
                                className="group"
                              >
                                <h3 className="font-playfair text-sm sm:text-base md:text-lg font-bold text-secondary truncate group-hover:text-primary transition-colors">
                                  {item.title}
                                </h3>
                              </Link>

                              {item.product?.artist && (
                                <p className="text-xs sm:text-sm text-secondary/60 mt-0.5 sm:mt-1 truncate">
                                  by {item.product.artist.name}
                                </p>
                              )}

                              {/* Price */}
                              <div className="mt-2 sm:mt-3">
                                <span className="font-playfair text-base sm:text-lg md:text-xl font-bold text-secondary">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>

                              {/* Warnings */}
                              {isUnavailable && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex items-center gap-1 text-red-600 text-xs sm:text-sm mt-1 sm:mt-2"
                                >
                                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">No longer available</span>
                                </motion.p>
                              )}

                              {isLowStock && !isUnavailable && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex items-center gap-1 text-amber-600 text-xs sm:text-sm mt-1 sm:mt-2"
                                >
                                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">Only {item.product.stockQuantity} left</span>
                                </motion.p>
                              )}
                            </div>

                            {/* Remove Button */}
                            <motion.button
                              onClick={() => handleRemoveItem(item._id)}
                              disabled={isRemoving}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-accent hover:text-red-600 transition-colors self-start -mr-1 sm:mr-0"
                            >
                              {isRemoving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer" />
                              )}
                            </motion.button>
                          </div>

                          {/* Quantity & Total Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-accent/15">
                            {/* Quantity Control */}
                            <div className="flex items-center">
                              <span className="text-[10px] sm:text-xs text-secondary/50 uppercase tracking-wide mr-2 sm:mr-3">Qty</span>
                              <div className="flex items-center border border-accent/30">
                                <motion.button
                                  onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                                  disabled={isUpdating || item.quantity <= 1}
                                  whileHover={{ backgroundColor: 'rgba(65,105,225,0.04)' }}
                                  whileTap={{ scale: 0.95 }}
                                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-secondary/50 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </motion.button>

                                <div className="w-10 sm:w-14 h-9 sm:h-10 flex items-center justify-center border-x border-accent/30 bg-accent/5">
                                  {isUpdating ? (
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-primary/50" />
                                  ) : (
                                    <input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (val > 0 && val <= (item.product?.stockQuantity || 999)) {
                                          handleQuantityChange(item._id, val);
                                        }
                                      }}
                                      min="1"
                                      max={item.product?.stockQuantity || 999}
                                      className="w-full h-full text-center bg-transparent outline-none font-medium text-secondary text-sm sm:text-base"
                                    />
                                  )}
                                </div>

                                <motion.button
                                  onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                                  disabled={isUpdating || item.quantity >= (item.product?.stockQuantity || 999)}
                                  whileHover={{ backgroundColor: 'rgba(65,105,225,0.04)' }}
                                  whileTap={{ scale: 0.95 }}
                                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-secondary/50 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </motion.button>
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="flex items-center justify-between sm:justify-end sm:text-right">
                              <span className="text-[10px] sm:text-xs text-secondary/50 uppercase tracking-wide sm:hidden">Total</span>
                              <div>
                                <span className="hidden sm:block text-[10px] sm:text-xs text-secondary/50 uppercase tracking-wide mb-0.5 sm:mb-1">Total</span>
                                <p className="font-playfair text-base sm:text-lg md:text-xl font-bold text-secondary">
                                  {formatCurrency(itemTotal)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Continue Shopping Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 sm:mt-8"
            >
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-secondary/70 hover:text-primary transition-colors group text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="relative">
                  Continue Shopping
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Order Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 order-2 lg:order-2"
          >
            <div className="relative bg-white border border-accent/30 lg:sticky lg:top-8">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-accent/20">
                <h2 className="font-playfair text-lg sm:text-xl font-bold text-primary">
                  Order Summary
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                {/* Price Breakdown */}
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div className="flex justify-between text-secondary/80 text-sm sm:text-base">
                    <span>Subtotal</span>
                    <span className="font-medium text-secondary">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-secondary/60 text-xs sm:text-sm">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                {/* Total at Checkout */}
                <div className="pt-3 sm:pt-4 border-t border-accent/20 mb-4 sm:mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-secondary/80 text-sm sm:text-base">Total</span>
                    <div className="text-right">
                      <span className="text-xs sm:text-sm text-secondary/50 block">From</span>
                      <span className="font-playfair text-xl sm:text-2xl font-bold text-secondary">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs text-secondary/50 mt-1 sm:mt-2">
                    Final total includes shipping and taxes
                  </p>
                </div>

                {/* Checkout Button */}
                <motion.button
                  onClick={handleCheckout}
                  disabled={loading || cart.items.length === 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary text-white py-3 sm:py-4 font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
                >
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                {/* Secondary Actions */}
                <div className="mt-3 sm:mt-4 flex items-center justify-center gap-4 sm:gap-6">
                  <Link
                    to="/wishlist"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-secondary/60 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                    Wishlist
                  </Link>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-secondary/60 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                    Products
                  </Link>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="p-4 sm:p-6 border-t border-accent/20 bg-accent/5">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { icon: ShieldCheck, label: 'Secure' },
                    { icon: Calculator, label: 'Shipping', sublabel: 'Calculated' },
                    { icon: RotateCcw, label: '100%', sublabel: 'Original' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="text-center"
                    >
                      <item.icon className="w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-1 sm:mb-1.5 text-primary/50" />
                      <span className="text-[9px] sm:text-[10px] text-secondary/60 leading-tight block">
                        {item.label}
                        {item.sublabel && (
                          <span className="block">{item.sublabel}</span>
                        )}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 sm:mt-6 text-center"
            >
              <p className="text-[10px] sm:text-xs text-secondary/50">
                Need help? <Link to="/contact" className="text-primary underline underline-offset-2 cursor-pointer">Contact us</Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5 }}
        className="w-20 sm:w-32 h-px bg-accent mx-auto my-10 sm:my-16"
      />
    </div>
  );
};

export default Cart;