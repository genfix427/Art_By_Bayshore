// pages/ArtistDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight,
  Globe, 
  Calendar, 
  Award, 
  Palette,
  Star,
  ExternalLink,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Mail
} from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { artistService, productService } from '../api/services';
import { useSEO } from '../hooks/useSEO';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=800&fit=crop&q=80';

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

const ArtistDetails = () => {
  const { slug } = useParams();
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loadingArtist, setLoadingArtist] = useState(true);
  const [loadingArtworks, setLoadingArtworks] = useState(true);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const { scrollYProgress } = useScroll();
  const headerY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

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

  // Animation variants
  const textReveal = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" }
    })
  };

  const lineAnimation = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: 1, 
      transition: { duration: 1, ease: "easeInOut" } 
    }
  };

  useSEO({
    title: artist ? `${artist.name} | Artist Profile` : 'Artist Profile',
    description: artist?.biography?.substring(0, 160) || 'Artist profile page',
  });

  useEffect(() => {
    fetchArtistDetails();
  }, [slug]);

  const fetchArtistDetails = async () => {
    try {
      setLoadingArtist(true);
      setError('');
      
      const artistResponse = await artistService.getBySlug(slug);
      setArtist(artistResponse.data);
      
      setLoadingArtworks(true);
      const artworksResponse = await productService.getAll({
        artist: artistResponse.data._id,
        isActive: true,
        limit: 12,
      });
      setArtworks(artworksResponse.data);
      
    } catch (error) {
      console.error('Error fetching artist details:', error);
      setError('Failed to load artist details.');
    } finally {
      setLoadingArtist(false);
      setLoadingArtworks(false);
    }
  };

  // Loading State
  if (loadingArtist) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: theme.white }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-12 h-12" color={`${theme.primary}40`} />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-sm tracking-[0.2em] uppercase mt-4"
          style={{ color: `${theme.secondary}80` }}
        >
          Loading Artist
        </motion.p>
      </div>
    );
  }

  // Error State
  if (error || !artist) {
    return (
      <div 
        className="min-h-screen flex justify-center items-center px-6"
        style={{ backgroundColor: theme.white }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div 
            className="w-20 h-20 flex items-center justify-center mx-auto mb-8 border"
            style={{ borderColor: `${theme.primary}20` }}
          >
            <FlowerDecor className="w-10 h-10" color={`${theme.primary}30`} />
          </div>
          <h2 
            className="text-3xl font-bold mb-4"
            style={{ color: theme.primary }}
          >
            Artist Not Found
          </h2>
          <p 
            className="mb-8"
            style={{ color: `${theme.secondary}b3` }}
          >
            {error || 'The requested artist could not be found.'}
          </p>
          <Link 
            to="/artists" 
            className="inline-flex items-center gap-2 font-medium group"
            style={{ color: theme.secondary }}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="relative">
              Back to Artists
              <span 
                className="absolute bottom-0 left-0 w-full h-px"
                style={{ backgroundColor: theme.primary }}
              />
            </span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const imageUrl = artist.profileImage || PLACEHOLDER_IMAGE;

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: theme.white }}
    >
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
        className="absolute top-20 right-20 w-72 h-72 rounded-full border hidden lg:block pointer-events-none"
        style={{ borderColor: theme.primary }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute bottom-32 left-20 w-56 h-56 rounded-full border hidden lg:block pointer-events-none"
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

      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 pt-8"
      >
        <Link 
          to="/artists" 
          className="inline-flex items-center gap-3 transition-colors group"
          style={{ color: `${theme.secondary}99` }}
        >
          <div 
            className="w-10 h-10 flex items-center justify-center transition-colors border"
            style={{ borderColor: `${theme.primary}30` }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.primary}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.primary}30`}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: theme.primary }} />
          </div>
          <span className="text-sm font-medium">Back to Artists</span>
        </Link>
      </motion.div>

      {/* Hero Section */}
      <motion.section 
        style={{ y: headerY, opacity: headerOpacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 lg:sticky lg:top-24"
          >
            <div className="relative">
              {/* Main Image */}
              <div 
                className="relative overflow-hidden border"
                style={{ borderColor: `${theme.primary}20` }}
              >
                {/* Loading skeleton */}
                {!imageLoaded && (
                  <div 
                    className="absolute inset-0"
                    style={{ backgroundColor: `${theme.accent}20` }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      style={{ 
                        background: `linear-gradient(90deg, transparent, ${theme.white}80, transparent)` 
                      }}
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                )}

                <motion.img
                  src={imageUrl}
                  alt={artist.name}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                    setImageLoaded(true);
                  }}
                  className={`w-full aspect-[4/3] object-cover transition-opacity duration-700 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.2 }}
                />

                {/* Flower decorations */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="absolute top-8 left-8"
                >
                  <FlowerDecor className="w-8 h-8" color={`${theme.primary}20`} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="absolute bottom-8 right-8"
                >
                  <FlowerDecor className="w-8 h-8" color={`${theme.primary}20`} />
                </motion.div>

                {/* Featured Badge */}
                {artist.isFeatured && (
                  <div className="absolute top-4 left-4 z-10">
                    <span 
                      className="px-3 py-1 text-xs font-bold tracking-wider flex items-center gap-1"
                      style={{ backgroundColor: theme.primary, color: theme.white }}
                    >
                      <Star size={10} fill="currentColor" />
                      FEATURED
                    </span>
                  </div>
                )}
              </div>

              {/* Image caption */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-3 mt-4"
              >
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="w-8 h-px origin-left"
                  style={{ backgroundColor: `${theme.primary}50` }}
                />
                <span 
                  className="text-xs tracking-wide uppercase"
                  style={{ color: theme.primary }}
                >
                  Portrait
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 space-y-10"
          >
            {/* Name & Title */}
            <div>
              <motion.div
                variants={lineAnimation}
                className="w-12 h-px mb-6 origin-left"
                style={{ backgroundColor: theme.primary }}
              />

              <motion.span
                custom={0}
                variants={textReveal}
                className="text-sm tracking-[0.3em] uppercase block mb-4"
                style={{ color: theme.primary }}
              >
                Artist
              </motion.span>

              <motion.h1
                custom={1}
                variants={textReveal}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
                style={{ color: theme.primary }}
              >
                {artist.name}
              </motion.h1>

              {/* Location & Birth Year */}
              <motion.div
                custom={2}
                variants={textReveal}
                className="flex flex-wrap items-center gap-4"
                style={{ color: `${theme.secondary}99` }}
              >
                {artist.nationality && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" strokeWidth={1.5} style={{ color: theme.primary }} />
                    <span>{artist.nationality}</span>
                  </div>
                )}
                {artist.birthYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" strokeWidth={1.5} style={{ color: theme.primary }} />
                    <span>Born {artist.birthYear}</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Stats */}
            <motion.div
              custom={3}
              variants={textReveal}
              className="flex flex-wrap gap-8 py-8 border-y"
              style={{ borderColor: `${theme.primary}20` }}
            >
              {artworks.length > 0 && (
                <div>
                  <span 
                    className="text-3xl font-bold"
                    style={{ color: theme.primary }}
                  >
                    {artworks.length}
                  </span>
                  <span 
                    className="text-sm ml-2"
                    style={{ color: `${theme.secondary}99` }}
                  >
                    Artworks
                  </span>
                </div>
              )}
              {artist.awards && artist.awards.length > 0 && (
                <>
                  <div 
                    className="w-px h-12"
                    style={{ backgroundColor: `${theme.primary}20` }}
                  />
                  <div>
                    <span 
                      className="text-3xl font-bold"
                      style={{ color: theme.primary }}
                    >
                      {artist.awards.length}
                    </span>
                    <span 
                      className="text-sm ml-2"
                      style={{ color: `${theme.secondary}99` }}
                    >
                      Awards
                    </span>
                  </div>
                </>
              )}
              {artist.exhibitions && artist.exhibitions.length > 0 && (
                <>
                  <div 
                    className="w-px h-12"
                    style={{ backgroundColor: `${theme.primary}20` }}
                  />
                  <div>
                    <span 
                      className="text-3xl font-bold"
                      style={{ color: theme.primary }}
                    >
                      {artist.exhibitions.length}
                    </span>
                    <span 
                      className="text-sm ml-2"
                      style={{ color: `${theme.secondary}99` }}
                    >
                      Exhibitions
                    </span>
                  </div>
                </>
              )}
            </motion.div>

            {/* Biography */}
            <motion.div custom={4} variants={textReveal}>
              <h2 
                className="text-sm tracking-[0.2em] uppercase mb-4"
                style={{ color: theme.primary }}
              >
                Biography
              </h2>
              <p 
                className="text-lg leading-relaxed whitespace-pre-wrap"
                style={{ color: `${theme.secondary}cc` }}
              >
                {artist.biography || "No biography provided for this artist."}
              </p>
            </motion.div>

            {/* Contact & Social */}
            <motion.div
              custom={6}
              variants={textReveal}
              className="space-y-4 pt-6 border-t"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <h2 
                className="text-sm tracking-[0.2em] uppercase mb-4"
                style={{ color: theme.primary }}
              >
                Connect
              </h2>

              <div className="flex flex-wrap gap-4">
                {artist.email && (
                  <motion.a
                    href={`mailto:${artist.email}`}
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-2 px-4 py-3 transition-colors border"
                    style={{ borderColor: `${theme.primary}30` }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.primary}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.primary}30`}
                  >
                    <Mail className="w-4 h-4" strokeWidth={1.5} style={{ color: theme.primary }} />
                    <span className="text-sm" style={{ color: theme.secondary }}>Email</span>
                  </motion.a>
                )}

                {artist.socialMedia?.website && (
                  <motion.a
                    href={artist.socialMedia.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-2 px-4 py-3 transition-colors border"
                    style={{ borderColor: `${theme.primary}30` }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.primary}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.primary}30`}
                  >
                    <ExternalLink className="w-4 h-4" strokeWidth={1.5} style={{ color: theme.primary }} />
                    <span className="text-sm" style={{ color: theme.secondary }}>Website</span>
                  </motion.a>
                )}
              </div>

              {/* Social Icons */}
              {(artist.socialMedia?.instagram || artist.socialMedia?.facebook || artist.socialMedia?.twitter) && (
                <div className="flex items-center gap-3 pt-4">
                  {artist.socialMedia?.instagram && (
                    <motion.a
                      href={`https://instagram.com/${artist.socialMedia.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -3, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 flex items-center justify-center transition-all border"
                      style={{ borderColor: `${theme.primary}30`, color: theme.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.primary;
                        e.currentTarget.style.backgroundColor = theme.primary;
                        e.currentTarget.style.color = theme.white;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${theme.primary}30`;
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.primary;
                      }}
                    >
                      <Instagram className="w-5 h-5" strokeWidth={1.5} />
                    </motion.a>
                  )}
                  {artist.socialMedia?.facebook && (
                    <motion.a
                      href={`https://facebook.com/${artist.socialMedia.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -3, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 flex items-center justify-center transition-all border"
                      style={{ borderColor: `${theme.primary}30`, color: theme.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.primary;
                        e.currentTarget.style.backgroundColor = theme.primary;
                        e.currentTarget.style.color = theme.white;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${theme.primary}30`;
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.primary;
                      }}
                    >
                      <Facebook className="w-5 h-5" strokeWidth={1.5} />
                    </motion.a>
                  )}
                  {artist.socialMedia?.twitter && (
                    <motion.a
                      href={`https://twitter.com/${artist.socialMedia.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -3, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 flex items-center justify-center transition-all border"
                      style={{ borderColor: `${theme.primary}30`, color: theme.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.primary;
                        e.currentTarget.style.backgroundColor = theme.primary;
                        e.currentTarget.style.color = theme.white;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${theme.primary}30`;
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.primary;
                      }}
                    >
                      <Twitter className="w-5 h-5" strokeWidth={1.5} />
                    </motion.a>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Awards Section */}
      {artist.awards && artist.awards.length > 0 && (
        <section 
          className="relative z-10 border-t"
          style={{ borderColor: `${theme.primary}20` }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="w-16 h-px mx-auto mb-8"
                style={{ backgroundColor: theme.primary }}
              />

              <span 
                className="text-sm tracking-[0.3em] uppercase block mb-4"
                style={{ color: theme.primary }}
              >
                Recognition
              </span>

              <h2 
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ color: theme.secondary }}
              >
                Awards & Honors
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {artist.awards.map((award, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 transition-colors border"
                  style={{ 
                    backgroundColor: theme.white,
                    borderColor: `${theme.primary}20`
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.primary}50`}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.primary}20`}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 flex items-center justify-center flex-shrink-0 border"
                      style={{ borderColor: `${theme.primary}30` }}
                    >
                      <Award className="w-6 h-6" strokeWidth={1.5} style={{ color: theme.primary }} />
                    </div>
                    <div>
                      <h4 
                        className="text-lg font-bold mb-1"
                        style={{ color: theme.secondary }}
                      >
                        {award.title}
                      </h4>
                      {award.year && (
                        <p 
                          className="text-sm mb-2"
                          style={{ color: theme.primary }}
                        >
                          {award.year}
                        </p>
                      )}
                      {award.description && (
                        <p 
                          className="text-sm"
                          style={{ color: `${theme.secondary}b3` }}
                        >
                          {award.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Exhibitions Section */}
      {artist.exhibitions && artist.exhibitions.length > 0 && (
        <section 
          className="relative z-10 border-t"
          style={{ borderColor: `${theme.primary}20`, backgroundColor: `${theme.accent}10` }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span 
                className="text-sm tracking-[0.3em] uppercase block mb-4"
                style={{ color: theme.primary }}
              >
                Showcases
              </span>

              <h2 
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ color: theme.secondary }}
              >
                Exhibitions
              </h2>
            </motion.div>

            <div className="space-y-4">
              {artist.exhibitions.map((exhibition, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 transition-colors border"
                  style={{ 
                    backgroundColor: theme.white,
                    borderColor: `${theme.primary}20`
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.primary}50`}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.primary}20`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 
                        className="text-lg font-bold mb-1"
                        style={{ color: theme.secondary }}
                      >
                        {exhibition.title}
                      </h4>
                      <div 
                        className="flex flex-wrap items-center gap-4 text-sm"
                        style={{ color: `${theme.secondary}99` }}
                      >
                        {exhibition.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} style={{ color: theme.primary }} />
                            {exhibition.location}
                          </span>
                        )}
                        {exhibition.year && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} style={{ color: theme.primary }} />
                            {exhibition.year}
                          </span>
                        )}
                      </div>
                    </div>
                    {exhibition.description && (
                      <p 
                        className="text-sm sm:max-w-md"
                        style={{ color: `${theme.secondary}b3` }}
                      >
                        {exhibition.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Artworks Section */}
      <section 
        className="relative z-10 border-t"
        style={{ borderColor: `${theme.primary}20` }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="w-16 h-px mx-auto mb-8"
              style={{ backgroundColor: theme.primary }}
            />

            <span 
              className="text-sm tracking-[0.3em] uppercase block mb-4"
              style={{ color: theme.primary }}
            >
              Collection
            </span>

            <h2 
              className="text-4xl sm:text-5xl font-bold mb-4"
              style={{ color: theme.secondary }}
            >
              Artworks by {artist.name}
            </h2>

            {/* Decorative element */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-12 h-px origin-right"
                style={{ backgroundColor: `${theme.primary}40` }}
              />
              <motion.div
                initial={{ scale: 0, rotate: 45 }}
                whileInView={{ scale: 1, rotate: 45 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="w-2 h-2 border"
                style={{ borderColor: `${theme.primary}60` }}
              />
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-12 h-px origin-left"
                style={{ backgroundColor: `${theme.primary}40` }}
              />
            </div>
          </motion.div>

          {/* Products Grid */}
          {loadingArtworks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="aspect-[4/5] relative overflow-hidden border"
                  style={{ borderColor: `${theme.primary}20` }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ 
                      background: `linear-gradient(90deg, transparent, ${theme.accent}50, transparent)` 
                    }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </div>
          ) : artworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {artworks.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-flex items-center justify-center w-20 h-20 mb-6 border"
                style={{ borderColor: `${theme.primary}20` }}
              >
                <Palette className="w-8 h-8" strokeWidth={1} style={{ color: `${theme.primary}60` }} />
              </motion.div>
              <p style={{ color: `${theme.secondary}b3` }} className="text-lg">
                No artworks available at the moment.
              </p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="w-16 h-px mx-auto mt-6"
                style={{ backgroundColor: `${theme.primary}20` }}
              />
            </motion.div>
          )}

          {/* View More Link */}
          {artworks.length > 6 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-16"
            >
              <Link
                to={`/products?artist=${artist._id}`}
                className="group inline-flex items-center gap-3"
                style={{ color: theme.primary }}
              >
                <span className="relative font-medium">
                  View All Artworks
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-px origin-left"
                    style={{ backgroundColor: theme.primary }}
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Bottom Decorative Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 py-16 border-t"
        style={{ borderColor: `${theme.primary}20` }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <FlowerDecor className="w-8 h-8" color={`${theme.primary}25`} />
              <div>
                <p style={{ color: `${theme.secondary}80` }} className="text-sm">Explore more artists</p>
                <p style={{ color: theme.secondary }} className="font-medium">Discover our curated collection</p>
              </div>
            </div>

            <Link to="/artists" className="group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-6 py-3 transition-colors border"
                style={{ borderColor: theme.primary, color: theme.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.primary;
                  e.currentTarget.style.color = theme.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = theme.primary;
                }}
              >
                <span className="font-medium">Browse All Artists</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Final decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="w-32 h-px mx-auto mt-12"
          style={{ backgroundColor: `${theme.primary}25` }}
        />

        {/* Bottom rotating flower */}
        <div className="flex justify-center mt-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <FlowerDecor className="w-6 h-6" color={`${theme.primary}30`} />
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default ArtistDetails;