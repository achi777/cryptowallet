import React, { useState, useEffect } from 'react';
import { Wallet, PageResponse, CryptoCurrency } from '../../types';
import { adminDashboardApi } from '../../services/adminApi';

const WalletManagement: React.FC = () => {
  const [wallets, setWallets] = useState<PageResponse<Wallet>>({
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
  const [currencyFilter, setCurrencyFilter] = useState<CryptoCurrency | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    loadWallets();
  }, [currentPage, pageSize, sortBy, sortDir, currencyFilter, activeFilter]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      let walletResponse: PageResponse<Wallet>;
      
      if (searchQuery.trim()) {
        walletResponse = await adminDashboardApi.searchWallets(searchQuery, currentPage, pageSize, sortBy, sortDir);
      } else {
        walletResponse = await adminDashboardApi.getAllWallets(
          currentPage, 
          pageSize, 
          sortBy, 
          sortDir, 
          currencyFilter, 
          activeFilter
        );
      }
      
      setWallets(walletResponse);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadWallets();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(0);
    loadWallets();
  };

  const handleToggleWalletStatus = async (walletId: number) => {
    try {
      await adminDashboardApi.toggleWalletStatus(walletId);
      loadWallets(); // Refresh the list
    } catch (error) {
      console.error('Failed to toggle wallet status:', error);
      alert('Failed to update wallet status');
    }
  };

  const handleRefreshBalance = async (walletId: number) => {
    try {
      await adminDashboardApi.refreshWalletBalance(walletId);
      loadWallets(); // Refresh the list
      alert('Wallet balance refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh wallet balance:', error);
      alert('Failed to refresh wallet balance');
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

  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  const getCurrencyIcon = (currency: CryptoCurrency) => {
    switch (currency) {
      case CryptoCurrency.BITCOIN:
        return '₿';
      case CryptoCurrency.USDT_TRC20:
        return '💵';
      default:
        return '💰';
    }
  };

  const getCurrencySymbol = (currency: CryptoCurrency) => {
    switch (currency) {
      case CryptoCurrency.BITCOIN:
        return 'BTC';
      case CryptoCurrency.USDT_TRC20:
        return 'USDT';
      default:
        return currency;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">💼 Wallet Management</h2>
        <div className="text-sm text-muted">
          Total: {wallets.totalElements} wallets
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium mb-1">Search Wallets</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by address or user..."
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
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select
              value={currencyFilter || 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setCurrencyFilter(value === 'all' ? undefined : value as CryptoCurrency);
                setCurrentPage(0);
              }}
              className="form-input"
            >
              <option value="all">All Currencies</option>
              <option value={CryptoCurrency.BITCOIN}>Bitcoin (BTC)</option>
              <option value={CryptoCurrency.USDT_TRC20}>USDT (TRC-20)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
              onChange={(e) => {
                const value = e.target.value;
                setActiveFilter(value === 'all' ? undefined : value === 'active');
                setCurrentPage(0);
              }}
              className="form-input"
            >
              <option value="all">All Wallets</option>
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

      {/* Wallets Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">🔄 Loading wallets...</div>
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
                    <th className="text-left py-3 px-4">Address</th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('currency')}>
                      Currency {getSortIcon('currency')}
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('balance')}>
                      Balance {getSortIcon('balance')}
                    </th>
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('active')}>
                      Status {getSortIcon('active')}
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('createdAt')}>
                      Created {getSortIcon('createdAt')}
                    </th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.content.map((wallet) => (
                    <tr key={wallet.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono">{wallet.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm" title={wallet.address}>
                          {formatAddress(wallet.address)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCurrencyIcon(wallet.currency)}</span>
                          <span className="font-medium">{getCurrencySymbol(wallet.currency)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono">
                          {wallet.balance.toFixed(wallet.currency === CryptoCurrency.BITCOIN ? 8 : 2)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>ID: {/* wallet.user?.id || 'N/A' */}</div>
                          <div className="text-muted">{/* wallet.user?.username || 'N/A' */}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          wallet.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {wallet.active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{formatDate(wallet.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRefreshBalance(wallet.id)}
                            className="btn btn-primary btn-small"
                            title="Refresh balance"
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => handleToggleWalletStatus(wallet.id)}
                            className={`btn btn-small ${wallet.active ? 'btn-warning' : 'btn-success'}`}
                            title={wallet.active ? 'Deactivate wallet' : 'Activate wallet'}
                          >
                            {wallet.active ? '🚫' : '✅'}
                          </button>
                          <button
                            className="btn btn-secondary btn-small"
                            title="View details"
                            onClick={() => alert(`Wallet details for ${wallet.address} - Feature coming soon!`)}
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

            {wallets.content.length === 0 && !loading && (
              <div className="text-center py-8 text-muted">
                {searchQuery ? 'No wallets found matching your search.' : 'No wallets found.'}
              </div>
            )}

            {/* Pagination */}
            {wallets.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm text-muted">
                  Showing {wallets.number * wallets.size + 1} to {Math.min((wallets.number + 1) * wallets.size, wallets.totalElements)} of {wallets.totalElements} wallets
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(wallets.number - 1)}
                    disabled={wallets.first}
                    className="btn btn-secondary btn-small"
                  >
                    ← Previous
                  </button>
                  
                  {[...Array(Math.min(5, wallets.totalPages))].map((_, index) => {
                    const pageNum = Math.max(0, Math.min(wallets.number - 2, wallets.totalPages - 5)) + index;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`btn btn-small ${wallets.number === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(wallets.number + 1)}
                    disabled={wallets.last}
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

export default WalletManagement;