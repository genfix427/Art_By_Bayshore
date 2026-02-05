import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { artistService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const ArtistForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    biography: '',
    birthYear: '',
    nationality: '',
    artStyle: '',
    isActive: true,
    isFeatured: false,
    displayOrder: 0,
    socialMedia: {
      website: '',
      instagram: '',
      facebook: '',
      twitter: '',
    },
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchArtist();
    }
  }, [id]);

  const fetchArtist = async () => {
    try {
      const response = await artistService.getById(id);
      const artist = response.data;
      setFormData({
        name: artist.name,
        biography: artist.biography || '',
        birthYear: artist.birthYear || '',
        nationality: artist.nationality || '',
        artStyle: artist.artStyle?.join(', ') || '',
        isActive: artist.isActive,
        isFeatured: artist.isFeatured,
        displayOrder: artist.displayOrder,
        socialMedia: artist.socialMedia || {
          website: '',
          instagram: '',
          facebook: '',
          twitter: '',
        },
        metaTitle: artist.metaTitle || '',
        metaDescription: artist.metaDescription || '',
        metaKeywords: artist.metaKeywords?.join(', ') || '',
      });
    } catch (error) {
      toast.error(error.message);
      navigate('/artists');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      
      data.append('name', formData.name);
      data.append('biography', formData.biography);
      data.append('birthYear', formData.birthYear);
      data.append('nationality', formData.nationality);
      data.append('artStyle', JSON.stringify(formData.artStyle.split(',').map(s => s.trim()).filter(Boolean)));
      data.append('isActive', formData.isActive);
      data.append('isFeatured', formData.isFeatured);
      data.append('displayOrder', formData.displayOrder);
      data.append('socialMedia', JSON.stringify(formData.socialMedia));
      data.append('metaTitle', formData.metaTitle);
      data.append('metaDescription', formData.metaDescription);
      data.append('metaKeywords', JSON.stringify(formData.metaKeywords.split(',').map(k => k.trim()).filter(Boolean)));

      if (profileImage) {
        data.append('profileImage', profileImage);
      }

      if (isEdit) {
        await artistService.update(id, data);
        toast.success('Artist updated successfully');
      } else {
        await artistService.create(data);
        toast.success('Artist created successfully');
      }

      navigate('/artists');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Artist' : 'Add Artist'} />

      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #ddd',
        maxWidth: '900px',
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Artist Name *
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
              Biography
            </label>
            <textarea
              value={formData.biography}
              onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
              rows="6"
              placeholder="Tell us about the artist's background, style, and achievements..."
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
                Birth Year
              </label>
              <input
                type="number"
                value={formData.birthYear}
                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                min="1800"
                max={new Date().getFullYear()}
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
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="e.g., American, French, etc."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Art Style
            </label>
            <input
              type="text"
              value={formData.artStyle}
              onChange={(e) => setFormData({ ...formData, artStyle: e.target.value })}
              placeholder="Abstract, Realism, Impressionism, etc. (comma-separated)"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            <small style={{ color: '#666' }}>Separate multiple styles with commas</small>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Profile Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files[0])}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          {/* Social Media */}
          <div style={{
            borderTop: '1px solid #ddd',
            paddingTop: '1.5rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Social Media</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Website
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.website}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, website: e.target.value }
                  })}
                  placeholder="https://..."
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
                  Instagram
                </label>
                <input
                  type="text"
                  value={formData.socialMedia.instagram}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                  })}
                  placeholder="@username"
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
                  Facebook
                </label>
                <input
                  type="text"
                  value={formData.socialMedia.facebook}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, facebook: e.target.value }
                  })}
                  placeholder="Page name"
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
                  Twitter
                </label>
                <input
                  type="text"
                  value={formData.socialMedia.twitter}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, twitter: e.target.value }
                  })}
                  placeholder="@username"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div style={{
            borderTop: '1px solid #ddd',
            paddingTop: '1.5rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Settings</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.75rem' }}>
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
              onClick={() => navigate('/artists')}
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
              {loading ? 'Saving...' : isEdit ? 'Update Artist' : 'Create Artist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtistForm;