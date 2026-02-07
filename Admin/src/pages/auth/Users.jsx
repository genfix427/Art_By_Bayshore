import React, { useState, useEffect } from 'react';
import { adminService } from '../../api/services';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import PageHeader from '../../components/common/PageHeader';

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

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    loading: false,
  });

  // Role modal state
  const [roleModal, setRoleModal] = useState({
    isOpen: false,
    user: null,
    selectedRole: '',
    loading: false,
  });

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

      Object.keys(params).forEach(
        (key) => params[key] === '' && delete params[key]
      );

      const response = await adminService.getAllUsers(params);

      let usersData = [];
      let currentPage = pagination.currentPage;
      let totalPages = pagination.totalPages;
      let total = 0;

      if (Array.isArray(response.data)) {
        usersData = response.data;
        total = response.data.length;
        totalPages = Math.ceil(total / pagination.limit);
        currentPage = 1;
      } else if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        usersData = response.data.data;
        total = response.data.total || response.data.data.length;
        totalPages =
          response.data.totalPages ||
          Math.ceil(total / pagination.limit);
        currentPage = response.data.currentPage || 1;
      } else if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
        total = response.data.length;
        totalPages = Math.ceil(total / pagination.limit);
        currentPage = 1;
      } else {
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
      toast.error(
        error.response?.data?.message || 'Failed to fetch users'
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ──
  const openDeleteModal = (user) => {
    setDeleteModal({
      isOpen: true,
      userId: user._id,
      userName: getFullName(user),
      loading: false,
    });
  };

  const closeDeleteModal = () => {
    if (!deleteModal.loading) {
      setDeleteModal({
        isOpen: false,
        userId: null,
        userName: '',
        loading: false,
      });
    }
  };

  const handleDeleteUser = async () => {
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await adminService.deleteUser(deleteModal.userId);
      toast.success('User deleted successfully');
      closeDeleteModal();
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to delete user'
      );
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // ── Role ──
  const openRoleModal = (user) => {
    setRoleModal({
      isOpen: true,
      user,
      selectedRole: user?.role || 'customer',
      loading: false,
    });
  };

  const closeRoleModal = () => {
    if (!roleModal.loading) {
      setRoleModal({
        isOpen: false,
        user: null,
        selectedRole: '',
        loading: false,
      });
    }
  };

  const handleRoleChange = async () => {
    if (!roleModal.user || roleModal.selectedRole === roleModal.user.role) {
      closeRoleModal();
      return;
    }
    setRoleModal((prev) => ({ ...prev, loading: true }));
    try {
      await adminService.updateUserRole(
        roleModal.user._id,
        roleModal.selectedRole
      );
      toast.success('User role updated successfully');
      closeRoleModal();
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to update role'
      );
      setRoleModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // ── Toggle helpers ──
  const handleToggleVerification = async (userId) => {
    try {
      await adminService.toggleUserVerification(userId);
      toast.success('Verification status updated');
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to update verification'
      );
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to update status'
      );
    }
  };

  // ── Utils ──
  const getInitials = (user) => {
    const first = user?.firstName || '';
    const last = user?.lastName || '';
    if (!first && !last && user?.email)
      return user.email.charAt(0).toUpperCase();
    return (
      `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U'
    );
  };

  const getFullName = (user) => {
    const first = user?.firstName || '';
    const last = user?.lastName || '';
    if (!first && !last) return user?.email || 'Unknown User';
    return `${first} ${last}`.trim();
  };

  const roleLabel = (role) => {
    const map = {
      customer: 'Customer',
      admin: 'Admin',
      superadmin: 'Super Admin',
    };
    return map[role] || role;
  };

  // ── Pagination helpers ──
  const pages = () => {
    const items = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      if (
        i === 1 ||
        i === pagination.totalPages ||
        (i >= pagination.currentPage - 1 &&
          i <= pagination.currentPage + 1)
      ) {
        items.push({ type: 'page', value: i });
      } else if (
        i === pagination.currentPage - 2 ||
        i === pagination.currentPage + 2
      ) {
        items.push({ type: 'dots', value: i });
      }
    }
    return items;
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader
        title="User Management"
        subtitle="Manage users, roles, and permissions"
        actions={
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black
                       text-black text-sm font-semibold rounded-md cursor-pointer
                       hover:bg-black hover:text-white transition-all duration-200
                       active:scale-95"
          >
            {/* refresh icon */}
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

      {/* ── Filters ── */}
      <div
        className="bg-white border border-gray-300 rounded-lg p-4 mb-6
                    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Search */}
        <div className="relative lg:col-span-2">
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
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md bg-white
                       text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            value={filters.role}
            onChange={(e) =>
              setFilters({ ...filters, role: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                       text-black text-sm appearance-none cursor-pointer focus:outline-none
                       focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
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

        {/* Status filter */}
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
      </div>

      {/* Verified-only checkbox row */}
      <div className="flex items-center justify-between mb-6">
        <label
          htmlFor="verifiedOnly"
          className="flex items-center gap-2.5 px-4 py-2 border border-gray-300
                     rounded-md cursor-pointer hover:bg-gray-50 transition-colors duration-200
                     select-none"
        >
          <input
            id="verifiedOnly"
            type="checkbox"
            checked={filters.isEmailVerified === 'true'}
            onChange={(e) =>
              setFilters({
                ...filters,
                isEmailVerified: e.target.checked ? 'true' : '',
              })
            }
            className="w-4 h-4 accent-black cursor-pointer"
          />
          <span className="text-sm font-medium text-black">
            Verified Only
          </span>
        </label>

        <p className="text-sm text-gray-500">
          <span className="font-semibold text-black">
            {pagination.total}
          </span>{' '}
          total users
        </p>
      </div>

      {/* ── Table ── */}
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373
                 0 12h4zm2 5.291A7.962 7.962 0 014
                 12H0c0 3.042 1.135 5.824 3
                 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-gray-500 font-medium">
            Loading users...
          </p>
        </div>
      ) : !users || users.length === 0 ? (
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
            No users found
          </p>
          <p className="text-sm text-gray-500">
            Try adjusting your filters or search term
          </p>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-black uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {/* User */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full bg-black text-white flex items-center
                                      justify-center text-sm font-bold flex-shrink-0"
                        >
                          {getInitials(user)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-black truncate">
                            {getFullName(user)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-gray-500 truncate">
                              {user?.email || 'No email'}
                            </p>
                            {user?.isEmailVerified ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 text-black flex-shrink-0"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6.267 3.455a3.066 3.066 0
                                     001.745-.723 3.066 3.066 0
                                     013.976 0 3.066 3.066 0
                                     001.745.723 3.066 3.066 0
                                     012.812 2.812c.051.643.304
                                     1.254.723 1.745a3.066 3.066
                                     0 010 3.976 3.066 3.066 0
                                     00-.723 1.745 3.066 3.066 0
                                     01-2.812 2.812 3.066 3.066
                                     0 00-1.745.723 3.066 3.066
                                     0 01-3.976 0 3.066 3.066 0
                                     00-1.745-.723 3.066 3.066 0
                                     01-2.812-2.812 3.066 3.066
                                     0 00-.723-1.745 3.066 3.066
                                     0 010-3.976 3.066 3.066 0
                                     00.723-1.745 3.066 3.066 0
                                     012.812-2.812zm7.44
                                     5.252a1 1 0 00-1.414-1.414L9
                                     10.586 7.707 9.293a1 1 0
                                     00-1.414 1.414l2 2a1 1 0
                                     001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 text-gray-300 flex-shrink-0"
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
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                                    ${
                                      user?.role === 'superadmin'
                                        ? 'bg-black text-white'
                                        : user?.role === 'admin'
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                                    }`}
                      >
                        {/* shield icon */}
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
                            d="M9 12l2 2 4-4m5.618-4.016A11.955
                               11.955 0 0112 2.944a11.955
                               11.955 0 01-8.618 3.04A12.02
                               12.02 0 003 9c0 5.591 3.824
                               10.29 9 11.622 5.176-1.332
                               9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        {roleLabel(user?.role || 'customer')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                                      text-xs font-semibold w-fit
                                      ${
                                        user?.isActive
                                          ? 'bg-black text-white'
                                          : 'bg-gray-200 text-gray-500'
                                      }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user?.isActive
                                ? 'bg-green-400'
                                : 'bg-gray-400'
                            }`}
                          />
                          {user?.isActive ? 'Active' : 'Inactive'}
                        </span>

                        {!user?.isEmailVerified && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                                        text-xs font-medium border border-gray-300 text-gray-500 w-fit"
                          >
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {user?.createdAt
                          ? new Date(
                              user.createdAt
                            ).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Change Role */}
                        <button
                          onClick={() => openRoleModal(user)}
                          title="Change Role"
                          className="p-2 rounded-md border border-transparent text-gray-500
                                     hover:text-black hover:border-gray-300 hover:bg-gray-50
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
                              d="M9 12l2 2 4-4m5.618-4.016A11.955
                                 11.955 0 0112 2.944a11.955
                                 11.955 0 01-8.618 3.04A12.02
                                 12.02 0 003 9c0 5.591 3.824
                                 10.29 9 11.622 5.176-1.332
                                 9-6.03 9-11.622
                                 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </button>

                        {/* Toggle Verification */}
                        <button
                          onClick={() =>
                            handleToggleVerification(user._id)
                          }
                          title={
                            user?.isEmailVerified
                              ? 'Unverify Email'
                              : 'Verify Email'
                          }
                          className={`p-2 rounded-md border border-transparent transition-all
                                      duration-200 cursor-pointer active:scale-95
                                      ${
                                        user?.isEmailVerified
                                          ? 'text-black hover:bg-gray-50 hover:border-gray-300'
                                          : 'text-gray-400 hover:text-black hover:bg-gray-50 hover:border-gray-300'
                                      }`}
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
                              d="M3 8l7.89 5.26a2 2 0
                                 002.22 0L21 8M5 19h14a2
                                 2 0 002-2V7a2 2 0
                                 00-2-2H5a2 2 0 00-2
                                 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </button>

                        {/* Toggle Status */}
                        <button
                          onClick={() =>
                            handleToggleStatus(user._id)
                          }
                          title={
                            user?.isActive
                              ? 'Deactivate User'
                              : 'Activate User'
                          }
                          className={`p-2 rounded-md border border-transparent transition-all
                                      duration-200 cursor-pointer active:scale-95
                                      ${
                                        user?.isActive
                                          ? 'text-gray-500 hover:text-black hover:bg-gray-50 hover:border-gray-300'
                                          : 'text-gray-400 hover:text-black hover:bg-gray-50 hover:border-gray-300'
                                      }`}
                        >
                          {user?.isActive ? (
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
                                d="M13 7a4 4 0 11-8 0 4 4 0
                                   018 0zM9 14a6 6 0 00-6
                                   6v1h12v-1a6 6 0
                                   00-6-6zM21 12h-6"
                              />
                            </svg>
                          ) : (
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
                                d="M18 9v3m0 0v3m0-3h3m-3
                                   0h-3m-2-5a4 4 0 11-8
                                   0 4 4 0 018 0zM3
                                   20a6 6 0 0112 0v1H3v-1z"
                              />
                            </svg>
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(user);
                          }}
                          title="Delete User"
                          className="p-2 rounded-md border border-transparent text-gray-400
                                     hover:text-black hover:bg-black hover:text-white
                                     hover:border-black transition-all duration-200
                                     cursor-pointer active:scale-95"
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {pagination.totalPages > 1 && (
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-4
                          px-6 py-4 border-t border-gray-200"
            >
              <p className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-semibold text-black">
                  {(pagination.currentPage - 1) * pagination.limit +
                    1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-black">
                  {Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.total
                  )}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-black">
                  {pagination.total}
                </span>{' '}
                results
              </p>

              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      currentPage: p.currentPage - 1,
                    }))
                  }
                  disabled={pagination.currentPage === 1}
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {pages().map((item, idx) =>
                  item.type === 'dots' ? (
                    <span
                      key={`dots-${idx}`}
                      className="px-3 py-1.5 text-sm text-gray-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item.value}
                      onClick={() =>
                        setPagination((p) => ({
                          ...p,
                          currentPage: item.value,
                        }))
                      }
                      className={`min-w-[36px] h-9 rounded-md text-sm font-medium
                                  transition-all duration-200 cursor-pointer active:scale-95
                                  ${
                                    item.value ===
                                    pagination.currentPage
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
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      currentPage: p.currentPage + 1,
                    }))
                  }
                  disabled={
                    pagination.currentPage === pagination.totalPages
                  }
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Delete Modal ── */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteUser}
        loading={deleteModal.loading}
        title="Delete User"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-black">
              "{deleteModal.userName}"
            </span>
            ? This action cannot be undone and all user data will be
            permanently removed.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* ── Role Change Modal ── */}
      {roleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={!roleModal.loading ? closeRoleModal : undefined}
          />

          {/* Modal */}
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md
                        border border-gray-200 animate-scaleIn"
          >
            {/* Close */}
            <button
              onClick={closeRoleModal}
              disabled={roleModal.loading}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                         rounded-full text-gray-400 hover:text-black hover:bg-gray-100
                         transition-all duration-200 cursor-pointer disabled:opacity-50
                         disabled:cursor-not-allowed"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="p-6 pt-8 text-center">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955
                       11.955 0 0112 2.944a11.955
                       11.955 0 01-8.618 3.04A12.02
                       12.02 0 003 9c0 5.591 3.824
                       10.29 9 11.622 5.176-1.332
                       9-6.03 9-11.622
                       0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>

              <h3 className="mt-4 text-lg font-bold text-black">
                Change User Role
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Update role for{' '}
                <span className="font-semibold text-black">
                  {getFullName(roleModal.user)}
                </span>
              </p>
            </div>

            {/* Role selector */}
            <div className="px-6 pb-2">
              <div className="space-y-2">
                {['customer', 'admin', 'superadmin'].map((role) => (
                  <label
                    key={role}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer
                                transition-all duration-200
                                ${
                                  roleModal.selectedRole === role
                                    ? 'border-black bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-400'
                                }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={roleModal.selectedRole === role}
                      onChange={(e) =>
                        setRoleModal((prev) => ({
                          ...prev,
                          selectedRole: e.target.value,
                        }))
                      }
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-semibold text-black">
                        {roleLabel(role)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {role === 'customer' &&
                          'Standard user with basic access'}
                        {role === 'admin' &&
                          'Can manage content and users'}
                        {role === 'superadmin' &&
                          'Full system access and control'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-4">
              <button
                onClick={closeRoleModal}
                disabled={roleModal.loading}
                className="flex-1 py-2.5 px-4 bg-white text-black border-2 border-gray-300
                           rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-50
                           hover:border-black transition-all duration-200 active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={roleModal.loading}
                className="flex-1 py-2.5 px-4 bg-black text-white border-2 border-black
                           rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-800
                           transition-all duration-200 active:scale-[0.98]
                           disabled:opacity-70 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {roleModal.loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Updating...
                  </>
                ) : (
                  'Update Role'
                )}
              </button>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .animate-fadeIn {
              animation: fadeIn 0.2s ease-out forwards;
            }
            .animate-scaleIn {
              animation: scaleIn 0.2s ease-out forwards;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Users;