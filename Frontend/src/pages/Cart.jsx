import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSEO } from '../hooks/useSEO.jsx';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Cart = () => {
  useSEO({ title: 'Shopping Cart' });

  const { cart, loading, updateCartItem, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartItem(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Remove this item from cart?')) {
      await removeFromCart(itemId);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading && !cart) {
    return <LoadingSpinner fullScreen />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Your Cart is Empty</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Add some artworks to your cart to get started
        </p>
        <Link to="/products">
          <button style={{
            padding: '0.75rem 2rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}>
            Browse Products
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Shopping Cart ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})</h1>
        {cart.items.length > 0 && (
          <button
            onClick={handleClearCart}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear Cart
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Cart Items */}
        <div>
          {cart.items.map((item) => (
            <div
              key={item._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: '1rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}
            >
              {/* Product Image */}
              <Link to={`/products/${item.product?.slug}`}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  {item.image && (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
              </Link>

              {/* Product Details */}
              <div>
                <Link
                  to={`/products/${item.product?.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    {item.title}
                  </h3>
                </Link>

                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  {formatCurrency(item.price)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <button
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || loading}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val > 0 && val <= item.product?.stockQuantity) {
                          handleQuantityChange(item._id, val);
                        }
                      }}
                      min="1"
                      max={item.product?.stockQuantity}
                      style={{
                        width: '60px',
                        textAlign: 'center',
                        border: 'none',
                        padding: '0.5rem',
                      }}
                    />
                    <button
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                      disabled={item.quantity >= (item.product?.stockQuantity || 999) || loading}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: item.quantity >= (item.product?.stockQuantity || 999) ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                      }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item._id)}
                    disabled={loading}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      color: '#dc3545',
                      border: '1px solid #dc3545',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>

                {item.product && !item.product.isActive && (
                  <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    This item is no longer available
                  </p>
                )}

                {item.product && item.quantity > item.product.stockQuantity && (
                  <p style={{ color: 'orange', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Only {item.product.stockQuantity} available
                  </p>
                )}
              </div>

              {/* Item Total */}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div style={{
            position: 'sticky',
            top: '100px',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Order Summary</h3>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 'bold' }}>{formatCurrency(cart.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                <span>Shipping:</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid #ddd',
              paddingTop: '1rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
                <span>Total:</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || cart.items.length === 0}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
              }}
            >
              Proceed to Checkout
            </button>

            <Link to="/products">
              <button style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'transparent',
                color: '#007bff',
                border: '1px solid #007bff',
                borderRadius: '4px',
                cursor: 'pointer',
              }}>
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;