// components/products/ProductQuickView.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Heart, 
  ShoppingCart, 
  ChevronLeft,
  ChevronRight,
  Loader2
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
        toast.success('Added to wishlist!', {
          icon: '❤️',
          style: {
            borderRadius: '10px',
            background: '#ef4444',
            color: '#fff',
          },
        });
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
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg z-10 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-6 md:p-8">
              {/* Image Section */}
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                {/* Loading State */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
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
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronRight size={20} />
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
                          className={`w-2 h-2 rounded-full transition-colors ${
                            selectedImage === index ? 'bg-emerald-600' : 'bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Product Details */}
              <div className="flex flex-col">
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h2>
                
                {/* Artist */}
                {product.artist?.name && (
                  <p className="text-xl md:text-2xl text-emerald-700 mb-4 italic">
                    by {product.artist.name}
                  </p>
                )}
                
                {/* Price Section */}
                <div className="mb-4">
                  {isAskForPrice ? (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl md:text-3xl font-bold text-purple-700">
                        Price on Request
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline space-x-2 mb-2 flex-wrap">
                      <span className="text-2xl md:text-3xl font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </span>
                      {discountPercentage > 0 && (
                        <>
                          <span className="text-lg md:text-xl text-gray-400 line-through">
                            {formatCurrency(product.compareAtPrice)}
                          </span>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-bold">
                            {discountPercentage}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed mb-6 line-clamp-4">
                  {product.description || 'No description available.'}
                </p>
                
                {/* Product Details */}
                <div className="space-y-3 mb-6 text-sm">
                  {product.category?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{product.category.name}</span>
                    </div>
                  )}
                  {product.medium && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medium:</span>
                      <span className="font-medium">{product.medium}</span>
                    </div>
                  )}
                  {(product.dimensions?.artwork?.length || product.dimensions?.artwork?.width) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-medium">
                        {product.dimensions.artwork.length || 0}" × {product.dimensions.artwork.width || 0}"
                      </span>
                    </div>
                  )}
                  {!isAskForPrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stock:</span>
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
                  {isAskForPrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pricing:</span>
                      <span className="font-medium text-purple-700">Available on Request</span>
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  {!isAskForPrice && (
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || addingToCart}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                    <Link
                      to={`/contact?product=${product.slug}`}
                      onClick={onClose}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                      Inquire About Price
                    </Link>
                  )}
                  
                  <button
                    onClick={handleWishlistToggle}
                    disabled={addingToWishlist}
                    className={`flex-1 border font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center ${
                      isWishlisted(product._id)
                        ? 'border-red-500 text-red-600 hover:bg-red-50'
                        : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
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
                  className="mt-4 text-center border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductQuickView;