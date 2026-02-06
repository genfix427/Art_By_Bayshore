import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/artists', label: 'Artists', icon: '🎨' },
    { path: '/products', label: 'Products', icon: '🖼️' },
    { path: '/orders', label: 'Orders', icon: '📦' },
    { path: '/coupons', label: 'Coupons', icon: '🎫' },
    { path: '/inquiries', label: 'Inquiries', icon: '💬' },
    { path: '/newsletter/subscribers', label: 'Newsletter', icon: '📧' },
    { path: '/newsletter/campaigns', label: 'Campaigns', icon: '📧' },
  ];

  return (
    <aside style={{
      width: '250px',
      backgroundColor: '#2c3e50',
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
                padding: '1rem 1.5rem',
                color: 'white',
                textDecoration: 'none',
                backgroundColor: isActive ? '#34495e' : 'transparent',
                borderLeft: isActive ? '4px solid #3498db' : '4px solid transparent',
              }}
            >
              <span style={{ marginRight: '1rem', fontSize: '1.25rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;