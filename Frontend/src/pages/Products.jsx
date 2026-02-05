import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { useDebounce } from '../hooks/useDebounce';
import ProductCard from '../components/products/ProductCard';
import ProductFilters from '../components/products/ProductFilters';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Products = () => {
  useSEO({
    title: 'Browse Artworks',
    description: 'Browse our complete collection of artworks and paintings',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || '',
    productType: searchParams.get('productType') || '',
    page: parseInt(searchParams.get('page')) || 1,
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    fetchProducts();
  }, [filters.page, debouncedSearch, filters.category, filters.minPrice, filters.maxPrice, filters.sortBy, filters.productType]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: 12,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.productType && { productType: filters.productType }),
        isActive: true,
      };

      const response = await productService.getAll(params);
      setProducts(response.data);
      setPagination(response.pagination);

      // Update URL params
      const newSearchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) newSearchParams.set(key, params[key]);
      });
      setSearchParams(newSearchParams);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters,
      page: 1,
    });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Browse Artworks</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Filters Sidebar */}
        <aside>
          <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
        </aside>

        {/* Products Grid */}
        <main>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {products.length > 0 ? (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '2rem',
                  }}>
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>

                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                }}>
                  <h3>No products found</h3>
                  <p style={{ color: '#666', marginTop: '1rem' }}>
                    Try adjusting your filters or search terms
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;