// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch wishlist count when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlistCount();
    } else {
      setWishlistCount(0);
    }
  }, [isAuthenticated, user]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authService.getProfile();
        if (response.success) {
          setUser(response.data);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/v1/wishlist/count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWishlistCount(data.data?.count || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch wishlist count:', error);
    }
  };

  const updateWishlistCount = (count) => {
    setWishlistCount(count);
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        const { token, data: userData } = response;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        
        // Fetch wishlist count after successful login
        await fetchWishlistCount();
        
        toast.success('Login successful!');
        return userData;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        const { token, data: userResponse } = response;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userResponse));
        setUser(userResponse);
        setIsAuthenticated(true);
        
        // Fetch wishlist count after successful registration
        await fetchWishlistCount();
        
        toast.success('Registration successful!');
        return userResponse;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      setWishlistCount(0);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authService.updateProfile(data);
      if (response.success) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        toast.success('Profile updated successfully');
        return response.data;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const updatePassword = async (data) => {
    try {
      const response = await authService.updatePassword(data);
      if (response.success) {
        toast.success('Password updated successfully');
      } else {
        throw new Error(response.message || 'Password update failed');
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    wishlistCount,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    checkAuth,
    updateWishlistCount,
    fetchWishlistCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};