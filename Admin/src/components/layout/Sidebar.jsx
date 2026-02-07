import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { notificationService } from '../../api/services';

const Sidebar = () => {
  const location = useLocation();
  const [notificationCounts, setNotificationCounts] = useState({
    orders: 0,
    inquiries: 0,
    newsletter: 0,
  });

  useEffect(() => {
    fetchSidebarCounts();
    
    const interval = setInterval(fetchSidebarCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSidebarCounts = async () => {
    try {
      const response = await notificationService.getSidebarCounts();
      setNotificationCounts(response.data);
    } catch (error) {
      console.error('Failed to fetch sidebar counts:', error);
    }
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', notificationCount: 0 },
    { path: '/artists', label: 'Artists', icon: '🎨', notificationCount: 0 },
    { path: '/products', label: 'Products', icon: '🖼️', notificationCount: 0 },
    { 
      path: '/orders', 
      label: 'Orders', 
      icon: '📦', 
      notificationCount: notificationCounts.orders 
    },
    { path: '/coupons', label: 'Coupons', icon: '🎫', notificationCount: 0 },
    { path: '/users', label: 'Users', icon: '👤', notificationCount: 0 },
    { 
      path: '/inquiries', 
      label: 'Inquiries', 
      icon: '💬', 
      notificationCount: notificationCounts.inquiries 
    },
    { 
      path: '/newsletter/subscribers', 
      label: 'Newsletter', 
      icon: '✉️', 
      notificationCount: notificationCounts.newsletter 
    },
    { path: '/newsletter/campaigns', label: 'Campaigns', icon: '📧', notificationCount: 0 },
    { 
      path: '/notifications', 
      label: 'Notifications', 
      icon: '🔔', 
      notificationCount: notificationCounts.orders + notificationCounts.inquiries + notificationCounts.newsletter 
    },
  ];

  return (
    <aside style={{
      width: '250px',
      background: '#2c3e50',
      color: 'white',
      padding: '2rem 0',
    }}>
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Admin Panel</h2>
      </div>

      <nav>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                color: 'white',
                textDecoration: 'none',
                background: isActive ? '#34495e' : 'transparent',
                borderLeft: isActive ? '4px solid #3498db' : '4px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '1rem', fontSize: '1.25rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              
              {item.notificationCount > 0 && (
                <span style={{
                  background: '#e74c3c',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '0.5rem',
                }}>
                  {item.notificationCount > 99 ? '99+' : item.notificationCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;