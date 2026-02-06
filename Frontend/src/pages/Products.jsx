// pages/Products.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Grid3X3,
  LayoutGrid,
  SlidersHorizontal,
  Sparkles,
  Package,
  Palette,
  User,
  DollarSign,
  Tag,
  ArrowUpDown
} from 'lucide-react';
import { productService, categoryService, artistService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { useDebounce } from '../hooks/useDebounce';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.06, 0.06, 0],
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const Products = () => {
  useSEO({
    title: 'Browse Artworks | Discover Unique Art',
    description: 'Browse our curated collection of artworks from talented artists worldwide',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [gridView, setGridView] = useState('grid'); // 'grid' or 'large'

  // Dropdown states for searchable selects
  const [categorySearch, setCategorySearch] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);

  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    artist: searchParams.get('artist') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    productType: searchParams.get('productType') || '',
    page: parseInt(searchParams.get('page')) || 1,
  });

  // For multi-select
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('categories') ? searchParams.get('categories').split(',') : []
  );
  const [selectedArtists, setSelectedArtists] = useState(
    searchParams.get('artists') ? searchParams.get('artists').split(',') : []
  );

  const debouncedSearch = useDebounce(filters.search, 500);

  // Generate floating petals
  const petals = Array.from({ length: 12 }).map((_, i) => ({
    delay: i * 1.8,
    startX: 3 + i * 8,
    duration: 20 + Math.random() * 10,
    size: 10 + Math.random() * 8,
  }));

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    fetchArtists();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
    updateURL();
  }, [
    filters.page, 
    debouncedSearch, 
    selectedCategories,
    selectedArtists,
    filters.minPrice, 
    filters.maxPrice, 
    filters.sortBy, 
    filters.productType
  ]);

  // Close filter panel on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowFilters(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when filters are open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showFilters]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
      }
      if (!event.target.closest('.artist-dropdown')) {
        setShowArtistDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: 12,
        isActive: true,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedCategories.length > 0 && { category: selectedCategories.join(',') }),
        ...(selectedArtists.length > 0 && { artist: selectedArtists.join(',') }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.productType && { productType: filters.productType }),
      };

      const response = await productService.getAll(params);
      setProducts(response.data);
      setPagination(response.pagination || {});

    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll({ isActive: true });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await artistService.getAll({ isActive: true });
      setArtists(response.data);
    } catch (error) {
      console.error('Failed to fetch artists:', error);
    }
  };

  const updateURL = () => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (selectedCategories.length > 0) params.categories = selectedCategories.join(',');
    if (selectedArtists.length > 0) params.artists = selectedArtists.join(',');
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.productType) params.productType = filters.productType;
    if (filters.page > 1) params.page = filters.page.toString();
    
    setSearchParams(params, { replace: true });
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleArtistChange = (artistId) => {
    setSelectedArtists(prev =>
      prev.includes(artistId)
        ? prev.filter(id => id !== artistId)
        : [...prev, artistId]
    );
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters,
      page: 1,
    });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      artist: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
      productType: '',
      page: 1,
    });
    setSelectedCategories([]);
    setSelectedArtists([]);
    setCategorySearch('');
    setArtistSearch('');
  };

  const hasActiveFilters = 
    filters.search || 
    selectedCategories.length > 0 || 
    selectedArtists.length > 0 || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.productType;

  const activeFilterCount = 
    (filters.search ? 1 : 0) + 
    selectedCategories.length + 
    selectedArtists.length + 
    (filters.minPrice ? 1 : 0) + 
    (filters.maxPrice ? 1 : 0) + 
    (filters.productType ? 1 : 0);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(artistSearch.toLowerCase())
  );

  // Filters Panel Component
  const FiltersPanel = () => (
    <div className="p-8 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-gray-900/10 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-gray-900" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-gray-900">Filters</h2>
        </div>
        {hasActiveFilters && (
          <motion.button
            onClick={clearFilters}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-sm text-gray-900 hover:text-gray-700 font-medium flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
            Clear all
          </motion.button>
        )}
      </div>

      {/* Sort By */}
      <div className="mb-8">
        <label className="flex items-center gap-2 text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-3">
          <ArrowUpDown className="w-4 h-4" />
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
          className="w-full px-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors bg-white cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A-Z</option>
          <option value="name_desc">Name: Z-A</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-8">
        <label className="flex items-center gap-2 text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-3">
          <DollarSign className="w-4 h-4" />
          Price Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900/30">$</span>
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
              className="w-full pl-8 pr-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
              min="0"
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900/30">$</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
              className="w-full pl-8 pr-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Product Type Filter */}
      <div className="mb-8">
        <label className="flex items-center gap-2 text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-3">
          <Tag className="w-4 h-4" />
          Product Type
        </label>
        <select
          value={filters.productType}
          onChange={(e) => handleFilterChange({ productType: e.target.value })}
          className="w-full px-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors bg-white cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="original">Original</option>
          <option value="print">Print</option>
          <option value="digital">Digital</option>
        </select>
      </div>

      {/* Categories with Search */}
      <div className="mb-8 category-dropdown">
        <label className="flex items-center gap-2 text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-3">
          <Palette className="w-4 h-4" />
          Categories
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            onFocus={() => setShowCategoryDropdown(true)}
            className="w-full px-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
          />
          {showCategoryDropdown ? (
            <ChevronUp className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          ) : (
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          )}
          
          <AnimatePresence>
            {showCategoryDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-900/10 shadow-lg max-h-48 overflow-y-auto"
              >
                <div className="p-2 space-y-1">
                  {filteredCategories.map(category => (
                    <label 
                      key={category._id} 
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category._id)}
                        onChange={() => handleCategoryChange(category._id)}
                        className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="ml-3 text-sm text-gray-900">{category.name}</span>
                    </label>
                  ))}
                  {filteredCategories.length === 0 && (
                    <div className="p-3 text-sm text-gray-500 text-center">No categories found</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Selected Categories */}
        <AnimatePresence>
          {selectedCategories.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mt-3"
            >
              {selectedCategories.map(catId => {
                const category = categories.find(c => c._id === catId);
                return category ? (
                  <motion.span 
                    key={catId} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-gray-900 text-white px-3 py-1 text-xs flex items-center gap-2"
                  >
                    {category.name}
                    <button
                      onClick={() => handleCategoryChange(catId)}
                      className="hover:text-gray-300 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ) : null;
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Artists with Search */}
      <div className="mb-8 artist-dropdown">
        <label className="flex items-center gap-2 text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-3">
          <User className="w-4 h-4" />
          Artists
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search artists..."
            value={artistSearch}
            onChange={(e) => setArtistSearch(e.target.value)}
            onFocus={() => setShowArtistDropdown(true)}
            className="w-full px-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
          />
          {showArtistDropdown ? (
            <ChevronUp className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          ) : (
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          )}
          
          <AnimatePresence>
            {showArtistDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-900/10 shadow-lg max-h-48 overflow-y-auto"
              >
                <div className="p-2 space-y-1">
                  {filteredArtists.map(artist => (
                    <label 
                      key={artist._id} 
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedArtists.includes(artist._id)}
                        onChange={() => handleArtistChange(artist._id)}
                        className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="ml-3 text-sm text-gray-900">{artist.name}</span>
                    </label>
                  ))}
                  {filteredArtists.length === 0 && (
                    <div className="p-3 text-sm text-gray-500 text-center">No artists found</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Selected Artists */}
        <AnimatePresence>
          {selectedArtists.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mt-3"
            >
              {selectedArtists.map(artistId => {
                const artist = artists.find(a => a._id === artistId);
                return artist ? (
                  <motion.span 
                    key={artistId} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-gray-900 text-white px-3 py-1 text-xs flex items-center gap-2"
                  >
                    {artist.name}
                    <button
                      onClick={() => handleArtistChange(artistId)}
                      className="hover:text-gray-300 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ) : null;
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Apply Filters Button (Mobile) */}
      <motion.button
        onClick={() => setShowFilters(false)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 lg:hidden cursor-pointer"
      >
        <Sparkles className="w-5 h-5" />
        Apply Filters
      </motion.button>
    </div>
  );

  // Render Pagination
  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <motion.button
          key={i}
          onClick={() => handlePageChange(i)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-10 h-10 flex items-center justify-center font-medium transition-all cursor-pointer ${
            pagination.page === i
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-900 border border-gray-900/10 hover:border-gray-900'
          }`}
        >
          {i}
        </motion.button>
      );
    }
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center justify-between mt-16 pt-8 border-t border-gray-900/10 gap-6"
      >
        <p className="text-sm text-gray-900/60">
          Showing <span className="font-medium text-gray-900">{((pagination.page - 1) * 12) + 1}</span> - <span className="font-medium text-gray-900">{Math.min(pagination.page * 12, pagination.total)}</span> of <span className="font-medium text-gray-900">{pagination.total}</span> artworks
        </p>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => handlePageChange(Math.max(pagination.page - 1, 1))}
            disabled={pagination.page === 1}
            whileHover={{ scale: pagination.page === 1 ? 1 : 1.05 }}
            whileTap={{ scale: pagination.page === 1 ? 1 : 0.95 }}
            className="w-10 h-10 flex items-center justify-center border border-gray-900/10 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-900 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          {pages}
          <motion.button
            onClick={() => handlePageChange(Math.min(pagination.page + 1, pagination.totalPages))}
            disabled={pagination.page === pagination.totalPages}
            whileHover={{ scale: pagination.page === pagination.totalPages ? 1 : 1.05 }}
            whileTap={{ scale: pagination.page === pagination.totalPages ? 1 : 0.95 }}
            className="w-10 h-10 flex items-center justify-center border border-gray-900/10 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-900 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

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

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.03, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-60 left-10 w-64 h-64 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-gray-900" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.03, scale: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="absolute bottom-40 right-10 w-48 h-48 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-gray-900" />
      </motion.div>

      {/* Filter Overlay */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />
            
            {/* Mobile Drawer */}
            <motion.div
              className="fixed inset-y-0 left-0 w-full max-w-sm bg-white overflow-y-auto z-50 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-6 right-6 w-10 h-10 border border-gray-900/10 flex items-center justify-center hover:bg-gray-100 z-10 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <FiltersPanel />
            </motion.div>
            
            {/* Desktop Modal */}
            <motion.div
              className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white border border-gray-900/10 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setShowFilters(false)}
                  className="absolute top-6 right-6 w-10 h-10 border border-gray-900/10 flex items-center justify-center hover:bg-gray-100 z-10 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <FiltersPanel />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-900/50 mb-12"
        >
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Art Store</span>
        </motion.nav>

        {/* Page Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="w-16 h-px bg-gray-900 mx-auto mb-8 origin-center"
          />

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border border-gray-900/10 flex items-center justify-center"
            >
              <FlowerDecor className="w-5 h-5 text-gray-900/20" />
            </motion.div>
          </motion.div>

          <motion.span
            variants={itemVariants}
            className="text-xs tracking-[0.3em] text-gray-900/50 uppercase block mb-4"
          >
            Curated Collection
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            Our Art Store
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-900/60 max-w-2xl mx-auto leading-relaxed"
          >
            Discover unique artworks from talented artists worldwide. Each piece is carefully 
            curated to bring exceptional art into your space.
          </motion.p>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky top-4 z-20 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-md border border-gray-900/10 p-4 flex items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-900/30 w-5 h-5" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                placeholder="Search artworks, artists, or styles..."
                className="w-full pl-12 pr-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors bg-transparent"
              />
            </div>
            
            {/* Filter Button */}
            <motion.button
              onClick={() => setShowFilters(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 border border-gray-900 text-gray-900 font-medium hover:bg-gray-900 hover:text-white transition-all flex items-center gap-3 cursor-pointer"
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:block">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-6 h-6 bg-gray-900 text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>

            {/* Grid View Toggle */}
            <div className="hidden md:flex border border-gray-900/10">
              <button
                onClick={() => setGridView('grid')}
                className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${
                  gridView === 'grid' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGridView('large')}
                className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${
                  gridView === 'large' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Quick Filters: Categories */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Categories
          </h3>
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            {categories.map((category, index) => (
              <motion.button
                key={category._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                onClick={() => handleCategoryChange(category._id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-5 py-2.5 font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategories.includes(category._id)
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-900/10 hover:border-gray-900'
                }`}
              >
                {category.name}
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        {/* Quick Filters: Artists */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <h3 className="text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Artists
          </h3>
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            {artists.map((artist, index) => (
              <motion.button
                key={artist._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                onClick={() => handleArtistChange(artist._id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-5 py-2.5 font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  selectedArtists.includes(artist._id)
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-900/10 hover:border-gray-900'
                }`}
              >
                {artist.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Active Filters Display */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 pb-8 border-b border-gray-900/10"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs tracking-[0.15em] text-gray-900/50 uppercase">Active Filters:</span>
                
                {filters.search && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-gray-100 text-gray-900 px-4 py-2 text-sm flex items-center gap-2"
                  >
                    <Search className="w-3 h-3" />
                    "{filters.search}"
                    <button onClick={() => handleFilterChange({ search: '' })} className="hover:text-gray-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                
                {selectedCategories.map(catId => {
                  const category = categories.find(c => c._id === catId);
                  return category ? (
                    <motion.span 
                      key={catId} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-gray-900 text-white px-4 py-2 text-sm flex items-center gap-2"
                    >
                      <Palette className="w-3 h-3" />
                      {category.name}
                      <button onClick={() => handleCategoryChange(catId)} className="hover:text-gray-300 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ) : null;
                })}
                
                {selectedArtists.map(artistId => {
                  const artist = artists.find(a => a._id === artistId);
                  return artist ? (
                    <motion.span 
                      key={artistId} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-gray-900 text-white px-4 py-2 text-sm flex items-center gap-2"
                    >
                      <User className="w-3 h-3" />
                      {artist.name}
                      <button onClick={() => handleArtistChange(artistId)} className="hover:text-gray-300 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ) : null;
                })}
                
                {filters.minPrice && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-gray-100 text-gray-900 px-4 py-2 text-sm flex items-center gap-2"
                  >
                    <DollarSign className="w-3 h-3" />
                    Min: ${filters.minPrice}
                    <button onClick={() => handleFilterChange({ minPrice: '' })} className="hover:text-gray-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                
                {filters.maxPrice && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-gray-100 text-gray-900 px-4 py-2 text-sm flex items-center gap-2"
                  >
                    <DollarSign className="w-3 h-3" />
                    Max: ${filters.maxPrice}
                    <button onClick={() => handleFilterChange({ maxPrice: '' })} className="hover:text-gray-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                
                {filters.productType && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-gray-100 text-gray-900 px-4 py-2 text-sm flex items-center gap-2"
                  >
                    <Tag className="w-3 h-3" />
                    {filters.productType}
                    <button onClick={() => handleFilterChange({ productType: '' })} className="hover:text-gray-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                
                <motion.button 
                  onClick={clearFilters} 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-gray-900 text-sm font-medium flex items-center gap-1 ml-2 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        {!loading && products.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-8"
          >
            <p className="text-gray-900/60">
              <span className="font-medium text-gray-900">{pagination.total || products.length}</span> artworks found
            </p>
          </motion.div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border border-gray-900/10 flex items-center justify-center mb-6"
            >
              <FlowerDecor className="w-8 h-8 text-gray-900/20" />
            </motion.div>
            <p className="text-gray-900/60">Loading artworks...</p>
          </div>
        ) : products.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`grid gap-8 ${
              gridView === 'large' 
                ? 'grid-cols-1 sm:grid-cols-2' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard product={product} index={index} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 border border-gray-900/10 bg-white"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border border-gray-900/10 flex items-center justify-center mx-auto mb-8"
            >
              <Package className="w-10 h-10 text-gray-900/20" />
            </motion.div>
            
            <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-3">
              No artworks found
            </h3>
            <p className="text-gray-900/60 mb-8 max-w-md mx-auto">
              We couldn't find any artworks matching your criteria. Try adjusting your filters or search terms.
            </p>
            <motion.button
              onClick={clearFilters}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
              Clear all filters
            </motion.button>
          </motion.div>
        )}

        {/* Pagination */}
        {renderPagination()}

        {/* Bottom Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-24 text-center"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5 }}
            className="w-32 h-px bg-gray-900/10 mx-auto mb-8"
          />
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border border-gray-900/10 flex items-center justify-center mx-auto mb-4"
          >
            <FlowerDecor className="w-5 h-5 text-gray-900/20" />
          </motion.div>
          
          <p className="font-playfair text-lg text-gray-900/40 italic max-w-xl mx-auto">
            "Every artist dips his brush in his own soul, and paints his own nature into his pictures."
          </p>
          <p className="text-sm text-gray-900/30 mt-2">— Henry Ward Beecher</p>
        </motion.div>
      </div>

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-gray-900 text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <ChevronUp className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default Products;