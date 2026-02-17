// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import App from './App';
import './index.css';
import './assets/fonts/fonts.css'

// Scroll to top on route change component
const ScrollToTopOnRouteChange = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Flower decoration for scroll button
const FlowerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill="currentColor" opacity="0.5" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill="currentColor" opacity="0.5" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.5" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.5" />
  </svg>
);

// Elegant Scroll to Top Button
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calculate scroll progress
      const totalScrollable = documentHeight - windowHeight;
      const progress = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0;
      setScrollProgress(progress);

      // Show/hide button
      setIsVisible(scrolled > 400);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed bottom-8 right-8 z-50 cursor-pointer group"
          aria-label="Scroll to top"
        >
          {/* Progress Ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 56 56"
          >
            {/* Background circle */}
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <motion.circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              className="text-gray-900"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - scrollProgress / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - scrollProgress / 100) }}
              transition={{ duration: 0.1 }}
            />
          </svg>

          {/* Button Background */}
          <div className="relative w-14 h-14 bg-white border border-gray-900/20 flex items-center justify-center shadow-lg group-hover:border-secondary group-hover:bg-primary transition-all duration-300">
            {/* Animated Icon */}
            <AnimatePresence mode="wait">
              {isHovered ? (
                <motion.div
                  key="arrow"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChevronUp className="w-6 h-6 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="flower"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronUp className="w-6 h-6 text-gray-900" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pulse Effect */}
          <motion.div
            className="absolute inset-0 w-14 h-14 border border-gray-900/10"
            animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// Alternative Simple Scroll Button (if you prefer simpler)
const ScrollToTopButtonSimple = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ y: -3, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer shadow-lg"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// Custom Toaster Styles matching the design
const toasterConfig = {
  position: "top-center",
  toastOptions: {
    duration: 4000,
    style: {
      background: '#111827',
      color: '#fff',
      borderRadius: '0',
      padding: '16px 24px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    },
    success: {
      duration: 3000,
      style: {
        background: '#111827',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#111827',
      },
    },
    error: {
      duration: 5000,
      style: {
        background: '#DC2626',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#DC2626',
      },
    },
    loading: {
      style: {
        background: '#111827',
      },
    },
  },
};

// Main app wrapper
const MainApp = () => {
  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <App />
      <ScrollToTopButton />
      <Toaster {...toasterConfig} />
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);