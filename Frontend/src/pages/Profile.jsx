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
      opacity: [0, 0.15, 0.15, 0],
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
      opacity: [0, 0.12, 0.12, 0],
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
      opacity: [0, 0.1, 0.1, 0],
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
  const colors = ['#EF4444', '#EF4444', '#F59E0B', '#10B981', '#10B981'];
  
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
            className="h-1 flex-1"
            style={{
              backgroundColor: level <= strength ? colors[strength - 1] : `${theme.accent}50`
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: level <= strength ? 1 : 0.3 }}
            transition={{ duration: 0.3, delay: level * 0.05 }}
          />
        ))}
      </div>
      <p 
        className="text-xs"
        style={{ color: colors[strength - 1] || theme.secondary }}
      >
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

  // Generate floating shapes
  const shapes = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 2.5,
    startX: 8 + i * 15,
    duration: 22 + Math.random() * 10,
    type: ['circle', 'square', 'triangle'][i % 3],
  }));

  // Generate pulsing dots
  const dots = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 2,
    position: {
      top: `${20 + i * 20}%`,
      left: i % 2 === 0 ? '3%' : '97%',
    },
    size: 6 + Math.random() * 6,
  }));

  // Generate animated lines
  const lines = Array.from({ length: 3 }).map((_, i) => ({
    delay: i * 4,
    vertical: i % 2 === 0,
    position: {
      top: `${25 + i * 25}%`,
      [i % 2 === 0 ? 'right' : 'left']: '5%',
    },
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
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: theme.white }}
    >
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

      {/* Decorative Circles */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute top-20 right-20 w-64 h-64 rounded-full border hidden lg:block pointer-events-none"
        style={{ borderColor: theme.primary }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute bottom-32 left-20 w-48 h-48 rounded-full border hidden lg:block pointer-events-none"
        style={{ borderColor: theme.accent }}
      />

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-2 shadow-lg"
            style={{ 
              backgroundColor: feedback.type === 'error' ? '#EF4444' : theme.primary,
              color: theme.white
            }}
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
            className="w-12 h-px mb-6 origin-left"
            style={{ backgroundColor: theme.primary }}
          />
          <h1 
            className="font-playfair text-4xl lg:text-5xl font-bold mb-2"
            style={{ color: theme.primary }}
          >
            My Account
          </h1>
          <p 
            className="text-sm tracking-wide"
            style={{ color: `${theme.secondary}80` }}
          >
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
              className="relative p-6 mb-6 border"
              style={{ 
                backgroundColor: theme.white,
                borderColor: `${theme.primary}20`
              }}
            >
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-24 h-24 flex items-center justify-center text-2xl font-playfair font-bold rounded-full"
                    style={{ backgroundColor: theme.primary, color: theme.white }}
                  >
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      getInitials()
                    )}
                  </motion.div>
                </div>

                <h3 
                  className="font-playfair text-xl font-bold"
                  style={{ color: theme.secondary }}
                >
                  {user?.firstName} {user?.lastName}
                </h3>
                <p 
                  className="text-sm mt-1"
                  style={{ color: `${theme.secondary}80` }}
                >
                  {user?.email}
                </p>
                
                {/* Member since */}
                <div 
                  className="flex items-center justify-center gap-2 mt-4 text-xs"
                  style={{ color: `${theme.secondary}60` }}
                >
                  <Calendar className="w-3 h-3" style={{ color: theme.primary }} />
                  <span>Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</span>
                </div>
              </div>
            </motion.div>

            {/* Navigation Menu */}
            <motion.div
              variants={itemVariants}
              className="relative border"
              style={{ 
                backgroundColor: theme.white,
                borderColor: `${theme.primary}20`
              }}
            >
              <nav className="py-2">
                {menuItems.map((item, index) => (
                  <motion.a
                    key={index}
                    href={item.href}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between px-6 py-3 transition-colors group"
                    style={{ color: `${theme.secondary}b3` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.secondary;
                      e.currentTarget.style.backgroundColor = `${theme.accent}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = `${theme.secondary}b3`;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" style={{ color: theme.primary }} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.a>
                ))}
                
                {/* Logout */}
                <motion.button
                  onClick={logout}
                  whileHover={{ x: 4 }}
                  className="w-full flex items-center gap-3 px-6 py-3 transition-colors mt-2 cursor-pointer border-t"
                  style={{ 
                    color: '#EF4444',
                    borderColor: `${theme.primary}20`
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
              <div 
                className="flex border-b"
                style={{ borderColor: `${theme.primary}20` }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors cursor-pointer"
                    style={{ 
                      color: activeTab === tab.id ? theme.primary : `${theme.secondary}80`
                    }}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: theme.primary }}
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
                  className="relative p-6 sm:p-8 border"
                  style={{ 
                    backgroundColor: theme.white,
                    borderColor: `${theme.primary}20`
                  }}
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div 
                      className="w-10 h-10 flex items-center justify-center border"
                      style={{ borderColor: `${theme.primary}30` }}
                    >
                      <Edit3 className="w-5 h-5" style={{ color: theme.primary }} />
                    </div>
                    <div>
                      <h2 
                        className="font-playfair text-2xl font-bold"
                        style={{ color: theme.secondary }}
                      >
                        Profile Information
                      </h2>
                      <p 
                        className="text-sm"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        Update your personal details
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label 
                          className="block text-xs tracking-[0.2em] uppercase mb-3"
                          style={{ color: `${theme.secondary}80` }}
                        >
                          First Name
                        </label>
                        <div className="relative">
                          <User 
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300"
                            style={{ color: focused.firstName ? theme.primary : `${theme.primary}50` }}
                          />
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            onFocus={() => handleFocus('firstName')}
                            onBlur={() => handleBlur('firstName')}
                            required
                            className="w-full pl-12 pr-4 py-4 outline-none transition-all duration-300 bg-transparent"
                            style={{ 
                              borderWidth: 1,
                              borderStyle: 'solid',
                              borderColor: focused.firstName ? theme.primary : `${theme.primary}20`,
                              color: theme.secondary
                            }}
                            placeholder="Enter first name"
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 h-px"
                            style={{ backgroundColor: theme.primary }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focused.firstName ? 1 : 0 }}
                          />
                        </div>
                      </div>

                      <div>
                        <label 
                          className="block text-xs tracking-[0.2em] uppercase mb-3"
                          style={{ color: `${theme.secondary}80` }}
                        >
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
                            className="w-full px-4 py-4 outline-none transition-all duration-300 bg-transparent"
                            style={{ 
                              borderWidth: 1,
                              borderStyle: 'solid',
                              borderColor: focused.lastName ? theme.primary : `${theme.primary}20`,
                              color: theme.secondary
                            }}
                            placeholder="Enter last name"
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 h-px"
                            style={{ backgroundColor: theme.primary }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focused.lastName ? 1 : 0 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label 
                        className="block text-xs tracking-[0.2em] uppercase mb-3"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail 
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                          style={{ color: `${theme.primary}50` }}
                        />
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full pl-12 pr-4 py-4 cursor-not-allowed"
                          style={{ 
                            backgroundColor: `${theme.accent}15`,
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: `${theme.primary}15`,
                            color: `${theme.secondary}80`
                          }}
                        />
                        <span 
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs px-2 py-1"
                          style={{ 
                            backgroundColor: `${theme.accent}30`,
                            color: theme.primary
                          }}
                        >
                          Verified
                        </span>
                      </div>
                      <p 
                        className="text-xs mt-2"
                        style={{ color: `${theme.secondary}60` }}
                      >
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label 
                        className="block text-xs tracking-[0.2em] uppercase mb-3"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone 
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300"
                          style={{ color: focused.phoneNumber ? theme.primary : `${theme.primary}50` }}
                        />
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          onFocus={() => handleFocus('phoneNumber')}
                          onBlur={() => handleBlur('phoneNumber')}
                          className="w-full pl-12 pr-4 py-4 outline-none transition-all duration-300 bg-transparent"
                          style={{ 
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: focused.phoneNumber ? theme.primary : `${theme.primary}20`,
                            color: theme.secondary
                          }}
                          placeholder="+1 (555) 000-0000"
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-px"
                          style={{ backgroundColor: theme.primary }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.phoneNumber ? 1 : 0 }}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div 
                      className="pt-4 border-t"
                      style={{ borderColor: `${theme.primary}20` }}
                    >
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className="px-8 py-4 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 cursor-pointer"
                        style={{ backgroundColor: theme.primary, color: theme.white }}
                        onMouseEnter={(e) => {
                          if (!loading) e.target.style.backgroundColor = theme.secondary;
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) e.target.style.backgroundColor = theme.primary;
                        }}
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
                  className="relative p-6 sm:p-8 border"
                  style={{ 
                    backgroundColor: theme.white,
                    borderColor: `${theme.primary}20`
                  }}
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div 
                      className="w-10 h-10 flex items-center justify-center border"
                      style={{ borderColor: `${theme.primary}30` }}
                    >
                      <Shield className="w-5 h-5" style={{ color: theme.primary }} />
                    </div>
                    <div>
                      <h2 
                        className="font-playfair text-2xl font-bold"
                        style={{ color: theme.secondary }}
                      >
                        Change Password
                      </h2>
                      <p 
                        className="text-sm"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        Ensure your account stays secure
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label 
                        className="block text-xs tracking-[0.2em] uppercase mb-3"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock 
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300"
                          style={{ color: focused.currentPassword ? theme.primary : `${theme.primary}50` }}
                        />
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          onFocus={() => handleFocus('currentPassword')}
                          onBlur={() => handleBlur('currentPassword')}
                          required
                          className="w-full pl-12 pr-12 py-4 outline-none transition-all duration-300 bg-transparent"
                          style={{ 
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: focused.currentPassword ? theme.primary : `${theme.primary}20`,
                            color: theme.secondary
                          }}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: `${theme.secondary}50` }}
                          onMouseEnter={(e) => e.target.style.color = theme.primary}
                          onMouseLeave={(e) => e.target.style.color = `${theme.secondary}50`}
                        >
                          {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <motion.div
                          className="absolute bottom-0 left-0 h-px"
                          style={{ backgroundColor: theme.primary }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.currentPassword ? 1 : 0 }}
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label 
                        className="block text-xs tracking-[0.2em] uppercase mb-3"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <Lock 
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300"
                          style={{ color: focused.newPassword ? theme.primary : `${theme.primary}50` }}
                        />
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          onFocus={() => handleFocus('newPassword')}
                          onBlur={() => handleBlur('newPassword')}
                          required
                          minLength="8"
                          className="w-full pl-12 pr-12 py-4 outline-none transition-all duration-300 bg-transparent"
                          style={{ 
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: focused.newPassword ? theme.primary : `${theme.primary}20`,
                            color: theme.secondary
                          }}
                          placeholder="Min. 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: `${theme.secondary}50` }}
                          onMouseEnter={(e) => e.target.style.color = theme.primary}
                          onMouseLeave={(e) => e.target.style.color = `${theme.secondary}50`}
                        >
                          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <motion.div
                          className="absolute bottom-0 left-0 h-px"
                          style={{ backgroundColor: theme.primary }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.newPassword ? 1 : 0 }}
                        />
                      </div>
                      <PasswordStrength password={passwordData.newPassword} />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label 
                        className="block text-xs tracking-[0.2em] uppercase mb-3"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock 
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300"
                          style={{ color: focused.confirmPassword ? theme.primary : `${theme.primary}50` }}
                        />
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          onFocus={() => handleFocus('confirmPassword')}
                          onBlur={() => handleBlur('confirmPassword')}
                          required
                          minLength="8"
                          className="w-full pl-12 pr-12 py-4 outline-none transition-all duration-300 bg-transparent"
                          style={{ 
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: passwordData.confirmPassword 
                              ? passwordsMatch 
                                ? '#10B981' 
                                : '#EF4444'
                              : focused.confirmPassword ? theme.primary : `${theme.primary}20`,
                            color: theme.secondary
                          }}
                          placeholder="Confirm new password"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {passwordData.confirmPassword && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              {passwordsMatch ? (
                                <Check className="w-5 h-5" style={{ color: '#10B981' }} />
                              ) : (
                                <AlertCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
                              )}
                            </motion.div>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="transition-colors"
                            style={{ color: `${theme.secondary}50` }}
                            onMouseEnter={(e) => e.target.style.color = theme.primary}
                            onMouseLeave={(e) => e.target.style.color = `${theme.secondary}50`}
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <motion.div
                          className="absolute bottom-0 left-0 h-px"
                          style={{ backgroundColor: theme.primary }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.confirmPassword ? 1 : 0 }}
                        />
                      </div>
                      <AnimatePresence>
                        {passwordData.confirmPassword && !passwordsMatch && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs mt-2"
                            style={{ color: '#EF4444' }}
                          >
                            Passwords do not match
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Password Requirements */}
                    <div 
                      className="p-4 border"
                      style={{ 
                        backgroundColor: `${theme.accent}10`,
                        borderColor: `${theme.primary}15`
                      }}
                    >
                      <p 
                        className="text-xs uppercase tracking-wide mb-3"
                        style={{ color: theme.primary }}
                      >
                        Password Requirements
                      </p>
                      <ul className="space-y-2 text-sm">
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
                              animate={{ scale: 1 }}
                              style={{ color: item.check ? '#10B981' : `${theme.secondary}60` }}
                            >
                              {item.check ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <div 
                                  className="w-4 h-4 border rounded-full"
                                  style={{ borderColor: 'currentColor' }}
                                />
                              )}
                            </motion.div>
                            <span style={{ color: item.check ? '#10B981' : `${theme.secondary}99` }}>
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <div 
                      className="pt-4 border-t"
                      style={{ borderColor: `${theme.primary}20` }}
                    >
                      <motion.button
                        type="submit"
                        disabled={loading || !passwordsMatch}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className="px-8 py-4 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 cursor-pointer"
                        style={{ backgroundColor: theme.primary, color: theme.white }}
                        onMouseEnter={(e) => {
                          if (!loading && passwordsMatch) e.target.style.backgroundColor = theme.secondary;
                        }}
                        onMouseLeave={(e) => {
                          if (!loading && passwordsMatch) e.target.style.backgroundColor = theme.primary;
                        }}
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
                className="mt-6 relative p-6 border"
                style={{ 
                  backgroundColor: theme.white,
                  borderColor: `${theme.primary}20`
                }}
              >
                <h3 
                  className="text-xs tracking-[0.2em] uppercase mb-4"
                  style={{ color: theme.primary }}
                >
                  Security Tips
                </h3>
                <ul className="space-y-3 text-sm">
                  <li 
                    className="flex items-start gap-3"
                    style={{ color: `${theme.secondary}b3` }}
                  >
                    <FlowerDecor className="w-4 h-4 flex-shrink-0 mt-0.5" color={`${theme.primary}40`} />
                    <span>Use a unique password that you don't use for other accounts</span>
                  </li>
                  <li 
                    className="flex items-start gap-3"
                    style={{ color: `${theme.secondary}b3` }}
                  >
                    <FlowerDecor className="w-4 h-4 flex-shrink-0 mt-0.5" color={`${theme.primary}40`} />
                    <span>Consider using a password manager to generate and store passwords</span>
                  </li>
                  <li 
                    className="flex items-start gap-3"
                    style={{ color: `${theme.secondary}b3` }}
                  >
                    <FlowerDecor className="w-4 h-4 flex-shrink-0 mt-0.5" color={`${theme.primary}40`} />
                    <span>Never share your password with anyone</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom Decoration */}
      <div className="flex justify-center my-16">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5 }}
          className="w-32 h-px"
          style={{ backgroundColor: `${theme.primary}25` }}
        />
      </div>

      {/* Bottom rotating flower */}
      <div className="flex justify-center mb-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-6 h-6" color={`${theme.primary}30`} />
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;