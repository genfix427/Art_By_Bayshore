import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { formatCurrency, formatDate, getImageUrl } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    productType: '',
    isActive: '',
    isFeatured: '',
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.productType) params.productType = filters.productType;
      if (filters.isActive !== '') params.isActive = filters.isActive;
      if (filters.isFeatured !== '') params.isFeatured = filters.isFeatured;

      const response = await productService.getAll(params);
      setProducts(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productService.delete(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    {
      header: 'Product',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            {row.images?.[0]?.url && (
              <img
                src={getImageUrl(row.images[0].url)}
                alt={row.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
          <div>
            <strong>{row.title}</strong>
            {row.artist?.name && (
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                by {row.artist.name}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      render: (row) => (
        <span style={{
          padding: '4px 12px',
          backgroundColor: row.productType === 'price-based' ? '#17a2b8' : '#ffc107',
          color: row.productType === 'price-based' ? 'white' : '#000',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}>
          {row.productType === 'price-based' ? 'Price-Based' : 'Ask for Price'}
        </span>
      ),
    },
    {
      header: 'Price',
      render: (row) => (
        row.productType === 'price-based' ? (
          <strong>{formatCurrency(row.price)}</strong>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        )
      ),
    },
    {
      header: 'Stock',
      render: (row) => (
        row.productType === 'price-based' ? (
          <span style={{
            color: row.stockQuantity === 0 ? '#dc3545' : row.isLowStock ? '#ffc107' : '#28a745',
          }}>
            {row.stockQuantity}
            {row.stockQuantity === 0 && ' (Out of Stock)'}
            {row.isLowStock && row.stockQuantity > 0 && ' (Low Stock)'}
          </span>
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
        )
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <div>
          <span style={{
            padding: '4px 12px',
            backgroundColor: row.isActive ? '#28a745' : '#dc3545',
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.875rem',
            marginRight: '0.5rem',
          }}>
            {row.isActive ? 'Active' : 'Inactive'}
          </span>
          {row.isFeatured && (
            <span style={{
              padding: '4px 12px',
              backgroundColor: '#ffc107',
              color: '#000',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}>
              Featured
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/products/edit/${row._id}`}>
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
        title="Products"
        subtitle="Manage your artwork inventory"
        actions={
          <Link to="/products/new">
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              + Add Product
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
            placeholder="Search products..."
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
            value={filters.productType}
            onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All Types</option>
            <option value="price-based">Price-Based</option>
            <option value="ask-for-price">Ask for Price</option>
          </select>
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
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div>
          <select
            value={filters.isFeatured}
            onChange={(e) => setFilters({ ...filters, isFeatured: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All Products</option>
            <option value="true">Featured Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <Table columns={columns} data={products} />
      )}
    </div>
  );
};

export default Products;