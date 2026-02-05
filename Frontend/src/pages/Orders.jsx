import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../api/services';
import { useSEO } from '../hooks/useSEO';
import { formatCurrency, formatDate, getImageUrl } from '../utils/formatters';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Orders = () => {
  useSEO({ title: 'My Orders' });

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getMyOrders({ page, limit: 10 });
      setOrders(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>My Orders</h1>

      {orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
        }}>
          <h3>No orders yet</h3>
          <p style={{ color: '#666', marginTop: '1rem', marginBottom: '2rem' }}>
            Start shopping to place your first order
          </p>
          <Link to="/products">
            <button style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              Browse Products
            </button>
          </Link>
        </div>
      ) : (
        <>
          {orders.map((order) => (
            <div
              key={order._id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              {/* Order Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #eee',
              }}>
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    Order #{order.orderNumber}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {formatCurrency(order.total)}
                  </p>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: getStatusColor(order.orderStatus),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}>
                    {order.orderStatus.toUpperCase().replace('-', ' ')}
                  </span>
                </div>
              </div>

              {/* Order Items Preview */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem' }}>
                  {order.items.slice(0, 4).map((item) => (
                    <div
                      key={item._id}
                      style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        flexShrink: 0,
                      }}
                    >
                      {item.image && (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      color: '#666',
                    }}>
                      +{order.items.length - 4} more
                    </div>
                  )}
                </div>

                <p style={{ color: '#666', fontSize: '0.875rem' }}>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>

              {/* Tracking Info */}
              {order.fedexShipment?.trackingNumber && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                }}>
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Tracking Number:</strong> {order.fedexShipment.trackingNumber}
                  </p>
                  {order.shippingStatus && (
                    <p style={{ marginBottom: 0, fontSize: '0.875rem', color: '#666' }}>
                      Status: {order.shippingStatus.toUpperCase().replace('-', ' ')}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to={`/orders/${order._id}`} style={{ flex: 1 }}>
                  <button style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}>
                    View Details
                  </button>
                </Link>

                {order.fedexShipment?.trackingNumber && (
                  <Link to={`/orders/${order._id}#tracking`} style={{ flex: 1 }}>
                    <button style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}>
                      Track Package
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default Orders;