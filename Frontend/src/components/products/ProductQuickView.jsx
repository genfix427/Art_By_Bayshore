// components/products/ProductQuickView.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Heart, 
  ShoppingCart, 
  Star,
  Tag,
  Share2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  ExternalLink,
  Truck,
  Shield,
  RotateCcw
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
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [imageLoaded, setImageLoaded] = useState({});

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isOutOfStock = product.productType === 'price-based' && product.stockQuantity <= 0;
  const isAskForPrice = product.productType === 'ask-for-price';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleImageLoad = (index) => {
    setImageLoaded(prev => ({ ...prev, [index]: true }));
  };

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
      await addToCart(product._id, quantity);
      toast.success('Added to cart successfully!', {
        icon: '🛒',
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });
      onClose();
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      onClose();
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
      toast.error('Failed to update wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Check out "${product.title}" by ${product.artist?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product.stockQuantity || 10)) {
      setQuantity(newQuantity);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <motion.div
            className="relative bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-colors"
            >
              <X size={24} className="text-gray-800" />
            </button>

            <div className="grid lg:grid-cols-2 h-full">
              {/* Left Column - Images */}
              <div className="relative p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Main Image */}
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
                  {product.images && product.images.length > 0 && (
                    <>
                      {!imageLoaded[selectedImage] && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                      )}
                      <motion.img
                        key={selectedImage}
                        src={product.images[selectedImage]?.url}
                        alt={product.title}
                        className="w-full h-full object-contain p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: imageLoaded[selectedImage] ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        onLoad={() => handleImageLoad(selectedImage)}
                      />
                      
                      {/* Image Navigation */}
                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={() => setSelectedImage(prev => (prev === 0 ? product.images.length - 1 : prev - 1))}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-colors"
                          >
                            <ChevronLeft size={24} className="text-gray-800" />
                          </button>
                          <button
                            onClick={() => setSelectedImage(prev => (prev === product.images.length - 1 ? 0 : prev + 1))}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-colors"
                          >
                            <ChevronRight size={24} className="text-gray-800" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-3 mt-6 overflow-x-auto py-2">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                          selectedImage === index 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`${product.title} view ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Count */}
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {selectedImage + 1} / {product.images?.length || 1}
                </div>

                {/* Zoom Indicator */}
                <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <ZoomIn size={16} />
                  Click to zoom
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="p-8 overflow-y-auto">
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                          {product.title}
                        </h2>
                        <div className="flex items-center gap-3">
                          {product.artist?.name && (
                            <Link
                              to={`/artists/${product.artist.slug}`}
                              className="text-lg text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              by {product.artist.name}
                            </Link>
                          )}
                          {product.averageRating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star size={18} className="fill-amber-400 text-amber-400" />
                              <span className="font-semibold">
                                {product.averageRating.toFixed(1)}
                              </span>
                              <span className="text-gray-500">
                                ({product.reviewsCount || 0} reviews)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleShare}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Share"
                        >
                          <Share2 size={20} />
                        </button>
                        <button
                          onClick={handleWishlistToggle}
                          disabled={addingToWishlist}
                          className={`p-2 transition-colors ${
                            isWishlisted(product._id)
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-gray-600 hover:text-red-500'
                          }`}
                          title={isWishlisted(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                        >
                          {addingToWishlist ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                          ) : (
                            <Heart size={20} className={isWishlisted(product._id) ? 'fill-current' : ''} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {isAskForPrice && (
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                          <Tag size={14} />
                          Price on Request
                        </span>
                      )}
                      {hasDiscount && !isAskForPrice && (
                        <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                          <Tag size={14} />
                          {discountPercentage}% OFF
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                          <Star size={14} fill="white" />
                          Featured
                        </span>
                      )}
                      {product.isOriginal && (
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          Original Artwork
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    {isAskForPrice ? (
                      <div>
                        <div className="text-4xl font-bold text-purple-700 mb-2">
                          Price on Request
                        </div>
                        <p className="text-gray-600">
                          Contact us for pricing information and availability
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-3 mb-2">
                          <span className="text-4xl font-bold text-gray-900">
                            {formatCurrency(product.price)}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-2xl text-gray-500 line-through">
                                {formatCurrency(product.compareAtPrice)}
                              </span>
                              <span className="text-lg font-bold text-red-600">
                                Save {formatCurrency(product.compareAtPrice - product.price)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-2 ${
                            product.stockQuantity > 10 ? 'text-emerald-600' : 
                            product.stockQuantity > 0 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            <div className={`w-3 h-3 rounded-full ${
                              product.stockQuantity > 10 ? 'bg-emerald-500' : 
                              product.stockQuantity > 0 ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            <span className="font-medium">
                              {product.stockQuantity > 10 
                                ? 'In Stock' 
                                : product.stockQuantity > 0 
                                ? `Only ${product.stockQuantity} left` 
                                : 'Out of Stock'}
                            </span>
                          </div>
                          {product.salesCount > 0 && (
                            <span className="text-gray-500">
                              {product.salesCount} sold
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity & Add to Cart */}
                  {!isAskForPrice && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Quantity
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(-1)}
                              disabled={quantity <= 1}
                              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="w-16 text-center text-lg font-semibold">
                              {quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(1)}
                              disabled={quantity >= (product.stockQuantity || 10)}
                              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">Total</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(product.price * quantity)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleAddToCart}
                          disabled={isOutOfStock || addingToCart}
                          className="py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {addingToCart ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Adding...
                            </>
                          ) : isOutOfStock ? (
                            'Out of Stock'
                          ) : (
                            <>
                              <ShoppingCart size={20} />
                              Add to Cart
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            handleAddToCart();
                            onClose();
                          }}
                          disabled={isOutOfStock || addingToCart}
                          className="py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Check size={20} />
                          Buy Now
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tabs */}
                  <div>
                    <div className="border-b border-gray-200">
                      <div className="flex gap-8">
                        <button
                          onClick={() => setActiveTab('description')}
                          className={`pb-3 font-semibold border-b-2 transition-colors ${
                            activeTab === 'description'
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Description
                        </button>
                        <button
                          onClick={() => setActiveTab('details')}
                          className={`pb-3 font-semibold border-b-2 transition-colors ${
                            activeTab === 'details'
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Details
                        </button>
                        <button
                          onClick={() => setActiveTab('shipping')}
                          className={`pb-3 font-semibold border-b-2 transition-colors ${
                            activeTab === 'shipping'
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Shipping
                        </button>
                      </div>
                    </div>

                    <div className="py-6">
                      {activeTab === 'description' && (
                        <p className="text-gray-600 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                      
                      {activeTab === 'details' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">Medium</div>
                              <div className="font-medium">{product.medium || 'Mixed Media'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Year</div>
                              <div className="font-medium">{product.yearCreated || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Dimensions</div>
                              <div className="font-medium">
                                {product.dimensions?.artwork?.length || 0}" × {product.dimensions?.artwork?.width || 0}"
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Weight</div>
                              <div className="font-medium">
                                {product.weight?.value || 0} {product.weight?.unit || 'lbs'}
                              </div>
                            </div>
                          </div>
                          {product.tags && product.tags.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-500 mb-2">Tags</div>
                              <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'shipping' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Truck className="text-blue-600" size={24} />
                            <div>
                              <div className="font-semibold">Free Shipping</div>
                              <div className="text-sm text-gray-600">Free delivery on orders over $100</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <RotateCcw className="text-green-600" size={24} />
                            <div>
                              <div className="font-semibold">30-Day Returns</div>
                              <div className="text-sm text-gray-600">Easy returns within 30 days</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Shield className="text-amber-600" size={24} />
                            <div>
                              <div className="font-semibold">Secure Payment</div>
                              <div className="text-sm text-gray-600">100% secure payment processing</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Full Details */}
                  <div className="pt-6 border-t border-gray-200">
                    <Link
                      to={`/products/${product.slug}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-colors"
                    >
                      View Full Details
                      <ExternalLink size={20} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductQuickView;