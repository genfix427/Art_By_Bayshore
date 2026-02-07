// pages/Wishlist.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Trash2, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';

const Wishlist = () => {
  useSEO({
    title: 'My Wishlist | Saved Artworks',
    description: 'Browse your saved artworks and favorite pieces',
  });

  const { isAuthenticated } = useAuth();
  const { 
    wishlistItems, 
    loading, 
    clearWishlist,
    removeFromWishlist
  } = useWishlist();
  
  const [removingId, setRemovingId] = useState(null);

  // Debug: Log wishlistItems to see structure
  useEffect(() => {
    console.log('Wishlist Items:', wishlistItems);
    console.log('Wishlist Items Length:', wishlistItems?.length);
  }, [wishlistItems]);

  // Get products from wishlist items
  const getProductsFromWishlist = () => {
    if (!wishlistItems || !Array.isArray(wishlistItems)) {
      return [];
    }
    
    // Try different possible structures
    const products = wishlistItems.map(item => {
      // Check if item is the product itself
      if (item._id && item.title) {
        return item;
      }
      
      // Check if item has a product property
      if (item.product && typeof item.product === 'object') {
        return item.product;
      }
      
      // Check if item has productId and product is populated
      if (item.productId && typeof item.productId === 'object') {
        return item.productId;
      }
      
      return null;
    }).filter(Boolean); // Remove null items
    
    console.log('Extracted Products:', products);
    return products;
  };

  const products = getProductsFromWishlist();

  const handleRemoveItem = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      return;
    }

    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Are you sure you want to clear your entire wishlist?')) {
      return;
    }

    try {
      await clearWishlist();
      toast.success('Wishlist cleared');
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
    }
  };

  // Add this function to get the correct product ID for removal
  const getProductIdFromItem = (product) => {
    return product._id || product.product?._id || product.productId?._id;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please Login
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view your wishlist
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-gray-900">My Wishlist</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                My Wishlist
              </h1>
              <p className="text-gray-600">
                {products.length} {products.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            
            {products.length > 0 && (
              <button
                onClick={handleClearWishlist}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Wishlist Content */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="large" />
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => {
                const productId = getProductIdFromItem(product);
                
                return (
                  <motion.div
                    key={productId || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="relative group"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(productId)}
                      disabled={removingId === productId}
                      className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-white disabled:opacity-50"
                      title="Remove from wishlist"
                    >
                      {removingId === productId ? (
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={18} className="text-red-600" />
                      )}
                    </button>

                    {/* Product Card */}
                    <ProductCard 
                      product={product} 
                      index={index} 
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* Empty Wishlist Message */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-600">
                  Items remain in your wishlist until you remove them
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <ArrowLeft size={18} />
                  Continue Shopping
                </Link>
              </div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {loading ? 'Loading...' : 'Your wishlist is empty'}
              </h3>
              <p className="text-gray-600 mb-6">
                {loading ? 'Fetching your saved items...' : 'Save your favorite artworks here to view them later'}
              </p>
              {!loading && (
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200"
                >
                  <Sparkles size={18} />
                  Browse Artworks
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;