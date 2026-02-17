// pages/Artists.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import ArtistCard from '../components/artists/ArtistCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { artistService } from '../api/services';
import { useSEO } from '../hooks/useSEO';

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
      opacity: [0, 0.12, 0.12, 0],
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

// Animated line decoration
const AnimatedLine = ({ delay, vertical = false, position }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={position}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.1, 0.1, 0],
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

const Artists = () => {
  useSEO({
    title: 'Artists Collection | Discover Talented Creators',
    description: 'Explore our curated collection of talented artists from around the world',
  });

  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Generate floating petals
  const petals = Array.from({ length: 12 }).map((_, i) => ({
    delay: i * 1.5,
    startX: 5 + i * 8,
    duration: 15 + Math.random() * 8,
    size: 12 + Math.random() * 8,
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
      left: i % 2 === 0 ? '3%' : '97%',
    },
    size: 6 + Math.random() * 6,
  }));

  // Generate animated lines
  const lines = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 3,
    vertical: i % 2 === 0,
    position: {
      top: `${20 + i * 20}%`,
      [i % 2 === 0 ? 'right' : 'left']: '8%',
    },
  }));

  useEffect(() => {
    fetchArtists();
  }, []);

  useEffect(() => {
    filterArtists();
  }, [artists, search]);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await artistService.getAll({
        isActive: true,
        limit: 50,
      });
      setArtists(response.data);
      setFilteredArtists(response.data);
    } catch (error) {
      console.error('Error fetching artists:', error);
      setError('An error occurred while fetching artists.');
    } finally {
      setLoading(false);
    }
  };

  const filterArtists = () => {
    let filtered = [...artists];

    if (search) {
      filtered = filtered.filter(artist =>
        artist.name.toLowerCase().includes(search.toLowerCase()) ||
        artist.biography?.toLowerCase().includes(search.toLowerCase()) ||
        artist.nationality?.toLowerCase().includes(search.toLowerCase()) ||
        artist.artStyle?.some(style => 
          style.toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    setFilteredArtists(filtered);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: theme.white }}>
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234169E1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
      </div>

      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {shapes.map((shape, i) => (
          <FloatingShape key={`shape-${i}`} {...shape} />
        ))}
      </div>

      {/* Pulsing Dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {dots.map((dot, i) => (
          <PulsingDot key={`dot-${i}`} {...dot} />
        ))}
      </div>

      {/* Animated Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {lines.map((line, i) => (
          <AnimatedLine key={`line-${i}`} {...line} />
        ))}
      </div>

      {/* Decorative Circles */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute top-20 right-20 w-72 h-72 rounded-full border hidden lg:block"
        style={{ borderColor: theme.primary }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute bottom-32 left-20 w-56 h-56 rounded-full border hidden lg:block"
        style={{ borderColor: theme.accent }}
      />

      {/* Rotating Flower Decorations */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-40 left-10 w-32 h-32 pointer-events-none hidden lg:block"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-full h-full" color={theme.primary} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="absolute bottom-40 right-10 w-24 h-24 pointer-events-none hidden lg:block"
      >
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-full h-full" color={theme.accent} />
        </motion.div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Decorative Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="w-16 h-px mx-auto mb-8"
            style={{ backgroundColor: theme.primary }}
          />

          {/* Decorative Element */}
          <div className="inline-flex items-center gap-4 mb-6">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-12 h-px origin-right"
              style={{ backgroundColor: `${theme.primary}50` }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <FlowerDecor className="w-8 h-8" color={`${theme.primary}40`} />
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-12 h-px origin-left"
              style={{ backgroundColor: `${theme.primary}50` }}
            />
          </div>

          {/* Label */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs tracking-[0.3em] uppercase block mb-4"
            style={{ color: theme.secondary }}
          >
            Our Creative Team
          </motion.span>

          {/* Title */}
          <h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 font-playfair"
            style={{ color: theme.primary }}
          >
            Meet Our Artists
          </h1>
          
          {/* Subtitle */}
          <p 
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
            style={{ color: `${theme.secondary}cc` }}
          >
            Discover the talented individuals behind the stunning artworks in our collection.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors" 
                size={20}
                style={{ color: isSearchFocused ? theme.primary : `${theme.primary}60` }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search artists by name, style, or nationality..."
                className="w-full pl-12 pr-12 py-4 rounded-lg transition-all duration-300 outline-none"
                style={{ 
                  backgroundColor: theme.white,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: isSearchFocused ? theme.primary : `${theme.primary}30`,
                  color: theme.secondary,
                  boxShadow: isSearchFocused ? `0 0 0 3px ${theme.primary}20` : 'none'
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors"
                  style={{ color: `${theme.secondary}80` }}
                  onMouseEnter={(e) => e.target.style.color = theme.primary}
                  onMouseLeave={(e) => e.target.style.color = `${theme.secondary}80`}
                >
                  <X size={20} />
                </button>
              )}
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 rounded-full"
                style={{ backgroundColor: theme.primary }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isSearchFocused ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Results Count */}
          {search && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm mt-4"
              style={{ color: `${theme.secondary}80` }}
            >
              Found <span className="font-bold" style={{ color: theme.primary }}>{filteredArtists.length}</span> artists
            </motion.p>
          )}
        </motion.div>

        {/* Content Section */}
        {loading ? (
          <div>
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-8 rounded-lg border"
            style={{ 
              backgroundColor: theme.white,
              borderColor: `${theme.primary}30`,
              color: theme.secondary
            }}
          >
            <p className="text-lg mb-4">{error}</p>
            <button
              onClick={fetchArtists}
              className="px-6 py-2 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              style={{ backgroundColor: theme.primary }}
              onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
              onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
            >
              Retry
            </button>
          </motion.div>
        ) : filteredArtists.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {filteredArtists.map((artist, index) => (
                <ArtistCard key={artist._id} artist={artist} index={index} />
              ))}
            </div>

            {/* Bottom Decorative Element */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center justify-center gap-4 mt-20"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-16 h-px origin-right"
                style={{ backgroundColor: `${theme.primary}40` }}
              />
              <motion.div
                initial={{ scale: 0, rotate: 45 }}
                whileInView={{ scale: 1, rotate: 45 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="w-2 h-2 border"
                style={{ borderColor: `${theme.primary}60` }}
              />
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-16 h-px origin-left"
                style={{ backgroundColor: `${theme.primary}40` }}
              />
            </motion.div>

            {/* Additional bottom decoration */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mt-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <FlowerDecor className="w-6 h-6" color={`${theme.primary}30`} />
              </motion.div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div 
              className="w-20 h-20 flex items-center justify-center mx-auto mb-6 border"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <FlowerDecor className="w-10 h-10" color={`${theme.primary}30`} />
            </div>
            <h3 
              className="text-2xl font-bold mb-3 font-playfair"
              style={{ color: theme.secondary }}
            >
              No artists found
            </h3>
            <p 
              className="mb-6"
              style={{ color: `${theme.secondary}b3` }}
            >
              {search 
                ? `No artists match "${search}". Try a different search term.`
                : 'No artists available at the moment.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-6 py-2 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                style={{ backgroundColor: theme.primary }}
                onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
                onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Artists;