// components/products/ProductCard.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingCart, 
  Eye, 
  Images,
  X,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertCircle,
  Lock,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import ProductQuickView from './ProductQuickView';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

// ============================================
// CUSTOM TOAST STYLES (Black & White)
// ============================================
const toastStyles = {
  style: {
    background: '#111827',
    color: '#ffffff',
    fontWeight: '500',
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  duration: 2500,
  position: 'top-center',
};

const showToast = {
  success: (message, icon = <Check className="w-5 h-5" />) => {
    toast.success(message, {
      ...toastStyles,
      icon: icon,
    });
  },
  error: (message, icon = <AlertCircle className="w-5 h-5" />) => {
    toast.error(message, {
      ...toastStyles,
      style: {
        ...toastStyles.style,
        background: '#1f2937',
      },
      icon: icon,
    });
  },
};

// ============================================
// IMAGE GALLERY MODAL COMPONENT (Glass Effect with Swipe)
// ============================================
const ImageGalleryModal = ({ images, isOpen, onClose, productTitle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const allImages = images?.length > 0 
    ? images.map(img => img.url) 
    : ['https://via.placeholder.com/800x800?text=No+Image'];

  const goToPrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  // Handle swipe
  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    
    if (info.offset.x > swipeThreshold) {
      goToPrevious();
    } else if (info.offset.x < -swipeThreshold) {
      goToNext();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, goToPrevious, goToNext, onClose]);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) setCurrentIndex(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] bg-white/60 backdrop-blur-2xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 sm:p-3 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full transition-all duration-200 cursor-pointer shadow-lg border border-gray-200/50"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <span className="text-gray-700 text-xs sm:text-sm font-medium bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg border border-gray-200/50">
          {currentIndex + 1} / {allImages.length}
        </span>
      </div>

      {/* Product Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 max-w-[60%] sm:max-w-md hidden sm:block">
        <h3 className="text-gray-900 font-medium text-center text-sm sm:text-base truncate bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg border border-gray-200/50">
          {productTitle}
        </h3>
      </div>

      {/* Desktop Navigation Buttons (hidden on mobile) */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="hidden md:flex absolute left-4 lg:left-8 z-10 p-3 lg:p-4 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full transition-all duration-200 cursor-pointer shadow-lg border border-gray-200/50 items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8 text-gray-700" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="hidden md:flex absolute right-4 lg:right-8 z-10 p-3 lg:p-4 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full transition-all duration-200 cursor-pointer shadow-lg border border-gray-200/50 items-center justify-center"
          >
            <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8 text-gray-700" />
          </button>
        </>
      )}

      {/* Main Image Container with Swipe Support */}
      <div 
        className="relative max-w-5xl max-h-[70vh] sm:max-h-[80vh] w-full flex items-center justify-center overflow-hidden touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={currentIndex}
            src={allImages[currentIndex]}
            alt={`${productTitle} - Image ${currentIndex + 1}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag={allImages.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg shadow-2xl cursor-grab active:cursor-grabbing select-none"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x800?text=Image+Not+Found';
            }}
          />
        </AnimatePresence>
      </div>

      {/* Swipe Indicator (mobile only) */}
      {allImages.length > 1 && (
        <div className="md:hidden absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200/50">
            <p className="text-xs text-gray-600 flex items-center gap-2">
              <span>←</span>
              <span>Swipe to browse</span>
              <span>→</span>
            </p>
          </div>
        </div>
      )}

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 max-w-full px-4">
          <div className="flex items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg border border-gray-200/50 overflow-x-auto max-w-[90vw] scrollbar-hide">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  currentIndex === idx 
                    ? 'border-gray-900 shadow-md scale-105' 
                    : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100x100?text=...';
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};

// ============================================
// TOOLTIP COMPONENT
// ============================================
const Tooltip = ({ children, text }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-30 pointer-events-none">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

// ============================================
// ACTION BUTTON COMPONENT
// ============================================
const ActionButton = ({ onClick, disabled, loading, tooltip, children, className = '' }) => {
  return (
    <Tooltip text={tooltip}>
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={onClick}
        disabled={disabled || loading}
        className={`p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 disabled:opacity-50 cursor-pointer ${className}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-gray-700 animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    </Tooltip>
  );
};

