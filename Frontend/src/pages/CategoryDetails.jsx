// pages/CategoryDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Layers, 
  Hash, 
  FolderTree,
  Sparkles,
  Grid,
  List,
  ChevronRight,
  TrendingUp,
  Filter
} from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import CategoryCard from '../components/categories/CategoryCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { categoryService, productService } from '../api/services';
import { useSEO } from '../hooks/useSEO';

const CategoryDetails = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useSEO({
    title: category ? `${category.name} | Art Category` : 'Category',
    description: category?.description?.substring(0, 160) || 'Art category page',
  });

  useEffect(() => {
    fetchCategoryDetails();
  }, [slug, page, sortBy]);

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch category details
      const categoryResponse = await categoryService.getBySlug(slug);
      setCategory(categoryResponse.data);
      
      // Fetch category's products
      const productsResponse = await productService.getAll({
        category: categoryResponse.data._id,
        isActive: true,
        limit: 12,
        page,
        sortBy,
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
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h2>
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Animated Background Sketches */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-gray-300 rounded-full opacity-5"></div>
        <div className="absolute top-40 right-20 w-32 h-32 border-4 border-gray-200 rounded-full opacity-10 rotate-45"></div>
        <div className="absolute bottom-40 left-1/4 w-48 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-5"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 border border-gray-300 rotate-12 opacity-5"></div>
        <div className="absolute bottom-20 left-2/3 w-24 h-24 border-2 border-gray-400 rounded-full opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Categories
        </Link>

        {/* Category Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-xl mb-12"
        >
          <div className="grid lg:grid-cols-3">
            {/* Left: Category Image */}
            <div className="lg:col-span-1 relative h-64 lg:h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderTree className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Category Info */}
            <div className="lg:col-span-2 p-8 lg:p-12">
              <div className="mb-6">
                {category.parentCategory && (
                  <div className="text-sm text-gray-500 mb-2">
                    Subcategory of{' '}
                    <Link
                      to={`/categories/${category.parentCategory.slug}`}
                      className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      {category.parentCategory.name}
                    </Link>
                  </div>
                )}
                
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  {category.name}
                </h1>
                
                {category.description && (
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {category.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Layers size={20} />
                    {category.productsCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Artworks</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Hash size={20} />
                    {subcategories.length}
                  </div>
                  <div className="text-sm text-gray-600">Subcategories</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <FolderTree size={20} />
                    {category.parentCategory ? 'Subcategory' : 'Main Category'}
                  </div>
                  <div className="text-sm text-gray-600">Type</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <TrendingUp size={20} />
                    New
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </div>

              {/* Browse All Link */}
              {products.length > 0 && (
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 group"
                >
                  Browse Artworks
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Subcategories Section */}
        {subcategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Subcategories
                </h2>
                <p className="text-gray-600">
                  Explore more specific styles within this category
                </p>
              </div>
              <Link
                to={`/categories?parent=${category._id}`}
                className="text-gray-700 hover:text-gray-900 font-semibold flex items-center gap-2"
              >
                View all
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {subcategories.map((subcategory, index) => (
                <CategoryCard key={subcategory._id} category={subcategory} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Products Section */}
        <motion.div
          id="products"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Artworks in {category.name}
                </h2>
                <p className="text-gray-600">
                  {totalProducts} artworks found
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                  >
                    <Grid size={20} className={viewMode === 'grid' ? 'text-gray-900' : 'text-gray-500'} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                  >
                    <List size={20} className={viewMode === 'list' ? 'text-gray-900' : 'text-gray-500'} />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A-Z</option>
                    <option value="name_desc">Name: Z-A</option>
                    <option value="featured">Featured First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <>
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-6'
              }`}>
                {products.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          page === i + 1
                            ? 'bg-gray-900 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <Layers className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No artworks found
              </h3>
              <p className="text-gray-600 mb-6">
                There are no artworks in this category yet.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
              >
                Browse all artworks
                <Sparkles size={16} />
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 border-12 border-gray-100 rounded-full opacity-10"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 border-8 border-gray-200 rounded-full opacity-5 rotate-45"></div>
    </div>
  );
};

export default CategoryDetails;