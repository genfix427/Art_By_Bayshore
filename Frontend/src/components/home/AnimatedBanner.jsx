// src/components/home/AnimatedBanner.jsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Palette, Sparkles } from "lucide-react";

const AnimatedBanner = () => {
  return (
    <div className="relative overflow-hidden bg-gray-50">

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111827' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-8 sm:p-10 lg:p-12 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900/10 backdrop-blur-sm px-4 py-2 border border-gray-900/10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Palette className="h-4 w-4 text-gray-900" />
            </motion.div>
            <span className="text-sm font-medium text-gray-900">New Collection</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-3 w-3 text-gray-700" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 leading-tight"
          >
            Nature & Landscape Collection
            <span className="block text-gray-600 mt-1">— curated for calm spaces.</span>
          </motion.h3>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-gray-700 max-w-xl leading-relaxed"
          >
            Premium originals that elevate your home, office, or studio. 
            Collect with confidence from verified artists worldwide.
          </motion.p>

          {/* Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-4"
          >
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 px-8 py-4 font-medium text-white hover:bg-gray-800 transition-colors cursor-pointer group"
              >
                Shop the Collection 
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </motion.button>
            </Link>
            <Link to="/artists">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center border-2 border-gray-900/20 bg-white/50 backdrop-blur-sm px-8 py-4 font-medium text-gray-900 hover:bg-white hover:border-gray-900/40 transition-all cursor-pointer"
              >
                Meet the Artists
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex items-center gap-8"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-900">50+</span>
              <span className="text-sm text-gray-600">New Works</span>
            </div>
            <div className="w-px h-8 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-900">12</span>
              <span className="text-sm text-gray-600">Artists</span>
            </div>
            <div className="w-px h-8 bg-gray-300 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-900">Limited</span>
              <span className="text-sm text-gray-600">Edition</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Image Frame */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >

            {/* Main image container */}
            <div className="relative rounded-xl border-2 border-gray-300 bg-white p-3 shadow-lg">
              <div className="relative overflow-hidden rounded-lg">
                <motion.img
                  src="https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=2000&q=80"
                  alt="Collection highlight"
                  className="h-72 lg:h-80 w-full object-cover"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedBanner;