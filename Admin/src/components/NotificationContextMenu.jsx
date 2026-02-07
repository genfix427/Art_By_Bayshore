import { useState, useEffect, useRef } from 'react';
import { notificationService } from '../api/services';
import toast from 'react-hot-toast';

const NotificationContextMenu = ({ targetId, position, onClose, type }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleClearOrders = async () => {
    try {
      await notificationService.clearOrderNotifications();
      toast.success('Order notifications cleared');
      onClose();
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  const handleMarkAllInquiriesAsRead = async () => {
    try {
      await notificationService.markAllInquiriesAsRead();
      toast.success('All inquiries marked as read');
      onClose();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await notificationService.markAllNotificationsAsViewed();
      toast.success('All notifications cleared');
      onClose();
    } catch (error) {
      toast.error('Failed to clear all notifications');
    }
  };

  const menuItems = [];

  if (type === 'orders') {
    menuItems.push({
      label: 'Clear Order Notifications',
      onClick: handleClearOrders,
      icon: '📦'
    });
  } else if (type === 'inquiries') {
    menuItems.push({
      label: 'Mark All Inquiries as Read',
      onClick: handleMarkAllInquiriesAsRead,
      icon: '💬'
    });
  }

  menuItems.push({
    label: 'Clear All Notifications',
    onClick: handleClearAllNotifications,
    icon: '🗑️'
  });

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 9999,
        minWidth: '200px',
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={item.onClick}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: index < menuItems.length - 1 ? '1px solid #eee' : 'none',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default NotificationContextMenu;