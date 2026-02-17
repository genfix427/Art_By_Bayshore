import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Heart,
  Eye,
  Award,
  Users,
  Palette,
  Globe,
  Shield,
  Truck,
  Star,
  Quote,
  ChevronRight,
  Mail,
  Clock,
  Sparkles,
  ArrowUpRight,
  Play,
  CheckCircle
} from 'lucide-react';
import AboutImg01 from "../assets/about1.jpeg"
import AboutImg02 from "../assets/about2.jpeg"
import AboutImg03 from "../assets/about3.jpeg"
import AboutImg04 from "../assets/about4.jpeg"
import AboutImg05 from "../assets/about5.jpeg"

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
      opacity: [0, 0.1, 0.1, 0],
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

// Animated line decoration
const AnimatedLine = ({ delay, vertical = false, position }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={position}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.08, 0.08, 0],
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

// Animated Counter Component
const AnimatedCounter = ({ value, suffix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const incrementTime = (duration * 1000) / end;
      
      const timer = setInterval(() => {
        start += Math.ceil(end / 50);
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// Section Heading Component
const SectionHeading = ({ label, title, titleItalic, centered = false }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={centered ? "text-center mb-16" : "mb-8"}
    >
      {centered && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-16 h-px mx-auto mb-8 origin-center"
          style={{ backgroundColor: theme.primary }}
        />
      )}
      
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3 }}
        className="text-xs tracking-[0.3em] uppercase block mb-4"
        style={{ color: theme.primary }}
      >
        {label}
      </motion.span>
      
      <h2 className="text-4xl lg:text-5xl font-bold" style={{ color: theme.secondary }}>
        {title}
        {titleItalic && (
          <>
            <br />
            <span className="font-normal" style={{ color: theme.primary }}>{titleItalic}</span>
          </>
        )}
      </h2>
    </motion.div>
  );
};

