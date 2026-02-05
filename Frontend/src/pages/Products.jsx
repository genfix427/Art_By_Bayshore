// pages/Products.jsx - UPDATED VERSION
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Grid, 
  List, 
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles,
  Zap,
  Tag,
  Eye,
  Heart,
  ShoppingCart,
  Palette,
  Layers,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { productService, categoryService, artistService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { useDebounce } from '../hooks/useDebounce';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({
    category: false,
    artist: false,
    price: false,
    features: false
  });

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

  const debouncedSearch = useDebounce(filters.search, 500);

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
    filters.category, 
    filters.artist,
    filters.minPrice, 
    filters.maxPrice, 
    filters.sortBy, 
    filters.productType
  ]);

  // Close filters on escape
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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: 12,
        isActive: true,
        // Ensure search is sent correctly
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.category && { category: filters.category }),
        ...(filters.artist && { artist: filters.artist }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.productType && { productType: filters.productType }),
      };

      console.log('Fetching products with params:', params); // Debug log
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
    if (filters.category) params.category = filters.category;
    if (filters.artist) params.artist = filters.artist;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.productType) params.productType = filters.productType;
    if (filters.page > 1) params.page = filters.page.toString();
    
    setSearchParams(params, { replace: true });
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
  };

  const toggleFilterSection = (section) => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const hasActiveFilters = 
    filters.search || 
    filters.category || 
    filters.artist || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.productType;

  // Render Filters Panel
  const FiltersPanel = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Panel Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <X size={16} />
              Clear all
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">Refine your search</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Search artworks, artists..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Sort By */}
        <div>
          <div 
            className="flex items-center justify-between cursor-pointer mb-2"
            onClick={() => toggleFilterSection('sort')}
          >
            <label className="text-sm font-semibold text-gray-700">
              Sort By
            </label>
            {expandedFilters.sort ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
            <option value="name_desc">Name: Z-A</option>
          </select>
        </div>

        {/* Categories */}
        <div>
          <div 
            className="flex items-center justify-between cursor-pointer mb-2"
            onClick={() => toggleFilterSection('category')}
          >
            <label className="text-sm font-semibold text-gray-700">
              Categories
            </label>
            {expandedFilters.category ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          <AnimatePresence>
            {expandedFilters.category && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-2"
              >
                <div className="max-h-48 overflow-y-auto space-y-1">
                  <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={!filters.category}
                      onChange={() => handleFilterChange({ category: '' })}
                      className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">All Categories</span>
                  </label>
                  {categories.map(category => (
                    <label key={category._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === category._id}
                        onChange={() => handleFilterChange({ category: category._id })}
                        className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Artists */}
        <div>
          <div 
            className="flex items-center justify-between cursor-pointer mb-2"
            onClick={() => toggleFilterSection('artist')}
          >
            <label className="text-sm font-semibold text-gray-700">
              Artists
            </label>
            {expandedFilters.artist ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          <AnimatePresence>
            {expandedFilters.artist && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-2"
              >
                <div className="max-h-48 overflow-y-auto space-y-1">
                  <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="artist"
                      checked={!filters.artist}
                      onChange={() => handleFilterChange({ artist: '' })}
                      className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">All Artists</span>
                  </label>
                  {artists.map(artist => (
                    <label key={artist._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="artist"
                        checked={filters.artist === artist._id}
                        onChange={() => handleFilterChange({ artist: artist._id })}
                        className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{artist.name}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price Range */}
        <div>
          <div 
            className="flex items-center justify-between cursor-pointer mb-2"
            onClick={() => toggleFilterSection('price')}
          >
            <label className="text-sm font-semibold text-gray-700">
              Price Range
            </label>
            {expandedFilters.price ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          <AnimatePresence>
            {expandedFilters.price && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    min="0"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Discover Amazing Artworks
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Browse our curated collection from talented artists worldwide
            </p>
            
            {/* Hero Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  placeholder="Search artworks, artists, or keywords..."
                  className="w-full pl-14 pr-4 py-4 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/20 shadow-2xl"
                />
                <button 
                  onClick={() => handleFilterChange({})}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FiltersPanel />
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden flex items-center space-x-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
                  >
                    <Filter size={20} />
                    <span>Filters</span>
                    {hasActiveFilters && (
                      <span className="bg-white text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ml-1">
                        {
                          (filters.search ? 1 : 0) + 
                          (filters.category ? 1 : 0) + 
                          (filters.artist ? 1 : 0) + 
                          (filters.minPrice ? 1 : 0) + 
                          (filters.maxPrice ? 1 : 0) + 
                          (filters.productType ? 1 : 0)
                        }
                      </span>
                    )}
                  </button>
                  
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-bold text-gray-900">{products.length}</span> of{' '}
                    <span className="font-bold text-gray-900">{pagination.total || 0}</span> artworks
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* View Toggle */}
                  <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                      }`}
                    >
                      <Grid size={20} className={viewMode === 'grid' ? 'text-blue-600' : 'text-gray-500'} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                      }`}
                    >
                      <List size={20} className={viewMode === 'list' ? 'text-blue-600' : 'text-gray-500'} />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A-Z</option>
                    <option value="name_desc">Name: Z-A</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700 self-center">Active filters:</span>
                  
                  {filters.search && (
                    <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                      Search: "{filters.search}"
                      <button 
                        onClick={() => handleFilterChange({ search: '' })}
                        className="hover:text-blue-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  
                  {filters.category && (
                    <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                      Category: {categories.find(c => c._id === filters.category)?.name}
                      <button 
                        onClick={() => handleFilterChange({ category: '' })}
                        className="hover:text-green-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  
                  {filters.artist && (
                    <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                      Artist: {artists.find(a => a._id === filters.artist)?.name}
                      <button 
                        onClick={() => handleFilterChange({ artist: '' })}
                        className="hover:text-purple-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  
                  {filters.minPrice && (
                    <span className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                      Min: ${filters.minPrice}
                      <button 
                        onClick={() => handleFilterChange({ minPrice: '' })}
                        className="hover:text-yellow-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  
                  {filters.maxPrice && (
                    <span className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                      Max: ${filters.maxPrice}
                      <button 
                        onClick={() => handleFilterChange({ maxPrice: '' })}
                        className="hover:text-yellow-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  
                  <button
                    onClick={clearFilters}
                    className="text-sm font-semibold text-gray-600 hover:text-gray-900 ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="large" />
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                } gap-6 md:gap-8`}>
                  {products.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <ProductCard 
                        product={product} 
                        index={index}
                        viewMode={viewMode}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                    <Search className="text-blue-500" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    No artworks found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {filters.search 
                      ? `No results found for "${filters.search}". Try a different search term.`
                      : 'No artworks match your filters. Try adjusting your criteria.'
                    }
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Clear all filters
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Modal for Mobile */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-full sm:w-96 bg-white z-50 overflow-y-auto lg:hidden"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-4">
                <FiltersPanel />
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;