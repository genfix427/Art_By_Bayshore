import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  Settings,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CompanyLogo from '../../assets/ABBS_LOGO_O.png';

// Theme Colors
const theme = {
  primary: '#4169E1',    // Royal Blue
  secondary: '#1E3A5F',  // Deep Navy
  accent: '#B0C4DE',     // Light Steel Blue
  black: '#111111',
  white: '#FFFFFF',
};

// Custom hook (no changes)
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const Header = () => {
  const { isAuthenticated, user, logout, wishlistCount } = useAuth();
  const { cartItemsCount } = useCart();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const navigate = useNavigate();
  const avatarMenuRef = useRef(null);

  useClickOutside(avatarMenuRef, () => setIsAvatarMenuOpen(false));

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    if (isAvatarMenuOpen) {
      setIsAvatarMenuOpen(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    setIsAvatarMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', href: '/', end: true },
    { name: 'Store', href: '/products', end: false },
    { name: 'Virtual Gallery', href: '/virtual-gallery', end: false },
    { name: 'Artists', href: '/artists', end: false },
    { name: 'About', href: '/about', end: false },
    { name: 'Contact', href: '/contact', end: false },
  ];

  return (
    <>
      <header 
        className="sticky top-0 z-50 w-full backdrop-blur-lg border-b shadow-sm font-playfair"
        style={{ 
          backgroundColor: `${theme.white}f0`,
          borderColor: `${theme.accent}50`
        }}
      >
        <nav className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
          <div className="flex justify-between items-center h-20">

            {/* Logo - Left */}
            <div className="flex-shrink-0">
              <Link
                to="/"
                className="flex items-center !space-x-2 group"
                title="ArtByBayshore Home"
              >
                <span className="font-parisienne text-4xl font-bold group-hover:opacity-80 transition-opacity">
                  <img src={CompanyLogo} alt="ArtByBayshore Logo" className="h-16 w-auto" />
                </span>
              </Link>
            </div>

            {/* Navigation Links - Center (Desktop) */}
            <div className="hidden lg:flex lg:items-center lg:!space-x-10">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.href}
                  end={link.end}
                  className={({ isActive }) =>
                    `relative !py-2 text-base font-medium transition-all duration-200`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? theme.primary : theme.secondary
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span 
                        className="relative z-10 hover:opacity-80 transition-opacity"
                      >
                        {link.name}
                      </span>
                      {isActive && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                          style={{ backgroundColor: theme.primary }}
                          layoutId="activeNav"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Icons & Avatar - Right */}
            <div className="flex items-center !space-x-4">

              {/* Wishlist Icon */}
              <Link
                to="/wishlist"
                className="relative !p-2 transition-all duration-200 hover:scale-110 group"
                style={{ color: theme.secondary }}
                aria-label="Wishlist"
                onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.secondary}
              >
                <Heart
                  size={24}
                  className="transition-all duration-200"
                />
                {wishlistCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-white text-xs font-bold rounded-full shadow-lg"
                    style={{ backgroundColor: '#EF4444' }}
                  >
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </motion.span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link
                to="/cart"
                className="relative !p-2 transition-all duration-200 hover:scale-110 group"
                style={{ color: theme.secondary }}
                aria-label="Cart"
                onMouseEnter={(e) => e.currentTarget.style.color = theme.primary}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.secondary}
              >
                <ShoppingCart
                  size={24}
                  className="transition-all duration-200"
                />
                {cartItemsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-white text-xs font-bold rounded-full shadow-lg"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </motion.span>
                )}
              </Link>

              {/* Avatar Dropdown or Auth Buttons (Desktop) */}
              <div className="hidden lg:block !p-4">
                {isAuthenticated ? (
                  <div className="relative" ref={avatarMenuRef}>
                    <button
                      onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                      className="flex items-center !space-x-2 !p-1 rounded-full transition-all duration-200 border border-transparent cursor-pointer"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.accent}30`;
                        e.currentTarget.style.borderColor = `${theme.accent}50`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                      aria-label="User menu"
                    >
                      <div 
                        className="flex items-center justify-center w-10 h-10 text-white rounded-full font-semibold shadow-lg cursor-pointer text-lg !p-4"
                        style={{ backgroundColor: theme.primary }}
                      >
                        {user?.name ? user.name[0].toUpperCase() : <User size={18} />}
                      </div>
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${isAvatarMenuOpen ? 'rotate-180' : ''}`}
                        style={{ color: theme.secondary }}
                      />
                    </button>
                    <AvatarDropdown
                      isOpen={isAvatarMenuOpen}
                      user={user}
                      onLogout={handleLogout}
                      onClose={() => setIsAvatarMenuOpen(false)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center !space-x-3">
                    <Link
                      to="/login"
                      className="!px-4 !py-2 text-base font-medium transition-colors duration-200 cursor-pointer"
                      style={{ color: theme.secondary }}
                      onMouseEnter={(e) => e.target.style.color = theme.primary}
                      onMouseLeave={(e) => e.target.style.color = theme.secondary}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="!px-6 !py-2 text-base font-medium text-white rounded-full transition-all duration-200 shadow-lg cursor-pointer"
                      style={{ backgroundColor: theme.primary }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
                      onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
                    >
                      Join Now
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden !p-2 transition-colors duration-200 cursor-pointer"
                style={{ color: theme.secondary }}
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Toggle mobile menu"
                onMouseEnter={(e) => e.target.style.color = theme.primary}
                onMouseLeave={(e) => e.target.style.color = theme.secondary}
              >
                <Menu size={26} />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Panel */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        navLinks={navLinks}
        isAuthenticated={isAuthenticated}
        user={user}
        cartCount={cartItemsCount}
        wishlistCount={wishlistCount}
        onLogout={handleLogout}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

// Avatar Dropdown Component
const AvatarDropdown = ({ isOpen, user, onLogout, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute right-0 top-14 w-72 rounded-2xl shadow-xl overflow-hidden border"
        style={{ 
          backgroundColor: theme.white,
          borderColor: `${theme.accent}50`
        }}
      >
        <div 
          className="!p-6 border-b"
          style={{ 
            backgroundColor: `${theme.accent}20`,
            borderColor: `${theme.accent}40`
          }}
        >
          <div className="flex items-center !space-x-4">
            <div 
              className="flex items-center justify-center w-14 h-14 text-white rounded-2xl font-semibold text-xl shadow-lg"
              style={{ backgroundColor: theme.primary }}
            >
              {user?.name ? user.name[0].toUpperCase() : <User size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <p 
                className="font-bold text-lg truncate"
                style={{ color: theme.secondary }}
              >
                {user?.name}
              </p>
              <p 
                className="text-sm truncate !mt-1"
                style={{ color: `${theme.secondary}99` }}
              >
                {user?.email}
              </p>
            </div>
          </div>
        </div>
        <div className="!p-2">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center w-full !px-4 !py-3 rounded-xl transition-all duration-200 group"
            style={{ color: theme.secondary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}30`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <User 
              size={18} 
              className="!mr-3 transition-colors"
              style={{ color: `${theme.primary}80` }}
            />
            <span className="font-medium">My Profile</span>
          </Link>

          <Link
            to="/orders"
            onClick={onClose}
            className="flex items-center w-full !px-4 !py-3 rounded-xl transition-all duration-200 group"
            style={{ color: theme.secondary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}30`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Package 
              size={18} 
              className="!mr-3 transition-colors"
              style={{ color: `${theme.primary}80` }}
            />
            <span className="font-medium">My Orders</span>
          </Link>
        </div>
        <div 
          className="border-t !p-2"
          style={{ borderColor: `${theme.accent}40` }}
        >
          <button
            onClick={onLogout}
            className="flex items-center w-full !px-4 !py-3 rounded-xl transition-all duration-200 group cursor-pointer"
            style={{ color: '#EF4444' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={18} className="!mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Mobile Menu Component
const MobileMenu = ({
  isOpen,
  navLinks,
  isAuthenticated,
  user,
  cartCount,
  wishlistCount,
  onLogout,
  onClose
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 z-50 lg:hidden"
          style={{ backgroundColor: `${theme.black}80` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="fixed inset-y-0 right-0 w-80 max-w-[calc(100%-4rem)] z-50 lg:hidden flex flex-col"
          style={{ backgroundColor: theme.white }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div 
            className="flex items-center justify-between !p-6 border-b"
            style={{ borderColor: `${theme.accent}50` }}
          >
            <span 
              className="font-parisienne text-2xl font-bold"
              style={{ color: theme.primary }}
            >
              Menu
            </span>
            <button
              onClick={onClose}
              className="!p-2 rounded-lg transition-colors"
              style={{ color: theme.secondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.accent}30`;
                e.currentTarget.style.color = theme.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.secondary;
              }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto !p-6 !space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.href}
                end={link.end}
                onClick={onClose}
                className="flex items-center !px-4 !py-3 text-lg font-medium rounded-xl transition-all duration-200"
                style={({ isActive }) => ({
                  backgroundColor: isActive ? `${theme.accent}30` : 'transparent',
                  color: isActive ? theme.primary : theme.secondary
                })}
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Auth & Actions Section */}
          <div 
            className="!p-6 border-t !space-y-4"
            style={{ borderColor: `${theme.accent}50` }}
          >
            {isAuthenticated ? (
              <>
                <div className="flex items-center !space-x-3">
                  <div 
                    className="flex items-center justify-center w-12 h-12 text-white rounded-full font-semibold text-lg shadow-md"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {user?.name ? user.name[0].toUpperCase() : <User size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p 
                      className="font-semibold truncate"
                      style={{ color: theme.secondary }}
                    >
                      {user?.name}
                    </p>
                    <p 
                      className="text-sm truncate"
                      style={{ color: `${theme.secondary}80` }}
                    >
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/profile"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 !p-3 rounded-lg transition-colors font-medium"
                    style={{ 
                      backgroundColor: `${theme.accent}30`,
                      color: theme.secondary
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}50`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}30`}
                  >
                    <User size={18} /> Profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 !p-3 rounded-lg transition-colors font-medium"
                    style={{ 
                      backgroundColor: `${theme.accent}30`,
                      color: theme.secondary
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}50`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}30`}
                  >
                    <Package size={18} /> Orders
                  </Link>
                </div>

                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex items-center justify-center w-full !px-4 !py-3 rounded-xl transition-colors font-medium"
                  style={{ color: '#EF4444' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={20} className="mr-3" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex items-center justify-center w-full !px-4 !py-3 rounded-xl border transition-colors font-medium"
                  style={{ 
                    borderColor: `${theme.primary}40`,
                    color: theme.secondary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.accent}20`;
                    e.currentTarget.style.borderColor = theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = `${theme.primary}40`;
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex items-center justify-center w-full !px-4 !py-3 text-white rounded-xl transition-all shadow-lg font-medium"
                  style={{ backgroundColor: theme.primary }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
                  onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default Header;