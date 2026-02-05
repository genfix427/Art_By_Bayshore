// components/products/ProductCard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingCart, 
  Eye, 
  Star,
  Tag,
  Check,
  Loader2,
  ZoomIn,
  ChevronRight,
  Sparkles,
  Info,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import toast from 'react-hot-toast';
import ProductQuickView from './ProductQuickView';
import { formatCurrency } from '../../utils/formatters';

const ProductCard = ({ product, index, viewMode = 'grid' }) => {
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
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isOutOfStock = product.productType === 'price-based' && product.stockQuantity <= 0;
  const isAskForPrice = product.productType === 'ask-for-price';

  useEffect(() => {
    if (feedback.show) {
      const timer = setTimeout(() => {
        setFeedback({ ...feedback, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message, {
        icon: '🎨',
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });
    } else {
      toast.error(message);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please login to add items to cart', 'error');
      return;
    }

    if (isAskForPrice) {
      setShowQuickView(true);
      return;
    }

    if (isOutOfStock) {
      showToast('This item is out of stock', 'error');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product._id, 1);
      showToast('Added to cart successfully!');
      setFeedback({
        show: true,
        message: 'Added to Cart!',
        type: 'success'
      });
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

    const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please login to manage wishlist', 'error');
      return;
    }

    try {
      if (isWishlisted(product._id)) {
        await removeFromWishlist(product._id);
        setFeedback({
          show: true,
          message: 'Removed from Wishlist',
          type: 'info'
        });
      } else {
        await addToWishlist(product._id);
        setFeedback({
          show: true,
          message: 'Added to Wishlist!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      showToast('Failed to update wishlist', 'error');
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  // Grid View Card
  if (viewMode === 'grid') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ y: -8 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300"
        >
          {/* Product Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            <Link to={`/products/${product.slug}`} className="block w-full h-full">
              {/* Image Loading Skeleton */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
              )}

              {/* Product Image */}
              {primaryImage && (
                <motion.img
                  src={primaryImage.url}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onLoad={() => setImageLoaded(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageLoaded ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>

            {/* Badges */}
            <div className="absolute top-3 left-3 z-10 space-y-2">
              {isAskForPrice && (
                <motion.span
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                >
                  <Tag size={10} />
                  Price on Request
                </motion.span>
              )}
              
              {hasDiscount && !isAskForPrice && (
                <motion.span
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                >
                  <Tag size={10} />
                  {discountPercentage}% OFF
                </motion.span>
              )}
              
              {product.isFeatured && (
                <motion.span
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                >
                  <Star size={10} fill="white" />
                  Featured
                </motion.span>
              )}
            </div>

            {/* Stock Status */}
            {!isAskForPrice && isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-white/90 backdrop-blur-sm text-red-600 px-4 py-2 rounded-full font-bold text-sm">
                  Sold Out
                </span>
              </div>
            )}

            {/* Action Buttons Overlay */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleQuickView}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:bg-white"
                title="Quick View"
              >
                <Eye size={20} className="text-gray-800" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWishlistToggle}
                disabled={wishlistLoading || addingToWishlist}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:bg-white"
                title={isWishlisted(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                {addingToWishlist ? (
                  <Loader2 size={20} className="animate-spin text-gray-800" />
                ) : (
                  <Heart 
                    size={20} 
                    className={`${isWishlisted(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-800'}`} 
                  />
                )}
              </motion.button>
              
              {!isAskForPrice && !isOutOfStock && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:bg-white"
                  title="Add to Cart"
                >
                  {addingToCart ? (
                    <Loader2 size={20} className="animate-spin text-gray-800" />
                  ) : (
                    <ShoppingCart size={20} className="text-gray-800" />
                  )}
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="p-5">
            <Link to={`/products/${product.slug}`}>
              {/* Category */}
              {product.category?.name && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {product.category.name}
                </p>
              )}

              {/* Title */}
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 min-h-[3rem]">
                {product.title}
              </h3>

              {/* Artist */}
              {product.artist?.name && (
                <p className="text-sm text-gray-600 mb-3">
                  by <span className="font-medium text-gray-800">{product.artist.name}</span>
                </p>
              )}

              {/* Price Section */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-baseline gap-2">
                  {isAskForPrice ? (
                    <span className="text-lg font-bold text-purple-700">
                      Price on Request
                    </span>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatCurrency(product.compareAtPrice)}
                        </span>
                      )}
                    </>
                  )}
                </div>
                
                {/* Rating */}
                {product.averageRating > 0 && (
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-gray-700">
                      {product.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stock Status & Add to Cart */}
              {!isAskForPrice && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        product.stockQuantity > 10 ? 'bg-emerald-500' : 
                        product.stockQuantity > 0 ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className={`text-sm font-medium ${
                        product.stockQuantity > 10 ? 'text-emerald-600' : 
                        product.stockQuantity > 0 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {product.stockQuantity > 10 
                          ? 'In Stock' 
                          : product.stockQuantity > 0 
                          ? `Only ${product.stockQuantity} left` 
                          : 'Out of Stock'}
                      </span>
                    </div>
                    
                    {product.stockQuantity > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {addingToCart ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            Add to Cart
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                  
                  {/* Progress Bar for Limited Stock */}
                  {product.stockQuantity > 0 && product.stockQuantity <= 10 && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(product.stockQuantity / 10) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </Link>

            {/* Quick Add to Cart on Hover */}
            {!isAskForPrice && product.stockQuantity > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent"
              >
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {addingToCart ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      Quick Add
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>

          {/* Feedback Message */}
          <AnimatePresence>
            {feedback.show && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 z-20"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`p-3 text-white text-sm font-semibold flex items-center justify-center gap-2 ${
                  feedback.type === 'success' ? 'bg-emerald-600' : 
                  feedback.type === 'info' ? 'bg-blue-600' : 'bg-red-600'
                }`}>
                  {feedback.type === 'success' && <Check size={18} />}
                  {feedback.type === 'info' && <Info size={18} />}
                  {feedback.type === 'error' && <AlertCircle size={18} />}
                  {feedback.message}
                </div>
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
  }

  // List View Card
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-shadow">
      <div className="flex gap-6">
        {/* Product Image */}
        <div className="w-48 h-48 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
          <Link to={`/products/${product.slug}`} className="block w-full h-full">
            {primaryImage && (
              <img
                src={primaryImage.url}
                alt={product.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            )}
          </Link>
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <div>
              {product.category?.name && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {product.category.name}
                </p>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {product.title}
              </h3>
              {product.artist?.name && (
                <p className="text-gray-600 mb-3">
                  by <span className="font-medium text-gray-800">{product.artist.name}</span>
                </p>
              )}
            </div>

            {/* Price */}
            <div className="text-right">
              {isAskForPrice ? (
                <span className="text-lg font-bold text-purple-700">
                  Price on Request
                </span>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </div>
                  {hasDiscount && (
                    <div className="text-sm text-gray-500 line-through">
                      {formatCurrency(product.compareAtPrice)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4 line-clamp-2">
            {product.description}
          </p>

          {/* Stats and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Rating */}
              {product.averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-gray-700">
                    {product.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
              
              {/* Stock Status */}
              {!isAskForPrice && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    product.stockQuantity > 10 ? 'bg-emerald-500' : 
                    product.stockQuantity > 0 ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm">
                    {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleQuickView}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="Quick View"
              >
                <Eye size={20} />
              </button>
              
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading || addingToWishlist}
                className={`p-2 transition-colors ${
                  isWishlisted(product._id)
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-600 hover:text-red-500'
                }`}
                title={isWishlisted(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                {addingToWishlist ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Heart size={20} className={isWishlisted(product._id) ? 'fill-current' : ''} />
                )}
              </button>
              
              {!isAskForPrice && product.stockQuantity > 0 && (
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {addingToCart ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} />
                      Add to Cart
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;