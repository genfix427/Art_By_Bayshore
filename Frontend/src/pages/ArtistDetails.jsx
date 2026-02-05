// pages/ArtistDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Globe, 
  Calendar, 
  Award, 
  Palette,
  Star,
  Sparkles,
  ExternalLink,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Link as LinkIcon,
  Users,
  ChevronRight
} from 'lucide-react';
import ArtistCard from '../components/artists/ArtistCard';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { artistService, productService } from '../api/services';
import { useSEO } from '../hooks/useSEO';

const ArtistDetails = () => {
  const { slug } = useParams();
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('artworks');

  useSEO({
    title: artist ? `${artist.name} | Artist Profile` : 'Artist Profile',
    description: artist?.biography?.substring(0, 160) || 'Artist profile page',
  });

  useEffect(() => {
    fetchArtistDetails();
  }, [slug]);

  const fetchArtistDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch artist details
      const artistResponse = await artistService.getBySlug(slug);
      setArtist(artistResponse.data);
      
      // Fetch artist's artworks
      const artworksResponse = await productService.getAll({
        artist: artistResponse.data._id,
        isActive: true,
        limit: 12,
      });
      setArtworks(artworksResponse.data);
      
    } catch (error) {
      console.error('Error fetching artist details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Artist not found</h2>
          <Link
            to="/artists"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Artists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Animated Background Sketches */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-gray-300 rounded-full opacity-5"></div>
        <div className="absolute top-40 right-20 w-32 h-32 border-4 border-gray-200 rounded-full opacity-10 rotate-45"></div>
        <div className="absolute bottom-40 left-1/4 w-48 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-5"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 border border-gray-300 rotate-12 opacity-5"></div>
        <div className="absolute bottom-20 left-2/3 w-24 h-24 border-2 border-gray-400 rounded-full opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/artists"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Artists
        </Link>

        {/* Artist Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-xl mb-12"
        >
          <div className="grid lg:grid-cols-3">
            {/* Left: Artist Image */}
            <div className="lg:col-span-1 relative h-96 lg:h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black">
                {artist.profileImage ? (
                  <img
                    src={artist.profileImage}
                    alt={artist.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Palette className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>
              
              {/* Featured Badge */}
              {artist.isFeatured && (
                <div className="absolute top-6 left-6">
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    <Star size={16} fill="currentColor" />
                    Featured Artist
                  </span>
                </div>
              )}
            </div>

            {/* Right: Artist Info */}
            <div className="lg:col-span-2 p-8 lg:p-12">
              <div className="mb-6">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  {artist.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {artist.nationality && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe size={18} />
                      <span className="font-medium">{artist.nationality}</span>
                    </div>
                  )}
                  
                  {artist.birthYear && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={18} />
                      <span className="font-medium">Born {artist.birthYear}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {artist.socialMedia && Object.values(artist.socialMedia).some(Boolean) && (
                  <div className="flex items-center gap-4 mb-8">
                    {artist.socialMedia.website && (
                      <a
                        href={artist.socialMedia.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <LinkIcon size={20} className="text-gray-700" />
                      </a>
                    )}
                    {artist.socialMedia.instagram && (
                      <a
                        href={`https://instagram.com/${artist.socialMedia.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Instagram size={20} className="text-gray-700" />
                      </a>
                    )}
                    {artist.socialMedia.facebook && (
                      <a
                        href={`https://facebook.com/${artist.socialMedia.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Facebook size={20} className="text-gray-700" />
                      </a>
                    )}
                    {artist.socialMedia.twitter && (
                      <a
                        href={`https://twitter.com/${artist.socialMedia.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Twitter size={20} className="text-gray-700" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {artist.artworksCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Artworks</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {artist.awards?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Awards</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {artist.exhibitions?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Exhibitions</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {artist.artStyle?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Styles</div>
                </div>
              </div>

              {/* Biography */}
              {artist.biography && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">About the Artist</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {artist.biography}
                  </p>
                </div>
              )}

              {/* Art Styles */}
              {artist.artStyle && artist.artStyle.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Art Styles</h3>
                  <div className="flex flex-wrap gap-2">
                    {artist.artStyle.map((style, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white rounded-full font-medium"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('artworks')}
              className={`px-6 py-4 font-semibold text-lg border-b-2 transition-all ${
                activeTab === 'artworks'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Artworks ({artworks.length})
            </button>
            {artist.awards && artist.awards.length > 0 && (
              <button
                onClick={() => setActiveTab('awards')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-all ${
                  activeTab === 'awards'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Awards ({artist.awards.length})
              </button>
            )}
            {artist.exhibitions && artist.exhibitions.length > 0 && (
              <button
                onClick={() => setActiveTab('exhibitions')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-all ${
                  activeTab === 'exhibitions'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Exhibitions ({artist.exhibitions.length})
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'artworks' && (
            <>
              {artworks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {artworks.map((artwork, index) => (
                    <ProductCard key={artwork._id} product={artwork} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Palette className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    No artworks available
                  </h3>
                  <p className="text-gray-600">
                    This artist doesn't have any artworks listed yet.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'awards' && artist.awards && artist.awards.length > 0 && (
            <div className="space-y-6">
              {artist.awards.map((award, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {award.title}
                      </h4>
                      <div className="flex items-center gap-4 text-gray-600 mb-3">
                        {award.year && (
                          <span className="flex items-center gap-1">
                            <Calendar size={16} />
                            {award.year}
                          </span>
                        )}
                      </div>
                      {award.description && (
                        <p className="text-gray-600">{award.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'exhibitions' && artist.exhibitions && artist.exhibitions.length > 0 && (
            <div className="space-y-6">
              {artist.exhibitions.map((exhibition, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <MapPin className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {exhibition.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-3">
                        {exhibition.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={16} />
                            {exhibition.location}
                          </span>
                        )}
                        {exhibition.year && (
                          <span className="flex items-center gap-1">
                            <Calendar size={16} />
                            {exhibition.year}
                          </span>
                        )}
                      </div>
                      {exhibition.description && (
                        <p className="text-gray-600">{exhibition.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* View All Link */}
        {artworks.length > 0 && activeTab === 'artworks' && (
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <Link
              to={`/products?artist=${artist._id}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 group"
            >
              View All Artworks by {artist.name}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 border-12 border-gray-100 rounded-full opacity-10"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 border-8 border-gray-200 rounded-full opacity-5 rotate-45"></div>
    </div>
  );
};

export default ArtistDetails;