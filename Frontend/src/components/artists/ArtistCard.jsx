// components/artists/ArtistCard.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Star, Palette } from 'lucide-react';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=800&fit=crop&q=80';

// Corner decoration
const CornerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M0 0 L24 0 L24 3 L3 3 L3 24 L0 24 Z" fill="currentColor" />
  </svg>
);

const ArtistCard = ({ artist, index = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = artist.profileImage || PLACEHOLDER_IMAGE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      <Link to={`/artists/${artist.slug}`}>
        {/* Image Container */}
        <div className="relative overflow-hidden border border-gray-900/10 bg-white mb-6">
          {/* Loading Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          )}

          {/* Image */}
          <motion.div
            className="aspect-[4/3] overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4 }}
          >
            <img
              src={imageUrl}
              alt={artist.name}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = PLACEHOLDER_IMAGE;
                setImageLoaded(true);
              }}
              className={`w-full h-full object-cover transition-all duration-700 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } ${isHovered ? 'scale-105' : 'scale-100'}`}
            />
          </motion.div>

          {/* Corner Decorations */}
          <div className="absolute top-3 left-3">
            <CornerDecor className="w-4 h-4 text-gray-900/10 group-hover:text-gray-900/30 transition-colors" />
          </div>
          <div className="absolute top-3 right-3 rotate-90">
            <CornerDecor className="w-4 h-4 text-gray-900/10 group-hover:text-gray-900/30 transition-colors" />
          </div>
          <div className="absolute bottom-3 left-3 -rotate-90">
            <CornerDecor className="w-4 h-4 text-gray-900/10 group-hover:text-gray-900/30 transition-colors" />
          </div>
          <div className="absolute bottom-3 right-3 rotate-180">
            <CornerDecor className="w-4 h-4 text-gray-900/10 group-hover:text-gray-900/30 transition-colors" />
          </div>

          {/* Featured Badge */}
          {artist.isFeatured && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 left-4 z-10"
            >
              <span className="bg-gray-900 text-white px-3 py-1 text-xs font-bold tracking-wider flex items-center gap-1">
                <Star size={10} fill="currentColor" />
                FEATURED
              </span>
            </motion.div>
          )}

          {/* Hover Overlay */}
          <motion.div
            className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/10 transition-colors duration-300 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: isHovered ? 1 : 0, rotate: isHovered ? 0 : -180 }}
              transition={{ duration: 0.3 }}
              className="w-12 h-12 bg-white flex items-center justify-center"
            >
              <ArrowRight size={20} className="text-gray-900" />
            </motion.div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="text-center">
          {/* Decorative Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="w-8 h-px bg-gray-900/20 mx-auto mb-4"
          />

          {/* Name */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
            {artist.name}
          </h3>

          {/* Nationality */}
          {artist.nationality && (
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">
              {artist.nationality}
            </p>
          )}

          {/* Description - Limited to 4 lines */}
          {artist.biography && (
            <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-4">
              {artist.biography}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            {artist.artworksCount > 0 && (
              <div className="flex items-center gap-1">
                <Palette size={14} />
                <span>{artist.artworksCount} Works</span>
              </div>
            )}
            {artist.awards && artist.awards.length > 0 && (
              <div className="flex items-center gap-1">
                <Star size={14} />
                <span>{artist.awards.length} Awards</span>
              </div>
            )}
          </div>

          {/* View Profile Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="mt-4"
          >
            <span className="text-sm font-medium text-gray-900 inline-flex items-center gap-2">
              View Profile
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ArtistCard;