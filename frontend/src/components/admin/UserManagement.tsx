import React, { useState, useEffect } from 'react';
import { User, PageResponse } from '../../types';
import { adminDashboardApi } from '../../services/adminApi';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<PageResponse<User>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<string>('desc');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, sortBy, sortDir, activeFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let userResponse: PageResponse<User>;
      
      if (searchQuery.trim()) {
        userResponse = await adminDashboardApi.searchUsers(searchQuery, currentPage, pageSize, sortBy, sortDir);
      } else {
        userResponse = await adminDashboardApi.getAllUsers(currentPage, pageSize, sortBy, sortDir, activeFilter);
      }
      
      setUsers(userResponse);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadUsers();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(0);
    loadUsers();
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      await adminDashboardApi.toggleUserStatus(userId);
      loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status');
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">👥 User Management</h2>
        <div className="text-sm text-muted">
          Total: {users.totalElements} users
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium mb-1">Search Users</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="form-input flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="btn btn-primary">
                🔍 Search
              </button>
              {searchQuery && (
                <button onClick={handleClearSearch} className="btn btn-secondary">
                  ✖️ Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status Filter</label>
            <select
              value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
              onChange={(e) => {
                const value = e.target.value;
                setActiveFilter(value === 'all' ? undefined : value === 'active');
                setCurrentPage(0);
              }}
              className="form-input"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Page Size</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
              className="form-input"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">🔄 Loading users...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('id')}>
                      ID {getSortIcon('id')}
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('username')}>
                      Username {getSortIcon('username')}
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('email')}>
                      Email {getSortIcon('email')}
                    </th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('active')}>
                      Status {getSortIcon('active')}
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('createdAt')}>
                      Registered {getSortIcon('createdAt')}
                    </th>
                    <th className="text-left py-3 px-4">Wallets</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.content.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono">{user.id}</td>
                      <td className="py-3 px-4 font-medium">{user.username}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{user.firstName} {user.lastName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted">
                          {user.wallets?.length || 0} wallets
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`btn btn-small ${user.active ? 'btn-warning' : 'btn-success'}`}
                            title={user.active ? 'Deactivate user' : 'Activate user'}
                          >
                            {user.active ? '🚫' : '✅'}
                          </button>
                          <button
                            className="btn btn-secondary btn-small"
                            title="View details"
                            onClick={() => alert(`User details for ${user.username} - Feature coming soon!`)}
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.content.length === 0 && !loading && (
              <div className="text-center py-8 text-muted">
                {searchQuery ? 'No users found matching your search.' : 'No users found.'}
              </div>
            )}

            {/* Pagination */}
            {users.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm text-muted">
                  Showing {users.number * users.size + 1} to {Math.min((users.number + 1) * users.size, users.totalElements)} of {users.totalElements} users
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(users.number - 1)}
                    disabled={users.first}
                    className="btn btn-secondary btn-small"
                  >
                    ← Previous
                  </button>
                  
                  {[...Array(Math.min(5, users.totalPages))].map((_, index) => {
                    const pageNum = Math.max(0, Math.min(users.number - 2, users.totalPages - 5)) + index;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`btn btn-small ${users.number === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(users.number + 1)}
                    disabled={users.last}
                    className="btn btn-secondary btn-small"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;