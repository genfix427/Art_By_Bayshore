import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, artistService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import { getImageUrl } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
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

  // Enhanced image state management
  const [selectedImages, setSelectedImages] = useState([]); // Array of { file, preview, id }
  const [existingImages, setExistingImages] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Check if form can be submitted
  const canSubmit = isEdit
    ? (existingImages.length > 0 || selectedImages.length > 0)
    : selectedImages.length > 0;

  useEffect(() => {
    fetchCategoriesAndArtists();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      selectedImages.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  const fetchCategoriesAndArtists = async () => {
    try {
      console.log('Fetching all artists...');

      let allArtists = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        try {
          const response = await artistService.getAll({
            isActive: true,
            page,
            limit: 100 // Request a large limit
          });

          console.log(`Page ${page} response:`, response.data);

          let pageArtists = [];

          // Extract artists from response based on different possible structures
          if (Array.isArray(response.data)) {
            pageArtists = response.data;
          } else if (response.data && Array.isArray(response.data.data)) {
            pageArtists = response.data.data;
          } else if (response.data && Array.isArray(response.data.artists)) {
            pageArtists = response.data.artists;
          } else if (response.data && Array.isArray(response.data.results)) {
            pageArtists = response.data.results;
          } else if (response.data && typeof response.data === 'object') {
            // Try to find any array in the object
            for (const key in response.data) {
              if (Array.isArray(response.data[key])) {
                pageArtists = response.data[key];
                break;
              }
            }
          }

          if (pageArtists.length === 0) {
            hasMore = false;
          } else {
            allArtists = [...allArtists, ...pageArtists];
            page++;
          }

        } catch (error) {
          console.error(`Error fetching page ${page}:`, error);
          hasMore = false;
        }
      }

      console.log(`Total artists fetched: ${allArtists.length}`);
      console.log('Artists:', allArtists.map(a => a.name));

      // Remove duplicates by ID
      const uniqueArtists = Array.from(new Map(allArtists.map(artist => [artist._id, artist])).values());

      setArtists(uniqueArtists);

    } catch (error) {
      console.error('Error in fetchCategoriesAndArtists:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await productService.getById(id);
      const product = response.data;

      setFormData({
        title: product.title,
        description: product.description,
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

  // Handle file selection with preview
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Check max limit (10 images)
    const totalImages = selectedImages.length + existingImages.length + files.length;
    if (totalImages > 10) {
      toast.error(`Maximum 10 images allowed. You can add ${10 - selectedImages.length - existingImages.length} more.`);
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Max size is 5MB`);
        return false;
      }
      return true;
    });

    // Create preview URLs
    const newImages = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    setSelectedImages(prev => [...prev, ...newImages]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected image before upload
  const handleRemoveSelectedImage = (imageId) => {
    setSelectedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  // Delete existing image from server
  const handleDeleteExistingImage = async (imageId) => {
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

  // Set image as primary
  const handleSetPrimary = (index) => {
    setSelectedImages(prev => {
      const newImages = [...prev];
      const [primaryImage] = newImages.splice(index, 1);
      return [primaryImage, ...newImages];
    });
    toast.success('Image set as primary');
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Drag and drop handlers
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      const event = { target: { files: imageFiles } };
      handleFileSelect(event);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error('Please upload at least one image');
      return;
    }

    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const data = new FormData();

      // Basic fields
      data.append('title', formData.title);
      data.append('description', formData.description);
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

      // Dimensions
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

      // Weight
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

      // Append images
      selectedImages.forEach((image) => {
        data.append('images', image.file);
      });

      // Create config for upload progress
      const config = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      };

      if (isEdit) {
        await productService.update(id, data, config);
        toast.success('Product updated successfully');
      } else {
        await productService.create(data, config);
        toast.success('Product created successfully');
      }

      // Cleanup preview URLs
      selectedImages.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });

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
      setIsUploading(false);
      setUploadProgress(0);
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

          {/* Images Section - Enhanced */}
          <div style={{
            borderTop: '1px solid #ddd',
            paddingTop: '1.5rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>
              Product Images
              <span style={{
                color: canSubmit ? '#28a745' : '#dc3545',
                fontSize: '0.875rem',
                marginLeft: '0.5rem',
                fontWeight: 'normal'
              }}>
                {canSubmit ? '✓ Images ready' : '* At least one image required'}
              </span>
            </h3>

            {/* Existing Images (Edit Mode) */}
            {isEdit && existingImages.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Current Images ({existingImages.length})
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '1rem'
                }}>
                  {existingImages.map((img) => (
                    <div
                      key={img._id}
                      style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: img.isPrimary ? '3px solid #007bff' : '1px solid #ddd',
                        backgroundColor: '#f8f9fa',
                      }}
                    >
                      <img
                        src={getImageUrl(img.url)}
                        alt="Product"
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
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
                        onClick={() => handleDeleteExistingImage(img._id)}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Delete image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#007bff' : '#ddd'}`,
                borderRadius: '8px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging ? '#e7f3ff' : '#f8f9fa',
                transition: 'all 0.3s ease',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#333' }}>
                {isDragging ? 'Drop images here' : 'Click or drag images to upload'}
              </p>
              <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                PNG, JPG, JPEG up to 5MB each. Maximum 10 images.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Image Count Info */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
            }}>
              <span>
                Total: {existingImages.length + selectedImages.length}/10 images
              </span>
              {selectedImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    selectedImages.forEach(img => {
                      if (img.preview) URL.revokeObjectURL(img.preview);
                    });
                    setSelectedImages([]);
                  }}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Clear All New Images
                </button>
              )}
            </div>

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  New Images to Upload ({selectedImages.length})
                </label>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                  First image will be set as primary. Drag to reorder or click "Set as Primary" button.
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '1rem'
                }}>
                  {selectedImages.map((img, index) => (
                    <div
                      key={img.id}
                      style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: index === 0 ? '3px solid #28a745' : '1px solid #ddd',
                        backgroundColor: '#f8f9fa',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                        }}
                      />

                      {/* Primary Badge */}
                      {index === 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '5px',
                          left: '5px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}>
                          Primary
                        </span>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedImage(img.id)}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                        title="Remove image"
                      >
                        ×
                      </button>

                      {/* Image Info */}
                      <div style={{
                        padding: '0.5rem',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                      }}>
                        <p style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: '#333',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {img.name}
                        </p>
                        <p style={{
                          margin: '0.25rem 0 0 0',
                          fontSize: '0.7rem',
                          color: '#666'
                        }}>
                          {formatFileSize(img.size)}
                        </p>

                        {/* Set as Primary Button */}
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(index)}
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              width: '100%',
                            }}
                          >
                            Set as Primary
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Images Warning */}
            {!canSubmit && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                color: '#856404',
                marginTop: '1rem',
              }}>
                ⚠️ Please upload at least one image to create the product.
              </div>
            )}
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

          {/* Upload Progress */}
          {isUploading && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              border: '1px solid #007bff',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: '#007bff',
              }}>
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: '#cce4ff',
                borderRadius: '6px',
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: '#007bff',
                    borderRadius: '6px',
                    transition: 'width 0.3s ease',
                    background: 'linear-gradient(90deg, #007bff, #0056b3)',
                  }}
                />
              </div>
              <p style={{
                margin: '0.5rem 0 0 0',
                fontSize: '0.875rem',
                color: '#0056b3',
                textAlign: 'center',
              }}>
                {uploadProgress < 100
                  ? 'Please wait while your images are being uploaded...'
                  : 'Processing complete!'}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/products')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: loading ? '#ccc' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: loading || !canSubmit ? '#ccc' : 'black',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              title={!canSubmit ? 'Please upload at least one image' : ''}
            >
              {loading ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  {isUploading ? `Uploading ${uploadProgress}%...` : 'Saving...'}
                </>
              ) : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>

          {/* Spinner animation */}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;