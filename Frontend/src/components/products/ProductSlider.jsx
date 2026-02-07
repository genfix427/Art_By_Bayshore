// components/products/ProductSlider.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  ShoppingBag,
  Pause,
  Play,
  Sparkles,
  Package
} from 'lucide-react';
import { productService } from '../../api/services';
import ProductCard from './ProductCard';

// ============== DECORATIVE COMPONENTS ==============

const FlowerPetal = ({ delay, duration, startX, startY, size, rotation }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${startX}%`, top: `${startY}%` }}
    initial={{ opacity: 0, scale: 0, rotate: 0 }}
    animate={{
      opacity: [0, 0.6, 0.6, 0],
      scale: [0, 1, 1, 0.5],
      rotate: [0, rotation, rotation + 180, rotation + 360],
      y: [0, 100, 200, 300],
      x: [0, 30, -20, 40],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="text-gray-900/10"
    >
      <path d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z" fill="currentColor" />
      <path d="M12 12C12 12 16 10 18 10C20 10 22 12 22 12C22 12 20 14 18 14C16 14 12 12 12 12Z" fill="currentColor" />
      <path d="M12 12C12 12 14 16 14 18C14 20 12 22 12 22C12 22 10 20 10 18C10 16 12 12 12 12Z" fill="currentColor" />
      <path d="M12 12C12 12 8 10 6 10C4 10 2 12 2 12C2 12 4 14 6 14C8 14 12 12 12 12Z" fill="currentColor" />
    </svg>
  </motion.div>
);

const FloatingLeaf = ({ delay, startX }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20 }}
    animate={{
      opacity: [0, 0.3, 0.3, 0],
      y: [-20, 400, 800],
      x: [0, 50, -30, 80],
      rotate: [0, 45, -45, 90],
    }}
    transition={{
      duration: 15,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-900/10">
      <path d="M17 8C17 8 12 2 6 2C6 8 12 14 12 14C12 14 18 8 17 8Z" fill="currentColor" />
      <path d="M12 14L12 22" stroke="currentColor" strokeWidth="1" />
    </svg>
  </motion.div>
);

// ============== LOADING SKELETON ==============

const ProductCardSkeleton = ({ index }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="w-full"
  >
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
      {/* Image Skeleton */}
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 bg-gray-100">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: index * 0.2 }}
        />
        {/* Badge skeleton */}
        <div className="absolute top-4 left-4 w-16 h-6 bg-gray-200 rounded-full" />
        {/* Action buttons skeleton */}
        <div className="absolute top-4 right-4 flex flex-col gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="p-4 sm:p-5 md:p-6 text-center space-y-3">
        <div className="h-3 bg-gray-100 w-20 mx-auto rounded" />
        <div className="h-6 bg-gray-100 w-3/4 mx-auto rounded" />
        <div className="h-4 bg-gray-100 w-1/2 mx-auto rounded" />
        <div className="h-7 bg-gray-100 w-24 mx-auto rounded" />
      </div>
    </div>
  </motion.div>
);

// ============== EMPTY STATE ==============

const EmptyState = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="w-full py-16 sm:py-20 text-center col-span-full"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 border border-gray-900/10 mb-6"
    >
      <ShoppingBag className="text-gray-900/40 w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1} />
    </motion.div>
    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No Products Yet</h3>
    <p className="text-gray-900/50 text-sm sm:text-base">Amazing artworks are coming soon.</p>
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="w-16 h-px bg-gray-900/20 mx-auto mt-6"
    />
  </motion.div>
);

// ============== MAIN COMPONENT ==============

const ProductSlider = ({ 
  title = "Featured Artworks",
  subtitle = "Discover unique pieces from our curated collection.",
  viewAllHref = "/products",
  autoPlay = true,
  autoPlayInterval = 5000,
  filterType = "featured",
  category = null,
  limit = 12
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [slidesPerView, setSlidesPerView] = useState(4);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Calculate slides per view based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setSlidesPerView(1);
        setIsMobile(true);
      } else if (width < 768) {
        setSlidesPerView(2);
        setIsMobile(false);
      } else if (width < 1024) {
        setSlidesPerView(3);
        setIsMobile(false);
      } else {
        setSlidesPerView(4);
        setIsMobile(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filterType, category]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        isActive: true,
        limit: limit,
      };

      if (filterType === "featured") {
        params.isFeatured = true;
      } else if (filterType === "new") {
        params.sort = "-createdAt";
      } else if (filterType === "bestseller") {
        params.sort = "-soldCount";
      }

      if (category) {
        params.category = category;
      }

      const response = await productService.getAll(params);
      setProducts(response.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const totalSlides = Math.max(0, Math.ceil(products.length / slidesPerView));

  const nextSlide = useCallback(() => {
    if (totalSlides > 1) {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides > 1) {
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  }, [totalSlides]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (isAutoPlaying && totalSlides > 1 && !isDragging) {
      autoPlayRef.current = setInterval(nextSlide, autoPlayInterval);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, totalSlides, nextSlide, autoPlayInterval, isDragging]);

  const handleMouseEnter = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (isAutoPlaying && totalSlides > 1) {
      autoPlayRef.current = setInterval(nextSlide, autoPlayInterval);
    }
  };

  const getVisibleProducts = () => {
    const startIndex = currentSlide * slidesPerView;
    return products.slice(startIndex, startIndex + slidesPerView);
  };

  // Decorative elements
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    duration: 12 + Math.random() * 5,
    startX: Math.random() * 100,
    startY: Math.random() * 30,
    size: 16 + Math.random() * 16,
    rotation: Math.random() * 360,
  }));

  const leaves = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 3,
    startX: 10 + i * 15,
  }));

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
    visible: { scaleX: 1, transition: { duration: 1.2, ease: "easeInOut" } }
  };

  const getBadgeText = () => {
    switch (filterType) {
      case "featured": return "Featured";
      case "new": return "New Arrivals";
      case "bestseller": return "Best Sellers";
      default: return "Curated";
    }
  };

  if (error && products.length === 0 && !loading) {
    return null;
  }

  return (
    <motion.section 
      ref={containerRef}
      className="relative overflow-hidden bg-white py-12 sm:py-16 md:py-20 lg:py-24"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111827' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Decorations - Hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        {petals.map((petal, i) => (
          <FlowerPetal key={i} {...petal} />
        ))}
        {leaves.map((leaf, i) => (
          <FloatingLeaf key={`leaf-${i}`} {...leaf} />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 sm:gap-8 mb-10 sm:mb-12 lg:mb-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex-1 w-full"
          >
            <motion.div
              variants={lineAnimation}
              className="w-12 sm:w-16 h-px bg-gray-900 mb-6 sm:mb-8 origin-left"
            />

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", duration: 1 }}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 border border-gray-900/10 flex items-center justify-center flex-shrink-0"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-900" strokeWidth={1.5} />
                </motion.div>
              </motion.div>

              <motion.h2 
                custom={0}
                variants={textReveal}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900"
              >
                {title}
              </motion.h2>
              
              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, type: "spring" }}
                className="hidden sm:inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold"
              >
                <Sparkles className="w-3 h-3" />
                {getBadgeText()}
              </motion.span>
            </div>

            <motion.p 
              custom={1}
              variants={textReveal}
              className="text-gray-900/60 text-sm sm:text-base lg:text-lg ml-0 sm:ml-16 lg:ml-20"
            >
              {subtitle}
            </motion.p>

            {!loading && products.length > 0 && (
              <motion.div 
                custom={2}
                variants={textReveal}
                className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8 mt-4 sm:mt-6 ml-0 sm:ml-16 lg:ml-20"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-900/50" />
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                    {products.length}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-900/50">
                    {products.length === 1 ? 'Artwork' : 'Artworks'}
                  </span>
                </div>
                <div className="w-px h-4 sm:h-6 bg-gray-900/10" />
                <span className="text-xs sm:text-sm text-gray-900/50">Handpicked Collection</span>
              </motion.div>
            )}
          </motion.div>

          {/* Desktop Controls */}
          {!loading && products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden lg:flex items-center gap-6 flex-shrink-0"
            >
              {totalSlides > 1 && (
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="p-2 border border-gray-900/20 hover:border-gray-900 transition-colors"
                  title={isAutoPlaying ? 'Pause' : 'Play'}
                >
                  {isAutoPlaying ? (
                    <Pause className="w-4 h-4 text-gray-900" />
                  ) : (
                    <Play className="w-4 h-4 text-gray-900" />
                  )}
                </button>
              )}

              <Link to={viewAllHref} className="group">
                <motion.div
                  className="flex items-center gap-3 text-gray-900"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="relative text-base lg:text-lg font-medium">
                    View All Artworks
                    <motion.span
                      className="absolute bottom-0 left-0 w-full h-px bg-gray-900 origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </span>
                  <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Arrows - Hidden on small screens */}
          {!loading && products.length > slidesPerView && !isMobile && (
            <>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={prevSlide}
                className="hidden sm:flex absolute -left-2 sm:-left-4 lg:-left-8 top-[40%] -translate-y-1/2 z-30 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 border border-gray-900/20 bg-white flex items-center justify-center shadow-lg hover:border-gray-900 hover:bg-gray-900 transition-all duration-300 group-hover:shadow-xl cursor-pointer">
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 group-hover:text-white transition-colors" />
                </div>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={nextSlide}
                className="hidden sm:flex absolute -right-2 sm:-right-4 lg:-right-8 top-[40%] -translate-y-1/2 z-30 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 border border-gray-900/20 bg-white flex items-center justify-center shadow-lg hover:border-gray-900 hover:bg-gray-900 transition-all duration-300 group-hover:shadow-xl cursor-pointer">
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 group-hover:text-white transition-colors" />
                </div>
              </motion.button>
            </>
          )}

          {/* Carousel Content */}
          <div className="overflow-hidden px-1 sm:px-2">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {Array.from({ length: slidesPerView }).map((_, i) => (
                  <ProductCardSkeleton key={i} index={i} />
                ))}
              </div>
            ) : products?.length > 0 ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.1}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={(e, { offset, velocity }) => {
                    setIsDragging(false);
                    const swipe = Math.abs(offset.x) * velocity.x;
                    if (swipe < -10000) {
                      nextSlide();
                    } else if (swipe > 10000) {
                      prevSlide();
                    }
                  }}
                >
                  {getVisibleProducts().map((product, idx) => (
                    <motion.div
                      key={product?._id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                    >
                      <ProductCard product={product} index={idx} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Dots Indicator */}
          {!loading && totalSlides > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8 sm:mt-10 lg:mt-12">
              {/* Desktop Progress Bars */}
              <div className="hidden sm:flex items-center gap-2">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className="group relative"
                    aria-label={`Go to slide ${index + 1}`}
                  >
                    <motion.div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentSlide === index 
                          ? 'w-10 bg-gray-900' 
                          : 'w-5 bg-gray-300 hover:bg-gray-400'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                    {currentSlide === index && isAutoPlaying && (
                      <motion.div
                        className="absolute top-0 left-0 h-1.5 bg-emerald-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ 
                          duration: autoPlayInterval / 1000, 
                          ease: 'linear',
                          repeat: Infinity
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Mobile Dots */}
              <div className="flex sm:hidden items-center gap-2">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  >
                    <motion.div
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        currentSlide === index 
                          ? 'bg-gray-900 scale-125' 
                          : 'bg-gray-300'
                      }`}
                      whileTap={{ scale: 0.9 }}
                    />
                  </button>
                ))}
              </div>

              {/* Slide Counter */}
              <div className="hidden sm:flex items-center gap-2 ml-4 text-sm text-gray-500">
                <span className="font-bold text-gray-900">{currentSlide + 1}</span>
                <span>/</span>
                <span>{totalSlides}</span>
              </div>
            </div>
          )}

          {/* Mobile Swipe Hint */}
          {!loading && products.length > slidesPerView && (
            <motion.div 
              className="flex justify-center mt-4 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.div
                className="flex items-center gap-1 text-gray-400 text-xs"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Swipe to navigate</span>
                <ChevronRight className="w-3 h-3" />
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Mobile View All Button */}
        {!loading && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 sm:mt-10 lg:hidden text-center"
          >
            <Link 
              to={viewAllHref} 
              className="group inline-flex items-center gap-3 text-gray-900 px-6 py-3 border border-gray-900/20 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300"
            >
              <span className="font-medium text-sm sm:text-base">View All Artworks</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}

        {/* Bottom Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="w-full h-px bg-gray-900/5 mt-12 sm:mt-16 lg:mt-20 origin-center"
        />
      </div>
    </motion.section>
  );
};

export default ProductSlider;