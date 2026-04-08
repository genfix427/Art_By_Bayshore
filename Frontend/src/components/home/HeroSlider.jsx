import { Link } from "react-router-dom";
import HeroBG from "../../assets/homeHero.jpg";
import { motion } from "framer-motion";

const HeroSlider = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-secondary">
      {/* Background Image/Video */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0"
      >
        <img
          src={HeroBG}
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Black Opacity Overlay - Left Side Only */}
      <div className="absolute inset-y-0 left-0 w-full md:w-1/2 lg:w-3/5 bg-gradient-to-r from-black/90 via-black/80 rounded-r-5xl to-transparent z-20">
        {/* Content Container */}
        <div className="flex flex-col justify-center items-start h-full px-6 sm:px-10 md:px-16 lg:px-20 max-w-2xl">
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight"
          >
            Welcome To
            <span className="block text-primary mt-2 text-2xl sm:text-3xl md:text-5xl lg:text-7xl">Art By Bayshore</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 leading-relaxed"
          >
            Elevate your space with unique pieces that reflect your style. Connect effortlessly to the art world through every masterpiece you choose.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to='/products'>
              <button className="px-8 py-3 bg-transparent border-2 border-white hover:bg-white/10 text-white font-semibold rounded-lg transition-all duration-300 cursor-pointer">
                Explore Artworks
              </button>
            </Link>
            <Link to='/about'>
              <button className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all duration-300 cursor-pointer">
                Learn More
              </button>
            </Link>
          </motion.div>

          {/* Optional: Stats or Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex gap-8 mt-12 pt-8 border-t border-white/20"
          >
            <div>
              <div className="text-2xl font-bold text-white">120+</div>
              <div className="text-sm text-gray-300">Artworks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">12+</div>
              <div className="text-sm text-gray-300">Artists</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Optional: Bottom gradient for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default HeroSlider;