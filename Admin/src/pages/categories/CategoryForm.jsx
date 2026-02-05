import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoryService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    isActive: true,
    displayOrder: 0,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
  });
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategory = async () => {
    try {
      const response = await categoryService.getById(id);
      const category = response.data;
      setFormData({
        name: category.name,
        description: category.description || '',
        parentCategory: category.parentCategory?._id || '',
        isActive: category.isActive,
        displayOrder: category.displayOrder,
        metaTitle: category.metaTitle || '',
        metaDescription: category.metaDescription || '',
        metaKeywords: category.metaKeywords?.join(', ') || '',
      });
    } catch (error) {
      toast.error(error.message);
      navigate('/categories');
    }
  };

  

// Update the handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setErrors({}); // Clear previous errors

  try {
    const data = new FormData();
    
    // Append basic fields
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('displayOrder', formData.displayOrder);
    data.append('isActive', formData.isActive);
    
    // Append parent category if selected
    if (formData.parentCategory) {
      data.append('parentCategory', formData.parentCategory);
    }
    
    // Append SEO fields
    if (formData.metaTitle) {
      data.append('metaTitle', formData.metaTitle);
    }
    if (formData.metaDescription) {
      data.append('metaDescription', formData.metaDescription);
    }
    if (formData.metaKeywords) {
      // Convert comma-separated string to array
      const keywordsArray = formData.metaKeywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
      data.append('metaKeywords', JSON.stringify(keywordsArray));
    }
    
    // Append image if selected
    if (image) {
      data.append('image', image);
    }

    if (isEdit) {
      await categoryService.update(id, data);
      toast.success('Category updated successfully');
    } else {
      await categoryService.create(data);
      toast.success('Category created successfully');
    }

    navigate('/categories');
  } catch (error) {
    console.error('Full error:', error);
    
    // Handle validation errors
    if (error.response?.data?.errors) {
      const validationErrors = {};
      error.response.data.errors.forEach(err => {
        validationErrors[err.field] = err.message;
      });
      setErrors(validationErrors);
      toast.error('Please fix the validation errors');
    } else {
      toast.error(error.response?.data?.error || error.message || 'An error occurred');
    }
  } finally {
    setLoading(false);
  }
}

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Category' : 'Add Category'} />

      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #ddd',
        maxWidth: '800px',
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Parent Category
            </label>
            <select
              value={formData.parentCategory}
              onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="">None (Top Level)</option>
              {categories.filter(cat => cat._id !== id).map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.75rem' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                id="isActive"
              />
              <label htmlFor="isActive" style={{ fontWeight: 'bold' }}>
                Active
              </label>
            </div>
          </div>

          {/* SEO Fields */}
          <div style={{
            borderTop: '1px solid #ddd',
            paddingTop: '1.5rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>SEO Settings</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Meta Title
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                maxLength="60"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <small style={{ color: '#666' }}>{formData.metaTitle.length}/60 characters</small>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Meta Description
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                maxLength="160"
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <small style={{ color: '#666' }}>{formData.metaDescription.length}/160 characters</small>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Meta Keywords
              </label>
              <input
                type="text"
                value={formData.metaKeywords}
                onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                placeholder="keyword1, keyword2, keyword3"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <small style={{ color: '#666' }}>Separate keywords with commas</small>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/categories')}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;