// pages/ProductDetails.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  Maximize2,
  Truck,
  Award,
  Eye
} from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { inquiryService, productService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';
import { formatCurrency } from '../utils/formatters';

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
      opacity: [0, 0.12, 0.12, 0],
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
      opacity: [0, 0.1, 0.1, 0],
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
      opacity: [0, 0.08, 0.08, 0],
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

const ProductDetails = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [artistProducts, setArtistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingArtistProducts, setLoadingArtistProducts] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState(1);

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

  const [feedback, setFeedback] = useState({ active: false, message: '', type: 'success' });

  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.6]);

  // Generate floating petals
  const petals = Array.from({ length: 10 }).map((_, i) => ({
    delay: i * 2,
    startX: 5 + i * 10,
    duration: 18 + Math.random() * 10,
    size: 10 + Math.random() * 6,
  }));

  // Generate floating shapes
  const shapes = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2.5,
    startX: 8 + i * 12,
    duration: 22 + Math.random() * 10,
    type: ['circle', 'square', 'triangle'][i % 3],
  }));

  // Generate pulsing dots
  const dots = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 1.5,
    position: {
      top: `${15 + i * 15}%`,
      left: i % 2 === 0 ? '3%' : '97%',
    },
    size: 6 + Math.random() * 6,
  }));

  // Generate animated lines
  const lines = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 3,
    vertical: i % 2 === 0,
    position: {
      top: `${20 + i * 20}%`,
      [i % 2 === 0 ? 'right' : 'left']: '8%',
    },
  }));

  const textReveal = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
    })
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
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
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchProductDetails = async () => {
    try {
      const productResponse = await productService.getBySlug(slug);
      setProduct(productResponse.data);

      if (productResponse.data.artist?._id) {
        setLoadingArtistProducts(true);
        try {
          const artistProductsResponse = await productService.getAll({
            artist: productResponse.data.artist._id,
            isActive: true,
            limit: 8,
          });
          const filteredArtistProducts = artistProductsResponse.data.filter(
            p => p._id !== productResponse.data._id
          );
          setArtistProducts(filteredArtistProducts);
        } catch (error) {
          console.error('Error fetching artist products:', error);
        } finally {
          setLoadingArtistProducts(false);
        }
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

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
      showFeedback('Added to cart successfully');
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

  const handleAskForPrice = () => setIsInquiryModalOpen(true);

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
      const nameParts = inquiryForm.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];
      const inquiryData = {
        productId: product._id,
        firstName,
        lastName,
        email: inquiryForm.email,
        phoneNumber: inquiryForm.mobile,
        message: inquiryForm.message || `Interested in ${product.title}. Budget: ${inquiryForm.budget || 'Not specified'}. Purpose: ${inquiryForm.purpose}`
      };
      const response = await inquiryService.create(inquiryData);
      if (response.success) {
        showFeedback('Inquiry submitted successfully!');
        setIsInquiryModalOpen(false);
        setInquiryForm({ fullName: '', email: '', mobile: '', message: '', budget: '', purpose: 'personal' });
      } else {
        showFeedback(response.message || 'Failed to submit inquiry', 'error');
      }
    } catch (error) {
      showFeedback(error.message || 'Failed to submit inquiry', 'error');
    } finally {
      setSubmittingInquiry(false);
    }
  };

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

  const getDiscountPercentage = () => {
    if (product?.compareAtPrice && product?.price && product.price < product.compareAtPrice) {
      return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
    }
    return 0;
  };

  // Loading State
  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ backgroundColor: theme.white }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-12 h-12" color={`${theme.primary}40`} />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-sm tracking-[0.2em] uppercase"
          style={{ color: `${theme.secondary}80` }}
        >
          Loading Artwork
        </motion.p>
      </div>
    );
  }

  // Error State
  if (!product) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-6"
        style={{ backgroundColor: theme.white }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border"
            style={{ borderColor: `${theme.primary}30` }}
          >
            <FlowerDecor className="w-10 h-10" color={`${theme.primary}40`} />
          </div>
          <h2 
            className="font-playfair text-4xl font-bold mb-4"
            style={{ color: theme.primary }}
          >
            Artwork Not Found
          </h2>
          <p 
            className="mb-10 leading-relaxed"
            style={{ color: `${theme.secondary}99` }}
          >
            The artwork you're looking for may have been moved or is no longer available.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-3 px-8 py-4 transition-colors group"
            style={{ backgroundColor: theme.primary, color: theme.white }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.secondary}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Collection
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
    <div 
      ref={containerRef} 
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: theme.white }}
    >
      {/* Subtle Background Pattern */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234169E1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
      </div>

      {/* Floating Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {shapes.map((shape, i) => (
          <FloatingShape key={`shape-${i}`} {...shape} />
        ))}
      </div>

      {/* Pulsing Dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {dots.map((dot, i) => (
          <PulsingDot key={`dot-${i}`} {...dot} />
        ))}
      </div>

      {/* Animated Lines */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {lines.map((line, i) => (
          <AnimatedLine key={`line-${i}`} {...line} />
        ))}
      </div>

      {/* Decorative Circles */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="fixed top-20 right-20 w-72 h-72 rounded-full border hidden lg:block pointer-events-none"
        style={{ borderColor: theme.primary }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="fixed bottom-32 left-20 w-56 h-56 rounded-full border hidden lg:block pointer-events-none"
        style={{ borderColor: theme.accent }}
      />

      {/* ===== LIGHTBOX MODAL ===== */}
      <AnimatePresence>
        {isLightboxOpen && images.length > 0 && (
          <motion.div
            className="fixed inset-0 backdrop-blur-xl z-50 flex items-center justify-center"
            style={{ backgroundColor: `${theme.black}e6` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              onClick={closeLightbox}
              className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors z-20 cursor-pointer"
              style={{ backgroundColor: `${theme.white}15` }}
              whileHover={{ scale: 1.1, backgroundColor: `${theme.white}25` }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" style={{ color: theme.white }} />
            </motion.button>

            {images.length > 1 && (
              <>
                <motion.button
                  onClick={() => navigateImage('prev')}
                  className="hidden md:flex absolute left-4 lg:left-8 w-14 h-14 rounded-full backdrop-blur-sm items-center justify-center transition-colors z-20 cursor-pointer"
                  style={{ backgroundColor: `${theme.white}15` }}
                  whileHover={{ scale: 1.1, backgroundColor: `${theme.white}25` }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-6 h-6" style={{ color: theme.white }} />
                </motion.button>
                <motion.button
                  onClick={() => navigateImage('next')}
                  className="hidden md:flex absolute right-4 lg:right-8 w-14 h-14 rounded-full backdrop-blur-sm items-center justify-center transition-colors z-20 cursor-pointer"
                  style={{ backgroundColor: `${theme.white}15` }}
                  whileHover={{ scale: 1.1, backgroundColor: `${theme.white}25` }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-6 h-6" style={{ color: theme.white }} />
                </motion.button>
              </>
            )}

            <div className="relative max-w-[90vw] max-h-[85vh] overflow-hidden touch-none">
              <AnimatePresence initial={false} custom={slideDirection} mode="wait">
                <motion.img
                  key={selectedImageIndex}
                  src={images[selectedImageIndex]}
                  alt={`${product.title} - ${selectedImageIndex + 1}`}
                  custom={slideDirection}
                  variants={{
                    enter: (d) => ({ x: d > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
                    center: { x: 0, opacity: 1, scale: 1 },
                    exit: (d) => ({ x: d < 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                  drag={images.length > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(event, info) => {
                    if (info.offset.x > 50) navigateImage('prev');
                    else if (info.offset.x < -50) navigateImage('next');
                  }}
                  className="max-w-full max-h-[85vh] object-contain cursor-grab active:cursor-grabbing select-none"
                />
              </AnimatePresence>
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className="transition-all duration-300 rounded-full cursor-pointer"
                    style={{
                      width: selectedImageIndex === idx ? 32 : 8,
                      height: 8,
                      backgroundColor: selectedImageIndex === idx ? theme.white : `${theme.white}60`
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== INQUIRY MODAL ===== */}
      <AnimatePresence>
        {isInquiryModalOpen && (
          <motion.div
            className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: `${theme.black}60` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsInquiryModalOpen(false)}
          >
            <motion.div
              className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              style={{ backgroundColor: theme.white }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 
                      className="font-playfair text-2xl font-bold"
                      style={{ color: theme.primary }}
                    >
                      Request Price
                    </h3>
                    <p 
                      className="text-sm mt-1"
                      style={{ color: `${theme.secondary}80` }}
                    >
                      We'll get back to you within 24 hours
                    </p>
                  </div>
                  <button
                    onClick={() => setIsInquiryModalOpen(false)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ backgroundColor: `${theme.accent}30` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}50`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}30`}
                  >
                    <X className="w-4 h-4" style={{ color: theme.secondary }} />
                  </button>
                </div>

                {/* Product mini preview */}
                <div 
                  className="flex items-center gap-4 p-4 rounded-xl mb-6"
                  style={{ backgroundColor: `${theme.accent}20` }}
                >
                  {images[0] && (
                    <img src={images[0]} alt={product.title} className="w-16 h-16 object-cover rounded-lg" />
                  )}
                  <div>
                    <p 
                      className="font-medium text-sm"
                      style={{ color: theme.secondary }}
                    >
                      {product.title}
                    </p>
                    {product.artist && (
                      <p 
                        className="text-xs"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        by {product.artist.name}
                      </p>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: theme.secondary }}
                    >
                      Full Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div className="relative">
                      <User 
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: `${theme.primary}50` }}
                      />
                      <input
                        type="text"
                        name="fullName"
                        value={inquiryForm.fullName}
                        onChange={handleInquiryFormChange}
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all"
                        style={{ 
                          backgroundColor: `${theme.accent}15`,
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: `${theme.primary}20`,
                          color: theme.secondary
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = theme.primary;
                          e.target.style.backgroundColor = theme.white;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = `${theme.primary}20`;
                          e.target.style.backgroundColor = `${theme.accent}15`;
                        }}
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: theme.secondary }}
                    >
                      Email <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div className="relative">
                      <Mail 
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: `${theme.primary}50` }}
                      />
                      <input
                        type="email"
                        name="email"
                        value={inquiryForm.email}
                        onChange={handleInquiryFormChange}
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all"
                        style={{ 
                          backgroundColor: `${theme.accent}15`,
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: `${theme.primary}20`,
                          color: theme.secondary
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = theme.primary;
                          e.target.style.backgroundColor = theme.white;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = `${theme.primary}20`;
                          e.target.style.backgroundColor = `${theme.accent}15`;
                        }}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: theme.secondary }}
                    >
                      Phone <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div className="relative">
                      <Phone 
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: `${theme.primary}50` }}
                      />
                      <input
                        type="tel"
                        name="mobile"
                        value={inquiryForm.mobile}
                        onChange={handleInquiryFormChange}
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all"
                        style={{ 
                          backgroundColor: `${theme.accent}15`,
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: `${theme.primary}20`,
                          color: theme.secondary
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = theme.primary;
                          e.target.style.backgroundColor = theme.white;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = `${theme.primary}20`;
                          e.target.style.backgroundColor = `${theme.accent}15`;
                        }}
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label 
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: theme.secondary }}
                      >
                        Budget
                      </label>
                      <input
                        type="text"
                        name="budget"
                        value={inquiryForm.budget}
                        onChange={handleInquiryFormChange}
                        className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                        style={{ 
                          backgroundColor: `${theme.accent}15`,
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: `${theme.primary}20`,
                          color: theme.secondary
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = theme.primary;
                          e.target.style.backgroundColor = theme.white;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = `${theme.primary}20`;
                          e.target.style.backgroundColor = `${theme.accent}15`;
                        }}
                        placeholder="e.g., $500-$1000"
                      />
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: theme.secondary }}
                      >
                        Purpose
                      </label>
                      <select
                        name="purpose"
                        value={inquiryForm.purpose}
                        onChange={handleInquiryFormChange}
                        className="w-full px-4 py-3 rounded-xl outline-none transition-all cursor-pointer"
                        style={{ 
                          backgroundColor: `${theme.accent}15`,
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: `${theme.primary}20`,
                          color: theme.secondary
                        }}
                      >
                        <option value="personal">Personal</option>
                        <option value="corporate">Corporate</option>
                        <option value="gift">Gift</option>
                        <option value="investment">Investment</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: theme.secondary }}
                    >
                      Message
                    </label>
                    <textarea
                      name="message"
                      rows="3"
                      value={inquiryForm.message}
                      onChange={handleInquiryFormChange}
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
                      style={{ 
                        backgroundColor: `${theme.accent}15`,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: `${theme.primary}20`,
                        color: theme.secondary
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme.primary;
                        e.target.style.backgroundColor = theme.white;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = `${theme.primary}20`;
                        e.target.style.backgroundColor = `${theme.accent}15`;
                      }}
                      placeholder="Tell us about your interest..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsInquiryModalOpen(false)}
                      className="flex-1 py-3.5 font-medium rounded-xl transition-colors cursor-pointer border"
                      style={{ 
                        borderColor: `${theme.primary}30`,
                        color: theme.secondary
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = `${theme.accent}20`}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={submittingInquiry}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3.5 font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      style={{ backgroundColor: theme.primary, color: theme.white }}
                      onMouseEnter={(e) => {
                        if (!submittingInquiry) e.target.style.backgroundColor = theme.secondary;
                      }}
                      onMouseLeave={(e) => {
                        if (!submittingInquiry) e.target.style.backgroundColor = theme.primary;
                      }}
                    >
                      {submittingInquiry ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          Submit Inquiry
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== FEEDBACK TOAST ===== */}
      <AnimatePresence>
        {feedback.active && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-full flex items-center gap-2.5 shadow-xl"
            style={{ 
              backgroundColor: feedback.type === 'error' ? '#EF4444' : theme.primary,
              color: theme.white
            }}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
          >
            {feedback.type === 'error' ? (
              <X className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HERO IMAGE SECTION ===== */}
      <section ref={heroRef} className="relative">
        <div className="px-4 sm:px-6 pt-6 sm:pt-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Main Image Frame */}
            <div
              className="relative mx-auto cursor-zoom-in group"
              style={{ maxWidth: '1200px' }}
              onClick={() => images.length > 0 && openLightbox(selectedImageIndex)}
            >
              {/* Decorative frame shadow */}
              <div 
                className="absolute -inset-3 sm:-inset-5 rounded-sm -z-10"
                style={{ backgroundColor: `${theme.accent}20` }}
              />
              <div 
                className="absolute -inset-1.5 sm:-inset-3 shadow-sm rounded-sm -z-5"
                style={{ backgroundColor: theme.white }}
              />

              {/* Image container */}
              <motion.div
                className="relative overflow-hidden"
                style={{ scale: imageScale, backgroundColor: `${theme.accent}10` }}
              >
                {/* Loading skeleton */}
                {!imageLoaded && (
                  <div 
                    className="absolute inset-0"
                    style={{ backgroundColor: `${theme.accent}10` }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      style={{ 
                        background: `linear-gradient(90deg, transparent, ${theme.white}80, transparent)` 
                      }}
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      >
                        <FlowerDecor className="w-8 h-8" color={`${theme.primary}30`} />
                      </motion.div>
                    </div>
                  </div>
                )}

                {images.length > 0 && (
                  <motion.img
                    src={images[selectedImageIndex]}
                    alt={product.title}
                    onLoad={() => setImageLoaded(true)}
                    className={`w-full h-full object-contain transition-all duration-700 group-hover:scale-[1.03] ${imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                  />
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500 flex items-center justify-center">
                  <motion.div
                    className="w-16 h-16 rounded-full backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                    style={{ backgroundColor: `${theme.white}e6` }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Eye className="w-6 h-6" style={{ color: theme.primary }} />
                  </motion.div>
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discountPercentage > 0 && (
                    <motion.span
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-white text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {discountPercentage}% OFF
                    </motion.span>
                  )}
                  {isSoldOut && (
                    <motion.span
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-white text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: '#EF4444' }}
                    >
                      SOLD
                    </motion.span>
                  )}
                </div>

                {/* Wishlist button on image */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlistToggle();
                  }}
                  disabled={addingToWishlist}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg"
                  style={{
                    backgroundColor: isWishlisted(product._id) ? '#EF4444' : `${theme.white}e6`,
                    color: isWishlisted(product._id) ? theme.white : theme.secondary
                  }}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted(product._id) ? 'fill-white' : ''}`} />
                </motion.button>
              </motion.div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center gap-3 mt-6"
              >
                {images.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-300"
                    style={{
                      boxShadow: selectedImageIndex === index ? `0 0 0 2px ${theme.primary}` : 'none',
                      opacity: selectedImageIndex === index ? 1 : 0.6,
                      borderWidth: selectedImageIndex === index ? 0 : 1,
                      borderStyle: 'solid',
                      borderColor: `${theme.primary}30`
                    }}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ===== PRODUCT INFO SECTION ===== */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Title & Artist - Centered */}
          <motion.div custom={0} variants={textReveal} className="text-center mb-8">
            {/* Category tag */}
            {product.category && (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block text-xs tracking-[0.25em] uppercase mb-4"
                style={{ color: theme.primary }}
              >
                {typeof product.category === 'object' ? product.category.name : product.category}
              </motion.span>
            )}

            <h1 
              className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4"
              style={{ color: theme.primary }}
            >
              {product.title}
            </h1>

            {product.artist && (
              <Link
                to={`/artists/${product.artist.slug}`}
                className="inline-flex items-center gap-2 text-lg transition-colors group"
                style={{ color: `${theme.secondary}99` }}
              >
                {product.artist.profileImage && (
                  <img
                    src={product.artist.profileImage}
                    alt={product.artist.name}
                    className="w-8 h-8 rounded-full object-cover ring-2"
                    style={{ ringColor: `${theme.accent}50` }}
                  />
                )}
                <span>
                  by{' '}
                  <span 
                    className="relative font-medium"
                    style={{ color: theme.secondary }}
                  >
                    {product.artist.name}
                    <span 
                      className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                      style={{ backgroundColor: theme.primary }}
                    />
                  </span>
                </span>
              </Link>
            )}
          </motion.div>

          {/* Decorative divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="flex items-center justify-center gap-4 mb-10"
          >
            <div 
              className="h-px w-16"
              style={{ backgroundColor: `${theme.primary}30` }}
            />
            <FlowerDecor className="w-5 h-5" color={`${theme.primary}40`} />
            <div 
              className="h-px w-16"
              style={{ backgroundColor: `${theme.primary}30` }}
            />
          </motion.div>

          {/* Price Section - Centered */}
          <motion.div custom={1} variants={textReveal} className="text-center mb-10">
            {isAskForPrice ? (
              <div>
                <span 
                  className="font-playfair text-3xl sm:text-4xl font-bold"
                  style={{ color: theme.secondary }}
                >
                  Price Upon Request
                </span>
                <p 
                  className="text-sm mt-2"
                  style={{ color: `${theme.secondary}80` }}
                >
                  This is an exclusive piece — contact us for pricing
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-3 flex-wrap justify-center">
                  <span 
                    className="font-playfair text-4xl sm:text-5xl font-bold"
                    style={{ color: theme.secondary }}
                  >
                    {formatCurrency(product.price)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span 
                        className="text-xl line-through"
                        style={{ color: `${theme.secondary}50` }}
                      >
                        {formatCurrency(product.compareAtPrice)}
                      </span>
                      <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        Save {discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
                {/* Stock badge */}
                <div className="mt-3">
                  {isSoldOut ? (
                    <span className="text-sm font-medium" style={{ color: '#EF4444' }}>Currently Unavailable</span>
                  ) : product.stockQuantity <= 5 ? (
                    <span className="text-sm text-amber-600 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      Only {product.stockQuantity} left in stock
                    </span>
                  ) : (
                    <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      In Stock
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Action Buttons - Centered */}
          <motion.div custom={2} variants={textReveal} className="max-w-md mx-auto mb-14">
            {!isSoldOut ? (
              <div className="space-y-4">
                {/* Quantity selector */}
                {!isAskForPrice && (
                  <div className="flex items-center justify-center gap-4">
                    <span 
                      className="text-sm"
                      style={{ color: `${theme.secondary}80` }}
                    >
                      Qty
                    </span>
                    <div 
                      className="flex items-center rounded-full"
                      style={{ backgroundColor: `${theme.accent}30` }}
                    >
                      <button
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                        style={{ color: theme.secondary }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}50`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span 
                        className="w-10 text-center font-semibold"
                        style={{ color: theme.secondary }}
                      >
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(prev => Math.min(product.stockQuantity || 10, prev + 1))}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                        style={{ color: theme.secondary }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}50`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Main CTA */}
                {isAskForPrice ? (
                  <motion.button
                    onClick={handleAskForPrice}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 sm:py-5 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg"
                    style={{ 
                      backgroundColor: theme.primary, 
                      color: theme.white,
                      boxShadow: `0 10px 30px ${theme.primary}30`
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
                    onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Request Price Quote
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 sm:py-5 rounded-2xl font-semibold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer shadow-lg"
                    style={{ 
                      backgroundColor: theme.primary, 
                      color: theme.white,
                      boxShadow: `0 10px 30px ${theme.primary}30`
                    }}
                    onMouseEnter={(e) => {
                      if (!addingToCart) e.target.style.backgroundColor = theme.secondary;
                    }}
                    onMouseLeave={(e) => {
                      if (!addingToCart) e.target.style.backgroundColor = theme.primary;
                    }}
                  >
                    {addingToCart ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 rounded-full"
                        style={{ 
                          borderColor: `${theme.white}30`,
                          borderTopColor: theme.white
                        }}
                      />
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                        {!isAskForPrice && (
                          <span style={{ color: `${theme.white}99` }} className="ml-1">
                            · {formatCurrency(product.price * quantity)}
                          </span>
                        )}
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            ) : (
              <div 
                className="text-center py-8 rounded-2xl border"
                style={{ 
                  backgroundColor: `${theme.accent}15`,
                  borderColor: `${theme.primary}20`
                }}
              >
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${theme.accent}30` }}
                >
                  <ShoppingCart className="w-6 h-6" style={{ color: `${theme.secondary}60` }} />
                </div>
                <p 
                  className="font-medium mb-3"
                  style={{ color: `${theme.secondary}99` }}
                >
                  This artwork is currently sold out
                </p>
                <button
                  onClick={handleWishlistToggle}
                  className="text-sm font-semibold underline-offset-4 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                  style={{ color: theme.primary }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  <Heart className="w-4 h-4" />
                  Save to wishlist for updates
                </button>
              </div>
            )}
          </motion.div>

          {/* ===== DETAILS TABS ===== */}
          <motion.div custom={4} variants={textReveal}>
            {/* Tab Navigation */}
            <div 
              className="flex justify-center gap-1 mb-8 rounded-full p-1 max-w-sm mx-auto"
              style={{ backgroundColor: `${theme.accent}30` }}
            >
              {['details', 'description', 'artist'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2.5 text-sm font-medium rounded-full transition-all cursor-pointer capitalize"
                  style={{
                    backgroundColor: activeTab === tab ? theme.white : 'transparent',
                    color: activeTab === tab ? theme.secondary : `${theme.secondary}80`,
                    boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl p-6 sm:p-8 shadow-sm border"
                  style={{ 
                    backgroundColor: theme.white,
                    borderColor: `${theme.primary}15`
                  }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {product.medium && (
                      <div className="space-y-1">
                        <span 
                          className="text-xs tracking-wider uppercase font-medium"
                          style={{ color: theme.primary }}
                        >
                          Medium
                        </span>
                        <p 
                          className="font-semibold"
                          style={{ color: theme.secondary }}
                        >
                          {product.medium}
                        </p>
                      </div>
                    )}
                    {product.dimensions?.artwork && (
                      <div className="space-y-1">
                        <span 
                          className="text-xs tracking-wider uppercase font-medium"
                          style={{ color: theme.primary }}
                        >
                          Dimensions
                        </span>
                        <p 
                          className="font-semibold"
                          style={{ color: theme.secondary }}
                        >
                          {product.dimensions.artwork.length}" × {product.dimensions.artwork.width}"
                          {product.dimensions.artwork.height > 0 && ` × ${product.dimensions.artwork.height}"`}
                        </p>
                      </div>
                    )}
                    {product.yearCreated && (
                      <div className="space-y-1">
                        <span 
                          className="text-xs tracking-wider uppercase font-medium"
                          style={{ color: theme.primary }}
                        >
                          Year
                        </span>
                        <p 
                          className="font-semibold"
                          style={{ color: theme.secondary }}
                        >
                          {product.yearCreated}
                        </p>
                      </div>
                    )}
                    {product.isFramed !== undefined && (
                      <div className="space-y-1">
                        <span 
                          className="text-xs tracking-wider uppercase font-medium"
                          style={{ color: theme.primary }}
                        >
                          Framing
                        </span>
                        <p 
                          className="font-semibold"
                          style={{ color: theme.secondary }}
                        >
                          {product.isFramed ? 'Framed' : 'Unframed'}
                        </p>
                      </div>
                    )}
                    {product.orientation && (
                      <div className="space-y-1">
                        <span 
                          className="text-xs tracking-wider uppercase font-medium"
                          style={{ color: theme.primary }}
                        >
                          Orientation
                        </span>
                        <p 
                          className="font-semibold capitalize"
                          style={{ color: theme.secondary }}
                        >
                          {product.orientation}
                        </p>
                      </div>
                    )}
                    {product.style && (
                      <div className="space-y-1">
                        <span 
                          className="text-xs tracking-wider uppercase font-medium"
                          style={{ color: theme.primary }}
                        >
                          Style
                        </span>
                        <p 
                          className="font-semibold"
                          style={{ color: theme.secondary }}
                        >
                          {product.style}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div 
                      className="mt-8 pt-6 border-t"
                      style={{ borderColor: `${theme.primary}15` }}
                    >
                      <span 
                        className="text-xs tracking-wider uppercase font-medium block mb-3"
                        style={{ color: theme.primary }}
                      >
                        Tags
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 text-sm rounded-full border"
                            style={{ 
                              backgroundColor: `${theme.accent}20`,
                              borderColor: `${theme.primary}20`,
                              color: theme.secondary
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl p-6 sm:p-8 shadow-sm border"
                  style={{ 
                    backgroundColor: theme.white,
                    borderColor: `${theme.primary}15`
                  }}
                >
                  <p 
                    className="leading-relaxed whitespace-pre-wrap text-base sm:text-lg"
                    style={{ color: `${theme.secondary}cc` }}
                  >
                    {product.description || 'No description available for this artwork.'}
                  </p>
                </motion.div>
              )}

              {activeTab === 'artist' && product.artist && (
                <motion.div
                  key="artist"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl p-6 sm:p-8 shadow-sm border"
                  style={{ 
                    backgroundColor: theme.white,
                    borderColor: `${theme.primary}15`
                  }}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    {product.artist.profileImage && (
                      <img
                        src={product.artist.profileImage}
                        alt={product.artist.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <h3 
                        className="font-playfair text-2xl font-bold mb-1"
                        style={{ color: theme.secondary }}
                      >
                        {product.artist.name}
                      </h3>
                      {product.artist.nationality && (
                        <p 
                          className="text-sm mb-4"
                          style={{ color: `${theme.secondary}80` }}
                        >
                          {product.artist.nationality}
                        </p>
                      )}
                      <p 
                        className="leading-relaxed mb-5 line-clamp-4"
                        style={{ color: `${theme.secondary}b3` }}
                      >
                        {product.artist.biography || 'No biography available for this artist.'}
                      </p>
                      <Link
                        to={`/artists/${product.artist.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold transition-all group"
                        style={{ color: theme.primary }}
                      >
                        View all works
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== MORE BY ARTIST ===== */}
      {artistProducts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 mt-24"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              <div 
                className="h-px w-12"
                style={{ backgroundColor: `${theme.primary}30` }}
              />
              <Award className="w-5 h-5" style={{ color: `${theme.primary}50` }} />
              <div 
                className="h-px w-12"
                style={{ backgroundColor: `${theme.primary}30` }}
              />
            </motion.div>
            <span 
              className="text-xs tracking-[0.3em] uppercase block mb-3"
              style={{ color: theme.primary }}
            >
              More by {product.artist?.name}
            </span>
            <h2 
              className="font-playfair text-3xl sm:text-4xl font-bold"
              style={{ color: theme.secondary }}
            >
              You may also like
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {artistProducts.slice(0, 4).map((p, index) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={p} index={index} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Bottom decorative element */}
      <div className="flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-4"
        >
          <div 
            className="h-px w-20"
            style={{ backgroundColor: `${theme.primary}25` }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <FlowerDecor className="w-6 h-6" color={`${theme.primary}30`} />
          </motion.div>
          <div 
            className="h-px w-20"
            style={{ backgroundColor: `${theme.primary}25` }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetails;