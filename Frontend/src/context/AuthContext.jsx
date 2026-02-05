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

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/wishlist/count`, {
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

        toast.success(response.message || 'Login successful!');
        return userData;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed';

      // Don't show toast for email verification errors - let the component handle it
      if (!errorMessage.toLowerCase().includes('verify') && !errorMessage.toLowerCase().includes('verification')) {
        toast.error(errorMessage);
      }

      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);

      if (response.success) {
        // Don't log user in automatically - they need to verify email first
        // Just return the response data
        toast.success(response.message || 'Registration successful! Please check your email.');
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  const verifyEmail = async (token) => {
  try {
    const response = await authService.verifyEmail(token);
    
    console.log('✅ AuthContext - Verify Email Response:', response);
    
    // The response is already unwrapped by axios interceptor
    // So response = { success: true, message: "...", ... }
    
    if (response.success) {
      return response; // Return the entire response
    } else {
      throw new Error(response.message || 'Email verification failed');
    }
  } catch (error) {
    console.error('❌ AuthContext - Verify Email Error:', error);
    throw error;
  }
};

  const resendVerification = async (email) => {
    try {
      const response = await authService.resendVerification({ email });

      if (response.success) {
        toast.success(response.message || 'Verification email sent!');
        return response; // Return the full response including alreadyVerified flag
      } else {
        throw new Error(response.message || 'Failed to send verification email');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to send verification email';
      toast.error(errorMessage);
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await authService.forgotPassword({ email });

      if (response.success) {
        toast.success(response.message || 'Password reset email sent!');
        return response;
      } else {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to send reset email';
      toast.error(errorMessage);
      throw error;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await authService.resetPassword(token, { password });

      if (response.success) {
        toast.success(response.message || 'Password reset successful!');
        return response;
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Password reset failed';
      toast.error(errorMessage);
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
        toast.success(response.message || 'Profile updated successfully');
        return response.data;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updatePassword = async (data) => {
    try {
      const response = await authService.updatePassword(data);
      if (response.success) {
        toast.success(response.message || 'Password updated successfully');
        return response;
      } else {
        throw new Error(response.message || 'Password update failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Password update failed';
      toast.error(errorMessage);
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
    // Email verification methods
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};