import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../api/services';
import PageHeader from '../components/common/PageHeader';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState({
    unshippedOrders: [],
    newInquiries: [],
    recentSubscribers: [],
  });
  const [counts, setCounts] = useState({ total: 0, orders: 0, inquiries: 0, subscribers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching notifications...');
      
      const response = await notificationService.getAll();
      console.log('Notifications API response:', response);
      
      // Handle different response structures
      if (response.data) {
        // If response has notifications object
        if (response.data.notifications) {
          setNotifications({
            unshippedOrders: response.data.notifications.unshippedOrders || [],
            newInquiries: response.data.notifications.newInquiries || [],
            recentSubscribers: response.data.notifications.recentSubscribers || [],
          });
        } 
        // If response has arrays directly
        else if (response.data.unshippedOrders || response.data.newInquiries || response.data.recentSubscribers) {
          setNotifications({
            unshippedOrders: response.data.unshippedOrders || [],
            newInquiries: response.data.newInquiries || [],
            recentSubscribers: response.data.recentSubscribers || [],
          });
        }
        
        // Handle counts
        if (response.data.counts) {
          setCounts({
            total: response.data.counts.total || 0,
            orders: response.data.counts.orders || 0,
            inquiries: response.data.counts.inquiries || 0,
            subscribers: response.data.counts.subscribers || 0,
          });
        } else {
          // Calculate counts from data
          setCounts({
            orders: response.data.notifications?.unshippedOrders?.length || 
                   response.data.unshippedOrders?.length || 0,
            inquiries: response.data.notifications?.newInquiries?.length || 
                      response.data.newInquiries?.length || 0,
            subscribers: response.data.notifications?.recentSubscribers?.length || 
                        response.data.recentSubscribers?.length || 0,
            total: (response.data.notifications?.unshippedOrders?.length || 
                   response.data.unshippedOrders?.length || 0) +
                  (response.data.notifications?.newInquiries?.length || 
                   response.data.newInquiries?.length || 0) +
                  (response.data.notifications?.recentSubscribers?.length || 
                   response.data.recentSubscribers?.length || 0)
          });
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError(error.message || 'Failed to fetch notifications');
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsViewed = async () => {
    try {
      await notificationService.markAllNotificationsAsViewed();
      toast.success('All notifications cleared');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to clear all notifications');
    }
  };

  const handleMarkInquiryAsRead = async (id) => {
    try {
      await notificationService.markInquiryAsRead(id);
      toast.success('Inquiry marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark inquiry as read');
    }
  };

  const handleMarkAllInquiriesAsRead = async () => {
    try {
      await notificationService.markAllInquiriesAsRead();
      toast.success('All inquiries marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark all inquiries as read');
    }
  };

  const handleClearOrderNotification = async (id) => {
    try {
      await notificationService.clearOrderNotification(id);
      toast.success('Order notification cleared');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to clear order notification');
    }
  };

  const handleClearAllOrders = async () => {
    try {
      await notificationService.clearOrderNotifications();
      toast.success('All order notifications cleared');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to clear order notifications');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '4rem', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h3>Loading notifications...</h3>
        <p style={{ color: '#666' }}>Please wait while we fetch your notifications</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '4rem', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dc3545' }}>⚠️</div>
        <h3>Error Loading Notifications</h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={fetchNotifications}
          style={{
            padding: '0.5rem 1rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Debug view to check data structure
  const showDebug = false; // Set to true to see data structure

  return (
    <div>
      <PageHeader 
        title="Notifications" 
        subtitle={`You have ${counts.total} new notifications`}
        actions={
          counts.total > 0 && (
            <button
              onClick={handleMarkAllAsViewed}
              style={{
                padding: '0.5rem 1rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Clear All Notifications
            </button>
          )
        }
      />

      {showDebug && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '1rem', 
          marginBottom: '1rem',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h4>Debug Info:</h4>
          <pre style={{ fontSize: '0.75rem' }}>
            {JSON.stringify({ notifications, counts }, null, 2)}
          </pre>
        </div>
      )}

      {counts.total === 0 ? (
        <div style={{ 
          padding: '4rem', 
          textAlign: 'center',
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginTop: '1rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h3>No New Notifications</h3>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            You're all caught up! No pending notifications at the moment.
          </p>
          <button
            onClick={fetchNotifications}
            style={{
              padding: '0.5rem 1rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Refresh
          </button>
          <Link to="/">
            <button
              style={{
                padding: '0.5rem 1rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{counts.orders}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Pending Orders</div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{counts.inquiries}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>New Inquiries</div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✉️</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{counts.subscribers}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>New Subscribers</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Orders Card */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Pending Orders</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {counts.orders > 0 && (
                    <span style={{
                      background: '#dc3545',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {counts.orders}
                    </span>
                  )}
                  {counts.orders > 0 && (
                    <button
                      onClick={handleClearAllOrders}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {counts.orders === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                  <p style={{ color: '#666' }}>No pending orders</p>
                </div>
              ) : (
                <div>
                  {notifications.unshippedOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      style={{
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        border: '1px solid #eee',
                        borderRadius: '4px',
                        background: '#f8f9fa',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <Link 
                            to={`/orders/${order.id}`} 
                            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '1.25rem' }}>📦</span>
                              <div>
                                <strong style={{ fontSize: '0.875rem', display: 'block' }}>
                                  #{order.orderNumber || 'N/A'}
                                </strong>
                                <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#666' }}>
                                  {order.customerName || 'Guest Customer'}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                          <button
                            onClick={() => handleClearOrderNotification(order.id)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              marginBottom: '0.25rem'
                            }}
                          >
                            Clear
                          </button>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      {order.total && (
                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                          Total: ${parseFloat(order.total).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                  {counts.orders > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <Link to="/orders" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}>
                        View all {counts.orders} orders →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Inquiries Card */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>New Inquiries</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {counts.inquiries > 0 && (
                    <span style={{
                      background: '#dc3545',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {counts.inquiries}
                    </span>
                  )}
                  {counts.inquiries > 0 && (
                    <button
                      onClick={handleMarkAllInquiriesAsRead}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Mark All Read
                    </button>
                  )}
                </div>
              </div>

              {counts.inquiries === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                  <p style={{ color: '#666' }}>No new inquiries</p>
                </div>
              ) : (
                <div>
                  {notifications.newInquiries.slice(0, 5).map((inquiry) => (
                    <div
                      key={inquiry.id}
                      style={{
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        border: '1px solid #eee',
                        borderRadius: '4px',
                        background: '#f8f9fa',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <Link 
                            to={`/inquiries/${inquiry.id}`} 
                            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '1.25rem' }}>💬</span>
                              <div>
                                <strong style={{ fontSize: '0.875rem', display: 'block' }}>
                                  {inquiry.product || 'Product Inquiry'}
                                </strong>
                                <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#666' }}>
                                  {inquiry.customerName || 'Customer'}
                                </p>
                              </div>
                            </div>
                            {inquiry.message && (
                              <p style={{ 
                                margin: '0.25rem 0 0', 
                                fontSize: '0.75rem', 
                                color: '#666',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {inquiry.message}
                              </p>
                            )}
                          </Link>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                          <button
                            onClick={() => handleMarkInquiryAsRead(inquiry.id)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              marginBottom: '0.25rem'
                            }}
                          >
                            Mark Read
                          </button>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                            {formatDate(inquiry.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {counts.inquiries > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <Link to="/inquiries" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}>
                        View all {counts.inquiries} inquiries →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subscribers Card */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>New Subscribers</h3>
                {counts.subscribers > 0 && (
                  <span style={{
                    background: '#dc3545',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {counts.subscribers}
                  </span>
                )}
              </div>

              {counts.subscribers === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                  <p style={{ color: '#666' }}>No new subscribers</p>
                </div>
              ) : (
                <div>
                  {notifications.recentSubscribers.slice(0, 5).map((subscriber) => (
                    <div
                      key={subscriber.id}
                      style={{
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        border: '1px solid #eee',
                        borderRadius: '4px',
                        background: '#f8f9fa',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>✉️</span>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '0.875rem', display: 'block' }}>
                            {subscriber.email || 'No email'}
                          </strong>
                          {subscriber.name && (
                            <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#666' }}>
                              {subscriber.name}
                            </p>
                          )}
                          {subscriber.source && (
                            <p style={{ margin: '0.25rem 0', fontSize: '0.7rem', color: '#888' }}>
                              Source: {subscriber.source}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#666', 
                        textAlign: 'right',
                        borderTop: '1px solid #eee',
                        paddingTop: '0.5rem'
                      }}>
                        {formatDate(subscriber.createdAt)}
                      </div>
                    </div>
                  ))}
                  {counts.subscribers > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <Link to="/newsletter/subscribers" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}>
                        View all {counts.subscribers} subscribers →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Refresh button */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={fetchNotifications}
          style={{
            padding: '0.5rem 1.5rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Refresh Notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationsPage;