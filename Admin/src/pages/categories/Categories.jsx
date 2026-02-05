import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categoryService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await categoryService.delete(id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    {
      header: 'Name',
      field: 'name',
      render: (row) => (
        <div>
          <strong>{row.name}</strong>
          {row.parentCategory && (
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              Parent: {row.parentCategory.name}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Slug',
      field: 'slug',
    },
    {
      header: 'Status',
      field: 'isActive',
      render: (row) => (
        <span style={{
          padding: '4px 12px',
          backgroundColor: row.isActive ? '#28a745' : '#dc3545',
          color: 'white',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Created',
      field: 'createdAt',
      render: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/categories/edit/${row._id}`}>
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
        title="Categories"
        subtitle="Manage product categories"
        actions={
          <Link to="/categories/new">
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              + Add Category
            </button>
          </Link>
        }
      />

      {loading ? (
        <div>Loading...</div>
      ) : (
        <Table columns={columns} data={categories} />
      )}
    </div>
  );
};

export default Categories;