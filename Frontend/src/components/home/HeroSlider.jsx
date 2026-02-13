import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import HeroBG from "../../assets/homeHero.png";
import Slider1 from '../../assets/heroSlider/slider1.jpeg'
import Slider2 from '../../assets/heroSlider/slider2.jpeg'
import Slider3 from '../../assets/heroSlider/slider3.jpeg'
import Slider4 from '../../assets/heroSlider/slider4.jpeg'
import Slider5 from '../../assets/heroSlider/slider5.jpeg'
import Slider6 from '../../assets/heroSlider/slider6.jpeg'
import Slider7 from '../../assets/heroSlider/slider7.jpeg'
import Slider8 from '../../assets/heroSlider/slider8.jpeg'

// Replace these with your actual painting images
const paintings = [
  Slider1,
  Slider2,
  Slider3,
  Slider4,
  Slider5,
  Slider6,
  Slider7,
  Slider8
];

// Smooth animation variants - no gaps
const slideAnimations = [
  // Elegant Fade & Scale
  {
    initial: { opacity: 0, scale: 1.1 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  // Smooth Slide Up
  {
    initial: { opacity: 0, y: 50, scale: 1.05 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -30, scale: 0.98 },
  },
  // Crossfade with Zoom
  {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
  },
  // Slide from Right
  {
    initial: { opacity: 0, x: 60, scale: 1.02 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -40, scale: 0.98 },
  },
  // Ken Burns Style
  {
    initial: { opacity: 0, scale: 1.15, rotate: 1 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 1.05, rotate: -1 },
  },
  // Soft Blur Fade
  {
    initial: { opacity: 0, scale: 1.08, filter: 'blur(10px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.95, filter: 'blur(5px)' },
  },
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => {
          if (prev === 0) return 1;
          return prev >= paintings.length ? 1 : prev + 1;
        });
        setCurrentAnimation((prev) => (prev + 1) % slideAnimations.length);
        setIsTransitioning(false);
      }, 100);
    }, currentSlide === 0 ? 4500 : 4000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const isWelcomeSlide = currentSlide === 0;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* Animated Background Image */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0"
      >
        <img
          src={HeroBG}
          alt="Art Gallery Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70 z-10" />
      </motion.div>

      {/* Main Content - Full Height 9:16 Box with Frame */}
      <div className="relative z-20 h-full flex items-center justify-center">
        {/* Outer Glow Effect */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 60px rgba(212, 175, 55, 0.2)',
              '0 0 80px rgba(212, 175, 55, 0.3)',
              '0 0 60px rgba(212, 175, 55, 0.2)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="relative h-full"
          style={{ aspectRatio: '9/16', maxHeight: '100vh' }}
        >
          {/* Decorative Frame - Outer Border */}
          <div className="absolute -inset-1 bg-gradient-to-b from-amber-300/40 via-amber-600/30 to-amber-300/40 z-10" />
          
          {/* Frame Pattern Layer */}
          <div className="absolute -inset-0.5 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 z-20" />
          
          {/* Inner Gold Border */}
          <div className="absolute inset-0 border-2 border-amber-500/30 z-30 pointer-events-none">
            {/* Corner Ornaments */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-amber-400/60" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-amber-400/60" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-amber-400/60" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-amber-400/60" />
            
            {/* Side Ornaments */}
            <div className="absolute top-1/2 -left-1 w-4 h-16 -translate-y-1/2 border-l-2 border-t border-b border-amber-400/40" />
            <div className="absolute top-1/2 -right-1 w-4 h-16 -translate-y-1/2 border-r-2 border-t border-b border-amber-400/40" />
          </div>

          {/* Main Content Container */}
          <div 
            className="relative h-full overflow-hidden bg-gray-900 z-25"
            style={{ aspectRatio: '9/16' }}
          >
            {/* Background Layer - Prevents empty gaps */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900" />
            
            {/* Previous Image Layer - Always visible as background */}
            {!isWelcomeSlide && currentSlide > 1 && (
              <div className="absolute inset-0">
                <img
                  src={paintings[currentSlide - 2] || paintings[paintings.length - 1]}
                  alt="Previous artwork"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Slide Content */}
            <AnimatePresence mode="sync">
              {isWelcomeSlide ? (
                /* Welcome Slide */
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 z-10"
                >
                  {/* Animated Background Pattern */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 opacity-5"
                  >
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212,175,55,0.5) 1px, transparent 0)`,
                      backgroundSize: '40px 40px'
                    }} />
                  </motion.div>

                  {/* Animated Glow */}
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/20 rounded-full blur-[100px]"
                  />

                  {/* Content Container */}
                  <div className="relative z-10 text-center px-8">
                    {/* Decorative Top Element */}
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 1.2, ease: "easeOut" }}
                      className="flex items-center justify-center gap-3 mb-10"
                    >
                      <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-400/60" />
                      <motion.div
                        animate={{ rotate: 45 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="w-2 h-2 border border-amber-400/60"
                      />
                      <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-400/60" />
                    </motion.div>

                    {/* Welcome Text */}
                    <motion.p
                      initial={{ opacity: 0, y: 20, letterSpacing: '0.2em' }}
                      animate={{ opacity: 1, y: 0, letterSpacing: '0.4em' }}
                      transition={{ delay: 0.4, duration: 0.8 }}
                      className="text-amber-400/70 text-xs md:text-sm uppercase mb-8 font-light"
                    >
                      Welcome to
                    </motion.p>

                    {/* Company Name - Art */}
                    <motion.div
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
                      className="mb-3"
                    >
                      <span className="font-playfair text-6xl md:text-8xl font-bold text-white tracking-wide">
                        Art
                      </span>
                    </motion.div>

                    {/* Company Name - By */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.1, duration: 0.6, ease: "backOut" }}
                      className="mb-3"
                    >
                      <span className="font-parisienne text-3xl md:text-5xl text-amber-400/80 italic">
                        by
                      </span>
                    </motion.div>

                    {/* Company Name - Bayshore */}
                    <motion.div
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 1.4, duration: 1, ease: "easeOut" }}
                    >
                      <span className="font-playfair text-5xl md:text-7xl font-bold text-white tracking-wider">
                        Bayshore
                      </span>
                    </motion.div>

                    {/* Decorative Bottom Element */}
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: 1.8, duration: 1.2, ease: "easeOut" }}
                      className="flex items-center justify-center gap-3 mt-10"
                    >
                      <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-400/60" />
                      <motion.div
                        animate={{ rotate: 45 }}
                        transition={{ delay: 2.2, duration: 0.5 }}
                        className="w-2 h-2 border border-amber-400/60"
                      />
                      <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-400/60" />
                    </motion.div>

                    {/* Tagline */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.4, duration: 0.8 }}
                      className="text-white/40 text-xs md:text-sm tracking-[0.3em] uppercase mt-10 font-light"
                    >
                      Where Art Comes Alive
                    </motion.p>

                    {/* Elegant Loading Animation */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3, duration: 0.5 }}
                      className="mt-12 flex justify-center"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border border-amber-400/30 border-t-amber-400/80 rounded-full"
                      />
                    </motion.div>
                  </div>

                  {/* Decorative Corner Elements */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                  >
                    <div className="absolute top-12 left-6 w-16 h-16 border-t border-l border-amber-400/20" />
                    <div className="absolute top-12 right-6 w-16 h-16 border-t border-r border-amber-400/20" />
                    <div className="absolute bottom-12 left-6 w-16 h-16 border-b border-l border-amber-400/20" />
                    <div className="absolute bottom-12 right-6 w-16 h-16 border-b border-r border-amber-400/20" />
                  </motion.div>
                </motion.div>
              ) : (
                /* Painting Slides */
                <motion.div
                  key={`painting-${currentSlide}`}
                  initial={slideAnimations[currentAnimation].initial}
                  animate={slideAnimations[currentAnimation].animate}
                  exit={slideAnimations[currentAnimation].exit}
                  transition={{ 
                    duration: 1.2, 
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className="absolute inset-0 z-10"
                >
                  {/* Painting Image */}
                  <motion.img
                    src={paintings[currentSlide - 1]}
                    alt={`Artwork ${currentSlide}`}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.05 }}
                    transition={{ duration: 8, ease: "linear" }}
                  />

                  {/* Vignette Effect */}
                  <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.6)] pointer-events-none" />

                  {/* Top Gradient */}
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

                  {/* Bottom Gradient */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                  {/* Shimmer Effect */}
                  <motion.div
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: '200%', opacity: [0, 0.5, 0] }}
                    transition={{
                      duration: 1.5,
                      delay: 0.3,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
                  />

                  {/* Painting Number Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-xs tracking-widest"
                  >
                    {String(currentSlide).padStart(2, '0')} / {String(paintings.length).padStart(2, '0')}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Frame Inner Border Overlay */}
            <div className="absolute inset-0 border border-amber-500/10 z-40 pointer-events-none" />

            {/* Slide Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
              {/* Welcome Indicator */}
              <button
                onClick={() => setCurrentSlide(0)}
                className="relative p-1.5 group"
              >
                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  isWelcomeSlide 
                    ? 'bg-amber-400 shadow-lg shadow-amber-400/50' 
                    : 'bg-white/20 group-hover:bg-white/40'
                }`} />
                {isWelcomeSlide && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 border border-amber-400/50 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>

              {/* Painting Indicators */}
              {paintings.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index + 1);
                    setCurrentAnimation((prev) => (prev + 1) % slideAnimations.length);
                  }}
                  className="relative p-1.5 group"
                >
                  <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    currentSlide === index + 1 
                      ? 'bg-white shadow-lg shadow-white/50' 
                      : 'bg-white/20 group-hover:bg-white/40'
                  }`} />
                  {currentSlide === index + 1 && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 border border-white/50 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-50 overflow-hidden">
              <motion.div
                key={currentSlide}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ 
                  duration: currentSlide === 0 ? 4.5 : 4, 
                  ease: 'linear' 
                }}
                className={`h-full ${isWelcomeSlide ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-white/50 to-white/80'}`}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Ambient Light Effects */}
      <motion.div
        animate={{
          opacity: [0.15, 0.25, 0.15],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[180px] pointer-events-none"
      />
      
      <motion.div
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500 rounded-full blur-[150px] pointer-events-none"
      />

      <motion.div
        animate={{
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600 rounded-full blur-[200px] pointer-events-none"
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              y: '110vh',
              x: `${Math.random() * 100}vw`
            }}
            animate={{ 
              opacity: [0, 0.4, 0],
              y: '-10vh',
            }}
            transition={{ 
              duration: Math.random() * 12 + 10,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: 'linear'
            }}
            className="absolute w-0.5 h-0.5 bg-amber-200 rounded-full"
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;