// ============================================
// MAIN PRODUCT CARD COMPONENT
// ============================================
const ProductCard = ({ product, index = 0 }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { 
    isWishlisted, 
    addToWishlist, 
    removeFromWishlist, 
    loading: wishlistLoading 
  } = useWishlist();
  
  // State management
  const [showQuickView, setShowQuickView] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const mainImage = primaryImage?.url || 'https://via.placeholder.com/600x600?text=Image+Not+Found';
  
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isOutOfStock = product.productType === 'price-based' && product.stockQuantity <= 0;
  const isAskForPrice = product.productType === 'ask-for-price';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast.error('Please login to add items to cart', <Lock className="w-5 h-5" />);
      return;
    }

    if (isAskForPrice) {
      setShowQuickView(true);
      return;
    }

    if (isOutOfStock) {
      showToast.error('This item is out of stock', <Package className="w-5 h-5" />);
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product._id, 1);
      // showToast.success('Added to Cart', <ShoppingCart className="w-5 h-5" />);
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast.error('Please login to manage wishlist', <Lock className="w-5 h-5" />);
      return;
    }

    setAddingToWishlist(true);
    try {
      if (isWishlisted(product._id)) {
        await removeFromWishlist(product._id);
        // Don't show toast here - context handles it
      } else {
        await addToWishlist(product._id);
        // Don't show toast here - context handles it
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      showToast.error('Failed to update wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  const handleViewImages = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowImageGallery(true);
  };

  // Close modals on escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        setShowQuickView(false);
        setShowImageGallery(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, []);

  return (
    <>
      <motion.div
        className="relative bg-transparent"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
      >
        {/* Image Container */}
        <div className="relative bg-white mb-4">
          <Link to={`/products/${product.slug}`} className="block w-full">
            {/* Loading Skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center aspect-[3/4]">
                <div className="text-gray-400 text-sm">Loading...</div>
              </div>
            )}

            {/* Main Image */}
            <div className="aspect-[3/4] overflow-hidden border border-gray-100 p-2">
              <img
                src={mainImage}
                alt={product.title}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x800?text=Image+Not+Found';
                  setImageLoaded(true);
                }}
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </Link>
        </div>

        {/* Action Icons - Below Image */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* View Images Button */}
          <ActionButton
            onClick={handleViewImages}
            tooltip="View Images"
          >
            <Images className="w-5 h-5 text-gray-700" />
          </ActionButton>

          {/* Wishlist Button */}
          <ActionButton
            onClick={handleWishlistToggle}
            disabled={addingToWishlist || wishlistLoading}
            loading={addingToWishlist}
            tooltip={isWishlisted(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            {isWishlisted(product._id) ? (
              <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
            ) : (
              <Heart className="w-5 h-5 text-gray-700" />
            )}
          </ActionButton>

          {/* Quick View Button */}
          <ActionButton
            onClick={handleQuickView}
            tooltip="Quick View"
          >
            <Eye className="w-5 h-5 text-gray-700" />
          </ActionButton>

          {/* Add to Cart Button OR Sold Out Icon */}
          {!isAskForPrice && (
            <>
              {isOutOfStock ? (
                <Tooltip text="Sold Out">
                  <div className="p-3 bg-gray-100 rounded-full opacity-50 cursor-not-allowed">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                </Tooltip>
              ) : (
                <ActionButton
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  loading={addingToCart}
                  tooltip="Add to Cart"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                </ActionButton>
              )}
            </>
          )}
        </div>

        {/* Badges - Simple inline badges */}
        <div className="flex items-center justify-center gap-2 mb-3 min-h-[24px]">
          {discountPercentage > 0 && !isAskForPrice && (
            <span className="bg-gray-900 text-white px-2 py-0.5 text-xs font-medium">
              {discountPercentage}% OFF
            </span>
          )}
          {isAskForPrice && (
            <span className="bg-gray-900 text-white px-2 py-0.5 text-xs font-medium">
              Price on Request
            </span>
          )}
          {product.isFeatured && !isAskForPrice && !hasDiscount && (
            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 text-xs font-medium">
              Featured
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-red-100 text-red-600 px-2 py-0.5 text-xs font-medium">
              Sold Out
            </span>
          )}
        </div>

        {/* Info Container */}
        <div className="text-center">
          <Link to={`/products/${product.slug}`}>
            {/* Title */}
            <h3 className="text-base sm:text-lg font-medium text-gray-900 line-clamp-2 mb-1">
              {product.title}
            </h3>

            {/* Artist Name */}
            {product.artist?.name && (
              <p className="text-sm text-gray-500 mb-2 italic">
                by {product.artist.name}
              </p>
            )}

            {/* Price Section */}
            <div className="flex items-baseline justify-center gap-2 flex-wrap">
              {isAskForPrice ? (
                <span className="text-base sm:text-lg font-medium text-gray-900">
                  Price Upon Request
                </span>
              ) : (
                <>
                  <span className="text-lg sm:text-xl font-semibold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {discountPercentage > 0 && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(product.compareAtPrice)}
                    </span>
                  )}
                </>
              )}
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Quick View Modal */}
      {showQuickView && (
        <ProductQuickView
          product={product}
          isOpen={showQuickView}
          onClose={() => setShowQuickView(false)}
        />
      )}

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <ImageGalleryModal
          images={product.images}
          isOpen={showImageGallery}
          onClose={() => setShowImageGallery(false)}
          productTitle={product.title}
        />
      )}
    </>
  );
};

export default ProductCard;