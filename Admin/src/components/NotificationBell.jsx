import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../api/services';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState({
    unshippedOrders: [],
    newInquiries: [],
    recentSubscribers: [],
  });
  const [counts, setCounts] = useState({ total: 0, orders: 0, inquiries: 0, subscribers: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getAll();
      setNotifications(response.data.notifications);
      setCounts(response.data.counts);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleClearOrderNotification = async (orderId) => {
    try {
      await notificationService.clearOrderNotification(orderId);
      toast.success('Order notification cleared');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to clear notification');
      console.error('Failed to clear order notification:', error);
    }
  };

  const handleMarkInquiryAsRead = async (inquiryId) => {
    try {
      await notificationService.markInquiryAsRead(inquiryId);
      toast.success('Inquiry marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark inquiry as read');
      console.error('Failed to mark inquiry as read:', error);
    }
  };

  const handleMarkAllInquiriesAsRead = async () => {
    try {
      await notificationService.markAllInquiriesAsRead();
      toast.success('All inquiries marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark all inquiries as read');
      console.error('Failed to mark all inquiries as read:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await notificationService.markAllNotificationsAsViewed();
      toast.success('All notifications cleared');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to clear all notifications');
      console.error('Failed to clear all notifications:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'order': return `/orders/${notification.id}`;
      case 'inquiry': return `/inquiries/${notification.id}`;
      case 'subscriber': return '/newsletter/subscribers';
      default: return '#';
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.5rem',
          padding: '0.5rem',
        }}
      >
        🔔
        {counts.total > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#dc3545',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {counts.total > 99 ? '99+' : counts.total}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          width: '400px',
          maxHeight: '500px',
          overflowY: 'auto',
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h4 style={{ margin: 0 }}>Notifications</h4>
            {counts.total > 0 && (
              <button
                onClick={handleClearAllNotifications}
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

          {counts.total === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No new notifications
            </div>
          ) : (
            <div>
              {/* Orders */}
              {notifications.unshippedOrders?.length > 0 && (
                <div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: '#f8f9fa',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <strong>Orders ({counts.orders})</strong>
                  </div>
                  {notifications.unshippedOrders.map((notification) => (
                    <div
                      key={notification.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>📦</span>
                      <div style={{ flex: 1 }}>
                        <Link
                          to={getNotificationLink(notification)}
                          onClick={() => setShowDropdown(false)}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ fontSize: '0.875rem' }}>
                                #{notification.orderNumber}
                              </strong>
                              <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#666' }}>
                                {notification.customerName}
                              </p>
                            </div>
                            <span style={{
                              padding: '2px 6px',
                              background: '#007bff',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                            }}>
                              {notification.status}
                            </span>
                          </div>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#666' }}>
                            {formatDate(notification.createdAt)}
                          </p>
                        </Link>
                      </div>
                      <button
                        onClick={() => handleClearOrderNotification(notification.id)}
                        style={{
                          marginLeft: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          background: 'transparent',
                          color: '#666',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                        title="Clear notification"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inquiries */}
              {notifications.newInquiries?.length > 0 && (
                <div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: '#f8f9fa',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <strong>Inquiries ({counts.inquiries})</strong>
                    </div>
                    <button
                      onClick={handleMarkAllInquiriesAsRead}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                      }}
                    >
                      Mark All Read
                    </button>
                  </div>
                  {notifications.newInquiries.map((notification) => (
                    <div
                      key={notification.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>💬</span>
                      <div style={{ flex: 1 }}>
                        <Link
                          to={getNotificationLink(notification)}
                          onClick={() => {
                            handleMarkInquiryAsRead(notification.id);
                            setShowDropdown(false);
                          }}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ fontSize: '0.875rem' }}>
                                {notification.product}
                              </strong>
                              <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#666' }}>
                                {notification.customerName}
                              </p>
                            </div>
                            <span style={{
                              padding: '2px 6px',
                              background: '#dc3545',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                            }}>
                              NEW
                            </span>
                          </div>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#666' }}>
                            {notification.message?.substring(0, 50)}...
                          </p>
                        </Link>
                      </div>
                      <button
                        onClick={() => handleMarkInquiryAsRead(notification.id)}
                        style={{
                          marginLeft: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Subscribers */}
              {notifications.recentSubscribers?.length > 0 && (
                <div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: '#f8f9fa',
                    borderBottom: '1px solid #eee',
                  }}>
                    <strong>Subscribers ({counts.subscribers})</strong>
                  </div>
                  {notifications.recentSubscribers.map((notification) => (
                    <div
                      key={notification.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>✉️</span>
                      <div style={{ flex: 1 }}>
                        <Link
                          to={getNotificationLink(notification)}
                          onClick={() => setShowDropdown(false)}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.875rem' }}>
                              {notification.email}
                            </strong>
                            {notification.name && (
                              <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#666' }}>
                                {notification.name}
                              </p>
                            )}
                          </div>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#666' }}>
                            {notification.source}
                          </p>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Link
              to="/notifications"
              onClick={() => setShowDropdown(false)}
              style={{
                color: '#007bff',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              View all notifications →
            </Link>
            {counts.total > 0 && (
              <button
                onClick={handleClearAllNotifications}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: '#dc3545',
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
      )}
    </div>
  );
};

export default NotificationBell;