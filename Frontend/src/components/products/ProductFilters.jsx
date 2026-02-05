import { useState, useEffect } from 'react';
import { categoryService } from '../../api/services';

const ProductFilters = ({ filters, onFilterChange }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll({ isActive: true });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  return (
    <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h3>Filters</h3>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Search
        </label>
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
        />
      </div>

      {/* Category */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Category
        </label>
        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ category: e.target.value })}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Price Range
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange({ minPrice: e.target.value })}
            style={{ width: '50%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
            style={{ width: '50%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>

      {/* Sort By */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Sort By
        </label>
        <select
          value={filters.sortBy || ''}
          onChange={(e) => onFilterChange({ sortBy: e.target.value })}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
          <option value="popular">Most Popular</option>
          <option value="bestselling">Best Selling</option>
        </select>
      </div>

      {/* Product Type */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Product Type
        </label>
        <select
          value={filters.productType || ''}
          onChange={(e) => onFilterChange({ productType: e.target.value })}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">All Types</option>
          <option value="price-based">Buy Now</option>
          <option value="ask-for-price">Ask Upon Price</option>
        </select>
      </div>

      <button
        onClick={() => onFilterChange({
          search: '',
          category: '',
          minPrice: '',
          maxPrice: '',
          sortBy: '',
          productType: '',
        })}
        style={{
          width: '100%',
          padding: '0.5rem',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Clear Filters
      </button>
    </div>
  );
};

export default ProductFilters;