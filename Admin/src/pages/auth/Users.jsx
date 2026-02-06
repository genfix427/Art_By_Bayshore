import React, { useState, useEffect } from 'react';
import { adminService } from '../../api/services';
import { toast } from 'react-hot-toast';
import {
  FiSearch,
  FiFilter,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiTrash2,
  FiMail,
  FiEdit,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
} from 'react-icons/fi';
import { MdVerified, MdBlock } from 'react-icons/md';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    isEmailVerified: '',
    isActive: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'role', 'delete'

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, filters, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach(
        (key) => params[key] === '' && delete params[key]
      );

      const response = await adminService.getAllUsers(params);
      
      // Handle different response formats
      let usersData = [];
      let currentPage = pagination.currentPage;
      let totalPages = pagination.totalPages;
      let total = 0;

      // Check if response.data is an array (current API returns just array)
      if (Array.isArray(response.data)) {
        usersData = response.data;
        total = response.data.length;
        totalPages = Math.ceil(total / pagination.limit);
        currentPage = 1;
      } 
      // Check if response.data has the expected structure
      else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        usersData = response.data.data;
        total = response.data.total || response.data.data.length;
        totalPages = response.data.totalPages || Math.ceil(total / pagination.limit);
        currentPage = response.data.currentPage || 1;
      }
      // Check if response is the data directly (another possible structure)
      else if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
        total = response.data.length;
        totalPages = Math.ceil(total / pagination.limit);
        currentPage = 1;
      }
      // If nothing matches, set empty
      else {
        console.warn('Unexpected API response format:', response.data);
        usersData = [];
      }

      setUsers(usersData);
      setPagination({
        ...pagination,
        currentPage,
        totalPages,
        total,
      });
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleVerification = async (userId) => {
    try {
      await adminService.toggleUserVerification(userId);
      toast.success('User verification status updated');
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to update verification'
      );
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      toast.success('User status updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminService.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const openModal = (type, user) => {
    setModalType(type);
    setSelectedUser(user);
    setShowModal(true);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      customer: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800',
      superadmin: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Helper function to get initials safely
  const getInitials = (user) => {
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    
    if (!firstName && !lastName && user?.email) {
      // Use first letter of email if no name provided
      return user.email.charAt(0).toUpperCase();
    }
    
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    
    return `${firstInitial}${lastInitial}` || 'U';
  };

  // Helper function to get full name safely
  const getFullName = (user) => {
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    
    if (!firstName && !lastName) {
      return user?.email || 'Unknown User';
    }
    
    return `${firstName} ${lastName}`.trim();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            Manage users, roles, and permissions
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-text"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={filters.role}
                onChange={(e) =>
                  setFilters({ ...filters, role: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.isActive}
                onChange={(e) =>
                  setFilters({ ...filters, isActive: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isEmailVerified === 'true'}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      isEmailVerified: e.target.checked ? 'true' : '',
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700">
                  Verified Only
                </span>
              </label>
            </div>

            <button
              onClick={fetchUsers}
              className="flex items-center space-x-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                {getInitials(user)}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {getFullName(user)}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center space-x-1">
                                <span>{user?.email || 'No email'}</span>
                                {user?.isEmailVerified ? (
                                  <MdVerified className="text-green-500" />
                                ) : (
                                  <FiMail className="text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                              user?.role || 'customer'
                            )}`}
                          >
                            {user?.role || 'customer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user?.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user?.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {!(user?.isEmailVerified) && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Unverified
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Change Role */}
                            <button
                              onClick={() => openModal('role', user)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Change Role"
                            >
                              <FiShield className="w-4 h-4" />
                            </button>

                            {/* Toggle Verification */}
                            <button
                              onClick={() =>
                                handleToggleVerification(user._id)
                              }
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                user?.isEmailVerified
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                              title={
                                user?.isEmailVerified
                                  ? 'Unverify Email'
                                  : 'Verify Email'
                              }
                            >
                              {user?.isEmailVerified ? (
                                <FiMail className="w-4 h-4" />
                              ) : (
                                <FiMail className="w-4 h-4" />
                              )}
                            </button>

                            {/* Toggle Status */}
                            <button
                              onClick={() => handleToggleStatus(user._id)}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                user?.isActive
                                  ? 'text-yellow-600 hover:bg-yellow-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={
                                user?.isActive
                                  ? 'Deactivate User'
                                  : 'Activate User'
                              }
                            >
                              {user?.isActive ? (
                                <FiUserX className="w-4 h-4" />
                              ) : (
                                <FiUserCheck className="w-4 h-4" />
                              )}
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => openModal('delete', user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          currentPage: pagination.currentPage - 1,
                        })
                      }
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          currentPage: pagination.currentPage + 1,
                        })
                      }
                      disabled={
                        pagination.currentPage === pagination.totalPages
                      }
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(pagination.currentPage - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(
                            pagination.currentPage * pagination.limit,
                            pagination.total
                          )}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.total}</span>{' '}
                        results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() =>
                            setPagination({
                              ...pagination,
                              currentPage: pagination.currentPage - 1,
                            })
                          }
                          disabled={pagination.currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <FiChevronLeft className="h-5 w-5" />
                        </button>

                        {[...Array(pagination.totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          // Show first page, last page, current page, and pages around current
                          if (
                            pageNumber === 1 ||
                            pageNumber === pagination.totalPages ||
                            (pageNumber >= pagination.currentPage - 1 &&
                              pageNumber <= pagination.currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNumber}
                                onClick={() =>
                                  setPagination({
                                    ...pagination,
                                    currentPage: pageNumber,
                                  })
                                }
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium cursor-pointer ${
                                  pageNumber === pagination.currentPage
                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          } else if (
                            pageNumber === pagination.currentPage - 2 ||
                            pageNumber === pagination.currentPage + 2
                          ) {
                            return (
                              <span
                                key={pageNumber}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}

                        <button
                          onClick={() =>
                            setPagination({
                              ...pagination,
                              currentPage: pagination.currentPage + 1,
                            })
                          }
                          disabled={
                            pagination.currentPage === pagination.totalPages
                          }
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <FiChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              {modalType === 'role' && selectedUser && (
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 mr-4">
                      <FiShield className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Change User Role
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Change role for {getFullName(selectedUser)}
                      </p>
                    </div>
                  </div>
                  
                  <select
                    defaultValue={selectedUser?.role || 'customer'}
                    onChange={(e) => handleRoleChange(selectedUser._id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6 cursor-pointer"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'delete' && selectedUser && (
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 mr-4">
                      <FiTrash2 className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Delete User
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete{' '}
                    <span className="font-semibold">{getFullName(selectedUser)}</span>?
                  </p>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedUser._id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Users;