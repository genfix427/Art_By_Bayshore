// context/WishlistContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { wishlistService } from '../api/services';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, updateWishlistCount } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize wishlist when authenticated
  useEffect(() => {
    if (isAuthenticated && !initialized) {
      fetchWishlist();
      setInitialized(true);
    } else if (!isAuthenticated) {
      setWishlistItems([]);
      setInitialized(false);
    }
  }, [isAuthenticated, initialized]);

  const fetchWishlist = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await wishlistService.getWishlist();
      
      if (response.success) {
        const items = response.data?.items || [];
        setWishlistItems(items);
        updateWishlistCount(items.length);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error.message);
      // If it's a 404, the wishlist might not exist yet - that's okay
      if (error.response?.status !== 404) {
        toast.error('Failed to load wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      throw new Error('Please login first');
    }

    try {
      setLoading(true);
      const response = await wishlistService.addToWishlist(productId);
      
      if (response.success) {
        // Check if product already exists in wishlist
        const exists = wishlistItems.some(item => item.product?._id === productId);
        
        if (!exists) {
          // Add to local state
          const newItem = {
            product: { _id: productId },
            addedAt: new Date().toISOString()
          };
          setWishlistItems(prev => [...prev, newItem]);
          updateWishlistCount(wishlistItems.length + 1);
        }
        
        toast.success('Added to wishlist!', {
          icon: '❤️',
          style: {
            borderRadius: '10px',
            background: '#ef4444',
            color: '#fff',
          },
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        toast.error('Product already in wishlist');
      } else if (error.response?.status === 404) {
        toast.error('Product not found');
      } else {
        toast.error(error.message || 'Failed to add to wishlist');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      throw new Error('Please login first');
    }

    try {
      setLoading(true);
      const response = await wishlistService.removeFromWishlist(productId);
      
      if (response.success) {
        // Update local state
        setWishlistItems(prev => 
          prev.filter(item => item.product?._id !== productId)
        );
        updateWishlistCount(wishlistItems.length - 1);
        
        toast.success('Removed from wishlist');
      }
      
      return response;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      
      if (error.response?.status === 404) {
        toast.error('Product not found in wishlist');
      } else {
        toast.error(error.message || 'Failed to remove from wishlist');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      throw new Error('Please login first');
    }

    const isWishlisted = wishlistItems.some(item => item.product?._id === productId);
    
    if (isWishlisted) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const isWishlisted = (productId) => {
    return wishlistItems.some(item => item.product?._id === productId);
  };

  const clearWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      throw new Error('Please login first');
    }

    try {
      setLoading(true);
      const response = await wishlistService.clearWishlist();
      
      if (response.success) {
        setWishlistItems([]);
        updateWishlistCount(0);
        toast.success('Wishlist cleared');
      }
      
      return response;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error(error.message || 'Failed to clear wishlist');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getWishlistCount = async () => {
    if (!isAuthenticated) return 0;

    try {
      const response = await wishlistService.getWishlistCount();
      return response.success ? response.data?.count || 0 : 0;
    } catch (error) {
      console.error('Error getting wishlist count:', error);
      return 0;
    }
  };

  const syncWishlist = async (productIds) => {
    if (!isAuthenticated) {
      toast.error('Please login to sync wishlist');
      throw new Error('Please login first');
    }

    try {
      setLoading(true);
      const response = await wishlistService.syncWishlist(productIds);
      
      if (response.success) {
        setWishlistItems(response.data?.items || []);
        updateWishlistCount(response.data?.items?.length || 0);
        toast.success('Wishlist synced successfully');
      }
      
      return response;
    } catch (error) {
      console.error('Error syncing wishlist:', error);
      toast.error(error.message || 'Failed to sync wishlist');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      loading,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isWishlisted,
      clearWishlist,
      fetchWishlist,
      getWishlistCount,
      syncWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};