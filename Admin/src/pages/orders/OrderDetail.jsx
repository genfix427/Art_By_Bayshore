import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency, formatDateTime, getImageUrl } from '../../utils/formatters';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [trackingRefreshing, setTrackingRefreshing] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getById(id);
      setOrder(response.data);
      setNewStatus(response.data.orderStatus);
    } catch (error) {
      toast.error(error.message);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;

    setUpdating(true);
    try {
      await orderService.updateStatus(id, { orderStatus: newStatus, adminNote });
      toast.success('Order status updated successfully');
      setAdminNote('');
      await fetchOrder();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!window.confirm('Create FedEx shipment for this order? This will generate a shipping label.')) {
      return;
    }

    setUpdating(true);
    try {
      const response = await orderService.createShipment(id);
      toast.success(`Shipment created! Tracking: ${response.data.trackingNumber}`);
      await fetchOrder();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async () => {
    setTrackingRefreshing(true);
    try {
      await orderService.updateTracking(id);
      toast.success('Tracking information updated');
      await fetchOrder();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTrackingRefreshing(false);
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
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (!order) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Order not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        subtitle={`Placed on ${formatDateTime(order.createdAt)}`}
        actions={
          <Link to="/orders">
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              Back to Orders
            </button>
          </Link>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Main Content */}
        <div>
          {/* Order Items */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Order Items</h3>

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
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{item.title}</h4>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>
                    Quantity: {item.quantity}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>
                    Price: {formatCurrency(item.price)} each
                  </p>
                  {item.dimensions?.artwork && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                      Dimensions: {item.dimensions.artwork.length}" × {item.dimensions.artwork.width}" × {item.dimensions.artwork.height}"
                    </p>
                  )}
                  {item.weight && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                      Weight: {item.weight.value} {item.weight.unit}
                    </p>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '1.25rem' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping Address */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Shipping Address</h3>
            <p style={{ margin: '0.25rem 0' }}><strong>{order.shippingAddress.fullName}</strong></p>
            <p style={{ margin: '0.25rem 0' }}>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p style={{ margin: '0.25rem 0' }}>{order.shippingAddress.addressLine2}</p>
            )}
            <p style={{ margin: '0.25rem 0' }}>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
            </p>
            <p style={{ margin: '0.25rem 0' }}>{order.shippingAddress.country}</p>
            <p style={{ margin: '0.25rem 0' }}>📞 {order.shippingAddress.phoneNumber}</p>
            
            {order.shippingAddress.validationData && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#d4edda',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}>
                ✓ Address validated via FedEx
                {order.shippingAddress.validationData.classification && (
                  <span> - {order.shippingAddress.validationData.classification}</span>
                )}
              </div>
            )}
          </div>

          {/* FedEx Shipment & Tracking */}
          {order.fedexShipment?.trackingNumber && (
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>FedEx Shipment & Tracking</h3>
                <button
                  onClick={handleUpdateTracking}
                  disabled={trackingRefreshing}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: trackingRefreshing ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: trackingRefreshing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {trackingRefreshing ? 'Refreshing...' : '↻ Refresh Tracking'}
                </button>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f0f8ff',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                      Tracking Number
                    </p>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.125rem' }}>
                      {order.fedexShipment.trackingNumber}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                      Service Type
                    </p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>
                      {order.fedexShipment.serviceType?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                      Shipping Status
                    </p>
                    <p style={{ margin: 0 }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#fd7e14',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}>
                        {order.shippingStatus.toUpperCase().replace('-', ' ')}
                      </span>
                    </p>
                  </div>
                  {order.fedexShipment.estimatedDelivery && (
                    <div>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                        Estimated Delivery
                      </p>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>
                        {formatDateTime(order.fedexShipment.estimatedDelivery)}
                      </p>
                    </div>
                  )}
                </div>

                {order.fedexShipment.labelUrl && (
                  <div style={{ marginTop: '1rem' }}>
                    <a
                      href={order.fedexShipment.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                      }}
                    >
                      📄 Download Shipping Label
                    </a>
                  </div>
                )}
              </div>

              {/* Tracking Timeline */}
              {order.trackingHistory && order.trackingHistory.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '1rem' }}>Tracking History</h4>
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

                    {order.trackingHistory.map((event, index) => (
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
              )}
            </div>
          )}

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Status History</h3>
              
              {order.statusHistory.map((history, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: getStatusColor(history.status),
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        marginRight: '1rem',
                      }}>
                        {history.status.toUpperCase()}
                      </span>
                      {history.note && (
                        <span style={{ fontSize: '0.875rem', color: '#666' }}>
                          {history.note}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      {formatDateTime(history.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Order Summary */}
          <div style={{
            position: 'sticky',
            top: '20px',
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>

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

            <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
              <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
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
              
              <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
                <strong>Order Status:</strong>{' '}
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: getStatusColor(order.orderStatus),
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                }}>
                  {order.orderStatus.toUpperCase()}
                </span>
              </p>

              {order.user && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                    <strong>Customer:</strong>
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                    {order.user.firstName} {order.user.lastName}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                    {order.user.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Update Status */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Update Order Status</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Admin Note (Optional)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows="3"
                placeholder="Add a note about this status change..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={updating || newStatus === order.orderStatus}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: updating || newStatus === order.orderStatus ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: updating || newStatus === order.orderStatus ? 'not-allowed' : 'pointer',
              }}
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>

          {/* Create FedEx Shipment */}
          {!order.fedexShipment?.trackingNumber && order.paymentStatus === 'paid' && (
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Create FedEx Shipment</h3>
              
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                Create a FedEx shipment to generate a shipping label and tracking number.
              </p>

              <button
                onClick={handleCreateShipment}
                disabled={updating}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: updating ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {updating ? 'Creating...' : '📦 Create FedEx Shipment'}
              </button>

              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                This will automatically calculate shipping rates, create the shipment, and generate a shipping label.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;