const About = () => {
  const [activeValue, setActiveValue] = useState(0);
  
  // Generate floating petals
  const petals = Array.from({ length: 12 }).map((_, i) => ({
    delay: i * 1.3,
    startX: 5 + i * 8,
    duration: 15 + Math.random() * 10,
    size: 10 + Math.random() * 10,
  }));

  // Generate floating shapes
  const shapes = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 10 + i * 12,
    duration: 20 + Math.random() * 10,
    type: ['circle', 'square', 'triangle'][i % 3],
  }));

  // Generate pulsing dots
  const dots = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 1.5,
    position: {
      top: `${15 + i * 15}%`,
      left: i % 2 === 0 ? '5%' : '95%',
    },
    size: 6 + Math.random() * 6,
  }));

  // Generate animated lines
  const lines = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 3,
    vertical: i % 2 === 0,
    position: {
      top: `${20 + i * 20}%`,
      [i % 2 === 0 ? 'right' : 'left']: '10%',
    },
  }));

  // Parallax for hero
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const values = [
    {
      icon: Eye,
      title: 'Curated Excellence',
      description: 'Every piece in our collection undergoes rigorous selection. We partner only with artists whose vision and craftsmanship meet our exacting standards, ensuring you discover truly exceptional works.'
    },
    {
      icon: Heart,
      title: 'Artist First',
      description: 'We believe in nurturing talent. Our artists receive fair compensation, global exposure, and the creative freedom to push boundaries. When artists thrive, extraordinary art emerges.'
    },
    {
      icon: Shield,
      title: 'Authenticity Guaranteed',
      description: 'Each artwork comes with a certificate of authenticity and provenance documentation. We stand behind every piece with our reputation and comprehensive buyer protection.'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Art knows no boundaries. We connect collectors across the United States with masterpieces from studios worldwide, bringing diverse perspectives into your space.'
    }
  ];

  const milestones = [
    { year: '2021', title: 'The Beginning', description: 'Founded with a vision to bridge artists and collectors through meaningful connections.' },
    { year: '2022', title: 'First Expansion', description: 'Opened our second gallery, establishing presence in major art markets.' },
    { year: '2023', title: 'Global Network', description: 'Extended our reach internationally, partnering with artists from 30+ countries.' },
    { year: '2024', title: 'Digital Evolution', description: 'Launched our online platform, making exceptional art accessible to collectors nationwide.' },
    { year: '2025', title: 'New Horizons', description: 'Celebrating 40 years with our most ambitious collection yet.' }
  ];

  const features = [
    { icon: Palette, title: 'Expert Curation', desc: 'Every piece is hand-selected by our team of art historians and curators.' },
    { icon: Shield, title: 'Authenticated Works', desc: 'Full provenance documentation and certificates of authenticity included.' },
    { icon: Users, title: 'Personal Consultation', desc: 'One-on-one guidance from our art advisors for every purchase.' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: theme.white }}>
      {/* Background Pattern */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234169E1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
      </div>

      {/* Floating Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {shapes.map((shape, i) => (
          <FloatingShape key={`shape-${i}`} {...shape} />
        ))}
      </div>

      {/* Pulsing Dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {dots.map((dot, i) => (
          <PulsingDot key={`dot-${i}`} {...dot} />
        ))}
      </div>

      {/* Animated Lines */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {lines.map((line, i) => (
          <AnimatedLine key={`line-${i}`} {...line} />
        ))}
      </div>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Decorative Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.08, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute top-20 left-20 w-96 h-96 rounded-full border"
            style={{ borderColor: theme.primary }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.08, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="absolute bottom-20 right-20 w-64 h-64 rounded-full border"
            style={{ borderColor: theme.accent }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.05, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.4 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border"
            style={{ borderColor: theme.secondary }}
          />
          
          {/* Rotating circle animation */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-dashed"
            style={{ borderColor: theme.accent, opacity: 0.1 }}
          />
        </div>

        {/* Decorative Flowers */}
        <motion.div
          initial={{ opacity: 0, rotate: -180 }}
          animate={{ opacity: 0.1, rotate: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute top-32 left-16 w-32 h-32 hidden lg:block"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <FlowerDecor className="w-full h-full" color={theme.primary} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, rotate: 180 }}
          animate={{ opacity: 0.1, rotate: 0 }}
          transition={{ duration: 1.5, delay: 0.7 }}
          className="absolute bottom-32 right-16 w-24 h-24 hidden lg:block"
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            <FlowerDecor className="w-full h-full" color={theme.accent} />
          </motion.div>
        </motion.div>

        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 mb-10 border"
            style={{ borderColor: `${theme.primary}40` }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4" style={{ color: theme.primary }} />
            </motion.div>
            <div className="w-px h-4" style={{ backgroundColor: `${theme.primary}40` }} />
            <span className="text-xs tracking-[0.3em] uppercase" style={{ color: theme.primary }}>
              Art By Bayshore
            </span>
          </motion.div>

          {/* Decorative Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-20 h-px mx-auto mb-10 origin-center"
            style={{ backgroundColor: theme.primary }}
          />

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-8"
            style={{ color: theme.secondary }}
          >
            Where Art Finds
            <br />
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="font-normal"
              style={{ color: theme.primary }}
            >
              Its Home
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed mb-12"
            style={{ color: `${theme.secondary}cc` }}
          >
            For over four decades, we have been the bridge between visionary artists 
            and discerning collectors, curating extraordinary works that transform 
            spaces and inspire souls.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center gap-3 px-8 py-4 text-white font-medium transition-all cursor-pointer"
                style={{ backgroundColor: theme.primary }}
                onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
                onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link to="/contact">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center gap-3 px-8 py-4 font-medium transition-all cursor-pointer border-2"
                style={{ 
                  borderColor: theme.primary, 
                  color: theme.primary,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.primary;
                  e.target.style.color = theme.white;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = theme.primary;
                }}
              >
                <span>Get in Touch</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs tracking-[0.2em] uppercase" style={{ color: `${theme.primary}80` }}>Scroll</span>
            <div className="w-px h-8" style={{ backgroundColor: `${theme.primary}40` }} />
          </motion.div>
        </motion.div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Image Grid */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative aspect-[4/5] bg-transparent overflow-hidden group border"
                    style={{ borderColor: `${theme.primary}20` }}
                  >
                    <img
                      src={AboutImg01}
                      alt="Gallery interior"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FlowerDecor className="w-12 h-12" color={`${theme.primary}20`} />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative aspect-square bg-transparent overflow-hidden group border"
                    style={{ borderColor: `${theme.accent}40` }}
                  >
                    <img
                      src={AboutImg04}
                      alt="Art exhibition"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FlowerDecor className="w-12 h-12" color={`${theme.accent}40`} />
                    </div>
                  </motion.div>
                </div>
                
                <div className="space-y-4 pt-8">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative aspect-square bg-transparent overflow-hidden group border"
                    style={{ borderColor: `${theme.accent}40` }}
                  >
                    <img
                      src={AboutImg03}
                      alt="Artist at work"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FlowerDecor className="w-12 h-12" color={`${theme.accent}40`} />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative aspect-[4/5] bg-transparent overflow-hidden group border"
                    style={{ borderColor: `${theme.primary}20` }}
                  >
                    <img
                      src={AboutImg02}
                      alt="Artwork detail"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FlowerDecor className="w-12 h-12" color={`${theme.primary}20`} />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-8 -right-8 text-white p-8"
                style={{ backgroundColor: theme.primary }}
              >
                <p className="text-5xl font-bold">30+</p>
                <p className="text-xs tracking-[0.2em] uppercase mt-2" style={{ color: `${theme.white}b3` }}>Years</p>
              </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:pl-8"
            >
              <SectionHeading 
                label="Our Story" 
                title="A Legacy of" 
                titleItalic="Artistic Discovery" 
              />

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-6 leading-relaxed"
                style={{ color: `${theme.secondary}e6` }}
              >
                <motion.p variants={itemVariants}>
                  What began as a passionate pursuit of exceptional art has evolved into 
                  a distinguished platform connecting visionary creators with collectors 
                  who appreciate the extraordinary. Our journey started in 1984, driven 
                  by an unwavering belief that great art has the power to transform not 
                  just spaces, but lives.
                </motion.p>
                <motion.p variants={itemVariants}>
                  Over four decades, we have cultivated relationships with hundreds of 
                  remarkable artists—from emerging talents to established masters. Each 
                  collaboration is built on mutual respect, creative freedom, and a shared 
                  commitment to authenticity.
                </motion.p>
                <motion.p variants={itemVariants}>
                  Today, our curated collection spans diverse styles, mediums, and 
                  perspectives, yet maintains one constant: uncompromising quality. 
                  Whether you're a seasoned collector or discovering your first piece, 
                  we're honored to guide your journey.
                </motion.p>
              </motion.div>

              {/* Quote */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="mt-10 pt-10 border-t"
                style={{ borderColor: `${theme.primary}20` }}
              >
                <div className="flex items-start gap-6">
                  <div 
                    className="w-14 h-14 flex items-center justify-center flex-shrink-0 border"
                    style={{ borderColor: `${theme.primary}40` }}
                  >
                    <Quote className="w-6 h-6" style={{ color: theme.primary }} />
                  </div>
                  <div>
                    <p className="text-lg italic" style={{ color: theme.secondary }}>
                      "Art is not what you see, but what you make others see."
                    </p>
                    <p className="text-sm mt-2" style={{ color: `${theme.primary}80` }}>— Edgar Degas</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: `${theme.accent}15` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            label="What Drives Us" 
            title="Our Core" 
            titleItalic="Values" 
            centered 
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Values Navigation */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {values.map((value, index) => (
                <motion.button
                  key={index}
                  variants={itemVariants}
                  onClick={() => setActiveValue(index)}
                  whileHover={{ x: 5 }}
                  className="w-full text-left p-6 border transition-all duration-300 cursor-pointer relative"
                  style={{ 
                    borderColor: activeValue === index ? theme.primary : `${theme.primary}20`,
                    backgroundColor: theme.white
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 flex items-center justify-center transition-all duration-300"
                      style={{ 
                        backgroundColor: activeValue === index ? theme.primary : 'transparent',
                        borderWidth: activeValue === index ? 0 : 1,
                        borderColor: `${theme.primary}40`,
                        color: activeValue === index ? theme.white : theme.primary
                      }}
                    >
                      <value.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold" style={{ color: theme.secondary }}>
                        {value.title}
                      </h3>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-transform duration-300 ${
                        activeValue === index ? 'rotate-90' : ''
                      }`}
                      style={{ color: `${theme.primary}60` }}
                    />
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Active Value Detail */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-10 lg:p-12 flex flex-col justify-center min-h-[400px] border"
              style={{ backgroundColor: theme.white, borderColor: `${theme.primary}20` }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeValue}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div 
                    className="w-16 h-16 flex items-center justify-center mb-8"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {(() => {
                      const Icon = values[activeValue].icon;
                      return <Icon className="w-7 h-7" style={{ color: theme.white }} />;
                    })()}
                  </div>
                  <h3 className="text-2xl font-bold mb-6" style={{ color: theme.secondary }}>
                    {values[activeValue].title}
                  </h3>
                  <p className="leading-relaxed text-lg" style={{ color: `${theme.secondary}cc` }}>
                    {values[activeValue].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            label="Our Journey" 
            title="Four Decades of" 
            titleItalic="Excellence" 
            centered 
          />

          <div className="relative mt-16">
            {/* Timeline Line */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 w-px h-full hidden lg:block"
              style={{ backgroundColor: `${theme.primary}20` }}
            />

            <div className="space-y-12 lg:space-y-0">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative lg:flex items-center ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  <div className="lg:w-1/2 lg:px-12 mb-8 lg:mb-0">
                    <motion.div
                      whileHover={{ y: -5 }}
                      className={`relative p-8 group transition-colors border ${
                        index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'
                      }`}
                      style={{ 
                        backgroundColor: theme.white,
                        borderColor: `${theme.primary}20`
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.primary}60`}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.primary}20`}
                    >
                      <span 
                        className="text-4xl font-bold transition-colors"
                        style={{ color: `${theme.primary}20` }}
                      >
                        {milestone.year}
                      </span>
                      <h3 className="text-xl font-bold mt-2" style={{ color: theme.secondary }}>
                        {milestone.title}
                      </h3>
                      <p className="mt-3" style={{ color: `${theme.secondary}cc` }}>
                        {milestone.description}
                      </p>
                    </motion.div>
                  </div>

                  {/* Timeline Dot */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 w-5 h-5 border-4 shadow-md z-10"
                    style={{ backgroundColor: theme.primary, borderColor: theme.white }}
                  />

                  <div className="lg:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: `${theme.accent}15` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <SectionHeading 
                label="Why Choose Us" 
                title="The Art Gallery" 
                titleItalic="Difference" 
              />

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-6"
              >
                {features.map((item, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ x: 10 }}
                    className="flex items-start gap-4 group cursor-pointer"
                  >
                    <div 
                      className="w-12 h-12 flex items-center justify-center flex-shrink-0 transition-all duration-300 border"
                      style={{ 
                        borderColor: `${theme.primary}40`,
                        color: theme.primary,
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.primary;
                        e.currentTarget.style.backgroundColor = theme.primary;
                        e.currentTarget.style.color = theme.white;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${theme.primary}40`;
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.primary;
                      }}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold" style={{ color: theme.secondary }}>{item.title}</h4>
                      <p className="text-sm mt-1" style={{ color: `${theme.secondary}b3` }}>{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div 
                className="relative aspect-square overflow-hidden border"
                style={{ backgroundColor: `${theme.accent}20`, borderColor: `${theme.primary}20` }}
              >
                <img
                  src={AboutImg05}
                  alt="Art consultation"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FlowerDecor className="w-24 h-24" color={`${theme.primary}10`} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-12 lg:p-16 text-center border"
            style={{ backgroundColor: theme.white, borderColor: `${theme.primary}20` }}
          >
            {/* Decorative Flower */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 flex items-center justify-center mx-auto mb-8 border"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <FlowerDecor className="w-8 h-8" color={`${theme.primary}40`} />
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-16 h-px mx-auto mb-8 origin-center"
              style={{ backgroundColor: theme.primary }}
            />

            <h2 className="text-3xl lg:text-5xl font-bold mb-6" style={{ color: theme.secondary }}>
              Ready to Find Your
              <br />
              <span className="italic font-normal" style={{ color: theme.primary }}>Perfect Piece?</span>
            </h2>

            <p className="max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: `${theme.secondary}cc` }}>
              Browse our curated collection of extraordinary artworks or speak with 
              one of our art advisors to find the perfect addition to your space.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/products">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-3 px-10 py-5 text-white font-medium transition-all cursor-pointer"
                  style={{ backgroundColor: theme.primary }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
                  onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
                >
                  <span className="text-lg">View Collection</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-3 px-10 py-5 font-medium transition-all cursor-pointer border-2"
                  style={{ 
                    borderColor: theme.primary, 
                    color: theme.primary,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = theme.primary;
                    e.target.style.color = theme.white;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = theme.primary;
                  }}
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-lg">Contact Us</span>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
        className="w-32 h-px mx-auto mb-16"
        style={{ backgroundColor: `${theme.primary}20` }}
      />
    </div>
  );
};

export default About;