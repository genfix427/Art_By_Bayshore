import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { artistService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { formatDate, getImageUrl } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Artists = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    isFeatured: '',
  });

  useEffect(() => {
    fetchArtists();
  }, [filters]);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.isActive !== '') params.isActive = filters.isActive;
      if (filters.isFeatured !== '') params.isFeatured = filters.isFeatured;

      const response = await artistService.getAll(params);
      setArtists(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this artist?')) {
      return;
    }

    try {
      await artistService.delete(id);
      toast.success('Artist deleted successfully');
      fetchArtists();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    {
      header: 'Artist',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
          }}>
            {row.profileImage && (
              <img
                src={getImageUrl(row.profileImage)}
                alt={row.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
          <div>
            <strong>{row.name}</strong>
            {row.nationality && (
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {row.nationality}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Art Style',
      render: (row) => (
        <div>
          {row.artStyle && row.artStyle.length > 0 ? (
            row.artStyle.slice(0, 2).map((style, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  marginRight: '4px',
                  marginBottom: '4px',
                }}
              >
                {style}
              </span>
            ))
          ) : (
            <span style={{ color: '#999' }}>-</span>
          )}
        </div>
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
      header: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/artists/edit/${row._id}`}>
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
        title="Artists"
        subtitle="Manage artists and their profiles"
        actions={
          <Link to="/artists/new">
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              + Add Artist
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
            placeholder="Search artists..."
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
            <option value="">All Artists</option>
            <option value="true">Featured Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <Table columns={columns} data={artists} />
      )}
    </div>
  );
};

export default Artists;