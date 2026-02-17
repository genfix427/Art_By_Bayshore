// pages/Wishlist.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Trash2, 
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  ChevronRight,
  Loader2,
  Package
} from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';

// Theme Colors
const theme = {
  primary: '#4169E1',    // Royal Blue
  secondary: '#1E3A5F',  // Deep Navy
  accent: '#B0C4DE',     // Light Steel Blue
  black: '#111111',
  white: '#FFFFFF',
};

// Floating petal component with theme colors
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.15, 0.15, 0],
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
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color: theme.primary }}>
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

// Floating geometric shapes for background
const FloatingShape = ({ delay, startX, duration, type = 'circle' }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, bottom: "-5%" }}
    initial={{ opacity: 0, y: 20, rotate: 0, scale: 0.5 }}
    animate={{
      opacity: [0, 0.12, 0.12, 0],
      y: [20, -400, -800],
      rotate: [0, 90, 180],
      scale: [0.5, 1, 0.5],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    {type === 'circle' ? (
      <div 
        className="w-4 h-4 rounded-full border-2"
        style={{ borderColor: theme.accent }}
      />
    ) : type === 'square' ? (
      <div 
        className="w-3 h-3 border-2 rotate-45"
        style={{ borderColor: theme.primary }}
      />
    ) : (
      <div 
        className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent"
        style={{ borderBottomColor: theme.accent }}
      />
    )}
  </motion.div>
);

// Pulsing dot decoration
const PulsingDot = ({ delay, position, size = 8 }) => (
  <motion.div
    className="absolute pointer-events-none z-0 rounded-full"
    style={{ 
      ...position, 
      width: size, 
      height: size,
      backgroundColor: theme.accent 
    }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.3, 0],
      scale: [0.5, 1.5, 0.5],
    }}
    transition={{
      duration: 4,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Animated line decoration
const AnimatedLine = ({ delay, vertical = false, position }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={position}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.1, 0.1, 0],
      scale: [0, 1, 1, 0],
    }}
    transition={{
      duration: 8,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <div 
      className={vertical ? "w-px h-32" : "w-32 h-px"}
      style={{ backgroundColor: theme.primary }}
    />
  </motion.div>
);

// Flower decoration component
const FlowerDecor = ({ className, color = theme.primary }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2.5" fill={color} />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill={color} opacity="0.5" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill={color} opacity="0.5" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill={color} opacity="0.5" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill={color} opacity="0.5" />
  </svg>
);

const Wishlist = () => {
  useSEO({
    title: 'My Wishlist | Saved Artworks',
    description: 'Browse your saved artworks and favorite pieces',
  });

  const { isAuthenticated } = useAuth();
  const { 
    wishlistItems, 
    loading, 
    clearWishlist,
    removeFromWishlist
  } = useWishlist();
  
  const [removingId, setRemovingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  // Generate floating petals
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 8 + i * 12,
    duration: 18 + Math.random() * 10,
    size: 8 + Math.random() * 6,
  }));

  // Generate floating shapes
  const shapes = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 2.5,
    startX: 10 + i * 15,
    duration: 20 + Math.random() * 10,
    type: ['circle', 'square', 'triangle'][i % 3],
  }));

  // Generate pulsing dots
  const dots = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 2,
    position: {
      top: `${20 + i * 20}%`,
      left: i % 2 === 0 ? '3%' : '97%',
    },
    size: 6 + Math.random() * 6,
  }));

  // Generate animated lines
  const lines = Array.from({ length: 3 }).map((_, i) => ({
    delay: i * 4,
    vertical: i % 2 === 0,
    position: {
      top: `${25 + i * 25}%`,
      [i % 2 === 0 ? 'right' : 'left']: '5%',
    },
  }));

  // Get products from wishlist items
  const getProductsFromWishlist = () => {
    if (!wishlistItems || !Array.isArray(wishlistItems)) {
      return [];
    }
    
    const products = wishlistItems.map(item => {
      if (item._id && item.title) {
        return item;
      }
      if (item.product && typeof item.product === 'object') {
        return item.product;
      }
      if (item.productId && typeof item.productId === 'object') {
        return item.productId;
      }
      return null;
    }).filter(Boolean);
    
    return products;
  };

  const products = getProductsFromWishlist();

  // Get the correct product ID for removal
  const getProductIdFromItem = (product) => {
    return product._id || product.product?._id || product.productId?._id;
  };

  // Remove item directly without confirmation
  const handleRemoveItem = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      return;
    }

    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  // Clear wishlist directly without confirmation
  const handleClearWishlist = async () => {
    if (clearing) return;
    
    setClearing(true);
    try {
      await clearWishlist();
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
    } finally {
      setClearing(false);
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: theme.white }}
      >
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

        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          {shapes.map((shape, i) => (
            <FloatingShape key={`shape-${i}`} {...shape} />
          ))}
        </div>

        {/* Decorative Circles */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.06, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-20 right-20 w-64 h-64 rounded-full border hidden lg:block pointer-events-none"
          style={{ borderColor: theme.primary }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8"
          >
            <div 
              className="absolute inset-0 flex items-center justify-center border"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <Heart className="w-12 h-12 sm:w-16 sm:h-16" style={{ color: `${theme.primary}30` }} />
            </div>
            <motion.div
              className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <FlowerDecor className="w-full h-full" color={`${theme.primary}30`} />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-12 sm:w-16 h-px mx-auto mb-4 sm:mb-6"
            style={{ backgroundColor: theme.primary }}
          />

          <h1 
            className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4"
            style={{ color: theme.primary }}
          >
            Please Login
          </h1>
          <p 
            className="mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base px-4"
            style={{ color: `${theme.secondary}b3` }}
          >
            You need to be logged in to view your wishlist
          </p>

          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 font-medium transition-colors group cursor-pointer text-sm sm:text-base"
              style={{ backgroundColor: theme.primary, color: theme.white }}
              onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
              onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
            >
              <span>Login to Continue</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ backgroundColor: theme.white }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center border"
          style={{ borderColor: `${theme.primary}30` }}
        >
          <FlowerDecor className="w-6 h-6 sm:w-8 sm:h-8" color={`${theme.primary}50`} />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-sm tracking-[0.2em] uppercase mt-4"
          style={{ color: `${theme.secondary}80` }}
        >
          Loading Wishlist
        </motion.p>
      </div>
    );
  }

  // Empty wishlist state
  if (products.length === 0) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: theme.white }}
      >
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

        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          {shapes.map((shape, i) => (
            <FloatingShape key={`shape-${i}`} {...shape} />
          ))}
        </div>

        {/* Pulsing Dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          {dots.map((dot, i) => (
            <PulsingDot key={`dot-${i}`} {...dot} />
          ))}
        </div>

        {/* Decorative Circles */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.06, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-20 right-20 w-64 h-64 rounded-full border hidden lg:block pointer-events-none"
          style={{ borderColor: theme.primary }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.06, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute bottom-32 left-20 w-48 h-48 rounded-full border hidden lg:block pointer-events-none"
          style={{ borderColor: theme.accent }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8"
          >
            <div 
              className="absolute inset-0 flex items-center justify-center border"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <Heart className="w-12 h-12 sm:w-16 sm:h-16" style={{ color: `${theme.primary}30` }} />
            </div>
            <motion.div
              className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <FlowerDecor className="w-full h-full" color={`${theme.primary}30`} />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-12 sm:w-16 h-px mx-auto mb-4 sm:mb-6"
            style={{ backgroundColor: theme.primary }}
          />

          <h1 
            className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4"
            style={{ color: theme.primary }}
          >
            Your Wishlist is Empty
          </h1>
          <p 
            className="mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base px-4"
            style={{ color: `${theme.secondary}b3` }}
          >
            Save your favorite artworks here to view them later
          </p>

          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 font-medium transition-colors group cursor-pointer text-sm sm:text-base"
              style={{ backgroundColor: theme.primary, color: theme.white }}
              onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
              onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Browse Artworks</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Wishlist with items
  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: theme.white }}
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234169E1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals - Hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
      </div>

      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        {shapes.map((shape, i) => (
          <FloatingShape key={`shape-${i}`} {...shape} />
        ))}
      </div>

      {/* Pulsing Dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
        {dots.map((dot, i) => (
          <PulsingDot key={`dot-${i}`} {...dot} />
        ))}
      </div>

      {/* Animated Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
        {lines.map((line, i) => (
          <AnimatedLine key={`line-${i}`} {...line} />
        ))}
      </div>

      {/* Decorative Circles */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute top-20 right-20 w-72 h-72 rounded-full border hidden lg:block pointer-events-none"
        style={{ borderColor: theme.primary }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute bottom-32 left-20 w-56 h-56 rounded-full border hidden lg:block pointer-events-none"
        style={{ borderColor: theme.accent }}
      />

      {/* Rotating Flower Decoration */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-40 left-10 w-24 h-24 pointer-events-none hidden lg:block"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-full h-full" color={theme.primary} />
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden sm:flex items-center gap-2 text-sm mb-6 sm:mb-8"
          style={{ color: `${theme.primary}80` }}
        >
          <Link 
            to="/" 
            className="transition-colors"
            style={{ color: theme.primary }}
          >
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span style={{ color: theme.secondary }}>My Wishlist</span>
        </motion.nav>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-10"
        >
          <div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8 }}
              className="w-8 sm:w-12 h-px mb-4 sm:mb-6 origin-left"
              style={{ backgroundColor: theme.primary }}
            />
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border"
                style={{ borderColor: `${theme.primary}30` }}
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.primary }} />
              </div>
              <h1 
                className="font-playfair text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold"
                style={{ color: theme.primary }}
              >
                My Wishlist
              </h1>
            </div>
            <p 
              className="text-sm sm:text-base ml-0 sm:ml-16"
              style={{ color: `${theme.secondary}99` }}
            >
              {products.length} {products.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>

          {products.length > 0 && (
            <motion.button
              onClick={handleClearWishlist}
              disabled={clearing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-3 sm:px-4 py-2 border transition-colors disabled:opacity-50 text-xs sm:text-sm font-medium cursor-pointer"
              style={{ 
                borderColor: '#FCA5A5',
                color: '#EF4444'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {clearing ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              Clear All
            </motion.button>
          )}
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
        >
          <AnimatePresence mode="popLayout">
            {products.map((product, index) => {
              const productId = getProductIdFromItem(product);
              const isRemoving = removingId === productId;
              
              return (
                <motion.div
                  key={productId || index}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`relative group ${isRemoving ? 'opacity-50' : ''}`}
                >
                  {/* Remove Button */}
                  <motion.button
                    onClick={() => handleRemoveItem(productId)}
                    disabled={isRemoving}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-3 right-3 z-20 w-8 h-8 sm:w-10 sm:h-10 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer border"
                    style={{ 
                      backgroundColor: `${theme.white}e6`,
                      borderColor: `${theme.primary}20`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.white;
                      e.currentTarget.style.borderColor = '#FCA5A5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${theme.white}e6`;
                      e.currentTarget.style.borderColor = `${theme.primary}20`;
                    }}
                    title="Remove from wishlist"
                  >
                    {isRemoving ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" style={{ color: '#EF4444' }} />
                    ) : (
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#EF4444' }} />
                    )}
                  </motion.button>

                  {/* Product Card */}
                  <ProductCard 
                    product={product} 
                    index={index} 
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Continue Shopping Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 sm:mt-12 pt-8 border-t"
          style={{ borderColor: `${theme.primary}20` }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p 
              className="text-sm sm:text-base text-center sm:text-left"
              style={{ color: `${theme.secondary}99` }}
            >
              Items remain in your wishlist until you remove them
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 transition-colors group text-sm sm:text-base"
              style={{ color: `${theme.secondary}b3` }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = `${theme.secondary}b3`}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="relative">
                Continue Shopping
                <span 
                  className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: theme.primary }}
                />
              </span>
            </Link>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
        >
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: `${theme.secondary}80` }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = `${theme.secondary}80`}
          >
            <ShoppingBag className="w-4 h-4" />
            View Cart
          </Link>
          <div 
            className="w-px h-4"
            style={{ backgroundColor: `${theme.primary}20` }}
          />
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: `${theme.secondary}80` }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = `${theme.secondary}80`}
          >
            <Package className="w-4 h-4" />
            All Products
          </Link>
        </motion.div>
      </div>

      {/* Bottom Decoration */}
      <div className="flex justify-center my-10 sm:my-16">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5 }}
          className="w-20 sm:w-32 h-px"
          style={{ backgroundColor: `${theme.primary}25` }}
        />
      </div>

      {/* Bottom rotating flower */}
      <div className="flex justify-center mb-10 sm:mb-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-6 h-6" color={`${theme.primary}30`} />
        </motion.div>
      </div>
    </div>
  );
};

export default Wishlist;