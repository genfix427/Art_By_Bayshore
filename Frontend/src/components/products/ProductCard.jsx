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
  Package
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import ProductQuickView from './ProductQuickView'; // Your original QuickView
import { formatCurrency } from '../../utils/formatters';

// ============================================
// IMAGE GALLERY MODAL COMPONENT (White + Blur)
// ============================================
const ImageGalleryModal = ({ images, isOpen, onClose, productTitle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const allImages = images?.length > 0 
    ? images.map(img => img.url) 
    : ['https://via.placeholder.com/800x800?text=No+Image'];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

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

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 z-10 p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer shadow-sm"
      >
        <X className="w-6 h-6 text-gray-700" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-6 left-6 z-10">
        <span className="text-gray-700 text-sm font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200">
          {currentIndex + 1} / {allImages.length}
        </span>
      </div>

      {/* Product Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 max-w-md">
        <h3 className="text-gray-900 font-medium text-center text-sm sm:text-base truncate bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-sm border border-gray-200">
          {productTitle}
        </h3>
      </div>

      {/* Previous Button */}
      {allImages.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 sm:left-8 z-10 p-3 sm:p-4 bg-white hover:bg-gray-100 rounded-full transition-colors cursor-pointer shadow-lg border border-gray-200"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
        </button>
      )}

      {/* Main Image Container */}
      <div 
        className="relative max-w-5xl max-h-[80vh] w-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100"
          >
            <img
              src={allImages[currentIndex]}
              alt={`${productTitle} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x800?text=Image+Not+Found';
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next Button */}
      {allImages.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 sm:right-8 z-10 p-3 sm:p-4 bg-white hover:bg-gray-100 rounded-full transition-colors cursor-pointer shadow-lg border border-gray-200"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
        </button>
      )}

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 max-w-full px-4">
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-gray-200">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
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
  const [feedback, setFeedback] = useState({ active: false, message: '' });

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const mainImage = primaryImage?.url || 'https://via.placeholder.com/600x600?text=Image+Not+Found';
  
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isOutOfStock = product.productType === 'price-based' && product.stockQuantity <= 0;
  const isAskForPrice = product.productType === 'ask-for-price';

  // Show feedback message
  const showFeedback = (message) => {
    setFeedback({ active: true, message });
    setTimeout(() => {
      setFeedback({ active: false, message: '' });
    }, 2500);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showFeedback('Please login first');
      return;
    }

    if (isAskForPrice) {
      setShowQuickView(true);
      return;
    }

    if (isOutOfStock) {
      showFeedback('This item is out of stock');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product._id, 1);
      showFeedback('Added to Cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showFeedback('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showFeedback('Please login first');
      return;
    }

    setAddingToWishlist(true);
    try {
      if (isWishlisted(product._id)) {
        await removeFromWishlist(product._id);
        showFeedback('Removed from Wishlist');
      } else {
        await addToWishlist(product._id);
        showFeedback('Added to Wishlist!');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      showFeedback('Failed to update wishlist');
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
            <div className="aspect-[3/4] overflow-hidden">
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

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback.active && createPortal(
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full flex items-center gap-2 z-[9999] shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          >
            <CheckCircle size={18} />
            <span className="font-medium text-sm">{feedback.message}</span>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {/* Quick View Modal - Conditionally render */}
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