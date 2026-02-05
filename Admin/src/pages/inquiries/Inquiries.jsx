import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inquiryService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
  });

  useEffect(() => {
    fetchInquiries();
  }, [filters]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;

      const response = await inquiryService.getAll(params);
      setInquiries(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: '#007bff',
      reviewing: '#ffc107',
      quoted: '#17a2b8',
      responded: '#28a745',
      converted: '#6f42c1',
      closed: '#6c757d',
      spam: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#28a745',
      normal: '#17a2b8',
      high: '#ffc107',
      urgent: '#dc3545',
    };
    return colors[priority] || '#17a2b8';
  };

  const columns = [
    {
      header: 'Inquiry',
      render: (row) => (
        <div>
          <strong>#{row.inquiryNumber}</strong>
          {!row.isRead && (
            <span style={{
              marginLeft: '0.5rem',
              padding: '2px 6px',
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.75rem',
            }}>
              NEW
            </span>
          )}
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
          <div>{row.customerInfo.firstName} {row.customerInfo.lastName}</div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {row.customerInfo.email}
          </div>
        </div>
      ),
    },
    {
      header: 'Product',
      render: (row) => (
        <div>
          <div>{row.product?.title || 'N/A'}</div>
          {row.quotedPrice && (
            <div style={{ fontSize: '0.875rem', color: '#28a745', fontWeight: 'bold' }}>
              Quoted: {formatCurrency(row.quotedPrice)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span style={{
          padding: '4px 12px',
          backgroundColor: getStatusColor(row.status),
          color: 'white',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Priority',
      render: (row) => (
        <span style={{
          padding: '4px 12px',
          backgroundColor: getPriorityColor(row.priority),
          color: 'white',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}>
          {row.priority.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Link to={`/inquiries/${row._id}`}>
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
        title="Inquiries"
        subtitle="Manage product price inquiries"
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
            placeholder="Search by inquiry #, email..."
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
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="quoted">Quoted</option>
            <option value="responded">Responded</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <Table columns={columns} data={inquiries} />
      )}
    </div>
  );
};

export default Inquiries;