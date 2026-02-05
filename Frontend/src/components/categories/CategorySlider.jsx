// components/categories/CategorySlider.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Sparkles, 
  FolderTree,
  TrendingUp,
  Hash
} from 'lucide-react';
import CategoryCard from './CategoryCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { categoryService } from '../../api/services';

const CategorySlider = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoSlide, setAutoSlide] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (autoSlide && categories.length > 0) {
      const interval = setInterval(() => {
        handleNext();
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [autoSlide, categories.length]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll({
        isActive: true,
        parentCategory: null, // Get only parent categories
        limit: 12,
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentSlide(prev => (prev === 0 ? Math.ceil(categories.length / 3) - 1 : prev - 1));
    setAutoSlide(false);
    setTimeout(() => setAutoSlide(true), 10000);
  };

  const handleNext = () => {
    setCurrentSlide(prev => (prev === Math.ceil(categories.length / 3) - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setAutoSlide(false);
    setTimeout(() => setAutoSlide(true), 10000);
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  // Group categories into slides of 3
  const slides = [];
  for (let i = 0; i < categories.length; i += 3) {
    slides.push(categories.slice(i, i + 3));
  }

  return (
    <div className="relative py-16 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Animated Background Sketches */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-16 w-64 h-64 border-4 border-gray-200 rounded-full opacity-10"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 border-2 border-gray-300 rounded-full opacity-5"></div>
        <div className="absolute top-1/3 left-1/4 w-48 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-10"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-0.5 bg-gray-400 rotate-45 opacity-5"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-px bg-gray-900"></span>
            <FolderTree className="w-6 h-6 text-gray-700" />
            <span className="w-8 h-px bg-gray-900"></span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Browse by <span className="relative">
              Category
              <Sparkles className="absolute -top-2 -right-6 w-5 h-5 text-gray-600" />
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Explore our curated collection organized by artistic styles and themes
          </p>

          {/* Stats */}
          <div className="flex justify-center items-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <FolderTree className="w-6 h-6 text-gray-600" />
                {categories.length}+
              </div>
              <div className="text-sm text-gray-600 mt-1">Categories</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <Layers className="w-6 h-6 text-gray-600" />
                500+
              </div>
              <div className="text-sm text-gray-600 mt-1">Artworks</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <Hash className="w-6 h-6 text-gray-600" />
                50+
              </div>
              <div className="text-sm text-gray-600 mt-1">Subcategories</div>
            </div>
          </div>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-full hover:bg-white hover:shadow-lg transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-full hover:bg-white hover:shadow-lg transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          {/* Main Slider */}
          <div className="overflow-hidden px-12">
            <motion.div
              ref={sliderRef}
              animate={{ x: `-${currentSlide * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex"
            >
              {slides.map((slideCategories, slideIndex) => (
                <div
                  key={slideIndex}
                  className="w-full flex-shrink-0 px-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slideCategories.map((category, index) => (
                      <CategoryCard 
                        key={category._id} 
                        category={category} 
                        index={index} 
                        variant="slider" 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Dots Indicator */}
          {slides.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentSlide === index
                      ? 'w-8 bg-gray-900'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 group"
          >
            <span>Browse All Categories</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 border-8 border-gray-100 rounded-full opacity-10"></div>
      <div className="absolute -top-10 -right-10 w-40 h-40 border-4 border-gray-200 rounded-full opacity-5 rotate-45"></div>
    </div>
  );
};

export default CategorySlider;