// pages/admin/Products.jsx
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { productService, artistService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatCurrency, formatDate, getImageUrl } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Products = () => {
  const [allProducts, setAllProducts] = useState([]); // Store all products
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingArtists, setLoadingArtists] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    productType: '',
    isActive: '',
    artist: '',
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    productName: '',
    loading: false,
  });

  // Fetch artists on component mount
  useEffect(() => {
    fetchArtists();
    fetchProducts();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filters.search, filters.productType, filters.isActive, filters.artist]);

  const fetchArtists = async () => {
    try {
      setLoadingArtists(true);
      const response = await artistService.getAll({ limit: 1000 });
      setArtists(response.data || []);
    } catch (error) {
      console.error('Error fetching artists:', error);
      toast.error('Failed to load artists');
    } finally {
      setLoadingArtists(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll({ limit: 1000 }); // Fetch all products
      setAllProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering with useMemo for performance
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const titleMatch = product.title?.toLowerCase().includes(searchLower);
        const artistMatch = product.artist?.name?.toLowerCase().includes(searchLower);
        const descriptionMatch = product.description?.toLowerCase().includes(searchLower);
        return titleMatch || artistMatch || descriptionMatch;
      });
    }

    // Product type filter
    if (filters.productType) {
      filtered = filtered.filter(product => product.productType === filters.productType);
    }

    // Status filter
    if (filters.isActive !== '') {
      const isActive = filters.isActive === 'true';
      filtered = filtered.filter(product => product.isActive === isActive);
    }

    // Artist filter
    if (filters.artist) {
      filtered = filtered.filter(product => product.artist?._id === filters.artist);
    }

    return filtered;
  }, [allProducts, filters]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, pagination.currentPage, pagination.limit]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / pagination.limit) || 1;
  }, [filteredProducts.length, pagination.limit]);

  // Ensure current page is valid when filtered results change
  useEffect(() => {
    if (pagination.currentPage > totalPages) {
      setPagination(prev => ({ ...prev, currentPage: Math.max(1, totalPages) }));
    }
  }, [totalPages, pagination.currentPage]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      productType: '',
      isActive: '',
      artist: '',
    });
  };

  const hasActiveFilters = () => {
    return filters.search || filters.productType || filters.isActive !== '' || filters.artist;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.productType) count++;
    if (filters.isActive !== '') count++;
    if (filters.artist) count++;
    return count;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination({
      limit: parseInt(newLimit),
      currentPage: 1,
    });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const { currentPage } = pagination;
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

  const openDeleteModal = (id, name) => {
    setDeleteModal({
      isOpen: true,
      productId: id,
      productName: name,
      loading: false,
    });
  };

  const closeDeleteModal = () => {
    if (!deleteModal.loading) {
      setDeleteModal({
        isOpen: false,
        productId: null,
        productName: '',
        loading: false,
      });
    }
  };

  const handleDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await productService.delete(deleteModal.productId);
      toast.success('Product deleted successfully');
      closeDeleteModal();
      fetchProducts(); // Refresh the products list
    } catch (error) {
      toast.error(error.message);
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns = [
    {
      header: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border
                        border-gray-200 flex-shrink-0"
          >
            {row.images?.[0]?.url ? (
              <img
                src={getImageUrl(row.images[0].url)}
                alt={row.title}
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0
                       012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0
                       00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-black text-sm truncate">
              {row.title}
            </p>
            {row.artist?.name && (
              <p className="text-xs text-gray-500 mt-0.5">
                by {row.artist.name}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        row.productType === 'price-based'
                          ? 'bg-black text-white'
                          : 'bg-white text-black border border-black'
                      }`}
        >
          {row.productType === 'price-based' ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343
                     2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0
                     0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Price-Based
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343
                     4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994
                     1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Ask for Price
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Price',
      render: (row) =>
        row.productType === 'price-based' ? (
          <span className="text-sm font-bold text-black">
            {formatCurrency(row.price)}
          </span>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        ),
    },
    {
      header: 'Stock',
      render: (row) => {
        if (row.productType !== 'price-based') {
          return <span className="text-xs text-gray-400 italic">N/A</span>;
        }

        const isOutOfStock = row.stockQuantity === 0;
        const isLow = row.isLowStock && row.stockQuantity > 0;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                          ${
                            isOutOfStock
                              ? 'bg-gray-200 text-gray-600'
                              : isLow
                              ? 'bg-gray-100 text-gray-700 border border-gray-300'
                              : 'bg-white text-black border border-gray-200'
                          }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOutOfStock
                    ? 'bg-black'
                    : isLow
                    ? 'bg-gray-500'
                    : 'bg-gray-400'
                }`}
              />
              {row.stockQuantity}
              {isOutOfStock && <span className="ml-0.5">· Out</span>}
              {isLow && <span className="ml-0.5">· Low</span>}
            </span>
          </div>
        );
      },
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
                row.isActive ? 'bg-gray-900' : 'bg-gray-400'
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
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18
                     3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
              Featured
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/products/edit/${row._id}`}>
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2
                     2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          </Link>

          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(row._id, row.title);
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                   01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1
                   1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Pagination Controls Component
  const PaginationControls = () => {
    const { currentPage, limit } = pagination;
    const total = filteredProducts.length;
    const startItem = total === 0 ? 0 : (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, total);

    if (total === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
        {/* Results info and limit selector */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-black">{startItem}</span> to{' '}
            <span className="font-semibold text-black">{endItem}</span> of{' '}
            <span className="font-semibold text-black">{total}</span> products
            {hasActiveFilters() && (
              <span className="text-gray-400"> (filtered from {allProducts.length})</span>
            )}
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

        {/* Page navigation */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* First page button */}
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

            {/* Previous page button */}
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

            {/* Page numbers */}
            <div className="flex items-center gap-1 mx-2">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
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

            {/* Next page button */}
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

            {/* Last page button */}
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
        )}
      </div>
    );
  };

  // Get selected artist name for display
  const selectedArtistName = artists.find(a => a._id === filters.artist)?.name || '';

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader
        title="Products"
        subtitle="Manage your artwork inventory"
        actions={
          <Link to="/products/new">
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
              Add Product
            </button>
          </Link>
        }
      />

      {/* Filters Section */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414
                   6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293
                   7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters() && (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-black text-white text-xs font-bold rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>

          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                         text-gray-700 hover:text-black transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All Filters
            </button>
          )}
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Filter */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Search Products
            </label>
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
                placeholder="Search by title, artist..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md bg-white
                           text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2
                           focus:ring-black focus:border-black transition-all duration-200"
              />
              {filters.search && (
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-400 hover:text-black transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Product Type Filter */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Product Type
            </label>
            <div className="relative">
              <select
                value={filters.productType}
                onChange={(e) => handleFilterChange('productType', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                           text-black text-sm appearance-none cursor-pointer focus:outline-none
                           focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
              >
                <option value="">All Types</option>
                <option value="price-based">Price-Based</option>
                <option value="ask-for-price">Ask for Price</option>
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Status
            </label>
            <div className="relative">
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Artist Filter */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Artist
            </label>
            <div className="relative">
              <select
                value={filters.artist}
                onChange={(e) => handleFilterChange('artist', e.target.value)}
                disabled={loadingArtists}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                           text-black text-sm appearance-none cursor-pointer focus:outline-none
                           focus:ring-2 focus:ring-black focus:border-black transition-all
                           duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingArtists ? 'Loading artists...' : 'All Artists'}
                </option>
                {artists.map((artist) => (
                  <option key={artist._id} value={artist._id}>
                    {artist.name}
                    {artist.nationality ? ` (${artist.nationality})` : ''}
                  </option>
                ))}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-600">Active Filters:</span>
              
              {filters.search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white
                                rounded-full text-xs font-medium">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search: "{filters.search}"
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {filters.productType && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white
                                rounded-full text-xs font-medium">
                  Type: {filters.productType === 'price-based' ? 'Price-Based' : 'Ask for Price'}
                  <button
                    onClick={() => handleFilterChange('productType', '')}
                    className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {filters.isActive !== '' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white
                                rounded-full text-xs font-medium">
                  Status: {filters.isActive === 'true' ? 'Active' : 'Inactive'}
                  <button
                    onClick={() => handleFilterChange('isActive', '')}
                    className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {filters.artist && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white
                                rounded-full text-xs font-medium">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Artist: {selectedArtistName}
                  <button
                    onClick={() => handleFilterChange('artist', '')}
                    className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962
                 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-gray-500 font-medium">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-black mb-1">
            {hasActiveFilters() ? 'No products match your filters' : 'No products found'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {hasActiveFilters()
              ? 'Try adjusting your filter criteria or clear all filters'
              : 'Get started by adding your first product'}
          </p>
          {hasActiveFilters() ? (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300
                         text-black bg-white text-sm font-semibold rounded-md cursor-pointer
                         hover:bg-gray-100 hover:border-black transition-all duration-200
                         active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All Filters
            </button>
          ) : (
            <Link to="/products/new">
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Products Table */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Table columns={columns} data={paginatedProducts} />
          </div>

          {/* Pagination Controls */}
          <PaginationControls />
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        loading={deleteModal.loading}
        title="Delete Product"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-black">"{deleteModal.productName}"</span>? This
            action cannot be undone and all associated data will be permanently removed.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Products;