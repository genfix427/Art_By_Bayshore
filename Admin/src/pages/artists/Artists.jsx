import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { artistService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import ConfirmModal from '../../components/common/ConfirmModal';
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

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    artistId: null,
    artistName: '',
    loading: false,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [filters.search, filters.isActive, filters.isFeatured]);

  useEffect(() => {
    fetchArtists();
  }, [filters, pagination.currentPage, pagination.limit]);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.isActive !== '') params.isActive = filters.isActive;
      if (filters.isFeatured !== '') params.isFeatured = filters.isFeatured;

      const response = await artistService.getAll(params);

      if (response.data && response.pagination) {
        setArtists(response.data);
        setPagination((prev) => ({
          ...prev,
          currentPage:
            response.pagination.currentPage ||
            response.pagination.page ||
            prev.currentPage,
          totalPages:
            response.pagination.totalPages ||
            response.pagination.pages ||
            1,
          total:
            response.pagination.total ||
            response.pagination.totalCount ||
            0,
        }));
      } else if (response.artists) {
        setArtists(response.artists);
        setPagination((prev) => ({
          ...prev,
          totalPages: Math.ceil(response.total / prev.limit) || 1,
          total: response.total || 0,
        }));
      } else if (Array.isArray(response.data)) {
        setArtists(response.data);
        setPagination((prev) => ({
          ...prev,
          totalPages: Math.ceil(response.total / prev.limit) || 1,
          total: response.total || response.data.length,
        }));
      } else if (Array.isArray(response)) {
        setArtists(response);
        setPagination((prev) => ({
          ...prev,
          totalPages: 1,
          total: response.length,
        }));
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Delete Modal ──
  const openDeleteModal = (id, name) => {
    setDeleteModal({
      isOpen: true,
      artistId: id,
      artistName: name,
      loading: false,
    });
  };

  const closeDeleteModal = () => {
    if (!deleteModal.loading) {
      setDeleteModal({
        isOpen: false,
        artistId: null,
        artistName: '',
        loading: false,
      });
    }
  };

  const handleDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await artistService.delete(deleteModal.artistId);
      toast.success('Artist deleted successfully');
      closeDeleteModal();
      fetchArtists();
    } catch (error) {
      toast.error(error.message);
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(newLimit),
      currentPage: 1,
    }));
  };

  const getPageNumbers = () => {
    const pages = [];
    const { currentPage, totalPages } = pagination;
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const columns = [
    {
      header: 'Artist',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
            {row.profileImage ? (
              <img
                src={getImageUrl(row.profileImage)}
                alt={row.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018
                       0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-black text-sm">{row.name}</p>
            {row.nationality && (
              <p className="text-xs text-gray-500 mt-0.5">
                {row.nationality}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Art Style',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.artStyle && row.artStyle.length > 0 ? (
            <>
              {row.artStyle.slice(0, 2).map((style, index) => (
                <span
                  key={index}
                  className="inline-block px-2.5 py-1 bg-gray-100 border border-gray-200
                             text-gray-700 rounded text-xs font-medium"
                >
                  {style}
                </span>
              ))}
              {row.artStyle.length > 2 && (
                <span
                  className="inline-block px-2 py-1 bg-gray-50 border border-gray-200
                             text-gray-400 rounded text-xs"
                >
                  +{row.artStyle.length - 2}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-300 text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          row.isActive
                            ? 'bg-black text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                row.isActive ? 'bg-green-400' : 'bg-gray-400'
              }`}
            />
            {row.isActive ? 'Active' : 'Inactive'}
          </span>

          {row.isFeatured && (
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs
                          font-semibold border border-black text-black bg-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87
                     1.18 6.88L12 17.77l-6.18 3.25L7
                     14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
              Featured
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Created',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/artists/edit/${row._id}`}>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                         border border-gray-300 text-black bg-white rounded-md cursor-pointer
                         hover:bg-gray-100 hover:border-black transition-all duration-200
                         active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0
                     002 2h11a2 2 0 002-2v-5m-1.414-9.414a2
                     2 0 112.828 2.828L11.828
                     15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          </Link>

          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(row._id, row.name);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                       border border-gray-300 text-black bg-white rounded-md cursor-pointer
                       hover:bg-black hover:text-white hover:border-black transition-all
                       duration-200 active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0
                   0116.138 21H7.862a2 2 0
                   01-1.995-1.858L5 7m5
                   4v6m4-6v6m1-10V4a1 1 0
                   00-1-1h-4a1 1 0 00-1
                   1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Pagination Component
  const PaginationControls = () => {
    const { currentPage, totalPages, total, limit } = pagination;
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, total);

    if (total === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-semibold text-black">{startItem}</span> to{' '}
            <span className="font-semibold text-black">{endItem}</span> of{' '}
            <span className="font-semibold text-black">{total}</span> artists
          </p>

          <div className="flex items-center gap-2">
            <label htmlFor="limit" className="text-sm text-gray-600">
              Per page:
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-md bg-white text-black
                         text-sm cursor-pointer focus:outline-none focus:ring-2
                         focus:ring-black focus:border-black"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md border transition-all duration-200
                       ${
                         currentPage === 1
                           ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                           : 'border-gray-300 text-black hover:bg-gray-100 hover:border-black cursor-pointer'
                       }`}
            title="First page"
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
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md border transition-all duration-200
                       ${
                         currentPage === 1
                           ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                           : 'border-gray-300 text-black hover:bg-gray-100 hover:border-black cursor-pointer'
                       }`}
            title="Previous page"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex items-center gap-1 mx-2">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() =>
                  typeof page === 'number' && handlePageChange(page)
                }
                disabled={page === '...'}
                className={`min-w-[36px] h-9 px-3 rounded-md border text-sm font-medium
                           transition-all duration-200
                           ${
                             page === currentPage
                               ? 'bg-black text-white border-black'
                               : page === '...'
                               ? 'border-transparent text-gray-400 cursor-default'
                               : 'border-gray-300 text-black hover:bg-gray-100 hover:border-black cursor-pointer'
                           }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md border transition-all duration-200
                       ${
                         currentPage === totalPages
                           ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                           : 'border-gray-300 text-black hover:bg-gray-100 hover:border-black cursor-pointer'
                       }`}
            title="Next page"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md border transition-all duration-200
                       ${
                         currentPage === totalPages
                           ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                           : 'border-gray-300 text-black hover:bg-gray-100 hover:border-black cursor-pointer'
                       }`}
            title="Last page"
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
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader
        title="Artists"
        subtitle="Manage artists and their profiles"
        actions={
          <Link to="/artists/new">
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white
                         text-sm font-semibold rounded-md cursor-pointer hover:bg-gray-800
                         transition-all duration-200 active:scale-95 shadow-sm"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Artist
            </button>
          </Link>
        }
      />

      {/* Filters */}
      <div
        className="bg-white border border-gray-300 rounded-lg p-4 mb-6
                    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400"
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
          </div>
          <input
            type="text"
            placeholder="Search artists..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md bg-white
                       text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>

        <div className="relative">
          <select
            value={filters.isActive}
            onChange={(e) =>
              setFilters({ ...filters, isActive: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                       text-black text-sm appearance-none cursor-pointer focus:outline-none
                       focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <div className="relative">
          <select
            value={filters.isFeatured}
            onChange={(e) =>
              setFilters({ ...filters, isFeatured: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                       text-black text-sm appearance-none cursor-pointer focus:outline-none
                       focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="">All Artists</option>
            <option value="true">Featured Only</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <svg
            className="animate-spin h-8 w-8 text-black"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373
                 0 12h4zm2 5.291A7.962 7.962 0 014
                 12H0c0 3.042 1.135 5.824 3
                 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-gray-500 font-medium">
            Loading artists...
          </p>
        </div>
      ) : artists.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 border border-dashed
                      border-gray-300 rounded-lg bg-gray-50"
        >
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17
                   20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7
                   20H2v-2a3 3 0 015.356-1.857M7
                   20v-2c0-.656.126-1.283.356-1.857m0
                   0a5.002 5.002 0 019.288 0M15
                   7a3 3 0 11-6 0 3 3 0 016
                   0zm6 3a2 2 0 11-4 0 2 2 0
                   014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-black mb-1">
            No artists found
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Get started by adding your first artist
          </p>
          <Link to="/artists/new">
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white
                         text-sm font-semibold rounded-md cursor-pointer hover:bg-gray-800
                         transition-all duration-200 active:scale-95"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Artist
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Table columns={columns} data={artists} />
          </div>

          <PaginationControls />
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        loading={deleteModal.loading}
        title="Delete Artist"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-black">
              "{deleteModal.artistName}"
            </span>
            ? This action cannot be undone and all associated data will be
            permanently removed.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Artists;