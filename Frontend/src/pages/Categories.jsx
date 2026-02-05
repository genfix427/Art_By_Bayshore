// pages/Categories.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, FolderTree } from 'lucide-react';
import CategoryCard from '../components/categories/CategoryCard';
import { categoryService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.08, 0.08, 0],
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

const Categories = () => {
  useSEO({
    title: 'Art Categories | Browse by Style & Theme',
    description: 'Explore our art collection organized by categories, styles, and themes',
  });

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Generate floating petals
  const petals = Array.from({ length: 12 }).map((_, i) => ({
    delay: i * 1.5,
    startX: 5 + i * 8,
    duration: 15 + Math.random() * 8,
    size: 12 + Math.random() * 8,
  }));

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, search]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await categoryService.getAll({
        isActive: true,
        limit: 100,
        populate: 'subcategories',
      });
      setCategories(response.data);
      setFilteredCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('An error occurred while fetching categories.');
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = [...categories];

    if (search) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredCategories(filtered);
  };

  return (
    <div className="min-h-screen bg-neutral-50 relative overflow-hidden">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Decorative Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="w-16 h-px bg-gray-900 mx-auto mb-8"
          />

          {/* Decorative Element */}
          <div className="inline-flex items-center gap-4 mb-6">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-12 h-px bg-gray-900/30 origin-right"
            />
            <FolderTree className="w-8 h-8 text-gray-900/40" strokeWidth={1.5} />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-12 h-px bg-gray-900/30 origin-left"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-4">
            Browse by Category
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            Explore our art collection organized by artistic styles, themes, and techniques.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories by name or description..."
                className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          {search && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-500 mt-4"
            >
              Found <span className="font-bold text-gray-900">{filteredCategories.length}</span> categories
            </motion.p>
          )}
        </motion.div>

        {/* Content Section */}
        {loading ? (
          <div>
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="text-center text-gray-700 bg-white p-8 rounded-lg border border-gray-200">
            <p className="text-lg mb-4">{error}</p>
            <button
              onClick={fetchCategories}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredCategories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {filteredCategories.map((category, index) => (
                <CategoryCard key={category._id} category={category} index={index} />
              ))}
            </div>

            {/* Bottom Decorative Element */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center justify-center gap-4 mt-20"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-16 h-px bg-gray-900/20 origin-right"
              />
              <motion.div
                initial={{ scale: 0, rotate: 45 }}
                whileInView={{ scale: 1, rotate: 45 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="w-2 h-2 border border-gray-900/30"
              />
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-16 h-px bg-gray-900/20 origin-left"
              />
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 border border-gray-900/10 flex items-center justify-center mx-auto mb-6">
              <FlowerDecor className="w-10 h-10 text-gray-900/20" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No categories found
            </h3>
            <p className="text-gray-600 mb-6">
              {search 
                ? `No categories match "${search}". Try a different search term.`
                : 'No categories available at the moment.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition-colors"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Categories;