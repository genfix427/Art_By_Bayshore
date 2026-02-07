import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    orderStatus: '',
    paymentStatus: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.currentPage, pagination.limit]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
      };
      if (filters.search) params.search = filters.search;
      if (filters.orderStatus) params.orderStatus = filters.orderStatus;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;

      const response = await orderService.getAll(params);

      let ordersData = [];
      let currentPage = pagination.currentPage;
      let totalPages = 1;
      let total = 0;

      const resData = response.data?.data || response.data;

      if (resData && !Array.isArray(resData) && (resData.orders || resData.data)) {
        ordersData = resData.orders || resData.data || [];
        total = resData.total || ordersData.length;
        totalPages = resData.totalPages || Math.ceil(total / pagination.limit);
        currentPage = resData.currentPage || pagination.currentPage;
      } else if (Array.isArray(resData)) {
        ordersData = resData;
        total = resData.length;
        totalPages = Math.ceil(total / pagination.limit);
        currentPage = 1;
      }

      setOrders(ordersData);
      setPagination((prev) => ({ ...prev, currentPage, totalPages, total }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const getPageNumbers = () => {
    const items = [];
    const { currentPage, totalPages } = pagination;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        items.push({ type: 'page', value: i });
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        items.push({ type: 'dots', value: i });
      }
    }
    return items;
  };

  const showingFrom = pagination.total === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1;
  const showingTo = Math.min(pagination.currentPage * pagination.limit, pagination.total);

  const getOrderStatusInfo = (status) => {
    const map = {
      pending: { label: 'Pending', styles: 'bg-gray-200 text-gray-600', dot: 'bg-gray-400' },
      processing: { label: 'Processing', styles: 'bg-gray-800 text-white', dot: 'bg-yellow-400 animate-pulse' },
      confirmed: { label: 'Confirmed', styles: 'bg-gray-700 text-white', dot: 'bg-blue-400' },
      shipped: { label: 'Shipped', styles: 'bg-white text-black border border-black', dot: 'bg-black' },
      delivered: { label: 'Delivered', styles: 'bg-black text-white', dot: 'bg-green-400' },
      cancelled: { label: 'Cancelled', styles: 'bg-gray-200 text-gray-400', dot: 'bg-red-400' },
      refunded: { label: 'Refunded', styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' },
    };
    return map[status] || { label: status, styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' };
  };

  const getPaymentStatusInfo = (status) => {
    const map = {
      pending: { label: 'Pending', styles: 'bg-gray-200 text-gray-600' },
      paid: { label: 'Paid', styles: 'bg-black text-white' },
      failed: { label: 'Failed', styles: 'bg-gray-200 text-gray-400' },
      refunded: { label: 'Refunded', styles: 'bg-gray-200 text-gray-500' },
    };
    return map[status] || { label: status, styles: 'bg-gray-200 text-gray-500' };
  };

  const columns = [
    {
      header: 'Order',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-black font-mono">#{row.orderNumber}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-gray-500">{formatDate(row.createdAt)}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-black">
            {row.user?.firstName} {row.user?.lastName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-gray-500 truncate max-w-[160px]">{row.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Items',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {row.items.length} item{row.items.length > 1 ? 's' : ''}
        </span>
      ),
    },
    {
      header: 'Total',
      render: (row) => (
        <span className="text-sm font-bold text-black">{formatCurrency(row.total)}</span>
      ),
    },
    {
      header: 'Payment',
      render: (row) => {
        const info = getPaymentStatusInfo(row.paymentStatus);
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${info.styles}`}>
            {info.label}
          </span>
        );
      },
    },
    {
      header: 'Status',
      render: (row) => {
        const info = getOrderStatusInfo(row.orderStatus);
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${info.styles}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
            {info.label}
          </span>
        );
      },
    },
    {
      header: 'Tracking',
      render: (row) =>
        row.fedexShipment?.trackingNumber ? (
          <div>
            <p className="text-xs font-mono font-bold text-black">{row.fedexShipment.trackingNumber}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded border border-gray-200 uppercase tracking-wider">
              {row.shippingStatus?.replace('-', ' ')}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-300 italic">Not shipped</span>
        ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Link to={`/orders/${row._id}`}>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 text-black bg-white rounded-md cursor-pointer hover:bg-black hover:text-white hover:border-black transition-all duration-200 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
        </Link>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader title="Orders" subtitle="Manage customer orders and shipments" />

      {/* Filters */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by order #, tracking..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md bg-white text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>

        <div className="relative">
          <select
            value={filters.orderStatus}
            onChange={(e) => setFilters({ ...filters, orderStatus: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="">All Order Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="relative">
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Per Page */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Show</label>
          <div className="relative">
            <select
              value={pagination.limit}
              onChange={(e) => setPagination((prev) => ({ ...prev, limit: parseInt(e.target.value), currentPage: 1 }))}
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 pr-8"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <label className="text-sm text-gray-500">per page</label>
        </div>

        <p className="text-sm text-gray-500">
          <span className="font-semibold text-black">{pagination.total}</span> orders
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-gray-500 font-medium">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-black mb-1">No orders found</p>
          <p className="text-sm text-gray-500">Orders will appear here when customers make purchases</p>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <Table columns={columns} data={orders} />

          {pagination.totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-black">{showingFrom}</span> to{' '}
                <span className="font-semibold text-black">{showingTo}</span> of{' '}
                <span className="font-semibold text-black">{pagination.total}</span> results
              </p>

              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-black hover:text-white hover:border-black transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-black hover:text-white hover:border-black transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {getPageNumbers().map((item, idx) =>
                    item.type === 'dots' ? (
                      <span key={`dots-${idx}`} className="px-2 py-1.5 text-sm text-gray-400 select-none">…</span>
                    ) : (
                      <button
                        key={item.value}
                        onClick={() => goToPage(item.value)}
                        className={`min-w-[36px] h-9 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                          item.value === pagination.currentPage
                            ? 'bg-black text-white border border-black'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-black'
                        }`}
                      >
                        {item.value}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-black hover:text-white hover:border-black transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => goToPage(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-black hover:text-white hover:border-black transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;