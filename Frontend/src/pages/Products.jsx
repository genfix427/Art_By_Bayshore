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
import { productService, artistService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { useDebounce } from '../hooks/useDebounce';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [gridView, setGridView] = useState('grid');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Dropdown states for searchable selects
  const [artistSearch, setArtistSearch] = useState('');
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);

  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    artist: searchParams.get('artist') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    productType: searchParams.get('productType') || '',
    page: parseInt(searchParams.get('page')) || 1,
  });

  // For multi-select
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

  // Generate floating shapes
  const shapes = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 10 + i * 12,
    duration: 20 + Math.random() * 10,
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

  // Fetch initial data
  useEffect(() => {
    fetchArtists();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
    updateURL();
  }, [
    filters.page, 
    debouncedSearch, 
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
    if (selectedArtists.length > 0) params.artists = selectedArtists.join(',');
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.productType) params.productType = filters.productType;
    if (filters.page > 1) params.page = filters.page.toString();
    
    setSearchParams(params, { replace: true });
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
      artist: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
      productType: '',
      page: 1,
    });
    setSelectedArtists([]);
    setArtistSearch('');
  };

  const hasActiveFilters = 
    filters.search || 
    selectedArtists.length > 0 || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.productType;

  const activeFilterCount = 
    (filters.search ? 1 : 0) + 
    selectedArtists.length + 
    (filters.minPrice ? 1 : 0) + 
    (filters.maxPrice ? 1 : 0) + 
    (filters.productType ? 1 : 0);

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(artistSearch.toLowerCase())
  );

  // Filters Panel Component
  const FiltersPanel = () => (
    <div className="p-8 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 flex items-center justify-center border"
            style={{ borderColor: `${theme.primary}30` }}
          >
            <SlidersHorizontal className="w-5 h-5" style={{ color: theme.primary }} />
          </div>
          <h2 
            className="font-playfair text-2xl font-bold"
            style={{ color: theme.secondary }}
          >
            Filters
          </h2>
        </div>
        {hasActiveFilters && (
          <motion.button
            onClick={clearFilters}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-sm font-medium flex items-center gap-1 cursor-pointer transition-colors"
            style={{ color: theme.primary }}
            onMouseEnter={(e) => e.target.style.color = theme.secondary}
            onMouseLeave={(e) => e.target.style.color = theme.primary}
          >
            <X className="w-4 h-4" />
            Clear all
          </motion.button>
        )}
      </div>

      {/* Sort By */}
      <div className="mb-8">
        <label 
          className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase mb-3"
          style={{ color: `${theme.secondary}80` }}
        >
          <ArrowUpDown className="w-4 h-4" />
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
          className="w-full px-4 py-3 outline-none transition-colors cursor-pointer"
          style={{ 
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: `${theme.primary}20`,
            backgroundColor: theme.white,
            color: theme.secondary
          }}
          onFocus={(e) => e.target.style.borderColor = theme.primary}
          onBlur={(e) => e.target.style.borderColor = `${theme.primary}20`}
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
        <label 
          className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase mb-3"
          style={{ color: `${theme.secondary}80` }}
        >
          <DollarSign className="w-4 h-4" />
          Price Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span 
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: `${theme.primary}50` }}
            >
              $
            </span>
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
              className="w-full pl-8 pr-4 py-3 outline-none transition-colors"
              style={{ 
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: `${theme.primary}20`,
                color: theme.secondary
              }}
              onFocus={(e) => e.target.style.borderColor = theme.primary}
              onBlur={(e) => e.target.style.borderColor = `${theme.primary}20`}
              min="0"
            />
          </div>
          <div className="relative">
            <span 
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: `${theme.primary}50` }}
            >
              $
            </span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
              className="w-full pl-8 pr-4 py-3 outline-none transition-colors"
              style={{ 
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: `${theme.primary}20`,
                color: theme.secondary
              }}
              onFocus={(e) => e.target.style.borderColor = theme.primary}
              onBlur={(e) => e.target.style.borderColor = `${theme.primary}20`}
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Product Type Filter */}
      <div className="mb-8">
        <label 
          className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase mb-3"
          style={{ color: `${theme.secondary}80` }}
        >
          <Tag className="w-4 h-4" />
          Product Type
        </label>
        <select
          value={filters.productType}
          onChange={(e) => handleFilterChange({ productType: e.target.value })}
          className="w-full px-4 py-3 outline-none transition-colors cursor-pointer"
          style={{ 
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: `${theme.primary}20`,
            backgroundColor: theme.white,
            color: theme.secondary
          }}
          onFocus={(e) => e.target.style.borderColor = theme.primary}
          onBlur={(e) => e.target.style.borderColor = `${theme.primary}20`}
        >
          <option value="">All Types</option>
          <option value="original">Original</option>
          <option value="print">Print</option>
          <option value="digital">Digital</option>
        </select>
      </div>

      {/* Artists with Search */}
      <div className="mb-8 artist-dropdown">
        <label 
          className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase mb-3"
          style={{ color: `${theme.secondary}80` }}
        >
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
            className="w-full px-4 py-3 outline-none transition-colors"
            style={{ 
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: showArtistDropdown ? theme.primary : `${theme.primary}20`,
              color: theme.secondary
            }}
          />
          {showArtistDropdown ? (
            <ChevronUp 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: theme.primary }}
            />
          ) : (
            <ChevronDown 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: `${theme.primary}60` }}
            />
          )}
          
          <AnimatePresence>
            {showArtistDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-1 shadow-lg max-h-48 overflow-y-auto border"
                style={{ 
                  backgroundColor: theme.white,
                  borderColor: `${theme.primary}20`
                }}
              >
                <div className="p-2 space-y-1">
                  {filteredArtists.map(artist => (
                    <label 
                      key={artist._id} 
                      className="flex items-center p-3 cursor-pointer transition-colors"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}30`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={selectedArtists.includes(artist._id)}
                        onChange={() => handleArtistChange(artist._id)}
                        className="w-4 h-4"
                        style={{ accentColor: theme.primary }}
                      />
                      <span 
                        className="ml-3 text-sm"
                        style={{ color: theme.secondary }}
                      >
                        {artist.name}
                      </span>
                    </label>
                  ))}
                  {filteredArtists.length === 0 && (
                    <div 
                      className="p-3 text-sm text-center"
                      style={{ color: `${theme.secondary}80` }}
                    >
                      No artists found
                    </div>
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
                    className="px-3 py-1 text-xs flex items-center gap-2"
                    style={{ backgroundColor: theme.primary, color: theme.white }}
                  >
                    {artist.name}
                    <button
                      onClick={() => handleArtistChange(artistId)}
                      className="cursor-pointer transition-opacity hover:opacity-70"
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
        className="w-full py-4 font-medium transition-colors flex items-center justify-center gap-2 lg:hidden cursor-pointer"
        style={{ backgroundColor: theme.primary, color: theme.white }}
        onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
        onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
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
          className="w-10 h-10 flex items-center justify-center font-medium transition-all cursor-pointer"
          style={{
            backgroundColor: pagination.page === i ? theme.primary : theme.white,
            color: pagination.page === i ? theme.white : theme.secondary,
            borderWidth: pagination.page === i ? 0 : 1,
            borderStyle: 'solid',
            borderColor: `${theme.primary}20`
          }}
          onMouseEnter={(e) => {
            if (pagination.page !== i) e.target.style.borderColor = theme.primary;
          }}
          onMouseLeave={(e) => {
            if (pagination.page !== i) e.target.style.borderColor = `${theme.primary}20`;
          }}
        >
          {i}
        </motion.button>
      );
    }
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center justify-between mt-16 pt-8 gap-6 border-t"
        style={{ borderColor: `${theme.primary}20` }}
      >
        <p 
          className="text-sm"
          style={{ color: `${theme.secondary}99` }}
        >
          Showing <span className="font-medium" style={{ color: theme.secondary }}>{((pagination.page - 1) * 12) + 1}</span> - <span className="font-medium" style={{ color: theme.secondary }}>{Math.min(pagination.page * 12, pagination.total)}</span> of <span className="font-medium" style={{ color: theme.secondary }}>{pagination.total}</span> artworks
        </p>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => handlePageChange(Math.max(pagination.page - 1, 1))}
            disabled={pagination.page === 1}
            whileHover={{ scale: pagination.page === 1 ? 1 : 1.05 }}
            whileTap={{ scale: pagination.page === 1 ? 1 : 0.95 }}
            className="w-10 h-10 flex items-center justify-center border disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            style={{ borderColor: `${theme.primary}20`, color: theme.secondary }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          {pages}
          <motion.button
            onClick={() => handlePageChange(Math.min(pagination.page + 1, pagination.totalPages))}
            disabled={pagination.page === pagination.totalPages}
            whileHover={{ scale: pagination.page === pagination.totalPages ? 1 : 1.05 }}
            whileTap={{ scale: pagination.page === pagination.totalPages ? 1 : 0.95 }}
            className="w-10 h-10 flex items-center justify-center border disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            style={{ borderColor: `${theme.primary}20`, color: theme.secondary }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: theme.white }}>
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234169E1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
      </div>

      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {shapes.map((shape, i) => (
          <FloatingShape key={`shape-${i}`} {...shape} />
        ))}
      </div>

      {/* Pulsing Dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {dots.map((dot, i) => (
          <PulsingDot key={`dot-${i}`} {...dot} />
        ))}
      </div>

      {/* Animated Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {lines.map((line, i) => (
          <AnimatedLine key={`line-${i}`} {...line} />
        ))}
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-60 left-10 w-64 h-64 pointer-events-none hidden lg:block"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-full h-full" color={theme.primary} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="absolute bottom-40 right-10 w-48 h-48 pointer-events-none hidden lg:block"
      >
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-full h-full" color={theme.accent} />
        </motion.div>
      </motion.div>

      {/* Decorative Circles */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute top-40 right-32 w-72 h-72 rounded-full border hidden lg:block"
        style={{ borderColor: theme.primary }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute bottom-60 left-32 w-56 h-56 rounded-full border hidden lg:block"
        style={{ borderColor: theme.accent }}
      />

      {/* Filter Overlay */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 backdrop-blur-sm"
              style={{ backgroundColor: `${theme.black}50` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />
            
            {/* Mobile Drawer */}
            <motion.div
              className="fixed inset-y-0 left-0 w-full max-w-sm overflow-y-auto z-50 lg:hidden"
              style={{ backgroundColor: theme.white }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center z-10 cursor-pointer transition-colors border"
                style={{ borderColor: `${theme.primary}20`, color: theme.secondary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}30`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                className="relative shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border"
                style={{ backgroundColor: theme.white, borderColor: `${theme.primary}20` }}
              >
                <button
                  onClick={() => setShowFilters(false)}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center z-10 cursor-pointer transition-colors border"
                  style={{ borderColor: `${theme.primary}20`, color: theme.secondary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}30`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
          className="flex items-center gap-2 text-sm mb-12"
          style={{ color: `${theme.primary}80` }}
        >
          <Link 
            to="/" 
            className="transition-colors"
            style={{ color: theme.primary }}
          >
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span style={{ color: theme.secondary }}>Art Store</span>
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
            className="w-16 h-px mx-auto mb-8 origin-center"
            style={{ backgroundColor: theme.primary }}
          />

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 flex items-center justify-center border"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <FlowerDecor className="w-5 h-5" color={`${theme.primary}40`} />
            </motion.div>
          </motion.div>

          <motion.span
            variants={itemVariants}
            className="text-xs tracking-[0.3em] uppercase block mb-4"
            style={{ color: theme.secondary }}
          >
            Curated Collection
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
            style={{ color: theme.primary }}
          >
            Our Art Store
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="max-w-2xl mx-auto leading-relaxed"
            style={{ color: `${theme.secondary}cc` }}
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
          <div 
            className="backdrop-blur-md p-4 flex items-center gap-4 border"
            style={{ 
              backgroundColor: `${theme.white}e6`,
              borderColor: `${theme.primary}20`
            }}
          >
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors"
                style={{ color: isSearchFocused ? theme.primary : `${theme.primary}50` }}
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search artworks, artists, or styles..."
                className="w-full pl-12 pr-4 py-3 outline-none transition-colors bg-transparent"
                style={{ 
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: isSearchFocused ? theme.primary : `${theme.primary}20`,
                  color: theme.secondary
                }}
              />
            </div>
            
            {/* Filter Button */}
            <motion.button
              onClick={() => setShowFilters(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 font-medium transition-all flex items-center gap-3 cursor-pointer border-2"
              style={{ 
                borderColor: theme.primary, 
                color: theme.primary,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.primary;
                e.currentTarget.style.color = theme.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.primary;
              }}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:block">Filters</span>
              {activeFilterCount > 0 && (
                <span 
                  className="w-6 h-6 text-xs flex items-center justify-center"
                  style={{ backgroundColor: theme.primary, color: theme.white }}
                >
                  {activeFilterCount}
                </span>
              )}
            </motion.button>

            {/* Grid View Toggle */}
            <div 
              className="hidden md:flex border"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <button
                onClick={() => setGridView('grid')}
                className="w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: gridView === 'grid' ? theme.primary : 'transparent',
                  color: gridView === 'grid' ? theme.white : theme.secondary
                }}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGridView('large')}
                className="w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: gridView === 'large' ? theme.primary : 'transparent',
                  color: gridView === 'large' ? theme.white : theme.secondary
                }}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Quick Filters: Artists */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <h3 
            className="text-xs tracking-[0.15em] uppercase mb-3 flex items-center gap-2"
            style={{ color: `${theme.secondary}80` }}
          >
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
                className="px-5 py-2.5 font-medium text-sm transition-all whitespace-nowrap cursor-pointer"
                style={{
                  backgroundColor: selectedArtists.includes(artist._id) ? theme.primary : theme.white,
                  color: selectedArtists.includes(artist._id) ? theme.white : theme.secondary,
                  borderWidth: selectedArtists.includes(artist._id) ? 0 : 1,
                  borderStyle: 'solid',
                  borderColor: `${theme.primary}20`
                }}
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
              className="mb-8 pb-8 border-b"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span 
                  className="text-xs tracking-[0.15em] uppercase"
                  style={{ color: `${theme.secondary}80` }}
                >
                  Active Filters:
                </span>
                
                {filters.search && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-4 py-2 text-sm flex items-center gap-2"
                    style={{ backgroundColor: `${theme.accent}40`, color: theme.secondary }}
                  >
                    <Search className="w-3 h-3" />
                    "{filters.search}"
                    <button 
                      onClick={() => handleFilterChange({ search: '' })} 
                      className="cursor-pointer transition-opacity hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                
                {selectedArtists.map(artistId => {
                  const artist = artists.find(a => a._id === artistId);
                  return artist ? (
                    <motion.span 
                      key={artistId} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="px-4 py-2 text-sm flex items-center gap-2"
                      style={{ backgroundColor: theme.primary, color: theme.white }}
                    >
                      <User className="w-3 h-3" />
                      {artist.name}
                      <button 
                        onClick={() => handleArtistChange(artistId)} 
                        className="cursor-pointer transition-opacity hover:opacity-70"
                      >
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
                    className="px-4 py-2 text-sm flex items-center gap-2"
                    style={{ backgroundColor: `${theme.accent}40`, color: theme.secondary }}
                  >
                    <DollarSign className="w-3 h-3" />
                    Min: ${filters.minPrice}
                    <button 
                      onClick={() => handleFilterChange({ minPrice: '' })} 
                      className="cursor-pointer transition-opacity hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                
                {filters.maxPrice && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-4 py-2 text-sm flex items-center gap-2"
                    style={{ backgroundColor: `${theme.accent}40`, color: theme.secondary }}
                  >
                    <DollarSign className="w-3 h-3" />
                    Max: ${filters.maxPrice}
                    <button 
                      onClick={() => handleFilterChange({ maxPrice: '' })} 
                      className="cursor-pointer transition-opacity hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                
                {filters.productType && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-4 py-2 text-sm flex items-center gap-2"
                    style={{ backgroundColor: `${theme.accent}40`, color: theme.secondary }}
                  >
                    <Tag className="w-3 h-3" />
                    {filters.productType}
                    <button 
                      onClick={() => handleFilterChange({ productType: '' })} 
                      className="cursor-pointer transition-opacity hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                
                <motion.button 
                  onClick={clearFilters} 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-sm font-medium flex items-center gap-1 ml-2 cursor-pointer transition-colors"
                  style={{ color: theme.primary }}
                  onMouseEnter={(e) => e.target.style.color = theme.secondary}
                  onMouseLeave={(e) => e.target.style.color = theme.primary}
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
            <p style={{ color: `${theme.secondary}99` }}>
              <span className="font-medium" style={{ color: theme.primary }}>{pagination.total || products.length}</span> artworks found
            </p>
          </motion.div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 flex items-center justify-center mb-6 border"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <FlowerDecor className="w-8 h-8" color={`${theme.primary}40`} />
            </motion.div>
            <p style={{ color: `${theme.secondary}99` }}>Loading artworks...</p>
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
            className="text-center py-24 border"
            style={{ backgroundColor: theme.white, borderColor: `${theme.primary}20` }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 flex items-center justify-center mx-auto mb-8 border"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <Package className="w-10 h-10" style={{ color: `${theme.primary}40` }} />
            </motion.div>
            
            <h3 
              className="font-playfair text-2xl font-bold mb-3"
              style={{ color: theme.secondary }}
            >
              No artworks found
            </h3>
            <p 
              className="mb-8 max-w-md mx-auto"
              style={{ color: `${theme.secondary}b3` }}
            >
              We couldn't find any artworks matching your criteria. Try adjusting your filters or search terms.
            </p>
            <motion.button
              onClick={clearFilters}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-4 font-medium transition-colors cursor-pointer"
              style={{ backgroundColor: theme.primary, color: theme.white }}
              onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
              onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
            >
              <X className="w-5 h-5" />
              Clear all filters
            </motion.button>
          </motion.div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
        style={{ backgroundColor: theme.primary, color: theme.white }}
        onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
        onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
      >
        <ChevronUp className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default Products;