import React, { useEffect, useState } from 'react';
import { newsletterService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    tags: [],
  });
  const [bulkData, setBulkData] = useState('');
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    subscriberId: null,
    subscriberEmail: '',
    loading: false,
  });
  const [bulkDeleteModal, setBulkDeleteModal] = useState({
    isOpen: false,
    loading: false,
  });

  useEffect(() => {
    fetchData();
  }, [filters, pagination.currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;

      const [subscribersRes, statsRes] = await Promise.all([
        newsletterService.getSubscribers(params),
        newsletterService.getStats(),
      ]);

      // Handle different response formats
      let subscribersData = [];
      let currentPage = pagination.currentPage;
      let totalPages = 1;
      let total = 0;

      const resData = subscribersRes.data?.data || subscribersRes.data;

      if (resData && !Array.isArray(resData) && resData.subscribers) {
        // Paginated response: { subscribers: [], total, totalPages, currentPage }
        subscribersData = resData.subscribers || [];
        total = resData.total || subscribersData.length;
        totalPages = resData.totalPages || Math.ceil(total / pagination.limit);
        currentPage = resData.currentPage || pagination.currentPage;
      } else if (resData && !Array.isArray(resData) && resData.data) {
        subscribersData = resData.data || [];
        total = resData.total || subscribersData.length;
        totalPages = resData.totalPages || Math.ceil(total / pagination.limit);
        currentPage = resData.currentPage || pagination.currentPage;
      } else if (Array.isArray(resData)) {
        subscribersData = resData;
        total = resData.length;
        totalPages = Math.ceil(total / pagination.limit);
        currentPage = 1;
      } else {
        subscribersData = [];
      }

      setSubscribers(subscribersData);
      setPagination((prev) => ({
        ...prev,
        currentPage,
        totalPages,
        total,
      }));
      setStats(statsRes.data?.data || statsRes.data || null);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
      setSubscribers([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await newsletterService.addSubscriber(formData);
      toast.success('Subscriber added successfully');
      setShowAddModal(false);
      setFormData({ email: '', firstName: '', lastName: '', tags: [] });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add subscriber');
    } finally {
      setAddLoading(false);
    }
  };

const handleBulkAdd = async (e) => {
  e.preventDefault();
  setBulkLoading(true);
  try {
    const lines = bulkData.trim().split('\n').filter(line => line.trim() !== '');
    const subs = lines.map((line, index) => {
      const parts = line.split(',').map((p) => p.trim());
      
      if (parts.length >= 3) {
        return {
          email: parts[0],
          firstName: parts[1] || '',
          lastName: parts[2] || '',
          source: 'bulk_import'
        };
      } else if (parts.length === 2) {
        return {
          email: parts[0],
          firstName: parts[1] || '',
          lastName: '',
          source: 'bulk_import'
        };
      } else if (parts.length === 1) {
        return {
          email: parts[0],
          firstName: '',
          lastName: '',
          source: 'bulk_import'
        };
      } else {
        throw new Error(`Invalid format on line ${index + 1}`);
      }
    }).filter(sub => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(sub.email);
    });

    if (subs.length === 0) {
      toast.error('No valid emails found in the import data');
      setBulkLoading(false);
      return;
    }

    // Call the API
    const response = await newsletterService.bulkAddSubscribers({
      subscribers: subs,
    });
    
    // Handle response based on structure
    let result;
    if (response.data && response.data.data) {
      result = response.data.data; // { added, updated, skipped, errors }
    } else if (response.data) {
      result = response.data; // Direct data
    } else {
      result = {
        added: 0,
        updated: 0,
        skipped: subs.length,
        errors: [{ error: 'Unknown response format' }]
      };
    }

    const successMessage = `Import completed: ${result.added || 0} added, ${result.updated || 0} updated, ${result.skipped || 0} skipped`;
    
    if (result.errors && result.errors.length > 0) {
      toast.success(successMessage);
      toast.error(`${result.errors.length} emails failed to import`);
      console.log('Import errors:', result.errors);
    } else {
      toast.success(successMessage);
    }
    
    setShowBulkModal(false);
    setBulkData('');
    fetchData(); // Refresh the list
  } catch (error) {
    console.error('Bulk import error:', error);
    
    // Check for specific error messages
    if (error.response) {
      if (error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else if (error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to import subscribers. Please check the format.');
      }
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred during import');
    }
  } finally {
    setBulkLoading(false);
  }
};

const handleExport = async () => {
  try {
    toast.loading('Preparing export...', { id: 'export' });
    
    console.log('Starting export with filters:', filters);
    
    // Use the regular getSubscribers endpoint instead of exportSubscribers
    const response = await newsletterService.getSubscribers({
      status: filters.status,
      limit: 100000, // Large number to get all subscribers
      page: 1,
    });

    console.log('Export API response:', response);
    
    // Extract subscribers from response
    let subscribers = [];
    const resData = response.data?.data || response.data;
    
    if (resData && Array.isArray(resData)) {
      subscribers = resData;
    } else if (resData && resData.subscribers && Array.isArray(resData.subscribers)) {
      subscribers = resData.subscribers;
    } else if (resData && resData.data && Array.isArray(resData.data)) {
      subscribers = resData.data;
    } else if (resData && typeof resData === 'object') {
      // If it's an object with pagination, extract the data
      for (const key in resData) {
        if (Array.isArray(resData[key])) {
          subscribers = resData[key];
          break;
        }
      }
    }
    
    console.log('Found subscribers:', subscribers.length);
    
    if (subscribers.length === 0) {
      toast.error('No subscribers found to export', { id: 'export' });
      return;
    }

    // Create CSV content
    const headers = ['Email', 'First Name', 'Last Name', 'Status', 'Source', 'Subscribed At', 'Tags'];
    
    const csvRows = subscribers.map(subscriber => {
      const row = [
        subscriber.email || '',
        subscriber.firstName || '',
        subscriber.lastName || '',
        subscriber.status || '',
        subscriber.source || 'website',
        subscriber.subscribedAt ? new Date(subscriber.subscribedAt).toISOString() : '',
        Array.isArray(subscriber.tags) ? subscriber.tags.join(';') : ''
      ];
      
      // Escape special characters
      return row.map(cell => {
        const str = String(cell);
        // If field contains comma, quote, or newline, wrap in quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    const statusSuffix = filters.status ? `_${filters.status}` : '';
    const filename = `subscribers${statusSuffix}_${dateStr}_${timeStr}.csv`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    toast.success(`Successfully exported ${subscribers.length} subscribers!`, { id: 'export' });
    
  } catch (error) {
    console.error('Export error:', error);
    console.error('Error response:', error.response);
    
    let errorMessage = 'Failed to export subscribers';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast.error(errorMessage, { id: 'export' });
  }
};

  // ── Single Delete ──
  const openDeleteModal = (id, email) => {
    setDeleteModal({ isOpen: true, subscriberId: id, subscriberEmail: email, loading: false });
  };

  const closeDeleteModal = () => {
    if (!deleteModal.loading) {
      setDeleteModal({ isOpen: false, subscriberId: null, subscriberEmail: '', loading: false });
    }
  };

  const handleDelete = async () => {
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await newsletterService.deleteSubscriber(deleteModal.subscriberId);
      toast.success('Subscriber deleted successfully');
      closeDeleteModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete subscriber');
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  // ── Bulk Delete ──
  const openBulkDeleteModal = () => {
    if (selectedSubscribers.length === 0) {
      toast.error('Please select subscribers to delete');
      return;
    }
    setBulkDeleteModal({ isOpen: true, loading: false });
  };

  const closeBulkDeleteModal = () => {
    if (!bulkDeleteModal.loading) {
      setBulkDeleteModal({ isOpen: false, loading: false });
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await Promise.all(
        selectedSubscribers.map((id) => newsletterService.deleteSubscriber(id))
      );
      toast.success('Subscribers deleted successfully');
      setSelectedSubscribers([]);
      closeBulkDeleteModal();
      fetchData();
    } catch (error) {
      toast.error('Failed to delete some subscribers');
      setBulkDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  const toggleSelectSubscriber = (id) => {
    setSelectedSubscribers((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSubscribers.length === subscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(subscribers.map((s) => s._id));
    }
  };

  // ── Pagination Helpers ──
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
      setSelectedSubscribers([]);
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

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader
        title="Newsletter Subscribers"
        subtitle="Manage your newsletter subscriptions"
        actions={
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black
                       text-black text-sm font-semibold rounded-md cursor-pointer
                       hover:bg-black hover:text-white transition-all duration-200
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0
                   004.582 9m0 0H9m11 11v-5h-.581m0
                   0a8.003 8.003 0 01-15.357-2m15.357
                   2H15"
              />
            </svg>
            Refresh
          </button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active</p>
                <p className="text-3xl font-bold text-black">
                  {stats.subscribers?.active ?? 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-black rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 9v3m0 0v3m0-3h3m-3
                       0h-3m-2-5a4 4 0 11-8
                       0 4 4 0 018 0zM3
                       20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Unsubscribed</p>
                <p className="text-3xl font-bold text-black">
                  {stats.subscribers?.unsubscribed ?? 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7a4 4 0 11-8 0 4 4 0
                       018 0zM9 14a6 6 0 00-6
                       6v1h12v-1a6 6 0
                       00-6-6zM21 12h-6"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-black border border-black rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total</p>
                <p className="text-3xl font-bold text-white">
                  {stats.subscribers?.total ?? 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
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
                       7a3 3 0 11-6 0 3 3 0 016
                       0zm6 3a2 2 0 11-4 0 2 2 0
                       014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white
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
              Add Subscriber
            </button>

            <button
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black
                         text-black text-sm font-semibold rounded-md cursor-pointer
                         hover:bg-black hover:text-white transition-all duration-200
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0
                     003-3v-1m-4-8l-4-4m0 0L8
                     8m4-4v12"
                />
              </svg>
              Bulk Import
            </button>

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300
                         text-black text-sm font-semibold rounded-md cursor-pointer
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0
                     003-3v-1m-4-4l-4 4m0
                     0l-4-4m4 4V4"
                />
              </svg>
              Export
            </button>

            {selectedSubscribers.length > 0 && (
              <button
                onClick={openBulkDeleteModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300
                           text-black text-sm font-semibold rounded-md cursor-pointer
                           hover:bg-black hover:text-white hover:border-black transition-all
                           duration-200 active:scale-95"
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
                    d="M19 7l-.867 12.142A2 2 0
                       0116.138 21H7.862a2 2 0
                       01-1.995-1.858L5 7m5
                       4v6m4-6v6m1-10V4a1 1 0
                       00-1-1h-4a1 1 0 00-1
                       1v3M4 7h16"
                  />
                </svg>
                Delete ({selectedSubscribers.length})
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500">
            <span className="font-semibold text-black">{pagination.total}</span> total subscribers
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            placeholder="Search by email or name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md bg-white
                       text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>

        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                       text-black text-sm appearance-none cursor-pointer focus:outline-none
                       focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="">All Status</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
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

      {/* Per Page Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Show</label>
          <div className="relative">
            <select
              value={pagination.limit}
              onChange={(e) => {
                setPagination((prev) => ({
                  ...prev,
                  limit: parseInt(e.target.value),
                  currentPage: 1,
                }));
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black
                         text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2
                         focus:ring-black focus:border-black transition-all duration-200 pr-8"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
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

        {selectedSubscribers.length > 0 && (
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-black">{selectedSubscribers.length}</span> selected
          </p>
        )}
      </div>

      {/* Table */}
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
          <p className="text-sm text-gray-500 font-medium">Loading subscribers...</p>
        </div>
      ) : subscribers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-300 rounded-lg bg-gray-50">
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
          <p className="text-lg font-semibold text-black mb-1">No subscribers found</p>
          <p className="text-sm text-gray-500 mb-4">Start building your mailing list</p>
          <button
            onClick={() => setShowAddModal(true)}
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
            Add Subscriber
          </button>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="px-6 py-3.5 text-left">
                    <input
                      type="checkbox"
                      checked={
                        subscribers.length > 0 &&
                        selectedSubscribers.length === subscribers.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscribers.map((subscriber) => (
                  <tr
                    key={subscriber._id}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      selectedSubscribers.includes(subscriber._id) ? 'bg-gray-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSubscribers.includes(subscriber._id)}
                        onChange={() => toggleSelectSubscriber(subscriber._id)}
                        className="w-4 h-4 accent-black cursor-pointer"
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {subscriber.email[0].toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-black truncate max-w-[220px]">
                          {subscriber.email}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {subscriber.firstName || subscriber.lastName
                          ? `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim()
                          : <span className="text-gray-300">—</span>}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                                    text-xs font-semibold ${
                                      subscriber.status === 'subscribed'
                                        ? 'bg-black text-white'
                                        : 'bg-gray-200 text-gray-500'
                                    }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            subscriber.status === 'subscribed' ? 'bg-green-400' : 'bg-gray-400'
                          }`}
                        />
                        {subscriber.status === 'subscribed' ? 'Subscribed' : 'Unsubscribed'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded border border-gray-200">
                        {subscriber.source || 'website'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {subscriber.subscribedAt
                          ? new Date(subscriber.subscribedAt).toLocaleDateString()
                          : '—'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(subscriber._id, subscriber.email);
                        }}
                        title="Delete subscriber"
                        className="p-2 rounded-md border border-transparent text-gray-400
                                   hover:text-white hover:bg-black hover:border-black
                                   transition-all duration-200 cursor-pointer active:scale-95"
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
                            d="M19 7l-.867 12.142A2 2 0
                               0116.138 21H7.862a2 2 0
                               01-1.995-1.858L5 7m5
                               4v6m4-6v6m1-10V4a1 1 0
                               00-1-1h-4a1 1 0 00-1
                               1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {pagination.totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              {/* Info */}
              <p className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-semibold text-black">{showingFrom}</span>
                {' '}to{' '}
                <span className="font-semibold text-black">{showingTo}</span>
                {' '}of{' '}
                <span className="font-semibold text-black">{pagination.total}</span>
                {' '}results
              </p>

              {/* Controls */}
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

                  {/* Prev */}
                  <button
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    title="Previous page"
                    className="p-2 rounded-md border border-gray-300 text-gray-500
                               hover:bg-black hover:text-white hover:border-black
                               transition-all duration-200 cursor-pointer active:scale-95
                               disabled:opacity-40 disabled:cursor-not-allowed
                               disabled:hover:bg-white disabled:hover:text-gray-500
                               disabled:hover:border-gray-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((item, idx) =>
                    item.type === 'dots' ? (
                      <span
                        key={`dots-${idx}`}
                        className="px-2 py-1.5 text-sm text-gray-400 select-none"
                      >
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
                    title="Next page"
                    className="p-2 rounded-md border border-gray-300 text-gray-500
                               hover:bg-black hover:text-white hover:border-black
                               transition-all duration-200 cursor-pointer active:scale-95
                               disabled:opacity-40 disabled:cursor-not-allowed
                               disabled:hover:bg-white disabled:hover:text-gray-500
                               disabled:hover:border-gray-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
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
          )}
        </div>
      )}

      {/* ── Delete Modal ── */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        loading={deleteModal.loading}
        title="Delete Subscriber"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-black">"{deleteModal.subscriberEmail}"</span>?
            They will be permanently removed from your mailing list.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* ── Bulk Delete Modal ── */}
      <ConfirmModal
        isOpen={bulkDeleteModal.isOpen}
        onClose={closeBulkDeleteModal}
        onConfirm={handleBulkDelete}
        loading={bulkDeleteModal.loading}
        title="Delete Subscribers"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-black">
              {selectedSubscribers.length} subscriber
              {selectedSubscribers.length > 1 ? 's' : ''}
            </span>
            ? This action cannot be undone.
          </>
        }
        confirmText={`Delete ${selectedSubscribers.length}`}
        cancelText="Cancel"
        variant="danger"
      />

      {/* ── Add Subscriber Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => !addLoading && setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200 animate-scaleIn">
            <button
              onClick={() => setShowAddModal(false)}
              disabled={addLoading}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                         rounded-full text-gray-400 hover:text-black hover:bg-gray-100
                         transition-all duration-200 cursor-pointer disabled:opacity-50
                         disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <form onSubmit={handleAddSubscriber}>
              <div className="p-6 pt-8 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-black">Add New Subscriber</h3>
                <p className="mt-1 text-sm text-gray-500">Manually add someone to your mailing list</p>
              </div>

              <div className="px-6 space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="subscriber@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-black">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-black">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                  className="flex-1 py-2.5 px-4 bg-white text-black border-2 border-gray-300 rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-50 hover:border-black transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 px-4 bg-black text-white border-2 border-black rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-800 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Subscriber'
                  )}
                </button>
              </div>
            </form>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
            .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
          `}</style>
        </div>
      )}

      {/* ── Bulk Import Modal ── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => !bulkLoading && setShowBulkModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 animate-scaleIn">
            <button
              onClick={() => setShowBulkModal(false)}
              disabled={bulkLoading}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <form onSubmit={handleBulkAdd}>
              <div className="p-6 pt-8 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-black">Bulk Import Subscribers</h3>
                <p className="mt-1 text-sm text-gray-500">Import multiple subscribers at once using CSV format</p>
              </div>

              <div className="px-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-xs font-semibold text-black mb-2 uppercase tracking-wider">Format</p>
                  <code className="block text-xs text-gray-600 font-mono leading-relaxed">
                    email@example.com, First Name, Last Name<br />
                    john@example.com, John, Doe<br />
                    jane@example.com, Jane, Smith
                  </code>
                </div>

                <textarea
                  required
                  rows={8}
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder="email@example.com, First, Last"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-black text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 resize-y"
                />

                {bulkData.trim() && (
                  <p className="mt-2 text-xs text-gray-500">
                    <span className="font-semibold text-black">
                      {bulkData.trim().split('\n').length}
                    </span>{' '}
                    line{bulkData.trim().split('\n').length !== 1 ? 's' : ''} detected
                  </p>
                )}
              </div>

              <div className="flex gap-3 p-6 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  disabled={bulkLoading}
                  className="flex-1 py-2.5 px-4 bg-white text-black border-2 border-gray-300 rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-50 hover:border-black transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading}
                  className="flex-1 py-2.5 px-4 bg-black text-white border-2 border-black rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-800 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {bulkLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import Subscribers
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
            .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Subscribers;