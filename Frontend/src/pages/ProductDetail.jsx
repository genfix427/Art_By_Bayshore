import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import InquiryForm from '../components/products/InquiryForm';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: product?.title,
    description: product?.metaDescription || product?.description?.substring(0, 160),
    keywords: product?.metaKeywords?.join(', '),
    image: product?.images?.[0]?.url,
    type: 'product',
  });

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getBySlug(slug);
      setProduct(response.data);
      setSelectedImage(response.data.images?.find(img => img.isPrimary) || response.data.images?.[0]);

      // Fetch related products
      if (response.data._id) {
        const relatedResponse = await productService.getRelated(response.data._id);
        setRelatedProducts(relatedResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(product._id, quantity);
    } catch (error) {
      // Error already handled in context
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Product not found</h2>
        <Link to="/products">
          <button style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            Browse Products
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '2rem', fontSize: '0.875rem', color: '#666' }}>
        <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>Home</Link>
        {' > '}
        <Link to="/products" style={{ color: '#007bff', textDecoration: 'none' }}>Products</Link>
        {product.category && (
          <>
            {' > '}
            <Link to={`/categories/${product.category.slug}`} style={{ color: '#007bff', textDecoration: 'none' }}>
              {product.category.name}
            </Link>
          </>
        )}
        {' > '}
        <span>{product.title}</span>
      </nav>

      {/* Product Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
        {/* Images */}
        <div>
          <div style={{
            width: '100%',
            paddingTop: '100%',
            position: 'relative',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            {selectedImage && (
              <img
                src={getImageUrl(selectedImage.url)}
                alt={product.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            )}
          </div>

          {/* Image Thumbnails */}
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {product.images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  style={{
                    width: '80px',
                    height: '80px',
                    border: selectedImage?.url === image.url ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={getImageUrl(image.url)}
                    alt={`${product.title} ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{product.title}</h1>

          {product.artist && (
            <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '1rem' }}>
              by <Link to={`/artists/${product.artist.slug}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                {product.artist.name}
              </Link>
            </p>
          )}

          {product.productType === 'price-based' ? (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {formatCurrency(product.price)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <>
                      <span style={{ fontSize: '1.25rem', color: '#999', textDecoration: 'line-through' }}>
                        {formatCurrency(product.compareAtPrice)}
                      </span>
                      <span style={{
                        backgroundColor: 'green',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                      }}>
                        Save {product.discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {product.stockQuantity > 0 ? (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={product.stockQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stockQuantity, parseInt(e.target.value) || 1)))}
                      style={{ width: '100px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    {product.isLowStock && (
                      <p style={{ color: 'orange', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Only {product.stockQuantity} left in stock
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleAddToCart}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '1.125rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginBottom: '1rem',
                    }}
                  >
                    Add to Cart
                  </button>
                </>
              ) : (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                }}>
                  Out of Stock
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setShowInquiryForm(true)}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.125rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              Ask for Price
            </button>
          )}

          {/* Product Details */}
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Details</h3>
            
            {product.medium && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Medium:</strong> {product.medium}
              </p>
            )}
            
            {product.yearCreated && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Year:</strong> {product.yearCreated}
              </p>
            )}

            {product.dimensions?.artwork && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Dimensions:</strong>{' '}
                {product.dimensions.artwork.length}" × {product.dimensions.artwork.width}" × {product.dimensions.artwork.height}"
              </p>
            )}

            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Type:</strong> {product.isOriginal ? 'Original' : 'Print'}
            </p>

            {product.isFramed && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Framed:</strong> Yes
              </p>
            )}

            {product.edition && product.edition.total && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Edition:</strong> {product.edition.available} of {product.edition.total} available
              </p>
            )}
          </div>

          {/* Description */}
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Description</h3>
            <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{product.description}</p>
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Tags:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>Related Artworks</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {relatedProducts.slice(0, 4).map((relatedProduct) => (
              <ProductCard key={relatedProduct._id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Inquiry Form Modal */}
      {showInquiryForm && (
        <InquiryForm
          product={product}
          onClose={() => setShowInquiryForm(false)}
          onSuccess={() => setShowInquiryForm(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;