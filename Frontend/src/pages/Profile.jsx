import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { authService } from '../api/services';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Save,
  Loader2,
  Check,
  AlertCircle,
  Shield,
  Camera,
  Edit3,
  LogOut,
  ChevronRight,
  Calendar,
  MapPin,
  Bell,
  Heart,
  ShoppingBag,
  Settings
} from 'lucide-react';

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.08, 0.08, 0],
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

// Password strength indicator
const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength();
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  
  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3"
    >
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <motion.div
            key={level}
            className={`h-1 flex-1 ${
              level <= strength 
                ? strength <= 2 ? 'bg-red-400' : strength <= 3 ? 'bg-yellow-400' : 'bg-green-400'
                : 'bg-gray-200'
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: level <= strength ? 1 : 0.3 }}
            transition={{ duration: 0.3, delay: level * 0.05 }}
          />
        ))}
      </div>
      <p className={`text-xs ${
        strength <= 2 ? 'text-red-500' : strength <= 3 ? 'text-yellow-600' : 'text-green-600'
      }`}>
        {labels[strength - 1] || 'Too short'}
      </p>
    </motion.div>
  );
};

const Profile = () => {
  useSEO({ title: 'My Profile | Art Haven' });
  const { user, updateProfile, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [focused, setFocused] = useState({});
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });

  // Generate floating petals
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 10 + i * 12,
    duration: 18 + Math.random() * 10,
    size: 10 + Math.random() * 8,
  }));

  // Tabs configuration
  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  // Sidebar menu items
  const menuItems = [
    { icon: ShoppingBag, label: 'My Orders', href: '/orders' },
    { icon: Heart, label: 'Wishlist', href: '/wishlist' },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
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

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: { duration: 0.3 }
    },
  };

  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleFocus = (field) => setFocused({ ...focused, [field]: true });
  const handleBlur = (field) => setFocused({ ...focused, [field]: false });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      showFeedback('Profile updated successfully', 'success');
    } catch (error) {
      showFeedback(error.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showFeedback('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showFeedback('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showFeedback('Password updated successfully', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showFeedback(error.message || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = passwordData.newPassword && 
    passwordData.confirmPassword && 
    passwordData.newPassword === passwordData.confirmPassword;

  const getInitials = () => {
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
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

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-2 ${
              feedback.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
            } text-white shadow-lg`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8 }}
            className="w-12 h-px bg-gray-900 mb-6 origin-left"
          />
          <h1 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
            My Account
          </h1>
          <p className="text-gray-900/50 text-sm tracking-wide">
            Manage your profile and account settings
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-1"
          >
            {/* User Card */}
            <motion.div
              variants={itemVariants}
              className="relative bg-white border border-gray-900/10 p-6 mb-6"
            >

              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-24 h-24 bg-gray-900 text-white flex items-center justify-center text-2xl font-playfair font-bold rounded-b-full"
                  >
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials()
                    )}
                  </motion.div>
                </div>

                <h3 className="font-playfair text-xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-900/50 mt-1">{user?.email}</p>
                
                {/* Member since */}
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-900/40">
                  <Calendar className="w-3 h-3" />
                  <span>Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</span>
                </div>
              </div>
            </motion.div>

            {/* Navigation Menu */}
            <motion.div
              variants={itemVariants}
              className="relative bg-white border border-gray-900/10"
            >

              <nav className="py-2">
                {menuItems.map((item, index) => (
                  <motion.a
                    key={index}
                    href={item.href}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between px-6 py-3 text-gray-900/70 hover:text-gray-900 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.a>
                ))}
                
                {/* Logout */}
                <motion.button
                  onClick={logout}
                  whileHover={{ x: 4 }}
                  className="w-full flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 transition-colors mt-2 border-t border-gray-900/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </motion.button>
              </nav>
            </motion.div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-3"
          >
            {/* Tabs */}
            <motion.div variants={itemVariants} className="mb-6">
              <div className="flex border-b border-gray-900/10">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors cursor-pointer ${
                      activeTab === tab.id 
                        ? 'text-gray-900' 
                        : 'text-gray-900/50 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-px bg-gray-900"
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="relative bg-white border border-gray-900/10 p-6 sm:p-8"
                >

                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 border border-gray-900/10 flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-gray-900" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-2xl font-bold text-gray-900">
                        Profile Information
                      </h2>
                      <p className="text-sm text-gray-900/50">
                        Update your personal details
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                          First Name
                        </label>
                        <div className="relative">
                          <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                            focused.firstName ? 'text-gray-900' : 'text-gray-900/30'
                          }`} />
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            onFocus={() => handleFocus('firstName')}
                            onBlur={() => handleBlur('firstName')}
                            required
                            className="w-full pl-12 pr-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-transparent text-gray-900"
                            placeholder="Enter first name"
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 h-px bg-gray-900"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focused.firstName ? 1 : 0 }}
                            style={{ originX: 0 }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                          Last Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            onFocus={() => handleFocus('lastName')}
                            onBlur={() => handleBlur('lastName')}
                            required
                            className="w-full px-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-transparent text-gray-900"
                            placeholder="Enter last name"
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 h-px bg-gray-900"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focused.lastName ? 1 : 0 }}
                            style={{ originX: 0 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-900/30" />
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full pl-12 pr-4 py-4 border border-gray-900/10 bg-gray-50 text-gray-900/50 cursor-not-allowed"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-900/40 bg-gray-100 px-2 py-1">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-gray-900/40 mt-2">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                          focused.phoneNumber ? 'text-gray-900' : 'text-gray-900/30'
                        }`} />
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          onFocus={() => handleFocus('phoneNumber')}
                          onBlur={() => handleBlur('phoneNumber')}
                          className="w-full pl-12 pr-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-transparent text-gray-900"
                          placeholder="+1 (555) 000-0000"
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-px bg-gray-900"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.phoneNumber ? 1 : 0 }}
                          style={{ originX: 0 }}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-gray-900/10">
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className="bg-gray-900 text-white px-8 py-4 font-medium hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="relative bg-white border border-gray-900/10 p-6 sm:p-8"
                >

                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 border border-gray-900/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gray-900" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-2xl font-bold text-gray-900">
                        Change Password
                      </h2>
                      <p className="text-sm text-gray-900/50">
                        Ensure your account stays secure
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                          focused.currentPassword ? 'text-gray-900' : 'text-gray-900/30'
                        }`} />
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          onFocus={() => handleFocus('currentPassword')}
                          onBlur={() => handleBlur('currentPassword')}
                          required
                          className="w-full pl-12 pr-12 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-transparent text-gray-900"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900/30 hover:text-gray-900 transition-colors"
                        >
                          {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <motion.div
                          className="absolute bottom-0 left-0 h-px bg-gray-900"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.currentPassword ? 1 : 0 }}
                          style={{ originX: 0 }}
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                          focused.newPassword ? 'text-gray-900' : 'text-gray-900/30'
                        }`} />
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          onFocus={() => handleFocus('newPassword')}
                          onBlur={() => handleBlur('newPassword')}
                          required
                          minLength="8"
                          className="w-full pl-12 pr-12 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-transparent text-gray-900"
                          placeholder="Min. 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900/30 hover:text-gray-900 transition-colors"
                        >
                          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <motion.div
                          className="absolute bottom-0 left-0 h-px bg-gray-900"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.newPassword ? 1 : 0 }}
                          style={{ originX: 0 }}
                        />
                      </div>
                      <PasswordStrength password={passwordData.newPassword} />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                          focused.confirmPassword ? 'text-gray-900' : 'text-gray-900/30'
                        }`} />
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          onFocus={() => handleFocus('confirmPassword')}
                          onBlur={() => handleBlur('confirmPassword')}
                          required
                          minLength="8"
                          className={`w-full pl-12 pr-12 py-4 border outline-none transition-all duration-300 bg-transparent text-gray-900 ${
                            passwordData.confirmPassword 
                              ? passwordsMatch 
                                ? 'border-green-500 focus:border-green-600' 
                                : 'border-red-400 focus:border-red-500'
                              : 'border-gray-900/10 focus:border-gray-900'
                          }`}
                          placeholder="Confirm new password"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {passwordData.confirmPassword && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              {passwordsMatch ? (
                                <Check className="w-5 h-5 text-green-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-400" />
                              )}
                            </motion.div>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="text-gray-900/30 hover:text-gray-900 transition-colors"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <motion.div
                          className="absolute bottom-0 left-0 h-px bg-gray-900"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.confirmPassword ? 1 : 0 }}
                          style={{ originX: 0 }}
                        />
                      </div>
                      <AnimatePresence>
                        {passwordData.confirmPassword && !passwordsMatch && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-red-500 text-xs mt-2"
                          >
                            Passwords do not match
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 p-4 border border-gray-900/5">
                      <p className="text-xs text-gray-900/50 uppercase tracking-wide mb-3">
                        Password Requirements
                      </p>
                      <ul className="space-y-2 text-sm text-gray-900/60">
                        {[
                          { check: passwordData.newPassword.length >= 8, text: 'At least 8 characters' },
                          { check: /[A-Z]/.test(passwordData.newPassword), text: 'One uppercase letter' },
                          { check: /[a-z]/.test(passwordData.newPassword), text: 'One lowercase letter' },
                          { check: /[0-9]/.test(passwordData.newPassword), text: 'One number' },
                          { check: /[^A-Za-z0-9]/.test(passwordData.newPassword), text: 'One special character' },
                        ].map((item, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ 
                                scale: 1,
                                color: item.check ? '#10b981' : '#9ca3af'
                              }}
                            >
                              {item.check ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <div className="w-4 h-4 border border-current rounded-full" />
                              )}
                            </motion.div>
                            <span className={item.check ? 'text-green-600' : ''}>
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-gray-900/10">
                      <motion.button
                        type="submit"
                        disabled={loading || !passwordsMatch}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className="bg-gray-900 text-white px-8 py-4 font-medium hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5" />
                            <span>Update Password</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security Tips */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 relative bg-white border border-gray-900/10 p-6"
              >

                <h3 className="text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-4">
                  Security Tips
                </h3>
                <ul className="space-y-3 text-sm text-gray-900/70">
                  <li className="flex items-start gap-3">
                    <FlowerDecor className="w-4 h-4 text-gray-900/20 flex-shrink-0 mt-0.5" />
                    <span>Use a unique password that you don't use for other accounts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FlowerDecor className="w-4 h-4 text-gray-900/20 flex-shrink-0 mt-0.5" />
                    <span>Consider using a password manager to generate and store passwords</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FlowerDecor className="w-4 h-4 text-gray-900/20 flex-shrink-0 mt-0.5" />
                    <span>Never share your password with anyone</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5 }}
        className="w-32 h-px bg-gray-900/10 mx-auto my-16"
      />
    </div>
  );
};

export default Profile;