import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsletterService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    campaignId: null,
    campaignName: '',
    loading: false,
  });

  // Send modal
  const [sendModal, setSendModal] = useState({
    isOpen: false,
    campaignId: null,
    campaignName: '',
    loading: false,
  });

  useEffect(() => {
    fetchCampaigns();
  }, [pagination.currentPage, pagination.limit]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
      };

      const response = await newsletterService.getCampaigns(params);

      let campaignsData = [];
      let currentPage = pagination.currentPage;
      let totalPages = 1;
      let total = 0;

      const resData = response.data?.data || response.data;

      if (resData && !Array.isArray(resData) && resData.campaigns) {
        campaignsData = resData.campaigns || [];
        total = resData.total || campaignsData.length;
        totalPages = resData.totalPages || Math.ceil(total / pagination.limit);
        currentPage = resData.currentPage || pagination.currentPage;
      } else if (resData && !Array.isArray(resData) && resData.data) {
        campaignsData = resData.data || [];
        total = resData.total || campaignsData.length;
        totalPages = resData.totalPages || Math.ceil(total / pagination.limit);
        currentPage = resData.currentPage || pagination.currentPage;
      } else if (Array.isArray(resData)) {
        campaignsData = resData;
        total = resData.length;
        totalPages = Math.ceil(total / pagination.limit);
        currentPage = 1;
      } else {
        campaignsData = [];
      }

      setCampaigns(campaignsData);
      setPagination((prev) => ({
        ...prev,
        currentPage,
        totalPages,
        total,
      }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Send ──
  const openSendModal = (id, name) => {
    setSendModal({ isOpen: true, campaignId: id, campaignName: name, loading: false });
  };

  const closeSendModal = () => {
    if (!sendModal.loading) {
      setSendModal({ isOpen: false, campaignId: null, campaignName: '', loading: false });
    }
  };

  const handleSend = async () => {
    setSendModal((p) => ({ ...p, loading: true }));
    try {
      await newsletterService.sendCampaign(sendModal.campaignId);
      toast.success('Campaign sent successfully!');
      closeSendModal();
      fetchCampaigns();
    } catch (error) {
      toast.error(error.message);
      setSendModal((p) => ({ ...p, loading: false }));
    }
  };

  // ── Delete ──
  const openDeleteModal = (id, name) => {
    setDeleteModal({ isOpen: true, campaignId: id, campaignName: name, loading: false });
  };

  const closeDeleteModal = () => {
    if (!deleteModal.loading) {
      setDeleteModal({ isOpen: false, campaignId: null, campaignName: '', loading: false });
    }
  };

  const handleDelete = async () => {
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await newsletterService.deleteCampaign(deleteModal.campaignId);
      toast.success('Campaign deleted successfully');
      closeDeleteModal();
      fetchCampaigns();
    } catch (error) {
      toast.error(error.message);
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  // ── Pagination ──
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const getPageNumbers = () => {
    const items = [];
    const { currentPage, totalPages } = pagination;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        items.push({ type: 'page', value: i });
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        items.push({ type: 'dots', value: i });
      }
    }
    return items;
  };

  const showingFrom =
    pagination.total === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.limit + 1;
  const showingTo = Math.min(
    pagination.currentPage * pagination.limit,
    pagination.total
  );

  // ── Status helpers ──
  const getStatusInfo = (status) => {
    const map = {
      draft: { label: 'Draft', styles: 'bg-gray-200 text-gray-600', dot: 'bg-gray-400' },
      scheduled: {
        label: 'Scheduled',
        styles: 'bg-white text-black border border-black',
        dot: 'bg-gray-500',
      },
      sending: { label: 'Sending', styles: 'bg-gray-800 text-white', dot: 'bg-yellow-400 animate-pulse' },
      sent: { label: 'Sent', styles: 'bg-black text-white', dot: 'bg-green-400' },
      failed: { label: 'Failed', styles: 'bg-gray-200 text-gray-500', dot: 'bg-red-400' },
    };
    return map[status] || { label: status, styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' };
  };

  const columns = [
    {
      header: 'Campaign',
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
                d="M3 8l7.89 5.26a2 2 0
                   002.22 0L21 8M5 19h14a2
                   2 0 002-2V7a2 2 0
                   00-2-2H5a2 2 0 00-2
                   2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-black truncate">{row.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[250px]">
              {row.subject}
            </p>
          </div>
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
      header: 'Recipients',
      render: (row) => (
        <div className="flex items-center gap-1.5">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17
                 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7
                 20H2v-2a3 3 0 015.356-1.857M7
                 20v-2c0-.656.126-1.283.356-1.857m0
                 0a5.002 5.002 0 019.288 0M15
                 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm font-medium text-black">
            {row.stats?.totalSent || 0}
          </span>
        </div>
      ),
    },
    {
      header: 'Opened',
      render: (row) => {
        if (!row.stats?.totalSent || row.stats.totalSent === 0) {
          return <span className="text-gray-300 text-sm">—</span>;
        }
        const rate = ((row.stats.opened / row.stats.totalSent) * 100).toFixed(1);
        return (
          <div className="min-w-[100px]">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-black">{row.stats.opened}</span>
              <span className="text-xs text-gray-400">({rate}%)</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  parseFloat(rate) >= 50
                    ? 'bg-black'
                    : parseFloat(rate) >= 25
                    ? 'bg-gray-600'
                    : 'bg-gray-400'
                }`}
                style={{ width: `${Math.min(parseFloat(rate), 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Date',
      render: (row) => (
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
          <span className="text-sm text-gray-600">
            {row.sentAt ? formatDate(row.sentAt) : formatDate(row.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'draft' && (
            <>
              <Link to={`/newsletter/campaigns/edit/${row._id}`}>
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
                  openSendModal(row._id, row.name);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                           bg-black text-white border border-black rounded-md cursor-pointer
                           hover:bg-gray-800 transition-all duration-200 active:scale-95"
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Send
              </button>
            </>
          )}

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

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader
        title="Newsletter Campaigns"
        subtitle="Create and send email campaigns"
        actions={
          <Link to="/newsletter/campaigns/new">
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Campaign
            </button>
          </Link>
        }
      />

      {/* Per Page & Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Show</label>
          <div className="relative">
            <select
              value={pagination.limit}
              onChange={(e) =>
                setPagination((prev) => ({
                  ...prev,
                  limit: parseInt(e.target.value),
                  currentPage: 1,
                }))
              }
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black
                         text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2
                         focus:ring-black focus:border-black transition-all duration-200 pr-8"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <label className="text-sm text-gray-500">per page</label>
        </div>

        <p className="text-sm text-gray-500">
          <span className="font-semibold text-black">{pagination.total}</span> campaigns
        </p>
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
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962
                 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-gray-500 font-medium">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2
                   2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2
                   2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-black mb-1">No campaigns yet</p>
          <p className="text-sm text-gray-500 mb-4">Create your first email campaign</p>
          <Link to="/newsletter/campaigns/new">
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
              Create Campaign
            </button>
          </Link>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <Table columns={columns} data={campaigns} />

          {/* Pagination */}
          {pagination.totalPages > 0 && (
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-4
                          px-6 py-4 border-t border-gray-200 bg-gray-50/50"
            >
              <p className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-semibold text-black">{showingFrom}</span> to{' '}
                <span className="font-semibold text-black">{showingTo}</span> of{' '}
                <span className="font-semibold text-black">{pagination.total}</span> results
              </p>

              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* First */}
                  <button
                    onClick={() => goToPage(1)}
                    disabled={pagination.currentPage === 1}
                    title="First page"
                    className="p-2 rounded-md border border-gray-300 text-gray-500
                               hover:bg-black hover:text-white hover:border-black
                               transition-all duration-200 cursor-pointer active:scale-95
                               disabled:opacity-40 disabled:cursor-not-allowed
                               disabled:hover:bg-white disabled:hover:text-gray-500
                               disabled:hover:border-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Prev */}
                  <button
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    title="Previous"
                    className="p-2 rounded-md border border-gray-300 text-gray-500
                               hover:bg-black hover:text-white hover:border-black
                               transition-all duration-200 cursor-pointer active:scale-95
                               disabled:opacity-40 disabled:cursor-not-allowed
                               disabled:hover:bg-white disabled:hover:text-gray-500
                               disabled:hover:border-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {getPageNumbers().map((item, idx) =>
                    item.type === 'dots' ? (
                      <span key={`dots-${idx}`} className="px-2 py-1.5 text-sm text-gray-400 select-none">
                        …
                      </span>
                    ) : (
                      <button
                        key={item.value}
                        onClick={() => goToPage(item.value)}
                        className={`min-w-[36px] h-9 rounded-md text-sm font-medium
                                    transition-all duration-200 cursor-pointer active:scale-95
                                    ${
                                      item.value === pagination.currentPage
                                        ? 'bg-black text-white border border-black'
                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-black'
                                    }`}
                      >
                        {item.value}
                      </button>
                    )
                  )}

                  {/* Next */}
                  <button
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    title="Next"
                    className="p-2 rounded-md border border-gray-300 text-gray-500
                               hover:bg-black hover:text-white hover:border-black
                               transition-all duration-200 cursor-pointer active:scale-95
                               disabled:opacity-40 disabled:cursor-not-allowed
                               disabled:hover:bg-white disabled:hover:text-gray-500
                               disabled:hover:border-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Last */}
                  <button
                    onClick={() => goToPage(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    title="Last page"
                    className="p-2 rounded-md border border-gray-300 text-gray-500
                               hover:bg-black hover:text-white hover:border-black
                               transition-all duration-200 cursor-pointer active:scale-95
                               disabled:opacity-40 disabled:cursor-not-allowed
                               disabled:hover:bg-white disabled:hover:text-gray-500
                               disabled:hover:border-gray-300"
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

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        loading={deleteModal.loading}
        title="Delete Campaign"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-black">"{deleteModal.campaignName}"</span>?
            This action cannot be undone.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Send Modal */}
      <ConfirmModal
        isOpen={sendModal.isOpen}
        onClose={closeSendModal}
        onConfirm={handleSend}
        loading={sendModal.loading}
        title="Send Campaign"
        message={
          <>
            Are you sure you want to send{' '}
            <span className="font-semibold text-black">"{sendModal.campaignName}"</span> to all
            recipients? This action cannot be undone.
          </>
        }
        confirmText="Send Now"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
};

export default Campaigns;