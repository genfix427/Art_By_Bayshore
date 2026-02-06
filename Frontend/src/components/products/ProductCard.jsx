// components/products/ProductCard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingCart, 
  Eye, 
  X,
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import toast from 'react-hot-toast';
import ProductQuickView from './ProductQuickView';
import { formatCurrency } from '../../utils/formatters';

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
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
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

  return (
    <>
      <motion.div
        className="relative bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-sm border border-gray-100"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.1 }}
      >
        {/* Image Container */}
        <div className="relative h-64 sm:h-72 md:h-80 bg-white overflow-hidden">
          <Link to={`/products/${product.slug}`} className="block w-full h-full">
            {/* Loading Skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
              </div>
            )}

            {/* Main Image */}
            <motion.img
              src={mainImage}
              alt={product.title}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/600x600?text=Image+Not+Found';
                setImageLoaded(true);
              }}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            />
          </Link>

          {/* Action Icons */}
          <div className="absolute top-4 right-4 z-10 flex flex-col space-y-3">
            {/* Wishlist Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 0.8 }}
              whileHover={{ scale: 1.1, backgroundColor: "#ffffff" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWishlistToggle}
              disabled={addingToWishlist || wishlistLoading}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
              title={isWishlisted(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {addingToWishlist ? (
                <Loader2 className="text-gray-700 animate-spin" size={20} />
              ) : isWishlisted(product._id) ? (
                <Heart className="text-red-500" fill="currentColor" size={20} />
              ) : (
                <Heart className="text-gray-700 hover:text-red-500" size={20} />
              )}
            </motion.button>

            {/* Quick View Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 0.8 }}
              whileHover={{ scale: 1.1, backgroundColor: "#ffffff" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleQuickView}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 cursor-pointer"
              title="Quick View"
            >
              <Eye className="text-gray-700 hover:text-emerald-600" size={20} />
            </motion.button>

            {/* Add to Cart Button - Hide for Ask for Price products */}
            {!isAskForPrice && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 0.8 }}
                whileHover={{ scale: 1.1, backgroundColor: "#ffffff" }}
                whileTap={{ scale: 0.95 }}
                onClick={isOutOfStock ? undefined : handleAddToCart}
                disabled={addingToCart || isOutOfStock}
                className={`p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 cursor-pointer ${
                  isOutOfStock ? 'cursor-not-allowed' : 'disabled:opacity-50'
                }`}
                title={isOutOfStock ? "Sold Out" : "Add to Cart"}
              >
                {addingToCart ? (
                  <Loader2 className="text-gray-700 animate-spin" size={20} />
                ) : isOutOfStock ? (
                  <Info className="text-red-500" size={20} />
                ) : (
                  <ShoppingCart className="text-gray-700 hover:text-emerald-600" size={20} />
                )}
              </motion.button>
            )}
          </div>

          {/* Discount Badge */}
          {discountPercentage > 0 && !isAskForPrice && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                {discountPercentage}% OFF
              </span>
            </div>
          )}

          {/* Ask for Price Badge */}
          {isAskForPrice && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Ask Upon Price
              </span>
            </div>
          )}

          {/* Featured Badge */}
          {product.isFeatured && !isAskForPrice && !hasDiscount && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Featured
              </span>
            </div>
          )}

          {/* Sold Out Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white/90 text-red-600 px-4 py-2 rounded-full font-bold text-sm backdrop-blur-sm">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Info Container */}
        <div className="p-4 sm:p-5 md:p-6 text-center">
          <Link to={`/products/${product.slug}`}>
            {/* Category */}
            <div className="mb-2">
              <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {product.category?.name || 'Uncategorized'}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 transition-colors duration-300 hover:text-emerald-800 mb-2 sm:mb-3 min-h-[2.5rem] sm:min-h-[3rem]">
              {product.title}
            </h3>

            {/* Artist Name */}
            {product.artist?.name && (
              <p className="text-lg sm:text-xl text-gray-600 mb-3 sm:mb-4 truncate italic">
                by {product.artist.name}
              </p>
            )}

            {/* Price Section */}
            <div className="flex items-baseline justify-center space-x-2 flex-wrap">
              {isAskForPrice ? (
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  Price Upon Request
                </span>
              ) : (
                <>
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {discountPercentage > 0 && (
                    <span className="text-base sm:text-lg text-gray-400 line-through">
                      {formatCurrency(product.compareAtPrice)}
                    </span>
                  )}
                </>
              )}
            </div>
          </Link>
        </div>

        {/* Feedback Message */}
        <AnimatePresence>
          {feedback.active && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white p-3 flex items-center justify-center z-20"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ ease: "easeInOut", duration: 0.3 }}
            >
              <CheckCircle size={18} className="mr-2" />
              <span className="font-semibold text-sm">{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick View Modal */}
      <ProductQuickView
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </>
  );
};

export default ProductCard;