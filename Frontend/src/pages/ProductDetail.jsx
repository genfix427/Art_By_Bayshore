// pages/ProductDetails.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { 
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  Undo2,
  Gift,
  X,
  ChevronLeft,
  ShoppingCart,
  Check,
  MessageCircle,
  Mail,
  Phone,
  User,
  ArrowLeft,
  ArrowRight,
  Maximize2
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

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.1, 0.1, 0],
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
    <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-900">
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
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

const ProductDetails = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Image gallery states
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState(1);
  
  // Ask for Price states
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    message: '',
    budget: '',
    purpose: 'personal'
  });

  // Feedback state
  const [feedback, setFeedback] = useState({ active: false, message: '', type: 'success' });

  // Scroll animations
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Generate floating petals
  const petals = Array.from({ length: 10 }).map((_, i) => ({
    delay: i * 1.5,
    startX: 5 + i * 10,
    duration: 15 + Math.random() * 8,
    size: 12 + Math.random() * 8,
  }));

  // Animation variants
  const textReveal = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" }
    })
  };

  const lineAnimation = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: 1, 
      transition: { duration: 1, ease: "easeInOut" } 
    }
  };

  useSEO({
    title: product ? `${product.title} | Art Haven` : 'Product Details',
    description: product?.description?.substring(0, 160) || 'Art product details',
  });

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    setSelectedImageIndex(0);
    setQuantity(1);
    setImageLoaded(false);
    fetchProductDetails();
  }, [slug]);

  const fetchProductDetails = async () => {
    try {
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

  // Feedback Helper
  const showFeedback = (message, type = 'success') => {
    setFeedback({ active: true, message, type });
    setTimeout(() => {
      setFeedback({ active: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showFeedback('Please login first', 'error');
      return;
    }

    if (product.productType === 'ask-for-price') {
      showFeedback('Please request a price quote', 'error');
      return;
    }

    if (product.stockQuantity <= 0) {
      showFeedback('This item is out of stock', 'error');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product._id, quantity);
      showFeedback('Added to cart');
    } catch (error) {
      showFeedback('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      showFeedback('Please login first', 'error');
      return;
    }

    setAddingToWishlist(true);
    try {
      if (isWishlisted(product._id)) {
        await removeFromWishlist(product._id);
        showFeedback('Removed from wishlist');
      } else {
        await addToWishlist(product._id);
        showFeedback('Added to wishlist');
      }
    } catch (error) {
      showFeedback('Failed to update wishlist', 'error');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleAskForPrice = () => {
    setIsInquiryModalOpen(true);
  };

  const handleInquiryFormChange = (e) => {
    const { name, value } = e.target;
    setInquiryForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    
    if (!inquiryForm.fullName.trim() || !inquiryForm.email.trim() || !inquiryForm.mobile.trim()) {
      showFeedback('Please fill required fields', 'error');
      return;
    }

    setSubmittingInquiry(true);
    try {
      // You can add your API call here for price inquiry
      // await productService.submitPriceInquiry(product._id, inquiryForm);
      showFeedback('Inquiry submitted successfully');
      setIsInquiryModalOpen(false);
      setInquiryForm({
        fullName: '', email: '', mobile: '', message: '', budget: '', purpose: 'personal'
      });
    } catch (err) {
      showFeedback('Failed to submit', 'error');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Image gallery functions
  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const navigateImage = (direction) => {
    const images = product.images || [];
    if (images.length === 0) return;
    
    setSlideDirection(direction === 'next' ? 1 : -1);
    if (direction === 'prev') {
      setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateImage('prev');
      if (e.key === 'ArrowRight') navigateImage('next');
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  // Helper Functions
  const getDiscountPercentage = () => {
    if (product?.compareAtPrice && product?.price && product.price < product.compareAtPrice) {
      return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
    }
    return 0;
  };

  // Lightbox variants
  const lightboxVariants = {
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border border-gray-900/20 flex items-center justify-center"
        >
          <div className="w-8 h-8 border-t border-gray-900" />
        </motion.div>
      </div>
    );
  }

  // Error State
  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 border border-gray-900/10 flex items-center justify-center mx-auto mb-8">
            <FlowerDecor className="w-10 h-10 text-gray-900/20" />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-900/60 mb-8">
            The artwork you're looking for doesn't exist.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-gray-900 font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="relative">
              Back to Collection
              <span className="absolute bottom-0 left-0 w-full h-px bg-gray-900" />
            </span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const images = product.images?.map(img => img.url) || [];
  const discountPercentage = getDiscountPercentage();
  const isSoldOut = product.productType === 'price-based' && product.stockQuantity <= 0;
  const isAskForPrice = product.productType === 'ask-for-price';

  return (
    <div ref={containerRef} className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111827' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={i} {...petal} />
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && images.length > 0 && (
          <motion.div
            className="fixed inset-0 bg-white z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close button */}
            <motion.button
              onClick={closeLightbox}
              className="absolute top-6 right-6 w-12 h-12 border border-gray-900/20 flex items-center justify-center hover:border-gray-900 transition-colors z-20 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
            
            {/* Navigation */}
            {images.length > 1 && (
              <>
                <motion.button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-6 w-12 h-12 border border-gray-900/20 flex items-center justify-center hover:border-gray-900 transition-colors z-20 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  onClick={() => navigateImage('next')}
                  className="absolute right-6 w-12 h-12 border border-gray-900/20 flex items-center justify-center hover:border-gray-900 transition-colors z-20 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </>
            )}

            {/* Image */}
            <AnimatePresence initial={false} custom={slideDirection} mode="wait">
              <motion.div
                key={selectedImageIndex}
                className="max-w-[85vw] max-h-[85vh] relative"
                variants={lightboxVariants}
                custom={slideDirection}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <img
                  src={images[selectedImageIndex]}
                  alt={`${product.title} - ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-[85vh] object-contain"
                />
              </motion.div>
            </AnimatePresence>

            {/* Image counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <span className="text-sm text-gray-900/60">
                {selectedImageIndex + 1} / {images.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ask for Price Modal */}
      <AnimatePresence>
        {isInquiryModalOpen && (
          <motion.div
            className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsInquiryModalOpen(false)}
          >
            <motion.div
              className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-900/10">
                <div>
                  <h3 className="font-playfair text-2xl font-bold text-gray-900">
                    Request Price
                  </h3>
                  <p className="text-sm text-gray-900/50 mt-1">
                    We'll contact you with details
                  </p>
                </div>
                <button
                  onClick={() => setIsInquiryModalOpen(false)}
                  className="w-10 h-10 border border-gray-900/10 flex items-center justify-center hover:border-gray-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitInquiry} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Full Name <span className="text-gray-900/40">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900/30" />
                    <input
                      type="text"
                      name="fullName"
                      value={inquiryForm.fullName}
                      onChange={handleInquiryFormChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email <span className="text-gray-900/40">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900/30" />
                    <input
                      type="email"
                      name="email"
                      value={inquiryForm.email}
                      onChange={handleInquiryFormChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Phone <span className="text-gray-900/40">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900/30" />
                    <input
                      type="tel"
                      name="mobile"
                      value={inquiryForm.mobile}
                      onChange={handleInquiryFormChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                      placeholder="Enter your phone"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Budget Range
                    </label>
                    <input
                      type="text"
                      name="budget"
                      value={inquiryForm.budget}
                      onChange={handleInquiryFormChange}
                      className="w-full px-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                      placeholder="e.g., $500-$1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Purpose
                    </label>
                    <select
                      name="purpose"
                      value={inquiryForm.purpose}
                      onChange={handleInquiryFormChange}
                      className="w-full px-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors bg-white"
                    >
                      <option value="personal">Personal</option>
                      <option value="corporate">Corporate</option>
                      <option value="gift">Gift</option>
                      <option value="investment">Investment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows="3"
                    value={inquiryForm.message}
                    onChange={handleInquiryFormChange}
                    className="w-full px-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors resize-none"
                    placeholder="Any additional details..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-900/10">
                  <button
                    type="button"
                    onClick={() => setIsInquiryModalOpen(false)}
                    className="flex-1 py-3 border border-gray-900/10 text-gray-900 font-medium hover:border-gray-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={submittingInquiry}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingInquiry ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Submit
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback.active && (
          <motion.div
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-2 ${
              feedback.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
            } text-white`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-900/50 mb-8"
        >
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/products" className="hover:text-gray-900 transition-colors">Collection</Link>
          {product.category?.name && (
            <>
              <ChevronRight className="w-4 h-4" />
              <Link 
                to={`/categories/${product.category.slug}`} 
                className="hover:text-gray-900 transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 truncate max-w-[200px]">{product.title}</span>
        </motion.nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image */}
            <div 
              className="relative aspect-[4/5] border border-gray-900/10 bg-white cursor-zoom-in group overflow-hidden"
              onClick={() => images.length > 0 && openLightbox(selectedImageIndex)}
            >
              {/* Loading skeleton */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-white">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              )}

              {images.length > 0 && (
                <motion.img
                  src={images[selectedImageIndex]}
                  alt={product.title}
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-contain transition-all duration-500 group-hover:scale-105 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}

              {/* Zoom icon */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-gray-900/0 group-hover:bg-gray-900/10 transition-colors"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                <div className="w-14 h-14 bg-white border border-gray-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-5 h-5 text-gray-900" />
                </div>
              </motion.div>

              {/* Badges */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {discountPercentage > 0 && !isAskForPrice && (
                  <span className="bg-gray-900 text-white px-3 py-1 text-xs font-medium">
                    {discountPercentage}% OFF
                  </span>
                )}
                {isAskForPrice && (
                  <span className="bg-gray-900 text-white px-3 py-1 text-xs font-medium">
                    Price Upon Request
                  </span>
                )}
                {isSoldOut && (
                  <span className="bg-white text-gray-900 px-3 py-1 text-xs font-medium border border-gray-900">
                    Sold Out
                  </span>
                )}
                {product.isFeatured && (
                  <span className="bg-gray-900 text-white px-3 py-1 text-xs font-medium">
                    Featured
                  </span>
                )}
                {product.isOriginal && (
                  <span className="bg-gray-900 text-white px-3 py-1 text-xs font-medium">
                    Original
                  </span>
                )}
              </div>
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3 mt-4">
                {images.map((image, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`aspect-square border cursor-pointer overflow-hidden transition-all ${
                      selectedImageIndex === index 
                        ? 'border-gray-900' 
                        : 'border-gray-900/10 opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Category & Title */}
            <div>
              <motion.div
                variants={lineAnimation}
                className="w-12 h-px bg-gray-900 mb-6 origin-left"
              />

              <motion.span
                custom={0}
                variants={textReveal}
                className="text-xs tracking-[0.3em] text-gray-900/50 uppercase block mb-3"
              >
                {product.category?.name || 'Artwork'}
              </motion.span>

              <motion.h1
                custom={1}
                variants={textReveal}
                className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
              >
                {product.title}
              </motion.h1>

              {/* Artist */}
              {product.artist && (
                <motion.div custom={2} variants={textReveal}>
                  <Link
                    to={`/artists/${product.artist.slug}`}
                    className="text-lg text-gray-900/60 hover:text-gray-900 transition-colors group"
                  >
                    by{' '}
                    <span className="relative">
                      {product.artist.name}
                      <span className="absolute bottom-0 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-300" />
                    </span>
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Price */}
            <motion.div 
              custom={3}
              variants={textReveal}
              className="py-6 border-y border-gray-900/10"
            >
              {isAskForPrice ? (
                <div>
                  <span className="font-playfair text-3xl font-bold text-gray-900">
                    Price on Request
                  </span>
                  <p className="text-sm text-gray-900/50 mt-2">
                    Contact us for pricing and availability
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline gap-4">
                  <span className="font-playfair text-3xl font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-xl text-gray-900/40 line-through">
                        {formatCurrency(product.compareAtPrice)}
                      </span>
                      <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1">
                        Save {discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Stock status */}
              {!isAskForPrice && (
                <div className="mt-4">
                  <span className={`text-sm ${isSoldOut ? 'text-gray-900/50' : 'text-gray-900/70'}`}>
                    {isSoldOut 
                      ? 'Currently unavailable' 
                      : product.stockQuantity > 10 
                        ? 'In stock' 
                        : `Only ${product.stockQuantity} left`
                    }
                  </span>
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div custom={4} variants={textReveal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {product.medium && (
                  <div>
                    <span className="text-xs tracking-wide text-gray-900/40 uppercase">Medium</span>
                    <p className="text-gray-900 font-medium mt-1">{product.medium}</p>
                  </div>
                )}
                {product.dimensions?.artwork && (
                  <div>
                    <span className="text-xs tracking-wide text-gray-900/40 uppercase">Dimensions</span>
                    <p className="text-gray-900 font-medium mt-1">
                      {product.dimensions.artwork.length}" × {product.dimensions.artwork.width}"
                      {product.dimensions.artwork.height > 0 && ` × ${product.dimensions.artwork.height}"`}
                    </p>
                  </div>
                )}
                {product.yearCreated && (
                  <div>
                    <span className="text-xs tracking-wide text-gray-900/40 uppercase">Year</span>
                    <p className="text-gray-900 font-medium mt-1">{product.yearCreated}</p>
                  </div>
                )}
                {product.isFramed !== undefined && (
                  <div>
                    <span className="text-xs tracking-wide text-gray-900/40 uppercase">Framing</span>
                    <p className="text-gray-900 font-medium mt-1">
                      {product.isFramed ? 'Framed' : 'Unframed'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div custom={5} variants={textReveal}>
              <h3 className="text-xs tracking-wide text-gray-900/40 uppercase mb-3">Description</h3>
              <p className="text-gray-900/70 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </motion.div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <motion.div custom={6} variants={textReveal}>
                <h3 className="text-xs tracking-wide text-gray-900/40 uppercase mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 border border-gray-900/10 text-sm text-gray-900/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div 
              custom={7} 
              variants={textReveal}
              className="pt-6 border-t border-gray-900/10 space-y-4"
            >
              {!isSoldOut && (
                <>
                  {/* Quantity - Only for regular products */}
                  {!isAskForPrice && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-900/60">Quantity</span>
                      <div className="flex items-center border border-gray-900/10">
                        <button
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => setQuantity(prev => Math.min(product.stockQuantity || 10, prev + 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    {isAskForPrice ? (
                      <motion.button
                        onClick={handleAskForPrice}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-gray-900 text-white py-4 font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Request Price
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-gray-900 text-white py-4 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {addingToCart ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                          </>
                        )}
                      </motion.button>
                    )}

                    <motion.button
                      onClick={handleWishlistToggle}
                      disabled={addingToWishlist}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-14 h-14 border flex items-center justify-center transition-all cursor-pointer ${
                        isWishlisted(product._id) 
                          ? 'border-gray-900 bg-gray-900 text-white' 
                          : 'border-gray-900/20 hover:border-gray-900'
                      }`}
                    >
                      {addingToWishlist ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <Heart className={`w-5 h-5 ${isWishlisted(product._id) ? 'fill-white' : ''}`} />
                      )}
                    </motion.button>
                  </div>
                </>
              )}

              {isSoldOut && (
                <div className="text-center py-8 border border-gray-900/10">
                  <p className="text-gray-900/60">This artwork is currently sold out</p>
                  <button
                    onClick={handleWishlistToggle}
                    className="mt-4 text-sm font-medium text-gray-900 underline underline-offset-4 cursor-pointer"
                  >
                    Add to wishlist for updates
                  </button>
                </div>
              )}
            </motion.div>

            {/* Benefits */}
            <motion.div 
              custom={8} 
              variants={textReveal}
              className="space-y-3 pt-6 border-t border-gray-900/10"
            >
              <div className="flex items-center gap-3 text-sm text-gray-900/60">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                <span>Free worldwide shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-900/60">
                <Undo2 className="w-4 h-4" strokeWidth={1.5} />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-900/60">
                <Gift className="w-4 h-4" strokeWidth={1.5} />
                <span>Certificate of authenticity included</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Artist Section */}
        {product.artist && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 pt-16 border-t border-gray-900/10"
          >
            <div className="flex items-center gap-3 mb-8">
              <FlowerDecor className="w-6 h-6 text-gray-900/20" />
              <span className="text-xs tracking-[0.3em] text-gray-900/50 uppercase">The Artist</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {product.artist.profileImage && (
                <div className="lg:col-span-3">
                  <div className="aspect-square border border-gray-900/10 overflow-hidden">
                    <img
                      src={product.artist.profileImage}
                      alt={product.artist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <div className={`${product.artist.profileImage ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
                <h3 className="font-playfair text-3xl font-bold text-gray-900 mb-4">
                  {product.artist.name}
                </h3>
                {product.artist.nationality && (
                  <p className="text-gray-900/50 mb-4">{product.artist.nationality}</p>
                )}
                <p className="text-gray-900/60 leading-relaxed mb-6 line-clamp-3">
                  {product.artist.biography || 'No biography available for this artist.'}
                </p>
                <Link
                  to={`/artists/${product.artist.slug}`}
                  className="inline-flex items-center gap-2 text-gray-900 font-medium group"
                >
                  <span className="relative">
                    View all works by {product.artist.name}
                    <span className="absolute bottom-0 left-0 w-full h-px bg-gray-900" />
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 pt-16 border-t border-gray-900/10"
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="w-16 h-px bg-gray-900 mx-auto mb-6"
              />
              <span className="text-xs tracking-[0.3em] text-gray-900/50 uppercase block mb-3">
                You May Also Like
              </span>
              <h2 className="font-playfair text-3xl font-bold text-gray-900">
                Related Artworks
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={relatedProduct} index={index} />
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-gray-900 font-medium group"
              >
                <span className="relative">
                  Browse Full Collection
                  <span className="absolute bottom-0 left-0 w-full h-px bg-gray-900" />
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.section>
        )}
      </div>

      {/* Bottom decorative line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
        className="w-32 h-px bg-gray-900/10 mx-auto my-16"
      />
    </div>
  );
};

export default ProductDetails;