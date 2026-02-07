import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { couponService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    couponId: null,
    couponCode: '',
    loading: false,
  });

  useEffect(() => {
    fetchCoupons();
  }, [filters]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.isActive !== '') params.isActive = filters.isActive;

      const response = await couponService.getAll(params);
      setCoupons(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id, code) => {
    setDeleteModal({
      isOpen: true,
      couponId: id,
      couponCode: code,
      loading: false,
    });
  };

  const closeDeleteModal = () => {
    if (!deleteModal.loading) {
      setDeleteModal({
        isOpen: false,
        couponId: null,
        couponCode: '',
        loading: false,
      });
    }
  };

  const handleDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await couponService.delete(deleteModal.couponId);
      toast.success('Coupon deleted successfully');
      closeDeleteModal();
      fetchCoupons();
    } catch (error) {
      toast.error(error.message);
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const getStatusInfo = (row) => {
    const now = new Date();
    const isExpired = new Date(row.expiryDate) < now;
    const isNotStarted = new Date(row.startDate) > now;

    if (!row.isActive) {
      return { label: 'Inactive', styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' };
    }
    if (isExpired) {
      return { label: 'Expired', styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' };
    }
    if (isNotStarted) {
      return {
        label: 'Scheduled',
        styles: 'bg-white text-black border border-black',
        dot: 'bg-gray-500',
      };
    }
    if (row.usageLimit && row.usedCount >= row.usageLimit) {
      return { label: 'Limit Reached', styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' };
    }
    return { label: 'Active', styles: 'bg-black text-white', dot: 'bg-green-400' };
  };

  const columns = [
    {
      header: 'Code',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center
                        justify-center flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 7h.01M7 3h5c.512 0 1.024.195
                   1.414.586l7 7a2 2 0 010
                   2.828l-7 7a2 2 0
                   01-2.828 0l-7-7A1.994 1.994
                   0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
          <div>
            <p className="font-mono font-bold text-black tracking-wider text-sm">
              {row.code}
            </p>
            {row.description && (
              <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                {row.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Discount',
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-black">
            {row.discountType === 'fixed'
              ? formatCurrency(row.discountValue)
              : `${row.discountValue}%`}
          </p>
          <span
            className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100
                        text-gray-600 rounded border border-gray-200"
          >
            {row.discountType === 'fixed' ? 'Fixed' : 'Percentage'}
          </span>
        </div>
      ),
    },
    {
      header: 'Usage',
      render: (row) => {
        const used = row.usedCount || 0;
        const limit = row.usageLimit;
        const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;

        return (
          <div className="min-w-[120px]">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-black">{used}</span>
              <span className="text-xs text-gray-400">/</span>
              <span className="text-xs text-gray-500">
                {limit || '∞'}
              </span>
            </div>

            {limit && (
              <>
                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentage >= 100
                        ? 'bg-black'
                        : percentage >= 75
                        ? 'bg-gray-600'
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {percentage.toFixed(0)}% used
                </p>
              </>
            )}
          </div>
        );
      },
    },
    {
      header: 'Valid Period',
      render: (row) => (
        <div className="text-sm">
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0
                   002-2V7a2 2 0 00-2-2H5a2 2 0
                   00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-gray-700 text-xs">
              {formatDate(row.startDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            <span className="text-gray-500 text-xs">
              {formatDate(row.expiryDate)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const status = getStatusInfo(row);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs
                        font-semibold ${status.styles}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/coupons/edit/${row._id}`}>
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
              openDeleteModal(row._id, row.code);
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

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader
        title="Coupons"
        subtitle="Create and manage discount coupons"
        actions={
          <Link to="/coupons/new">
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
              Create Coupon
            </button>
          </Link>
        }
      />

      {/* Filters */}
      <div
        className="bg-white border border-gray-300 rounded-lg p-4 mb-6
                    grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {/* Search */}
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
            placeholder="Search by code..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md bg-white
                       text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>

        {/* Status Filter */}
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
            <option value="">All Coupons</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
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
        <div className="flex flex-col items-center justify-center py-20 gap-4">
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0
                 5.373 0 12h4zm2 5.291A7.962
                 7.962 0 014 12H0c0 3.042 1.135
                 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-gray-500 font-medium">
            Loading coupons...
          </p>
        </div>
      ) : coupons.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 border border-dashed
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195
                   1.414.586l7 7a2 2 0 010
                   2.828l-7 7a2 2 0
                   01-2.828 0l-7-7A1.994 1.994
                   0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-black mb-1">
            No coupons found
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Create your first discount coupon
          </p>
          <Link to="/coupons/new">
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
              Create Coupon
            </button>
          </Link>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <Table columns={columns} data={coupons} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        loading={deleteModal.loading}
        title="Delete Coupon"
        message={
          <>
            Are you sure you want to delete coupon{' '}
            <span className="font-mono font-bold text-black tracking-wider">
              "{deleteModal.couponCode}"
            </span>
            ? This action cannot be undone and the coupon will no longer be
            usable by customers.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Coupons;