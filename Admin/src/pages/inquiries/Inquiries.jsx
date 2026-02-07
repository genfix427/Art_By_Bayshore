import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inquiryService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
  });

  useEffect(() => {
    fetchInquiries();
  }, [filters]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;

      const response = await inquiryService.getAll(params);
      setInquiries(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const map = {
      new: { label: 'New', styles: 'bg-black text-white', dot: 'bg-green-400' },
      reviewing: { label: 'Reviewing', styles: 'bg-gray-800 text-white', dot: 'bg-gray-300' },
      quoted: { label: 'Quoted', styles: 'bg-gray-700 text-white', dot: 'bg-gray-300' },
      responded: { label: 'Responded', styles: 'bg-gray-600 text-white', dot: 'bg-green-400' },
      converted: { label: 'Converted', styles: 'bg-white text-black border border-black', dot: 'bg-black' },
      closed: { label: 'Closed', styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' },
      spam: { label: 'Spam', styles: 'bg-gray-200 text-gray-400', dot: 'bg-gray-400' },
    };
    return map[status] || { label: status, styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' };
  };

  const getPriorityInfo = (priority) => {
    const map = {
      low: { label: 'Low', styles: 'bg-gray-100 text-gray-500 border border-gray-200' },
      normal: { label: 'Normal', styles: 'bg-gray-100 text-gray-700 border border-gray-200' },
      high: { label: 'High', styles: 'bg-gray-800 text-white' },
      urgent: { label: 'Urgent', styles: 'bg-black text-white' },
    };
    return map[priority] || { label: priority, styles: 'bg-gray-100 text-gray-500 border border-gray-200' };
  };

  const columns = [
    {
      header: 'Inquiry',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200
                        flex items-center justify-center flex-shrink-0"
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
                d="M8.228 9c.549-1.165 2.03-2
                   3.772-2 2.21 0 4 1.343
                   4 3 0 1.4-1.278
                   2.575-3.006 2.907-.542.104-.994.54-.994
                   1.093m0 3h.01M21 12a9 9 0
                   11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-black font-mono">
                #{row.inquiryNumber}
              </p>
              {!row.isRead && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px]
                              font-bold bg-black text-white uppercase tracking-wider"
                >
                  New
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDate(row.createdAt)}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-black">
            {row.customerInfo.firstName} {row.customerInfo.lastName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0
                   002.22 0L21 8M5 19h14a2
                   2 0 002-2V7a2 2 0
                   00-2-2H5a2 2 0 00-2
                   2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs text-gray-500 truncate max-w-[180px]">
              {row.customerInfo.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Product',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-black truncate max-w-[200px]">
            {row.product?.title || (
              <span className="text-gray-300">—</span>
            )}
          </p>
          {row.quotedPrice && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs
                            font-semibold bg-gray-100 text-black border border-gray-200"
              >
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343
                       2 3 2 3 .895 3 2-1.343
                       2-3 2m0-8c1.11 0 2.08.402
                       2.599 1M12 8V7m0 1v8m0
                       0v1m0-1c-1.11
                       0-2.08-.402-2.599-1M21
                       12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatCurrency(row.quotedPrice)}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const info = getStatusInfo(row.status);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs
                        font-semibold ${info.styles}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
            {info.label}
          </span>
        );
      },
    },
    {
      header: 'Priority',
      render: (row) => {
        const info = getPriorityInfo(row.priority);
        return (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs
                        font-semibold ${info.styles}`}
          >
            {info.label}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <Link to={`/inquiries/${row._id}`}>
          <button
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5
                   12 5c4.478 0 8.268 2.943
                   9.542 7-1.274 4.057-5.064
                   7-9.542 7-4.477
                   0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Details
          </button>
        </Link>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader
        title="Inquiries"
        subtitle="Manage product price inquiries"
      />

      {/* Filters */}
      <div
        className="bg-white border border-gray-300 rounded-lg p-4 mb-6
                    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
            placeholder="Search by inquiry #, email..."
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
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                       text-black text-sm appearance-none cursor-pointer focus:outline-none
                       focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="quoted">Quoted</option>
            <option value="responded">Responded</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
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

        {/* Priority Filter */}
        <div className="relative">
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                       text-black text-sm appearance-none cursor-pointer focus:outline-none
                       focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
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
            Loading inquiries...
          </p>
        </div>
      ) : inquiries.length === 0 ? (
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0
                   00-2 2v7m16 0v5a2 2 0
                   01-2 2H6a2 2 0 01-2-2v-5m16
                   0h-2.586a1 1 0
                   00-.707.293l-2.414 2.414a1 1 0
                   01-.707.293h-3.172a1 1 0
                   01-.707-.293l-2.414-2.414A1 1 0
                   006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-black mb-1">
            No inquiries found
          </p>
          <p className="text-sm text-gray-500">
            Inquiries will appear here when customers submit them
          </p>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <Table columns={columns} data={inquiries} />
        </div>
      )}
    </div>
  );
};

export default Inquiries;