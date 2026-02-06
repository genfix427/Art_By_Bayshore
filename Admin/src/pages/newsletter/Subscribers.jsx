import React, { useEffect, useState } from 'react';
import { newsletterService } from '../../api/services';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiPlus,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiEdit,
  FiMail,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
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

  useEffect(() => {
    fetchData();
  }, [filters]);

   const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;

      const [subscribersRes, statsRes] = await Promise.all([
        newsletterService.getSubscribers(params),
        newsletterService.getStats(),
      ]);

      // Debug: Check what the API returns
      console.log('Subscribers response:', subscribersRes);
      console.log('Stats response:', statsRes);

      setSubscribers(subscribersRes.data?.data || subscribersRes.data || []);
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
    try {
      await newsletterService.addSubscriber(formData);
      toast.success('Subscriber added successfully');
      setShowAddModal(false);
      setFormData({ email: '', firstName: '', lastName: '', tags: [] });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add subscriber');
    }
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    try {
      // Parse CSV or line-separated emails
      const lines = bulkData.trim().split('\n');
      const subscribers = lines.map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        return {
          email: parts[0],
          firstName: parts[1] || '',
          lastName: parts[2] || '',
        };
      });

      const response = await newsletterService.bulkAddSubscribers({ subscribers });
      const result = response.data.data;

      toast.success(
        `Added: ${result.added}, Updated: ${result.updated}, Skipped: ${result.skipped}`
      );
      setShowBulkModal(false);
      setBulkData('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import subscribers');
    }
  };

  const handleExport = async () => {
    try {
      const response = await newsletterService.exportSubscribers({ status: filters.status });
      const data = response.data.data;

      // Convert to CSV
      const csv = [
        ['Email', 'First Name', 'Last Name', 'Status', 'Subscribed At', 'Source'].join(','),
        ...data.map((sub) =>
          [
            sub.email,
            sub.firstName || '',
            sub.lastName || '',
            sub.status,
            new Date(sub.subscribedAt).toLocaleDateString(),
            sub.source || '',
          ].join(',')
        ),
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${Date.now()}.csv`;
      a.click();

      toast.success(`Exported ${data.length} subscribers`);
    } catch (error) {
      toast.error('Failed to export subscribers');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) {
      return;
    }

    try {
      await newsletterService.deleteSubscriber(id);
      toast.success('Subscriber deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete subscriber');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubscribers.length === 0) {
      toast.error('Please select subscribers to delete');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedSubscribers.length} subscriber(s)?`
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        selectedSubscribers.map((id) => newsletterService.deleteSubscriber(id))
      );
      toast.success('Subscribers deleted successfully');
      setSelectedSubscribers([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete some subscribers');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Newsletter Subscribers
          </h1>
          <p className="text-gray-600">Manage your newsletter subscriptions</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Subscribers</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.subscribers.active}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiUserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unsubscribed</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.subscribers.unsubscribed}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FiUserX className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Subscribers</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {stats.subscribers.total}
                  </p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
                <span>Add Subscriber</span>
              </button>

              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                <FiUpload className="w-4 h-4" />
                <span>Bulk Import</span>
              </button>

              <button
                onClick={handleExport}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <FiDownload className="w-4 h-4" />
                <span>Export</span>
              </button>

              {selectedSubscribers.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedSubscribers.length})</span>
                </button>
              )}
            </div>

            <button
              onClick={fetchData}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-text"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-12">
              <FiMail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No subscribers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedSubscribers.length === subscribers.length}
                        onChange={toggleSelectAll}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscribed
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.map((subscriber) => (
                    <tr
                      key={subscriber._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedSubscribers.includes(subscriber._id)}
                          onChange={() => toggleSelectSubscriber(subscriber._id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {subscriber.email[0].toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {subscriber.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscriber.firstName || subscriber.lastName
                          ? `${subscriber.firstName || ''} ${
                              subscriber.lastName || ''
                            }`.trim()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            subscriber.status === 'subscribed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subscriber.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscriber.source || 'website'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscriber.subscribedAt
                          ? new Date(subscriber.subscribedAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(subscriber._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAddModal(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <form onSubmit={handleAddSubscriber}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Add New Subscriber
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-500 cursor-pointer"
                    >
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="subscriber@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="John"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors cursor-pointer"
                  >
                    Add Subscriber
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowBulkModal(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <form onSubmit={handleBulkAdd}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Bulk Import Subscribers
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowBulkModal(false)}
                      className="text-gray-400 hover:text-gray-500 cursor-pointer"
                    >
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Enter one subscriber per line in CSV format:
                    </p>
                    <code className="block bg-gray-100 p-2 rounded text-xs mb-3">
                      email@example.com, First Name, Last Name
                      <br />
                      john@example.com, John, Doe
                      <br />
                      jane@example.com, Jane, Smith
                    </code>

                    <textarea
                      required
                      rows={10}
                      value={bulkData}
                      onChange={(e) => setBulkData(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      placeholder="email@example.com, First, Last"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors cursor-pointer"
                  >
                    Import Subscribers
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Subscribers;