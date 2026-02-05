import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { formatCurrency, formatDateTime, getImageUrl } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

const OrderConfirmation = () => {
  useSEO({ title: 'Order Confirmation' });

  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Order not found</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      {/* Success Message */}
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: '#d4edda',
        borderRadius: '8px',
        marginBottom: '2rem',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#155724' }}>
          Thank you for your order!
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#155724' }}>
          Order Number: <strong>{order.orderNumber}</strong>
        </p>
        <p style={{ color: '#155724', marginTop: '1rem' }}>
          A confirmation email has been sent to your email address.
        </p>
      </div>

      {/* Order Details */}
      <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Order Details</h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Order Date:</strong> {formatDateTime(order.createdAt)}
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Order Status:</strong>{' '}
            <span style={{
              padding: '4px 12px',
              backgroundColor: '#ffc107',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}>
              {order.orderStatus.toUpperCase()}
            </span>
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Payment Status:</strong>{' '}
            <span style={{
              padding: '4px 12px',
              backgroundColor: order.paymentStatus === 'paid' ? '#28a745' : '#ffc107',
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}>
              {order.paymentStatus.toUpperCase()}
            </span>
          </p>
        </div>

        {/* Items */}
        <h3 style={{ marginBottom: '1rem' }}>Items</h3>
        {order.items.map((item) => (
          <div
            key={item._id}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr auto',
              gap: '1rem',
              padding: '1rem',
              border: '1px solid #eee',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
            }}>
              {item.image && (
                <img
                  src={getImageUrl(item.image)}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                />
              )}
            </div>
            <div>
              <strong>{item.title}</strong>
              <p style={{ margin: '0.5rem 0', color: '#666' }}>Quantity: {item.quantity}</p>
              <p style={{ margin: 0 }}>{formatCurrency(item.price)} each</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
            </div>
          </div>
        ))}

        {/* Price Summary */}
        <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>

          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'green' }}>
              <span>Discount {order.couponUsed?.code && `(${order.couponUsed.code})`}:</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Shipping:</span>
            <span>{formatCurrency(order.shippingCost)}</span>
          </div>

          {order.tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Tax:</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
          )}

          <div style={{
            borderTop: '1px solid #ddd',
            paddingTop: '1rem',
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '1.25rem',
            fontWeight: 'bold',
          }}>
            <span>Total:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Shipping Address</h3>
        <p>{order.shippingAddress.fullName}</p>
        <p>{order.shippingAddress.addressLine1}</p>
        {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
        <p>
          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
        </p>
        <p>{order.shippingAddress.phoneNumber}</p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/orders" style={{ flex: 1 }}>
          <button style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
            View All Orders
          </button>
        </Link>
        <Link to="/products" style={{ flex: 1 }}>
          <button style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
            Continue Shopping
          </button>
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;