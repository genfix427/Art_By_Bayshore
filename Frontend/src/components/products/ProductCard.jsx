import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency, getImageUrl } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(product._id, 1);
    } catch (error) {
      // Error already handled in context
    }
  };

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'transform 0.2s',
      cursor: 'pointer',
    }}>
      <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{
          width: '100%',
          paddingTop: '100%',
          position: 'relative',
          backgroundColor: '#f5f5f5',
        }}>
          {primaryImage && (
            <img
              src={getImageUrl(primaryImage.url)}
              alt={product.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
          {product.isFeatured && (
            <span style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'gold',
              color: 'black',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}>
              Featured
            </span>
          )}
        </div>

        <div style={{ padding: '1rem' }}>
          <h3 style={{
            fontSize: '1rem',
            margin: '0 0 0.5rem 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {product.title}
          </h3>

          {product.artist?.name && (
            <p style={{
              fontSize: '0.875rem',
              color: '#666',
              margin: '0 0 0.5rem 0',
            }}>
              by {product.artist.name}
            </p>
          )}

          {product.productType === 'price-based' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {formatCurrency(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#999',
                      textDecoration: 'line-through',
                    }}>
                      {formatCurrency(product.compareAtPrice)}
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: 'green',
                      fontWeight: 'bold',
                    }}>
                      {product.discountPercentage}% OFF
                    </span>
                  </>
                )}
              </div>

              {product.stockQuantity > 0 ? (
                <button
                  onClick={handleAddToCart}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Add to Cart
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#ccc',
                    color: '#666',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'not-allowed',
                  }}
                >
                  Out of Stock
                </button>
              )}
            </>
          ) : (
            <button
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Ask for Price
            </button>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;