// pages/ProductDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Heart, 
  ShoppingCart, 
  Star,
  Tag,
  Share2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Package,
  Calendar,
  Ruler,
  Palette,
  Award,
  Eye,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { productService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';
import { formatCurrency } from '../utils/formatters';

const ProductDetails = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { 
    isWishlisted, 
    addToWishlist, 
    removeFromWishlist 
  } = useWishlist();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [expandedSections, setExpandedSections] = useState({});
  const [imageLoaded, setImageLoaded] = useState({});

  useSEO({
    title: product ? `${product.title} | Art Haven` : 'Product Details',
    description: product?.description?.substring(0, 160) || 'Art product details',
  });

  useEffect(() => {
    fetchProductDetails();
  }, [slug]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const productResponse = await productService.getBySlug(slug);
      setProduct(productResponse.data);
      
      const relatedResponse = await productService.getRelated(productResponse.data._id);
      setRelatedProducts(relatedResponse.data);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleImageLoad = (index) => {
    setImageLoaded(prev => ({ ...prev, [index]: true }));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (product.productType === 'ask-for-price') {
      toast.success('We will contact you with pricing details');
      return;
    }

    if (product.stockQuantity <= 0) {
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
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
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
      toast.error('Failed to update wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = product.title;
    const text = `Check out "${title}" by ${product.artist?.name}`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`);
        break;
      default:
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product.stockQuantity || 10)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isOutOfStock = product.productType === 'price-based' && product.stockQuantity <= 0;
  const isAskForPrice = product.productType === 'ask-for-price';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <ChevronRight size={16} className="mx-2" />
            <Link to="/products" className="hover:text-gray-900 transition-colors">
              Products
            </Link>
            <ChevronRight size={16} className="mx-2" />
            {product.category?.name && (
              <>
                <Link 
                  to={`/categories/${product.category.slug}`}
                  className="hover:text-gray-900 transition-colors"
                >
                  {product.category.name}
                </Link>
                <ChevronRight size={16} className="mx-2" />
              </>
            )}
            <span className="font-semibold text-gray-900 truncate">
              {product.title}
            </span>
          </nav>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
              {product.images && product.images.length > 0 && (
                <>
                  {!imageLoaded[selectedImage] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                  )}
                  <motion.img
                    key={selectedImage}
                    src={product.images[selectedImage]?.url}
                    alt={product.title}
                    className="w-full h-full object-contain p-8"
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
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white shadow-xl transition-colors"
                      >
                        <ChevronLeft size={24} className="text-gray-800" />
                      </button>
                      <button
                        onClick={() => setSelectedImage(prev => (prev === product.images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white shadow-xl transition-colors"
                      >
                        <ChevronRight size={24} className="text-gray-800" />
                      </button>
                    </>
                  )}
                  
                  {/* Zoom Indicator */}
                  <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm text-gray-800 px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                    <ZoomIn size={18} />
                    Click to zoom
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto py-4">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImage === index 
                        ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.title} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedImage === index && (
                      <div className="absolute inset-0 bg-blue-500/20" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Image Count */}
            <div className="text-center text-sm text-gray-500 mt-2">
              Image {selectedImage + 1} of {product.images?.length || 1}
            </div>
          </div>

          {/* Right Column - Details */}
          <div>
            {/* Product Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {product.title}
                  </h1>
                  <div className="flex items-center gap-4">
                    {product.artist && (
                      <Link
                        to={`/artists/${product.artist.slug}`}
                        className="text-lg text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                      >
                        <Palette size={18} />
                        by {product.artist.name}
                      </Link>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye size={18} className="text-gray-400" />
                      <span className="text-gray-500">{product.viewsCount || 0} views</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare('copy')}
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
              <div className="flex flex-wrap gap-2 mb-6">
                {isAskForPrice && (
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    <Tag size={16} />
                    Price on Request
                  </span>
                )}
                {hasDiscount && !isAskForPrice && (
                  <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    <Tag size={16} />
                    {discountPercentage}% OFF
                  </span>
                )}
                {product.isFeatured && (
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    <Star size={16} fill="white" />
                    Featured
                  </span>
                )}
                {product.isOriginal && (
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full font-bold">
                    Original Artwork
                  </span>
                )}
                {product.isFramed && (
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full font-bold">
                    Framed
                  </span>
                )}
              </div>

              {/* Rating */}
              {product.averageRating > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${
                          i < Math.floor(product.averageRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-gray-300 text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">
                    {product.averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({product.reviewsCount || 0} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
              {isAskForPrice ? (
                <div>
                  <div className="text-5xl font-bold text-purple-700 mb-3">
                    Price on Request
                  </div>
                  <p className="text-gray-600 mb-4">
                    Contact us for pricing information and availability. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      // Implement contact form modal
                      toast.success('Contact form will appear here');
                    }}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200"
                  >
                    Request Price Quote
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="text-5xl font-bold text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-3xl text-gray-500 line-through">
                          {formatCurrency(product.compareAtPrice)}
                        </span>
                        <span className="text-xl font-bold text-red-600">
                          Save {formatCurrency(product.compareAtPrice - product.price)}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Stock Status */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`flex items-center gap-2 ${
                      product.stockQuantity > 10 ? 'text-emerald-600' : 
                      product.stockQuantity > 0 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      <div className={`w-4 h-4 rounded-full ${
                        product.stockQuantity > 10 ? 'bg-emerald-500' : 
                        product.stockQuantity > 0 ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium text-lg">
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

                  {/* Quantity & Add to Cart */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quantity
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="w-12 h-12 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center text-xl"
                          >
                            -
                          </button>
                          <span className="w-20 text-center text-2xl font-bold">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= (product.stockQuantity || 10)}
                            className="w-12 h-12 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center text-xl"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Total</div>
                        <div className="text-3xl font-bold text-gray-900">
                          {formatCurrency(product.price * quantity)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || addingToCart}
                        className="py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                      >
                        {addingToCart ? (
                          <>
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Adding...
                          </>
                        ) : isOutOfStock ? (
                          'Out of Stock'
                        ) : (
                          <>
                            <ShoppingCart size={24} />
                            Add to Cart
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          handleAddToCart();
                          // Redirect to checkout or show checkout modal
                        }}
                        disabled={isOutOfStock || addingToCart}
                        className="py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                      >
                        <Check size={24} />
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping & Guarantee */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold">Free Shipping</div>
                <div className="text-sm text-gray-600">Over $100</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                <RotateCcw className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold">30-Day Returns</div>
                <div className="text-sm text-gray-600">Easy returns</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                <Shield className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <div className="font-semibold">Secure Payment</div>
                <div className="text-sm text-gray-600">100% secure</div>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="mb-8">
              <div className="text-sm font-semibold text-gray-700 mb-3">Share this artwork:</div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleShare('facebook')}
                  className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                  title="Share on Facebook"
                >
                  <Facebook size={20} />
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-3 bg-blue-50 text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                  title="Share on Twitter"
                >
                  <Twitter size={20} />
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="p-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors"
                  title="Share on WhatsApp"
                >
                  <span className="text-lg font-semibold">WA</span>
                </button>
                <button
                  onClick={() => handleShare('email')}
                  className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  title="Share via Email"
                >
                  <Mail size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <div className="flex gap-8 overflow-x-auto">
              {['description', 'details', 'artist', 'shipping', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 font-semibold text-lg border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            {/* Description Tab */}
            {activeTab === 'description' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-lg max-w-none"
              >
                <p className="text-gray-700 leading-relaxed text-lg">
                  {product.description}
                </p>
                
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-8">
                    <div className="text-sm font-semibold text-gray-700 mb-3">Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Accordion Sections */}
                {[
                  {
                    title: 'Artwork Details',
                    icon: <Palette size={20} />,
                    content: (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Medium</div>
                          <div className="font-medium">{product.medium || 'Mixed Media'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Year Created</div>
                          <div className="font-medium">{product.yearCreated || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Originality</div>
                          <div className="font-medium">
                            {product.isOriginal ? 'Original Artwork' : 'Reproduction'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Edition</div>
                          <div className="font-medium">
                            {product.edition?.total 
                              ? `${product.edition.available || 0} of ${product.edition.total} available`
                              : 'Unique'
                            }
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Dimensions & Weight',
                    icon: <Ruler size={20} />,
                    content: (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Artwork Dimensions</div>
                          <div className="font-medium">
                            {product.dimensions?.artwork?.length || 0}" × {product.dimensions?.artwork?.width || 0}" × {product.dimensions?.artwork?.height || 0}"
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Frame Dimensions</div>
                          <div className="font-medium">
                            {product.isFramed && product.dimensions?.frame
                              ? `${product.dimensions.frame.length}" × ${product.dimensions.frame.width}" × ${product.dimensions.frame.height}"`
                              : 'Not framed'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Weight</div>
                          <div className="font-medium">
                            {product.weight?.value || 0} {product.weight?.unit || 'lbs'}
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Condition & Care',
                    icon: <Award size={20} />,
                    content: (
                      <div className="space-y-3">
                        <p className="text-gray-700">
                          This artwork is in excellent condition and has been professionally prepared for display.
                        </p>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2">
                            <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Keep away from direct sunlight and moisture</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Clean with dry, soft cloth only</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Professional framing recommended</span>
                          </li>
                        </ul>
                      </div>
                    )
                  }
                ].map((section, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(`details-${index}`)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {section.icon}
                        <span className="text-lg font-semibold text-gray-900">
                          {section.title}
                        </span>
                      </div>
                      {expandedSections[`details-${index}`] ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </button>
                    {expandedSections[`details-${index}`] && (
                      <div className="p-6 pt-0 border-t border-gray-200">
                        {section.content}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Artist Tab */}
            {activeTab === 'artist' && product.artist && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black flex-shrink-0">
                      {product.artist.profileImage ? (
                        <img
                          src={product.artist.profileImage}
                          alt={product.artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Palette className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {product.artist.name}
                      </h3>
                      {product.artist.nationality && (
                        <div className="text-gray-600 mb-3">
                          {product.artist.nationality}
                        </div>
                      )}
                      {product.artist.biography && (
                        <p className="text-gray-700 leading-relaxed">
                          {product.artist.biography}
                        </p>
                      )}
                      <Link
                        to={`/artists/${product.artist.slug}`}
                        className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        View artist profile
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Shipping Tab */}
            {activeTab === 'shipping' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {[
                  {
                    title: 'Shipping Information',
                    icon: <Truck size={24} />,
                    content: (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Shipping Method</div>
                            <div className="font-medium">Professional Art Shipping</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Delivery Time</div>
                            <div className="font-medium">7-14 business days</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Shipping Cost</div>
                            <div className="font-medium">
                              {product.price > 100 ? 'FREE' : formatCurrency(25)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Package Type</div>
                            <div className="font-medium">Professional Art Crate</div>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Returns & Warranty',
                    icon: <RotateCcw size={24} />,
                    content: (
                      <div className="space-y-3">
                        <p className="text-gray-700">
                          We offer a 30-day return policy for all artworks. If you're not completely satisfied with your purchase, you can return it for a full refund.
                        </p>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2">
                            <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>30-day return policy</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Free return shipping for damaged items</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Lifetime authenticity guarantee</span>
                          </li>
                        </ul>
                      </div>
                    )
                  }
                ].map((section, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(`shipping-${index}`)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {section.icon}
                        <span className="text-lg font-semibold text-gray-900">
                          {section.title}
                        </span>
                      </div>
                      {expandedSections[`shipping-${index}`] ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </button>
                    {expandedSections[`shipping-${index}`] && (
                      <div className="p-6 pt-0 border-t border-gray-200">
                        {section.content}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                    <Star className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {product.reviewsCount || 0} Reviews
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {product.reviewsCount > 0 
                      ? `Average rating: ${product.averageRating.toFixed(1)}/5` 
                      : 'No reviews yet. Be the first to review this artwork!'}
                  </p>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Please login to write a review');
                      } else {
                        // Implement review modal
                        toast.success('Review form will appear here');
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Write a Review
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Related Artworks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <ProductCard
                  key={relatedProduct._id}
                  product={relatedProduct}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;