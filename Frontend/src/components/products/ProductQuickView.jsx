// components/products/ProductQuickView.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Heart, 
  ShoppingCart, 
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';

const ProductQuickView = ({ product, isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { 
    isWishlisted, 
    addToWishlist, 
    removeFromWishlist 
  } = useWishlist();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const primaryImage = product?.images?.find(img => img.isPrimary) || product?.images?.[0];
  const mainImage = product?.images?.[selectedImage]?.url || primaryImage?.url || 'https://via.placeholder.com/600x600?text=Image+Not+Found';
  
  const hasDiscount = product?.compareAtPrice && product?.compareAtPrice > product?.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isOutOfStock = product?.productType === 'price-based' && product?.stockQuantity <= 0;
  const isAskForPrice = product?.productType === 'ask-for-price';

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImage(0);
    setImageLoaded(false);
  }, [product?._id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      onClose();
      return;
    }

    if (isAskForPrice) {
      toast.success('We will contact you with pricing details');
      onClose();
      return;
    }

    if (isOutOfStock) {
      toast.error('This item is out of stock');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product._id, 1);
      toast.success('Added to cart!', {
        icon: '🛒',
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      return;
    }

    setAddingToWishlist(true);
    try {
      if (isWishlisted(product._id)) {
        await removeFromWishlist(product._id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product._id);
        // Removed the extra toast that was here
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handlePrevImage = () => {
    if (product?.images?.length > 1) {
      setSelectedImage(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
      setImageLoaded(false);
    }
  };

  const handleNextImage = () => {
    if (product?.images?.length > 1) {
      setSelectedImage(prev => (prev === product.images.length - 1 ? 0 : prev + 1));
      setImageLoaded(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 cursor-pointer z-10"
            >
              <X size={20} className="text-gray-800" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-6 md:p-8">
              {/* Image Section */}
              <div className="relative">
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  {/* Loading State */}
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
                      <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                  )}
                  
                  <img
                    src={mainImage}
                    alt={product.title}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600x600?text=Image+Not+Found';
                      setImageLoaded(true);
                    }}
                  />

                  {/* Image Navigation */}
                  {product.images?.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 cursor-pointer"
                      >
                        <ChevronLeft size={20} className="text-gray-800" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 cursor-pointer"
                      >
                        <ChevronRight size={20} className="text-gray-800" />
                      </button>
                      
                      {/* Image Indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {product.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedImage(index);
                              setImageLoaded(false);
                            }}
                            className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
                              selectedImage === index ? 'w-4 bg-gray-900' : 'bg-gray-400 hover:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {product.images?.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto py-2">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedImage(index);
                          setImageLoaded(false);
                        }}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-200 cursor-pointer ${
                          selectedImage === index 
                            ? 'border-gray-900 ring-2 ring-gray-300' 
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`${product.title} view ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedImage === index && (
                          <div className="absolute inset-0 bg-black/20" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Counter */}
                <div className="text-xs text-gray-500 text-center mt-2">
                  Image {selectedImage + 1} of {product.images?.length || 1}
                </div>
              </div>

              {/* Product Details */}
              <div className="flex flex-col">
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h2>
                
                {/* Artist */}
                {product.artist?.name && (
                  <p className="text-lg text-gray-600 mb-4">
                    by <span className="font-semibold text-gray-800">{product.artist.name}</span>
                  </p>
                )}
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.isFeatured && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-gray-900 to-black text-white px-3 py-1 rounded-full text-xs font-bold">
                      <Star size={12} fill="white" />
                      Featured
                    </span>
                  )}
                  {hasDiscount && !isAskForPrice && (
                    <span className="bg-gradient-to-r from-gray-900 to-black text-white px-3 py-1 rounded-full text-xs font-bold">
                      {discountPercentage}% OFF
                    </span>
                  )}
                  {isAskForPrice && (
                    <span className="bg-gradient-to-r from-gray-900 to-black text-white px-3 py-1 rounded-full text-xs font-bold">
                      Price on Request
                    </span>
                  )}
                </div>
                
                {/* Price Section */}
                <div className="mb-6">
                  {isAskForPrice ? (
                    <div className="space-y-2">
                      <div className="text-2xl md:text-3xl font-bold text-gray-900">
                        Price Upon Request
                      </div>
                      <p className="text-gray-600 text-sm">
                        Contact us for pricing information
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl md:text-3xl font-bold text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-lg text-gray-500 line-through">
                            {formatCurrency(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                      {hasDiscount && (
                        <div className="text-sm text-gray-600">
                          You save {formatCurrency(product.compareAtPrice - product.price)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Stock Status */}
                {!isAskForPrice && (
                  <div className="flex items-center gap-2 mb-6">
                    <div className={`w-2 h-2 rounded-full ${
                      product.stockQuantity > 10 ? 'bg-emerald-500' : 
                      product.stockQuantity > 0 ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <span className={`font-medium ${
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
                )}
                
                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed mb-6 line-clamp-4">
                  {product.description || 'No description available.'}
                </p>
                
                {/* Product Details */}
                <div className="space-y-3 mb-6 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {product.category?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">{product.category.name}</span>
                    </div>
                  )}
                  {product.medium && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medium:</span>
                      <span className="font-medium text-gray-900">{product.medium}</span>
                    </div>
                  )}
                  {(product.dimensions?.artwork?.length || product.dimensions?.artwork?.width) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-medium text-gray-900">
                        {product.dimensions.artwork.length || 0}" × {product.dimensions.artwork.width || 0}"
                      </span>
                    </div>
                  )}
                  {product.yearCreated && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium text-gray-900">{product.yearCreated}</span>
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium border border-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="space-y-3 mt-auto">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {!isAskForPrice && (
                      <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || addingToCart}
                        className="flex-1 bg-gradient-to-r from-gray-900 to-black text-white font-semibold py-3 px-6 rounded-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                      >
                        {addingToCart ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={18} />
                            <span>Adding...</span>
                          </>
                        ) : isOutOfStock ? (
                          'Sold Out'
                        ) : (
                          <>
                            <ShoppingCart size={18} className="mr-2" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    )}
                    
                    {isAskForPrice && (
                      <button
                        onClick={() => {
                          // Implement contact form modal
                          toast.success('Contact form will appear here');
                        }}
                        className="flex-1 bg-gradient-to-r from-gray-900 to-black text-white font-semibold py-3 px-6 rounded-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center cursor-pointer"
                      >
                        Request Price Quote
                      </button>
                    )}
                    
                    <button
                      onClick={handleWishlistToggle}
                      disabled={addingToWishlist}
                      className={`flex-1 border font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer ${
                        isWishlisted(product._id)
                          ? 'border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600'
                          : 'border-gray-800 text-gray-800 hover:bg-gray-50 hover:border-gray-900'
                      }`}
                    >
                      {addingToWishlist ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={18} />
                          <span>Processing...</span>
                        </>
                      ) : isWishlisted(product._id) ? (
                        <>
                          <Heart size={18} className="mr-2" fill="currentColor" />
                          Remove from Wishlist
                        </>
                      ) : (
                        <>
                          <Heart size={18} className="mr-2" />
                          Add to Wishlist
                        </>
                      )}
                    </button>
                  </div>

                  {/* View Details Link */}
                  <Link
                    to={`/products/${product.slug}`}
                    onClick={onClose}
                    className="border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer"
                  >
                    <ExternalLink size={18} className="mr-2" />
                    View Full Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductQuickView;