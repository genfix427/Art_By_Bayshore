// pages/CategoryDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight,
  Layers, 
  Hash, 
  FolderTree,
  ChevronRight
} from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import CategoryCard from '../components/categories/CategoryCard';
import { categoryService, productService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=800&fit=crop&q=80';

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

// Corner decoration
const CornerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M0 0 L24 0 L24 3 L3 3 L3 24 L0 24 Z" fill="currentColor" />
  </svg>
);

const CategoryDetails = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const { scrollYProgress } = useScroll();
  const headerY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  // Generate floating petals
  const petals = Array.from({ length: 12 }).map((_, i) => ({
    delay: i * 1.5,
    startX: 5 + i * 8,
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
    title: category ? `${category.name} | Art Category` : 'Category',
    description: category?.description?.substring(0, 160) || 'Art category page',
  });

  useEffect(() => {
    fetchCategoryDetails();
  }, [slug, page]);

  const fetchCategoryDetails = async () => {
    try {
      setLoadingCategory(true);
      setError('');
      
      const categoryResponse = await categoryService.getBySlug(slug);
      setCategory(categoryResponse.data);
      
      // Fetch category's products
      setLoadingProducts(true);
      const productsResponse = await productService.getAll({
        category: categoryResponse.data._id,
        isActive: true,
        limit: 12,
        page,
      });
      setProducts(productsResponse.data);
      setTotalPages(productsResponse.pagination?.totalPages || 1);
      setTotalProducts(productsResponse.pagination?.total || 0);
      
      // Fetch subcategories
      if (!categoryResponse.data.parentCategory) {
        const subsResponse = await categoryService.getAll({
          parentCategory: categoryResponse.data._id,
          isActive: true,
          limit: 6,
        });
        setSubcategories(subsResponse.data);
      }
      
    } catch (error) {
      console.error('Error fetching category details:', error);
      setError('Failed to load category details.');
    } finally {
      setLoadingCategory(false);
      setLoadingProducts(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading State
  if (loadingCategory) {
    return (
      <div>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Error State
  if (error || !category) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 border border-gray-900/10 flex items-center justify-center mx-auto mb-8">
            <FlowerDecor className="w-10 h-10 text-gray-900/20" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Category Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            {error || 'The requested category could not be found.'}
          </p>
          <Link 
            to="/categories" 
            className="inline-flex items-center gap-2 text-gray-900 font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="relative">
              Back to Categories
              <span className="absolute bottom-0 left-0 w-full h-px bg-gray-900" />
            </span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const imageUrl = category.image || PLACEHOLDER_IMAGE;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
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

      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 pt-8"
      >
        <Link 
          to="/categories" 
          className="inline-flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <div className="w-10 h-10 border border-gray-900/10 flex items-center justify-center group-hover:border-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Categories</span>
        </Link>
      </motion.div>

      {/* Hero Section */}
      <motion.section 
        style={{ y: headerY, opacity: headerOpacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 lg:sticky lg:top-24"
          >
            <div className="relative">
              {/* Main Image */}
              <div className="relative border border-gray-900/10 overflow-hidden">
                {/* Loading skeleton */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-100">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                )}

                <motion.img
                  src={imageUrl}
                  alt={category.name}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                    setImageLoaded(true);
                  }}
                  className={`w-full aspect-[4/3] object-cover transition-opacity duration-700 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.2 }}
                />

                {/* Corner decorations */}
                <div className="absolute top-4 left-4">
                  <CornerDecor className="w-6 h-6 text-gray-900/10" />
                </div>
                <div className="absolute top-4 right-4 rotate-90">
                  <CornerDecor className="w-6 h-6 text-gray-900/10" />
                </div>
                <div className="absolute bottom-4 left-4 -rotate-90">
                  <CornerDecor className="w-6 h-6 text-gray-900/10" />
                </div>
                <div className="absolute bottom-4 right-4 rotate-180">
                  <CornerDecor className="w-6 h-6 text-gray-900/10" />
                </div>

                {/* Flower decorations */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="absolute top-8 left-8"
                >
                  <FlowerDecor className="w-8 h-8 text-gray-900/10" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="absolute bottom-8 right-8"
                >
                  <FlowerDecor className="w-8 h-8 text-gray-900/10" />
                </motion.div>

                {/* Main Category Badge */}
                {!category.parentCategory && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-gray-900 text-white px-3 py-1 text-xs font-bold tracking-wider flex items-center gap-1">
                      <FolderTree size={10} />
                      MAIN CATEGORY
                    </span>
                  </div>
                )}
              </div>

              {/* Image caption */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-3 mt-4"
              >
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="w-8 h-px bg-gray-900/30 origin-left"
                />
                <span className="text-xs text-gray-500 tracking-wide uppercase">Category</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 space-y-10"
          >
            {/* Name & Title */}
            <div>
              <motion.div
                variants={lineAnimation}
                className="w-12 h-px bg-gray-900 mb-6 origin-left"
              />

              {/* Parent Category Breadcrumb */}
              {category.parentCategory && (
                <motion.div
                  custom={0}
                  variants={textReveal}
                  className="mb-4"
                >
                  <Link
                    to={`/categories/${category.parentCategory.slug}`}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
                  >
                    {category.parentCategory.name}
                    <ChevronRight size={14} />
                  </Link>
                </motion.div>
              )}

              <motion.span
                custom={0}
                variants={textReveal}
                className="text-sm tracking-[0.3em] text-gray-500 uppercase block mb-4"
              >
                {category.parentCategory ? 'Subcategory' : 'Main Category'}
              </motion.span>

              <motion.h1
                custom={1}
                variants={textReveal}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4"
              >
                {category.name}
              </motion.h1>
            </div>

            {/* Stats */}
            <motion.div
              custom={3}
              variants={textReveal}
              className="flex flex-wrap gap-8 py-8 border-y border-gray-900/10"
            >
              <div>
                <span className="text-3xl font-bold text-gray-900">
                  {totalProducts}
                </span>
                <span className="text-sm text-gray-500 ml-2">Artworks</span>
              </div>
              {subcategories.length > 0 && (
                <>
                  <div className="w-px h-12 bg-gray-900/10" />
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      {subcategories.length}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">Subcategories</span>
                  </div>
                </>
              )}
            </motion.div>

            {/* Description */}
            <motion.div custom={4} variants={textReveal}>
              <h2 className="text-sm tracking-[0.2em] text-gray-500 uppercase mb-4">
                About
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                {category.description || "Explore our curated collection of artworks in this category."}
              </p>
            </motion.div>

            {/* Browse Artworks Link */}
            {products.length > 0 && (
              <motion.div custom={5} variants={textReveal}>
                <a
                  href="#artworks"
                  className="inline-flex items-center gap-3 text-gray-900 group"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 border border-gray-900 px-6 py-3 hover:bg-gray-900 group transition-colors"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-white transition-colors">
                      Browse Artworks
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-900 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </motion.div>
                </a>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* Subcategories Section */}
      {subcategories.length > 0 && (
        <section className="relative z-10 border-t border-gray-900/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="w-16 h-px bg-gray-900 mx-auto mb-8"
              />

              <span className="text-sm tracking-[0.3em] text-gray-500 uppercase block mb-4">
                Explore
              </span>

              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Subcategories
              </h2>

              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover more specific styles within {category.name}
              </p>

              {/* Decorative element */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="w-12 h-px bg-gray-900/20 origin-right"
                />
                <motion.div
                  initial={{ scale: 0, rotate: 45 }}
                  whileInView={{ scale: 1, rotate: 45 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="w-2 h-2 border border-gray-900/30"
                />
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="w-12 h-px bg-gray-900/20 origin-left"
                />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {subcategories.map((subcategory, index) => (
                <CategoryCard key={subcategory._id} category={subcategory} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Artworks Section */}
      <section id="artworks" className="relative z-10 border-t border-gray-900/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="w-16 h-px bg-gray-900 mx-auto mb-8"
            />

            <span className="text-sm tracking-[0.3em] text-gray-500 uppercase block mb-4">
              Collection
            </span>

            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Artworks in {category.name}
            </h2>

            {/* Decorative element */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-12 h-px bg-gray-900/20 origin-right"
              />
              <motion.div
                initial={{ scale: 0, rotate: 45 }}
                whileInView={{ scale: 1, rotate: 45 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="w-2 h-2 border border-gray-900/30"
              />
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-12 h-px bg-gray-900/20 origin-left"
              />
            </div>
          </motion.div>

          {/* Products Grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="aspect-[4/5] border border-gray-900/10 relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard product={product} index={index} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-8 border-t border-gray-900/10 space-y-4 sm:space-y-0">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-bold text-gray-900">{((page - 1) * 12) + 1} - {Math.min(page * 12, totalProducts)}</span> of <span className="font-bold text-gray-900">{totalProducts}</span> artworks
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(page - 1, 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 font-semibold cursor-pointer"
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            page === pageNum
                              ? 'bg-gray-900 text-white border border-gray-900'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-neutral-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 font-semibold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-flex items-center justify-center w-20 h-20 border border-gray-900/10 mb-6"
              >
                <Layers className="w-8 h-8 text-gray-400" strokeWidth={1} />
              </motion.div>
              <p className="text-gray-600 text-lg">
                No artworks available in this category.
              </p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="w-16 h-px bg-gray-900/10 mx-auto mt-6"
              />
            </motion.div>
          )}

          {/* View All Link */}
          {products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-16"
            >
              <Link
                to={`/products?category=${category._id}`}
                className="group inline-flex items-center gap-3 text-gray-900"
              >
                <span className="relative font-medium">
                  View All Artworks
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-px bg-gray-900 origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Bottom Decorative Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 border-t border-gray-900/10 py-16"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <FlowerDecor className="w-8 h-8 text-gray-900/10" />
              <div>
                <p className="text-gray-500 text-sm">Explore more categories</p>
                <p className="text-gray-900 font-medium">Discover our curated collection</p>
              </div>
            </div>

            <Link
              to="/categories"
              className="group flex items-center gap-3"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 border border-gray-900 px-6 py-3 hover:bg-gray-900 group transition-colors"
              >
                <span className="font-medium text-gray-900 group-hover:text-white transition-colors">
                  Browse All Categories
                </span>
                <ArrowRight className="w-4 h-4 text-gray-900 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Final decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="w-32 h-px bg-gray-900/10 mx-auto mt-12"
        />
      </motion.section>
    </div>
  );
};

export default CategoryDetails;