import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, categoryService, artistService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import { getImageUrl } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    artist: '',
    productType: 'price-based',
    price: '',
    compareAtPrice: '',
    stockQuantity: 1,
    lowStockThreshold: 1,
    sku: '',
    medium: '',
    yearCreated: '',
    isFramed: false,
    isOriginal: true,
    isActive: true,
    isFeatured: false,
    tags: '',
    dimensions: {
      artwork: {
        length: '',
        width: '',
        height: '',
        unit: 'inches',
      },
      frame: {
        length: '',
        width: '',
        height: '',
        unit: 'inches',
      },
    },
    weight: {
      value: '',
      unit: 'lbs',
    },
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
  });

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategoriesAndArtists();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategoriesAndArtists = async () => {
    try {
      const [categoriesRes, artistsRes] = await Promise.all([
        categoryService.getAll({ isActive: true }),
        artistService.getAll({ isActive: true }),
      ]);
      setCategories(categoriesRes.data);
      setArtists(artistsRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await productService.getById(id);
      const product = response.data;
      
      setFormData({
        title: product.title,
        description: product.description,
        category: product.category?._id || '',
        artist: product.artist?._id || '',
        productType: product.productType,
        price: product.price || '',
        compareAtPrice: product.compareAtPrice || '',
        stockQuantity: product.stockQuantity || 1,
        lowStockThreshold: product.lowStockThreshold || 1,
        sku: product.sku || '',
        medium: product.medium || '',
        yearCreated: product.yearCreated || '',
        isFramed: product.isFramed,
        isOriginal: product.isOriginal,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        tags: product.tags?.join(', ') || '',
        dimensions: product.dimensions || {
          artwork: { length: '', width: '', height: '', unit: 'inches' },
          frame: { length: '', width: '', height: '', unit: 'inches' },
        },
        weight: product.weight || { value: '', unit: 'lbs' },
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        metaKeywords: product.metaKeywords?.join(', ') || '',
      });

      setExistingImages(product.images || []);
    } catch (error) {
      toast.error(error.message);
      navigate('/products');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await productService.deleteImage(id, imageId);
      toast.success('Image deleted successfully');
      setExistingImages(existingImages.filter(img => img._id !== imageId));
    } catch (error) {
      toast.error(error.message);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const data = new FormData();
    
    // Basic fields
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('artist', formData.artist);
    data.append('productType', formData.productType);
    
    // Price fields (only for price-based products)
    if (formData.productType === 'price-based') {
      if (formData.price) data.append('price', parseFloat(formData.price).toString());
      if (formData.compareAtPrice) data.append('compareAtPrice', parseFloat(formData.compareAtPrice).toString());
      if (formData.stockQuantity) data.append('stockQuantity', parseInt(formData.stockQuantity).toString());
    }

    // Additional fields
    if (formData.sku) data.append('sku', formData.sku);
    if (formData.medium) data.append('medium', formData.medium);
    if (formData.yearCreated) data.append('yearCreated', parseInt(formData.yearCreated).toString());
    
    // Boolean fields
    data.append('isFramed', formData.isFramed.toString());
    data.append('isOriginal', formData.isOriginal.toString());
    data.append('isActive', formData.isActive.toString());
    data.append('isFeatured', formData.isFeatured.toString());
    
    if (formData.lowStockThreshold) {
      data.append('lowStockThreshold', parseInt(formData.lowStockThreshold).toString());
    }
    
    // Arrays
    if (formData.tags) {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagsArray.length > 0) {
        data.append('tags', JSON.stringify(tagsArray));
      }
    }
    
    // Dimensions - ensure all values are numbers, not strings
    const dimensionsData = {
      artwork: {
        length: parseFloat(formData.dimensions.artwork.length) || 0,
        width: parseFloat(formData.dimensions.artwork.width) || 0,
        height: parseFloat(formData.dimensions.artwork.height) || 0,
        unit: formData.dimensions.artwork.unit
      },
      frame: {
        length: parseFloat(formData.dimensions.frame.length) || 0,
        width: parseFloat(formData.dimensions.frame.width) || 0,
        height: parseFloat(formData.dimensions.frame.height) || 0,
        unit: formData.dimensions.frame.unit
      }
    };
    data.append('dimensions', JSON.stringify(dimensionsData));
    
    // Weight - ensure value is a number
    const weightData = {
      value: parseFloat(formData.weight.value) || 0,
      unit: formData.weight.unit
    };
    data.append('weight', JSON.stringify(weightData));
    
    // SEO fields
    if (formData.metaTitle) data.append('metaTitle', formData.metaTitle);
    if (formData.metaDescription) data.append('metaDescription', formData.metaDescription);
    if (formData.metaKeywords) {
      const keywordsArray = formData.metaKeywords.split(',').map(k => k.trim()).filter(Boolean);
      if (keywordsArray.length > 0) {
        data.append('metaKeywords', JSON.stringify(keywordsArray));
      }
    }

    // Images
    Array.from(images).forEach((image) => {
      data.append('images', image);
    });

    // Debug
    console.log('FormData contents:');
    for (let [key, value] of data.entries()) {
      console.log(`${key}:`, value);
    }

    if (isEdit) {
      await productService.update(id, data);
      toast.success('Product updated successfully');
    } else {
      await productService.create(data);
      toast.success('Product created successfully');
    }

    navigate('/products');
  } catch (error) {
    console.error('Full error:', error);
    console.error('Error response:', error.response?.data);
    
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
      const firstError = error.response.data.errors[0];
      toast.error(`${firstError.field}: ${firstError.message}`);
    } else {
      toast.error(error.response?.data?.error || error.message || 'An error occurred');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Product' : 'Add Product'} />

      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #ddd',
        maxWidth: '1000px',
      }}>
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <h3 style={{ marginBottom: '1rem' }}>Basic Information</h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Product Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows="6"
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
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Artist *
              </label>
              <select
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <option value="">Select Artist</option>
                {artists.map((artist) => (
                  <option key={artist._id} value={artist._id}>{artist.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Type & Pricing */}
          <div style={{
            borderTop: '1px solid #ddd',
            paddingTop: '1.5rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Pricing & Inventory</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Product Type *
              </label>
              <select
                value={formData.productType}
                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <option value="price-based">Price-Based (Can be purchased directly)</option>
                <option value="ask-for-price">Ask for Price (Inquiry only)</option>
              </select>
            </div>

            {formData.productType === 'price-based' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Compare at Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                  <small style={{ color: '#666' }}>Original price for showing discount</small>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Stock Keeping Unit"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>

          {/* Artwork Details */}
          <div style={{
            borderTop: '1px solid #ddd',
            paddingTop: '1.5rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Artwork Details</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Medium
                </label>
                <input
                  type="text"
                  value={formData.medium}
                  onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                  placeholder="e.g., Oil on Canvas, Watercolor, etc."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Year Created
                </label>
                <input
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.yearCreated}
                  onChange={(e) => setFormData({ ...formData, yearCreated: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            {/* Artwork Dimensions */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Artwork Dimensions (for shipping calculation)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimensions.artwork.length}
                  onChange={(e) => setFormData({
                    ...formData,
                    dimensions: {
                      ...formData.dimensions,
                      artwork: { ...formData.dimensions.artwork, length: e.target.value }
                    }
                  })}
                  placeholder="Length"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimensions.artwork.width}
                  onChange={(e) => setFormData({
                    ...formData,
                    dimensions: {
                      ...formData.dimensions,
                      artwork: { ...formData.dimensions.artwork, width: e.target.value }
                    }
                  })}
                  placeholder="Width"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimensions.artwork.height}
                  onChange={(e) => setFormData({
                    ...formData,
                    dimensions: {
                      ...formData.dimensions,
                      artwork: { ...formData.dimensions.artwork, height: e.target.value }
                    }
                  })}
                  placeholder="Height"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
                <select
                  value={formData.dimensions.artwork.unit}
                  onChange={(e) => setFormData({
                    ...formData,
                    dimensions: {
                      ...formData.dimensions,
                      artwork: { ...formData.dimensions.artwork, unit: e.target.value }
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  <option value="inches">Inches</option>
                  <option value="cm">CM</option>
                </select>
              </div>
            </div>

            {/* Frame Dimensions (if framed) */}
            {formData.isFramed && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Frame Dimensions
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.dimensions.frame.length}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensions: {
                        ...formData.dimensions,
                        frame: { ...formData.dimensions.frame, length: e.target.value }
                      }
                    })}
                    placeholder="Length"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.dimensions.frame.width}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensions: {
                        ...formData.dimensions,
                        frame: { ...formData.dimensions.frame, width: e.target.value }
                      }
                    })}
                    placeholder="Width"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.dimensions.frame.height}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensions: {
                        ...formData.dimensions,
                        frame: { ...formData.dimensions.frame, height: e.target.value }
                      }
                    })}
                    placeholder="Height"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                  <select
                    value={formData.dimensions.frame.unit}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensions: {
                        ...formData.dimensions,
                        frame: { ...formData.dimensions.frame, unit: e.target.value }
                      }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="inches">Inches</option>
                    <option value="cm">CM</option>
                  </select>
                </div>
              </div>
            )}

            {/* Weight */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Weight * (Required for shipping)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.weight.value}
                  onChange={(e) => setFormData({
                    ...formData,
                    weight: { ...formData.weight, value: e.target.value }
                  })}
                  required
                  placeholder="Weight value"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
                <select
                  value={formData.weight.unit}
                  onChange={(e) => setFormData({
                    ...formData,
                    weight: { ...formData.weight, unit: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  <option value="lbs">LBS</option>
                  <option value="kg">KG</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isFramed}
                  onChange={(e) => setFormData({ ...formData, isFramed: e.target.checked })}
                  id="isFramed"
                />
                <label htmlFor="isFramed" style={{ fontWeight: 'bold' }}>
                  Framed
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isOriginal}
                  onChange={(e) => setFormData({ ...formData, isOriginal: e.target.checked })}
                  id="isOriginal"
                />
                <label htmlFor="isOriginal" style={{ fontWeight: 'bold' }}>
                  Original (not a print)
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="landscape, modern, colorful (comma-separated)"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <small style={{ color: '#666' }}>Separate tags with commas</small>
            </div>
          </div>

          {/* Images */}
          <div style={{
            borderTop: '1px solid #ddd',
            paddingTop: '1.5rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Product Images</h3>

            {/* Existing Images */}
            {isEdit && existingImages.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Current Images
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {existingImages.map((img) => (
                    <div key={img._id} style={{ position: 'relative' }}>
                      <img
                        src={getImageUrl(img.url)}
                        alt="Product"
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: img.isPrimary ? '3px solid #007bff' : '1px solid #ddd',
                        }}
                      />
                      {img.isPrimary && (
                        <span style={{
                          position: 'absolute',
                          top: '5px',
                          left: '5px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}>
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img._id)}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                {isEdit ? 'Add More Images' : 'Upload Images *'}
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(e.target.files)}
                required={!isEdit && existingImages.length === 0}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <small style={{ color: '#666' }}>
                Upload multiple images. First image will be primary. Max 10 images.
              </small>
            </div>
          </div>

          {/* SEO & Settings */}
          <div style={{
            borderTop: '1px solid #ddd',
            paddingTop: '1.5rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>SEO & Settings</h3>

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
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  id="isFeatured"
                />
                <label htmlFor="isFeatured" style={{ fontWeight: 'bold' }}>
                  Featured
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/products')}
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
              {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;