import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArtistSlider from '../components/artists/ArtistSlider';
import CategorySlider from '../components/categories/CategorySlider';
import HeroSlider from '../components/home/HeroSlider';
import AboutCompanySection from '../components/home/AboutCompanySection';
import AnimatedBanner from '../components/home/AnimatedBanner';
import TrustBar from '../components/home/TrustBar';

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
      <HeroSlider />
      <AboutCompanySection />
      <CategorySlider 
        title="Browse by Category"
        subtitle="Explore our curated collection organized by artistic styles and themes."
        viewAllHref="/categories"
        autoPlay={true}
        autoPlayInterval={6000}
      />
      <AnimatedBanner />
      <ArtistSlider 
        title="Meet Our Artists"
        subtitle="Discover the stories behind every brushstroke."
        viewAllHref="/artists"
        autoPlay={true}
        autoPlayInterval={5000}
      />
      
      <TrustBar />
    </div>
  );
};

export default Home;