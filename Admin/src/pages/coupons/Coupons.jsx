import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { couponService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, [filters]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.isActive !== '') params.isActive = filters.isActive;

      const response = await couponService.getAll(params);
      setCoupons(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      await couponService.delete(id);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    {
      header: 'Code',
      render: (row) => <strong style={{ fontSize: '1.125rem' }}>{row.code}</strong>,
    },
    {
      header: 'Discount',
      render: (row) => (
        <div>
          {row.discountType === 'fixed' ? (
            <strong>{formatCurrency(row.discountValue)}</strong>
          ) : (
            <strong>{row.discountValue}%</strong>
          )}
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {row.discountType === 'fixed' ? 'Fixed Amount' : 'Percentage'}
          </div>
        </div>
      ),
    },
    {
      header: 'Usage',
      render: (row) => (
        <div>
          <div>{row.usedCount} / {row.usageLimit || '∞'}</div>
          {row.usageLimit && (
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              {((row.usedCount / row.usageLimit) * 100).toFixed(0)}% used
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Valid Period',
      render: (row) => (
        <div style={{ fontSize: '0.875rem' }}>
          <div>{formatDate(row.startDate)}</div>
          <div style={{ color: '#666' }}>to {formatDate(row.expiryDate)}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const now = new Date();
        const isExpired = new Date(row.expiryDate) < now;
        const isNotStarted = new Date(row.startDate) > now;

        let status = 'Active';
        let color = '#28a745';

        if (!row.isActive) {
          status = 'Inactive';
          color = '#6c757d';
        } else if (isExpired) {
          status = 'Expired';
          color = '#dc3545';
        } else if (isNotStarted) {
          status = 'Scheduled';
          color = '#ffc107';
        } else if (row.usageLimit && row.usedCount >= row.usageLimit) {
          status = 'Limit Reached';
          color = '#dc3545';
        }

        return (
          <span style={{
            padding: '4px 12px',
            backgroundColor: color,
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.875rem',
          }}>
            {status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/coupons/edit/${row._id}`}>
            <button style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              Edit
            </button>
          </Link>
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle="Create and manage discount coupons"
        actions={
          <Link to="/coupons/new">
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              + Create Coupon
            </button>
          </Link>
        }
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
            placeholder="Search by code..."
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
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All Coupons</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <Table columns={columns} data={coupons} />
      )}
    </div>
  );
};

export default Coupons;