import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService, shippingService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { formatCurrency, formatDateTime, getImageUrl } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  useSEO({ title: 'Order Details' });

  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (order?.fedexShipment?.trackingNumber) {
      fetchTracking();
    }
  }, [order]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async () => {
  if (!order?.fedexShipment?.trackingNumber) return;

  try {
    setTrackingLoading(true);
    const response = await shippingService.trackShipment(order.fedexShipment.trackingNumber);
    
    if (response.data) {
      setTracking(response.data);
      
      // Show warning if using mock data in development
      if (response.data.mock) {
        console.warn('Displaying mock tracking data - FedEx API not configured');
      }
    }
  } catch (error) {
    console.error('Failed to fetch tracking:', error);
    
    // Don't show error to user if no tracking number assigned yet
    if (order.orderStatus === 'confirmed' || order.orderStatus === 'pending') {
      setTracking({
        status: 'Label Not Created',
        events: [{
          timestamp: order.createdAt,
          status: 'Order Confirmed',
          description: 'Order confirmed and awaiting shipment',
        }],
      });
    } else {
      toast.error('Unable to fetch tracking information');
    }
  } finally {
    setTrackingLoading(false);
  }
};

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    const reason = window.prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      setLoading(true);
      await orderService.cancel(orderId, { reason });
      toast.success('Order cancelled successfully');
      await fetchOrder();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      processing: '#17a2b8',
      confirmed: '#007bff',
      shipped: '#fd7e14',
      delivered: '#28a745',
      cancelled: '#dc3545',
      refunded: '#6c757d',
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Order not found</h2>
        <Link to="/orders">
          <button style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            Back to Orders
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '2rem', fontSize: '0.875rem', color: '#666' }}>
        <Link to="/orders" style={{ color: '#007bff', textDecoration: 'none' }}>My Orders</Link>
        {' > '}
        <span>Order #{order.orderNumber}</span>
      </nav>

      {/* Order Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Order #{order.orderNumber}</h1>
          <p style={{ color: '#666' }}>Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            padding: '8px 16px',
            backgroundColor: getStatusColor(order.orderStatus),
            color: 'white',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}>
            {order.orderStatus.toUpperCase().replace('-', ' ')}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main Content */}
        <div>
          {/* Order Items */}
          <div style={{
            padding: '2rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Order Items</h2>

            {order.items.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr auto',
                  gap: '1rem',
                  padding: '1rem',
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                }}
              >
                <div style={{
                  width: '100px',
                  height: '100px',
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
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                    Quantity: {item.quantity}
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    {formatCurrency(item.price)} each
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '1.25rem' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          {/* Tracking Information */}
          {order.fedexShipment?.trackingNumber && (
            <div
              id="tracking"
              style={{
                padding: '2rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '2rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Tracking Information</h2>
                <button
                  onClick={fetchTracking}
                  disabled={trackingLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: trackingLoading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: trackingLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {trackingLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f0f8ff',
                borderRadius: '4px',
                marginBottom: '1.5rem',
              }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Tracking Number:</strong> {order.fedexShipment.trackingNumber}
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Service:</strong> {order.fedexShipment.serviceType?.replace(/_/g, ' ')}
                </p>
                {tracking?.status && (
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Current Status:</strong> {tracking.status}
                  </p>
                )}
                {tracking?.estimatedDelivery && (
                  <p style={{ marginBottom: 0 }}>
                    <strong>Estimated Delivery:</strong> {formatDateTime(tracking.estimatedDelivery)}
                  </p>
                )}
              </div>

              {trackingLoading ? (
                <LoadingSpinner />
              ) : tracking?.events && tracking.events.length > 0 ? (
                <div>
                  <h3 style={{ marginBottom: '1rem' }}>Tracking History</h3>
                  <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                    {/* Timeline Line */}
                    <div style={{
                      position: 'absolute',
                      left: '8px',
                      top: '10px',
                      bottom: '10px',
                      width: '2px',
                      backgroundColor: '#ddd',
                    }} />

                    {tracking.events.map((event, index) => (
                      <div key={index} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        {/* Timeline Dot */}
                        <div style={{
                          position: 'absolute',
                          left: '-1.5rem',
                          top: '5px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: index === 0 ? '#28a745' : '#007bff',
                          border: '2px solid white',
                          boxShadow: '0 0 0 2px #ddd',
                        }} />

                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: index === 0 ? '#f0fff4' : '#f9f9f9',
                          borderRadius: '4px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong>{event.status}</strong>
                            <span style={{ fontSize: '0.875rem', color: '#666' }}>
                              {formatDateTime(event.timestamp)}
                            </span>
                          </div>
                          {event.location && event.location !== 'N/A' && (
                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                              📍 {event.location}
                            </p>
                          )}
                          {event.description && (
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#666' }}>
                  Tracking information will be available once the package is shipped.
                </p>
              )}
            </div>
          )}

          {/* Shipping Address */}
          <div style={{
            padding: '2rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Shipping Address</h2>
            <p style={{ margin: 0 }}>{order.shippingAddress.fullName}</p>
            <p style={{ margin: '0.25rem 0' }}>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p style={{ margin: '0.25rem 0' }}>{order.shippingAddress.addressLine2}</p>
            )}
            <p style={{ margin: '0.25rem 0' }}>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
            </p>
            <p style={{ margin: '0.25rem 0' }}>{order.shippingAddress.country}</p>
            <p style={{ margin: '0.25rem 0 0' }}>📞 {order.shippingAddress.phoneNumber}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Order Summary */}
          <div style={{
            position: 'sticky',
            top: '100px',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
            marginBottom: '2rem',
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Order Summary</h3>

            <div style={{ marginBottom: '1rem' }}>
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
            </div>

            <div style={{
              borderTop: '1px solid #ddd',
              paddingTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.25rem',
              fontWeight: 'bold',
            }}>
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>

            <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
                <strong>Payment Status:</strong>{' '}
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: order.paymentStatus === 'paid' ? '#28a745' : '#ffc107',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                }}>
                  {order.paymentStatus.toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          {['pending', 'confirmed'].includes(order.orderStatus) && (
            <button
              onClick={handleCancelOrder}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: loading ? '#ccc' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
              }}
            >
              {loading ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}

          <Link to="/orders">
            <button style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              Back to Orders
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;