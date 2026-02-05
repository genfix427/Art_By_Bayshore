import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    orderStatus: '',
    paymentStatus: '',
    shippingStatus: '',
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.orderStatus) params.orderStatus = filters.orderStatus;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;

      const response = await orderService.getAll(params);
      setOrders(response.data);
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

  const columns = [
    {
      header: 'Order',
      render: (row) => (
        <div>
          <strong>#{row.orderNumber}</strong>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {formatDate(row.createdAt)}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <div>{row.user?.firstName} {row.user?.lastName}</div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {row.user?.email}
          </div>
        </div>
      ),
    },
    {
      header: 'Items',
      render: (row) => `${row.items.length} item${row.items.length > 1 ? 's' : ''}`,
    },
    {
      header: 'Total',
      render: (row) => <strong>{formatCurrency(row.total)}</strong>,
    },
    {
      header: 'Payment',
      render: (row) => (
        <span style={{
          padding: '4px 12px',
          backgroundColor: row.paymentStatus === 'paid' ? '#28a745' : '#ffc107',
          color: 'white',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}>
          {row.paymentStatus.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Order Status',
      render: (row) => (
        <span style={{
          padding: '4px 12px',
          backgroundColor: getStatusColor(row.orderStatus),
          color: 'white',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}>
          {row.orderStatus.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Tracking',
      render: (row) => (
        row.fedexShipment?.trackingNumber ? (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {row.fedexShipment.trackingNumber}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {row.shippingStatus.replace('-', ' ').toUpperCase()}
            </div>
          </div>
        ) : (
          <span style={{ color: '#999' }}>Not shipped</span>
        )
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Link to={`/orders/${row._id}`}>
          <button style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
            View Details
          </button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders and shipments"
      />

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #ddd',
        marginBottom: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        <div>
          <input
            type="text"
            placeholder="Search by order #, tracking..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>
        <div>
          <select
            value={filters.orderStatus}
            onChange={(e) => setFilters({ ...filters, orderStatus: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All Order Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <Table columns={columns} data={orders} />
      )}
    </div>
  );
};

export default Orders;