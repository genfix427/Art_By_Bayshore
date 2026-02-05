import { useEffect, useState } from 'react';
import { newsletterService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'subscribed',
  });

  useEffect(() => {
    fetchSubscribers();
  }, [filters]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;

      const response = await newsletterService.getSubscribers(params);
      setSubscribers(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) {
      return;
    }

    try {
      await newsletterService.deleteSubscriber(id);
      toast.success('Subscriber deleted successfully');
      fetchSubscribers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    {
      header: 'Email',
      render: (row) => <strong>{row.email}</strong>,
    },
    {
      header: 'Name',
      render: (row) => (
        row.firstName || row.lastName
          ? `${row.firstName || ''} ${row.lastName || ''}`.trim()
          : '-'
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span style={{
          padding: '4px 12px',
          backgroundColor: row.status === 'subscribed' ? '#28a745' : '#dc3545',
          color: 'white',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Source',
      field: 'source',
    },
    {
      header: 'Subscribed',
      render: (row) => formatDate(row.subscribedAt),
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row._id);
          }}
          style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Newsletter Subscribers"
        subtitle="Manage newsletter subscriptions"
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
            placeholder="Search by email..."
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
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <>
          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '1rem',
          }}>
            <strong>Total Subscribers: {subscribers.length}</strong>
          </div>
          <Table columns={columns} data={subscribers} />
        </>
      )}
    </div>
  );
};

export default Subscribers;