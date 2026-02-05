import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService, inquiryService, newsletterService } from '../api/services';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../components/common/PageHeader';

const Dashboard = () => {
  const [orderStats, setOrderStats] = useState(null);
  const [inquiryStats, setInquiryStats] = useState(null);
  const [newsletterStats, setNewsletterStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [orders, inquiries, newsletter] = await Promise.all([
        orderService.getStats(),
        inquiryService.getStats(),
        newsletterService.getStats(),
      ]);

      setOrderStats(orders.data);
      setInquiryStats(inquiries.data);
      setNewsletterStats(newsletter.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your e-commerce platform" />

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>Total Orders</p>
              <h2 style={{ margin: '0.5rem 0', fontSize: '2rem' }}>{orderStats?.totalOrders || 0}</h2>
            </div>
            <div style={{ fontSize: '2.5rem' }}>📦</div>
          </div>
          <Link to="/orders" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}>
            View all →
          </Link>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>Total Revenue</p>
              <h2 style={{ margin: '0.5rem 0', fontSize: '2rem' }}>
                {formatCurrency(orderStats?.totalRevenue || 0)}
              </h2>
            </div>
            <div style={{ fontSize: '2.5rem' }}>💰</div>
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }}>
            Avg: {formatCurrency(orderStats?.averageOrderValue || 0)}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>Pending Orders</p>
              <h2 style={{ margin: '0.5rem 0', fontSize: '2rem' }}>{orderStats?.pendingOrders || 0}</h2>
            </div>
            <div style={{ fontSize: '2.5rem' }}>⏳</div>
          </div>
          <Link to="/orders?status=pending" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}>
            Process now →
          </Link>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>New Inquiries</p>
              <h2 style={{ margin: '0.5rem 0', fontSize: '2rem' }}>{inquiryStats?.new || 0}</h2>
            </div>
            <div style={{ fontSize: '2.5rem' }}>💬</div>
          </div>
          <Link to="/inquiries" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}>
            View all →
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Recent Orders */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Recent Orders</h3>
          
          {orderStats?.recentOrders && orderStats.recentOrders.length > 0 ? (
            <div>
              {orderStats.recentOrders.map((order) => (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  style={{
                    display: 'block',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>#{order.orderNumber}</strong>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                        {order.user?.firstName} {order.user?.lastName}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong>{formatCurrency(order.total)}</strong>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#ffc107',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}>
                          {order.orderStatus.toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#666' }}>No recent orders</p>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Quick Stats</h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Shipped</span>
              <strong>{orderStats?.shippedOrders || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Delivered</span>
              <strong>{orderStats?.deliveredOrders || 0}</strong>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Inquiries</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Total</span>
              <strong>{inquiryStats?.total || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Responded</span>
              <strong>{inquiryStats?.responded || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Converted</span>
              <strong>{inquiryStats?.converted || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Conv. Rate</span>
              <strong>{inquiryStats?.conversionRate || 0}%</strong>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Newsletter</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Subscribers</span>
              <strong>{newsletterStats?.subscribers?.active || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Campaigns Sent</span>
              <strong>{newsletterStats?.campaigns?.total || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;