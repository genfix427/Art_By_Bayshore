// pages/VirtualGallery.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Eye, 
  Layers, 
  Zap,
  ArrowRight,
  Mail,
  Bell,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

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

// Geometric shapes floating
const FloatingShape = ({ delay, shape, size = 40, startX, startY, duration }) => {
  const shapes = {
    circle: (
      <circle cx={size / 2} cy={size / 2} r={size / 3} stroke="currentColor" strokeWidth="1" fill="none" />
    ),
    square: (
      <rect x={size / 6} y={size / 6} width={size / 1.5} height={size / 1.5} stroke="currentColor" strokeWidth="1" fill="none" />
    ),
    triangle: (
      <polygon points={`${size / 2},${size / 6} ${size - size / 6},${size - size / 6} ${size / 6},${size - size / 6}`} stroke="currentColor" strokeWidth="1" fill="none" />
    ),
  };

  return (
    <motion.div
      className="absolute pointer-events-none z-0"
      style={{ left: `${startX}%`, top: `${startY}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.15, 0.15, 0],
        scale: [0, 1, 1, 0],
        rotate: [0, 360],
        y: [0, -200],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-gray-900">
        {shapes[shape]}
      </svg>
    </motion.div>
  );
};

// Glowing orb
const GlowingOrb = ({ size = 200, delay = 0 }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      background: 'radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 70%)',
      filter: 'blur(40px)',
    }}
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ 
      opacity: [0.3, 0.6, 0.3],
      scale: [0.8, 1.2, 0.8],
    }}
    transition={{
      duration: 4,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const VirtualGallery = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useSEO({
    title: 'Virtual Gallery - Coming Soon | Art Haven',
    description: 'Experience art in a whole new dimension. Our immersive virtual gallery is coming soon.',
  });

  // Generate floating elements
  const petals = Array.from({ length: 15 }).map((_, i) => ({
    delay: i * 1.2,
    startX: 5 + i * 6.5,
    duration: 12 + Math.random() * 8,
    size: 10 + Math.random() * 8,
  }));

  const shapes = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    shape: ['circle', 'square', 'triangle'][i % 3],
    size: 30 + Math.random() * 30,
    startX: 10 + i * 12,
    startY: 20 + Math.random() * 60,
    duration: 15 + Math.random() * 10,
  }));

  // Track mouse position for parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubscribed(true);
      setIsSubmitting(false);
      setEmail('');
    }, 1500);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
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

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {shapes.map((shape, i) => (
          <FloatingShape key={i} {...shape} />
        ))}
      </div>

      {/* Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4">
          <GlowingOrb size={300} delay={0} />
        </div>
        <div className="absolute bottom-1/4 right-1/4">
          <GlowingOrb size={250} delay={1} />
        </div>
        <div className="absolute top-1/2 right-1/3">
          <GlowingOrb size={200} delay={2} />
        </div>
      </div>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span className="tracking-wider">Art By Bayshore</span>
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary mb-6 leading-tight"
          >
            Virtual Gallery
            <br />
            <span className="relative inline-block mt-2">
              Coming Soon
              <motion.div
                className="absolute -bottom-2 left-0 w-full h-1 bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
              />
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            variants={itemVariants}
            className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Experience art in a whole new dimension. Explore our immersive 
            virtual gallery powered by cutting-edge AI technology.
          </motion.p>

          {/* Features Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 max-w-3xl mx-auto"
          >
            {[
              { icon: Eye, label: '360° Views', desc: 'Immersive Experience' },
              { icon: Sparkles, label: 'AI Curated', desc: 'Personalized Tours' },
              { icon: Layers, label: '3D Spaces', desc: 'Virtual Environments' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 border border-gray-900/10 hover:border-gray-900 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              >
                <feature.icon className="w-8 h-8 text-primary mx-auto mb-3" strokeWidth={1.5} />
                <h3 className="font-bold text-primary mb-1">{feature.label}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Back to Home */}
          <motion.div variants={itemVariants}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary hover:text-secondaru transition-colors group"
            >
              <span className="relative">
                Back to Home
                <span className="absolute bottom-0 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-300" />
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Decorative Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 2 }}
            className="w-32 h-px bg-gray-900/20 mx-auto mt-16"
          />
        </motion.div>
      </motion.div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-gray-900/10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-gray-900/10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-gray-900/10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-gray-900/10 pointer-events-none" />

      {/* Animated Scanlines */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.01) 2px, rgba(0,0,0,0.01) 4px)',
        }}
        animate={{ opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export default VirtualGallery;