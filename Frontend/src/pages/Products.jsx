// pages/Products.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  ChevronUp,
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
  const [showFilters, setShowFilters] = useState(false);

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

  // For multi-select (like store page)
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('categories') ? searchParams.get('categories').split(',') : []
  );
  const [selectedArtists, setSelectedArtists] = useState(
    searchParams.get('artists') ? searchParams.get('artists').split(',') : []
  );

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

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(artistSearch.toLowerCase())
  );

  // Filters Panel Component
  const FiltersPanel = () => (
    <div className="p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-700 hover:text-gray-800 font-semibold cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <label className="block text-base font-semibold text-gray-700 mb-2 cursor-pointer">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 cursor-pointer"
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
      <div className="mb-6">
        <label className="block text-base font-semibold text-gray-700 mb-2">
          Price Range ($)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            min="0"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            min="0"
          />
        </div>
      </div>

      {/* Product Type Filter */}
      <div className="mb-6">
        <label className="block text-base font-semibold text-gray-700 mb-2 cursor-pointer">
          Product Type
        </label>
        <select
          value={filters.productType}
          onChange={(e) => handleFilterChange({ productType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="original">Original</option>
          <option value="print">Print</option>
          <option value="digital">Digital</option>
        </select>
      </div>

      {/* Categories with Search */}
      <div className="mb-6 category-dropdown">
        <label className="block text-base font-semibold text-gray-700 mb-2">
          Categories
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            onFocus={() => setShowCategoryDropdown(true)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
          />
          {showCategoryDropdown ? (
            <ChevronUp className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          ) : (
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          )}
          
          {showCategoryDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="p-2 space-y-1">
                {filteredCategories.map(category => (
                  <label key={category._id} className="flex items-center p-2 hover:bg-neutral-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category._id)}
                      onChange={() => handleCategoryChange(category._id)}
                      className="rounded border-gray-300 text-gray-700 focus:ring-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="p-2 text-sm text-gray-500 text-center">No categories found</div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedCategories.map(catId => {
              const category = categories.find(c => c._id === catId);
              return category ? (
                <span key={catId} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center">
                  {category.name}
                  <button
                    onClick={() => handleCategoryChange(catId)}
                    className="ml-1 hover:text-gray-900 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Artists with Search */}
      <div className="mb-6 artist-dropdown">
        <label className="block text-base font-semibold text-gray-700 mb-2">
          Artists
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search artists..."
            value={artistSearch}
            onChange={(e) => setArtistSearch(e.target.value)}
            onFocus={() => setShowArtistDropdown(true)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
          />
          {showArtistDropdown ? (
            <ChevronUp className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          ) : (
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          )}
          
          {showArtistDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="p-2 space-y-1">
                {filteredArtists.map(artist => (
                  <label key={artist._id} className="flex items-center p-2 hover:bg-neutral-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedArtists.includes(artist._id)}
                      onChange={() => handleArtistChange(artist._id)}
                      className="rounded border-gray-300 text-gray-700 focus:ring-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{artist.name}</span>
                  </label>
                ))}
                {filteredArtists.length === 0 && (
                  <div className="p-2 text-sm text-gray-500 text-center">No artists found</div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Selected Artists */}
        {selectedArtists.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedArtists.map(artistId => {
              const artist = artists.find(a => a._id === artistId);
              return artist ? (
                <span key={artistId} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center">
                  {artist.name}
                  <button
                    onClick={() => handleArtistChange(artistId)}
                    className="ml-1 hover:text-gray-900 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
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
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            pagination.page === i
              ? 'bg-gray-700 text-white border border-gray-700'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-neutral-50'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-8 border-t border-neutral-200 space-y-4 sm:space-y-0">
        <div className="text-sm text-gray-600 cursor-pointer">
          Showing <span className="font-bold">{((pagination.page - 1) * 12) + 1} - {Math.min(pagination.page * 12, pagination.total)}</span> of <span className="font-bold">{pagination.total}</span> products
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(Math.max(pagination.page - 1, 1))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 font-semibold cursor-pointer"
          >
            Previous
          </button>
          {pages}
          <button
            onClick={() => handlePageChange(Math.min(pagination.page + 1, pagination.totalPages))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 font-semibold cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 relative overflow-x-hidden">

      {/* Filter Overlay */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />
            
            {/* Mobile Drawer */}
            <motion.div
              className="fixed inset-y-0 left-0 w-80 bg-white overflow-y-auto z-50 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg z-10 cursor-pointer"
              >
                <X size={24} />
              </button>
              <FiltersPanel />
            </motion.div>
            
            {/* Desktop Modal */}
            <motion.div
              className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowFilters(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg z-10 cursor-pointer"
                >
                  <X size={24} />
                </button>
                <FiltersPanel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">Our Art Store</h1>
          <p className="text-gray-600 mt-2 text-lg">Discover unique artworks from talented artists</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="sticky top-4 z-20 bg-neutral-50/80 backdrop-blur-sm py-4 mb-6 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                placeholder="Search artworks, artists, or tags..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-neutral-100 flex items-center gap-2 bg-white font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Filter size={20} className="text-gray-700" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-gray-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {
                    (filters.search ? 1 : 0) + 
                    selectedCategories.length + 
                    selectedArtists.length + 
                    (filters.minPrice ? 1 : 0) + 
                    (filters.maxPrice ? 1 : 0) + 
                    (filters.productType ? 1 : 0)
                  }
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Quick Filters: Categories */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wider">Categories</h3>
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category._id}
                onClick={() => handleCategoryChange(category._id)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors border whitespace-nowrap cursor-pointer ${
                  selectedCategories.includes(category._id)
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-neutral-50 hover:border-gray-400'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quick Filters: Artists */}
        <div className="mb-8">
           <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wider">Artists</h3>
           <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            {artists.map(artist => (
              <button
                key={artist._id}
                onClick={() => handleArtistChange(artist._id)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors border whitespace-nowrap cursor-pointer ${
                  selectedArtists.includes(artist._id)
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-neutral-50 hover:border-gray-400'
                }`}
              >
                {artist.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-neutral-200">
              <span className="text-sm font-semibold text-gray-700 self-center">Active:</span>
              {filters.search && (
                <span className="bg-neutral-200 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  Search: "{filters.search}"
                  <button onClick={() => handleFilterChange({ search: '' })} className="hover:text-black cursor-pointer"><X size={14} /></button>
                </span>
              )}
              {selectedCategories.map(catId => {
                const category = categories.find(c => c._id === catId);
                return category ? (
                  <span key={catId} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {category.name}
                    <button onClick={() => handleCategoryChange(catId)} className="hover:text-green-900 cursor-pointer"><X size={14} /></button>
                  </span>
                ) : null;
              })}
              {selectedArtists.map(artistId => {
                const artist = artists.find(a => a._id === artistId);
                return artist ? (
                  <span key={artistId} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {artist.name}
                    <button onClick={() => handleArtistChange(artistId)} className="hover:text-purple-900 cursor-pointer"><X size={14} /></button>
                  </span>
                ) : null;
              })}
              {filters.minPrice && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  Min: ${filters.minPrice}
                  <button onClick={() => handleFilterChange({ minPrice: '' })} className="hover:text-yellow-900 cursor-pointer"><X size={14} /></button>
                </span>
              )}
              {filters.maxPrice && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  Max: ${filters.maxPrice}
                  <button onClick={() => handleFilterChange({ maxPrice: '' })} className="hover:text-yellow-900 cursor-pointer"><X size={14} /></button>
                </span>
              )}
              {filters.productType && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  Type: {filters.productType}
                  <button onClick={() => handleFilterChange({ productType: '' })} className="hover:text-blue-900 cursor-pointer"><X size={14} /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-gray-700 hover:underline text-sm font-semibold ml-2 cursor-pointer">Clear All</button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ProductCard product={product} index={index} />
                  </motion.div>
                ))}
              </div>
              {renderPagination()}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md border border-neutral-200">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
              <button
                onClick={clearFilters}
                className="bg-gray-700 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors font-semibold cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;