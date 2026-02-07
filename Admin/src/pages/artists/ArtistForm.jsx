import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { artistService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const ArtistForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileInputRef = useRef(null);

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
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

      if (artist.profileImage) {
        setExistingImage(artist.profileImage);
      }
    } catch (error) {
      toast.error(error.message);
      navigate('/artists');
    }
  };

  const handleImageSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setExistingImage(null);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    setExistingImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
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
      data.append(
        'artStyle',
        JSON.stringify(
          formData.artStyle
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );
      data.append('isActive', formData.isActive);
      data.append('isFeatured', formData.isFeatured);
      data.append('displayOrder', formData.displayOrder);
      data.append('socialMedia', JSON.stringify(formData.socialMedia));
      data.append('metaTitle', formData.metaTitle);
      data.append('metaDescription', formData.metaDescription);
      data.append(
        'metaKeywords',
        JSON.stringify(
          formData.metaKeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
        )
      );

      if (profileImage) {
        data.append('profileImage', profileImage);
      }

      if (!profileImage && !existingImage && isEdit) {
        data.append('removeImage', 'true');
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

  const currentPreview = imagePreview || existingImage;

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader title={isEdit ? 'Edit Artist' : 'Add Artist'} />

      <div className="max-w-[900px] bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Artist Name */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Artist Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Enter artist name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                         focus:border-black transition-all duration-200"
            />
          </div>

          {/* Biography */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Biography
            </label>
            <textarea
              value={formData.biography}
              onChange={(e) =>
                setFormData({ ...formData, biography: e.target.value })
              }
              rows="6"
              placeholder="Tell us about the artist's background, style, and achievements..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                         focus:border-black transition-all duration-200 resize-y"
            />
          </div>

          {/* Birth Year & Nationality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-semibold text-black">
                Birth Year
              </label>
              <input
                type="number"
                value={formData.birthYear}
                onChange={(e) =>
                  setFormData({ ...formData, birthYear: e.target.value })
                }
                min="1800"
                max={new Date().getFullYear()}
                placeholder="e.g., 1990"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                           focus:border-black transition-all duration-200 cursor-pointer"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-black">
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) =>
                  setFormData({ ...formData, nationality: e.target.value })
                }
                placeholder="e.g., American, French, etc."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                           focus:border-black transition-all duration-200"
              />
            </div>
          </div>

          {/* Art Style */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Art Style
            </label>
            <input
              type="text"
              value={formData.artStyle}
              onChange={(e) =>
                setFormData({ ...formData, artStyle: e.target.value })
              }
              placeholder="Abstract, Realism, Impressionism, etc."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                         focus:border-black transition-all duration-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple styles with commas
            </p>
          </div>

          {/* Profile Image - Drag & Drop */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Profile Image
            </label>

            {currentPreview ? (
              <div className="relative inline-block group">
                <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
                  <img
                    src={currentPreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-black text-white rounded-full
                             flex items-center justify-center cursor-pointer hover:bg-gray-800
                             transition-colors duration-200 shadow-lg"
                  title="Remove image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-1.5 text-sm border border-black text-black rounded-md
                             cursor-pointer hover:bg-black hover:text-white transition-all duration-200"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                           transition-all duration-300 ${
                             isDragging
                               ? 'border-black bg-gray-100 scale-[1.01]'
                               : 'border-gray-300 bg-gray-50 hover:border-black hover:bg-gray-100'
                           }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center
                               transition-colors duration-300 ${
                                 isDragging ? 'bg-black' : 'bg-gray-200'
                               }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-8 w-8 transition-colors duration-300 ${
                        isDragging ? 'text-white' : 'text-gray-500'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2
                           2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0
                           002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-black">
                      {isDragging
                        ? 'Drop your image here'
                        : 'Drag & drop your image here'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      or{' '}
                      <span className="text-black font-semibold underline">
                        browse files
                      </span>
                    </p>
                  </div>

                  <p className="text-xs text-gray-400">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Social Media Section */}
          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656
                     5.656l1.102-1.101m-.758-4.899a4 4 0 005.656
                     0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Social Media
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.website}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        website: e.target.value,
                      },
                    })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Instagram
                </label>
                <input
                  type="text"
                  value={formData.socialMedia.instagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        instagram: e.target.value,
                      },
                    })
                  }
                  placeholder="@username"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Facebook
                </label>
                <input
                  type="text"
                  value={formData.socialMedia.facebook}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        facebook: e.target.value,
                      },
                    })
                  }
                  placeholder="Page name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Twitter
                </label>
                <input
                  type="text"
                  value={formData.socialMedia.twitter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        twitter: e.target.value,
                      },
                    })
                  }
                  placeholder="@username"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35
                     0a1.724 1.724 0 002.573 1.066c1.543-.94
                     3.31.826 2.37 2.37a1.724 1.724 0
                     001.065 2.572c1.756.426 1.756 2.924 0
                     3.35a1.724 1.724 0 00-1.066 2.573c.94
                     1.543-.826 3.31-2.37 2.37a1.724 1.724
                     0 00-2.572 1.065c-.426 1.756-2.924
                     1.756-3.35 0a1.724 1.724 0
                     00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724
                     1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924
                     0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31
                     2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200 cursor-pointer"
                />
              </div>

              <label
                htmlFor="isActive"
                className="flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-md
                           cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              >
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  id="isActive"
                  className="w-4 h-4 accent-black cursor-pointer"
                />
                <span className="text-sm font-semibold text-black select-none">
                  Active
                </span>
              </label>

              <label
                htmlFor="isFeatured"
                className="flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-md
                           cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              >
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  id="isFeatured"
                  className="w-4 h-4 accent-black cursor-pointer"
                />
                <span className="text-sm font-semibold text-black select-none">
                  Featured
                </span>
              </label>
            </div>
          </div>

          {/* SEO Section */}
          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              SEO Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, metaTitle: e.target.value })
                  }
                  maxLength="60"
                  placeholder="SEO title for search engines"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    Recommended: 50-60 characters
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      formData.metaTitle.length > 55
                        ? 'text-red-500'
                        : 'text-gray-500'
                    }`}
                  >
                    {formData.metaTitle.length}/60
                  </p>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Meta Description
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metaDescription: e.target.value,
                    })
                  }
                  maxLength="160"
                  rows="3"
                  placeholder="Brief description for search engine results"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200 resize-y"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    Recommended: 150-160 characters
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      formData.metaDescription.length > 155
                        ? 'text-red-500'
                        : 'text-gray-500'
                    }`}
                  >
                    {formData.metaDescription.length}/160
                  </p>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  value={formData.metaKeywords}
                  onChange={(e) =>
                    setFormData({ ...formData, metaKeywords: e.target.value })
                  }
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate keywords with commas
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={() => navigate('/artists')}
              className="flex-1 py-3 px-6 bg-white text-black border-2 border-black rounded-md
                         font-semibold cursor-pointer hover:bg-gray-100
                         transition-all duration-200 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-md font-semibold transition-all duration-200
                         active:scale-[0.98] ${
                           loading
                             ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                             : 'bg-black text-white border-2 border-black cursor-pointer hover:bg-gray-800'
                         }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0
                         12h4zm2 5.291A7.962 7.962 0 014
                         12H0c0 3.042 1.135 5.824 3
                         7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : isEdit ? (
                'Update Artist'
              ) : (
                'Create Artist'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtistForm;