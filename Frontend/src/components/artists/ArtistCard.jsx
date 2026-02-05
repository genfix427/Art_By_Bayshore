// components/artists/ArtistCard.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Palette, 
  MapPin, 
  Star, 
  Eye,
  Sparkles,
  ExternalLink,
  Award,
  GalleryVerticalEnd
} from 'lucide-react';

const ArtistCard = ({ artist, index, variant = 'default' }) => {
  const isSlider = variant === 'slider';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 ${
        isSlider ? 'w-[320px] flex-shrink-0' : 'w-full'
      }`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-4 w-12 h-12 border-2 border-gray-400 rounded-full"></div>
        <div className="absolute bottom-8 right-6 w-8 h-8 border border-gray-400 rotate-45"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-px bg-gray-400"></div>
      </div>

      {/* Artist Image */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
        {artist.profileImage ? (
          <motion.img
            src={artist.profileImage}
            alt={artist.name}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Palette className="w-16 h-16 text-gray-300" />
          </div>
        )}
        
        {/* Featured Badge */}
        {artist.isFeatured && (
          <div className="absolute top-4 right-4">
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              Featured
            </span>
          </div>
        )}

        {/* Art Style Tags */}
        {artist.artStyle && artist.artStyle.length > 0 && (
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-1">
            {artist.artStyle.slice(0, 2).map((style, idx) => (
              <span 
                key={idx}
                className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium"
              >
                {style}
              </span>
            ))}
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>

      {/* Artist Info */}
      <div className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
              {artist.name}
            </h3>
            {artist.nationality && (
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin size={14} className="mr-1" />
                {artist.nationality}
              </div>
            )}
          </div>
          
          {/* Artist Actions */}
          <Link
            to={`/artists/${artist.slug || artist._id}`}
            className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors group/btn"
          >
            <ExternalLink size={18} className="text-gray-700 group-hover/btn:text-black" />
          </Link>
        </div>

        {/* Bio Excerpt */}
        {artist.biography && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {artist.biography.substring(0, 100)}...
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-700">
              <GalleryVerticalEnd size={16} />
              <span className="text-xs font-medium">Artworks</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {artist.artworksCount || 0}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Award size={16} />
              <span className="text-xs font-medium">Awards</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {artist.awards?.length || 0}
            </div>
          </div>
        </div>

        {/* View Button */}
        <Link
          to={`/artists/${artist.slug || artist._id}`}
          className="w-full py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:from-black group-hover:to-gray-900"
        >
          <Eye size={18} />
          View Portfolio
          <Sparkles size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-300 rounded-2xl transition-all duration-300 pointer-events-none"></div>
    </motion.div>
  );
};

export default ArtistCard;