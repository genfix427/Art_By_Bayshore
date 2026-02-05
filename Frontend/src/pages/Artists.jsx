// pages/Artists.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Users, 
  Star, 
  Palette,
  Sparkles,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react';
import ArtistCard from '../components/artists/ArtistCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { artistService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import ArtistSlider from '../components/artists/ArtistSlider';

const Artists = () => {
  useSEO({
    title: 'Artists Collection | Discover Talented Creators',
    description: 'Explore our curated collection of talented artists from around the world',
  });

  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    isFeatured: false,
    hasAwards: false,
    hasExhibitions: false,
    nationality: '',
  });
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchArtists();
  }, []);

  useEffect(() => {
    filterAndSortArtists();
  }, [artists, search, activeFilters, sortBy]);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const response = await artistService.getAll({
        isActive: true,
        limit: 50,
      });
      setArtists(response.data);
      setFilteredArtists(response.data);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortArtists = () => {
    let filtered = [...artists];

    // Search filter
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

    // Other filters
    if (activeFilters.isFeatured) {
      filtered = filtered.filter(artist => artist.isFeatured);
    }
    if (activeFilters.hasAwards) {
      filtered = filtered.filter(artist => 
        artist.awards && artist.awards.length > 0
      );
    }
    if (activeFilters.hasExhibitions) {
      filtered = filtered.filter(artist => 
        artist.exhibitions && artist.exhibitions.length > 0
      );
    }
    if (activeFilters.nationality) {
      filtered = filtered.filter(artist => 
        artist.nationality === activeFilters.nationality
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'artworks':
          return (b.artworksCount || 0) - (a.artworksCount || 0);
        case 'awards':
          return (b.awards?.length || 0) - (a.awards?.length || 0);
        case 'featured':
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        default:
          return 0;
      }
    });

    setFilteredArtists(filtered);
  };

  const handleFilterToggle = (filter) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  const handleNationalityChange = (nationality) => {
    setActiveFilters(prev => ({
      ...prev,
      nationality: prev.nationality === nationality ? '' : nationality,
    }));
  };

  const clearFilters = () => {
    setSearch('');
    setActiveFilters({
      isFeatured: false,
      hasAwards: false,
      hasExhibitions: false,
      nationality: '',
    });
    setSortBy('name');
  };

  const hasActiveFilters = search || 
    activeFilters.isFeatured || 
    activeFilters.hasAwards || 
    activeFilters.hasExhibitions || 
    activeFilters.nationality;

  const getUniqueNationalities = () => {
    const nationalities = artists
      .map(artist => artist.nationality)
      .filter(Boolean);
    return [...new Set(nationalities)].sort();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Animated Background Sketches */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-16 h-16 border-2 border-gray-300 rounded-full opacity-5 animate-pulse"></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 border-4 border-gray-200 rounded-full opacity-10"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-5"></div>
        <div className="absolute top-1/3 right-1/4 w-20 h-20 border border-gray-300 rotate-45 opacity-5"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 border-2 border-gray-400 rounded-full opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12 md:py-20"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-px bg-gray-900"></div>
            <Palette className="w-8 h-8 text-gray-700" />
            <div className="w-12 h-px bg-gray-900"></div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Meet Our <span className="relative">
              Artists
              <Sparkles className="absolute -top-4 -right-8 w-6 h-6 text-yellow-500 animate-pulse" />
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
            Discover the brilliant minds behind our exceptional collection of artworks. 
            Each artist brings a unique perspective and creative vision.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search artists by name, style, or nationality..."
                className="w-full pl-16 pr-6 py-5 bg-white border-2 border-gray-200 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:shadow-xl transition-all duration-300"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Users className="w-8 h-8 text-gray-600" />
                {artists.length}
              </div>
              <div className="text-sm text-gray-600">Total Artists</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Star className="w-8 h-8 text-yellow-500" />
                {artists.filter(a => a.isFeatured).length}
              </div>
              <div className="text-sm text-gray-600">Featured Artists</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Award className="w-8 h-8 text-amber-600" />
                {artists.filter(a => a.awards?.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">Award Winners</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Globe className="w-8 h-8 text-blue-600" />
                {getUniqueNationalities().length}+
              </div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
          </div>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="text-gray-600" size={20} />
                  <span className="font-semibold text-gray-700">Filters:</span>
                </div>
                
                <button
                  onClick={() => handleFilterToggle('isFeatured')}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilters.isFeatured
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star size={16} />
                  Featured
                </button>

                <button
                  onClick={() => handleFilterToggle('hasAwards')}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilters.hasAwards
                      ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Award size={16} />
                  Award Winners
                </button>

                <button
                  onClick={() => handleFilterToggle('hasExhibitions')}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilters.hasExhibitions
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp size={16} />
                  Exhibitions
                </button>
              </div>

              {/* Right: View and Sort Controls */}
              <div className="flex flex-wrap items-center gap-4">
                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="Grid View"
                  >
                    <div className="w-5 h-5 grid grid-cols-2 gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-gray-700 rounded-sm"></div>
                      ))}
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="List View"
                  >
                    <div className="w-5 h-5 flex flex-col gap-1">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-1 bg-gray-700 rounded-full"></div>
                      ))}
                    </div>
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                >
                  <option value="name">Sort by Name</option>
                  <option value="artworks">Most Artworks</option>
                  <option value="awards">Most Awards</option>
                  <option value="featured">Featured First</option>
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors flex items-center gap-2"
                  >
                    <X size={16} />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Nationality Filter */}
            {getUniqueNationalities().length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Filter by Nationality:</h4>
                <div className="flex flex-wrap gap-2">
                  {getUniqueNationalities().map(nationality => (
                    <button
                      key={nationality}
                      onClick={() => handleNationalityChange(nationality)}
                      className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                        activeFilters.nationality === nationality
                          ? 'bg-gradient-to-r from-gray-900 to-black text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {nationality}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Artists Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="large" />
          </div>
        ) : filteredArtists.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className={`grid ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'
                : 'grid-cols-1 gap-6'
            }`}>
              <AnimatePresence>
                {filteredArtists.map((artist, index) => (
                  <ArtistCard key={artist._id} artist={artist} index={index} />
                ))}
              </AnimatePresence>
            </div>

            {/* Results Count */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 text-center">
                Showing <span className="font-bold text-gray-900">{filteredArtists.length}</span> of{' '}
                <span className="font-bold text-gray-900">{artists.length}</span> artists
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No artists found
              </h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any artists matching your search criteria.
              </p>
              <button
                onClick={clearFilters}
                className="px-8 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200"
              >
                Clear all filters
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Decorative Bottom Elements */}
      <div className="absolute -bottom-40 -left-40 w-96 h-96 border-12 border-gray-100 rounded-full opacity-10"></div>
      <div className="absolute -bottom-20 -right-20 w-64 h-64 border-8 border-gray-200 rounded-full opacity-5 rotate-12"></div>
    </div>
  );
};

export default Artists;