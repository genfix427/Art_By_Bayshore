import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Mail,
  HelpCircle,
  Compass,
  RefreshCw
} from 'lucide-react';

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.3, 0.3, 0],
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
    <svg width={size} height={size} viewBox="0 0 24 24" className="text-primary">
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

// Floating circle component
const FloatingCircle = ({ delay, startX, duration, size = 20 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, scale: 0.5 }}
    animate={{
      opacity: [0, 0.25, 0.25, 0],
      y: [-20, 500, 1000],
      scale: [0.5, 1, 0.5],
      x: [0, -40, 20],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div 
      className="rounded-full border-2 border-primary"
      style={{ width: size, height: size }}
    />
  </motion.div>
);

// Floating diamond component
const FloatingDiamond = ({ delay, startX, duration, size = 16 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 45 }}
    animate={{
      opacity: [0, 0.2, 0.2, 0],
      y: [-20, 600, 1200],
      rotate: [45, 225, 405],
      x: [0, 50, -30],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div 
      className="border-2 border-secondary"
      style={{ width: size, height: size }}
    />
  </motion.div>
);

// Floating dot component
const FloatingDot = ({ delay, startX, duration, size = 8 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20 }}
    animate={{
      opacity: [0, 0.4, 0.4, 0],
      y: [-20, 700, 1400],
      x: [0, -20, 40, 0],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div 
      className="rounded-full bg-accent"
      style={{ width: size, height: size }}
    />
  </motion.div>
);

// Pulsing orb component
const PulsingOrb = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full bg-primary pointer-events-none ${className}`}
    initial={{ opacity: 0.05, scale: 1 }}
    animate={{
      opacity: [0.05, 0.15, 0.05],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 4,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Flower decoration component
const FlowerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill="currentColor" opacity="0.6" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill="currentColor" opacity="0.6" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.6" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.6" />
  </svg>
);

// Animated 404 Number
const Animated404 = () => {
  return (
    <div className="relative flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {/* 4 */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateY: -90 }}
        animate={{ opacity: 1, y: 0, rotateY: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative"
      >
        <span className="font-playfair text-8xl sm:text-9xl lg:text-[12rem] font-bold text-primary/10 select-none">
          4
        </span>
        <motion.span 
          className="absolute inset-0 font-playfair text-8xl sm:text-9xl lg:text-[12rem] font-bold text-primary select-none"
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: 'inset(0% 0 0 0)' }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          4
        </motion.span>
      </motion.div>

      {/* Flower in middle */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
        className="relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 border-2 border-primary/30 flex items-center justify-center"
        >
          <FlowerDecor className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-primary" />
        </motion.div>
        
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 border-2 border-primary/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* 4 */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateY: 90 }}
        animate={{ opacity: 1, y: 0, rotateY: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative"
      >
        <span className="font-playfair text-8xl sm:text-9xl lg:text-[12rem] font-bold text-primary/10 select-none">
          4
        </span>
        <motion.span 
          className="absolute inset-0 font-playfair text-8xl sm:text-9xl lg:text-[12rem] font-bold text-primary select-none"
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: 'inset(0% 0 0 0)' }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          4
        </motion.span>
      </motion.div>
    </div>
  );
};

// Floating shapes background
const FloatingShapes = () => {
  const shapes = Array.from({ length: 8 }).map((_, i) => ({
    size: 40 + Math.random() * 60,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 10 + Math.random() * 10,
    delay: i * 0.5,
    type: i % 3, // 0: square, 1: circle, 2: diamond
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute border-2 ${
            shape.type === 0 ? 'border-primary/10' : 
            shape.type === 1 ? 'border-secondary/10 rounded-full' : 
            'border-accent/20 rotate-45'
          }`}
          style={{
            width: shape.size,
            height: shape.size,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: shape.type === 2 ? [45, 225, 405] : [0, 180, 360],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const NotFound = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [countdown, setCountdown] = useState(15);

  // Generate floating elements
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 1.5,
    startX: 5 + i * 12,
    duration: 14 + Math.random() * 8,
    size: 12 + Math.random() * 8,
  }));

  const circles = Array.from({ length: 5 }).map((_, i) => ({
    delay: i * 3 + 1,
    startX: 10 + i * 18,
    duration: 18 + Math.random() * 8,
    size: 15 + Math.random() * 12,
  }));

  const diamonds = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 4 + 2,
    startX: 15 + i * 22,
    duration: 20 + Math.random() * 8,
    size: 12 + Math.random() * 10,
  }));

  const dots = Array.from({ length: 10 }).map((_, i) => ({
    delay: i * 2,
    startX: 8 + i * 10,
    duration: 12 + Math.random() * 8,
    size: 5 + Math.random() * 6,
  }));

  // Quick links
  const quickLinks = [
    { icon: Home, label: 'Home', path: '/', description: 'Back to homepage' },
    { icon: ShoppingBag, label: 'Products', path: '/products', description: 'Browse our collection' },
    { icon: Compass, label: 'Artist', path: '/artist', description: 'Explore Artists' },
    { icon: Mail, label: 'Contact', path: '/contact', description: 'Get in touch' },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.8,
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

  // Auto redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234169E1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Pulsing Background Orbs */}
      <PulsingOrb className="w-72 h-72 -top-36 -left-36 blur-3xl" delay={0} />
      <PulsingOrb className="w-96 h-96 -bottom-48 -right-48 blur-3xl" delay={2} />
      <PulsingOrb className="w-56 h-56 top-1/3 -right-28 blur-2xl" delay={1} />
      <PulsingOrb className="w-48 h-48 bottom-1/4 -left-24 blur-2xl" delay={3} />

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
        {circles.map((circle, i) => (
          <FloatingCircle key={`circle-${i}`} {...circle} />
        ))}
        {diamonds.map((diamond, i) => (
          <FloatingDiamond key={`diamond-${i}`} {...diamond} />
        ))}
        {dots.map((dot, i) => (
          <FloatingDot key={`dot-${i}`} {...dot} />
        ))}
      </div>

      {/* Floating Shapes */}
      <FloatingShapes />

      {/* Animated Lines */}
      <motion.div
        className="absolute top-16 left-0 w-full h-px bg-primary pointer-events-none"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.1 }}
        transition={{ duration: 2, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-16 left-0 w-full h-px bg-primary pointer-events-none"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.1 }}
        transition={{ duration: 2, delay: 0.7 }}
      />

      {/* Decorative Flowers */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute top-20 left-10 w-40 h-40 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-primary" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-20 right-10 w-32 h-32 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-secondary" />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* 404 Animation */}
        <Animated404 />

        {/* Text Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div
            variants={itemVariants}
            className="mb-6"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="w-16 h-px bg-primary mx-auto mb-6 origin-center"
            />
          </motion.div>

          <motion.span
            variants={itemVariants}
            className="text-xs tracking-[0.3em] text-primary/70 uppercase block mb-4"
          >
            Page Not Found
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary mb-4"
          >
            Oops! Lost in the Gallery
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-black/70 max-w-lg mx-auto mb-8 leading-relaxed text-base"
          >
            The page you're looking for seems to have wandered off. 
            Perhaps it's admiring the artwork somewhere else.
          </motion.p>

          {/* Search Box */}
          <motion.div
            variants={itemVariants}
            className="max-w-md mx-auto mb-10"
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for artworks..."
                className="w-full pl-12 pr-4 py-4 border-2 border-primary/20 focus:border-primary outline-none transition-colors text-secondary placeholder:text-black/40"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-2 font-medium hover:bg-secondary transition-colors cursor-pointer"
              >
                Search
              </motion.button>
            </form>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            variants={itemVariants}
            className="mb-10"
          >
            <p className="text-xs tracking-[0.2em] text-primary/60 uppercase mb-6">
              Quick Links
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {quickLinks.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  <Link to={link.path}>
                    <motion.div
                      whileHover={{ y: -5, borderColor: 'rgba(65, 105, 225, 0.4)' }}
                      className="relative bg-white border-2 border-primary/15 p-6 text-center group cursor-pointer transition-colors hover:bg-accent/10"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-10 h-10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:border-primary/40 transition-colors"
                      >
                        <link.icon className="w-5 h-5 text-primary" />
                      </motion.div>
                      <span className="font-medium text-secondary block mb-1">
                        {link.label}
                      </span>
                      <span className="text-xs text-black/60">
                        {link.description}
                      </span>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </motion.button>

            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium hover:bg-secondary transition-colors cursor-pointer group"
              >
                <Home className="w-5 h-5" />
                Back to Home
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Auto Redirect Notice */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 text-black/60"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm">
              Redirecting to homepage in{' '}
              <span className="font-semibold text-primary">{countdown}</span>
              {' '}seconds
            </span>
          </motion.div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-16 text-center"
        >
          <div className="relative inline-block bg-accent/20 border-2 border-primary/15 px-8 py-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm text-secondary font-medium">Need help?</span>
            </div>
            <p className="text-black/70 text-sm">
              Contact us at{' '}
              <a 
                href="mailto:support@artgallery.com" 
                className="text-primary font-medium hover:underline"
              >
                support@artgallery.com
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-px bg-primary/30"
      />
    </div>
  );
};

export default NotFound;