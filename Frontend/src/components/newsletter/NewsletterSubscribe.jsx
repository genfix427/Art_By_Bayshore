// src/components/common/NewsletterSubscribe.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Check, Loader2, Sparkles } from 'lucide-react';
import { newsletterService } from '../../api/services';
import toast from 'react-hot-toast';

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

const NewsletterSubscribe = ({ 
  variant = 'default',
  showHeader = true,
  className = '' 
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) return;
    
    setLoading(true);

    try {
      await newsletterService.subscribe({ email });
      setSubscribed(true);
      setEmail('');
      toast.success('Successfully subscribed to newsletter!');
      
      // Reset subscribed state after 3 seconds
      setTimeout(() => setSubscribed(false), 3000);
    } catch (error) {
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  // Compact variant for sidebar or small spaces
  if (variant === 'compact') {
    return (
      <motion.form 
        onSubmit={handleSubmit} 
        className={`relative ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-3">
          <div className="relative group">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
              focused ? 'text-gray-900' : 'text-gray-900/30'
            }`} />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              required
              disabled={loading || subscribed}
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <motion.button
            type="submit"
            disabled={loading || subscribed || !email}
            whileHover={{ scale: loading || subscribed ? 1 : 1.02 }}
            whileTap={{ scale: loading || subscribed ? 1 : 0.98 }}
            className="px-4 py-3 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {subscribed ? (
              <>
                <Check className="w-4 h-4" />
                <span>Subscribed!</span>
              </>
            ) : loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Subscribe</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    );
  }

  // Default/Full variant
  return (
    <motion.div 
      className={`max-w-4xl mx-auto text-center ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {/* Header Section */}
      {showHeader && (
        <>
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border border-gray-900/10 flex items-center justify-center"
            >
              <FlowerDecor className="w-5 h-5 text-gray-900/20" />
            </motion.div>
          </motion.div>

          <motion.span
            variants={itemVariants}
            className="text-xs tracking-[0.3em] text-gray-900/50 uppercase block mb-4"
          >
            Stay Connected
          </motion.span>

          <motion.h3
            variants={itemVariants}
            className="font-playfair text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Join Our Art Community
          </motion.h3>

          <motion.p
            variants={itemVariants}
            className="text-gray-900/60 mb-8 max-w-lg mx-auto"
          >
            Subscribe to receive updates on new artworks, exclusive exhibitions, 
            and special offers curated just for you.
          </motion.p>
        </>
      )}

      {/* Form Section */}
      <motion.form 
        onSubmit={handleSubmit}
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
      >
        <div className="flex-1 relative group">
          <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
            focused ? 'text-gray-900' : 'text-gray-900/30'
          }`} />
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required
            disabled={loading || subscribed}
            className="w-full pl-12 pr-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <motion.div
            className="absolute bottom-0 left-0 h-px bg-gray-900"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: focused ? 1 : 0 }}
            style={{ originX: 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <motion.button
          type="submit"
          disabled={loading || subscribed || !email}
          whileHover={{ scale: loading || subscribed ? 1 : 1.02 }}
          whileTap={{ scale: loading || subscribed ? 1 : 0.98 }}
          className="px-8 py-4 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer min-w-[160px]"
        >
          <AnimatePresence mode="wait">
            {subscribed ? (
              <motion.div
                key="success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>Subscribed!</span>
              </motion.div>
            ) : loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Subscribing...</span>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span>Subscribe</span>
                <Send className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.form>

      {/* Success Message */}
      <AnimatePresence>
        {subscribed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center justify-center gap-2 text-gray-900/70 text-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-gray-900" />
            </motion.div>
            <span>Welcome to our art community! Check your inbox for a confirmation.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NewsletterSubscribe;