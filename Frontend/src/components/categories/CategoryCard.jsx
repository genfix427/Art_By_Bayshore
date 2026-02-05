// components/categories/CategoryCard.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Layers, 
  ChevronRight,
  Sparkles,
  Hash,
  FolderOpen,
  Image
} from 'lucide-react';

const CategoryCard = ({ category, index, variant = 'default' }) => {
  const isSlider = variant === 'slider';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 ${
        isSlider ? 'w-[300px] flex-shrink-0' : 'w-full'
      }`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-6 left-6 w-8 h-8 border-2 border-gray-400 rounded-full"></div>
        <div className="absolute bottom-6 right-6 w-6 h-6 border border-gray-400 rotate-45"></div>
        <div className="absolute top-1/2 left-1/3 w-12 h-px bg-gray-400"></div>
      </div>

      {/* Category Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
        {category.image ? (
          <motion.img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="w-16 h-16 text-gray-300" />
          </div>
        )}
        
        {/* Products Count Badge */}
        <div className="absolute top-4 right-4">
          <span className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Layers size={12} />
            {category.productsCount || 0} items
          </span>
        </div>

        {/* Subcategories Badge */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Hash size={12} />
              {category.subcategories.length} subcategories
            </span>
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>

      {/* Category Info */}
      <div className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
              {category.name}
            </h3>
            
            {/* Parent Category */}
            {category.parentCategory && (
              <div className="text-sm text-gray-500 mb-3">
                Subcategory of{' '}
                <span className="font-medium text-gray-700">
                  {category.parentCategory.name}
                </span>
              </div>
            )}
          </div>
          
          {/* Action Button */}
          <Link
            to={`/categories/${category.slug || category._id}`}
            className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors group/btn"
          >
            <ChevronRight size={18} className="text-gray-700 group-hover/btn:text-black group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Description */}
        {category.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {category.description}
          </p>
        )}

        {/* Subcategories Preview */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Subcategories
            </div>
            <div className="flex flex-wrap gap-1">
              {category.subcategories.slice(0, 3).map((sub, idx) => (
                <span
                  key={sub._id || idx}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {sub.name}
                </span>
              ))}
              {category.subcategories.length > 3 && (
                <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                  +{category.subcategories.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* View Button */}
        <Link
          to={`/categories/${category.slug || category._id}`}
          className="w-full py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:from-black group-hover:to-gray-900"
        >
          <FolderOpen size={18} />
          Explore Category
          <Sparkles size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-300 rounded-2xl transition-all duration-300 pointer-events-none"></div>
    </motion.div>
  );
};

export default CategoryCard;