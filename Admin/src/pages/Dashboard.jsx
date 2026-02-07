import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../api/services';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PageHeader from '../components/common/PageHeader';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Comprehensive overview of your e-commerce platform" />

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {/* Total Revenue Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>Total Revenue</p>
              <h2 style={{ margin: '0.5rem 0', fontSize: '2rem', color: '#2c3e50' }}>
                {formatCurrency(stats?.summary.totalRevenue || 0)}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  color: stats?.revenue.change >= 0 ? '#10b981' : '#ef4444',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}>
                  {stats?.revenue.change >= 0 ? '↑' : '↓'} {Math.abs(stats?.revenue.change || 0)}%
                </span>
                <span style={{ color: '#666', fontSize: '0.875rem' }}>
                  vs yesterday
                </span>
              </div>
            </div>
            <div style={{ fontSize: '2.5rem', color: '#3498db' }}>💰</div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>Total Orders</p>
              <h2 style={{ margin: '0.5rem 0', fontSize: '2rem', color: '#2c3e50' }}>
                {stats?.orders.total || 0}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  color: stats?.orders.change >= 0 ? '#10b981' : '#ef4444',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}>
                  {stats?.orders.change >= 0 ? '↑' : '↓'} {Math.abs(stats?.orders.change || 0)}%
                </span>
                <span style={{ color: '#666', fontSize: '0.875rem' }}>
                  vs yesterday
                </span>
              </div>
            </div>
            <div style={{ fontSize: '2.5rem', color: '#2ecc71' }}>📦</div>
          </div>
          <Link to="/orders" style={{
            color: '#007bff',
            textDecoration: 'none',
            fontSize: '0.875rem',
            display: 'block',
            marginTop: '1rem',
          }}>
            View all →
          </Link>
        </div>

        {/* Pending Orders Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>Pending Orders</p>
              <h2 style={{ margin: '0.5rem 0', fontSize: '2rem', color: '#2c3e50' }}>
                {stats?.orders.pending || 0}
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                Needs attention
              </p>
            </div>
            <div style={{ fontSize: '2.5rem', color: '#f39c12' }}>⏳</div>
          </div>
          <Link to="/orders?status=pending" style={{
            color: '#007bff',
            textDecoration: 'none',
            fontSize: '0.875rem',
            display: 'block',
            marginTop: '1rem',
          }}>
            Process now →
          </Link>
        </div>

        {/* New Inquiries Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>New Inquiries</p>
              <h2 style={{ margin: '0.5rem 0', fontSize: '2rem', color: '#2c3e50' }}>
                {stats?.inquiries.new || 0}
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                Need response
              </p>
            </div>
            <div style={{ fontSize: '2.5rem', color: '#9b59b6' }}>💬</div>
          </div>
          <Link to="/inquiries" style={{
            color: '#007bff',
            textDecoration: 'none',
            fontSize: '0.875rem',
            display: 'block',
            marginTop: '1rem',
          }}>
            Respond now →
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Monthly Revenue Chart */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.charts.monthlyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Order Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.analytics.orderStatusDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry._id}: ${entry.count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats?.analytics.orderStatusDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Top Products */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Top Selling Products</h3>
          {stats?.analytics.topProducts && stats.analytics.topProducts.length > 0 ? (
            <div>
              {stats.analytics.topProducts.map((product, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                  }}
                >
                  <div>
                    <strong>{product.product.title}</strong>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                      Sold: {product.totalQuantity} units
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{formatCurrency(product.totalRevenue)}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#666' }}>No sales data</p>
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
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Users & Products</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Total Users</span>
              <strong>{stats?.users.total || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Verified Users</span>
              <strong>{stats?.users.verified || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Active Products</span>
              <strong>{stats?.products.active || 0}</strong>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Performance</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Avg. Order Value</span>
              <strong>{formatCurrency(stats?.summary.averageOrderValue || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Inquiry Conv. Rate</span>
              <strong>{stats?.inquiries.conversionRate || 0}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Newsletter Subs</span>
              <strong>{stats?.newsletter.totalSubscribers || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #ddd',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Recent Activities</h3>
          <button
            onClick={fetchStats}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Recent Orders */}
          <div>
            <h4 style={{ margin: '0 0 1rem 0' }}>Recent Orders</h4>
            {stats?.recentActivities.orders && stats.recentActivities.orders.length > 0 ? (
              <div>
                {stats.recentActivities.orders.slice(0, 5).map((order) => (
                  <Link
                    key={order._id}
                    to={`/orders/${order._id}`}
                    style={{
                      display: 'block',
                      padding: '0.75rem',
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
                        <div style={{
                          padding: '2px 8px',
                          backgroundColor: 
                            order.orderStatus === 'pending' ? '#ffc107' :
                            order.orderStatus === 'shipped' ? '#17a2b8' :
                            order.orderStatus === 'delivered' ? '#28a745' : '#6c757d',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          display: 'inline-block',
                        }}>
                          {order.orderStatus.toUpperCase()}
                        </div>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                          {formatCurrency(order.total)}
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

          {/* Recent Inquiries */}
          <div>
            <h4 style={{ margin: '0 0 1rem 0' }}>Recent Inquiries</h4>
            {stats?.recentActivities.inquiries && stats.recentActivities.inquiries.length > 0 ? (
              <div>
                {stats.recentActivities.inquiries.slice(0, 5).map((inquiry) => (
                  <Link
                    key={inquiry._id}
                    to={`/inquiries/${inquiry._id}`}
                    style={{
                      display: 'block',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      border: '1px solid #eee',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{inquiry.product?.title}</strong>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                          {inquiry.customerInfo?.firstName} {inquiry.customerInfo?.lastName}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          padding: '2px 8px',
                          backgroundColor: inquiry.status === 'new' ? '#dc3545' : '#28a745',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          display: 'inline-block',
                        }}>
                          {inquiry.status.toUpperCase()}
                        </div>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                          {formatDate(inquiry.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>No recent inquiries</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;