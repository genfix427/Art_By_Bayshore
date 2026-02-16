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
import Banner from '../../assets/banner1.png'

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
          src={Banner}
          alt="Art Gallery Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute z-10" />
      </motion.div>
    </div>
  );
};

export default HeroSlider;