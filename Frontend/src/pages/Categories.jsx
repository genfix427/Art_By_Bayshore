// pages/Categories.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Layers, 
  FolderTree,
  Sparkles,
  TrendingUp,
  Hash,
  Grid,
  List
} from 'lucide-react';
import CategoryCard from '../components/categories/CategoryCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { categoryService } from '../api/services';
import { useSEO } from '../hooks/useSEO';

const Categories = () => {
  useSEO({
    title: 'Art Categories | Browse by Style & Theme',
    description: 'Explore our art collection organized by categories, styles, and themes',
  });

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    hasSubcategories: false,
    hasProducts: false,
    parentOnly: false,
  });
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('name');
  const [selectedParent, setSelectedParent] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterAndSortCategories();
  }, [categories, search, activeFilters, sortBy, selectedParent]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll({
        isActive: true,
        limit: 100,
        populate: 'subcategories',
      });
      setCategories(response.data);
      setFilteredCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCategories = () => {
    let filtered = [...categories];

    // Search filter
    if (search) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Parent filter
    if (selectedParent) {
      filtered = filtered.filter(category => 
        category.parentCategory?._id === selectedParent
      );
    } else if (activeFilters.parentOnly) {
      filtered = filtered.filter(category => !category.parentCategory);
    }

    // Other filters
    if (activeFilters.hasSubcategories) {
      filtered = filtered.filter(category => 
        category.subcategories && category.subcategories.length > 0
      );
    }
    if (activeFilters.hasProducts) {
      filtered = filtered.filter(category => 
        (category.productsCount || 0) > 0
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'products':
          return (b.productsCount || 0) - (a.productsCount || 0);
        case 'subcategories':
          return (b.subcategories?.length || 0) - (a.subcategories?.length || 0);
        case 'displayOrder':
          return a.displayOrder - b.displayOrder;
        default:
          return 0;
      }
    });

    setFilteredCategories(filtered);
  };

  const handleFilterToggle = (filter) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  const clearFilters = () => {
    setSearch('');
    setActiveFilters({
      hasSubcategories: false,
      hasProducts: false,
      parentOnly: false,
    });
    setSelectedParent(null);
    setSortBy('name');
  };

  const getParentCategories = () => {
    return categories.filter(category => !category.parentCategory);
  };

  const hasActiveFilters = search || 
    activeFilters.hasSubcategories || 
    activeFilters.hasProducts || 
    activeFilters.parentOnly ||
    selectedParent;

  const totalProducts = categories.reduce((sum, category) => 
    sum + (category.productsCount || 0), 0
  );

  const totalSubcategories = categories.reduce((sum, category) => 
    sum + (category.subcategories?.length || 0), 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Animated Background Sketches */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-16 h-16 border-2 border-gray-300 rounded-full opacity-5 animate-pulse"></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 border-4 border-gray-200 rounded-full opacity-10"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-5"></div>
        <div className="absolute top-1/3 right-1/4 w-20 h-20 border border-gray-300 rotate-45 opacity-5"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 border-2 border-gray-400 rounded-full opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12 md:py-20"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-px bg-gray-900"></div>
            <FolderTree className="w-8 h-8 text-gray-700" />
            <div className="w-12 h-px bg-gray-900"></div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Browse by <span className="relative">
              Category
              <Sparkles className="absolute -top-4 -right-8 w-6 h-6 text-gray-600 animate-pulse" />
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
            Explore our art collection organized by artistic styles, themes, 
            and techniques to find exactly what speaks to you.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories by name or description..."
                className="w-full pl-16 pr-6 py-5 bg-white border-2 border-gray-200 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:shadow-xl transition-all duration-300"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FolderTree className="w-8 h-8 text-gray-600" />
                {categories.length}
              </div>
              <div className="text-sm text-gray-600">Total Categories</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Layers className="w-8 h-8 text-gray-600" />
                {totalProducts}
              </div>
              <div className="text-sm text-gray-600">Total Artworks</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Hash className="w-8 h-8 text-gray-600" />
                {totalSubcategories}
              </div>
              <div className="text-sm text-gray-600">Subcategories</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-gray-600" />
                {getParentCategories().length}
              </div>
              <div className="text-sm text-gray-600">Main Categories</div>
            </div>
          </div>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="text-gray-600" size={20} />
                  <span className="font-semibold text-gray-700">Filters:</span>
                </div>
                
                <button
                  onClick={() => handleFilterToggle('parentOnly')}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilters.parentOnly
                      ? 'bg-gradient-to-r from-gray-900 to-black text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FolderTree size={16} />
                  Main Categories
                </button>

                <button
                  onClick={() => handleFilterToggle('hasSubcategories')}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilters.hasSubcategories
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Hash size={16} />
                  With Subcategories
                </button>

                <button
                  onClick={() => handleFilterToggle('hasProducts')}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilters.hasProducts
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Layers size={16} />
                  With Artworks
                </button>
              </div>

              {/* Right: View and Sort Controls */}
              <div className="flex flex-wrap items-center gap-4">
                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="Grid View"
                  >
                    <Grid size={20} className={viewMode === 'grid' ? 'text-gray-900' : 'text-gray-500'} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="List View"
                  >
                    <List size={20} className={viewMode === 'list' ? 'text-gray-900' : 'text-gray-500'} />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                >
                  <option value="name">Sort by Name</option>
                  <option value="products">Most Artworks</option>
                  <option value="subcategories">Most Subcategories</option>
                  <option value="displayOrder">Display Order</option>
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors flex items-center gap-2"
                  >
                    <X size={16} />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Parent Category Filter */}
            {getParentCategories().length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Filter by Main Category:</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedParent(null)}
                    className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                      !selectedParent
                        ? 'bg-gradient-to-r from-gray-900 to-black text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {getParentCategories().map(parent => (
                    <button
                      key={parent._id}
                      onClick={() => setSelectedParent(parent._id)}
                      className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                        selectedParent === parent._id
                          ? 'bg-gradient-to-r from-gray-900 to-black text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {parent.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Categories Grid/List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="large" />
          </div>
        ) : filteredCategories.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredCategories.map((category, index) => (
                  <CategoryCard key={category._id} category={category} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCategories.map((category, index) => (
                  <div
                    key={category._id}
                    className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-6">
                      {/* Category Image */}
                      <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black flex-shrink-0">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderTree className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Category Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">
                              {category.name}
                            </h3>
                            {category.parentCategory && (
                              <div className="text-sm text-gray-500 mb-2">
                                Subcategory of{' '}
                                <span className="font-medium text-gray-700">
                                  {category.parentCategory.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {category.productsCount || 0}
                              </div>
                              <div className="text-xs text-gray-600">Artworks</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {category.subcategories?.length || 0}
                              </div>
                              <div className="text-xs text-gray-600">Subcategories</div>
                            </div>
                          </div>
                        </div>

                        {category.description && (
                          <p className="text-gray-600 mb-4">
                            {category.description}
                          </p>
                        )}

                        {/* Subcategories */}
                        {category.subcategories && category.subcategories.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-semibold text-gray-700 mb-2">
                              Subcategories:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {category.subcategories.slice(0, 5).map(sub => (
                                <span
                                  key={sub._id}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                >
                                  {sub.name}
                                </span>
                              ))}
                              {category.subcategories.length > 5 && (
                                <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">
                                  +{category.subcategories.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <a
                          href={`/categories/${category.slug || category._id}`}
                          className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                        >
                          Explore Category
                          <Sparkles size={16} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results Count */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 text-center">
                Showing <span className="font-bold text-gray-900">{filteredCategories.length}</span> of{' '}
                <span className="font-bold text-gray-900">{categories.length}</span> categories
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No categories found
              </h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any categories matching your search criteria.
              </p>
              <button
                onClick={clearFilters}
                className="px-8 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200"
              >
                Clear all filters
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Decorative Bottom Elements */}
      <div className="absolute -bottom-40 -left-40 w-96 h-96 border-12 border-gray-100 rounded-full opacity-10"></div>
      <div className="absolute -bottom-20 -right-20 w-64 h-64 border-8 border-gray-200 rounded-full opacity-5 rotate-12"></div>
    </div>
  );
};

export default Categories;