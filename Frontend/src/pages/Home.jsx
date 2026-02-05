import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
  useSEO({
    title: 'Home',
    description: 'Discover unique artworks and paintings from talented artists. Buy original art online.',
  });

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productService.getFeatured();
      setFeaturedProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            Discover Unique Artworks
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
            Explore our curated collection of original paintings and artworks from talented artists around the world
          </p>
          <Link to="/products">
            <button className='text-red-900 p-6 cursor-pointer'>
              Browse Collection
            </button>
          </Link>
        </div>
        <div className="bg-red-500 text-white p-10">
  Tailwind is working
</div>

      </section>

      {/* Featured Products */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
            Featured Artworks
          </h2>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {featuredProducts.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '2rem',
                }}>
                  {featuredProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#666' }}>No featured products available</p>
              )}

              {featuredProducts.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                  <Link to="/products">
                    <button style={{
                      padding: '0.75rem 2rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}>
                      View All Products
                    </button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;